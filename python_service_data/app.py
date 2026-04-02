from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import yfinance as yf
import pandas as pd
import numpy as np
import requests
import json
import sqlite3
import os
import time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from cachetools import TTLCache

# Load .env before anything else
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)
CORS(app)

# ── SocketIO instance ─────────────────────────────────────────────────────────
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading',
                    ping_timeout=20, ping_interval=10)
print("  ✓ SocketIO initialized (threading async mode)")

# ── Register Quant Engine Blueprints ──────────────────────────────────────────
try:
    from engines.greeks import greeks_bp
    from engines.iv_engine import iv_bp
    from engines.gex_engine import gex_bp
    from engines.oi_engine import oi_bp
    from engines.maxpain_engine import maxpain_bp
    from engines.volume_engine import volume_bp
    from engines.flow_engine import flow_bp
    from engines.strategy_engine import strategy_bp
    from engines.volatility_engine import volatility_bp
    from engines.heatmap_engine import heatmap_bp
    from engines.futures_engine import futures_bp
    from engines.signal_engine import signal_bp
    from engines.ai_analyst import ai_analyst_bp

    for bp in [greeks_bp, iv_bp, gex_bp, oi_bp, maxpain_bp, volume_bp,
               flow_bp, strategy_bp, volatility_bp, heatmap_bp, futures_bp,
               signal_bp, ai_analyst_bp]:
        app.register_blueprint(bp)
    print("  ✓ All quant engine blueprints registered")
except Exception as e:
    print(f"  ⚠ Engine blueprint import error: {e}")

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

# ── NSE helpers ───────────────────────────────────────────────────────────────
NSE_INDEX_SYMBOLS = {"NIFTY", "BANKNIFTY", "FINNIFTY", "NIFTY BANK", "NIFTY 50", "MIDCPNIFTY", "NIFTYNXT50"}
OPTION_EQUITY_SYMBOLS = [
    "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "SBIN", "BAJFINANCE",
    "TATAMOTORS", "LT", "AXISBANK", "MARUTI", "SUNPHARMA", "WIPRO", "HCLTECH",
    "TATASTEEL", "HINDALCO", "ONGC", "NTPC", "POWERGRID", "COALINDIA",
    "ITC", "BHARTIARTL", "ADANIENT", "ADANIPORTS", "KOTAKBANK",
    "TITAN", "ULTRACEMCO", "TECHM", "HINDUNILVR", "JSWSTEEL",
]

import time as _time
import threading
import json as _json
import os as _os

# Singleton pnsea NSE session (thread-safe)
_pnsea_nse = None
_pnsea_lock = threading.Lock()

# In-memory cache for option chain data
_nse_cache = {}
_nse_cache_lock = threading.Lock()
NSE_CACHE_TTL = 180  # 3 minutes

# ══════════════════════════════════════════════════════════════════════════════
# DIRECT NSE SESSION (for indices, VIX, movers — supplements pnsea)
# ══════════════════════════════════════════════════════════════════════════════

NSE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) '
                  'Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.nseindia.com/',
    'Accept': 'application/json, text/plain, */*',
}

_nse_direct_session = requests.Session()
_nse_direct_session.headers.update(NSE_HEADERS)
_nse_session_initialized = False
_nse_session_lock = threading.Lock()

def init_nse_direct_session():
    """Initialize NSE direct session with cookies."""
    global _nse_session_initialized
    with _nse_session_lock:
        try:
            _nse_direct_session.get('https://www.nseindia.com', timeout=10)
            _nse_session_initialized = True
            print("  ✓ NSE direct session initialized")
        except Exception as e:
            print(f"  ⚠ NSE direct session init failed: {e}")

def nse_direct_get(url, retries=3):
    """GET from NSE with retry + session refresh."""
    global _nse_session_initialized
    for attempt in range(retries):
        try:
            if not _nse_session_initialized:
                init_nse_direct_session()
            resp = _nse_direct_session.get(url, timeout=8)
            if resp.status_code == 401 or resp.status_code == 403:
                _nse_session_initialized = False
                init_nse_direct_session()
                continue
            try:
                return resp.json()
            except ValueError:
                print(f"  ⚠ JSON decode error from NSE {url}")
                return {}
        except Exception as e:
            if attempt == retries - 1:
                raise e
            socketio.sleep(1)

# ── TTL Caches for NSE direct data ────────────────────────────────────────────
_indices_cache = TTLCache(maxsize=1, ttl=2)    # 2s cache for indices
_movers_cache = TTLCache(maxsize=2, ttl=5)     # 5s cache for movers

def fetch_nse_indices():
    """Fetch all NSE indices + VIX from allIndices API."""
    cache_key = 'indices'
    if cache_key in _indices_cache:
        return _indices_cache[cache_key]
    try:
        data = nse_direct_get('https://www.nseindia.com/api/allIndices')
        indices = []
        vix_value = 0
        vix_change = 0
        if data and 'data' in data:
            for idx in data['data']:
                sym = idx.get('indexSymbol', '')
                if sym in ('NIFTY 50', 'NIFTY BANK', 'NIFTY FINANCIAL SERVICES', 'NIFTY MIDCAP 50', 'NIFTY IT'):
                    indices.append({
                        'name': idx.get('index', sym),
                        'symbol': sym,
                        'value': idx.get('last', 0),
                        'change': idx.get('variation', 0),
                        'changePercent': idx.get('percentChange', 0),
                        'open': idx.get('open', 0),
                        'high': idx.get('high', 0),
                        'low': idx.get('low', 0),
                        'prevClose': idx.get('previousClose', 0),
                    })
                if sym == 'INDIA VIX':
                    vix_value = idx.get('last', 0)
                    vix_change = idx.get('variation', 0)
        result = {'indices': indices, 'vix': vix_value, 'vix_change': vix_change}
        _indices_cache[cache_key] = result
        return result
    except Exception as e:
        print(f"  ⚠ NSE indices fetch failed: {e}")
        return {'indices': [], 'vix': 0, 'vix_change': 0}

def fetch_nse_movers(direction='gainers'):
    """Fetch top gainers or losers from NSE."""
    cache_key = direction
    if cache_key in _movers_cache:
        return _movers_cache[cache_key]
    try:
        url = f'https://www.nseindia.com/api/live-analysis-variations?index={direction}'
        data = nse_direct_get(url)
        movers = []
        if data and 'NIFTY' in data:
            for item in data['NIFTY']['data'][:10]:
                movers.append({
                    'symbol': item.get('symbol', ''),
                    'ltp': item.get('ltp', 0),
                    'change': item.get('netPrice', 0),
                    'changePercent': item.get('perChange', 0),
                    'volume': item.get('tradedQuantity', 0),
                })
        _movers_cache[cache_key] = movers
        return movers
    except Exception as e:
        print(f"  ⚠ NSE movers ({direction}) fetch failed: {e}")
        return []

# Disk cache directory for persistent storage across restarts / after-hours
_NSE_DISK_CACHE_DIR = _os.path.join(_os.path.dirname(__file__), ".nse_cache")
_os.makedirs(_NSE_DISK_CACHE_DIR, exist_ok=True)

def _get_pnsea():
    """Get or create the singleton pnsea NSE session."""
    global _pnsea_nse
    if _pnsea_nse is None:
        with _pnsea_lock:
            if _pnsea_nse is None:
                from pnsea import NSE
                _pnsea_nse = NSE()
                print("  ✓ pnsea NSE session created")
    return _pnsea_nse


def _disk_cache_path(cache_key):
    return _os.path.join(_NSE_DISK_CACHE_DIR, f"{cache_key}.json")


def _save_to_disk(cache_key, df, expiry_dates, underlying_value):
    """Save option chain data to disk as JSON for after-hours access."""
    try:
        # Convert DataFrame to list of dicts, handling NaN/None
        rows = []
        for _, row in df.iterrows():
            r = {}
            for col in df.columns:
                val = row[col]
                if val is None or (isinstance(val, float) and np.isnan(val)):
                    r[col] = None
                else:
                    r[col] = val if not isinstance(val, (np.integer, np.floating)) else val.item()
            rows.append(r)

        payload = {
            "rows": rows,
            "expiry_dates": expiry_dates,
            "underlying_value": underlying_value,
            "cached_at": _time.strftime("%Y-%m-%d %H:%M:%S"),
            "ts": _time.time(),
        }
        with open(_disk_cache_path(cache_key), "w") as f:
            _json.dump(payload, f)
        print(f"  💾 Saved {len(rows)} rows to disk cache")
    except Exception as e:
        print(f"  ⚠ Disk cache save failed: {e}")


def _load_from_disk(cache_key):
    """Load option chain data from disk cache. Returns (df, expiry_dates, underlying_value, cached_at) or None."""
    path = _disk_cache_path(cache_key)
    if not _os.path.exists(path):
        return None
    try:
        with open(path, "r") as f:
            payload = _json.load(f)
        import pandas as _pd
        df = _pd.DataFrame(payload["rows"])
        expiry_dates = payload.get("expiry_dates", [])
        underlying_value = payload.get("underlying_value", 0)
        cached_at = payload.get("cached_at", "unknown")
        print(f"  📂 Loaded {len(df)} rows from disk cache (saved at {cached_at})")
        return (df, expiry_dates, underlying_value, cached_at)
    except Exception as e:
        print(f"  ⚠ Disk cache load failed: {e}")
        return None


def fetch_nse_option_chain(symbol, is_index, expiry_date=None):
    """Fetch option chain from NSE using pnsea library.
    pnsea returns: (DataFrame, expiry_dates_list, underlying_value_float)
    We return:     (df, expiry_dates, underlying_value, cached_at_or_None)
    """
    cache_key = f"{symbol}_{is_index}_{expiry_date or 'default'}"

    # Check in-memory cache first
    with _nse_cache_lock:
        cached = _nse_cache.get(cache_key)
        if cached and (_time.time() - cached["ts"]) < NSE_CACHE_TTL:
            age = int(_time.time() - cached["ts"])
            print(f"  ✓ Using cached data ({age}s old)")
            return cached["result"]

    nse = _get_pnsea()
    last_error = None
    for attempt in range(2):
        try:
            print(f"  → pnsea attempt {attempt + 1}: {symbol} ({'index' if is_index else 'equity'}) expiry={expiry_date}...")
            if is_index:
                result = nse.options.option_chain(symbol, expiry_date=expiry_date)
            else:
                result = nse.equityOptions.option_chain(symbol, expiry_date=expiry_date)

            # pnsea returns: (DataFrame, expiry_dates_list, underlying_value_float)
            df = result[0]
            expiry_dates = result[1] if len(result) > 1 else []
            underlying_value = result[2] if len(result) > 2 else 0

            # Ensure types are correct
            if not isinstance(expiry_dates, list):
                expiry_dates = []
            if not isinstance(underlying_value, (int, float)):
                underlying_value = 0

            if df is not None and len(df) > 0:
                print(f"  ✓ Got {len(df)} rows via pnsea")
                res = (df, expiry_dates, underlying_value, None)  # None = live data
                with _nse_cache_lock:
                    _nse_cache[cache_key] = {"result": res, "ts": _time.time()}
                # Save to disk for after-hours access
                _save_to_disk(cache_key, df, expiry_dates, underlying_value)
                return res
            else:
                last_error = "pnsea returned empty data"
                print(f"  ⚠ {last_error}")
        except Exception as e:
            last_error = str(e)
            print(f"  ⚠ pnsea failed: {e}")
            # Reset session on error
            global _pnsea_nse
            _pnsea_nse = None

        if attempt < 1:
            _time.sleep(2)

    # Return stale in-memory cache if available
    with _nse_cache_lock:
        if cached:
            print(f"  ↳ Returning stale in-memory cache")
            return cached["result"]

    # Fall back to disk cache (for after-hours / server restart)
    disk_data = _load_from_disk(cache_key)
    if disk_data:
        return disk_data

    raise Exception(f"NSE option chain unavailable: {last_error}")


# ── /api/options/<symbol> ─────────────────────────────────────────────────────
@app.route("/api/options/<symbol>")
def get_options(symbol):
    try:
        sym = symbol.upper().strip()
        expiry_param = request.args.get("expiry", None)

        is_index = sym in NSE_INDEX_SYMBOLS or sym in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "NIFTYNXT50")

        print(f"\n📊 Fetching option chain for {sym} (is_index={is_index}, expiry={expiry_param})")
        try:
            result = fetch_nse_option_chain(sym, is_index, expiry_date=expiry_param)
            df = result[0]
            expiry_dates = result[1]
            underlying_value = result[2]
            cached_at = result[3] if len(result) > 3 else None
        except Exception as fetch_err:
            err_msg = str(fetch_err)
            print(f"  ⚠ Fetch failed: {err_msg}")
            if "empty" in err_msg.lower() or "closed" in err_msg.lower() or "unavailable" in err_msg.lower():
                return jsonify({
                    "error": "NSE option chain data is currently unavailable. This typically happens after market hours (NSE: 9:15 AM - 3:30 PM IST).",
                    "market_closed": True,
                    "symbol": sym,
                })
            return jsonify({"error": f"Failed to fetch option chain: {err_msg}"}), 500

        # underlying_value is already a float from pnsea
        underlying_value = safe_float(underlying_value) or 0

        # expiry_dates is already a list from pnsea
        if not isinstance(expiry_dates, list):
            expiry_dates = []

        target_expiry = expiry_param if expiry_param and expiry_param in expiry_dates else (expiry_dates[0] if expiry_dates else None)

        # Debug: log DataFrame columns and shape
        print(f"  📋 DataFrame columns: {list(df.columns)}")
        print(f"  📋 DataFrame shape: {df.shape}")
        print(f"  📋 Target expiry: {target_expiry}")

        # Filter DataFrame by selected expiry if column exists
        if target_expiry and 'expiryDate' in df.columns:
            df_filtered = df[df['expiryDate'] == target_expiry]
            if len(df_filtered) > 0:
                print(f"  ✓ Filtered to {len(df_filtered)} rows for expiry {target_expiry}")
                df = df_filtered
            else:
                # Try matching without exact string match (pnsea may format dates differently)
                print(f"  ⚠ No rows matched expiry '{target_expiry}', unique expiries in df: {df['expiryDate'].unique()[:5]}")
                # Try partial matching
                for exp_val in df['expiryDate'].unique():
                    if target_expiry in str(exp_val) or str(exp_val) in target_expiry:
                        df_filtered = df[df['expiryDate'] == exp_val]
                        if len(df_filtered) > 0:
                            print(f"  ✓ Partial match: filtered to {len(df_filtered)} rows for expiry {exp_val}")
                            df = df_filtered
                            break
        elif target_expiry:
            print(f"  ⚠ No 'expiryDate' column found in DataFrame — returning all rows")

        # Transform pnsea DataFrame to frontend format
        # pnsea columns: strikePrice, CE_openInterest, CE_changeinOpenInterest, CE_impliedVolatility,
        #   CE_lastPrice, CE_totalTradedVolume, CE_bidQty, CE_bidprice, CE_askQty, CE_askPrice,
        #   PE_openInterest, PE_changeinOpenInterest, PE_impliedVolatility, PE_lastPrice,
        #   PE_totalTradedVolume, PE_bidQty, PE_bidprice, PE_askQty, PE_askPrice
        calls = []
        puts = []
        call_oi_map = {}
        put_oi_map = {}
        total_ce_oi = 0
        total_pe_oi = 0
        total_ce_volume = 0
        total_pe_volume = 0

        for _, row in df.iterrows():
            strike = int(row.get("strikePrice", 0))
            if strike == 0:
                continue

            # CE (Call) data
            ce_oi = safe_float(row.get("CE_openInterest")) or 0
            ce_vol = safe_float(row.get("CE_totalTradedVolume")) or 0
            total_ce_oi += ce_oi
            total_ce_volume += ce_vol
            call_oi_map[strike] = ce_oi
            calls.append({
                "strike": strike,
                "ltp": safe_float(row.get("CE_lastPrice")),
                "change": safe_float(row.get("CE_change")),
                "changePct": safe_float(row.get("CE_pChange")),
                "volume": ce_vol,
                "oi": ce_oi,
                "oiChange": safe_float(row.get("CE_changeinOpenInterest")),
                "iv": safe_float(row.get("CE_impliedVolatility")),
                "bidPrice": safe_float(row.get("CE_bidprice")),
                "askPrice": safe_float(row.get("CE_askPrice")),
                "bidQty": safe_float(row.get("CE_bidQty")),
                "askQty": safe_float(row.get("CE_askQty")),
            })

            # PE (Put) data
            pe_oi = safe_float(row.get("PE_openInterest")) or 0
            pe_vol = safe_float(row.get("PE_totalTradedVolume")) or 0
            total_pe_oi += pe_oi
            total_pe_volume += pe_vol
            put_oi_map[strike] = pe_oi
            puts.append({
                "strike": strike,
                "ltp": safe_float(row.get("PE_lastPrice")),
                "change": safe_float(row.get("PE_change")),
                "changePct": safe_float(row.get("PE_pChange")),
                "volume": pe_vol,
                "oi": pe_oi,
                "oiChange": safe_float(row.get("PE_changeinOpenInterest")),
                "iv": safe_float(row.get("PE_impliedVolatility")),
                "bidPrice": safe_float(row.get("PE_bidprice")),
                "askPrice": safe_float(row.get("PE_askPrice")),
                "bidQty": safe_float(row.get("PE_bidQty")),
                "askQty": safe_float(row.get("PE_askQty")),
            })

        # PCR ratio
        pcr = round(total_pe_oi / total_ce_oi, 4) if total_ce_oi > 0 else 0

        # Max Pain calculation
        all_strikes = sorted(set(s["strike"] for s in calls + puts))
        max_pain_strike = 0
        min_pain = float("inf")
        for test_strike in all_strikes:
            pain = 0
            for s in all_strikes:
                ce_oi = call_oi_map.get(s, 0)
                pe_oi = put_oi_map.get(s, 0)
                if test_strike > s:
                    pain += ce_oi * (test_strike - s)
                elif test_strike < s:
                    pain += pe_oi * (s - test_strike)
            if pain < min_pain:
                min_pain = pain
                max_pain_strike = test_strike

        resp_data = {
            "symbol": sym,
            "isIndex": is_index,
            "underlyingValue": underlying_value,
            "expiryDates": expiry_dates[:12] if expiry_dates else [],
            "selectedExpiry": target_expiry,
            "calls": calls,
            "puts": puts,
            "summary": {
                "totalCeOi": total_ce_oi,
                "totalPeOi": total_pe_oi,
                "totalCeVolume": total_ce_volume,
                "totalPeVolume": total_pe_volume,
                "pcr": pcr,
                "maxPain": max_pain_strike,
            },
        }
        if cached_at:
            resp_data["cachedAt"] = cached_at
        return jsonify(resp_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "symbol": symbol.upper(),
            "underlyingValue": 23500,
            "expiryDates": ["27-Mar-2025", "03-Apr-2025", "10-Apr-2025"],
            "selectedExpiry": "27-Mar-2025",
            "calls": [],
            "puts": [],
            "summary": {"totalCeOi": 0, "totalPeOi": 0, "totalCeVolume": 0, "totalPeVolume": 0, "pcr": 0, "maxPain": 0},
            "error": f"Options data unavailable: {str(e)}",
        })


# ══════════════════════════════════════════════════════════════════════════════
# NEWS-BASED MARKET INSIGHTS  (Google News RSS + Groq AI)
# ══════════════════════════════════════════════════════════════════════════════
import feedparser
from html import unescape
import re

NEWS_FEEDS = [
    # General Indian market
    ("General Market", "https://news.google.com/rss/search?q=Indian+stock+market+NSE+BSE+Sensex+Nifty&hl=en-IN&gl=IN&ceid=IN:en"),
    # Sector-specific
    ("Banking", "https://news.google.com/rss/search?q=India+banking+sector+RBI+HDFC+ICICI+SBI+stock&hl=en-IN&gl=IN&ceid=IN:en"),
    ("IT", "https://news.google.com/rss/search?q=India+IT+sector+Infosys+TCS+Wipro+HCL+tech+stock&hl=en-IN&gl=IN&ceid=IN:en"),
    ("Metals", "https://news.google.com/rss/search?q=India+metals+steel+aluminum+copper+Tata+Steel+Hindalco+JSW&hl=en-IN&gl=IN&ceid=IN:en"),
    ("Energy", "https://news.google.com/rss/search?q=India+oil+gas+energy+ONGC+Reliance+BPCL+crude+stock&hl=en-IN&gl=IN&ceid=IN:en"),
    ("Pharma", "https://news.google.com/rss/search?q=India+pharma+healthcare+Sun+Pharma+Cipla+Dr+Reddy+stock&hl=en-IN&gl=IN&ceid=IN:en"),
    ("Auto", "https://news.google.com/rss/search?q=India+automobile+Maruti+Tata+Motors+Bajaj+auto+stock&hl=en-IN&gl=IN&ceid=IN:en"),
    ("FMCG", "https://news.google.com/rss/search?q=India+FMCG+Hindustan+Unilever+ITC+Nestle+Britannia+stock&hl=en-IN&gl=IN&ceid=IN:en"),
    ("Infra & Realty", "https://news.google.com/rss/search?q=India+infrastructure+real+estate+L%26T+Adani+DLF+stock&hl=en-IN&gl=IN&ceid=IN:en"),
    # Geopolitical & global
    ("Global Impact", "https://news.google.com/rss/search?q=geopolitical+trade+war+tariffs+impact+India+market&hl=en-IN&gl=IN&ceid=IN:en"),
]

def clean_html(raw):
    """Strip HTML tags and unescape."""
    return unescape(re.sub(r"<[^>]+>", "", str(raw or "")))


NEWS_AI_PROMPT = """You are AlgoForge Market Intelligence AI — an expert financial analyst specializing in the Indian stock market (NSE/BSE).

You will receive a batch of recent news headlines from Google News, grouped by category (General Market, Banking, IT, Metals, Energy, Pharma, Auto, FMCG, Infra & Realty, Global Impact).

Analyze ALL these headlines and return ONLY valid JSON (no markdown, no explanation outside JSON) with this exact structure:

{
  "overallSentiment": "bullish" | "bearish" | "neutral",
  "overallSentimentScore": 1-10,
  "marketOutlook": "A 2-3 sentence summary of the overall Indian market outlook based on the news",
  "sectors": [
    {
      "name": "Banking",
      "sentiment": "bullish" | "bearish" | "neutral",
      "impactScore": 1-10,
      "outlook": "Brief 1-2 sentence outlook for this sector",
      "drivers": ["Key driver 1", "Key driver 2"],
      "relatedHeadlines": ["Relevant headline 1", "Relevant headline 2"]
    }
  ],
  "companyMentions": [
    {
      "name": "Company Name",
      "ticker": "NSE Symbol",
      "impact": "positive" | "negative" | "neutral",
      "reason": "Brief reason for impact",
      "sector": "Sector name"
    }
  ],
  "keyRisks": ["Risk 1", "Risk 2", "Risk 3"],
  "keyOpportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "globalFactors": ["Factor 1", "Factor 2"],
  "confidence": 1-10,
  "analysisTimestamp": "current timestamp"
}

Rules:
- Analyze ALL sectors: Banking, IT, Metals, Energy, Pharma, Auto, FMCG, Infra & Realty. Always include all 8.
- Be specific about Indian companies and NSE symbols.
- Consider geopolitical events (wars, sanctions, trade deals) and their impact on Indian sectors.
- Impact score: 1 = no impact, 5 = moderate, 10 = massive impact.
- Include at least 3-5 company mentions with real NSE symbols.
- Be honest about confidence level.
"""


@app.route("/api/news/market-insights")
def get_news_insights():
    try:
        # 1. Fetch all RSS feeds
        all_news = []
        headlines_by_category = {}
        for category, feed_url in NEWS_FEEDS:
            try:
                feed = feedparser.parse(feed_url)
                items = []
                for entry in feed.entries[:8]:  # top 8 per category
                    title = clean_html(entry.get("title", ""))
                    source = ""
                    if " - " in title:
                        parts = title.rsplit(" - ", 1)
                        title = parts[0].strip()
                        source = parts[1].strip() if len(parts) > 1 else ""
                    items.append({
                        "title": title,
                        "source": source or clean_html(entry.get("source", {}).get("title", "")),
                        "link": entry.get("link", ""),
                        "published": entry.get("published", ""),
                        "category": category,
                    })
                    all_news.append(items[-1])
                headlines_by_category[category] = [item["title"] for item in items]
            except Exception as ex:
                print(f"⚠ RSS feed error for {category}: {ex}")
                headlines_by_category[category] = []

        # 2. Build prompt for Groq AI
        news_text = ""
        for cat, headlines in headlines_by_category.items():
            if headlines:
                news_text += f"\n## {cat}\n"
                for h in headlines:
                    news_text += f"- {h}\n"

        if not news_text.strip():
            return jsonify({"error": "Could not fetch any news articles. Try again later."}), 503

        # 3. Call Groq AI for analysis
        client = get_groq()
        chat = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": NEWS_AI_PROMPT},
                {"role": "user", "content": f"Here are the latest Indian market news headlines:\n{news_text}\n\nAnalyze these and provide sector-wise insights for the Indian stock market."},
            ],
            temperature=0.4,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )
        raw = chat.choices[0].message.content
        analysis = json.loads(raw)

        return jsonify({
            "success": True,
            "analysis": analysis,
            "news": all_news[:50],
            "fetchedAt": datetime.now(timezone.utc).isoformat(),
            "model": GROQ_MODEL,
        })
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 503
    except json.JSONDecodeError:
        return jsonify({"error": "AI returned invalid JSON. Please try again.", "raw": raw}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"News insights failed: {str(e)}"}), 500


# ── /api/options/symbols ──────────────────────────────────────────────────────
@app.route("/api/options/symbols/list")
def list_option_symbols():
    """Return available symbols for option chain."""
    return jsonify({
        "indices": ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"],
        "equities": OPTION_EQUITY_SYMBOLS,
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


# ══════════════════════════════════════════════════════════════════════════════
# WEBSOCKET REAL-TIME BROADCAST ENGINE
# ══════════════════════════════════════════════════════════════════════════════

# ── State for options broadcast ───────────────────────────────────────────────
_ws_selected_symbol = 'NIFTY'
_ws_previous_options_data = None

# ── Smart Alert Engine ────────────────────────────────────────────────────────
def check_alerts(current_data, previous_data):
    """Detect trading-relevant alerts from options data changes."""
    alerts = []
    if not previous_data or not current_data:
        return alerts

    curr_summary = current_data.get('summary', {})
    prev_summary = previous_data.get('summary', {})

    # PCR crossing thresholds
    curr_pcr = curr_summary.get('pcr', 0)
    prev_pcr = prev_summary.get('pcr', 0)
    if prev_pcr and curr_pcr:
        if prev_pcr >= 0.8 and curr_pcr < 0.8:
            alerts.append({'type': 'PCR', 'severity': 'high',
                           'message': f'PCR dropped below 0.8 → Bearish signal ({curr_pcr:.3f})',
                           'timestamp': datetime.now().isoformat()})
        if prev_pcr <= 1.2 and curr_pcr > 1.2:
            alerts.append({'type': 'PCR', 'severity': 'high',
                           'message': f'PCR crossed above 1.2 → Bullish signal ({curr_pcr:.3f})',
                           'timestamp': datetime.now().isoformat()})
        if prev_pcr >= 1.0 and curr_pcr < 1.0:
            alerts.append({'type': 'PCR', 'severity': 'medium',
                           'message': f'PCR dropped below 1.0 → Sentiment shift ({curr_pcr:.3f})',
                           'timestamp': datetime.now().isoformat()})
        if prev_pcr <= 1.0 and curr_pcr > 1.0:
            alerts.append({'type': 'PCR', 'severity': 'medium',
                           'message': f'PCR crossed above 1.0 → Sentiment shift ({curr_pcr:.3f})',
                           'timestamp': datetime.now().isoformat()})

    # Max OI shifts
    curr_max_ce = curr_summary.get('maxCallOI', {}).get('strike', 0)
    prev_max_ce = prev_summary.get('maxCallOI', {}).get('strike', 0)
    if curr_max_ce and prev_max_ce and curr_max_ce != prev_max_ce:
        alerts.append({'type': 'OI_SHIFT', 'severity': 'medium',
                       'message': f'Max Call OI shifted from {prev_max_ce} to {curr_max_ce} (resistance moved)',
                       'timestamp': datetime.now().isoformat()})

    curr_max_pe = curr_summary.get('maxPutOI', {}).get('strike', 0)
    prev_max_pe = prev_summary.get('maxPutOI', {}).get('strike', 0)
    if curr_max_pe and prev_max_pe and curr_max_pe != prev_max_pe:
        alerts.append({'type': 'OI_SHIFT', 'severity': 'medium',
                       'message': f'Max Put OI shifted from {prev_max_pe} to {curr_max_pe} (support moved)',
                       'timestamp': datetime.now().isoformat()})

    return alerts


# ── Latency helper ────────────────────────────────────────────────────────────
def calculate_fetch_latency(start_time):
    return round((time.time() - start_time) * 1000, 1)


# ── Market Data Broadcast (2s cycle) ──────────────────────────────────────────
def market_broadcast_loop():
    """Background task: push indices/VIX/movers every 2 seconds."""
    print("  🔴 Market broadcast loop started")
    # Initialize NSE direct session first
    try:
        init_nse_direct_session()
    except Exception:
        pass

    while True:
        try:
            t0 = time.time()

            # Fetch from NSE
            indices_data = fetch_nse_indices()
            t_indices = time.time()

            gainers = fetch_nse_movers('gainers')
            losers = fetch_nse_movers('loosers')
            t_movers = time.time()

            # Calculate market breadth from indices
            market_session = get_market_session()

            payload = {
                'indices': indices_data.get('indices', []),
                'vix': indices_data.get('vix', 0),
                'vix_change': indices_data.get('vix_change', 0),
                'topGainers': gainers,
                'topLosers': losers,
                'timestamp': datetime.now().isoformat(),
                'latency': {
                    'nse_fetch_ms': calculate_fetch_latency(t0),
                    'indices_ms': round((t_indices - t0) * 1000, 1),
                    'movers_ms': round((t_movers - t_indices) * 1000, 1),
                    'total_ms': calculate_fetch_latency(t0),
                    'broadcast_ts': time.time(),
                },
                'marketSession': market_session,
            }

            socketio.emit('market_update', payload)
            socketio.sleep(2)  # 2-second refresh cycle

        except Exception as e:
            print(f"  ⚠ Market broadcast error: {e}")
            socketio.sleep(5)


def get_market_session():
    """Detect current market session."""
    now = datetime.now()
    day = now.weekday()  # 0=Mon, 6=Sun
    h, m = now.hour, now.minute
    mins = h * 60 + m

    if day >= 5:  # Weekend
        return {'status': 'closed', 'label': 'CLOSED', 'color': '#ef4444', 'next': 'Monday 9:00 AM'}
    elif mins < 9 * 60:  # Before 9 AM
        return {'status': 'closed', 'label': 'CLOSED', 'color': '#ef4444', 'next': '9:00 AM Pre-market'}
    elif mins < 9 * 60 + 15:  # 9:00 - 9:15
        return {'status': 'pre_market', 'label': 'PRE-MARKET', 'color': '#f59e0b', 'next': '9:15 AM Market Open'}
    elif mins < 15 * 60 + 30:  # 9:15 - 15:30
        return {'status': 'open', 'label': 'MARKET OPEN', 'color': '#10b981', 'next': '3:30 PM Close'}
    elif mins < 16 * 60:  # 15:30 - 16:00
        return {'status': 'post_market', 'label': 'POST-MARKET', 'color': '#f97316', 'next': '4:00 PM Session End'}
    else:
        return {'status': 'closed', 'label': 'CLOSED', 'color': '#ef4444', 'next': 'Tomorrow 9:00 AM'}


# ── Options Chain Broadcast (5s cycle) ────────────────────────────────────────
def options_broadcast_loop():
    """Background task: push full processed options chain every 5 seconds."""
    global _ws_previous_options_data
    print("  🔵 Options broadcast loop started")
    socketio.sleep(3)  # Let market broadcast warm up first

    while True:
        try:
            t0 = time.time()
            sym = _ws_selected_symbol

            is_index = sym in NSE_INDEX_SYMBOLS or sym in ('NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY')
            result = fetch_nse_option_chain(sym, is_index)
            df, expiry_dates, underlying_value, cached_at = result[0], result[1], result[2], result[3] if len(result) > 3 else None

            t_fetch = time.time()

            # Process into structured format
            S = safe_float(underlying_value) or 0
            processed_data = []
            total_ce_oi = 0
            total_pe_oi = 0
            total_ce_vol = 0
            total_pe_vol = 0
            max_ce_oi = {'strike': 0, 'oi': 0}
            max_pe_oi = {'strike': 0, 'oi': 0}
            call_oi_map = {}
            put_oi_map = {}

            for _, row in df.iterrows():
                strike = int(row.get('strikePrice', 0))
                if strike == 0:
                    continue

                ce_oi = safe_float(row.get('CE_openInterest')) or 0
                pe_oi = safe_float(row.get('PE_openInterest')) or 0
                ce_vol = safe_float(row.get('CE_totalTradedVolume')) or 0
                pe_vol = safe_float(row.get('PE_totalTradedVolume')) or 0

                total_ce_oi += ce_oi
                total_pe_oi += pe_oi
                total_ce_vol += ce_vol
                total_pe_vol += pe_vol
                call_oi_map[strike] = ce_oi
                put_oi_map[strike] = pe_oi

                if ce_oi > max_ce_oi['oi']:
                    max_ce_oi = {'strike': strike, 'oi': ce_oi}
                if pe_oi > max_pe_oi['oi']:
                    max_pe_oi = {'strike': strike, 'oi': pe_oi}

                # Moneyness
                if S > 0:
                    ratio = abs(strike - S) / S
                    moneyness = 'ATM' if ratio <= 0.02 else ('ITM' if strike < S else 'OTM')
                else:
                    moneyness = 'OTM'

                processed_data.append({
                    'strike': strike,
                    'expiry': row.get('expiryDate', ''),
                    'moneyness': moneyness,
                    'CE': {
                        'ltp': safe_float(row.get('CE_lastPrice')) or 0,
                        'change': safe_float(row.get('CE_change')) or 0,
                        'pChange': safe_float(row.get('CE_pChange')) or 0,
                        'oi': ce_oi,
                        'oiChange': safe_float(row.get('CE_changeinOpenInterest')) or 0,
                        'volume': ce_vol,
                        'iv': safe_float(row.get('CE_impliedVolatility')) or 0,
                        'bidQty': safe_float(row.get('CE_bidQty')) or 0,
                        'bidPrice': safe_float(row.get('CE_bidprice')) or 0,
                        'askPrice': safe_float(row.get('CE_askPrice')) or 0,
                        'askQty': safe_float(row.get('CE_askQty')) or 0,
                    },
                    'PE': {
                        'ltp': safe_float(row.get('PE_lastPrice')) or 0,
                        'change': safe_float(row.get('PE_change')) or 0,
                        'pChange': safe_float(row.get('PE_pChange')) or 0,
                        'oi': pe_oi,
                        'oiChange': safe_float(row.get('PE_changeinOpenInterest')) or 0,
                        'volume': pe_vol,
                        'iv': safe_float(row.get('PE_impliedVolatility')) or 0,
                        'bidQty': safe_float(row.get('PE_bidQty')) or 0,
                        'bidPrice': safe_float(row.get('PE_bidprice')) or 0,
                        'askPrice': safe_float(row.get('PE_askPrice')) or 0,
                        'askQty': safe_float(row.get('PE_askQty')) or 0,
                    },
                })

            t_process = time.time()

            # PCR & summary
            pcr = round(total_pe_oi / total_ce_oi, 4) if total_ce_oi > 0 else 0
            pcr_sentiment = 'Bullish' if pcr > 1.2 else ('Bearish' if pcr < 0.8 else 'Neutral')

            # Max Pain calculation
            all_strikes = sorted(set(row['strike'] for row in processed_data))
            max_pain_strike = 0
            min_pain = float('inf')
            for test_strike in all_strikes:
                pain = 0
                for s in all_strikes:
                    ce_o = call_oi_map.get(s, 0)
                    pe_o = put_oi_map.get(s, 0)
                    if test_strike > s:
                        pain += ce_o * (test_strike - s)
                    elif test_strike < s:
                        pain += pe_o * (s - test_strike)
                if pain < min_pain:
                    min_pain = pain
                    max_pain_strike = test_strike

            # Expected Move (ATM straddle)
            expected_move = 0
            if S > 0 and processed_data:
                atm_row = min(processed_data, key=lambda r: abs(r['strike'] - S))
                expected_move = round(atm_row['CE']['ltp'] + atm_row['PE']['ltp'], 2)

            options_payload = {
                'symbol': sym,
                'underlyingValue': S,
                'expiries': expiry_dates[:12] if expiry_dates else [],
                'selectedExpiry': expiry_dates[0] if expiry_dates else '',
                'data': processed_data,
                'summary': {
                    'totalCeOI': total_ce_oi,
                    'totalPeOI': total_pe_oi,
                    'totalCeVolume': total_ce_vol,
                    'totalPeVolume': total_pe_vol,
                    'pcr': pcr,
                    'pcrSentiment': pcr_sentiment,
                    'maxCallOI': max_ce_oi,
                    'maxPutOI': max_pe_oi,
                    'maxPain': max_pain_strike,
                    'expectedMove': expected_move,
                },
                'timestamp': datetime.now().isoformat(),
                'cachedAt': cached_at,
                'latency': {
                    'fetch_ms': round((t_fetch - t0) * 1000, 1),
                    'process_ms': round((t_process - t_fetch) * 1000, 1),
                    'total_ms': calculate_fetch_latency(t0),
                },
            }

            socketio.emit('options_update', options_payload)

            # Check alerts
            alerts = check_alerts(options_payload, _ws_previous_options_data)
            for alert in alerts:
                socketio.emit('alert', alert)
            _ws_previous_options_data = options_payload

            socketio.sleep(5)  # 5-second refresh for options

        except Exception as e:
            print(f"  ⚠ Options broadcast error: {e}")
            socketio.sleep(10)


# ── SocketIO Event Handlers ───────────────────────────────────────────────────

@socketio.on('connect')
def handle_connect():
    print(f"  🟢 Client connected: {request.sid}")
    emit('connection_status', {'status': 'connected', 'timestamp': datetime.now().isoformat()})

@socketio.on('disconnect')
def handle_disconnect():
    print(f"  🔴 Client disconnected: {request.sid}")

@socketio.on('ping_latency')
def handle_ping():
    emit('pong_latency', {'server_ts': time.time()})

@socketio.on('change_symbol')
def handle_change_symbol(data):
    global _ws_selected_symbol
    new_symbol = data.get('symbol', 'NIFTY').upper()
    _ws_selected_symbol = new_symbol
    print(f"  🔄 Options symbol changed to: {new_symbol}")
    emit('symbol_changed', {'symbol': new_symbol})


# ── /api-market (legacy compat) ───────────────────────────────────────────────
@app.route("/api-market")
def legacy_market():
    return get_market_data()


# ══════════════════════════════════════════════════════════════════════════════
# STARTUP
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("🚀 AlgoForge Python Backend (SocketIO) starting on http://localhost:5001")
    # Start background broadcast threads
    socketio.start_background_task(market_broadcast_loop)
    socketio.start_background_task(options_broadcast_loop)
    # Use socketio.run instead of app.run for WebSocket support
    socketio.run(app, host='0.0.0.0', port=5001, debug=False, use_reloader=False)
