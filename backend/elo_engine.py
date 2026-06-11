# elo_engine.py

import math
import pandas as pd
from team_mapping import standardize_team_name

class EloEngine:
    def __init__(self, default_overall=1500, default_offense=1000, default_defense=1000):
        self.default_overall = default_overall
        self.default_offense = default_offense
        self.default_defense = default_defense
        
        self.ratings = {}  # team -> overall_elo
        self.off_ratings = {}  # team -> offensive_elo
        self.def_ratings = {}  # team -> defensive_elo
        
        self.history = {}  # team -> list of (date, elo, off, def)
        
    def get_ratings(self, team):
        # Initialize team if not seen
        if team not in self.ratings:
            self.ratings[team] = self.default_overall
            self.off_ratings[team] = self.default_offense
            self.def_ratings[team] = self.default_defense
            self.history[team] = []
        return self.ratings[team], self.off_ratings[team], self.def_ratings[team]

    def set_ratings(self, team, elo, off, def_val):
        self.ratings[team] = elo
        self.off_ratings[team] = off
        self.def_ratings[team] = def_val
        if team not in self.history:
            self.history[team] = []

    def get_k_factor(self, tournament, stage):
        # Determine match weight based on match importance
        tourn = str(tournament).lower()
        stg = str(stage).lower()
        
        if "friendly" in tourn:
            return 10
        elif "nations league" in tourn:
            return 20
        elif "qualif" in tourn or "qualification" in tourn:
            return 30
        elif "fifa world cup" in tourn:
            if "group" in stg:
                return 50
            else:
                return 60  # Knockout
        # Continental championships (Euro, Copa America, AFCON, Asian Cup, Gold Cup)
        elif any(c in tourn for c in ["copa américa", "copa america", "uefa euro", "african cup of nations", "afcon", "asian cup", "gold cup"]):
            if "group" in stg:
                return 40
            else:
                return 50
        return 20  # default for other tournaments

    def get_gd_multiplier(self, gd):
        if gd <= 1:
            return 1.0
        elif gd == 2:
            return 1.5
        else:
            return 1.75 + (gd - 3) / 8.0

    def compute_expected_probability(self, elo_a, elo_b, is_neutral):
        # home advantage boost
        home_advantage = 0 if is_neutral else 100
        elo_diff = (elo_a + home_advantage) - elo_b
        return 1.0 / (10 ** (-elo_diff / 400.0) + 1.0)

    def update_overall_elo(self, home_team, away_team, home_score, away_score, is_neutral, k_base):
        elo_h, off_h, def_h = self.get_ratings(home_team)
        elo_a, off_a, def_a = self.get_ratings(away_team)
        
        # Calculate expected win probability for home team
        exp_h = self.compute_expected_probability(elo_h, elo_a, is_neutral)
        exp_a = 1.0 - exp_h
        
        # Actual outcome
        if home_score > away_score:
            w_h, w_a = 1.0, 0.0
        elif away_score > home_score:
            w_h, w_a = 0.0, 1.0
        else:
            w_h, w_a = 0.5, 0.5
            
        gd = abs(home_score - away_score)
        gd_mult = self.get_gd_multiplier(gd)
        
        # Update ratings
        k = k_base * gd_mult
        new_elo_h = elo_h + k * (w_h - exp_h)
        new_elo_a = elo_a + k * (w_a - exp_a)
        
        return new_elo_h, new_elo_a

    def update_off_def_elo(self, home_team, away_team, home_score, away_score, is_neutral, k_goals=12.0):
        _, off_h, def_h = self.get_ratings(home_team)
        _, off_a, def_a = self.get_ratings(away_team)
        
        # Base expected goals scored
        base_home_goals = 1.35
        base_away_goals = 1.05
        base_neutral_goals = 1.20
        
        if is_neutral:
            exp_h_goals = base_neutral_goals * (10 ** ((off_h - def_a) / 400.0))
            exp_a_goals = base_neutral_goals * (10 ** ((off_a - def_h) / 400.0))
        else:
            exp_h_goals = base_home_goals * (10 ** ((off_h - def_a) / 400.0))
            exp_a_goals = base_away_goals * (10 ** ((off_a - def_h) / 400.0))
            
        # Limit exponential expectations to prevent division by zero or infinite scaling
        exp_h_goals = min(max(exp_h_goals, 0.1), 10.0)
        exp_a_goals = min(max(exp_a_goals, 0.1), 10.0)
        
        # Update offensive home, defensive away
        new_off_h = off_h + k_goals * (home_score - exp_h_goals)
        new_def_a = def_a + k_goals * (exp_h_goals - home_score)
        
        # Update offensive away, defensive home
        new_off_a = off_a + k_goals * (away_score - exp_a_goals)
        new_def_h = def_h + k_goals * (exp_a_goals - away_score)
        
        # Keep positive ratings
        new_off_h = max(new_off_h, 100)
        new_def_h = max(new_def_h, 100)
        new_off_a = max(new_off_a, 100)
        new_def_a = max(new_def_a, 100)
        
        return new_off_h, new_def_h, new_off_a, new_def_a

    def process_match(self, row):
        date_str = str(row['date'])
        home_team = row['home_team']
        away_team = row['away_team']
        home_score = int(row['home_score'])
        away_score = int(row['away_score'])
        tournament = row['tournament']
        stage = row.get('stage', 'group stage')
        is_neutral = bool(row['neutral'])
        
        k_base = self.get_k_factor(tournament, stage)
        
        # Update Overall Elo
        new_elo_h, new_elo_a = self.update_overall_elo(home_team, away_team, home_score, away_score, is_neutral, k_base)
        
        # Update Offensive / Defensive Elo
        new_off_h, new_def_h, new_off_a, new_def_a = self.update_off_def_elo(home_team, away_team, home_score, away_score, is_neutral)
        
        # Save updates
        self.set_ratings(home_team, new_elo_h, new_off_h, new_def_h)
        self.set_ratings(away_team, new_elo_a, new_off_a, new_def_a)
        
        # Record history
        self.history[home_team].append((date_str, new_elo_h, new_off_h, new_def_h))
        self.history[away_team].append((date_str, new_elo_a, new_off_a, new_def_a))

    def fit(self, matches_df):
        print(f"Fitting Elo Ratings on {len(matches_df)} matches...")
        # Sort chronologically to run update loops correctly
        matches_df_sorted = matches_df.sort_values(by='date').reset_index(drop=True)
        for _, row in matches_df_sorted.iterrows():
            self.process_match(row)
        print("Elo ratings fitting complete.")

    def get_top_teams(self, n=50):
        # Sort teams by overall Elo rating
        sorted_teams = sorted(self.ratings.items(), key=lambda x: x[1], reverse=True)
        return sorted_teams[:n]
        
    def get_elo_evolution(self, teams_list, start_date='2010-01-01'):
        # Return historical ratings for analytics graphing
        evolution = {}
        for team in teams_list:
            if team in self.history:
                team_history = []
                for date, elo, off, def_val in self.history[team]:
                    if date >= start_date:
                        team_history.append({"date": date, "elo": round(elo, 1), "off": round(off, 1), "def": round(def_val, 1)})
                # Resample or group by month to keep payload reasonable
                df_temp = pd.DataFrame(team_history)
                if not df_temp.empty:
                    df_temp['date'] = pd.to_datetime(df_temp['date'])
                    df_grouped = df_temp.groupby(df_temp['date'].dt.to_period('M')).last().reset_index(drop=True)
                    df_grouped['date'] = df_grouped['date'].astype(str)
                    evolution[team] = df_grouped.to_dict(orient='records')
        return evolution
