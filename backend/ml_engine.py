# ml_engine.py

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, log_loss, roc_auc_score
from scipy.optimize import minimize

from team_mapping import TEAMS, standardize_team_name
from elo_engine import EloEngine
from dixon_coles import DixonColes

# Continental strengths
CONTINENT_MAP = {
    "UEFA": 1.0,
    "CONMEBOL": 1.0,
    "CAF": 0.65,
    "AFC": 0.55,
    "CONCACAF": 0.55,
    "OFC": 0.25
}

TEAM_CONTINENT = {}
for name, data in TEAMS.items():
    code = data["code"]
    # Quick heuristic matching for continents
    if name in ["Brazil", "Colombia", "Ecuador", "Paraguay", "Uruguay", "Argentina"]:
        TEAM_CONTINENT[name] = "CONMEBOL"
    elif name in ["Mexico", "Canada", "Haiti", "United States", "Curaçao", "Panama"]:
        TEAM_CONTINENT[name] = "CONCACAF"
    elif name in ["South Africa", "Morocco", "Ivory Coast", "Tunisia", "Egypt", "Cape Verde", "Senegal", "Algeria", "DR Congo", "Ghana"]:
        TEAM_CONTINENT[name] = "CAF"
    elif name in ["South Korea", "Qatar", "Australia", "Japan", "Iran", "Saudi Arabia", "Iraq", "Jordan", "Uzbekistan"]:
        TEAM_CONTINENT[name] = "AFC"
    elif name in ["New Zealand"]:
        TEAM_CONTINENT[name] = "OFC"
    else:
        TEAM_CONTINENT[name] = "UEFA"

# WC historical metadata (appearances, titles)
WC_METADATA = {
    "Argentina": {"appearances": 18, "titles": 3},
    "Brazil": {"appearances": 22, "titles": 5},
    "France": {"appearances": 16, "titles": 2},
    "Germany": {"appearances": 20, "titles": 4},
    "Uruguay": {"appearances": 14, "titles": 2},
    "England": {"appearances": 16, "titles": 1},
    "Spain": {"appearances": 16, "titles": 1},
    "Netherlands": {"appearances": 11, "titles": 0},
    "Croatia": {"appearances": 6, "titles": 0},
    "Belgium": {"appearances": 14, "titles": 0},
    "Mexico": {"appearances": 17, "titles": 0},
    "South Korea": {"appearances": 11, "titles": 0},
    "Switzerland": {"appearances": 12, "titles": 0},
    "Sweden": {"appearances": 12, "titles": 0},
    "United States": {"appearances": 11, "titles": 0},
    "Portugal": {"appearances": 8, "titles": 0},
    "Japan": {"appearances": 7, "titles": 0},
    "Colombia": {"appearances": 6, "titles": 0},
    "Morocco": {"appearances": 6, "titles": 0},
    "Paraguay": {"appearances": 8, "titles": 0},
    "Australia": {"appearances": 6, "titles": 0},
    "Saudi Arabia": {"appearances": 6, "titles": 0},
    "Tunisia": {"appearances": 6, "titles": 0},
    "Algeria": {"appearances": 4, "titles": 0},
    "Austria": {"appearances": 7, "titles": 0},
    "Senegal": {"appearances": 3, "titles": 0},
    "South Africa": {"appearances": 3, "titles": 0},
    "Ecuador": {"appearances": 4, "titles": 0},
    "Ghana": {"appearances": 4, "titles": 0},
    "Norway": {"appearances": 3, "titles": 0},
    "Scotland": {"appearances": 8, "titles": 0},
    "Haiti": {"appearances": 1, "titles": 0},
    "Curaçao": {"appearances": 0, "titles": 0},
    "Cape Verde": {"appearances": 0, "titles": 0},
    "Bosnia and Herzegovina": {"appearances": 1, "titles": 0},
    "Czechia": {"appearances": 9, "titles": 0}, # including Czechoslovakia
    "Qatar": {"appearances": 1, "titles": 0},
    "Türkiye": {"appearances": 2, "titles": 0},
    "Iraq": {"appearances": 1, "titles": 0},
    "Jordan": {"appearances": 0, "titles": 0},
    "Uzbekistan": {"appearances": 0, "titles": 0},
    "DR Congo": {"appearances": 1, "titles": 0}, # Zaire in 1974
    "Panama": {"appearances": 1, "titles": 0},
    "New Zealand": {"appearances": 2, "titles": 0},
    "Iran": {"appearances": 6, "titles": 0},
    "Egypt": {"appearances": 3, "titles": 0},
    "Ivory Coast": {"appearances": 3, "titles": 0},
    "Bosnia and Herzegovina": {"appearances": 1, "titles": 0}
}

class FeaturePipeline:
    def __init__(self):
        self.team_match_history = {}  # team -> list of match results (score_for, score_against, result_code)
        self.h2h_history = {}  # (team_a, team_b) -> list of results for team_a ('win', 'draw', 'loss', gd)
        
    def _get_form_metrics(self, team, n):
        history = self.team_match_history.get(team, [])
        if not history:
            return 0.0, 0.0, 0.0
        recent = history[-n:]
        actual_n = len(recent)
        goals_scored = sum(x[0] for x in recent) / actual_n
        goals_conceded = sum(x[1] for x in recent) / actual_n
        win_rate = sum(1.0 if x[2] == 'win' else (0.5 if x[2] == 'draw' else 0.0) for x in recent) / actual_n
        return goals_scored, goals_conceded, win_rate

    def _get_h2h_metrics(self, team_a, team_b):
        pair = tuple(sorted([team_a, team_b]))
        history = self.h2h_history.get(pair, [])
        if not history:
            return 0.5, 0.0, 0  # Default values
            
        win_count = 0.0
        total_gd = 0.0
        matches = len(history)
        
        for h_team, a_team, h_score, a_score in history:
            if h_team == team_a:
                total_gd += (h_score - a_score)
                if h_score > a_score:
                    win_count += 1.0
                elif h_score == a_score:
                    win_count += 0.5
            else:
                total_gd += (a_score - h_score)
                if a_score > h_score:
                    win_count += 1.0
                elif h_score == a_score:
                    win_count += 0.5
                    
        return win_count / matches, total_gd / matches, matches

    def update_histories(self, home_team, away_team, home_score, away_score):
        # Update team rolling match histories
        if home_team not in self.team_match_history:
            self.team_match_history[home_team] = []
        if away_team not in self.team_match_history:
            self.team_match_history[away_team] = []
            
        res_h = 'win' if home_score > away_score else ('draw' if home_score == away_score else 'loss')
        res_a = 'win' if away_score > home_score else ('draw' if home_score == away_score else 'loss')
        
        self.team_match_history[home_team].append((home_score, away_score, res_h))
        self.team_match_history[away_team].append((away_score, home_score, res_a))
        
        # Update H2H histories
        pair = tuple(sorted([home_team, away_team]))
        if pair not in self.h2h_history:
            self.h2h_history[pair] = []
        self.h2h_history[pair].append((home_team, away_team, home_score, away_score))

    def extract_features(self, matches_df, elo_engine, dixon_coles):
        features = []
        targets = []
        
        # Ensure chronological ordering
        df = matches_df.sort_values(by='date').reset_index(drop=True)
        
        print(f"Engineering features for {len(df)} matches...")
        
        for idx, row in df.iterrows():
            h_team = row['home_team']
            a_team = row['away_team']
            h_score = int(row['home_score'])
            a_score = int(row['away_score'])
            is_neutral = bool(row['neutral'])
            
            # 1. Elo features (from pre-match ratings)
            elo_h, off_h, def_h = elo_engine.get_ratings(h_team)
            elo_a, off_a, def_a = elo_engine.get_ratings(a_team)
            
            # 2. Dixon Coles expected goals features
            alpha_h, beta_h = dixon_coles.get_team_params(h_team)
            alpha_a, beta_a = dixon_coles.get_team_params(a_team)
            h_adv = 1.0 if is_neutral else dixon_coles.gamma
            dc_exp_h = alpha_h * beta_a * h_adv
            dc_exp_a = alpha_a * beta_h
            
            # 3. Form features
            f_sc_h_5, f_con_h_5, f_wr_h_5 = self._get_form_metrics(h_team, 5)
            f_sc_a_5, f_con_a_5, f_wr_a_5 = self._get_form_metrics(a_team, 5)
            
            f_sc_h_10, f_con_h_10, f_wr_h_10 = self._get_form_metrics(h_team, 10)
            f_sc_a_10, f_con_a_10, f_wr_a_10 = self._get_form_metrics(a_team, 10)
            
            f_sc_h_20, f_con_h_20, f_wr_h_20 = self._get_form_metrics(h_team, 20)
            f_sc_a_20, f_con_a_20, f_wr_a_20 = self._get_form_metrics(a_team, 20)
            
            # 4. H2H features
            h2h_win_rate, h2h_gd, h2h_count = self._get_h2h_metrics(h_team, a_team)
            
            # 5. Tournament/Host/Experience features
            cont_h = TEAM_CONTINENT.get(h_team, "UEFA")
            cont_a = TEAM_CONTINENT.get(a_team, "UEFA")
            cont_str_h = CONTINENT_MAP.get(cont_h, 0.8)
            cont_str_a = CONTINENT_MAP.get(cont_a, 0.8)
            
            wc_meta_h = WC_METADATA.get(h_team, {"appearances": 0, "titles": 0})
            wc_meta_a = WC_METADATA.get(a_team, {"appearances": 0, "titles": 0})
            
            # Assemble feature dictionary
            match_feat = {
                "elo_diff": elo_h - elo_a,
                "elo_home": elo_h,
                "elo_away": elo_a,
                "off_elo_diff": off_h - def_a,
                "def_elo_diff": def_h - off_a,
                "dc_exp_diff": dc_exp_h - dc_exp_a,
                "dc_exp_home": dc_exp_h,
                "dc_exp_away": dc_exp_a,
                "form_gd_diff_5": (f_sc_h_5 - f_con_h_5) - (f_sc_a_5 - f_con_a_5),
                "form_win_rate_diff_5": f_wr_h_5 - f_wr_a_5,
                "form_gd_diff_10": (f_sc_h_10 - f_con_h_10) - (f_sc_a_10 - f_con_a_10),
                "form_win_rate_diff_10": f_wr_h_10 - f_wr_a_10,
                "form_gd_diff_20": (f_sc_h_20 - f_con_h_20) - (f_sc_a_20 - f_con_a_20),
                "form_win_rate_diff_20": f_wr_h_20 - f_wr_a_20,
                "h2h_win_rate": h2h_win_rate,
                "h2h_gd": h2h_gd,
                "neutral": 1 if is_neutral else 0,
                "cont_strength_diff": cont_str_h - cont_str_a,
                "wc_appearances_diff": wc_meta_h["appearances"] - wc_meta_a["appearances"],
                "wc_titles_diff": wc_meta_h["titles"] - wc_meta_a["titles"]
            }
            
            features.append(match_feat)
            
            # Target variable: 0 = Draw, 1 = Home Win, 2 = Away Win (based on actual scores, ignoring shootouts for ML core model)
            if h_score > a_score:
                targets.append(1)
            elif a_score > h_score:
                targets.append(2)
            else:
                targets.append(0)
                
            # Update histories AFTER extracting features for this match (leak-free)
            self.update_histories(h_team, a_team, h_score, a_score)
            elo_engine.process_match(row)
            
        return pd.DataFrame(features), np.array(targets)

def train_and_evaluate_models(matches_df):
    # 1. Fit Elo engine on historical matches
    elo_engine = EloEngine()
    
    # 2. Fit Dixon-Coles on historical matches (using post-2012 matches to optimize fast)
    dixon_coles = DixonColes()
    dixon_coles.fit(matches_df, start_date='2012-01-01')
    
    # 3. Build features chronologically
    pipeline = FeaturePipeline()
    X, y = pipeline.extract_features(matches_df, elo_engine, dixon_coles)
    
    # Let's align features with dates
    dates = pd.to_datetime(matches_df.sort_values(by='date')['date']).values
    
    # 4. Train/Validation Split
    # We validate on matches after 2018-06-01 (includes 2018 and 2022 World Cup matches!)
    train_mask = dates < np.datetime64('2018-06-01')
    val_mask = dates >= np.datetime64('2018-06-01')
    
    X_train, y_train = X[train_mask], y[train_mask]
    X_val, y_val = X[val_mask], y[val_mask]
    
    print(f"\nTrain size: {len(X_train)}, Validation size: {len(X_val)}")
    
    # Import ML libraries inside function to prevent import crashes during background pip execution
    import xgboost as xgb
    import lightgbm as lgb
    import catboost as cb
    
    # Models dictionary
    models = {
        "LogisticRegression": LogisticRegression(max_iter=1000),
        "RandomForest": RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42),
        "GradientBoosting": GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42),
        "XGBoost": xgb.XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.05, eval_metric='mlogloss', random_state=42),
        "LightGBM": lgb.LGBMClassifier(n_estimators=100, max_depth=4, learning_rate=0.05, verbosity=-1, random_state=42),
        "CatBoost": cb.CatBoostClassifier(iterations=100, depth=4, learning_rate=0.05, verbose=0, random_state=42)
    }
    
    best_log_loss = float('inf')
    best_model_name = None
    best_model = None
    metrics_summary = {}
    
    # Evaluate models
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train, y_train)
        preds = model.predict(X_val)
        probs = model.predict_proba(X_val)
        
        acc = accuracy_score(y_val, preds)
        loss = log_loss(y_val, probs)
        
        # Calculate multi-class precision, recall, f1
        prec = precision_score(y_val, preds, average='macro', zero_division=0)
        rec = recall_score(y_val, preds, average='macro', zero_division=0)
        f1 = f1_score(y_val, preds, average='macro', zero_division=0)
        
        print(f"{name} - Log Loss: {loss:.4f}, Accuracy: {acc:.4f}, F1: {f1:.4f}")
        
        metrics_summary[name] = {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "log_loss": float(loss)
        }
        
        if loss < best_log_loss:
            best_log_loss = loss
            best_model_name = name
            best_model = model
            
    print(f"\nBest Model: {best_model_name} with Log Loss: {best_log_loss:.4f}")
    
    # Save the feature importance for Explainable AI
    feature_importances = {}
    if hasattr(best_model, "feature_importances_"):
        importances = best_model.feature_importances_
        feature_names = X_train.columns.tolist()
        feature_importances = {name: float(importance) for name, importance in zip(feature_names, importances)}
    elif hasattr(best_model, "coef_"):
        importances = np.mean(np.abs(best_model.coef_), axis=0)
        feature_names = X_train.columns.tolist()
        feature_importances = {name: float(importance) for name, importance in zip(feature_names, importances)}
        
    # Define a clean ensemble
    # Weights for the ensemble: Elo engine, Dixon Coles, best ML model
    # We will fit weights on the validation set using scipy minimize
    def ensemble_loss(weights):
        w_elo, w_dc, w_ml = weights
        # Normalize weights
        s = w_elo + w_dc + w_ml
        w_elo, w_dc, w_ml = w_elo/s, w_dc/s, w_ml/s
        
        # Compute probabilities for Elo on validation set
        elo_probs = []
        for idx, row in matches_df[val_mask].iterrows():
            elo_h, _, _ = elo_engine.get_ratings(row['home_team'])
            elo_a, _, _ = elo_engine.get_ratings(row['away_team'])
            exp_h = elo_engine.compute_expected_probability(elo_h, elo_a, row['neutral'])
            exp_a = 1.0 - exp_h
            # Standard Elo has no draw model. We split draw probability.
            # E.g. Draw is ~25%, home win is (1-draw)*exp_h, away win is (1-draw)*exp_a.
            # This is a very standard draw proxy for Elo!
            draw_proxy = 0.25
            elo_probs.append([draw_proxy, (1 - draw_proxy)*exp_h, (1 - draw_proxy)*exp_a])
        elo_probs = np.array(elo_probs)
        
        # Compute probabilities for Dixon-Coles on validation set
        dc_probs = []
        for idx, row in matches_df[val_mask].iterrows():
            pred = dixon_coles.predict_score_probs(row['home_team'], row['away_team'], row['neutral'])
            dc_probs.append([pred["draw_prob"], pred["home_win_prob"], pred["away_win_prob"]])
        dc_probs = np.array(dc_probs)
        
        # ML model probabilities
        ml_probs = best_model.predict_proba(X_val)
        
        # Weighted combination
        combined = w_elo * elo_probs + w_dc * dc_probs + w_ml * ml_probs
        return log_loss(y_val, combined)
        
    res_opt = minimize(ensemble_loss, [0.1, 0.4, 0.5], bounds=[(0.0, 1.0)]*3)
    best_w = res_opt.x / np.sum(res_opt.x)
    print(f"Optimized Ensemble Weights: Elo={best_w[0]:.3f}, Dixon-Coles={best_w[1]:.3f}, ML ({best_model_name})={best_w[2]:.3f}")
    print(f"Ensemble Validation Log Loss: {ensemble_loss(res_opt.x):.4f}")
    
    # Fit Bayesian Calibrator
    from calibration import BayesianCalibrator
    
    elo_probs_val = []
    for idx, row in matches_df[val_mask].iterrows():
        elo_h, _, _ = elo_engine.get_ratings(row['home_team'])
        elo_a, _, _ = elo_engine.get_ratings(row['away_team'])
        exp_h = elo_engine.compute_expected_probability(elo_h, elo_a, row['neutral'])
        exp_a = 1.0 - exp_h
        draw_proxy = 0.25
        elo_probs_val.append([draw_proxy, (1 - draw_proxy)*exp_h, (1 - draw_proxy)*exp_a])
    elo_probs_val = np.array(elo_probs_val)
    
    dc_probs_val = []
    for idx, row in matches_df[val_mask].iterrows():
        pred = dixon_coles.predict_score_probs(row['home_team'], row['away_team'], row['neutral'])
        dc_probs_val.append([pred["draw_prob"], pred["home_win_prob"], pred["away_win_prob"]])
    dc_probs_val = np.array(dc_probs_val)
    
    ml_probs_val = best_model.predict_proba(X_val)
    ensemble_probs_val = best_w[0] * elo_probs_val + best_w[1] * dc_probs_val + best_w[2] * ml_probs_val
    
    calibrator = BayesianCalibrator()
    calibrator.fit(ensemble_probs_val, y_val)
    
    # Save objects
    artifacts = {
        "elo_engine": elo_engine,
        "dixon_coles": dixon_coles,
        "best_model": best_model,
        "best_model_name": best_model_name,
        "ensemble_weights": best_w.tolist(),
        "calibrator": calibrator,
        "feature_importances": feature_importances,
        "metrics_summary": metrics_summary
    }
    
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    
    filepath = os.path.join(models_dir, "forecasting_models.pkl")
    with open(filepath, "wb") as f:
        pickle.dump(artifacts, f)
        
    print(f"Models and engines saved to {filepath}.")
    return filepath

if __name__ == "__main__":
    matches_csv = os.path.join(os.path.dirname(__file__), "data", "cleaned_matches.csv")
    if os.path.exists(matches_csv):
        df_matches = pd.read_csv(matches_csv)
        train_and_evaluate_models(df_matches)
    else:
        print("Matches dataset not found. Run data_pipeline.py first.")
