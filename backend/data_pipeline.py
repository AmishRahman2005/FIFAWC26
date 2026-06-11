# data_pipeline.py

import os
import urllib.request
import pandas as pd
from team_mapping import standardize_team_name

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

RESULTS_URL = "https://raw.githubusercontent.com/martj42/international_results/master/results.csv"
SHOOTOUTS_URL = "https://raw.githubusercontent.com/martj42/international_results/master/shootouts.csv"

def download_file(url, filename):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        print(f"Downloading {url} to {filepath}...")
        try:
            urllib.request.urlretrieve(url, filepath)
            print("Download complete.")
        except Exception as e:
            print(f"Failed to download {url}: {e}")
    else:
        print(f"File {filename} already exists at {filepath}.")
    return filepath

def load_and_clean_kaggle_data():
    results_path = download_file(RESULTS_URL, "kaggle_results.csv")
    shootouts_path = download_file(SHOOTOUTS_URL, "kaggle_shootouts.csv")
    
    df_res = pd.read_csv(results_path)
    df_sho = pd.read_csv(shootouts_path)
    
    # Parse dates
    df_res['date'] = pd.to_datetime(df_res['date'], errors='coerce')
    df_sho['date'] = pd.to_datetime(df_sho['date'], errors='coerce')
    
    # Standardize team names
    df_res['home_team'] = df_res['home_team'].apply(standardize_team_name)
    df_res['away_team'] = df_res['away_team'].apply(standardize_team_name)
    df_res['country'] = df_res['country'].apply(standardize_team_name)
    
    df_sho['home_team'] = df_sho['home_team'].apply(standardize_team_name)
    df_sho['away_team'] = df_sho['away_team'].apply(standardize_team_name)
    
    # Drop rows with missing score
    df_res = df_res.dropna(subset=['home_score', 'away_score'])
    df_res['home_score'] = df_res['home_score'].astype(int)
    df_res['away_score'] = df_res['away_score'].astype(int)
    
    # Merge shootout info
    # Shootout dataset contains the winner team name.
    # Join on date, home_team, away_team
    df_merged = pd.merge(
        df_res, 
        df_sho[['date', 'home_team', 'away_team', 'winner']], 
        on=['date', 'home_team', 'away_team'], 
        how='left'
    )
    
    # Format to standardized columns
    df_merged['extra_time'] = False  # Kaggle data does not explicitly state extra time, assume false
    df_merged['penalty_shootout'] = df_merged['winner'].notna()
    df_merged['home_penalties'] = 0
    df_merged['away_penalties'] = 0
    
    # Determine result (win/draw/loss)
    # Result is 'home', 'away', or 'draw'
    def get_result(row):
        if row['home_score'] > row['away_score']:
            return 'home'
        elif row['away_score'] > row['home_score']:
            return 'away'
        else:
            if row['penalty_shootout']:
                if row['winner'] == row['home_team']:
                    return 'home'
                elif row['winner'] == row['away_team']:
                    return 'away'
            return 'draw'
            
    df_merged['match_result'] = df_merged.apply(get_result, axis=1)
    df_merged['stage'] = 'group stage'  # default stage
    
    # Rename and select columns
    cleaned_df = df_merged[[
        'date', 'home_team', 'away_team', 'home_score', 'away_score', 
        'tournament', 'stage', 'neutral', 'extra_time', 
        'penalty_shootout', 'home_penalties', 'away_penalties', 'match_result'
    ]].copy()
    
    return cleaned_df

def load_and_clean_local_wc_data():
    local_path = r"C:\Users\amish\Downloads\FIFA World Cup 1930-2022 All Match Dataset.csv"
    if not os.path.exists(local_path):
        print(f"Warning: Local World Cup file not found at {local_path}.")
        return pd.DataFrame()
        
    df = pd.read_csv(local_path, encoding='latin-1')
    
    # Columns mapping:
    # 'Match Date' -> date
    # 'Home Team Name' -> home_team
    # 'Away Team Name' -> away_team
    # 'Home Team Score' -> home_score
    # 'Away Team Score' -> away_score
    # 'Stage Name' -> stage
    # 'neutral' -> (whether it's neutral, for WC matches it is always True except when Home Team Name matches Country Name)
    
    df['date'] = pd.to_datetime(df['Match Date'], errors='coerce')
    df['home_team'] = df['Home Team Name'].apply(standardize_team_name)
    df['away_team'] = df['Away Team Name'].apply(standardize_team_name)
    
    # Neutral venue logic: World Cup host nation is 'Country Name'.
    # A match is neutral if neither home nor away team is the host country.
    host_country = df['Country Name'].apply(standardize_team_name)
    df['neutral'] = ~((df['home_team'] == host_country) | (df['away_team'] == host_country))
    
    df['home_score'] = df['Home Team Score'].fillna(0).astype(int)
    df['away_score'] = df['Away Team Score'].fillna(0).astype(int)
    
    df['tournament'] = "FIFA World Cup"
    df['stage'] = df['Stage Name'].fillna('group stage').str.lower()
    df['extra_time'] = df['Extra Time'].fillna(0).astype(int) > 0
    df['penalty_shootout'] = df['Penalty Shootout'].fillna(0).astype(int) > 0
    
    df['home_penalties'] = df['Home Team Score Penalties'].fillna(0).astype(int)
    df['away_penalties'] = df['Away Team Score Penalties'].fillna(0).astype(int)
    
    def get_result(row):
        if row['home_score'] > row['away_score']:
            return 'home'
        elif row['away_score'] > row['home_score']:
            return 'away'
        else:
            if row['penalty_shootout']:
                if row['home_penalties'] > row['away_penalties']:
                    return 'home'
                elif row['away_penalties'] > row['home_penalties']:
                    return 'away'
            return 'draw'
            
    df['match_result'] = df.apply(get_result, axis=1)
    
    cleaned_df = df[[
        'date', 'home_team', 'away_team', 'home_score', 'away_score', 
        'tournament', 'stage', 'neutral', 'extra_time', 
        'penalty_shootout', 'home_penalties', 'away_penalties', 'match_result'
    ]].copy()
    
    return cleaned_df

def build_compiled_dataset():
    print("Building historical match dataset...")
    kaggle_df = load_and_clean_kaggle_data()
    local_df = load_and_clean_local_wc_data()
    
    if local_df.empty:
        print("Using Kaggle dataset only.")
        combined_df = kaggle_df
    else:
        # Merge both datasets. 
        # Note: Kaggle results contains World Cup matches, but local_df has more detailed data (penalties, extra time, stages).
        # We will filter out Kaggle's 'FIFA World Cup' tournament matches and replace them with local_df matches 
        # to prevent duplicates and keep the rich metadata of local_df.
        kaggle_filtered = kaggle_df[kaggle_df['tournament'] != 'FIFA World Cup']
        combined_df = pd.concat([kaggle_filtered, local_df], ignore_index=True)
        
    combined_df = combined_df.sort_values(by='date').reset_index(drop=True)
    
    output_path = os.path.join(DATA_DIR, "cleaned_matches.csv")
    combined_df.to_csv(output_path, index=False)
    print(f"Dataset compiled and saved to {output_path}. Shape: {combined_df.shape}")
    return output_path

if __name__ == "__main__":
    build_compiled_dataset()
