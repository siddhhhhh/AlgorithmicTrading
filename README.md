<p align="center">
  <img src="https://img.shields.io/badge/AlgoForge-Algorithmic%20Trading-blueviolet?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPjxwb2x5bGluZSBwb2ludHM9IjIyIDEyIDE4IDEyIDE1IDE5IDkgNSA2IDEyIDIgMTIiPjwvcG9seWxpbmU+PC9zdmc+" alt="AlgoForge Badge"/>
</p>

<h1 align="center">🔥 AlgoForge</h1>

<p align="center">
  <strong>A full-stack algorithmic trading platform for the Indian stock market</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Flask-2.x-000000?logo=flask&logoColor=white" alt="Flask"/>
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Groq_AI-LLaMA_3.3-FF6600?logo=meta&logoColor=white" alt="Groq AI"/>
</p>

<p align="center">
  Build, backtest, and analyse trading strategies for NSE/BSE — <em>without writing a single line of code.</em><br/>
  A free, open-source alternative to <a href="https://web.algorooms.com">AlgoRooms</a> and <a href="https://opstra.definedge.com">Opstra</a>, focused on learning and paper trading.
</p>

---

## ✨ Features at a Glance

| Feature | Description |
|---|---|
| 📊 **Live Market Dashboard** | Real-time SENSEX, NIFTY 50 & BANK NIFTY with all 50 Nifty stocks, market breadth, top gainers/losers |
| 🧪 **Backtesting Lab** | Run historical simulations with 4 built-in strategies — full equity curve + downloadable CSV |
| 🎯 **No-Code Strategy Builder** | Drag-and-drop rules using dropdowns — no programming required |
| 🤖 **AI Strategy Builder** | Describe a strategy in plain English → LLaMA 3.3 (via Groq) generates the full config |
| 📈 **Options Chain Viewer** | Live NSE options data for NIFTY, BANKNIFTY & FINNIFTY with IV, OI, Greeks |
| 🔗 **Broker Integration** | Connect to 6 Indian brokers (Zerodha, Upstox, Angel One, 5paisa, Fyers, Alice Blue) |
| 📁 **Paper Portfolio** | Track virtual positions & P\&L with zero real money |
| 🛡️ **Risk Management** | Position sizing tools, stop-loss calculators, and risk guidelines |
| 📚 **Learning Hub** | Educational content on algo trading, strategies, and market concepts |
| 👥 **Community** | Discussion forum to share strategies and insights |
| 💳 **Billing & Plans** | Subscription tiers with interactive pricing (mock) |
| 🔐 **Authentication** | Login / Register with gamification (XP, levels, credits) |

---

## 📊 Live Market Dashboard

Pulls **real-time data** from Yahoo Finance every 30 seconds:

- **3 Major Indices** — SENSEX, NIFTY 50, BANK NIFTY (price, change, % move)
- **All 50 Nifty Stocks** — price, change %, volume, P/E ratio, sector
- **Market Breadth** — advances vs declines with A/D ratio visualisation
- **Top Movers** — auto-sorted top 10 gainers and losers

---

## 🧪 Backtesting Lab

The core analytical feature. Select any Indian stock, pick a strategy, set a date range, and **simulate how it would have performed historically**.

### How It Works

```
1. Choose → symbol (e.g. RELIANCE), strategy, date range, capital (₹), brokerage %
2. Fetch  → backend downloads real OHLCV data from Yahoo Finance
3. Run    → strategy's buy/sell logic is executed day-by-day through history
4. Sim    → full portfolio simulation — tracking cash, shares, and transaction costs
5. Result → equity curve, trade log, and detailed performance metrics
```

### Built-in Strategies

| Strategy | Logic |
|---|---|
| **MA Crossover** | Buy when 20-day SMA > 50-day SMA, sell on reverse |
| **RSI Mean Reversion** | Buy when RSI < 30 (oversold), sell when RSI > 70 (overbought) |
| **Breakout** | Buy when price breaks 20-day high, sell on 20-day low break |
| **MACD Crossover** | Buy when MACD line crosses above signal line |

### Metrics Calculated

| Category | Metrics |
|---|---|
| **Returns** | Total Return, Annualised Return (CAGR) |
| **Risk-Adjusted** | Sharpe Ratio, Sortino Ratio, Calmar Ratio |
| **Drawdown** | Max Drawdown |
| **Trade Stats** | Win Rate, Profit Factor, Avg Win/Loss, Total Trades |
| **Outputs** | SVG equity curve chart, downloadable CSV trade log |

---

## 🤖 AI Strategy Builder

Powered by **LLaMA 3.3 70B** via Groq's inference API.

- **Describe** your trading idea in plain English
- **Generate** a fully structured strategy config (instruments, indicators, entry/exit rules, risk management)
- **Explain** any strategy in beginner-friendly language
- **Optimize** existing strategies with AI-suggested improvements
- **6 Pre-built Templates** — Momentum Breakout, Mean Reversion, MACD Crossover, Intraday Scalper, Swing Trading, Iron Condor

> **Note:** Requires a free [Groq API key](https://console.groq.com/) in `python_service_data/.env`

---

## 🔗 Broker Integration

Connect your trading accounts for live order management:

| Broker | Status | Pricing |
|---|---|---|
| 🟢 Zerodha (Kite Connect) | ✅ Active | ₹2,000/mo |
| 🟣 Upstox (Developer API v2) | ✅ Active | Free |
| 🔶 Angel One (SmartAPI) | ✅ Active | Free |
| 🔵 5paisa (Connect API) | ✅ Active | Free |
| 🟡 Fyers (API v3) | ✅ Active | Free |
| 🔷 Alice Blue (Ant API) | ✅ Active | Free |
| 🟠 Motilal Oswal | 🔜 Coming Soon | — |
| 🏦 ICICI Direct (Breeze) | 🔜 Coming Soon | — |
| 💚 Groww | 🔜 Coming Soon | — |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · TypeScript · Vite 5 |
| **Styling** | Custom CSS design system (light theme, dark sidebar) |
| **Routing** | React Router v6 |
| **Icons** | Lucide React |
| **Backend** | Python · Flask · Flask-CORS |
| **Market Data** | Yahoo Finance (`yfinance`) |
| **Options Data** | NSE India public API |
| **AI Engine** | Groq (LLaMA 3.3 70B Versatile) |
| **Calculations** | pandas · NumPy |
| **Database** | SQLite (strategy & broker storage) |
| **Auth** | Mock (localStorage with gamification) |

---

## 📂 Project Structure

```
AlgoForge/
├── src/                              # React frontend
│   ├── App.tsx                       # Root router & route definitions
│   ├── main.tsx                      # React entry point
│   ├── index.css                     # Design system (custom CSS, 500+ lines)
│   ├── contexts/
│   │   ├── AuthContext.tsx           # Mock auth (login/register/logout, XP, levels)
│   │   ├── DataContext.tsx           # Market data polling (REST, 30s interval)
│   │   └── ThemeContext.tsx          # Theme provider
│   ├── components/
│   │   ├── layout/
│   │   │   └── DashboardLayout.tsx   # Sidebar + topbar shell
│   │   └── ui/
│   │       └── AceternityEffects.tsx # Premium UI effects & animations
│   └── pages/
│       ├── LandingPage.tsx           # Public homepage
│       ├── LoginPage.tsx             # Login form
│       ├── RegisterPage.tsx          # Registration form
│       ├── DashboardPage.tsx         # Main dashboard with indices & stocks
│       ├── MarketPage.tsx            # Live market data + options chain
│       ├── BacktestingPage.tsx       # Backtesting lab
│       ├── StrategyBuilderPage.tsx   # No-code rule-based builder
│       ├── AIStrategyBuilderPage.tsx # AI-powered strategy generation
│       ├── BrokerIntegrationPage.tsx # Broker connection management
│       ├── Portfolio.tsx             # Paper portfolio tracker
│       ├── RiskManagementPage.tsx    # Risk tools & guidelines
│       ├── LearningHubPage.tsx       # Educational content
│       ├── CommunityPage.tsx         # Discussion forum
│       └── BillingPage.tsx           # Subscription plans & pricing
│
├── python_service_data/              # Python Flask backend
│   ├── app.py                        # All API endpoints (~920 lines)
│   ├── requirements.txt              # Python dependencies
│   └── .env                          # 🔒 API keys (not committed)
│
├── index.html                        # Vite HTML entry
├── package.json                      # Node.js dependencies
├── vite.config.ts                    # Vite configuration
├── tailwind.config.js                # Tailwind (legacy, minimal use)
├── tsconfig.json                     # TypeScript config
└── .gitignore                        # Git ignore rules
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x & **npm** ≥ 9.x
- **Python** ≥ 3.10
- A free **[Groq API Key](https://console.groq.com/)** (for AI Strategy Builder)

### 1. Clone the Repository

```bash
git clone https://github.com/shaueyakitawat/AlgoForge.git
cd AlgoForge
```

### 2. Set Up the Backend

```bash
cd python_service_data

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
.\venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside `python_service_data/`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

> Get your free API key at [console.groq.com](https://console.groq.com/)

### 4. Start the Backend

```bash
# From inside python_service_data/
python app.py
# 🚀 Server starts on http://localhost:5001
```

### 5. Set Up & Start the Frontend

```bash
# From the project root (AlgoForge/)
npm install
npm run dev
# ⚡ Dev server starts on http://localhost:5173
```

### 6. Open the App

Navigate to **http://localhost:5173** → Login with any email/password → Start trading!

---

## 📡 API Reference

### Market Data

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/health` | GET | Server status check |
| `GET /api/market` | GET | All Nifty 50 stocks + 3 indices + market breadth |
| `GET /api/stock/<symbol>` | GET | Detailed stock info + 1-year price history |
| `GET /api/options/<symbol>` | GET | NSE options chain for NIFTY/BANKNIFTY |

### Backtesting

| Endpoint | Method | Description |
|---|---|---|
| `POST /api/backtest` | POST | Run a backtest (symbol, strategy, dates, capital, brokerage) |

### Strategy Management

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/strategy` | GET | List all saved strategies |
| `POST /api/strategy` | POST | Save a new strategy |
| `DELETE /api/strategy/<id>` | DELETE | Delete a saved strategy |

### AI Strategy Builder

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/ai-strategy/templates` | GET | Get pre-built strategy templates |
| `POST /api/ai-strategy/generate` | POST | Generate a strategy from natural language |
| `POST /api/ai-strategy/explain` | POST | Get a beginner-friendly explanation |
| `POST /api/ai-strategy/optimize` | POST | Get AI-powered optimisation suggestions |

### Broker Integration

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/brokers` | GET | List all supported brokers with connection status |
| `POST /api/brokers/connect` | POST | Save broker API credentials |
| `POST /api/brokers/disconnect` | POST | Remove broker connection |
| `GET /api/brokers/status` | GET | Check connection health |

---

## 🎯 Target Audience

- 🇮🇳 **Indian retail traders** who want to test strategies on NSE/BSE data
- 🎓 **Students** learning algorithmic trading concepts without risking real money
- 📊 **Analysts** who want to understand Sharpe Ratio, Max Drawdown, and Win Rate
- 🧑‍💻 **Developers** building algo trading tools for Indian markets

---

## ⚠️ Limitations

| Limitation | Details |
|---|---|
| **Paper trading only** | No live order execution — broker integration is for API setup only |
| **Daily timeframe** | Backtesting uses end-of-day data, not intraday candles |
| **Yahoo Finance** | Free but occasionally unreliable; may throttle requests |
| **NSE options scrape** | Can be rate-limited by NSE; falls back to empty data |
| **Mock auth** | No real user database; data stored in browser localStorage |

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ for the Indian trading community
</p>
