import os
import numpy as np
from simulator import TournamentSimulator
from run_pipeline import generate_group_matches, generate_key_factors_and_explanation
from db_manager import save_predictions

def update_db_predictions():
    models_path = os.path.join(os.path.dirname(__file__), "models", "forecasting_models.pkl")
    sim = TournamentSimulator(models_path=models_path)
    if not sim.load_models():
        print("Error: Could not load forecasting models.")
        return
        
    group_matches = generate_group_matches()
    predictions = []
    
    print("Re-calculating predictions for all 72 group matches...")
    for idx, match in enumerate(group_matches):
        h_team = match["home_team"]
        a_team = match["away_team"]
        
        is_neutral = True
        if h_team in ["United States", "Mexico", "Canada"] or a_team in ["United States", "Mexico", "Canada"]:
            is_neutral = False
            
        pred = sim.predict_match(h_team, a_team, is_neutral=is_neutral)
        probs = pred["probs"] # [home_win, draw, away_win]
        
        # Consistent scoreline selection with 15% draw threshold
        diff = abs(probs[0] - probs[2])
        if diff < 0.15:
            outcome_idx = 1
        elif probs[0] > probs[2]:
            outcome_idx = 0
        else:
            outcome_idx = 2
            
        matrix = np.array(pred["score_matrix"])
        max_goals = len(matrix) - 1
        masked_matrix = matrix.copy()
        
        if outcome_idx == 0:
            for x in range(max_goals + 1):
                for y in range(max_goals + 1):
                    if x <= y:
                        masked_matrix[x, y] = 0.0
        elif outcome_idx == 1:
            for x in range(max_goals + 1):
                for y in range(max_goals + 1):
                    if x != y:
                        masked_matrix[x, y] = 0.0
        else:
            for x in range(max_goals + 1):
                for y in range(max_goals + 1):
                    if x >= y:
                        masked_matrix[x, y] = 0.0
                        
        flat_idx = np.argmax(masked_matrix)
        h_goals = int(flat_idx // (max_goals + 1))
        a_goals = int(flat_idx % (max_goals + 1))
        
        sorted_probs = sorted(probs, reverse=True)
        confidence = float(sorted_probs[0] - sorted_probs[1])
        
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
    print("Database updated! Group stage match predictions now support realistic draws.")

if __name__ == "__main__":
    update_db_predictions()
