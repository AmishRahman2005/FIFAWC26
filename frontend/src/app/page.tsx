"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, ShieldAlert, Award, Star, Flame, Calendar, Info } from "lucide-react";

// Robust mockup data for out-of-the-box fallback
const MOCK_SUMMARY = {
  champion: { name: "Argentina", probability: 14.8, code: "ARG", flag: "https://flagcdn.com/w40/ar.png", elo: 1982.5, off: 1184.2, def: 1142.1 },
  darkHorse: { name: "Morocco", probability: 5.6, code: "MAR", flag: "https://flagcdn.com/w40/ma.png", elo: 1762.3, off: 1045.6, def: 1084.2, factor: "Exceptional defensive solidity and transition speed" },
  dangerousTeam: { name: "France", probability: 11.2, code: "FRA", flag: "https://flagcdn.com/w40/fr.png", elo: 1932.1, off: 1215.3, def: 1104.5, factor: "Highest offensive parameter in Dixon-Coles model" },
  upsetAlert: { home: "United States", away: "Paraguay", upset_prob: 38.5, date: "June 14, 2026", details: "Paraguay's low-scoring style creates high draw/upset probability in Dixon-Coles projection." }
};

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

const MOCK_TICKER = [
  { match: "Mexico vs South Africa", date: "June 11", forecast: "Mexico 2-1", conf: 62 },
  { match: "Canada vs Qatar", date: "June 12", forecast: "Canada 2-0", conf: 70 },
  { match: "Brazil vs Scotland", date: "June 13", forecast: "Brazil 2-0", conf: 78 },
  { match: "United States vs Paraguay", date: "June 14", forecast: "US 1-1", conf: 52 },
  { match: "Germany vs Curaçao", date: "June 15", forecast: "Germany 3-0", conf: 85 }
];

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

const LEGENDS = [
  {
    id: "messigician",
    realName: "Lionel Messi",
    parodyName: "Lionel Messigician",
    nation: "Argentina",
    role: "Magician",
    stickerUrl: "/messi.webp",
    bio: "The Handballgentina legend is back for one last ride. Ready to conjure up one last trophy trick!",
    att: 1184,
    def: 1142,
    actionLabel: "Simulate ARG"
  },
  {
    id: "arrogantaldo",
    realName: "Cristiano Ronaldo",
    parodyName: "Cristiano Arrogantaldo",
    nation: "Portugal",
    role: "GOAT (Self)",
    stickerUrl: "/ronaldo.webp",
    bio: "The Portuguese superstar ready to shout SIUUU on North American turf and secure the spotlight.",
    att: 1152,
    def: 1085,
    actionLabel: "View Standings"
  },
  {
    id: "mmmboppe",
    realName: "Kylian Mbappé",
    parodyName: "Kylian MMMboppe",
    nation: "France",
    role: "Team Dictator",
    stickerUrl: "/mbappe.webp",
    bio: "The French captain who changes his mind like weather but dominates expected goals parameters.",
    att: 1215,
    def: 1104,
    actionLabel: "View Standings"
  },
  {
    id: "notaxmar",
    realName: "Neymar Jr",
    parodyName: "Notaxmar",
    nation: "Brazil",
    role: "Diving Winger",
    stickerUrl: "/neymar.webp",
    bio: "The Santos and Brazil legend. Watch out for those dramatic rolls in the box when model variance hits!",
    att: 1168,
    def: 1134,
    actionLabel: "View Standings"
  },
  {
    id: "hairland",
    realName: "Erling Haaland",
    parodyName: "Erling Hairland",
    nation: "Norway",
    role: "Cyborg Striker",
    stickerUrl: "/haaland.webp",
    bio: "The goal-scoring Norwegian machine (with mop-like hair). ELO parameters off the chart.",
    att: 1042,
    def: 1004,
    actionLabel: "View Standings"
  },
  {
    id: "hurrikane",
    realName: "Harry Kane",
    parodyName: "Hurri-Kane MBE",
    nation: "England",
    role: "Trophy Intolerant",
    stickerUrl: "/kane.webp",
    bio: "England's premier striker with a lisp. Statistically superior but historically trophy intolerant.",
    att: 1142,
    def: 1122,
    actionLabel: "View Standings"
  }
];

const CHAMPION_STICKERS: Record<string, { stickerUrl: string; name: string }> = {
  "Argentina": { stickerUrl: "/messi.webp", name: "LIONEL MESSIGICIAN 👑" },
  "Portugal": { stickerUrl: "/ronaldo.webp", name: "CRISTIANO ARROGANTALDO 🐐" },
  "France": { stickerUrl: "/mbappe.webp", name: "KYLIAN MMMBOPPE 👔" },
  "Brazil": { stickerUrl: "/neymar.webp", name: "NOTAXMAR 🤸‍♂️" },
  "Norway": { stickerUrl: "/haaland.webp", name: "ERLING HAIRLAND 🤖" },
  "England": { stickerUrl: "/kane.webp", name: "HURRI-KANE MBE 🚫🏆" },
  "Belgium": { stickerUrl: "/lukaku.webp", name: "ROMELU STORMZY 🎤" }
};

export default function Dashboard() {
  const [data, setData] = useState(MOCK_SUMMARY);
  const [ticker, setTicker] = useState(MOCK_TICKER);
  const [loading, setLoading] = useState(true);
  const [backendActive, setBackendActive] = useState(false);

  // New state variables for dynamic matches of the day
  const [todayMatches, setTodayMatches] = useState<any[]>([]);
  const [activeDateLabel, setActiveDateLabel] = useState("");
  const [daysUntilStart, setDaysUntilStart] = useState<number | null>(null);
  const [isPreTournament, setIsPreTournament] = useState(false);
  const [flagLookup, setFlagLookup] = useState<Record<string, string>>({});
  const [groupLookup, setGroupLookup] = useState<Record<string, string>>({});

  const getFlag = (teamName: string) => {
    return flagLookup[teamName] || `https://flagcdn.com/w40/un.png`;
  };

  const getGroup = (teamName: string) => {
    return groupLookup[teamName] || "A";
  };

  const generateMockPredictions = () => {
    const groups: Record<string, string[]> = {};
    for (const [team, data] of Object.entries(MOCK_TEAMS)) {
      if (!groups[data.group]) groups[data.group] = [];
      groups[data.group].push(team);
    }
    
    const predictions: any[] = [];
    let mId = 1;
    const groupLetters = Object.keys(groups).sort();
    
    const getHeuristicProbs = (h: string, a: string) => {
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
      
      homeWin = Math.max(0.1, Math.min(0.85, homeWin));
      awayWin = Math.max(0.1, Math.min(0.85, awayWin));
      draw = 1.0 - homeWin - awayWin;
      
      let hG = 1, aG = 1;
      if (homeWin > awayWin + 0.15) {
        hG = homeWin > 0.6 ? 2 : 1;
        aG = 0;
      } else if (awayWin > homeWin + 0.15) {
        aG = awayWin > 0.6 ? 2 : 1;
        hG = 0;
      } else {
        hG = 1;
        aG = 1;
      }
      
      return {
        home_win_prob: Math.round(homeWin * 100),
        draw_prob: Math.round(draw * 100),
        away_win_prob: Math.round(awayWin * 100),
        pred_home_score: hG,
        pred_away_score: aG,
        confidence: Math.round(Math.abs(homeWin - awayWin) * 100)
      };
    };

    for (const grp of groupLetters) {
      const teams = groups[grp];
      const dateStr = `2026-06-${String(11 + groupLetters.indexOf(grp)).padStart(2, '0')}`;
      
      const p1 = getHeuristicProbs(teams[0], teams[1]);
      predictions.push({
        match_id: `M-G-${String(mId).padStart(2, '0')}`, stage: "group stage", date: dateStr,
        home_team: teams[0], away_team: teams[1], group: grp, ...p1
      });
      mId++;
      
      const p2 = getHeuristicProbs(teams[2], teams[3]);
      predictions.push({
        match_id: `M-G-${String(mId).padStart(2, '0')}`, stage: "group stage", date: dateStr,
        home_team: teams[2], away_team: teams[3], group: grp, ...p2
      });
      mId++;
    }
    return predictions;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamsRes = await fetch("http://localhost:8000/api/teams");
        const matchesRes = await fetch("http://localhost:8000/api/predictions");
        
        if (teamsRes.ok && matchesRes.ok) {
          const teams = await teamsRes.json();
          const matches = await matchesRes.json();
          
          const sortedByWin = [...teams].sort((a, b) => b.win_pct - a.win_pct);
          const champion = sortedByWin[0];
          
          const sortedByElo = [...teams].sort((a, b) => b.elo - a.elo);
          const darkHorse = sortedByWin.find(t => {
            const eloRank = sortedByElo.findIndex(s => s.name === t.name);
            return eloRank > 10 && t.win_pct > 2.0;
          }) || sortedByWin[10];
          
          const sortedByOff = [...teams].sort((a, b) => b.off_rating - a.off_rating);
          const dangerousTeam = sortedByOff[0];
          
          setData({
            champion: {
              name: champion.name,
              probability: champion.win_pct,
              code: champion.code,
              flag: champion.flag,
              elo: champion.elo,
              off: champion.off_rating,
              def: champion.def_rating
            },
            darkHorse: {
              name: darkHorse.name,
              probability: darkHorse.win_pct,
              code: darkHorse.code,
              flag: darkHorse.flag,
              elo: darkHorse.elo,
              off: darkHorse.off_rating,
              def: darkHorse.def_rating,
              factor: "High ROI simulation projection outperforming standard Elo expectation."
            },
            dangerousTeam: {
              name: dangerousTeam.name,
              probability: dangerousTeam.win_pct,
              code: dangerousTeam.code,
              flag: dangerousTeam.flag,
              elo: dangerousTeam.elo,
              off: dangerousTeam.off_rating,
              def: dangerousTeam.def_rating,
              factor: "Leading the tournament in ensembled expected goals (xG)."
            },
            upsetAlert: {
              home: matches[3]?.home_team || "United States",
              away: matches[3]?.away_team || "Paraguay",
              upset_prob: matches[3]?.away_win_prob || 38.5,
              date: matches[3]?.date || "June 14, 2026",
              details: matches[3]?.explanation || "Tactical variance in low-scoring simulation."
            }
          });
          
          const tickerData = matches.slice(0, 5).map((m: any) => ({
            match: `${m.home_team} vs ${m.away_team}`,
            date: m.date.slice(5),
            forecast: `${m.home_team.slice(0,3)} ${m.pred_home_score}-${m.pred_away_score} ${m.away_team.slice(0,3)}`,
            conf: m.confidence
          }));
          setTicker(tickerData);

          const flags: Record<string, string> = {};
          const groups: Record<string, string> = {};
          teams.forEach((t: any) => {
            flags[t.name] = t.flag;
            groups[t.name] = t.group_name;
          });
          setFlagLookup(flags);
          setGroupLookup(groups);

          // Today's matches calculation logic
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          const todayStr = `${yyyy}-${mm}-${dd}`;
          
          const wcStartDate = new Date("2026-06-11");
          const cleanToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const cleanStart = new Date(wcStartDate.getFullYear(), wcStartDate.getMonth(), wcStartDate.getDate());
          const diffTime = cleanStart.getTime() - cleanToday.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let targetDateStr = todayStr;
          let dateLabel = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
          
          if (diffDays > 0) {
            setIsPreTournament(true);
            setDaysUntilStart(diffDays);
            targetDateStr = "2026-06-11";
            dateLabel = "June 11, 2026";
          } else {
            setIsPreTournament(false);
            setDaysUntilStart(0);
          }
          
          setActiveDateLabel(dateLabel);
          
          const filtered = matches.filter((m: any) => m.date === targetDateStr);
          if (filtered.length > 0) {
            setTodayMatches(filtered);
          } else {
            const upcoming = matches.find((m: any) => m.date >= todayStr);
            if (upcoming) {
              const nextDate = upcoming.date;
              setTodayMatches(matches.filter((m: any) => m.date === nextDate));
              const parts = nextDate.split("-");
              const d = new Date(parts[0], parts[1] - 1, parts[2]);
              setActiveDateLabel(d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
            } else {
              const lastMatch = matches[matches.length - 1];
              if (lastMatch) {
                setTodayMatches(matches.filter((m: any) => m.date === lastMatch.date));
                setActiveDateLabel("Tournament Final");
              }
            }
          }
          
          setBackendActive(true);
        }
      } catch (err) {
        console.log("Backend offline or empty DB. Loading premium fallback dataset.", err);
        
        const fallbackMatches = generateMockPredictions();
        const fallbackFlags: Record<string, string> = {};
        const fallbackGroups: Record<string, string> = {};
        Object.entries(MOCK_TEAMS).forEach(([name, data]) => {
          fallbackFlags[name] = `https://flagcdn.com/w40/${data.flag}.png`;
          fallbackGroups[name] = data.group;
        });
        setFlagLookup(fallbackFlags);
        setGroupLookup(fallbackGroups);
        
        setIsPreTournament(true);
        setDaysUntilStart(5);
        setActiveDateLabel("June 11, 2026");
        setTodayMatches(fallbackMatches.filter((m: any) => m.date === "2026-06-11"));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Editorial Header Banner */}
      <div className="border-b-4 border-primary pb-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary font-source sm:text-5xl uppercase">
          FIFA World Cup 2026 Forecast
        </h1>
        <div className="mt-2 flex items-center justify-between text-sm text-slate-500 font-semibold">
          <p>LATEST FORECAST UPDATES &nbsp;|&nbsp; 100,000 MONTE CARLO SIMULATIONS</p>
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${backendActive ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            <span>{backendActive ? "LIVE DATA" : "SIMULATION PRESETS"}</span>
          </div>
        </div>
      </div>

      {/* Live Match Forecast Ticker */}
      <div className="bg-primary text-white overflow-hidden py-3 px-4 rounded shadow-sm border border-primary/20">
        <div className="flex space-x-8 animate-[marquee_20s_linear_infinite] whitespace-nowrap">
          {ticker.map((item, idx) => (
            <span key={idx} className="flex items-center space-x-3 text-xs font-bold font-mono">
              <span className="text-accent uppercase tracking-wider">{item.date}</span>
              <span className="text-slate-300">{item.match}:</span>
              <span className="text-white bg-slate-800 px-2 py-0.5 rounded">{item.forecast}</span>
              <span className="text-slate-400">({item.conf}% Conf)</span>
              {idx < ticker.length - 1 && <span className="text-slate-600">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Today's / Daily Match Forecasts Widget */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-secondary" />
              <span>{isPreTournament ? "WC Countdown & Preview" : "Daily Match Forecasts"}</span>
            </div>
            <h3 className="text-xl font-extrabold text-primary font-source mt-1 uppercase">
              {isPreTournament ? "Tournament Countdown" : `Matches for ${activeDateLabel}`}
            </h3>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full w-fit uppercase font-mono">
            {isPreTournament 
              ? `Starts in ${daysUntilStart} Days (${activeDateLabel})` 
              : "Dynamic Prediction Engine"
            }
          </div>
        </div>

        {todayMatches.length === 0 ? (
          <p className="text-slate-500 text-sm font-semibold py-4 text-center">
            No matches scheduled for today. Explore the predictions tab for the full calendar.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {todayMatches.map((m: any) => (
              <div key={m.match_id} className="border border-slate-100 rounded bg-slate-50/50 p-4 flex flex-col justify-between hover:border-slate-200 transition">
                {/* Header */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold font-mono border-b border-slate-100 pb-2 mb-3">
                  <span className="truncate max-w-[155px]">{m.match_id} &nbsp;|&nbsp; 📍 {getVenueDetails(m.match_id).city.split(",")[0]}</span>
                  <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded uppercase">GROUP {getGroup(m.home_team)}</span>
                </div>
                {/* Score / Teams */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <img src={getFlag(m.home_team)} alt={m.home_team} className="w-5 h-3.5 object-cover rounded-sm border border-slate-100" />
                      <span className="font-extrabold text-slate-700 truncate">{m.home_team}</span>
                    </div>
                    <span className="font-mono font-black text-primary text-base ml-2">{m.pred_home_score}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <img src={getFlag(m.away_team)} alt={m.away_team} className="w-5 h-3.5 object-cover rounded-sm border border-slate-100" />
                      <span className="font-extrabold text-slate-700 truncate">{m.away_team}</span>
                    </div>
                    <span className="font-mono font-black text-primary text-base ml-2">{m.pred_away_score}</span>
                  </div>
                </div>
                {/* Probabilities progress bar */}
                <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 font-mono">
                    <span>{m.home_team.slice(0,3).toUpperCase()} WIN: {m.home_win_prob}%</span>
                    <span>DRAW: {m.draw_prob}%</span>
                    <span>{m.away_team.slice(0,3).toUpperCase()} WIN: {m.away_win_prob}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden flex bg-slate-200">
                    <div style={{ width: `${m.home_win_prob}%` }} className="bg-primary h-full"></div>
                    <div style={{ width: `${m.draw_prob}%` }} className="bg-slate-300 h-full"></div>
                    <div style={{ width: `${m.away_win_prob}%` }} className="bg-accent h-full"></div>
                  </div>
                </div>
                {/* Details link */}
                <Link href={`/match/${m.match_id}`} className="text-secondary hover:text-secondary/80 text-[10px] font-bold mt-4 pt-2 border-t border-slate-100 flex items-center justify-end space-x-1">
                  <span>Match Analysis</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Champion Spotlight */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-3">
        <div className="p-8 md:col-span-2 flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div>
            <div className="flex items-center space-x-2 text-accent font-bold text-xs uppercase tracking-widest">
              <Award className="w-4 h-4" />
              <span>Predicted Champion</span>
            </div>
            <h2 className="text-5xl font-extrabold text-primary tracking-tight font-source mt-2 flex items-center space-x-4">
              <img
                src={data.champion.flag}
                alt={data.champion.name}
                className="w-12 h-8 object-cover border border-slate-200 rounded shadow-sm"
              />
              <span>{data.champion.name.toUpperCase()}</span>
            </h2>
            <p className="text-slate-600 text-sm mt-4 leading-relaxed max-w-xl pr-0 md:pr-24">
              Our multi-layer ensembled engine ranks {data.champion.name} as the highest probability winner for 2026. 
              With an overall Elo of {data.champion.elo.toFixed(1)}, the ensembled models highlight their compact 
              defense (Defensive Elo: {data.champion.def.toFixed(1)}) and squad depth as the decisive factors.
            </p>
          </div>
          {/* Dynamic 442oons Champion Sticker */}
          {CHAMPION_STICKERS[data.champion.name] && (
            <div className="absolute right-6 bottom-4 w-24 md:w-28 h-auto opacity-95 hover:scale-105 transition duration-300 pointer-events-none md:pointer-events-auto hidden md:flex flex-col items-center">
              <img
                src={CHAMPION_STICKERS[data.champion.name].stickerUrl}
                alt={`${CHAMPION_STICKERS[data.champion.name].name} Sticker`}
                className="w-full h-auto drop-shadow-md"
              />
              <span className="block text-center text-[8px] font-black text-primary font-mono mt-1 tracking-wider bg-slate-100 px-1 py-0.5 rounded border border-slate-200 shadow-xs">
                {CHAMPION_STICKERS[data.champion.name].name}
              </span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Championship Odds</p>
              <p className="text-2xl font-black text-primary mt-1">{data.champion.probability}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Offensive Rating</p>
              <p className="text-2xl font-black text-slate-700 mt-1">{data.champion.off.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Defensive Rating</p>
              <p className="text-2xl font-black text-slate-700 mt-1">{data.champion.def.toFixed(0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 p-8 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-center items-center text-center space-y-4">
          <div className="rounded-full bg-primary/5 p-4 border border-primary/10">
            <TrendingUp className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-primary">Simulate the Bracket</h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Run custom tournament simulations with boosted team parameters or explore interactive Round of 32 advancement branches.
          </p>
          <Link
            href="/simulator"
            className="w-full bg-secondary hover:bg-secondary/95 text-white font-bold py-2.5 px-4 rounded text-sm shadow transition text-center"
          >
            Launch Simulator
          </Link>
        </div>
      </div>

      {/* 442oons Legends Corner */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Award className="w-4 h-4 text-accent" />
            <span>442oons Legends Corner</span>
          </div>
          <h3 className="text-xl font-extrabold text-primary font-source mt-1 uppercase">
            Tournament Icon Spotlights
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {LEGENDS.map((legend) => (
            <div
              key={legend.id}
              className="border border-slate-100 rounded bg-slate-50/50 p-5 flex flex-col justify-between hover:border-slate-200 hover:shadow-md transition duration-300 relative group overflow-hidden"
            >
              {/* Floating Sticker Background Glow */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition duration-300"></div>
              
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-black text-primary font-source uppercase tracking-tight">
                      {legend.parodyName}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold font-mono tracking-widest uppercase">
                      {legend.realName} &nbsp;|&nbsp; {legend.nation}
                    </p>
                  </div>
                  <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                    {legend.role}
                  </span>
                </div>

                {/* Caricature and Bio */}
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-20 flex-shrink-0 relative overflow-hidden bg-white border border-slate-200 rounded p-1 shadow-sm flex items-center justify-center bg-slate-50">
                    <img
                      src={legend.stickerUrl}
                      alt={legend.parodyName}
                      className="max-w-full max-h-full object-contain group-hover:scale-110 transition duration-300"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold italic">
                    "{legend.bio}"
                  </p>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100/80 flex items-center justify-between z-10">
                <div className="flex space-x-3 text-[10px] font-bold font-mono text-slate-500">
                  <span>ATT: <span className="text-emerald-600 font-black">{legend.att}</span></span>
                  <span>DEF: <span className="text-indigo-600 font-black">{legend.def}</span></span>
                </div>
                <Link
                  href={legend.id === "messigician" ? "/simulator" : `/rankings`}
                  className="text-secondary hover:text-secondary/80 text-[10px] font-bold flex items-center space-x-1 uppercase tracking-wider"
                >
                  <span>{legend.actionLabel}</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid of Widgets (Dark Horse, Most Dangerous, Upset Alerts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dark Horse Index */}
        <div className="bg-white border border-slate-200 rounded p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-widest">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Dark Horse Spotlight</span>
            </div>
            <h3 className="text-2xl font-extrabold text-primary font-source mt-2 flex items-center space-x-2">
              <img
                src={data.darkHorse.flag}
                alt={data.darkHorse.name}
                className="w-7 h-5 object-cover border border-slate-100 rounded"
              />
              <span>{data.darkHorse.name}</span>
            </h3>
            <p className="text-slate-600 text-xs mt-3 leading-relaxed">
              {data.darkHorse.factor}. An ensembled win probability of {data.darkHorse.probability}% places them as the highest value underdog.
            </p>
          </div>
          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase">Elo Rating: {data.darkHorse.elo.toFixed(0)}</span>
            <Link href={`/rankings`} className="text-secondary font-bold hover:underline">
              View Rankings &rarr;
            </Link>
          </div>
        </div>

        {/* Most Dangerous Team (Offensive focus) */}
        <div className="bg-white border border-slate-200 rounded p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-widest">
              <Flame className="w-4 h-4 text-accent fill-accent" />
              <span>Most Dangerous Team</span>
            </div>
            <h3 className="text-2xl font-extrabold text-primary font-source mt-2 flex items-center space-x-2">
              <img
                src={data.dangerousTeam.flag}
                alt={data.dangerousTeam.name}
                className="w-7 h-5 object-cover border border-slate-100 rounded"
              />
              <span>{data.dangerousTeam.name}</span>
            </h3>
            <p className="text-slate-600 text-xs mt-3 leading-relaxed">
              {data.dangerousTeam.factor}. Their Dixon-Coles attack parameters suggest explosive goalscoring potentials in ensembled matchups.
            </p>
          </div>
          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase">Attack Elo: {data.dangerousTeam.off.toFixed(0)}</span>
            <Link href="/analytics" className="text-secondary font-bold hover:underline">
              View Analytics &rarr;
            </Link>
          </div>
        </div>

        {/* Upset Alert Index */}
        <div className="bg-white border border-slate-200 rounded p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-accent font-bold text-xs uppercase tracking-widest">
              <ShieldAlert className="w-4 h-4" />
              <span>Upset Alert</span>
            </div>
            <h3 className="text-lg font-bold text-primary mt-2">
              {data.upsetAlert.home} vs {data.upsetAlert.away}
            </h3>
            <p className="text-slate-600 text-xs mt-2 leading-relaxed">
              {data.upsetAlert.details} {data.upsetAlert.away} win/draw probability estimated at &nbsp;
              <span className="font-extrabold text-accent">{data.upsetAlert.upset_prob}%</span>.
            </p>
          </div>
          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase">{data.upsetAlert.date}</span>
            <Link href="/predictions" className="text-secondary font-bold hover:underline">
              View Match Center &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Editor's Editorial Analysis Brief */}
      <div className="bg-slate-50 border border-slate-200 rounded p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Editorial Methodology Note</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Unlike simplistic Monte Carlo algorithms, this platform implements a layered ensembling pipeline. 
              It updates team ratings chronologically, uses Dixon-Coles parameters for draws calibration, fits ensembled 
              trees (XGBoost, LightGBM, CatBoost) on historical World Cup and qualifier datasets, and runs a 
              100,000-iteration tournament simulator allocating third-placed teams using perfect bipartite matching.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
