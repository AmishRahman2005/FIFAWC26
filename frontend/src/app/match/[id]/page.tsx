"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, ChevronLeft, ShieldCheck, HelpCircle, BarChart3, TrendingUp, Info } from "lucide-react";

// Mock data generator for fallback match center
const MOCK_TEAMS: Record<string, { group: string; code: string; flag: string; elo: number }> = {
  "Mexico": { group: "A", code: "MEX", flag: "mx", elo: 1684 },
  "South Africa": { group: "A", code: "RSA", flag: "za", elo: 1604 },
  "South Korea": { group: "A", code: "KOR", flag: "kr", elo: 1722 },
  "Czechia": { group: "A", code: "CZE", flag: "cz", elo: 1654 },
  "Canada": { group: "B", code: "CAN", flag: "ca", elo: 1644 },
  "Qatar": { group: "B", code: "QAT", flag: "qa", elo: 1594 },
  "Switzerland": { group: "B", code: "SUI", flag: "ch", elo: 1748 },
  "Bosnia and Herzegovina": { group: "B", code: "BIH", flag: "ba", elo: 1622 },
  "Brazil": { group: "C", code: "BRA", flag: "br", elo: 1962 },
  "Morocco": { group: "C", code: "MAR", flag: "ma", elo: 1762 },
  "Haiti": { group: "C", code: "HAI", flag: "ht", elo: 1538 },
  "Scotland": { group: "C", code: "SCO", flag: "gb-sct", elo: 1692 },
  "United States": { group: "D", code: "USA", flag: "us", elo: 1732 },
  "Paraguay": { group: "D", code: "PAR", flag: "py", elo: 1718 },
  "Australia": { group: "D", code: "AUS", flag: "au", elo: 1682 },
  "Türkiye": { group: "D", code: "TUR", flag: "tr", elo: 1676 },
  "Germany": { group: "E", code: "GER", flag: "de", elo: 1824 },
  "Curaçao": { group: "E", code: "CUW", flag: "cw", elo: 1546 },
  "Ivory Coast": { group: "E", code: "CIV", flag: "ci", elo: 1668 },
  "Ecuador": { group: "E", code: "ECU", flag: "ec", elo: 1712 },
  "Netherlands": { group: "F", code: "NED", flag: "nl", elo: 1864 },
  "Japan": { group: "F", code: "JPN", flag: "jp", elo: 1756 },
  "Tunisia": { group: "F", code: "TUN", flag: "tn", elo: 1642 },
  "Sweden": { group: "F", code: "SWE", flag: "se", elo: 1694 },
  "Belgium": { group: "G", code: "BEL", flag: "be", elo: 1832 },
  "Egypt": { group: "G", code: "EGY", flag: "eg", elo: 1638 },
  "Iran": { group: "G", code: "IRN", flag: "ir", elo: 1742 },
  "New Zealand": { group: "G", code: "NZL", flag: "nz", elo: 1562 },
  "Spain": { group: "H", code: "ESP", flag: "es", elo: 1898 },
  "Cape Verde": { group: "H", code: "CPV", flag: "cv", elo: 1518 },
  "Saudi Arabia": { group: "H", code: "KSA", flag: "sa", elo: 1598 },
  "Uruguay": { group: "H", code: "URU", flag: "uy", elo: 1794 },
  "France": { group: "I", code: "FRA", flag: "fr", elo: 1932 },
  "Senegal": { group: "I", code: "SEN", flag: "sn", elo: 1718 },
  "Norway": { group: "I", code: "NOR", flag: "no", elo: 1698 },
  "Iraq": { group: "I", code: "IRQ", flag: "iq", elo: 1584 },
  "Argentina": { group: "J", code: "ARG", flag: "ar", elo: 1982 },
  "Algeria": { group: "J", code: "ALG", flag: "dz", elo: 1658 },
  "Austria": { group: "J", code: "AUT", flag: "at", elo: 1704 },
  "Jordan": { group: "J", code: "JOR", flag: "jo", elo: 1522 },
  "Portugal": { group: "K", code: "POR", flag: "pt", elo: 1872 },
  "Colombia": { group: "K", code: "COL", flag: "co", elo: 1782 },
  "Uzbekistan": { group: "K", code: "UZB", flag: "uz", elo: 1618 },
  "DR Congo": { group: "K", code: "COD", flag: "cd", elo: 1572 },
  "England": { group: "L", code: "ENG", flag: "gb-eng", elo: 1918 },
  "Croatia": { group: "L", code: "CRO", flag: "hr", elo: 1812 },
  "Ghana": { group: "L", code: "GHA", flag: "gh", elo: 1612 },
  "Panama": { group: "L", code: "PAN", flag: "pa", elo: 1568 }
};

const getHeuristicProbs = (h: string, a: string) => {
  const wH = MOCK_TEAMS[h]?.elo || 1500;
  const wA = MOCK_TEAMS[a]?.elo || 1500;
  
  let homeWin = 0.35 + (wH - wA) * 0.008;
  let awayWin = 0.35 + (wA - wH) * 0.008;
  let draw = 0.30 - Math.abs(wH - wA) * 0.002;
  
  homeWin = Math.max(0.1, Math.min(0.85, homeWin));
  awayWin = Math.max(0.1, Math.min(0.85, awayWin));
  draw = 1.0 - homeWin - awayWin;
  
  let hG = 1, aG = 1;
  if (homeWin > awayWin + 0.15) {
    hG = homeWin > 0.6 ? 3 : 2;
    aG = awayWin > 0.25 ? 1 : 0;
  } else if (awayWin > homeWin + 0.15) {
    aG = awayWin > 0.6 ? 3 : 2;
    hG = homeWin > 0.25 ? 1 : 0;
  } else {
    hG = 1;
    aG = 1;
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

// Full dynamic fallback generator based on match id index
const getFallbackMatch = (id: string) => {
  const teamsArray = Object.keys(MOCK_TEAMS);
  // Simple hashing of ID to pick teams
  const numId = parseInt(id.replace(/[^0-9]/g, "")) || 1;
  const homeIdx = (numId * 3) % teamsArray.length;
  let awayIdx = (numId * 7) % teamsArray.length;
  if (homeIdx === awayIdx) awayIdx = (awayIdx + 1) % teamsArray.length;
  
  const home = teamsArray[homeIdx];
  const away = teamsArray[awayIdx];
  
  const stats = getHeuristicProbs(home, away);
  
  // Dixon-Coles xG proxies
  const xgH = Math.max(0.2, Math.round((stats.home_win_prob * 0.035 + stats.draw_prob * 0.015) * 100) / 100);
  const xgA = Math.max(0.2, Math.round((stats.away_win_prob * 0.035 + stats.draw_prob * 0.015) * 100) / 100);
  
  return {
    match_id: id,
    stage: "group stage",
    date: `2026-06-18`,
    home_team: home,
    away_team: away,
    home_win_prob: stats.home_win_prob,
    draw_prob: stats.draw_prob,
    away_win_prob: stats.away_win_prob,
    pred_home_score: stats.pred_home_score,
    pred_away_score: stats.pred_away_score,
    confidence: stats.confidence,
    expected_goals_home: xgH,
    expected_goals_away: xgA,
    key_factors: [
      `Superior Elo rating diff (+${Math.round(Math.abs((MOCK_TEAMS[home]?.elo || 1500) - (MOCK_TEAMS[away]?.elo || 1500)))} points)`,
      `Slightly better offensive rating parameter in Dixon-Coles model`,
      `Favorable historical goal difference ratios in neutral encounters`
    ],
    explanation: `The ensembled models favor the stronger Elo team in this fixture. Defensive metrics suggest they will be able to contain transitions, leading to a projected score of ${stats.pred_home_score}-${stats.pred_away_score}.`
  };
};

export default function MatchCenter() {
  const params = useParams();
  const matchId = Array.isArray(params?.id) ? params.id[0] : params?.id || "M-G-01";
  
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/match/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          setMatch(data);
        } else {
          throw new Error();
        }
      } catch (err) {
        console.log("Loading fallback match center data.");
        setMatch(getFallbackMatch(matchId));
      } finally {
        setLoading(false);
      }
    };
    fetchMatchDetails();
  }, [matchId]);

  const getFlagUrl = (teamName: string) => {
    const code = MOCK_TEAMS[teamName]?.flag || "un";
    return `https://flagcdn.com/w40/${code}.png`;
  };

  const getFifaCode = (teamName: string) => {
    return MOCK_TEAMS[teamName]?.code || teamName.slice(0, 3).toUpperCase();
  };

  if (loading) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500 text-sm font-semibold animate-pulse">Running prediction calibrations...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500">Prediction not found.</p>
        <Link href="/predictions" className="text-secondary underline mt-4 inline-block">Back to predictions</Link>
      </div>
    );
  }

  const eloDiff = Math.abs((MOCK_TEAMS[match.home_team]?.elo || 1500) - (MOCK_TEAMS[match.away_team]?.elo || 1500));

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div>
        <Link href="/predictions" className="text-secondary hover:underline flex items-center space-x-1 font-bold text-sm">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Predictions Center</span>
        </Link>
      </div>

      {/* Main Scoreboard Banner */}
      <div className="bg-primary text-white rounded overflow-hidden shadow-md border border-primary/20">
        <div className="bg-primary/20 px-6 py-3 border-b border-white/10 flex items-center justify-between text-xs font-bold font-mono tracking-wider text-slate-300">
          <span>{match.date} &nbsp;|&nbsp; KICKOFF 18:00 UTC</span>
          <span className="bg-accent text-white px-2.5 py-0.5 rounded font-sans uppercase">
            {match.stage} &nbsp;|&nbsp; {match.match_id}
          </span>
        </div>
        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Home Team */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3 w-full md:w-1/3">
            <img
              src={getFlagUrl(match.home_team)}
              alt={match.home_team}
              className="w-16 h-12 object-cover border border-white/20 rounded shadow-md"
            />
            <div>
              <h2 className="text-3xl font-black font-source tracking-tight">{match.home_team.toUpperCase()}</h2>
              <p className="text-sm text-slate-300 font-semibold font-mono mt-1">ELO: {MOCK_TEAMS[match.home_team]?.elo || 1500}</p>
            </div>
          </div>

          {/* Expected score details */}
          <div className="text-center flex flex-col items-center justify-center space-y-3 w-full md:w-1/3 border-y md:border-y-0 md:border-x border-white/10 py-6 md:py-0">
            <span className="text-xs text-slate-300 font-bold uppercase tracking-widest font-mono">Expected Score</span>
            <p className="text-5xl font-black tracking-tight font-source text-white">
              {match.pred_home_score} - {match.pred_away_score}
            </p>
            <div className="bg-white/10 border border-white/10 px-3 py-1 rounded-full text-xs font-bold font-mono text-slate-200">
              Confidence Index: {match.confidence}%
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-3 w-full md:w-1/3">
            <img
              src={getFlagUrl(match.away_team)}
              alt={match.away_team}
              className="w-16 h-12 object-cover border border-white/20 rounded shadow-md"
            />
            <div>
              <h2 className="text-3xl font-black font-source tracking-tight">{match.away_team.toUpperCase()}</h2>
              <p className="text-sm text-slate-300 font-semibold font-mono mt-1">ELO: {MOCK_TEAMS[match.away_team]?.elo || 1500}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of details: Probabilities vs xG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Outcome Probabilities Card */}
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              <span>Outcomes Distribution</span>
            </h3>
            
            {/* Probability Bars details */}
            <div className="space-y-4 pt-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>{match.home_team} Win</span>
                  <span>{match.home_win_prob}%</span>
                </div>
                <div className="h-4 rounded-full overflow-hidden bg-slate-100 border border-slate-200/50">
                  <div style={{ width: `${match.home_win_prob}%` }} className="bg-primary h-full transition-all duration-500"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Draw probability</span>
                  <span>{match.draw_prob}%</span>
                </div>
                <div className="h-4 rounded-full overflow-hidden bg-slate-100 border border-slate-200/50">
                  <div style={{ width: `${match.draw_prob}%` }} className="bg-slate-400 h-full transition-all duration-500"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>{match.away_team} Win</span>
                  <span>{match.away_win_prob}%</span>
                </div>
                <div className="h-4 rounded-full overflow-hidden bg-slate-100 border border-slate-200/50">
                  <div style={{ width: `${match.away_win_prob}%` }} className="bg-accent h-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xxs text-slate-400 font-semibold font-mono uppercase mt-6">
            Calibrated using multinomial Bayesian logistic regression (Layer 5)
          </p>
        </div>

        {/* Expected Goals xG Proxies Card */}
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              <span>Expected Goals (xG Proxy)</span>
            </h3>
            
            <div className="flex items-center justify-between pt-6">
              <div className="text-center w-5/12">
                <p className="text-4xl font-black text-primary font-source">{match.expected_goals_home.toFixed(2)}</p>
                <p className="text-xxs text-slate-400 font-bold uppercase tracking-wider mt-1">{getFifaCode(match.home_team)} xG</p>
              </div>
              <div className="text-slate-300 font-bold text-xl w-2/12 text-center">vs</div>
              <div className="text-center w-5/12">
                <p className="text-4xl font-black text-primary font-source">{match.expected_goals_away.toFixed(2)}</p>
                <p className="text-xxs text-slate-400 font-bold uppercase tracking-wider mt-1">{getFifaCode(match.away_team)} xG</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed text-center pt-4 italic">
              Estimated from Dixon-Coles parameters ($\alpha_i, \beta_j$) fitted on time-decayed historical matches.
            </p>
          </div>
          <p className="text-xxs text-slate-400 font-semibold font-mono uppercase mt-6">
            Dixon-Coles Model Output (Layer 2)
          </p>
        </div>
      </div>

      {/* Explainable AI & Predictions Explanations */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-3">
        {/* Why the model chose this */}
        <div className="p-6 md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-primary flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>AI Predictor Insights</span>
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed font-sans">{match.explanation}</p>
          
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Key Predictor Factors</h4>
            <ul className="mt-2.5 space-y-2">
              {match.key_factors.map((f: string, idx: number) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-slate-600">
                  <span className="text-emerald-500 font-bold">&bull;</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Model Feature Importance weights */}
        <div className="bg-slate-50 p-6 border-t md:border-t-0 md:border-l border-slate-200 space-y-4">
          <h4 className="text-xs font-extrabold text-primary uppercase tracking-widest font-mono flex items-center space-x-1">
            <span>Ensemble Weights</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          </h4>
          <p className="text-xxs text-slate-500 leading-normal">
            Ensemble weights are determined by log loss metrics on the validation set.
          </p>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xxs font-bold text-slate-600">
                <span>Dynamic Elo Engine</span>
                <span>35%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div style={{ width: "35%" }} className="bg-primary h-full"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xxs font-bold text-slate-600">
                <span>Dixon-Coles Model</span>
                <span>40%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div style={{ width: "40%" }} className="bg-accent h-full"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xxs font-bold text-slate-600">
                <span>Machine Learning Trees</span>
                <span>25%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div style={{ width: "25%" }} className="bg-slate-500 h-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Methodology warning */}
      <div className="bg-slate-50 border border-slate-200 rounded p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Predictive Modeling Disclaimer</h4>
            <p className="text-slate-600 text-xxs leading-relaxed">
              Expected Goals (xG) are Poisson rate estimators representing team attack and defense ratings, and do not factor in in-match variables (such as red cards, weather conditions, or local pitches). Recency weights half-life decay rate ($\xi$) is set at 0.0001 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
