import type { Metadata } from "next";
import { Inter, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 AI Forecasting Platform | Opta Style Analytics",
  description: "Production-grade football analytics platform predicting every match of the 2026 FIFA World Cup and estimating championship probabilities using ensembled ML models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-accent/10 selection:text-accent">
        {/* Host Nations Banner */}
        <div className="bg-slate-900 text-slate-300 text-[9px] font-bold uppercase tracking-widest py-1.5 px-4 text-center flex justify-center items-center space-x-4 sm:space-x-6 border-b border-primary/30 font-mono">
          <span className="text-slate-500 font-sans hidden sm:inline">FIFA World Cup 2026 Hosts:</span>
          <span className="flex items-center space-x-1.5">
            <img src="https://flagcdn.com/w20/ca.png" alt="Canada" className="w-3.5 h-2.5 object-cover rounded-xs border border-slate-700" />
            <span>Canada</span>
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center space-x-1.5">
            <img src="https://flagcdn.com/w20/mx.png" alt="Mexico" className="w-3.5 h-2.5 object-cover rounded-xs border border-slate-700" />
            <span>Mexico</span>
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center space-x-1.5">
            <img src="https://flagcdn.com/w20/us.png" alt="USA" className="w-3.5 h-2.5 object-cover rounded-xs border border-slate-700" />
            <span>United States</span>
          </span>
        </div>

        {/* Navigation Header */}
        <header className="sticky top-0 z-50 bg-primary text-white border-b border-primary/20 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Brand Logo */}
              <div className="flex items-center space-x-3">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="text-xl font-bold tracking-wider font-source font-extrabold text-white">
                    FIFA <span className="text-accent">FORECAST</span> 2026
                  </span>
                </Link>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 mr-1 bg-emerald-400 rounded-full animate-pulse"></span>
                  AI ENGINE ACTIVE
                </span>
              </div>

              {/* Navigation Links */}
              <nav className="flex space-x-1 sm:space-x-4">
                <Link
                  href="/"
                  className="px-3 py-2 rounded-md text-sm font-semibold text-slate-300 hover:text-white transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/predictions"
                  className="px-3 py-2 rounded-md text-sm font-semibold text-slate-300 hover:text-white transition"
                >
                  Predictions
                </Link>
                <Link
                  href="/rankings"
                  className="px-3 py-2 rounded-md text-sm font-semibold text-slate-300 hover:text-white transition"
                >
                  Power Rankings
                </Link>
                <Link
                  href="/simulator"
                  className="px-3 py-2 rounded-md text-sm font-semibold text-slate-300 hover:text-white transition"
                >
                  Simulator
                </Link>
                <Link
                  href="/analytics"
                  className="px-3 py-2 rounded-md text-sm font-semibold text-slate-300 hover:text-white transition"
                >
                  Analytics
                </Link>
                <Link
                  href="/players"
                  className="px-3 py-2 rounded-md text-sm font-semibold text-slate-300 hover:text-white transition"
                >
                  Player Stats
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Editorial Footer */}
        <footer className="bg-primary text-slate-400 border-t border-primary/20 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <p className="text-sm">
              FIFA World Cup 2026 AI Forecasting Platform is a predictive sports media and analytics service.
            </p>
            <p className="text-xs text-slate-500">
              Predictions are generated by an ensembled forecasting engine combining Dixon-Coles Poisson ratings, dynamic Elo engines, and ensembled gradient boosting algorithms (XGBoost/LightGBM/CatBoost) trained on 1930–2022 historical match datasets.
            </p>
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} FIFA FORECAST 2026. Designed and developed by Amish. All rights reserved. Not affiliated with FIFA.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

