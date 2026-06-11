"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Filter, Calendar, Award, Compass, Search } from "lucide-react";

// Team metadata copied to prevent external dependencies
const MOCK_TEAMS: Record<string, { group: string; code: string; flag: string }> = {
  "Mexico": { group: "A", code: "MEX", flag: "mx" },
  "South Africa": { group: "A", code: "RSA", flag: "za" },
  "South Korea": { group: "A", code: "KOR", flag: "kr" },
  "Czechia": { group: "A", code: "CZE", flag: "cz" },
  "Canada": { group: "B", code: "CAN", flag: "ca" },
  "Qatar": { group: "B", code: "QAT", flag: "qa" },
  "Switzerland": { group: "B", code: "SUI", flag: "ch" },
  "Bosnia and Herzegovina": { group: "B", code: "BIH", flag: "ba" },
  "Brazil": { group: "C", code: "BRA", flag: "br" },
  "Morocco": { group: "C", code: "MAR", flag: "ma" },
  "Haiti": { group: "C", code: "HAI", flag: "ht" },
  "Scotland": { group: "C", code: "SCO", flag: "gb-sct" },
  "United States": { group: "D", code: "USA", flag: "us" },
  "Paraguay": { group: "D", code: "PAR", flag: "py" },
  "Australia": { group: "D", code: "AUS", flag: "au" },
  "Türkiye": { group: "D", code: "TUR", flag: "tr" },
  "Germany": { group: "E", code: "GER", flag: "de" },
  "Curaçao": { group: "E", code: "CUW", flag: "cw" },
  "Ivory Coast": { group: "E", code: "CIV", flag: "ci" },
  "Ecuador": { group: "E", code: "ECU", flag: "ec" },
  "Netherlands": { group: "F", code: "NED", flag: "nl" },
  "Japan": { group: "F", code: "JPN", flag: "jp" },
  "Tunisia": { group: "F", code: "TUN", flag: "tn" },
  "Sweden": { group: "F", code: "SWE", flag: "se" },
  "Belgium": { group: "G", code: "BEL", flag: "be" },
  "Egypt": { group: "G", code: "EGY", flag: "eg" },
  "Iran": { group: "G", code: "IRN", flag: "ir" },
  "New Zealand": { group: "G", code: "NZL", flag: "nz" },
  "Spain": { group: "H", code: "ESP", flag: "es" },
  "Cape Verde": { group: "H", code: "CPV", flag: "cv" },
  "Saudi Arabia": { group: "H", code: "KSA", flag: "sa" },
  "Uruguay": { group: "H", code: "URU", flag: "uy" },
  "France": { group: "I", code: "FRA", flag: "fr" },
  "Senegal": { group: "I", code: "SEN", flag: "sn" },
  "Norway": { group: "I", code: "NOR", flag: "no" },
  "Iraq": { group: "I", code: "IRQ", flag: "iq" },
  "Argentina": { group: "J", code: "ARG", flag: "ar" },
  "Algeria": { group: "J", code: "ALG", flag: "dz" },
  "Austria": { group: "J", code: "AUT", flag: "at" },
  "Jordan": { group: "J", code: "JOR", flag: "jo" },
  "Portugal": { group: "K", code: "POR", flag: "pt" },
  "Colombia": { group: "K", code: "COL", flag: "co" },
  "Uzbekistan": { group: "K", code: "UZB", flag: "uz" },
  "DR Congo": { group: "K", code: "COD", flag: "cd" },
  "England": { group: "L", code: "ENG", flag: "gb-eng" },
  "Croatia": { group: "L", code: "CRO", flag: "hr" },
  "Ghana": { group: "L", code: "GHA", flag: "gh" },
  "Panama": { group: "L", code: "PAN", flag: "pa" }
};

// Generate realistic mock predictions in case API is offline
const generateMockPredictions = () => {
  const groups: Record<string, string[]> = {};
  for (const [team, data] of Object.entries(MOCK_TEAMS)) {
    if (!groups[data.group]) groups[data.group] = [];
    groups[data.group].push(team);
  }
  
  const predictions: any[] = [];
  let mId = 1;
  const groupLetters = Object.keys(groups).sort();
  
  // Predict outcomes heuristically for mock
  const getHeuristicProbs = (h: string, a: string) => {
    // Simple ELO-like weights for mock predictions
    const weights: Record<string, number> = {
      "Argentina": 90, "Brazil": 88, "France": 87, "England": 85, "Spain": 84, "Belgium": 82, "Portugal": 82, "Netherlands": 81, "Croatia": 79, "Uruguay": 78,
      "Germany": 77, "Morocco": 76, "Switzerland": 74, "Colombia": 74, "United States": 73, "Japan": 72, "South Korea": 70, "Senegal": 69, "Austria": 68,
      "Ecuador": 68, "Norway": 67, "Australia": 65, "Türkiye": 65, "Sweden": 65, "Ivory Coast": 64, "Algeria": 63, "Tunisia": 62, "Egypt": 62, "Czechia": 61,
      "Bosnia and Herzegovina": 60, "Uzbekistan": 59, "Ghana": 58, "South Africa": 57, "Saudi Arabia": 56, "Qatar": 55, "Canada": 55, "Iraq": 54, "DR Congo": 52,
      "Panama": 51, "New Zealand": 50, "Curaçao": 46, "Haiti": 45, "Jordan": 44, "Cape Verde": 43
    };
    
    const wH = weights[h] || 50;
    const wA = weights[a] || 50;
    
    let homeWin = 0.35 + (wH - wA) * 0.008;
    let awayWin = 0.35 + (wA - wH) * 0.008;
    let draw = 0.30 - Math.abs(wH - wA) * 0.002;
    
    // Bounds check
    homeWin = Math.max(0.1, Math.min(0.85, homeWin));
    awayWin = Math.max(0.1, Math.min(0.85, awayWin));
    draw = 1.0 - homeWin - awayWin;
    
    // Exact scoreline heuristic
    let hG = 1, aG = 1;
    if (homeWin > awayWin + 0.15) {
      hG = homeWin > 0.6 ? 3 : 2;
      aG = awayWin > 0.25 ? 1 : 0;
    } else if (awayWin > homeWin + 0.15) {
      aG = awayWin > 0.6 ? 3 : 2;
      hG = homeWin > 0.25 ? 1 : 0;
    } else {
      hG = Math.random() > 0.5 ? 1 : 0;
      aG = hG;
    }
    
    return {
      home_win_prob: Math.round(homeWin * 1000) / 10,
      draw_prob: Math.round(draw * 1000) / 10,
      away_win_prob: Math.round(awayWin * 1000) / 10,
      pred_home_score: hG,
      pred_away_score: aG,
      confidence: Math.round(Math.abs(homeWin - awayWin) * 1000) / 10
    };
  };

  // Round 1
  for (const grp of groupLetters) {
    const teams = groups[grp];
    const dateStr = `2026-06-${String(11 + groupLetters.indexOf(grp)).padStart(2, '0')}`;
    
    // Match 1
    const p1 = getHeuristicProbs(teams[0], teams[1]);
    predictions.push({
      match_id: `M-G-${String(mId).padStart(2, '0')}`, stage: "group stage", date: dateStr,
      home_team: teams[0], away_team: teams[1], group: grp, ...p1
    });
    mId++;
    
    // Match 2
    const p2 = getHeuristicProbs(teams[2], teams[3]);
    predictions.push({
      match_id: `M-G-${String(mId).padStart(2, '0')}`, stage: "group stage", date: dateStr,
      home_team: teams[2], away_team: teams[3], group: grp, ...p2
    });
    mId++;
  }
  
  // Add Round 2 & Round 3
  for (const grp of groupLetters) {
    const teams = groups[grp];
    const date2 = `2026-06-${23 + (groupLetters.indexOf(grp) % 3)}`;
    const date3 = groupLetters.indexOf(grp) < 6 ? "2026-06-26" : "2026-06-27";
    
    // Match 3
    const p3 = getHeuristicProbs(teams[0], teams[2]);
    predictions.push({
      match_id: `M-G-${String(mId).padStart(2, '0')}`, stage: "group stage", date: date2,
      home_team: teams[0], away_team: teams[2], group: grp, ...p3
    });
    mId++;
    
    // Match 4
    const p4 = getHeuristicProbs(teams[1], teams[3]);
    predictions.push({
      match_id: `M-G-${String(mId).padStart(2, '0')}`, stage: "group stage", date: date2,
      home_team: teams[1], away_team: teams[3], group: grp, ...p4
    });
    mId++;
    
    // Match 5
    const p5 = getHeuristicProbs(teams[0], teams[3]);
    predictions.push({
      match_id: `M-G-${String(mId).padStart(2, '0')}`, stage: "group stage", date: date3,
      home_team: teams[0], away_team: teams[3], group: grp, ...p5
    });
    mId++;
    
    // Match 6
    const p6 = getHeuristicProbs(teams[1], teams[2]);
    predictions.push({
      match_id: `M-G-${String(mId).padStart(2, '0')}`, stage: "group stage", date: date3,
      home_team: teams[1], away_team: teams[2], group: grp, ...p6
    });
    mId++;
  }
  return predictions;
};

const HOST_CITIES = [
  { city: "Los Angeles, USA", stadium: "SoFi Stadium" },
  { city: "Mexico City, MEX", stadium: "Estadio Azteca" },
  { city: "Toronto, CAN", stadium: "BMO Field" },
  { city: "New York/NJ, USA", stadium: "MetLife Stadium" },
  { city: "Dallas, USA", stadium: "AT&T Stadium" },
  { city: "Miami, USA", stadium: "Hard Rock Stadium" },
  { city: "Vancouver, CAN", stadium: "BC Place" },
  { city: "Guadalajara, MEX", stadium: "Estadio Akron" },
  { city: "Seattle, USA", stadium: "Lumen Field" },
  { city: "Monterrey, MEX", stadium: "Estadio BBVA" },
  { city: "Atlanta, USA", stadium: "Mercedes-Benz Stadium" },
  { city: "San Francisco, USA", stadium: "Levi's Stadium" }
];

const getVenueDetails = (matchId: string) => {
  let hash = 0;
  for (let i = 0; i < matchId.length; i++) {
    hash = matchId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % HOST_CITIES.length;
  return HOST_CITIES[idx];
};

export default function Predictions() {
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [backendActive, setBackendActive] = useState(false);

  const getFlagUrl = (teamName: string) => {
    const code = MOCK_TEAMS[teamName]?.flag || "un";
    return `https://flagcdn.com/w40/${code}.png`;
  };

  const getFifaCode = (teamName: string) => {
    return MOCK_TEAMS[teamName]?.code || teamName.slice(0, 3).toUpperCase();
  };

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/predictions");
        if (res.ok) {
          const data = await res.json();
          // Enrich with group details from lookup
          const enriched = data.map((m: any) => ({
            ...m,
            group: MOCK_TEAMS[m.home_team]?.group || "A"
          }));
          setAllMatches(enriched);
          setBackendActive(true);
        } else {
          throw new Error("API error response");
        }
      } catch (err) {
        console.log("Loading fallback predictions.");
        const fallback = generateMockPredictions();
        setAllMatches(fallback);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPredictions();
  }, []);

  useEffect(() => {
    let result = allMatches;
    
    if (selectedGroup !== "ALL") {
      result = result.filter(m => m.group === selectedGroup);
    }
    
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(m => 
        m.home_team.toLowerCase().includes(q) || 
        m.away_team.toLowerCase().includes(q) ||
        getFifaCode(m.home_team).toLowerCase().includes(q) ||
        getFifaCode(m.away_team).toLowerCase().includes(q)
      );
    }
    
    setFilteredMatches(result);
  }, [allMatches, selectedGroup, searchQuery]);

  const groupsList = ["ALL", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b-4 border-primary pb-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary font-source uppercase">
          Match Predictor Center
        </h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">
          ALL 72 WORLD CUP GROUP STAGE MATCH PREDICTIONS &nbsp;|&nbsp; ENSEMBLED PROBABILITIES
        </p>
      </div>

      {/* Filters & Search Control Panel */}
      <div className="space-y-4">
        {/* Search Bar & Stats */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search team name or code... (e.g. Mexico, USA, ARG)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition shadow-sm font-semibold text-slate-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded uppercase tracking-wider">
            Showing <span className="font-extrabold text-primary">{filteredMatches.length}</span> of {allMatches.length} Matches
          </div>
        </div>

        {/* Group Tabs */}
        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Filter className="w-4 h-4" />
            <span>Filter by Group:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {groupsList.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition ${
                  selectedGroup === g
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {g === "ALL" ? "ALL GROUPS" : `GROUP ${g}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm font-semibold animate-pulse">Running Monte Carlo algorithms...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMatches.map(match => (
            <div
              key={match.match_id}
              className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
            >
              {/* Card Top Header */}
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 font-mono">
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{match.date}</span>
                </span>
                <span className="text-slate-400 truncate max-w-[130px] hidden sm:inline-flex items-center space-x-1">
                  <span>📍 {getVenueDetails(match.match_id).stadium}</span>
                </span>
                <span className="bg-primary/5 text-primary px-2 py-0.5 rounded text-[9px]">
                  GROUP {match.group} &nbsp;|&nbsp; {match.match_id}
                </span>
              </div>

              {/* Match Scoreboard Row */}
              <div className="p-6 flex items-center justify-between">
                {/* Home Team */}
                <div className="flex items-center space-x-3 w-1/3">
                  <img
                    src={getFlagUrl(match.home_team)}
                    alt={match.home_team}
                    className="w-8 h-6 object-cover border border-slate-100 rounded"
                  />
                  <div className="leading-tight">
                    <p className="font-extrabold text-slate-800 text-base">{getFifaCode(match.home_team)}</p>
                    <p className="text-xxs text-slate-400 hidden sm:block truncate max-w-[80px]">{match.home_team}</p>
                  </div>
                </div>

                {/* Predicted Score Line */}
                <div className="text-center w-1/3 flex flex-col items-center">
                  <p className="text-xxs text-slate-400 font-bold uppercase tracking-widest">Predicted Score</p>
                  <p className="text-3xl font-black text-primary font-source mt-1">
                    {match.pred_home_score} - {match.pred_away_score}
                  </p>
                  <span className="text-[10px] bg-accent/10 text-accent font-bold px-2 py-0.5 rounded mt-1.5 uppercase tracking-wider">
                    {match.confidence}% Conf
                  </span>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-end space-x-3 w-1/3 text-right">
                  <div className="leading-tight">
                    <p className="font-extrabold text-slate-800 text-base">{getFifaCode(match.away_team)}</p>
                    <p className="text-xxs text-slate-400 hidden sm:block truncate max-w-[80px]">{match.away_team}</p>
                  </div>
                  <img
                    src={getFlagUrl(match.away_team)}
                    alt={match.away_team}
                    className="w-8 h-6 object-cover border border-slate-100 rounded"
                  />
                </div>
              </div>

              {/* Probabilities Graphic Bar */}
              <div className="px-6 pb-4 space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold font-mono text-slate-500">
                  <span>{match.home_team.slice(0, 3).toUpperCase()} WIN: {match.home_win_prob}%</span>
                  <span>DRAW: {match.draw_prob}%</span>
                  <span>{match.away_team.slice(0, 3).toUpperCase()} WIN: {match.away_win_prob}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden flex bg-slate-100">
                  <div style={{ width: `${match.home_win_prob}%` }} className="bg-primary h-full"></div>
                  <div style={{ width: `${match.draw_prob}%` }} className="bg-slate-300 h-full"></div>
                  <div style={{ width: `${match.away_win_prob}%` }} className="bg-accent h-full"></div>
                </div>
              </div>

              {/* Card Footer Detail Link */}
              <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-right">
                <Link
                  href={`/match/${match.match_id}`}
                  className="text-secondary hover:text-secondary/80 font-bold text-xs flex items-center justify-end space-x-1"
                >
                  <span>Analysis & Match Center</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
