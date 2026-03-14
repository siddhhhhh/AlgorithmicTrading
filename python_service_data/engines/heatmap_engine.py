"""
MODULE 11 — HEATMAP ENGINE
Sector, Stock, and Options heatmaps using OI, Volume, and IV data.
"""
from flask import Blueprint, jsonify, request
import numpy as np
import sys, os

heatmap_bp = Blueprint("heatmap_engine", __name__)

# Nifty50 sector mapping
SECTOR_STOCKS = {
    "Banking": ["HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK", "INDUSINDBK", "BANKBARODA", "PNB"],
    "IT": ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM", "LTIM", "MPHASIS", "COFORGE"],
    "Auto": ["TATAMOTORS", "M&M", "MARUTI", "BAJAJ-AUTO", "HEROMOTOCO", "EICHERMOT"],
    "Pharma": ["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "APOLLOHOSP"],
    "Energy": ["RELIANCE", "ONGC", "NTPC", "POWERGRID", "ADANIGREEN", "TATAPOWER"],
    "FMCG": ["HINDUNILVR", "ITC", "NESTLEIND", "BRITANNIA", "DABUR", "MARICO"],
    "Metals": ["TATASTEEL", "HINDALCO", "JSWSTEEL", "COALINDIA", "VEDL"],
    "Realty": ["DLF", "GODREJPROP", "OBEROIRLTY", "PRESTIGE"],
}

@heatmap_bp.route("/api/options/heatmap")
def option_heatmap():
    """Options heatmap across strikes (OI, Volume, IV)."""
    symbol = request.args.get("symbol", "NIFTY").upper()
    metric = request.args.get("metric", "oi")  # oi, volume, iv

    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from app import fetch_nse_option_chain, NSE_INDEX_SYMBOLS, safe_float

        is_index = symbol in NSE_INDEX_SYMBOLS or symbol in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
        result = fetch_nse_option_chain(symbol, is_index)
        df, expiry_dates, underlying_value = result[0], result[1], result[2]
        cached_at = result[3] if len(result) > 3 else None

        S = safe_float(underlying_value) or 0
        heatmap_data = []
        max_val = 0

        for _, row in df.iterrows():
            strike = int(row.get("strikePrice", 0))
            if strike == 0:
                continue

            if metric == "oi":
                ce_val = safe_float(row.get("CE_openInterest")) or 0
                pe_val = safe_float(row.get("PE_openInterest")) or 0
            elif metric == "volume":
                ce_val = safe_float(row.get("CE_totalTradedVolume")) or 0
                pe_val = safe_float(row.get("PE_totalTradedVolume")) or 0
            elif metric == "iv":
                ce_val = safe_float(row.get("CE_impliedVolatility")) or 0
                pe_val = safe_float(row.get("PE_impliedVolatility")) or 0
            elif metric == "oi_change":
                ce_val = safe_float(row.get("CE_changeinOpenInterest")) or 0
                pe_val = safe_float(row.get("PE_changeinOpenInterest")) or 0
            else:
                ce_val = 0
                pe_val = 0

            max_val = max(max_val, abs(ce_val), abs(pe_val))
            heatmap_data.append({
                "strike": strike,
                "callValue": ce_val,
                "putValue": pe_val,
                "totalValue": ce_val + pe_val,
                "moneyness": round((strike - S) / S * 100, 2) if S > 0 else 0,
            })

        # Normalize intensities for coloring
        for d in heatmap_data:
            d["callIntensity"] = round(abs(d["callValue"]) / max_val, 4) if max_val > 0 else 0
            d["putIntensity"] = round(abs(d["putValue"]) / max_val, 4) if max_val > 0 else 0

        return jsonify({
            "symbol": symbol,
            "underlyingValue": S,
            "metric": metric,
            "heatmapData": heatmap_data,
            "maxValue": max_val,
            "cachedAt": cached_at,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@heatmap_bp.route("/api/heatmap/sectors")
def sector_heatmap():
    """Sector-level heatmap using market data."""
    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        import yfinance as yf

        sector_data = []
        for sector, stocks in SECTOR_STOCKS.items():
            # Use first 3 stocks as proxy for sector performance
            changes = []
            for stock in stocks[:3]:
                try:
                    ticker = yf.Ticker(f"{stock}.NS")
                    hist = ticker.history(period="2d")
                    if len(hist) >= 2:
                        chg = ((hist["Close"].iloc[-1] - hist["Close"].iloc[-2]) / hist["Close"].iloc[-2]) * 100
                        changes.append(chg)
                except Exception:
                    pass

            avg_change = round(np.mean(changes), 2) if changes else 0
            sector_data.append({
                "sector": sector,
                "change": avg_change,
                "stocks": stocks,
                "stockCount": len(stocks),
            })

        return jsonify({
            "sectorData": sector_data,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
