# db_manager.py

import os
import sqlite3
import json
from team_mapping import TEAMS

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "worldcup_2026.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create Teams Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teams (
        name TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        group_name TEXT NOT NULL,
        flag TEXT NOT NULL,
        elo REAL,
        off_rating REAL,
        def_rating REAL,
        overall_rating REAL
    )
    """)
    
    # Create Simulation Results Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sim_results (
        team TEXT PRIMARY KEY,
        group_qual_pct REAL,
        r32_pct REAL,
        r16_pct REAL,
        qf_pct REAL,
        sf_pct REAL,
        final_pct REAL,
        win_pct REAL,
        FOREIGN KEY(team) REFERENCES teams(name)
    )
    """)
    
    # Create Matches Table (Predictions)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS matches (
        match_id TEXT PRIMARY KEY,
        stage TEXT NOT NULL,
        date TEXT NOT NULL,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        home_win_prob REAL,
        draw_prob REAL,
        away_win_prob REAL,
        pred_home_score INTEGER,
        pred_away_score INTEGER,
        confidence REAL,
        key_factors TEXT,
        explanation TEXT,
        FOREIGN KEY(home_team) REFERENCES teams(name),
        FOREIGN KEY(away_team) REFERENCES teams(name)
    )
    """)
    
    # Create Elo History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS elo_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team TEXT NOT NULL,
        date TEXT NOT NULL,
        elo REAL,
        off REAL,
        def REAL,
        FOREIGN KEY(team) REFERENCES teams(name)
    )
    """)
    
    # Create Player Simulation Results Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS player_sim_results (
        player_name TEXT PRIMARY KEY,
        real_name TEXT NOT NULL,
        team TEXT NOT NULL,
        role TEXT NOT NULL,
        expected_goals REAL,
        expected_assists REAL,
        golden_boot_pct REAL,
        playmaker_pct REAL,
        FOREIGN KEY(team) REFERENCES teams(name)
    )
    """)
    
    conn.commit()
    conn.close()
    print("Database tables initialized successfully.")

def save_teams(teams_data):
    conn = get_connection()
    cursor = conn.cursor()
    for row in teams_data:
        cursor.execute("""
        INSERT OR REPLACE INTO teams (name, code, group_name, flag, elo, off_rating, def_rating, overall_rating)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row["name"], row["code"], row["group_name"], row["flag"],
            row.get("elo", 1500.0), row.get("off_rating", 1000.0), row.get("def_rating", 1000.0), row.get("overall_rating", 1500.0)
        ))
    conn.commit()
    conn.close()

def save_sim_results(sim_data):
    conn = get_connection()
    cursor = conn.cursor()
    for row in sim_data:
        cursor.execute("""
        INSERT OR REPLACE INTO sim_results (team, group_qual_pct, r32_pct, r16_pct, qf_pct, sf_pct, final_pct, win_pct)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row["team"], row["group_qual_pct"], row["r32_pct"], row["r16_pct"],
            row["qf_pct"], row["sf_pct"], row["final_pct"], row["win_pct"]
        ))
    conn.commit()
    conn.close()

def save_predictions(predictions):
    conn = get_connection()
    cursor = conn.cursor()
    for row in predictions:
        cursor.execute("""
        INSERT OR REPLACE INTO matches (
            match_id, stage, date, home_team, away_team, 
            home_win_prob, draw_prob, away_win_prob, 
            pred_home_score, pred_away_score, confidence, key_factors, explanation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row["match_id"], row["stage"], row["date"], row["home_team"], row["away_team"],
            row["home_win_prob"], row["draw_prob"], row["away_win_prob"],
            row["pred_home_score"], row["pred_away_score"], row["confidence"],
            json.dumps(row["key_factors"]), row["explanation"]
        ))
    conn.commit()
    conn.close()

def save_elo_history(history):
    conn = get_connection()
    cursor = conn.cursor()
    # Delete existing to prevent duplication on multiple runs
    cursor.execute("DELETE FROM elo_history")
    for row in history:
        cursor.execute("""
        INSERT INTO elo_history (team, date, elo, off, def)
        VALUES (?, ?, ?, ?, ?)
        """, (row["team"], row["date"], row["elo"], row["off"], row["def"]))
    conn.commit()
    conn.close()

def get_teams_from_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT t.name, t.code, t.group_name, t.flag, t.elo, t.off_rating, t.def_rating, t.overall_rating,
           s.group_qual_pct, s.r32_pct, s.r16_pct, s.qf_pct, s.sf_pct, s.final_pct, s.win_pct
    FROM teams t
    LEFT JOIN sim_results s ON t.name = s.team
    ORDER BY t.elo DESC
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_predictions_from_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM matches ORDER BY date ASC")
    rows = []
    for r in cursor.fetchall():
        d = dict(r)
        d["key_factors"] = json.loads(d["key_factors"])
        rows.append(d)
    conn.close()
    return rows

def get_match_from_db(match_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM matches WHERE match_id = ?", (match_id,))
    row = cursor.fetchone()
    if row:
        d = dict(row)
        d["key_factors"] = json.loads(d["key_factors"])
        conn.close()
        return d
    conn.close()
    return None

def get_analytics_data_from_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get Elo history for top 10 teams
    cursor.execute("""
    SELECT team, date, elo, off, [def] 
    FROM elo_history 
    WHERE team IN (
        SELECT name FROM teams ORDER BY elo DESC LIMIT 10
    )
    ORDER BY date ASC
    """)
    history_rows = [dict(r) for r in cursor.fetchall()]
    
    # Get all teams for scatter plot
    cursor.execute("SELECT name, elo, off_rating, def_rating, overall_rating FROM teams")
    teams_rows = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return {
        "history": history_rows,
        "teams": teams_rows
    }

def save_player_sim_results(player_data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM player_sim_results")
    for row in player_data:
        cursor.execute("""
        INSERT INTO player_sim_results (player_name, real_name, team, role, expected_goals, expected_assists, golden_boot_pct, playmaker_pct)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row["player_name"], row["real_name"], row["team"], row["role"],
            row["expected_goals"], row["expected_assists"], row["golden_boot_pct"], row["playmaker_pct"]
        ))
    conn.commit()
    conn.close()

def get_player_predictions_from_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT p.player_name, p.real_name, p.team, p.role, p.expected_goals, p.expected_assists, p.golden_boot_pct, p.playmaker_pct, t.flag
    FROM player_sim_results p
    LEFT JOIN teams t ON p.team = t.name
    ORDER BY p.golden_boot_pct DESC, p.expected_goals DESC
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows
