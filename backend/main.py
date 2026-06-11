# main.py

import os
import pickle
import json
from typing import Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db_manager import get_teams_from_db, get_predictions_from_db, get_match_from_db, get_analytics_data_from_db, get_player_predictions_from_db
from team_mapping import TEAMS
from simulator import TournamentSimulator

app = FastAPI(
    title="FIFA World Cup 2026 AI Forecasting API",
    description="Backend API serving ensembled match predictions and Monte Carlo tournament simulations.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the Next.js port (e.g. http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_PATH = os.path.join(os.path.dirname(__file__), "models", "forecasting_models.pkl")

# Cache simulator instance
_simulator = None

def get_simulator():
    global _simulator
    if _simulator is None:
        _simulator = TournamentSimulator(models_path=MODELS_PATH)
        if not _simulator.load_models():
            print("Warning: Forecasting models are not trained or loaded yet.")
    return _simulator

class CustomSimRequest(BaseModel):
    boosts: Dict[str, float]  # team_name -> Elo boost (e.g. +50, -100)

@app.get("/")
def read_root():
    return {"status": "online", "message": "FIFA World Cup 2026 AI Forecasting API is active."}

@app.get("/api/teams")
def get_teams():
    try:
        teams = get_teams_from_db()
        if not teams:
            raise HTTPException(status_code=404, detail="No team data found in database. Run pipeline first.")
        return teams
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predictions")
def get_predictions():
    try:
        predictions = get_predictions_from_db()
        if not predictions:
            raise HTTPException(status_code=404, detail="No predictions found in database. Run pipeline first.")
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/match/{match_id}")
def get_match(match_id: str):
    try:
        match = get_match_from_db(match_id)
        if not match:
            raise HTTPException(status_code=404, detail=f"Match {match_id} not found.")
            
        # Enrich match with Dixon-Coles xG proxies and detailed probability matrix
        sim = get_simulator()
        if sim.loaded:
            h_team = match["home_team"]
            a_team = match["away_team"]
            is_neutral = True
            if h_team in ["United States", "Mexico", "Canada"] or a_team in ["United States", "Mexico", "Canada"]:
                is_neutral = False
                
            pred_details = sim.predict_match(h_team, a_team, is_neutral=is_neutral)
            match["expected_goals_home"] = round(pred_details["expected_goals_home"], 2)
            match["expected_goals_away"] = round(pred_details["expected_goals_away"], 2)
            match["score_matrix"] = pred_details["score_matrix"]
            
            # Feature Importance
            match["feature_importances"] = sim.ensemble_weights
            
        return match
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics")
def get_analytics():
    try:
        analytics = get_analytics_data_from_db()
        
        # Add feature importance from trained artifacts
        sim = get_simulator()
        feature_importances = {}
        if sim.loaded:
            # Load feature importances from pickled model
            with open(MODELS_PATH, "rb") as f:
                artifacts = pickle.load(f)
                feature_importances = artifacts.get("feature_importances", {})
                metrics_summary = artifacts.get("metrics_summary", {})
                
        analytics["feature_importances"] = feature_importances
        analytics["model_metrics"] = metrics_summary
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/player-predictions")
def get_player_predictions():
    try:
        players = get_player_predictions_from_db()
        if not players:
            raise HTTPException(status_code=404, detail="No player predictions found in database. Run pipeline first.")
        return players
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulate-custom")
def simulate_custom(req: CustomSimRequest):
    try:
        sim = get_simulator()
        if not sim.loaded:
            raise HTTPException(status_code=503, detail="Forecasting engine is not loaded.")
            
        # Back up original ratings
        backup_ratings = {}
        backup_off = {}
        backup_def = {}
        
        # Apply boosts temporarily
        for team, boost in req.boosts.items():
            if team in sim.elo_engine.ratings:
                backup_ratings[team] = sim.elo_engine.ratings[team]
                backup_off[team] = sim.elo_engine.off_ratings[team]
                backup_def[team] = sim.elo_engine.def_ratings[team]
                
                sim.elo_engine.ratings[team] += boost
                sim.elo_engine.off_ratings[team] += (boost * 0.5)  # Boost offense/defense slightly
                sim.elo_engine.def_ratings[team] += (boost * 0.5)
                
        # Clear matchup cache since ratings changed!
        sim.match_cache.clear()
        
        # Run a smaller number of simulations for interactive speed (e.g., 1000)
        n_sim = 1000
        stats = {t: {"group_qual": 0, "r32": 0, "r16": 0, "qf": 0, "sf": 0, "final": 0, "win": 0} for t in TEAMS}
        
        # Also run one single simulation to return as a sample bracket layout
        sample_bracket = None
        
        for i in range(n_sim):
            res = sim.run_simulation()
            
            # Save the first simulation as our interactive bracket layout
            if i == 0:
                sample_bracket = res
                
            stats[res["champion"]]["win"] += 1
            stats[res["champion"]]["final"] += 1
            stats[res["runner_up"]]["final"] += 1
            for t in res["semis"]:
                stats[t]["sf"] += 1
            for t in res["quarters"]:
                stats[t]["qf"] += 1
            for t in res["r16"]:
                stats[t]["r16"] += 1
            for t in res["r32"]:
                stats[t]["r32"] += 1
            for t in res["group_qualifiers"]:
                stats[t]["group_qual"] += 1
                
        # Format results
        custom_odds = []
        for team, counts in stats.items():
            custom_odds.append({
                "team": team,
                "group_qual_pct": round(counts["group_qual"] / n_sim * 100, 2),
                "r32_pct": round(counts["r32"] / n_sim * 100, 2),
                "r16_pct": round(counts["r16"] / n_sim * 100, 2),
                "qf_pct": round(counts["qf"] / n_sim * 100, 2),
                "sf_pct": round(counts["sf"] / n_sim * 100, 2),
                "final_pct": round(counts["final"] / n_sim * 100, 2),
                "win_pct": round(counts["win"] / n_sim * 100, 2)
            })
            
        custom_odds = sorted(custom_odds, key=lambda x: x["win_pct"], reverse=True)
        
        # Restore original ratings
        for team in backup_ratings:
            sim.elo_engine.ratings[team] = backup_ratings[team]
            sim.elo_engine.off_ratings[team] = backup_off[team]
            sim.elo_engine.def_ratings[team] = backup_def[team]
            
        # Clear cache again
        sim.match_cache.clear()
        
        return {
            "custom_odds": custom_odds,
            "sample_bracket": sample_bracket
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
