"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ScatterChart, Scatter, LabelList } from "recharts";
import { TrendingUp, BarChart3, ScatterChart as ScatterIcon, Landmark, Info } from "lucide-react";

// Mock datasets for charting fallbacks
const MOCK_ELO_HISTORY = [
  { year: "2014", Argentina: 1850, Brazil: 1890, France: 1740, England: 1730, Spain: 1880 },
  { year: "2016", Argentina: 1910, Brazil: 1790, France: 1820, England: 1740, Spain: 1820 },
  { year: "2018", Argentina: 1810, Brazil: 1930, France: 1960, England: 1820, Spain: 1860 },
  { year: "2020", Argentina: 1840, Brazil: 1950, France: 1930, England: 1880, Spain: 1840 },
  { year: "2022", Argentina: 1990, Brazil: 1960, France: 1940, England: 1890, Spain: 1850 },
  { year: "2024", Argentina: 1980, Brazil: 1930, France: 1920, England: 1910, Spain: 1890 },
  { year: "2026", Argentina: 1982, Brazil: 1962, France: 1932, England: 1918, Spain: 1898 }
];

const MOCK_IMPORTANCE = [
  { name: "Elo Difference", value: 38 },
  { name: "Dixon-Coles Expected Goals", value: 28 },
  { name: "Rolling Form (GD last 5)", value: 14 },
  { name: "Head-to-Head win ratio", value: 10 },
  { name: "World Cup Experience", value: 6 },
  { name: "Continental Strength", value: 4 }
];

const MOCK_SCATTER = [
  { name: "ARG", attack: 1184, defense: 1142, elo: 1982 },
  { name: "BRA", attack: 1168, defense: 1134, elo: 1962 },
  { name: "FRA", attack: 1215, defense: 1104, elo: 1932 },
  { name: "ENG", attack: 1142, defense: 1122, elo: 1918 },
  { name: "ESP", attack: 1135, defense: 1114, elo: 1898 },
  { name: "NED", attack: 1122, defense: 1092, elo: 1864 },
  { name: "POR", attack: 1152, defense: 1085, elo: 1872 },
  { name: "GER", attack: 1112, defense: 1054, elo: 1824 },
  { name: "BEL", attack: 1102, defense: 1084, elo: 1832 },
  { name: "CRO", attack: 1052, defense: 1094, elo: 1812 },
  { name: "MOR", attack: 1045, defense: 1084, elo: 1762 },
  { name: "USA", attack: 1032, defense: 1042, elo: 1732 }
];

export default function Analytics() {
  const [mounted, setMounted] = useState(false);
  const [eloHistory, setEloHistory] = useState(MOCK_ELO_HISTORY);
  const [featImportance, setFeatImportance] = useState(MOCK_IMPORTANCE);
  const [scatterData, setScatterData] = useState(MOCK_SCATTER);
  const [backendActive, setBackendActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Attempt to fetch from API
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/analytics");
        if (res.ok) {
          const data = await res.json();
          
          // Reconstruct Elo History lines from DB values
          if (data.history && data.history.length > 0) {
            // Group by year and pivot
            const p_history: Record<string, any> = {};
            data.history.forEach((pt: any) => {
              const yr = pt.date.slice(0, 4);
              if (!p_history[yr]) p_history[yr] = { year: yr };
              p_history[yr][pt.team] = pt.elo;
            });
            const lineData = Object.values(p_history).sort((a: any, b: any) => Number(a.year) - Number(b.year));
            setEloHistory(lineData);
          }
          
          // Format Scatter plot details
          if (data.teams && data.teams.length > 0) {
            const sc_pts = data.teams
              .filter((t: any) => t.elo > 1700) // Filter to top teams to keep scatter legible
              .map((t: any) => ({
                name: t.name.slice(0, 3).toUpperCase(),
                attack: Math.round(t.off_rating),
                defense: Math.round(t.def_rating),
                elo: Math.round(t.elo)
              }));
            setScatterData(sc_pts);
          }
          
          // Format feature importance
          if (data.feature_importances && Object.keys(data.feature_importances).length > 0) {
            const formattedFeat = Object.entries(data.feature_importances)
              .map(([name, val]: [string, any]) => ({
                name: name.replace("_", " ").replace("diff", ""),
                value: Math.round(val * 100)
              }))
              .sort((a, b) => b.value - a.value);
            setFeatImportance(formattedFeat);
          }
          
          setBackendActive(true);
        }
      } catch (err) {
        console.log("Loading mock analytics presets.");
      }
    };
    
    fetchAnalytics();
  }, []);

  // Return empty loader or null during SSR to prevent hydration warnings from Recharts
  if (!mounted) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-500 text-sm font-semibold animate-pulse">Loading analytics frames...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b-4 border-primary pb-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary font-source uppercase">
          Advanced Forecasting Analytics
        </h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">
          D3 VISUALIZATIONS &nbsp;|&nbsp; ELO RATINGS TRAJECTORIES &nbsp;|&nbsp; ATTACK VS DEFENSE CLUSTERS
        </p>
      </div>

      {/* Grid: ELO Evolution and Attack vs Defense */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Elo History Chart */}
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-primary flex items-center space-x-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-5 h-5 text-secondary" />
            <span>Historical Elo Evolution (Top Teams)</span>
          </h3>
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={eloHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" stroke="#64748b" style={{ fontSize: 11, fontWeight: 'bold' }} />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" style={{ fontSize: 11, fontWeight: 'bold' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="Argentina" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Brazil" stroke="#eab308" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="France" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="England" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Spain" stroke="#b91c1c" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strength Scatter Chart */}
        <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-primary flex items-center space-x-2 border-b border-slate-100 pb-3">
            <ScatterIcon className="w-5 h-5 text-secondary" />
            <span>Attack vs Defense Parameter Distribution</span>
          </h3>
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="attack" name="Attack Rating" domain={['auto', 'auto']} stroke="#64748b" style={{ fontSize: 11, fontWeight: 'bold' }} label={{ value: 'Attack Parameter', position: 'bottom', offset: 0, style: { fontSize: 11, fontWeight: 'bold', fill: '#64748b' } }} />
                <YAxis type="number" dataKey="defense" name="Defense Rating" domain={['auto', 'auto']} stroke="#64748b" style={{ fontSize: 11, fontWeight: 'bold' }} label={{ value: 'Defense Parameter', angle: -90, position: 'insideLeft', style: { fontSize: 11, fontWeight: 'bold', fill: '#64748b' } }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Teams" data={scatterData} fill="#1d4ed8">
                  <LabelList dataKey="name" position="top" style={{ fontSize: 10, fontWeight: 'black', fill: '#0a2342' }} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Feature Importance visualizer */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-primary flex items-center space-x-2 border-b border-slate-100 pb-3">
          <BarChart3 className="w-5 h-5 text-secondary" />
          <span>Global Model Feature Importances</span>
        </h3>
        <div className="h-[250px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={featImportance} margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 50]} stroke="#64748b" style={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis type="category" dataKey="name" stroke="#64748b" style={{ fontSize: 11, fontWeight: 'bold' }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0A2342" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="value" position="right" formatter={(v: any) => `${v}%`} style={{ fontSize: 10, fontWeight: 'bold', fill: '#0a2342' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytical Notes */}
      <div className="bg-slate-50 border border-slate-200 rounded p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Statistical Reading Guide</h4>
            <p className="text-slate-600 text-xxs leading-relaxed">
              * **Elo Evolution Chart**: Traces overall ratings chronologically. Updates are weighted by tournament stage and goal margins.
              <br />
              * **Attack vs Defense Scatter**: Teams plotted further right have superior goal scoring ratios (Dixon-Coles alpha parameter); teams plotted higher have stronger goal concession avoidance parameters (Dixon-Coles beta parameter).
              <br />
              * **Feature Importances**: Extracted directly from ensembled gradient boost classifiers (XGBoost/LightGBM/CatBoost), showing the normalized percentage influence of each feature on match predictions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
