"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import { ArrowUpDown, Award, Star, Compass, Shield } from "lucide-react";

interface TeamRow {
  name: string;
  code: string;
  group_name: string;
  flag: string;
  elo: number;
  off_rating: number;
  def_rating: number;
  overall_rating: number;
  group_qual_pct: number;
  win_pct: number;
}

// Full 48 team mock profiles for fallback
const MOCK_RANKINGS: TeamRow[] = [
  { name: "Argentina", code: "ARG", group_name: "J", flag: "https://flagcdn.com/w40/ar.png", elo: 1982, off_rating: 1184, def_rating: 1142, overall_rating: 1436, group_qual_pct: 94.2, win_pct: 14.8 },
  { name: "Brazil", code: "BRA", group_name: "C", flag: "https://flagcdn.com/w40/br.png", elo: 1962, off_rating: 1168, def_rating: 1134, overall_rating: 1421, group_qual_pct: 92.1, win_pct: 12.8 },
  { name: "France", code: "FRA", group_name: "I", flag: "https://flagcdn.com/w40/fr.png", elo: 1932, off_rating: 1215, def_rating: 1104, overall_rating: 1417, group_qual_pct: 90.5, win_pct: 11.2 },
  { name: "England", code: "ENG", group_name: "L", flag: "https://flagcdn.com/w40/gb-eng.png", elo: 1918, off_rating: 1142, def_rating: 1122, overall_rating: 1394, group_qual_pct: 88.6, win_pct: 10.2 },
  { name: "Spain", code: "ESP", group_name: "H", flag: "https://flagcdn.com/w40/es.png", elo: 1898, off_rating: 1135, def_rating: 1114, overall_rating: 1382, group_qual_pct: 87.2, win_pct: 9.5 },
  { name: "Portugal", code: "POR", group_name: "K", flag: "https://flagcdn.com/w40/pt.png", elo: 1872, off_rating: 1152, def_rating: 1085, overall_rating: 1369, group_qual_pct: 85.3, win_pct: 8.2 },
  { name: "Netherlands", code: "NED", group_name: "F", flag: "https://flagcdn.com/w40/nl.png", elo: 1864, off_rating: 1122, def_rating: 1092, overall_rating: 1359, group_qual_pct: 84.8, win_pct: 7.8 },
  { name: "Morocco", code: "MAR", group_name: "C", flag: "https://flagcdn.com/w40/ma.png", elo: 1762, off_rating: 1045, def_rating: 1084, overall_rating: 1297, group_qual_pct: 78.4, win_pct: 5.6 },
  { name: "Uruguay", code: "URU", group_name: "H", flag: "https://flagcdn.com/w40/uy.png", elo: 1794, off_rating: 1084, def_rating: 1064, overall_rating: 1314, group_qual_pct: 81.2, win_pct: 4.8 },
  { name: "Japan", code: "JPN", group_name: "F", flag: "https://flagcdn.com/w40/jp.png", elo: 1756, off_rating: 1062, def_rating: 1052, overall_rating: 1290, group_qual_pct: 76.5, win_pct: 4.2 },
  { name: "Switzerland", code: "SUI", group_name: "B", flag: "https://flagcdn.com/w40/ch.png", elo: 1748, off_rating: 1024, def_rating: 1062, overall_rating: 1278, group_qual_pct: 75.2, win_pct: 3.8 },
  { name: "Germany", code: "GER", group_name: "E", flag: "https://flagcdn.com/w40/de.png", elo: 1824, off_rating: 1112, def_rating: 1054, overall_rating: 1330, group_qual_pct: 83.1, win_pct: 3.5 },
  { name: "Colombia", code: "COL", group_name: "K", flag: "https://flagcdn.com/w40/co.png", elo: 1782, off_rating: 1054, def_rating: 1062, overall_rating: 1299, group_qual_pct: 79.5, win_pct: 3.2 },
  { name: "United States", code: "USA", group_name: "D", flag: "https://flagcdn.com/w40/us.png", elo: 1732, off_rating: 1032, def_rating: 1042, overall_rating: 1268, group_qual_pct: 73.1, win_pct: 3.0 },
  { name: "Croatia", code: "CRO", group_name: "L", flag: "https://flagcdn.com/w40/hr.png", elo: 1812, off_rating: 1052, def_rating: 1094, overall_rating: 1319, group_qual_pct: 82.5, win_pct: 2.8 },
  { name: "Senegal", code: "SEN", group_name: "I", flag: "https://flagcdn.com/w40/sn.png", elo: 1718, off_rating: 1018, def_rating: 1035, overall_rating: 1257, group_qual_pct: 70.2, win_pct: 2.5 },
  { name: "Austria", code: "AUT", group_name: "J", flag: "https://flagcdn.com/w40/at.png", elo: 1704, off_rating: 1022, def_rating: 1024, overall_rating: 1250, group_qual_pct: 68.4, win_pct: 2.2 },
  { name: "Ecuador", code: "ECU", group_name: "E", flag: "https://flagcdn.com/w40/ec.png", elo: 1712, off_rating: 1014, def_rating: 1032, overall_rating: 1252, group_qual_pct: 69.1, win_pct: 2.1 },
  { name: "Norway", code: "NOR", group_name: "I", flag: "https://flagcdn.com/w40/no.png", elo: 1698, off_rating: 1042, def_rating: 1004, overall_rating: 1248, group_qual_pct: 67.2, win_pct: 1.8 },
  { name: "Australia", code: "AUS", group_name: "D", flag: "https://flagcdn.com/w40/au.png", elo: 1682, off_rating: 994, def_rating: 1022, overall_rating: 1232, group_qual_pct: 65.4, win_pct: 1.5 },
  { name: "Türkiye", code: "TUR", group_name: "D", flag: "https://flagcdn.com/w40/tr.png", elo: 1676, off_rating: 1012, def_rating: 994, overall_rating: 1227, group_qual_pct: 63.8, win_pct: 1.4 },
  { name: "South Korea", code: "KOR", group_name: "A", flag: "https://flagcdn.com/w40/kr.png", elo: 1722, off_rating: 1022, def_rating: 1034, overall_rating: 1259, group_qual_pct: 71.4, win_pct: 1.2 },
  { name: "Sweden", code: "SWE", group_name: "F", flag: "https://flagcdn.com/w40/se.png", elo: 1694, off_rating: 1014, def_rating: 1012, overall_rating: 1240, group_qual_pct: 66.5, win_pct: 1.2 },
  { name: "Ivory Coast", code: "CIV", group_name: "E", flag: "https://flagcdn.com/w40/ci.png", elo: 1668, off_rating: 994, def_rating: 1012, overall_rating: 1224, group_qual_pct: 61.2, win_pct: 1.0 },
  { name: "Algeria", code: "ALG", group_name: "J", flag: "https://flagcdn.com/w40/dz.png", elo: 1658, off_rating: 984, def_rating: 1004, overall_rating: 1215, group_qual_pct: 59.5, win_pct: 0.9 },
  { name: "Tunisia", code: "TUN", group_name: "F", flag: "https://flagcdn.com/w40/tn.png", elo: 1642, off_rating: 964, def_rating: 1012, overall_rating: 1206, group_qual_pct: 56.5, win_pct: 0.8 },
  { name: "Egypt", code: "EGY", group_name: "G", flag: "https://flagcdn.com/w40/eg.png", elo: 1638, off_rating: 982, def_rating: 994, overall_rating: 1204, group_qual_pct: 55.4, win_pct: 0.8 },
  { name: "Czechia", code: "CZE", group_name: "A", flag: "https://flagcdn.com/w40/cz.png", elo: 1654, off_rating: 994, def_rating: 998, overall_rating: 1215, group_qual_pct: 58.7, win_pct: 0.8 },
  { name: "Mexico", code: "MEX", group_name: "A", flag: "https://flagcdn.com/w40/mx.png", elo: 1684, off_rating: 1004, def_rating: 1012, overall_rating: 1233, group_qual_pct: 66.8, win_pct: 0.8 },
  { name: "Canada", code: "CAN", group_name: "B", flag: "https://flagcdn.com/w40/ca.png", elo: 1644, off_rating: 974, def_rating: 1002, overall_rating: 1206, group_qual_pct: 56.8, win_pct: 0.6 },
  { name: "Bosnia and Herzegovina", code: "BIH", group_name: "B", flag: "https://flagcdn.com/w40/ba.png", elo: 1622, off_rating: 962, def_rating: 994, overall_rating: 1192, group_qual_pct: 52.3, win_pct: 0.5 },
  { name: "Uzbekistan", code: "UZB", group_name: "K", flag: "https://flagcdn.com/w40/uz.png", elo: 1618, off_rating: 974, def_rating: 974, overall_rating: 1188, group_qual_pct: 51.5, win_pct: 0.4 },
  { name: "Ghana", code: "GHA", group_name: "L", flag: "https://flagcdn.com/w40/gh.png", elo: 1612, off_rating: 964, def_rating: 978, overall_rating: 1184, group_qual_pct: 50.4, win_pct: 0.4 },
  { name: "South Africa", code: "RSA", group_name: "A", flag: "https://flagcdn.com/w40/za.png", elo: 1604, off_rating: 954, def_rating: 978, overall_rating: 1178, group_qual_pct: 48.7, win_pct: 0.3 },
  { name: "Saudi Arabia", code: "KSA", group_name: "H", flag: "https://flagcdn.com/w40/sa.png", elo: 1598, off_rating: 948, def_rating: 974, overall_rating: 1173, group_qual_pct: 46.8, win_pct: 0.3 },
  { name: "Qatar", code: "QAT", group_name: "B", flag: "https://flagcdn.com/w40/qa.png", elo: 1594, off_rating: 952, def_rating: 964, overall_rating: 1170, group_qual_pct: 45.4, win_pct: 0.2 },
  { name: "Iraq", code: "IRQ", group_name: "I", flag: "https://flagcdn.com/w40/iq.png", elo: 1584, off_rating: 942, def_rating: 962, overall_rating: 1162, group_qual_pct: 42.1, win_pct: 0.2 },
  { name: "DR Congo", code: "COD", group_name: "K", flag: "https://flagcdn.com/w40/cd.png", elo: 1572, off_rating: 934, def_rating: 952, overall_rating: 1152, group_qual_pct: 38.5, win_pct: 0.1 },
  { name: "Panama", code: "PAN", group_name: "L", flag: "https://flagcdn.com/w40/pa.png", elo: 1568, off_rating: 928, def_rating: 954, overall_rating: 1150, group_qual_pct: 36.8, win_pct: 0.1 },
  { name: "New Zealand", code: "NZL", group_name: "G", flag: "https://flagcdn.com/w40/nz.png", elo: 1562, off_rating: 914, def_rating: 962, overall_rating: 1146, group_qual_pct: 34.6, win_pct: 0.1 },
  { name: "Curaçao", code: "CUW", group_name: "E", flag: "https://flagcdn.com/w40/cw.png", elo: 1546, off_rating: 902, def_rating: 962, overall_rating: 1136, group_qual_pct: 30.2, win_pct: 0.1 },
  { name: "Haiti", code: "HAI", group_name: "C", flag: "https://flagcdn.com/w40/ht.png", elo: 1538, off_rating: 894, def_rating: 964, overall_rating: 1132, group_qual_pct: 28.5, win_pct: 0.1 },
  { name: "Jordan", code: "JOR", group_name: "J", flag: "https://flagcdn.com/w40/jo.png", elo: 1522, off_rating: 884, def_rating: 962, overall_rating: 1122, group_qual_pct: 24.6, win_pct: 0.1 },
  { name: "Cape Verde", code: "CPV", group_name: "H", flag: "https://flagcdn.com/w40/cv.png", elo: 1518, off_rating: 874, def_rating: 964, overall_rating: 1118, group_qual_pct: 23.5, win_pct: 0.1 },
  { name: "Belgium", code: "BEL", group_name: "G", flag: "https://flagcdn.com/w40/be.png", elo: 1832, off_rating: 1102, def_rating: 1084, overall_rating: 1339, group_qual_pct: 84.2, win_pct: 3.5 },
  { name: "Iran", code: "IRN", group_name: "G", flag: "https://flagcdn.com/w40/ir.png", elo: 1742, off_rating: 1044, def_rating: 1032, overall_rating: 1272, group_qual_pct: 74.2, win_pct: 2.8 },
  { name: "Paraguay", code: "PAR", group_name: "D", flag: "https://flagcdn.com/w40/py.png", elo: 1718, off_rating: 1004, def_rating: 1045, overall_rating: 1255, group_qual_pct: 69.5, win_pct: 2.0 },
  { name: "Scotland", code: "SCO", group_name: "C", flag: "https://flagcdn.com/w40/gb-sct.png", elo: 1692, off_rating: 1002, def_rating: 1014, overall_rating: 1236, group_qual_pct: 65.4, win_pct: 1.2 }
];

type SortKey = "elo" | "off_rating" | "def_rating" | "win_pct" | "group_qual_pct";

const LEGEND_MAP: Record<string, { parodyName: string; icon: string; stickerUrl: string; label: string }> = {
  "Argentina": {
    parodyName: "Lionel Messigician",
    icon: "👑",
    stickerUrl: "/messi.webp",
    label: "Messigician"
  },
  "Portugal": {
    parodyName: "Cristiano Arrogantaldo",
    icon: "🐐",
    stickerUrl: "/ronaldo.webp",
    label: "Arrogantaldo"
  },
  "France": {
    parodyName: "Kylian MMMboppe",
    icon: "👔",
    stickerUrl: "/mbappe.webp",
    label: "MMMboppe"
  },
  "Brazil": {
    parodyName: "Notaxmar",
    icon: "🤸‍♂️",
    stickerUrl: "/neymar.webp",
    label: "Notaxmar"
  },
  "Norway": {
    parodyName: "Erling Hairland",
    icon: "🤖",
    stickerUrl: "/haaland.webp",
    label: "Hairland"
  },
  "England": {
    parodyName: "Hurri-Kane MBE",
    icon: "🚫🏆",
    stickerUrl: "/kane.webp",
    label: "Hurri-Kane"
  }
};

export default function Rankings() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("elo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/teams`);
        if (res.ok) {
          const data = await res.json();
          setTeams(data);
        } else {
          throw new Error();
        }
      } catch (err) {
        console.log("Loading fallback rankings.");
        // Sort by mock Elo initially
        const sorted = [...MOCK_RANKINGS].sort((a, b) => b.elo - a.elo);
        setTeams(sorted);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const handleSort = (key: SortKey) => {
    let order: "asc" | "desc" = "desc";
    if (sortBy === key && sortOrder === "desc") {
      order = "asc";
    }
    setSortBy(key);
    setSortOrder(order);
    
    const sorted = [...teams].sort((a, b) => {
      if (order === "desc") {
        return b[key] - a[key];
      } else {
        return a[key] - b[key];
      }
    });
    setTeams(sorted);
  };

  const filteredTeams = teams.filter(
    t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-4 border-primary pb-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary font-source uppercase">
          Team Power Rankings
        </h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">
          SORTABLE STANDINGS &nbsp;|&nbsp; DETAILED OFFENSIVE & DEFENSIVE AI PARAMETERS
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex items-center justify-between">
        <input
          type="text"
          placeholder="Search by team name or code (e.g. Argentina, USA)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md border border-slate-200 px-4 py-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
        />
        <span className="text-xs font-bold text-slate-400 font-mono hidden sm:inline">
          SHOWING {filteredTeams.length} OF 48 TEAMS
        </span>
      </div>

      {/* Rankings Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm font-semibold animate-pulse">Computing ensembled metrics...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 font-bold text-primary font-mono text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-center w-12">Rank</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-4 py-4 text-center">Group</th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort("elo")}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Elo Rating</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort("off_rating")}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Attack</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort("def_rating")}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Defense</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort("group_qual_pct")}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Group Qual %</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSort("win_pct")}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Champ Odds</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTeams.map((team, idx) => (
                  <tr key={team.name} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-center font-bold text-slate-500 font-mono">{idx + 1}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-800 flex items-center space-x-3 relative group/cell">
                      <img
                        src={team.flag}
                        alt={team.name}
                        className="w-6 h-4.5 object-cover border border-slate-100 rounded"
                      />
                      <span>{team.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({team.code})</span>

                      {/* 442oons Legend Badge */}
                      {LEGEND_MAP[team.name] && (
                        <>
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary/5 text-primary text-[9px] font-black tracking-wider flex items-center space-x-1 border border-primary/10 shadow-xs cursor-help">
                            <span>{LEGEND_MAP[team.name].icon}</span>
                            <span>{LEGEND_MAP[team.name].label}</span>
                          </span>

                          {/* Hover Caricature Popover */}
                          <div className="absolute left-6 top-12 z-50 hidden group-hover/cell:flex flex-col items-center bg-white border border-slate-200 p-3 rounded-lg shadow-xl w-44 animate-in fade-in duration-200 pointer-events-none">
                            <div className="w-24 h-28 flex items-center justify-center overflow-hidden bg-slate-50 border border-slate-100 rounded p-1 mb-2">
                              <img
                                src={LEGEND_MAP[team.name].stickerUrl}
                                alt={LEGEND_MAP[team.name].parodyName}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <p className="text-xs font-black text-primary text-center leading-tight uppercase font-source">
                              {LEGEND_MAP[team.name].parodyName}
                            </p>
                            <span className="text-[8px] font-bold text-slate-400 font-mono tracking-widest mt-0.5 uppercase">
                              442OONS ICON
                            </span>
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-slate-600 font-mono">{team.group_name}</td>
                    <td className="px-6 py-4 text-right font-semibold font-mono text-slate-700">{Math.round(team.elo)}</td>
                    <td className="px-6 py-4 text-right font-semibold font-mono text-emerald-600">{Math.round(team.off_rating)}</td>
                    <td className="px-6 py-4 text-right font-semibold font-mono text-indigo-600">{Math.round(team.def_rating)}</td>
                    <td className="px-6 py-4 text-right font-semibold font-mono text-slate-700">{team.group_qual_pct}%</td>
                    <td className="px-6 py-4 text-right font-black font-mono text-primary bg-primary/5">{team.win_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
