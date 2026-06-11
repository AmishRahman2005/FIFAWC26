# ⚽ FIFA World Cup 2026 AI Forecaster

An advanced machine learning and Monte Carlo simulation application that forecasts the entire **FIFA World Cup 2026**. 

Built with a **FastAPI backend** utilizing ensembled ELO, Dixon-Coles, and XGBoost models, and a premium **Next.js frontend** showcasing predictions, player statistics, and an interactive tournament bracket simulator.

---

## 🌐 Live Deployments

* **Live Application (Frontend)**: [https://wcpredictor-26.vercel.app](https://wcpredictor-26.vercel.app)
* **Production API (Backend)**: [https://fifa-wc26-backend.onrender.com](https://fifa-wc26-backend.onrender.com)

---

## 🚀 Key Features

* **AI Match Predictions**: Compiles ensembled probabilities (Home Win, Draw, Away Win) for all World Cup fixtures.
* **100,000 Monte Carlo Simulations**: Forecasts path progressions, group stage exits, and final winner probabilities.
* **Interactive Bracket Simulator**: Allows users to temporarily boost team Elo ratings in real-time and simulate custom tournament brackets instantly.
* **Explainable AI (XAI)**: Displays feature importances (Elo differences, offensive potency, tournament pedigree) explaining every match prediction.
* **Premium Parodied Themes**: Includes parodied player names and 442oons cartoon sticker caricatures (e.g. *Lionel Messigician*, *Cristiano Arrogantaldo*, *Notaxmar*) for core stars alongside 240+ real player projections.

---

## 🛠️ Architecture & Technical Stack

```
                                +-------------------+
                                | kaggle_results.csv |
                                | kaggle_shootouts.  |
                                +---------+---------+
                                          |
                                          v
                                +-------------------+
                                | data_pipeline.py  |  (Cleans & merges data)
                                +---------+---------+
                                          |
                                          v
                                +-------------------+
                                |   ml_engine.py    |  (Trains ELO, Dixon-Coles, XGBoost)
                                +---------+---------+
                                          |
                                          v
                                +-------------------+
                                |   simulator.py    |  (Runs Monte Carlo tournament sims)
                                +---------+---------+
                                          |
                                          v
                                +-------------------+
                                |    worldcup.db    |  (SQLite DB storage)
                                +---------+---------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
             +--------------------+               +--------------------+
             |  FastAPI Backend   |               |  Next.js Frontend  |
             | (http://localhost) |               | (http://localhost) |
             +--------------------+               +--------------------+
```

### Backend (Python)
* **Elo Engine (`elo_engine.py`)**: Custom time-decaying overall, offensive, and defensive team ELO ratings calculated over 49,000+ historical international fixtures.
* **Dixon-Coles Model (`dixon_coles.py`)**: Goal-concession Poisson regression optimizing home-field parameters and low-score draw likelihoods.
* **ML Classifiers (`ml_engine.py`)**: XGBoost classifier trained on ELO, form features, head-to-head records, and historical World Cup experience.
* **Bayesian Calibration (`calibration.py`)**: Platt scaling calibration on ensembled probability distributions to correct skewed outcomes.
* **FastAPI Server (`main.py`)**: Serves team strengths, predictions, simulation odds, and custom boosts.

### Frontend (Next.js / TypeScript / CSS)
* Sleek, high-fidelity dark-mode interface with glassmorphism panels.
* Dynamic dashboard with tournament marquee ticker, upcoming matches, and playroom stars.
* Standings page with complete group stage points and knockout brackets.
* Interactive Bracket Simulator on `/simulator`.

---

## 🏃 Run the Project Locally

### 1. Backend Setup

From the root directory, navigate to the backend folder:
```bash
cd backend
```

Install the dependencies:
```bash
pip install -r requirements.txt
```

Run the pipeline to compile historical datasets, train the models, and run the Monte Carlo simulation (saves results to SQLite):
```bash
python run_pipeline.py
```

Start the FastAPI backend server:
```bash
python main.py
```
The backend will run on `http://127.0.0.1:8000`.

### 2. Frontend Setup

From the root directory, navigate to the frontend folder:
```bash
cd frontend
```

Install node packages:
```bash
npm install
```

Run the Next.js development server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.


---

## ☁️ Cloud Deployment Configuration

### 1. Backend on Render (Free Tier)
To bypass memory limitations (~512MB RAM) and prevent Out-Of-Memory (OOM) build failures during sequential model training, the production build uses a lightweight seeding script:
* **Build Command**: `pip install -r backend/requirements.txt && python backend/run_deploy_pipeline.py`
* **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port 10000`
* **Mechanism**: Bypasses offline model training by loading the checked-in weights (`forecasting_models.pkl`), populating the SQLite DB, and running the simulation index in under 15 seconds using under 100MB of RAM.

### 2. Frontend on Vercel
* **Root Directory**: `frontend`
* **Framework Preset**: `Next.js`
* **Environment Variables**: Add `NEXT_PUBLIC_API_URL` set to your live Render service url (e.g. `https://fifa-wc26-backend.onrender.com`).

---

## 📊 Model Performance

Our XGBoost-centered ensemble model achieves:
* **Accuracy**: ~61.3% on historical validation match results (post-2018).
* **Validation Log Loss**: 0.8435.
* Feature importances highlight **Elo differences**, **Offensive Elo differences**, and **Historical WC Appearances** as the top predictive metrics.
