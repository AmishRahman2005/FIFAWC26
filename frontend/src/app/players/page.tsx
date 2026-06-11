"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Award, Star, Activity, SlidersHorizontal, User, Shield, Compass } from "lucide-react";

interface PlayerRow {
  player_name: string;
  real_name: string;
  team: string;
  role: string;
  expected_goals: number;
  expected_assists: number;
  golden_boot_pct: number;
  playmaker_pct: number;
  flag: string;
}

const LEGEND_STICKERS: Record<string, { stickerUrl: string; parodyName: string; icon: string; quote: string }> = {
  "Lionel Messigician": {
    stickerUrl: "/messi.webp",
    parodyName: "Lionel Messigician",
    icon: "👑",
    quote: "Ready to summon one last trophy trick!"
  },
  "Cristiano Arrogantaldo": {
    stickerUrl: "/ronaldo.webp",
    parodyName: "Cristiano Arrogantaldo",
    icon: "🐐",
    quote: "SIUUUing all the way to the top of stats."
  },
  "Kylian MMMboppe": {
    stickerUrl: "/mbappe.webp",
    parodyName: "Kylian MMMboppe",
    icon: "👔",
    quote: "Dictating goals and contract clauses."
  },
  "Notaxmar": {
    stickerUrl: "/neymar.webp",
    parodyName: "Notaxmar",
    icon: "🤸‍♂️",
    quote: "Diving past defenders and tax laws."
  },
  "Erling Hairland": {
    stickerUrl: "/haaland.webp",
    parodyName: "Erling Hairland",
    icon: "🤖",
    quote: "Error: Goal scoring program is too efficient."
  },
  "Hurri-Kane MBE": {
    stickerUrl: "/kane.webp",
    parodyName: "Hurri-Kane MBE",
    icon: "🚫🏆",
    quote: "Tons of goals, still searching for a trophy."
  },
  "Romelu Lukaku": {
    stickerUrl: "/lukaku.webp",
    parodyName: "Romelu Stormzy",
    icon: "🎤",
    quote: "My boy Timo, watch me score (or miss)!"
  },
  "Kevin De Bruyne": {
    stickerUrl: "/debruyne.webp",
    parodyName: "Kev De Bluene",
    icon: "🍊",
    quote: "Let me talk! I have more assists than you have appearances!"
  },
  "James Rodriguez": {
    stickerUrl: "/james.webp",
    parodyName: "Hamish Rodneyguez",
    icon: "☕",
    quote: "Back on the big stage! Still got that 2014 magic!"
  },
  "Giorgian de Arrascaeta": {
    stickerUrl: "/suarez.webp",
    parodyName: "Chewy's Apprentice",
    icon: "🧉",
    quote: "Running Uruguay's midfield while Suarez is on biting duty!"
  },
  "Giorgian De Arrascaeta": {
    stickerUrl: "/suarez.webp",
    parodyName: "Chewy's Apprentice",
    icon: "🧉",
    quote: "Running Uruguay's midfield while Suarez is on biting duty!"
  }
};


type SortKey = "player_name" | "team" | "expected_goals" | "expected_assists" | "golden_boot_pct" | "playmaker_pct";

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [activeTab, setActiveTab] = useState<"goals" | "assists">("goals");
  const [sortBy, setSortBy] = useState<SortKey>("golden_boot_pct");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/player-predictions");
        if (res.ok) {
          const data = await res.json();
          setPlayers(data);
        } else {
          throw new Error("Failed to fetch player stats.");
        }
      } catch (err) {
        console.error("Error fetching player predictions. Loading static fallback.", err);
        // Fallback mockup in case API has issues
        setPlayers([
          { player_name: "Romelu Lukaku", real_name: "Romelu Lukaku", team: "Belgium", role: "Forward", expected_goals: 4.32, expected_assists: 0.61, golden_boot_pct: 8.77, playmaker_pct: 0.02, flag: "https://flagcdn.com/w40/be.png" },
          { player_name: "Kylian MMMboppe", real_name: "Kylian Mbappe", team: "France", role: "Forward", expected_goals: 4.18, expected_assists: 1.16, golden_boot_pct: 8.23, playmaker_pct: 0.25, flag: "https://flagcdn.com/w40/fr.png" },
          { player_name: "Lionel Messigician", real_name: "Lionel Messi", team: "Argentina", role: "Forward", expected_goals: 3.92, expected_assists: 2.15, golden_boot_pct: 7.94, playmaker_pct: 9.85, flag: "https://flagcdn.com/w40/ar.png" },
          { player_name: "Cristiano Arrogantaldo", real_name: "Cristiano Ronaldo", team: "Portugal", role: "Forward", expected_goals: 3.78, expected_assists: 0.94, golden_boot_pct: 7.12, playmaker_pct: 1.05, flag: "https://flagcdn.com/w40/pt.png" },
          { player_name: "Jude Bellingham", real_name: "Jude Bellingham", team: "England", role: "Midfielder", expected_goals: 2.45, expected_assists: 1.84, golden_boot_pct: 2.85, playmaker_pct: 7.21, flag: "https://flagcdn.com/w40/gb-eng.png" },
          { player_name: "Hurri-Kane MBE", real_name: "Harry Kane", team: "England", role: "Forward", expected_goals: 3.52, expected_assists: 0.85, golden_boot_pct: 6.45, playmaker_pct: 1.10, flag: "https://flagcdn.com/w40/gb-eng.png" }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  // Update default sorting when tab changes
  useEffect(() => {
    if (activeTab === "goals") {
      setSortBy("golden_boot_pct");
    } else {
      setSortBy("playmaker_pct");
    }
    setSortOrder("desc");
  }, [activeTab]);

  // Extract unique team list for filter dropdown
  const uniqueTeams = Array.from(new Set(players.map((p) => p.team))).sort();

  // Handle Sort Toggle
  const handleSort = (key: SortKey) => {
    let order: "asc" | "desc" = "desc";
    if (sortBy === key && sortOrder === "desc") {
      order = "asc";
    }
    setSortBy(key);
    setSortOrder(order);
  };

  // Filter and Sort Data
  const filteredPlayers = players
    .filter((p) => {
      const matchesSearch =
        p.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.real_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = selectedTeam === "all" || p.team === selectedTeam;
      const matchesRole = selectedRole === "all" || p.role === selectedRole;
      return matchesSearch && matchesTeam && matchesRole;
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "desc"
          ? valB.localeCompare(valA)
          : valA.localeCompare(valB);
      }
      
      // Numbers sorting
      return sortOrder === "desc"
        ? (valB as number) - (valA as number)
        : (valA as number) - (valB as number);
    });

  // Podium contenders based on active tab
  const podiumContenders = [...players]
    .sort((a, b) => {
      return activeTab === "goals"
        ? b.golden_boot_pct - a.golden_boot_pct
        : b.playmaker_pct - a.playmaker_pct;
    })
    .slice(0, 3);

  // Reorder to [2nd place, 1st place, 3rd place] for podium display
  const podiumDisplay = [
    podiumContenders[1], // 2nd
    podiumContenders[0], // 1st
    podiumContenders[2]  // 3rd
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-4 border-primary pb-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary font-source uppercase">
          Player Predictions
        </h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">
          GOLDEN BOOT & PLAYMAKER FORECASTS | 100,000 MONTE CARLO TOURNAMENT simulations
        </p>
      </div>

      {/* Podium Showcase (Top 3 Contenders) */}
      {!loading && podiumDisplay.length > 0 && (
        <div className="bg-slate-900 text-white rounded p-6 shadow-md border border-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-widest text-accent text-center mb-6">
            Current {activeTab === "goals" ? "Golden Boot" : "Playmaker"} Contender Podium
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-4">
            {podiumDisplay.map((player, idx) => {
              // Map index to podium positions: display order is [2nd, 1st, 3rd]
              const isFirst = player.player_name === podiumContenders[0]?.player_name;
              const isThird = player.player_name === podiumContenders[2]?.player_name;
              const position = isFirst ? "1st" : isThird ? "3rd" : "2nd";
              const rankColor = isFirst ? "text-amber-400" : isThird ? "text-amber-700" : "text-slate-300";
              const bgGradient = isFirst 
                ? "bg-gradient-to-t from-amber-500/10 to-slate-800/80 border-amber-500/30 scale-105" 
                : "bg-slate-800/60 border-slate-700/50";

              const legend = LEGEND_STICKERS[player.player_name];
              const displayVal = activeTab === "goals" 
                ? `${player.golden_boot_pct.toFixed(1)}% odds (${player.expected_goals.toFixed(2)} xG)`
                : `${player.playmaker_pct.toFixed(1)}% odds (${player.expected_assists.toFixed(2)} xA)`;

              return (
                <div 
                  key={player.player_name} 
                  className={`border rounded p-5 flex flex-col items-center justify-between text-center transition duration-300 hover:border-slate-500 relative ${bgGradient} ${isFirst ? "order-1 md:order-2 h-76" : idx === 0 ? "order-2 md:order-1 h-68" : "order-3 md:order-3 h-64"}`}
                >
                  {/* Position Badge */}
                  <span className={`text-3xl font-black font-mono absolute top-3 left-4 ${rankColor}`}>
                    {position}
                  </span>

                  {/* Curated Sticker / Avatar */}
                  <div className="w-20 h-24 flex items-center justify-center relative bg-slate-950/60 border border-slate-800 rounded p-1.5 mt-2">
                    {legend ? (
                      <img 
                        src={legend.stickerUrl} 
                        alt={legend.parodyName} 
                        className="max-w-full max-h-full object-contain animate-pulse duration-1000" 
                      />
                    ) : (
                      <User className="w-10 h-10 text-slate-500" />
                    )}
                  </div>

                  <div className="space-y-1 mt-4">
                    <h3 className="font-extrabold text-sm uppercase tracking-tight flex items-center justify-center space-x-1">
                      {legend && <span className="mr-0.5">{legend.icon}</span>}
                      <span>{player.real_name}</span>
                    </h3>
                    {legend && (
                      <span className="block text-[10px] font-bold text-accent font-mono uppercase tracking-wider mt-0.5">
                        {legend.parodyName}
                      </span>
                    )}
                    <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-400 font-bold font-mono">
                      <img 
                        src={player.flag} 
                        alt={player.team} 
                        className="w-4 h-3 object-cover rounded-xs border border-slate-800" 
                      />
                      <span>{player.team.toUpperCase()} &nbsp;|&nbsp; {player.role.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Prediction stats display */}
                  <div className="mt-4 pt-3 border-t border-slate-800 w-full">
                    <p className="text-xs font-black text-accent">{displayVal}</p>
                    {legend && (
                      <p className="text-[9px] text-slate-400 italic mt-1 font-medium">
                        "{legend.quote}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("goals")}
          className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-bold text-sm uppercase transition ${
            activeTab === "goals"
              ? "border-secondary text-secondary"
              : "border-transparent text-slate-500 hover:text-primary hover:border-slate-300"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Golden Boot Odds</span>
        </button>
        <button
          onClick={() => setActiveTab("assists")}
          className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-bold text-sm uppercase transition ${
            activeTab === "assists"
              ? "border-secondary text-secondary"
              : "border-transparent text-slate-500 hover:text-primary hover:border-slate-300"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Playmaker Odds</span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch">
        <div className="flex-1 max-w-md relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search players by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          {/* Team Filter */}
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="text-xs border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-secondary text-slate-600 font-semibold"
            >
              <option value="all">All Teams</option>
              {uniqueTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter Pills */}
          <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
            {["all", "Forward", "Midfielder", "Defender"].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`text-[10px] font-bold px-3 py-1 rounded transition uppercase ${
                  selectedRole === role
                    ? "bg-white text-primary shadow-xs"
                    : "text-slate-500 hover:text-primary"
                }`}
              >
                {role === "all" ? "All Roles" : role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm font-semibold animate-pulse">Running Monte Carlo player aggregations...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 font-bold text-primary font-mono text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-center w-12">Rank</th>
                  <th className="px-6 py-4">Player</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort("expected_goals")}>
                    Expected Goals (xG)
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort("expected_assists")}>
                    Expected Assists (xA)
                  </th>
                  <th className={`px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition ${activeTab === "goals" ? "bg-primary/5" : ""}`} onClick={() => handleSort("golden_boot_pct")}>
                    Golden Boot Win %
                  </th>
                  <th className={`px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition ${activeTab === "assists" ? "bg-primary/5" : ""}`} onClick={() => handleSort("playmaker_pct")}>
                    Playmaker Win %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPlayers.map((player, idx) => {
                  const legend = LEGEND_STICKERS[player.player_name];
                  return (
                    <tr key={player.player_name} className="hover:bg-slate-50/80 transition group/row">
                      {/* Rank */}
                      <td className="px-6 py-3.5 text-center font-bold text-slate-500 font-mono">
                        {idx + 1}
                      </td>

                      {/* Player Name */}
                      <td className="px-6 py-3.5 font-extrabold text-slate-800 flex items-center space-x-2 relative group/cell">
                        <span>{player.real_name}</span>
                        {legend && (
                          <>
                            <span className="px-1.5 py-0.5 rounded bg-primary/5 text-primary text-[8px] font-black tracking-wider border border-primary/10 flex items-center space-x-0.5 cursor-help">
                              <span>{legend.icon}</span>
                              <span>{legend.parodyName}</span>
                            </span>
                            
                            {/* Hover tooltip for legend stickers */}
                            <div className="absolute left-6 top-10 z-50 hidden group-hover/cell:flex flex-col items-center bg-white border border-slate-200 p-3 rounded-lg shadow-xl w-40 animate-in fade-in duration-150 pointer-events-none">
                              <div className="w-20 h-24 flex items-center justify-center overflow-hidden bg-slate-50 border border-slate-100 rounded p-1 mb-2">
                                <img
                                  src={legend.stickerUrl}
                                  alt={legend.parodyName}
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                              <p className="text-[10px] font-black text-primary text-center leading-tight uppercase font-source">
                                {legend.parodyName}
                              </p>
                              <p className="text-[8px] text-slate-400 italic text-center mt-1">
                                "{legend.quote}"
                              </p>
                            </div>
                          </>
                        )}
                      </td>

                      {/* Team */}
                      <td className="px-6 py-3.5 font-bold text-slate-700">
                        <div className="flex items-center space-x-2">
                          <img
                            src={player.flag}
                            alt={player.team}
                            className="w-5 h-3.5 object-cover rounded-xs border border-slate-100"
                          />
                          <span>{player.team}</span>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-6 py-3.5 text-xs text-slate-600 font-semibold font-mono uppercase">
                        {player.role}
                      </td>

                      {/* expected_goals */}
                      <td className="px-6 py-3.5 text-right font-semibold font-mono text-slate-700">
                        {player.expected_goals.toFixed(2)}
                      </td>

                      {/* expected_assists */}
                      <td className="px-6 py-3.5 text-right font-semibold font-mono text-slate-700">
                        {player.expected_assists.toFixed(2)}
                      </td>

                      {/* golden_boot_pct */}
                      <td className={`px-6 py-3.5 text-right font-black font-mono ${activeTab === "goals" ? "text-primary bg-primary/5" : "text-slate-600"}`}>
                        {player.golden_boot_pct.toFixed(1)}%
                      </td>

                      {/* playmaker_pct */}
                      <td className={`px-6 py-3.5 text-right font-black font-mono ${activeTab === "assists" ? "text-primary bg-primary/5" : "text-slate-600"}`}>
                        {player.playmaker_pct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
                {filteredPlayers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500 font-semibold">
                      No players match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editorial Methodology Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded p-6">
        <div className="flex items-start space-x-3">
          <Compass className="w-5 h-5 text-primary mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Methodology Note</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Player-level projections are calculated by combining team-level Dixon-Coles expected goals distributions with player-specific attacking shares. Over 10,000 tournament simulations are run. In each iteration, match goals are sampled using Poisson distributions, and scorers/assisters are allocated via weighted multinomial choice. If a tie for top scorer/assister occurs, the award is shared among the tied players.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
