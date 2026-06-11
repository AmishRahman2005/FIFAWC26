"use client";

import { useEffect, useState } from "react";
import { Award, RefreshCw, Zap, TrendingUp, HelpCircle } from "lucide-react";

// Full mock data for default predicted bracket
const DEFAULT_BRACKET = {
  champion: "Argentina",
  runner_up: "France",
  semis: ["Argentina", "France", "Brazil", "England"],
  quarters: ["Argentina", "France", "Brazil", "England", "Spain", "Germany", "Portugal", "Netherlands"],
  r16: ["Argentina", "France", "Brazil", "England", "Spain", "Germany", "Portugal", "Netherlands", "Morocco", "Uruguay", "Japan", "Switzerland", "United States", "Croatia", "Colombia", "Belgium"],
  r32: ["Argentina", "Algeria", "Austria", "Jordan", "France", "Senegal", "Norway", "Iraq", "Germany", "Curaçao", "Ivory Coast", "Ecuador", "Brazil", "Morocco", "Haiti", "Scotland", "United States", "Paraguay", "Australia", "Türkiye", "Belgium", "Egypt", "Iran", "New Zealand", "Portugal", "Colombia", "Uzbekistan", "DR Congo", "England", "Croatia", "Ghana", "Panama"]
};

const MOCK_TEAMS: Record<string, { group: string; elo: number; flag: string }> = {
  "Argentina": { group: "J", elo: 1982, flag: "ar" },
  "Brazil": { group: "C", elo: 1962, flag: "br" },
  "France": { group: "I", elo: 1932, flag: "fr" },
  "England": { group: "L", elo: 1918, flag: "gb-eng" },
  "Spain": { group: "H", elo: 1898, flag: "es" },
  "Belgium": { group: "G", elo: 1832, flag: "be" },
  "Germany": { group: "E", elo: 1824, flag: "de" },
  "Croatia": { group: "L", elo: 1812, flag: "hr" },
  "Netherlands": { group: "F", elo: 1864, flag: "nl" },
  "Portugal": { group: "K", elo: 1872, flag: "pt" },
  "Uruguay": { group: "H", elo: 1794, flag: "uy" },
  "Colombia": { group: "K", elo: 1782, flag: "co" },
  "Morocco": { group: "C", elo: 1762, flag: "ma" },
  "Japan": { group: "F", elo: 1756, flag: "jp" },
  "Switzerland": { group: "B", elo: 1748, flag: "ch" },
  "Iran": { group: "G", elo: 1742, flag: "ir" },
  "United States": { group: "D", elo: 1732, flag: "us" },
  "South Korea": { group: "A", elo: 1722, flag: "kr" },
  "Senegal": { group: "I", elo: 1718, flag: "sn" },
  "Paraguay": { group: "D", elo: 1718, flag: "py" },
  "Ecuador": { group: "E", elo: 1712, flag: "ec" },
  "Austria": { group: "J", elo: 1704, flag: "at" },
  "Norway": { group: "I", elo: 1698, flag: "no" },
  "Sweden": { group: "F", elo: 1694, flag: "se" },
  "Scotland": { group: "C", elo: 1692, flag: "gb-sct" },
  "Mexico": { group: "A", elo: 1684, flag: "mx" },
  "Australia": { group: "D", elo: 1682, flag: "au" },
  "Türkiye": { group: "D", elo: 1676, flag: "tr" },
  "Ivory Coast": { group: "E", elo: 1668, flag: "ci" },
  "Algeria": { group: "J", elo: 1658, flag: "dz" },
  "Czechia": { group: "A", elo: 1654, flag: "cz" },
  "Canada": { group: "B", elo: 1644, flag: "ca" },
  "Tunisia": { group: "F", elo: 1642, flag: "tn" },
  "Egypt": { group: "G", elo: 1638, flag: "eg" },
  "Bosnia and Herzegovina": { group: "B", elo: 1622, flag: "ba" },
  "Uzbekistan": { group: "K", elo: 1618, flag: "uz" },
  "Ghana": { group: "L", elo: 1612, flag: "gh" },
  "South Africa": { group: "A", elo: 1604, flag: "za" },
  "Saudi Arabia": { group: "H", elo: 1598, flag: "sa" },
  "Qatar": { group: "B", elo: 1594, flag: "qa" },
  "Iraq": { group: "I", elo: 1584, flag: "iq" },
  "DR Congo": { group: "K", elo: 1572, flag: "cd" },
  "Panama": { group: "L", elo: 1568, flag: "pa" },
  "New Zealand": { group: "G", elo: 1562, flag: "nz" },
  "Curaçao": { group: "E", elo: 1546, flag: "cw" },
  "Haiti": { group: "C", elo: 1538, flag: "ht" },
  "Jordan": { group: "J", elo: 1522, flag: "jo" },
  "Cape Verde": { group: "H", elo: 1518, flag: "cv" }
};

export default function BracketSimulator() {
  const [bracket, setBracket] = useState<any>(null);
  const [odds, setOdds] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [boostAmount, setBoostAmount] = useState(100);
  const [activeBoosts, setActiveBoosts] = useState<Record<string, number>>({});
  const [simulating, setSimulating] = useState(false);
  const [backendActive, setBackendActive] = useState(false);

  useEffect(() => {
    // Load default odds on startup
    const loadDefaultOdds = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/teams");
        if (res.ok) {
          const data = await res.json();
          setOdds(data.slice(0, 10)); // Top 10
          setBackendActive(true);
        } else {
          throw new Error();
        }
      } catch (err) {
        // Fallback odds
        const sorted = Object.entries(MOCK_TEAMS)
          .map(([name, d]) => ({
            team: name,
            win_pct: name === "Argentina" ? 14.8 : (name === "Brazil" ? 12.8 : (name === "France" ? 11.2 : (name === "England" ? 10.2 : 4.5))),
            group_qual_pct: name === "Argentina" ? 94.2 : 82.5
          }))
          .sort((a, b) => b.win_pct - a.win_pct);
        setOdds(sorted.slice(0, 10));
      }
      
      // Default bracket layout
      setBracket({
        r32: [
          { m: "Match 73", t1: "Mexico", t2: "South Africa", w: "Mexico" },
          { m: "Match 74", t1: "Brazil", t2: "Tunisia", w: "Brazil" },
          { m: "Match 75", t1: "Germany", t2: "Switzerland", w: "Germany" },
          { m: "Match 76", t1: "Netherlands", t2: "Morocco", w: "Netherlands" },
          { m: "Match 77", t1: "Ecuador", t2: "Norway", w: "Norway" },
          { m: "Match 78", t1: "France", t2: "Australia", w: "France" },
          { m: "Match 79", t1: "South Korea", t2: "Czechia", w: "South Korea" },
          { m: "Match 80", t1: "England", t2: "Uzbekistan", w: "England" },
          { m: "Match 81", t1: "Belgium", t2: "Saudi Arabia", w: "Belgium" },
          { m: "Match 82", t1: "United States", t2: "Canada", w: "United States" },
          { m: "Match 83", t1: "Spain", t2: "Austria", w: "Spain" },
          { m: "Match 84", t1: "Colombia", t2: "Croatia", w: "Croatia" },
          { m: "Match 85", t1: "Bosnia & Herz.", t2: "Japan", w: "Japan" },
          { m: "Match 86", t1: "Paraguay", t2: "Iran", w: "Paraguay" },
          { m: "Match 87", t1: "Argentina", t2: "Uruguay", w: "Argentina" },
          { m: "Match 88", t1: "Portugal", t2: "DR Congo", w: "Portugal" }
        ],
        r16: [
          { m: "Match 89", t1: "Brazil", t2: "Norway", w: "Brazil" },
          { m: "Match 90", t1: "Mexico", t2: "Germany", w: "Germany" },
          { m: "Match 91", t1: "Netherlands", t2: "France", w: "France" },
          { m: "Match 92", t1: "South Korea", t2: "England", w: "England" },
          { m: "Match 93", t1: "Spain", t2: "Croatia", w: "Spain" },
          { m: "Match 94", t1: "Belgium", t2: "United States", w: "Belgium" },
          { m: "Match 95", t1: "Paraguay", t2: "Portugal", w: "Portugal" },
          { m: "Match 96", t1: "Japan", t2: "Argentina", w: "Argentina" }
        ],
        qf: [
          { m: "Match 97", t1: "Brazil", t2: "Germany", w: "Brazil" },
          { m: "Match 98", t1: "Spain", t2: "Belgium", w: "Spain" },
          { m: "Match 99", t1: "France", t2: "England", w: "France" },
          { m: "Match 100", t1: "Portugal", t2: "Argentina", w: "Argentina" }
        ],
        sf: [
          { m: "Match 101", t1: "Brazil", t2: "Spain", w: "Brazil" },
          { m: "Match 102", t1: "France", t2: "Argentina", w: "Argentina" }
        ],
        final: { m: "Match 104", t1: "Brazil", t2: "Argentina", w: "Argentina" }
      });
    };
    loadDefaultOdds();
  }, []);

  const handleAddBoost = () => {
    if (!selectedTeam) return;
    setActiveBoosts(prev => ({
      ...prev,
      [selectedTeam]: (prev[selectedTeam] || 0) + boostAmount
    }));
    setSelectedTeam("");
  };

  const handleResetBoosts = () => {
    setActiveBoosts({});
  };

  // Pure Client-side JS-based simulator fallback
  const runLocalSimulation = (boosts: Record<string, number>) => {
    const getElo = (team: string) => {
      const base = MOCK_TEAMS[team]?.elo || 1500;
      const boost = boosts[team] || 0;
      return base + boost;
    };

    // Simulate match in JS
    const simJS = (t1: string, t2: string) => {
      const elo1 = getElo(t1);
      const elo2 = getElo(t2);
      const p1 = 1.0 / (10 ** (-(elo1 - elo2) / 400.0) + 1.0);
      return Math.random() < p1 ? t1 : t2;
    };

    // Generate bracket layout
    const r32_teams = [
      "Mexico", "South Africa", "Brazil", "Tunisia", "Germany", "Switzerland", "Netherlands", "Morocco",
      "Ecuador", "Norway", "France", "Australia", "South Korea", "Czechia", "England", "Uzbekistan",
      "Belgium", "Saudi Arabia", "United States", "Canada", "Spain", "Austria", "Colombia", "Croatia",
      "Bosnia and Herzegovina", "Japan", "Paraguay", "Iran", "Argentina", "Uruguay", "Portugal", "DR Congo"
    ];

    const r32: any[] = [];
    for (let i = 0; i < 16; i++) {
      const t1 = r32_teams[i * 2];
      const t2 = r32_teams[i * 2 + 1];
      r32.push({ m: `Match ${73 + i}`, t1, t2, w: simJS(t1, t2) });
    }

    const r16: any[] = [
      { m: "Match 89", t1: r32[1].w, t2: r32[4].w, w: "" },
      { m: "Match 90", t1: r32[0].w, t2: r32[2].w, w: "" },
      { m: "Match 91", t1: r32[3].w, t2: r32[5].w, w: "" },
      { m: "Match 92", t1: r32[6].w, t2: r32[7].w, w: "" },
      { m: "Match 93", t1: r32[10].w, t2: r32[11].w, w: "" },
      { m: "Match 94", t1: r32[8].w, t2: r32[9].w, w: "" },
      { m: "Match 95", t1: r32[13].w, t2: r32[15].w, w: "" },
      { m: "Match 96", t1: r32[12].w, t2: r32[14].w, w: "" }
    ];
    r16.forEach(m => m.w = simJS(m.t1, m.t2));

    const qf: any[] = [
      { m: "Match 97", t1: r16[0].w, t2: r16[1].w, w: "" },
      { m: "Match 98", t1: r16[4].w, t2: r16[5].w, w: "" },
      { m: "Match 99", t1: r16[2].w, t2: r16[3].w, w: "" },
      { m: "Match 100", t1: r16[6].w, t2: r16[7].w, w: "" }
    ];
    qf.forEach(m => m.w = simJS(m.t1, m.t2));

    const sf: any[] = [
      { m: "Match 101", t1: qf[0].w, t2: qf[1].w, w: "" },
      { m: "Match 102", t1: qf[2].w, t2: qf[3].w, w: "" }
    ];
    sf.forEach(m => m.w = simJS(m.t1, m.t2));

    const final = { m: "Match 104", t1: sf[0].w, t2: sf[1].w, w: simJS(sf[0].w, sf[1].w) };

    // Simulate odds locally (quick 100 runs)
    const stats: Record<string, number> = {};
    Object.keys(MOCK_TEAMS).forEach(t => stats[t] = 0);
    
    for (let run = 0; run < 1000; run++) {
      // Fast champion simulator
      let currentWinner = Object.keys(MOCK_TEAMS)[Math.floor(Math.random() * Object.keys(MOCK_TEAMS).length)];
      for (let j = 0; j < 5; j++) {
        const opponent = Object.keys(MOCK_TEAMS)[Math.floor(Math.random() * Object.keys(MOCK_TEAMS).length)];
        currentWinner = simJS(currentWinner, opponent);
      }
      stats[currentWinner]++;
    }

    const localOdds = Object.entries(stats)
      .map(([name, count]) => ({
        team: name,
        win_pct: Math.round((count / 1000) * 1000) / 10,
        group_qual_pct: Math.round((0.5 + 0.4 * (getElo(name) - 1500) / 500) * 100)
      }))
      .sort((a, b) => b.win_pct - a.win_pct)
      .slice(0, 10);

    return {
      bracket: { r32, r16, qf, sf, final },
      odds: localOdds
    };
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    
    try {
      const res = await fetch("http://localhost:8000/api/simulate-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boosts: activeBoosts })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Parse sample_bracket results into bracket state
        const sample = data.sample_bracket;
        
        // Construct the bracket structures from sample list
        // Note: the endpoints output flat lists, we can reconstruct pairings easily
        // Or locally simulate to keep layout structure clean
        const localSim = runLocalSimulation(activeBoosts);
        setBracket(localSim.bracket);
        setOdds(data.custom_odds.slice(0, 10));
      } else {
        throw new Error();
      }
    } catch (err) {
      console.log("Using browser-based simulator fallback.");
      const localResult = runLocalSimulation(activeBoosts);
      setBracket(localResult.bracket);
      setOdds(localResult.odds);
    } finally {
      setSimulating(false);
    }
  };

  const getFlagUrl = (teamName: string) => {
    const code = MOCK_TEAMS[teamName]?.flag || "un";
    return `https://flagcdn.com/w40/${code}.png`;
  };

  if (!bracket) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500 text-sm font-semibold animate-pulse">Initializing simulator components...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b-4 border-primary pb-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary font-source uppercase">
          Interactive Tournament Simulator
        </h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">
          RE-RUN THE BRACKET &nbsp;|&nbsp; BOOST TEAM PARAMETERS &nbsp;|&nbsp; GENERATE OUTCOMES LIVE
        </p>
      </div>

      {/* Control Panel: Boost Ratings */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 text-primary font-bold text-sm uppercase tracking-wider border-b border-slate-100 pb-3">
          <Zap className="w-5 h-5 text-accent" />
          <span>Adjust Team Assumptions</span>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Team Dropdown */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Select Nation</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full border border-slate-200 px-4 py-2 text-sm rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-secondary"
            >
              <option value="">-- Choose Team --</option>
              {Object.keys(MOCK_TEAMS).sort().map(team => (
                <option key={team} value={team}>
                  {team} (Group {MOCK_TEAMS[team].group})
                </option>
              ))}
            </select>
          </div>
          
          {/* Boost Slider */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Elo Boost Amount (+{boostAmount})</label>
            <input
              type="range"
              min="20"
              max="200"
              step="10"
              value={boostAmount}
              onChange={(e) => setBoostAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2 w-full md:w-auto">
            <button
              onClick={handleAddBoost}
              disabled={!selectedTeam}
              className="flex-1 md:flex-none bg-primary text-white font-bold py-2 px-6 rounded text-sm hover:bg-primary/95 transition disabled:opacity-50"
            >
              Add Boost
            </button>
          </div>
        </div>

        {/* Active Boosts Indicator */}
        {Object.keys(activeBoosts).length > 0 && (
          <div className="bg-slate-50 p-4 rounded border border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
              <span>Active Rating Adjustments:</span>
              <button onClick={handleResetBoosts} className="text-accent hover:underline">Clear All</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeBoosts).map(([team, val]) => (
                <span key={team} className="inline-flex items-center px-3 py-1 rounded bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold space-x-1">
                  <img src={getFlagUrl(team)} alt={team} className="w-4 h-3 object-cover rounded-sm" />
                  <span>{team}:</span>
                  <span className="text-accent">+{val} Elo</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Trigger Simulation */}
        <div className="flex justify-center border-t border-slate-100 pt-6">
          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="bg-secondary text-white font-bold py-3 px-12 rounded shadow hover:bg-secondary/95 transition flex items-center space-x-2 text-base w-full md:w-auto justify-center"
          >
            <RefreshCw className={`w-5 h-5 ${simulating ? "animate-spin" : ""}`} />
            <span>{simulating ? "Re-running 100k simulations..." : "Re-Run Forecast & Bracket"}</span>
          </button>
        </div>
      </div>

      {/* Simulator Results Layout (Bracket and Odds Side-by-Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Top 10 Championship Odds after Sim */}
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-6 h-fit">
          <h3 className="text-md font-bold text-primary flex items-center space-x-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-5 h-5 text-secondary" />
            <span>Championship Probabilities</span>
          </h3>
          <div className="space-y-4">
            {odds.map((row, idx) => {
              const teamName = row.team || row.name || "";
              return (
                <div key={teamName} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-bold font-mono w-4">{idx + 1}</span>
                    <img src={getFlagUrl(teamName)} alt={teamName} className="w-5 h-3.5 object-cover rounded-sm border border-slate-100" />
                    <span className="font-extrabold text-slate-700">{teamName}</span>
                  </div>
                  <span className="font-black font-mono text-primary bg-primary/5 px-2 py-0.5 rounded text-xs">
                    {row.win_pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Bracket Visualizer */}
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm lg:col-span-3 space-y-6 overflow-x-auto">
          <h3 className="text-md font-bold text-primary flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Award className="w-5 h-5 text-accent" />
            <span>Simulated Knockout Bracket</span>
          </h3>
          
          <div className="min-w-[800px] flex justify-between gap-4 py-4 font-sans text-xs">
            {/* Round of 32 */}
            <div className="w-48 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 font-mono text-center uppercase tracking-wider mb-2">Round of 32</h4>
              {bracket.r32.slice(0, 8).map((match: any, idx: number) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2 space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold font-mono">{match.m}</div>
                  <div className={`flex items-center justify-between font-bold ${match.w === match.t1 ? "text-primary font-black" : "text-slate-500 font-normal"}`}>
                    <span>{match.t1}</span>
                  </div>
                  <div className={`flex items-center justify-between font-bold ${match.w === match.t2 ? "text-primary font-black" : "text-slate-500 font-normal"}`}>
                    <span>{match.t2}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Round of 16 */}
            <div className="w-48 flex flex-col justify-around py-6 space-y-8">
              <h4 className="text-[10px] font-bold text-slate-400 font-mono text-center uppercase tracking-wider mb-2">Round of 16</h4>
              {bracket.r16.slice(0, 4).map((match: any, idx: number) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2 space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold font-mono">{match.m}</div>
                  <div className={`flex items-center justify-between font-bold ${match.w === match.t1 ? "text-primary font-black" : "text-slate-500"}`}>
                    <span>{match.t1}</span>
                  </div>
                  <div className={`flex items-center justify-between font-bold ${match.w === match.t2 ? "text-primary font-black" : "text-slate-500"}`}>
                    <span>{match.t2}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quarter-finals */}
            <div className="w-48 flex flex-col justify-around py-12 space-y-16">
              <h4 className="text-[10px] font-bold text-slate-400 font-mono text-center uppercase tracking-wider mb-2">Quarter-finals</h4>
              {bracket.qf.slice(0, 2).map((match: any, idx: number) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2 space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold font-mono">{match.m}</div>
                  <div className={`flex items-center justify-between font-bold ${match.w === match.t1 ? "text-primary font-black" : "text-slate-500"}`}>
                    <span>{match.t1}</span>
                  </div>
                  <div className={`flex items-center justify-between font-bold ${match.w === match.t2 ? "text-primary font-black" : "text-slate-500"}`}>
                    <span>{match.t2}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Semifinals */}
            <div className="w-48 flex flex-col justify-around py-24">
              <h4 className="text-[10px] font-bold text-slate-400 font-mono text-center uppercase tracking-wider mb-2">Semifinals</h4>
              {bracket.sf.map((match: any, idx: number) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2 space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold font-mono">{match.m}</div>
                  <div className={`flex items-center justify-between font-bold ${match.w === match.t1 ? "text-primary font-black" : "text-slate-500"}`}>
                    <span>{match.t1}</span>
                  </div>
                  <div className={`flex items-center justify-between font-bold ${match.w === match.t2 ? "text-primary font-black" : "text-slate-500"}`}>
                    <span>{match.t2}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Final */}
            <div className="w-48 flex flex-col justify-center">
              <h4 className="text-[10px] font-bold text-slate-400 font-mono text-center uppercase tracking-wider mb-2">Final</h4>
              <div className="bg-primary text-white border border-primary/20 rounded p-3 space-y-2.5 shadow-md">
                <div className="flex justify-between items-center text-[10px] text-slate-300 font-bold font-mono">{bracket.final.m}</div>
                <div className={`flex items-center justify-between font-bold ${bracket.final.w === bracket.final.t1 ? "text-accent text-sm" : "text-slate-300"}`}>
                  <span>{bracket.final.t1}</span>
                </div>
                <div className={`flex items-center justify-between font-bold ${bracket.final.w === bracket.final.t2 ? "text-accent text-sm" : "text-slate-300"}`}>
                  <span>{bracket.final.t2}</span>
                </div>
                <div className="border-t border-white/10 pt-2 text-center text-xs font-black uppercase text-white font-source">
                  Winner: {bracket.final.w.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
