from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import numpy as np
import requests
import json
import sqlite3
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Load .env before anything else
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)
CORS(app)

# ── Groq client (lazy — only created when AI endpoints are called) ────────────
_groq_client = None
GROQ_MODEL = "llama-3.3-70b-versatile"

def get_groq():
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key or api_key == "your_groq_api_key_here":
            raise RuntimeError("GROQ_API_KEY not set. Add your key to python_service_data/.env")
        from groq import Groq
        _groq_client = Groq(api_key=api_key)
    return _groq_client

# ── SQLite setup ──────────────────────────────────────────────────────────────
DB_PATH = os.path.join(os.path.dirname(__file__), "algoforge.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS strategies (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            config TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS broker_connections (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            broker_id    TEXT NOT NULL UNIQUE,
            api_key      TEXT NOT NULL,
            api_secret   TEXT DEFAULT '',
            client_id    TEXT DEFAULT '',
            access_token TEXT DEFAULT '',
            status       TEXT DEFAULT 'connected',
            connected_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ── Nifty50 + Indices ─────────────────────────────────────────────────────────
INDEX_SYMBOLS = ["^BSESN", "^NSEI", "^NSEBANK"]

NIFTY_50_SYMBOLS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS",
    "HINDUNILVR.NS", "BHARTIARTL.NS", "ITC.NS", "SBIN.NS", "LT.NS",
    "BAJFINANCE.NS", "HCLTECH.NS", "KOTAKBANK.NS", "MARUTI.NS",
    "SUNPHARMA.NS", "ONGC.NS", "NTPC.NS", "ADANIENT.NS", "WIPRO.NS",
    "AXISBANK.NS", "ULTRACEMCO.NS", "NESTLEIND.NS", "ASIANPAINT.NS", "TITAN.NS",
    "TECHM.NS", "POWERGRID.NS", "COALINDIA.NS", "BAJAJ-AUTO.NS", "GRASIM.NS",
    "DIVISLAB.NS", "DRREDDY.NS", "EICHERMOT.NS", "HDFCLIFE.NS",
    "HEROMOTOCO.NS", "HINDALCO.NS", "INDUSINDBK.NS", "JSWSTEEL.NS",
    "CIPLA.NS", "BRITANNIA.NS", "APOLLOHOSP.NS", "BPCL.NS", "SBILIFE.NS",
    "SHREECEM.NS", "TATACONSUM.NS", "TATASTEEL.NS",
    "ADANIPORTS.NS", "TRENT.NS", "BEL.NS",
]

# ── Helpers ───────────────────────────────────────────────────────────────────
def safe_float(v, default=None):
    """Convert to float safely. Returns default if conversion fails or value is non-finite."""
    try:
        if v is None:
            return default
        f = float(v)
        return f if np.isfinite(f) else default
    except (TypeError, ValueError, OverflowError):
        return default

def fetch_quote(ticker_obj):
    try:
        info = ticker_obj.info or {}
        return info
    except Exception:
        return {}

# ── / (root) ──────────────────────────────────────────────────────────────────
@app.route("/")
def root():
    return jsonify({"name": "AlgoForge Backend", "status": "running", "version": "1.0"})

# ── /api/health ───────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()})

# ── /api/market ───────────────────────────────────────────────────────────────
@app.route("/api/market")
def get_market_data():
    try:
        # Indices
        indices_data = []
        for sym in INDEX_SYMBOLS:
            try:
                t = yf.Ticker(sym)
                info = t.info or {}
                price = safe_float(info.get("regularMarketPrice"))
                change = safe_float(info.get("regularMarketChange"))
                changePct = safe_float(info.get("regularMarketChangePercent"))
                name_map = {"^BSESN": "SENSEX", "^NSEI": "NIFTY 50", "^NSEBANK": "BANK NIFTY"}
                indices_data.append({
                    "name": name_map.get(sym, sym),
                    "symbol": sym,
                    "value": price,
                    "change": change,
                    "changePercent": changePct,
                    "high": safe_float(info.get("regularMarketDayHigh")),
                    "low": safe_float(info.get("regularMarketDayLow")),
                    "open": safe_float(info.get("regularMarketOpen")),
                    "prevClose": safe_float(info.get("regularMarketPreviousClose")),
                })
            except Exception:
                pass

        # Stocks — fetch individually to prevent one bad symbol from crashing all
        all_stocks = []
        for sym in NIFTY_50_SYMBOLS:
            try:
                t = yf.Ticker(sym)
                info = t.info or {}
                price = safe_float(info.get("regularMarketPrice"))
                if price is None:
                    continue
                change = safe_float(info.get("regularMarketChange")) or 0
                changePct = safe_float(info.get("regularMarketChangePercent")) or 0
                display_sym = sym.replace(".NS", "")
                all_stocks.append({
                    "symbol": display_sym,
                    "yfsymbol": sym,
                    "price": price,
                    "change": change,
                    "changePercent": changePct,
                    "volume": safe_float(info.get("regularMarketVolume")) or 0,
                    "high": safe_float(info.get("regularMarketDayHigh")) or price,
                    "low": safe_float(info.get("regularMarketDayLow")) or price,
                    "open": safe_float(info.get("regularMarketOpen")) or price,
                    "previousClose": safe_float(info.get("regularMarketPreviousClose")) or price,
                    "marketCap": safe_float(info.get("marketCap")),
                    "pe": safe_float(info.get("trailingPE")),
                    "name": info.get("longName") or display_sym,
                    "sector": info.get("sector") or "N/A",
                })
            except Exception as ex:
                print(f"⚠ Skipping {sym}: {ex}")
                continue

        valid = [s for s in all_stocks if s["change"] is not None]
        advances = sum(1 for s in valid if (s["change"] or 0) > 0)
        declines = sum(1 for s in valid if (s["change"] or 0) < 0)
        unchanged = len(valid) - advances - declines
        ratio = round(advances / declines, 2) if declines > 0 else float(advances)

        top_gainers = sorted([s for s in valid if (s["changePercent"] or 0) > 0],
                             key=lambda x: x["changePercent"] or 0, reverse=True)[:10]
        top_losers = sorted([s for s in valid if (s["changePercent"] or 0) < 0],
                            key=lambda x: x["changePercent"] or 0)[:10]

        return jsonify({
            "indices": indices_data,
            "topGainers": top_gainers,
            "topLosers": top_losers,
            "topStocks": all_stocks,
            "marketBreadth": {
                "advances": advances,
                "declines": declines,
                "unchanged": unchanged,
                "ratio": ratio,
            },
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── /api/backtest ─────────────────────────────────────────────────────────────
@app.route("/api/backtest", methods=["POST"])
def run_backtest():
    try:
        body = request.get_json(force=True)
        symbol_raw = body.get("symbol", "RELIANCE").upper().replace(".NS", "")
        symbol = symbol_raw + ".NS"
        strategy = body.get("strategy", "MA Crossover")
        start_date = body.get("startDate", "2023-01-01")
        end_date = body.get("endDate", "2024-12-31")
        initial_capital = float(body.get("capital", 100000))
        brokerage_pct = float(body.get("brokerage", 0.05)) / 100

        # Fetch OHLCV
        df = yf.download(symbol, start=start_date, end=end_date, progress=False, auto_adjust=True)
        if df.empty:
            return jsonify({"error": f"No data for {symbol_raw}. Try RELIANCE, TCS, INFY etc."}), 400

        # Flatten multi-level columns from yf.download (single symbol)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
        df.dropna(inplace=True)

        # ── Strategy Signals ──────────────────────────────────────────────────
        if strategy == "MA Crossover":
            df["sma20"] = df["Close"].rolling(20).mean()
            df["sma50"] = df["Close"].rolling(50).mean()
            df["signal"] = 0
            df.loc[df["sma20"] > df["sma50"], "signal"] = 1
            df.loc[df["sma20"] < df["sma50"], "signal"] = -1

        elif strategy == "RSI Mean Reversion":
            delta = df["Close"].diff()
            gain = delta.clip(lower=0).rolling(14).mean()
            loss = (-delta.clip(upper=0)).rolling(14).mean()
            rs = gain / loss.replace(0, np.nan)
            df["rsi"] = 100 - 100 / (1 + rs)
            df["signal"] = 0
            df.loc[df["rsi"] < 30, "signal"] = 1
            df.loc[df["rsi"] > 70, "signal"] = -1

        elif strategy == "Breakout Strategy":
            df["rolling_high"] = df["High"].rolling(20).max()
            df["rolling_low"] = df["Low"].rolling(20).min()
            df["signal"] = 0
            df.loc[df["Close"] > df["rolling_high"].shift(1), "signal"] = 1
            df.loc[df["Close"] < df["rolling_low"].shift(1), "signal"] = -1

        elif strategy == "MACD Crossover":
            exp12 = df["Close"].ewm(span=12, adjust=False).mean()
            exp26 = df["Close"].ewm(span=26, adjust=False).mean()
            df["macd"] = exp12 - exp26
            df["signal_line"] = df["macd"].ewm(span=9, adjust=False).mean()
            df["signal"] = 0
            df.loc[df["macd"] > df["signal_line"], "signal"] = 1
            df.loc[df["macd"] < df["signal_line"], "signal"] = -1

        else:
            return jsonify({"error": f"Unknown strategy: {strategy}"}), 400

        df.dropna(inplace=True)

        # ── Portfolio Simulation ──────────────────────────────────────────────
        cash = initial_capital
        shares = 0
        position = 0  # 0=out, 1=in
        equity = []
        trades = []

        for idx, row in df.iterrows():
            price = float(row["Close"])
            sig = int(row["signal"])

            if sig == 1 and position == 0:
                cost = cash * (1 - brokerage_pct)
                shares = cost / price
                cash = 0
                position = 1
                trades.append({
                    "date": str(idx)[:10],
                    "type": "BUY",
                    "price": round(price, 2),
                    "shares": round(shares, 4),
                    "value": round(shares * price, 2),
                })
            elif sig == -1 and position == 1:
                revenue = shares * price * (1 - brokerage_pct)
                pnl = revenue - initial_capital  # simplified
                cash = revenue
                # Find the most recent BUY to compute PnL
                last_buy_val = initial_capital
                for prev_t in reversed(trades):
                    if prev_t["type"] == "BUY":
                        last_buy_val = prev_t["value"]
                        break
                trades.append({
                    "date": str(idx)[:10],
                    "type": "SELL",
                    "price": round(price, 2),
                    "shares": round(shares, 4),
                    "value": round(revenue, 2),
                    "pnl": round(revenue - last_buy_val, 2),
                })
                shares = 0
                position = 0

            port_val = cash + shares * price
            equity.append({"date": str(idx)[:10], "value": round(port_val, 2)})

        # Close any open position at last price
        if position == 1 and shares > 0:
            last_price = float(df["Close"].iloc[-1])
            cash = shares * last_price * (1 - brokerage_pct)
            equity[-1]["value"] = round(cash, 2)

        # ── Metrics ───────────────────────────────────────────────────────────
        final_value = equity[-1]["value"] if equity else initial_capital
        total_return = ((final_value - initial_capital) / initial_capital) * 100

        eq_vals = pd.Series([e["value"] for e in equity])
        daily_returns = eq_vals.pct_change().dropna()
        sharpe = 0.0
        if len(daily_returns) > 1 and daily_returns.std() != 0:
            sharpe = float((daily_returns.mean() / daily_returns.std()) * np.sqrt(252))

        rolling_max = eq_vals.cummax()
        drawdown = (eq_vals - rolling_max) / rolling_max
        max_drawdown = float(drawdown.min() * 100)

        sell_trades = [t for t in trades if t["type"] == "SELL" and "pnl" in t]
        total_trades = len(sell_trades)
        wins = [t for t in sell_trades if t["pnl"] > 0]
        losses = [t for t in sell_trades if t["pnl"] <= 0]
        win_rate = (len(wins) / total_trades * 100) if total_trades > 0 else 0
        avg_win = (sum(t["pnl"] for t in wins) / len(wins)) if wins else 0
        avg_loss = (sum(t["pnl"] for t in losses) / len(losses)) if losses else 0
        gross_profit = sum(t["pnl"] for t in wins)
        gross_loss = abs(sum(t["pnl"] for t in losses))
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (float("inf") if gross_profit > 0 else 0)

        days = (df.index[-1] - df.index[0]).days
        ann_return = ((final_value / initial_capital) ** (365 / max(days, 1)) - 1) * 100

        # Sortino
        downside = daily_returns[daily_returns < 0]
        sortino = 0.0
        if len(downside) > 1 and downside.std() != 0:
            sortino = float((daily_returns.mean() / downside.std()) * np.sqrt(252))

        # Sampled equity curve (max 200 points)
        step = max(1, len(equity) // 200)
        equity_sampled = equity[::step]

        return jsonify({
            "success": True,
            "symbol": symbol_raw,
            "strategy": strategy,
            "metrics": {
                "totalReturn": round(total_return, 2),
                "annualizedReturn": round(ann_return, 2),
                "sharpeRatio": round(sharpe, 2),
                "sortinoRatio": round(sortino, 2),
                "maxDrawdown": round(max_drawdown, 2),
                "winRate": round(win_rate, 1),
                "totalTrades": total_trades,
                "avgWin": round(avg_win, 2),
                "avgLoss": round(avg_loss, 2),
                "profitFactor": round(profit_factor, 2) if np.isfinite(profit_factor) else 999,
                "finalValue": round(final_value, 2),
                "initialCapital": round(initial_capital, 2),
                "calmarRatio": round(ann_return / abs(max_drawdown), 2) if max_drawdown != 0 else 0,
            },
            "equityCurve": equity_sampled,
            "trades": trades[-50:],  # last 50 trades
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ── /api/options/<symbol> ─────────────────────────────────────────────────────
@app.route("/api/options/<symbol>")
def get_options(symbol):
    try:
        sym = symbol.upper()
        # NSE public API for options data
        nse_sym = sym  # e.g. NIFTY, BANKNIFTY, RELIANCE
        url = f"https://www.nseindia.com/api/option-chain-indices?symbol={nse_sym}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.nseindia.com/",
        }
        # First hit the main page to get cookies
        sess = requests.Session()
        sess.get("https://www.nseindia.com/", headers=headers, timeout=10)
        resp = sess.get(url, headers=headers, timeout=10)
        data = resp.json()

        records = data.get("records", {})
        expiry_dates = records.get("expiryDates", [])
        underlying_value = records.get("underlyingValue", 0)
        data_rows = records.get("data", [])

        # Use first expiry
        target_expiry = expiry_dates[0] if expiry_dates else None

        calls = []
        puts = []
        for row in data_rows:
            if target_expiry and row.get("expiryDate") != target_expiry:
                continue
            strike = row.get("strikePrice", 0)
            if "CE" in row:
                ce = row["CE"]
                calls.append({
                    "strike": strike,
                    "ltp": safe_float(ce.get("lastPrice")),
                    "volume": safe_float(ce.get("totalTradedVolume")),
                    "oi": safe_float(ce.get("openInterest")),
                    "iv": safe_float(ce.get("impliedVolatility")),
                    "change": safe_float(ce.get("change")),
                    "changePct": safe_float(ce.get("pChange")),
                })
            if "PE" in row:
                pe = row["PE"]
                puts.append({
                    "strike": strike,
                    "ltp": safe_float(pe.get("lastPrice")),
                    "volume": safe_float(pe.get("totalTradedVolume")),
                    "oi": safe_float(pe.get("openInterest")),
                    "iv": safe_float(pe.get("impliedVolatility")),
                    "change": safe_float(pe.get("change")),
                    "changePct": safe_float(pe.get("pChange")),
                })

        return jsonify({
            "symbol": sym,
            "underlyingValue": underlying_value,
            "expiryDates": expiry_dates[:6],
            "selectedExpiry": target_expiry,
            "calls": calls[:30],
            "puts": puts[:30],
        })
    except Exception as e:
        # Return mock data if NSE API fails
        return jsonify({
            "symbol": symbol.upper(),
            "underlyingValue": 23500,
            "expiryDates": ["27-Mar-2025", "03-Apr-2025"],
            "selectedExpiry": "27-Mar-2025",
            "calls": [],
            "puts": [],
            "error": f"Options data unavailable: {str(e)}",
        })

# ── /api/strategy (CRUD) ──────────────────────────────────────────────────────
@app.route("/api/strategy", methods=["GET"])
def get_strategies():
    conn = get_db()
    rows = conn.execute("SELECT * FROM strategies ORDER BY created_at DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/strategy", methods=["POST"])
def save_strategy():
    body = request.get_json(force=True)
    name = body.get("name", "Untitled Strategy")
    config = json.dumps(body.get("config", {}))
    conn = get_db()
    cur = conn.execute("INSERT INTO strategies (name, config) VALUES (?, ?)", (name, config))
    conn.commit()
    sid = cur.lastrowid
    conn.close()
    return jsonify({"id": sid, "name": name, "message": "Strategy saved"})

@app.route("/api/strategy/<int:sid>", methods=["DELETE"])
def delete_strategy(sid):
    conn = get_db()
    conn.execute("DELETE FROM strategies WHERE id=?", (sid,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Deleted"})

# ── /api/stock/<symbol> ───────────────────────────────────────────────────────
@app.route("/api/stock/<symbol>")
def get_stock_detail(symbol):
    try:
        sym = symbol.upper()
        yf_sym = sym + ".NS" if not sym.endswith(".NS") else sym
        t = yf.Ticker(yf_sym)
        info = t.info or {}
        hist = t.history(period="1y")
        prices = []
        if not hist.empty:
            for date, row in hist.iterrows():
                prices.append({
                    "date": str(date)[:10],
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"]),
                })
        return jsonify({
            "symbol": sym,
            "name": info.get("longName", sym),
            "price": safe_float(info.get("regularMarketPrice")),
            "change": safe_float(info.get("regularMarketChange")),
            "changePercent": safe_float(info.get("regularMarketChangePercent")),
            "high52w": safe_float(info.get("fiftyTwoWeekHigh")),
            "low52w": safe_float(info.get("fiftyTwoWeekLow")),
            "pe": safe_float(info.get("trailingPE")),
            "marketCap": safe_float(info.get("marketCap")),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "history": prices,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ══════════════════════════════════════════════════════════════════════════════
# BROKER INTEGRATION
# ══════════════════════════════════════════════════════════════════════════════

SUPPORTED_BROKERS = [
    {
        "id": "zerodha", "name": "Zerodha", "subtitle": "Kite Connect API",
        "description": "India's largest discount broker. The most popular choice for algo trading with excellent API documentation.",
        "logo": "🟢", "color": "#387ed1",
        "apiType": ["REST", "WebSocket", "OAuth2"],
        "features": ["Live Orders", "Portfolio Sync", "Market Data", "GTT Orders"],
        "docsUrl": "https://kite.trade/docs/connect/v3/",
        "pricing": "₹2,000/month", "status": "active",
    },
    {
        "id": "upstox", "name": "Upstox", "subtitle": "Upstox Developer API v2",
        "description": "Free API access with comprehensive documentation. Great for beginners in algo trading.",
        "logo": "🟣", "color": "#7b2dff",
        "apiType": ["REST", "WebSocket", "OAuth2"],
        "features": ["Live Orders", "Portfolio Sync", "Market Data", "Historical Data"],
        "docsUrl": "https://upstox.com/developer/api-documentation/",
        "pricing": "Free", "status": "active",
    },
    {
        "id": "angelone", "name": "Angel One", "subtitle": "SmartAPI",
        "description": "Free SmartAPI with TOTP-based authentication. Good for retail algo traders.",
        "logo": "🔶", "color": "#ff6b00",
        "apiType": ["REST", "WebSocket", "API Key + TOTP"],
        "features": ["Live Orders", "Portfolio Sync", "Market Data", "Basket Orders"],
        "docsUrl": "https://smartapi.angelone.in/docs",
        "pricing": "Free", "status": "active",
    },
    {
        "id": "fivepaisa", "name": "5paisa", "subtitle": "5paisa Connect API",
        "description": "Budget-friendly broker with free API. Supports all major order types.",
        "logo": "🔵", "color": "#00bcd4",
        "apiType": ["REST", "OAuth2"],
        "features": ["Live Orders", "Portfolio Sync", "Margin Data"],
        "docsUrl": "https://www.5paisa.com/developerapi",
        "pricing": "Free", "status": "active",
    },
    {
        "id": "fyers", "name": "Fyers", "subtitle": "Fyers API v3",
        "description": "Clean, developer-friendly API with excellent WebSocket support for live streaming.",
        "logo": "🟡", "color": "#2dc44d",
        "apiType": ["REST", "WebSocket", "OAuth2"],
        "features": ["Live Orders", "Portfolio Sync", "Market Data", "Options Chain"],
        "docsUrl": "https://myapi.fyers.in/docsv3",
        "pricing": "Free", "status": "active",
    },
    {
        "id": "aliceblue", "name": "Alice Blue", "subtitle": "Ant API",
        "description": "Feature-rich API supporting basket orders and advanced order types.",
        "logo": "🔷", "color": "#004aad",
        "apiType": ["REST", "API Key"],
        "features": ["Live Orders", "Portfolio Sync", "Basket Orders"],
        "docsUrl": "https://v2api.aliceblueonline.com/introduction",
        "pricing": "Free", "status": "active",
    },
    {
        "id": "motilal", "name": "Motilal Oswal", "subtitle": "MO Developer API",
        "description": "Full-service broker with institutional-grade platform. API access coming soon for retail.",
        "logo": "🟠", "color": "#e85d04",
        "apiType": ["REST"],
        "features": ["Research Reports", "Advisory"],
        "docsUrl": "", "pricing": "TBD", "status": "coming_soon",
    },
    {
        "id": "icici", "name": "ICICI Direct", "subtitle": "Breeze API",
        "description": "Banking giant with Breeze API for trading. Limited but expanding capabilities.",
        "logo": "🏦", "color": "#f58220",
        "apiType": ["REST"],
        "features": ["Portfolio View", "Research"],
        "docsUrl": "https://api.icicidirect.com", "pricing": "TBD", "status": "coming_soon",
    },
    {
        "id": "groww", "name": "Groww", "subtitle": "Consumer Platform",
        "description": "Popular consumer investing app. No public API available yet for trading.",
        "logo": "💚", "color": "#5eb963",
        "apiType": [],
        "features": ["Mutual Funds", "Stocks"],
        "docsUrl": "", "pricing": "N/A", "status": "coming_soon",
    },
]


@app.route("/api/brokers")
def list_brokers():
    """Return all supported brokers with connection status."""
    conn = get_db()
    rows = conn.execute("SELECT broker_id, status, connected_at FROM broker_connections").fetchall()
    conn.close()
    connected = {r["broker_id"]: {"status": r["status"], "connectedAt": r["connected_at"]} for r in rows}
    brokers = []
    for b in SUPPORTED_BROKERS:
        entry = {**b, "connected": b["id"] in connected}
        if b["id"] in connected:
            entry["connectionStatus"] = connected[b["id"]]["status"]
            entry["connectedAt"] = connected[b["id"]]["connectedAt"]
        brokers.append(entry)
    return jsonify(brokers)


@app.route("/api/brokers/connect", methods=["POST"])
def connect_broker():
    """Save broker API credentials."""
    body = request.get_json(force=True)
    broker_id = body.get("brokerId", "").strip()
    api_key = body.get("apiKey", "").strip()
    api_secret = body.get("apiSecret", "")
    client_id = body.get("clientId", "")
    if not broker_id or not api_key:
        return jsonify({"error": "brokerId and apiKey are required."}), 400
    valid_ids = [b["id"] for b in SUPPORTED_BROKERS if b["status"] == "active"]
    if broker_id not in valid_ids:
        return jsonify({"error": f"Broker '{broker_id}' is not supported yet."}), 400
    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO broker_connections (broker_id, api_key, api_secret, client_id, status, connected_at) VALUES (?,?,?,?,'connected', datetime('now'))",
        (broker_id, api_key, api_secret, client_id),
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Connected to {broker_id}"})


@app.route("/api/brokers/status")
def broker_status():
    """Check connection health for all connected brokers."""
    conn = get_db()
    rows = conn.execute("SELECT broker_id, status, connected_at FROM broker_connections").fetchall()
    conn.close()
    return jsonify([{"brokerId": r["broker_id"], "status": r["status"], "connectedAt": r["connected_at"]} for r in rows])


@app.route("/api/brokers/disconnect", methods=["POST"])
def disconnect_broker():
    """Remove broker connection."""
    body = request.get_json(force=True)
    broker_id = body.get("brokerId", "").strip()
    if not broker_id:
        return jsonify({"error": "brokerId is required."}), 400
    conn = get_db()
    conn.execute("DELETE FROM broker_connections WHERE broker_id = ?", (broker_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Disconnected from {broker_id}"})


# ══════════════════════════════════════════════════════════════════════════════
# AI STRATEGY BUILDER  (Groq LLM)
# ══════════════════════════════════════════════════════════════════════════════

AI_SYSTEM_PROMPT = """You are AlgoForge AI — an expert algorithmic trading strategy designer for the Indian stock market (NSE/BSE).

When the user describes a trading idea in natural language, you MUST return ONLY valid JSON (no markdown, no explanation outside the JSON).

Return this exact JSON structure:
{
  "strategyName": "...",
  "description": "...",
  "marketType": "equity" | "options" | "futures",
  "timeframe": "1m" | "5m" | "15m" | "1h" | "1d",
  "instruments": ["NIFTY", "BANKNIFTY", "RELIANCE", ...],
  "indicators": [
    {"name": "SMA", "params": {"period": 20}, "purpose": "..."},
    ...
  ],
  "entryRules": [
    {"condition": "...", "action": "BUY/SELL", "description": "..."},
    ...
  ],
  "exitRules": [
    {"condition": "...", "action": "EXIT", "description": "..."},
    ...
  ],
  "riskManagement": {
    "stopLoss": {"type": "percentage" | "points" | "atr", "value": 2},
    "takeProfit": {"type": "percentage" | "points" | "riskReward", "value": 4},
    "positionSize": "...",
    "maxDrawdown": "...",
    "trailingStop": {"enabled": true/false, "value": 1}
  },
  "parameters": {
    "key": {"value": ..., "min": ..., "max": ..., "description": "..."},
    ...
  },
  "backtestConfig": {
    "suggestedPeriod": "1y" | "2y" | "5y",
    "suggestedCapital": 100000,
    "suggestedSymbol": "NIFTY"
  },
  "confidence": 1-10,
  "warnings": ["..."]
}

Rules:
- Focus on Indian market instruments (NSE symbols).
- Use well-known indicators: SMA, EMA, RSI, MACD, Bollinger Bands, ATR, VWAP, SuperTrend, etc.
- Always include realistic risk management.
- Provide confidence score (1=experimental, 10=battle-tested classic).
- Add warnings for any caveats.
"""

AI_EXPLAIN_PROMPT = """You are AlgoForge AI. The user will give you a trading strategy in JSON format.
Explain the strategy in clear, beginner-friendly language. Cover:
1. What the strategy does in simple terms
2. When it enters and exits trades
3. The indicators used and why
4. Risk management approach
5. What market conditions it works best in
6. Potential weaknesses or risks

Return ONLY valid JSON:
{
  "summary": "...",
  "howItWorks": "...",
  "indicators": [{"name": "...", "explanation": "..."}],
  "entryLogic": "...",
  "exitLogic": "...",
  "bestConditions": "...",
  "risks": ["..."],
  "difficulty": "beginner" | "intermediate" | "advanced"
}
"""

AI_OPTIMIZE_PROMPT = """You are AlgoForge AI. The user will give you a trading strategy in JSON format.
Suggest improvements and optimizations. Return ONLY valid JSON:
{
  "suggestions": [
    {"category": "entry" | "exit" | "risk" | "indicator" | "general",
     "title": "...",
     "description": "...",
     "impact": "low" | "medium" | "high",
     "implementation": "..."}
  ],
  "optimizedStrategy": { ... the full improved strategy JSON ... },
  "improvementScore": 1-10,
  "rationale": "..."
}
"""

# ── /api/ai-strategy/templates ────────────────────────────────────────────────
@app.route("/api/ai-strategy/templates")
def ai_templates():
    templates = [
        {
            "id": "momentum",
            "name": "Momentum Breakout",
            "icon": "🚀",
            "color": "#6366f1",
            "prompt": "Create a momentum breakout strategy for Nifty 50 stocks using 20-day high breakout with volume confirmation. Use RSI as a filter to avoid overbought entries. Include trailing stop loss.",
            "category": "Trend Following",
        },
        {
            "id": "mean-reversion",
            "name": "Mean Reversion",
            "icon": "🔄",
            "color": "#10b981",
            "prompt": "Design a mean reversion strategy for Bank Nifty using Bollinger Bands and RSI. Buy when price touches the lower band and RSI is below 30. Sell when price returns to the middle band.",
            "category": "Mean Reversion",
        },
        {
            "id": "macd-crossover",
            "name": "MACD Crossover",
            "icon": "📊",
            "color": "#f59e0b",
            "prompt": "Build a MACD crossover strategy for large-cap Indian stocks. Enter on MACD line crossing above signal line with histogram turning positive. Use ATR-based trailing stop.",
            "category": "Trend Following",
        },
        {
            "id": "scalping",
            "name": "Intraday Scalper",
            "icon": "⚡",
            "color": "#ec4899",
            "prompt": "Create an intraday scalping strategy for Nifty futures on 5-minute candles. Use VWAP as the main reference with EMA 9 and EMA 21 crossovers. Target 20 points profit with 10 points stop loss.",
            "category": "Scalping",
        },
        {
            "id": "swing",
            "name": "Swing Trading",
            "icon": "🌊",
            "color": "#8b5cf6",
            "prompt": "Design a swing trading strategy for Nifty 50 stocks using SuperTrend indicator with ADX filter. Only take trades when ADX is above 25. Hold positions for 3-10 days with 3% trailing stop.",
            "category": "Swing Trading",
        },
        {
            "id": "options-iron-condor",
            "name": "Iron Condor",
            "icon": "🦅",
            "color": "#06b6d4",
            "prompt": "Create an options iron condor strategy for weekly Bank Nifty options. Sell OTM call and put spreads when VIX is above 15. Define strike selection based on delta and probability of profit.",
            "category": "Options",
        },
    ]
    return jsonify(templates)


# ── /api/ai-strategy/generate ─────────────────────────────────────────────────
@app.route("/api/ai-strategy/generate", methods=["POST"])
def ai_generate():
    try:
        body = request.get_json(force=True)
        prompt = body.get("prompt", "").strip()
        if not prompt:
            return jsonify({"error": "Please describe your strategy idea."}), 400

        client = get_groq()
        chat = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": AI_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )
        raw = chat.choices[0].message.content
        strategy = json.loads(raw)
        return jsonify({"success": True, "strategy": strategy, "model": GROQ_MODEL})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except json.JSONDecodeError:
        return jsonify({"error": "AI returned invalid JSON. Please try again.", "raw": raw}), 500
    except Exception as e:
        return jsonify({"error": f"AI generation failed: {str(e)}"}), 500


# ── /api/ai-strategy/explain ──────────────────────────────────────────────────
@app.route("/api/ai-strategy/explain", methods=["POST"])
def ai_explain():
    try:
        body = request.get_json(force=True)
        strategy = body.get("strategy", {})
        if not strategy:
            return jsonify({"error": "No strategy provided."}), 400

        client = get_groq()
        chat = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": AI_EXPLAIN_PROMPT},
                {"role": "user", "content": json.dumps(strategy)},
            ],
            temperature=0.5,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        raw = chat.choices[0].message.content
        explanation = json.loads(raw)
        return jsonify({"success": True, "explanation": explanation})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Explain failed: {str(e)}"}), 500


# ── /api/ai-strategy/optimize ─────────────────────────────────────────────────
@app.route("/api/ai-strategy/optimize", methods=["POST"])
def ai_optimize():
    try:
        body = request.get_json(force=True)
        strategy = body.get("strategy", {})
        if not strategy:
            return jsonify({"error": "No strategy provided."}), 400

        client = get_groq()
        chat = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": AI_OPTIMIZE_PROMPT},
                {"role": "user", "content": json.dumps(strategy)},
            ],
            temperature=0.6,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )
        raw = chat.choices[0].message.content
        result = json.loads(raw)
        return jsonify({"success": True, "optimization": result})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Optimize failed: {str(e)}"}), 500


# ── /api-market (legacy compat) ───────────────────────────────────────────────
@app.route("/api-market")
def legacy_market():
    return get_market_data()

if __name__ == "__main__":
    print("🚀 AlgoForge Python Backend starting on http://localhost:5001")
    app.run(port=5001, debug=True)

