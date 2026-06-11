# dixon_coles.py

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from scipy.stats import poisson
import os

class DixonColes:
    def __init__(self, time_decay=0.0001):
        self.time_decay = time_decay  # xi in the time decay function
        self.teams = []
        self.team_indices = {}
        self.alpha = None  # Attack parameters
        self.beta = None   # Defense parameters
        self.gamma = 1.35  # Home advantage parameter
        self.rho = -0.05   # Draw correction parameter
        
    def _time_weight(self, dates, max_date):
        # Calculate time weights based on days from max_date
        days = (max_date - dates).dt.days
        return np.exp(-self.time_decay * days)

    def _tau(self, x, y, lambda_val, mu_val, rho_val):
        # Dixon-Coles low-score correction factor
        if x == 0 and y == 0:
            return 1.0 - lambda_val * mu_val * rho_val
        elif x == 1 and y == 0:
            return 1.0 + lambda_val * rho_val
        elif x == 0 and y == 1:
            return 1.0 + mu_val * rho_val
        elif x == 1 and y == 1:
            return 1.0 - rho_val
        else:
            return 1.0

    def _neg_log_likelihood(self, params, home_ids, away_ids, home_goals, away_goals, is_neutral, weights):
        # Unpack parameters
        n_teams = len(self.teams)
        alpha = params[:n_teams]
        beta = params[n_teams:2*n_teams]
        gamma = params[2*n_teams]
        rho = params[2*n_teams+1]
        
        # Calculate expected goals (lambda and mu) for each match
        # If neutral match, home advantage (gamma) is not applied (value = 1)
        h_adv = np.where(is_neutral, 1.0, gamma)
        
        lambdas = alpha[home_ids] * beta[away_ids] * h_adv
        mus = alpha[away_ids] * beta[home_ids]
        
        # Clip expected goals to avoid numerical issues
        lambdas = np.clip(lambdas, 1e-4, 20.0)
        mus = np.clip(mus, 1e-4, 20.0)
        
        # Poisson likelihood terms
        poisson_h = home_goals * np.log(lambdas) - lambdas
        poisson_a = away_goals * np.log(mus) - mus
        
        # Dixon-Coles correction terms
        # Vectorized tau calculation
        tau_vals = np.ones(len(home_goals))
        
        # Index combinations for low score corrections
        idx_00 = (home_goals == 0) & (away_goals == 0)
        idx_10 = (home_goals == 1) & (away_goals == 0)
        idx_01 = (home_goals == 0) & (away_goals == 1)
        idx_11 = (home_goals == 1) & (away_goals == 1)
        
        tau_vals[idx_00] = 1.0 - lambdas[idx_00] * mus[idx_00] * rho
        tau_vals[idx_10] = 1.0 + lambdas[idx_10] * rho
        tau_vals[idx_01] = 1.0 + mus[idx_01] * rho
        tau_vals[idx_11] = 1.0 - rho
        
        # To avoid log(negative value), clip tau
        tau_vals = np.clip(tau_vals, 1e-6, 5.0)
        
        log_prob = poisson_h + poisson_a + np.log(tau_vals)
        weighted_neg_ll = -np.sum(log_prob * weights)
        
        return weighted_neg_ll

    def fit(self, matches_df, start_date='2014-01-01'):
        # Filter matches by start_date to speed up fitting and focus on recent form
        df = matches_df[matches_df['date'] >= start_date].copy()
        if len(df) == 0:
            print("No matches found in the given date range.")
            return
            
        print(f"Fitting Dixon-Coles Model on {len(df)} matches...")
        df['date'] = pd.to_datetime(df['date'])
        max_date = df['date'].max()
        
        # Identify all unique teams
        self.teams = sorted(list(set(df['home_team'].tolist() + df['away_team'].tolist())))
        self.team_indices = {team: i for i, team in enumerate(self.teams)}
        n_teams = len(self.teams)
        
        # Map teams to integer IDs
        home_ids = df['home_team'].map(self.team_indices).values
        away_ids = df['away_team'].map(self.team_indices).values
        
        home_goals = df['home_score'].values
        away_goals = df['away_score'].values
        is_neutral = df['neutral'].values
        
        # Calculate recency weights
        weights = self._time_weight(df['date'], max_date).values
        # Normalize weights to avoid scaling issues
        weights = weights / np.mean(weights)
        
        # Initial guesses
        init_alpha = np.ones(n_teams)
        init_beta = np.ones(n_teams)
        init_gamma = 1.3  # Home advantage guess
        init_rho = -0.05  # Draw correlation guess
        init_params = np.concatenate([init_alpha, init_beta, [init_gamma, init_rho]])
        
        # Constraints: Mean alpha must equal 1.0 (equality constraint)
        def constraint_mean_alpha(params):
            return np.mean(params[:n_teams]) - 1.0
            
        constraints = [{'type': 'eq', 'fun': constraint_mean_alpha}]
        
        # Bounds: alpha > 0, beta > 0, gamma > 0, rho between -0.3 and 0.3
        bounds = [(0.05, 5.0)] * n_teams + [(0.05, 5.0)] * n_teams + [(0.5, 3.0)] + [(-0.25, 0.25)]
        
        # Optimize
        print("Optimizing parameters (this might take a few seconds)...")
        opt_res = minimize(
            self._neg_log_likelihood, 
            init_params, 
            args=(home_ids, away_ids, home_goals, away_goals, is_neutral, weights),
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 150, 'disp': False}
        )
        
        if not opt_res.success:
            print("Warning: Dixon-Coles optimization did not converge successfully.")
            print(opt_res.message)
            
        # Store parameters
        self.alpha = opt_res.x[:n_teams]
        self.beta = opt_res.x[n_teams:2*n_teams]
        self.gamma = float(opt_res.x[2*n_teams])
        self.rho = float(opt_res.x[2*n_teams+1])
        
        print("Optimization complete.")
        print(f"Home Advantage (Gamma): {self.gamma:.3f}, Draw Adjustment (Rho): {self.rho:.3f}")
        
    def get_team_params(self, team):
        if team not in self.team_indices:
            # Fallback for unseen teams: average strength
            return 1.0, 1.0
        idx = self.team_indices[team]
        return self.alpha[idx], self.beta[idx]

    def predict_score_probs(self, home_team, away_team, is_neutral, max_goals=6):
        alpha_h, beta_h = self.get_team_params(home_team)
        alpha_a, beta_a = self.get_team_params(away_team)
        
        # Calculate lambdas and mus
        h_adv = 1.0 if is_neutral else self.gamma
        lambda_val = alpha_h * beta_a * h_adv
        mu_val = alpha_a * beta_h
        
        # Construct probability matrix
        score_probs = np.zeros((max_goals + 1, max_goals + 1))
        for x in range(max_goals + 1):
            p_x = poisson.pmf(x, lambda_val)
            for y in range(max_goals + 1):
                p_y = poisson.pmf(y, mu_val)
                tau_val = self._tau(x, y, lambda_val, mu_val, self.rho)
                score_probs[x, y] = p_x * p_y * tau_val
                
        # Normalize to sum to 1.0
        score_probs = score_probs / np.sum(score_probs)
        
        # Calculate outcome probabilities
        home_win_prob = float(np.sum(np.tril(score_probs, -1)))   # x > y (lower triangle)
        away_win_prob = float(np.sum(np.triu(score_probs, 1)))    # x < y (upper triangle)
        draw_prob = float(np.sum(np.diag(score_probs)))           # x == y (diagonal)
        
        return {
            "expected_goals_home": float(lambda_val),
            "expected_goals_away": float(mu_val),
            "score_matrix": score_probs.tolist(),
            "home_win_prob": home_win_prob,
            "draw_prob": draw_prob,
            "away_win_prob": away_win_prob
        }
