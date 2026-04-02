# 🌌 AlgoForge: The Ultimate Project Deep-Dive

AlgoForge is a state-of-the-art, full-stack algorithmic trading platform specifically engineered for the Indian Equity Markets (NSE/BSE). It bridges the gap between complex quantitative finance and retail trading by providing a **zero-code**, **AI-enhanced** environment for strategy development, backtesting, and market analysis.

---

## 🏗️ 1. Technical Architecture

AlgoForge follows a modern, decoupled **Dual-Stack** architecture, ensuring high performance for mathematical computations while maintaining a premium, responsive user interface.

### 🌐 Frontend Layer (The Cockpit)
- **Framework:** [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/) for robust type safety.
- **Build Engine:** [Vite 5](https://vitejs.dev/) for lightning-fast development and optimized production builds.
- **State Management:** Utilizes **React Context API** (`AuthContext`, `DataContext`, `ThemeContext`) to manage global states.
- **Design System:** A custom CSS system integrated with **Aceternity UI** for advanced animations (Holographic Sheen, Data Pulse, Hex Grid, Scan Line).
- **Visualization:** Interative charts using [Recharts](https://recharts.org/) and [Lucide React](https://lucide.dev/) for iconography.

### 🖥️ Backend Layer (The Engine Room)
- **Language:** [Python 3.10+](https://www.python.org/)
- **API Framework:** [Flask](https://flask.palletsprojects.com/) with modular blueprints for quant logic.
- **Mathematical Core:** `pandas` and `NumPy` for time-series and indicator calculations.
- **Persistence:** **SQLite** (`algoforge.db`) for storing strategies and broker credentials.
- **Inference Engine:** Integration with **Groq Cloud** using **LLaMA 3.3 70B** for natural language to quantitative logic translation.

---

## 🚀 2. Core Functional Modules

### 📈 2.1 Live Market Intelligence
- **Dashboard:** 30-second automated polling of NIFTY 50, BANK NIFTY, and SENSEX.
- **Market Breadth:** Real-time Advance/Decline ratio visualization.
- **Top Movers:** Dynamic tracking of top 10 gainers and losers.

### 🧪 2.2 Backtesting Lab (Historical Simulator)
- **Data Source:** Daily OHLCV fetching via `yfinance`.
- **Institutional Metrics:** Calculates **Sharpe, Sortino, Calmar Ratios**, **Max Drawdown**, and **CAGR**.
- **Visual Validation:** Equity curve charting and downloadable CSV trade logs.

### 🤖 2.3 AI Strategy Builder
- **NLP Engine:** Powered by LLaMA 3.3 70B via Groq.
- **Execution:** Converts natural language descriptions into executable **JSON strategy payloads**.
- **Optimization:** AI-suggested improvements for existing strategies.

---

## 📊 3. Specialized Quantitative Dashboards

AlgoForge provides a suite of advanced dashboards for deep market analysis:

### 📊 3.1 Open Interest (OI) Analysis
- **Buildup Classification:** Long Buildup, Short Buildup, Short Covering, Long Unwinding.
- **Concentration:** Identifies Max Call/Put OI strikes (Resistance/Support).
- **Sentiment:** Automated sentiment scoring based on PCR and OI shifts.

### ⚡ 3.2 Gamma Exposure (GEX)
- **Dealer GEX:** Tracks net gamma exposure by strike.
- **Gamma Walls:** Identifies key price levels where dealer hedging may impact volatility.
- **Gamma Flip:** Automatically calculates the psychological "flip" price point.

### 🔥 3.3 Options Heatmap
- **Visual Intensity:** Heat-mapped strike-level analysis of OI, Volume, and IV.
- **Moneyness View:** Visualizes data across OTM, ATM, and ITM strikes.

### 🌊 3.4 Volatility Analytics
- **IV Smile / Skew:** Visualizes implied volatility across different strikes.
- **Term Structure:** Analyzes IV across different expiry dates (time-series).
- **ATM IV Stats:** Mean, median, min/max metrics for current volatility regime.

### 🧠 3.5 Quant Signal Engine
- **Composite Score:** Multi-factor score (OI, IV, Vol, Gamma) for directional bias.
- **Signal Radar:** Radar charts visualizing strength across different quant categories.

### 📉 3.6 Futures & Flow
- **Futures Analytics:** Basis analysis, Premium/Discount tracking, and PCR Distribution.
- **Options Flow:** Unusual activity detection, block trades, and "Smart Money" flow tracking.

---

## 📂 4. Module & File Structure

| Module | Core Responsibility | Key Files |
|---|---|---|
| **Quant Engines** | Specialized math logic | `engines/greeks.py`, `engines/gex_engine.py`, `engines/iv_engine.py` |
| **Backtesting** | Historical simulation | `app.py` (`/api/backtest`), `engines/strategy_engine.py` |
| **Market Data** | Data ingestion (YF/NSE) | `DataContext.tsx`, `app.py` (`/api/market`, `/api/options`) |
| **AI Layer** | LLaMA 3.3 integration | `app.py` (`/api/ai-strategy`), `engines/ai_analyst.py` |
| **State Providers** | Global state & Auth | `contexts/AuthContext.tsx`, `contexts/DataContext.tsx` |

---

## 🛠️ 5. Setup & Development Guide

### Prerequisites
1. **Node.js 18+** & **npm**
2. **Python 3.10+** (with `venv`)
3. **Groq API Key** (for AI features)

### Backend Setup
```bash
cd python_service_data
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
# Add GROQ_API_KEY to .env
python app.py
```

### Frontend Setup
```bash
npm install
npm run dev
```

---

## 🛡️ 6. Risk & Education
- **Risk Management:** Volatility-based stop-loss and position sizing tools.
- **Learning Hub:** Educational modules on algo trading, quantitative greeks, and strategy design.
- **Paper Portfolio:** Fully simulated virtual trading to validate strategies with zero risk.

---
*AlgoForge: Revolutionizing Retail Algorithmic Trading in India.*
