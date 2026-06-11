# run_deploy_pipeline.py

import os
import json
import numpy as np
import pandas as pd

from team_mapping import TEAMS
from db_manager import init_db, save_teams, save_sim_results, save_predictions, save_elo_history
from run_pipeline import generate_group_matches, generate_key_factors_and_explanation
from simulator import TournamentSimulator

def run_deploy_pipeline():
    print("Starting lightweight deployment database initialization...")
    
    # 1. Initialize database
    init_db()
    print("Database tables initialized.")
    
    # 2. Path to pre-trained models
    models_path = os.path.join(os.path.dirname(__file__), "models", "forecasting_models.pkl")
    if not os.path.exists(models_path):
        raise FileNotFoundError(f"Pre-trained models file not found at {models_path}!")
        
    # 3. Load pre-trained models
    sim = TournamentSimulator(models_path=models_path)
    if not sim.load_models():
        raise RuntimeError("Failed to load pre-trained models.")
        
    # 4. Run Simulations (10,000 runs is fast and accurate using pre-trained models)
    print("Running 10,000 tournament simulations...")
    sim_results_df = sim.run_multi_simulations(n_simulations=10000)
    save_sim_results(sim_results_df.to_dict(orient="records"))
    print("Tournament simulation results saved to database.")
    
    # 5. Predict all World Cup 2026 group stage matches
    group_matches = generate_group_matches()
    predictions = []
    
    print("Predicting group stage matches...")
    for idx, match in enumerate(group_matches):
        h_team = match["home_team"]
        a_team = match["away_team"]
        
        # Check host advantages
        is_neutral = True
        if h_team in ["United States", "Mexico", "Canada"] or a_team in ["United States", "Mexico", "Canada"]:
            is_neutral = False
            
        # Predict outcome
        pred = sim.predict_match(h_team, a_team, is_neutral=is_neutral)
        probs = pred["probs"]  # [home_win, draw, away_win]
        
        # Determine ensembled outcome using a 15% win-probability margin for draws
        diff = abs(probs[0] - probs[2])
        if diff < 0.15:
            outcome_idx = 1 # Draw
        elif probs[0] > probs[2]:
            outcome_idx = 0 # Home Win
        else:
            outcome_idx = 2 # Away Win
            
        # Filter Dixon-Coles score matrix to be consistent with the ensembled outcome
        matrix = np.array(pred["score_matrix"])
        max_goals = len(matrix) - 1
        masked_matrix = matrix.copy()
        
        if outcome_idx == 0: # Home Win
            for x in range(max_goals + 1):
                for y in range(max_goals + 1):
                    if x <= y:
                        masked_matrix[x, y] = 0.0
        elif outcome_idx == 1: # Draw
            for x in range(max_goals + 1):
                for y in range(max_goals + 1):
                    if x != y:
                        masked_matrix[x, y] = 0.0
        else: # Away Win
            for x in range(max_goals + 1):
                for y in range(max_goals + 1):
                    if x >= y:
                        masked_matrix[x, y] = 0.0
                        
        flat_idx = np.argmax(masked_matrix)
        h_goals = int(flat_idx // (max_goals + 1))
        a_goals = int(flat_idx % (max_goals + 1))
        
        # Determine confidence: difference between highest outcome prob and second highest
        sorted_probs = sorted(probs, reverse=True)
        confidence = float(sorted_probs[0] - sorted_probs[1])
        
        # Generate factors and explanations
        factors, explanation = generate_key_factors_and_explanation(
            h_team, a_team, probs[0], probs[1], probs[2], h_goals, a_goals, sim.elo_engine, sim.dixon_coles
        )
        
        predictions.append({
            "match_id": match["match_id"],
            "stage": match["stage"],
            "date": match["date"],
            "home_team": h_team,
            "away_team": a_team,
            "home_win_prob": round(float(probs[0] * 100), 1),
            "draw_prob": round(float(probs[1] * 100), 1),
            "away_win_prob": round(float(probs[2] * 100), 1),
            "pred_home_score": h_goals,
            "pred_away_score": a_goals,
            "confidence": round(float(confidence * 100), 1),
            "key_factors": factors,
            "explanation": explanation
        })
        
    save_predictions(predictions)
    print("Predictions for all 72 group matches saved to DB.")
    
    # 6. Save final team ratings
    teams_db_data = []
    for team, details in TEAMS.items():
        elo, off, def_val = sim.elo_engine.get_ratings(team)
        overall_rating = (elo + off + def_val) / 3.0
        teams_db_data.append({
            "name": team,
            "code": details["code"],
            "group_name": details["group"],
            "flag": f"https://flagcdn.com/w40/{details['flag']}.png",
            "elo": round(float(elo), 1),
            "off_rating": round(float(off), 1),
            "def_rating": round(float(def_val), 1),
            "overall_rating": round(float(overall_rating), 1)
        })
        
    save_teams(teams_db_data)
    print("Team profiles and strengths saved to DB.")
    
    # 7. Save Elo histories for evolution graphs
    evolution_history = sim.elo_engine.get_elo_evolution(list(TEAMS.keys()), start_date='2014-01-01')
    flat_history = []
    for team, history_list in evolution_history.items():
        for pt in history_list:
            flat_history.append({
                "team": team,
                "date": pt["date"],
                "elo": pt["elo"],
                "off": pt["off"],
                "def": pt["def"]
            })
            
    save_elo_history(flat_history)
    print("Elo evolution histories saved to DB.")
    print("Deployment pipeline run complete! Local database successfully populated.")

if __name__ == "__main__":
    run_deploy_pipeline()
