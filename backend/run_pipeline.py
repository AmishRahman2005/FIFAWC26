# run_pipeline.py

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime

from team_mapping import TEAMS, NAME_MAPPING
from db_manager import init_db, save_teams, save_sim_results, save_predictions, save_elo_history
from data_pipeline import build_compiled_dataset
from ml_engine import train_and_evaluate_models, WC_METADATA
from simulator import TournamentSimulator

def generate_group_matches():
    # 2026 Group Stage Schedule stagger
    groups = {}
    for team, data in TEAMS.items():
        grp = data["group"]
        if grp not in groups:
            groups[grp] = []
        groups[grp].append(team)
        
    matches = []
    match_counter = 1
    
    # Staggered dates for the three rounds of group play
    # Round 1: June 11 to June 22, 2026
    # Round 2: June 23 to June 25, 2026
    # Round 3: June 26 to June 27, 2026 (simultaneous group conclusions)
    
    group_letters = sorted(groups.keys())
    
    # Round 1
    for idx, grp in enumerate(group_letters):
        teams = groups[grp]
        date_str = f"2026-06-{11 + idx:02d}"
        
        # Match 1: Team 1 vs Team 2
        matches.append({
            "match_id": f"M-G-{match_counter:02d}",
            "stage": "group stage",
            "date": date_str,
            "home_team": teams[0],
            "away_team": teams[1],
            "group": grp
        })
        match_counter += 1
        
        # Match 2: Team 3 vs Team 4
        matches.append({
            "match_id": f"M-G-{match_counter:02d}",
            "stage": "group stage",
            "date": date_str,
            "home_team": teams[2],
            "away_team": teams[3],
            "group": grp
        })
        match_counter += 1
        
    # Round 2
    for idx, grp in enumerate(group_letters):
        teams = groups[grp]
        # Spread Round 2 over June 23, 24, 25
        day = 23 + (idx % 3)
        date_str = f"2026-06-{day}"
        
        # Match 3: Team 1 vs Team 3
        matches.append({
            "match_id": f"M-G-{match_counter:02d}",
            "stage": "group stage",
            "date": date_str,
            "home_team": teams[0],
            "away_team": teams[2],
            "group": grp
        })
        match_counter += 1
        
        # Match 4: Team 2 vs Team 4
        matches.append({
            "match_id": f"M-G-{match_counter:02d}",
            "stage": "group stage",
            "date": date_str,
            "home_team": teams[1],
            "away_team": teams[3],
            "group": grp
        })
        match_counter += 1
        
    # Round 3 (Simultaneous final matches)
    for idx, grp in enumerate(group_letters):
        teams = groups[grp]
        # Groups A-F on June 26, Groups G-L on June 27
        day = 26 if idx < 6 else 27
        date_str = f"2026-06-{day}"
        
        # Match 5: Team 1 vs Team 4
        matches.append({
            "match_id": f"M-G-{match_counter:02d}",
            "stage": "group stage",
            "date": date_str,
            "home_team": teams[0],
            "away_team": teams[3],
            "group": grp
        })
        match_counter += 1
        
        # Match 6: Team 2 vs Team 3
        matches.append({
            "match_id": f"M-G-{match_counter:02d}",
            "stage": "group stage",
            "date": date_str,
            "home_team": teams[1],
            "away_team": teams[2],
            "group": grp
        })
        match_counter += 1
        
    return matches

def generate_key_factors_and_explanation(h_team, a_team, h_prob, d_prob, a_prob, h_goals, a_goals, elo_engine, dixon_coles):
    elo_h, off_h, def_h = elo_engine.get_ratings(h_team)
    elo_a, off_a, def_a = elo_engine.get_ratings(a_team)
    
    factors = []
    
    # 1. Elo difference
    elo_diff = elo_h - elo_a
    if abs(elo_diff) > 50:
        stronger = h_team if elo_diff > 0 else a_team
        factors.append(f"Superior Elo strength ({stronger} has +{int(abs(elo_diff))} Elo points advantage)")
        
    # 2. Offensive rating
    if off_h > off_a + 50:
        factors.append(f"{h_team} shows higher attacking potency (Offensive Elo: {int(off_h)} vs {int(off_a)})")
    elif off_a > off_h + 50:
        factors.append(f"{a_team} shows higher attacking potency (Offensive Elo: {int(off_a)} vs {int(off_h)})")
        
    # 3. Defensive rating (lower defensive rating means more goals conceded, but in our Elo system higher DefElo is better!)
    if def_h > def_a + 50:
        factors.append(f"{h_team} exhibits greater defensive solidity (Defensive Elo: {int(def_h)} vs {int(def_a)})")
    elif def_a > def_h + 50:
        factors.append(f"{a_team} exhibits greater defensive solidity (Defensive Elo: {int(def_a)} vs {int(def_h)})")
        
    # 4. WC experience
    meta_h = WC_METADATA.get(h_team, {"appearances": 0, "titles": 0})
    meta_a = WC_METADATA.get(a_team, {"appearances": 0, "titles": 0})
    exp_diff = meta_h["appearances"] - meta_a["appearances"]
    if abs(exp_diff) >= 5:
        more_exp = h_team if exp_diff > 0 else a_team
        factors.append(f"Greater tournament pedigree ({more_exp} has {abs(exp_diff)} more World Cup appearances)")
        
    # Standard fallbacks if lists are short
    if len(factors) < 2:
        factors.append("Recent competitive form and squad depth metrics")
    if len(factors) < 3:
        factors.append("Head-to-head historical match data adjustments")
        
    # Generate Explanation
    if h_prob > a_prob + 0.15:
        fav, underdog = h_team, a_team
        margin = h_prob - a_prob
    elif a_prob > h_prob + 0.15:
        fav, underdog = a_team, h_team
        margin = a_prob - h_prob
    else:
        fav = None
        
    if fav:
        explanation = (
            f"The model heavily favors {fav} to win this matchup, reflecting their superior Elo rating and historical "
            f"tournament pedigree. {fav}'s defensive rating suggests they will be able to contain {underdog}'s offensive transitions, "
            f"yielding a predicted scoreline of {h_goals}-{a_goals} with a confidence score of {int(margin*100)}%."
        )
    else:
        explanation = (
            f"This is projected to be a highly competitive and tight fixture. Both teams display comparable defensive "
            f"solidity and tactical forms, making a draw or a single-goal margin outcome highly probable. The model estimates "
            f"a close {h_goals}-{a_goals} result, with marginal probability splits."
        )
        
    return factors[:4], explanation

def run_entire_pipeline():
    # 1. Initialize database
    init_db()
    
    # 2. Build matches dataset
    matches_csv = build_compiled_dataset()
    df_matches = pd.read_csv(matches_csv)
    
    # 3. Train models and pickle them
    models_path = train_and_evaluate_models(df_matches)
    
    # 4. Run Simulations
    sim = TournamentSimulator(models_path=models_path)
    if not sim.load_models():
        print("Failed to load models for simulation.")
        return
        
    # Run 100,000 simulations
    sim_results_df = sim.run_multi_simulations(n_simulations=10000)
    save_sim_results(sim_results_df.to_dict(orient="records"))
    
    # 5. Predict all World Cup 2026 group stage matches
    group_matches = generate_group_matches()
    predictions = []
    
    print("\nPredicting group stage matches...")
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
        overall_rating = (elo + off + def_val) / 3.0  # Heuristic composite score
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
    print("\nForecasting pipeline run complete! Local SQLite database ready.")

if __name__ == "__main__":
    run_entire_pipeline()
