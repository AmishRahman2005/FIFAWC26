# verify_model.py

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "worldcup_2026.db")

def verify_db():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}.")
        return False
        
    print(f"Database found at {DB_PATH}. Connecting...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Check tables and counts
    tables = ["teams", "matches", "sim_results", "elo_history"]
    print("\n--- TABLE ROW COUNTS ---")
    for t in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {t}")
            count = cursor.fetchone()[0]
            print(f"Table '{t}': {count} rows")
        except Exception as e:
            print(f"Error checking table '{t}': {e}")
            
    # 2. Check top teams by Elo
    print("\n--- TOP 5 TEAMS BY ELO ---")
    try:
        cursor.execute("SELECT name, elo, off_rating, def_rating FROM teams ORDER BY elo DESC LIMIT 5")
        for r in cursor.fetchall():
            print(f"Team: {r[0]} | Elo: {r[1]:.1f} | Off: {r[2]:.1f} | Def: {r[3]:.1f}")
    except Exception as e:
        print("Error fetching top teams:", e)
        
    # 3. Check champion probabilities
    print("\n--- TOP 5 TEAMS BY CHAMPIONSHIP PROBABILITY ---")
    try:
        cursor.execute("SELECT team, win_pct, group_qual_pct FROM sim_results ORDER BY win_pct DESC LIMIT 5")
        for r in cursor.fetchall():
            print(f"Team: {r[0]} | Winner Prob: {r[1]:.2f}% | Group Qual: {r[2]:.2f}%")
    except Exception as e:
        print("Error fetching sim results:", e)
        
    # 4. Check matches sample
    print("\n--- SAMPLE MATCH PREDICTIONS ---")
    try:
        cursor.execute("SELECT match_id, date, home_team, away_team, pred_home_score, pred_away_score, confidence FROM matches LIMIT 3")
        for r in cursor.fetchall():
            print(f"{r[0]} ({r[1]}): {r[2]} {r[4]}-{r[5]} {r[3]} | Conf: {r[6]}%")
    except Exception as e:
        print("Error fetching sample matches:", e)
        
    conn.close()
    return True

if __name__ == "__main__":
    verify_db()
