"""
MODULE 10 — VOLATILITY ANALYTICS ENGINE
IV Surface, Skew, Smile, and Term Structure visualization data.
"""
from flask import Blueprint, jsonify, request
import numpy as np
import sys, os

volatility_bp = Blueprint("volatility_engine", __name__)

def _days_to_expiry(expiry_str):
    from datetime import datetime
    try:
        exp = datetime.strptime(expiry_str, "%d-%b-%Y")
        delta = (exp - datetime.now()).total_seconds() / (365.25 * 86400)
        return max(delta, 1 / 365.25)
    except Exception:
        return 30 / 365.25

@volatility_bp.route("/api/options/volatility")
def volatility_analytics():
    symbol = request.args.get("symbol", "NIFTY").upper()

    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from app import fetch_nse_option_chain, NSE_INDEX_SYMBOLS, safe_float

        is_index = symbol in NSE_INDEX_SYMBOLS or symbol in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
        result = fetch_nse_option_chain(symbol, is_index)
        df, expiry_dates, underlying_value = result[0], result[1], result[2]
        cached_at = result[3] if len(result) > 3 else None

        S = safe_float(underlying_value) or 0
        if S <= 0:
            return jsonify({"error": "No underlying price"}), 400

        # IV Smile / Skew data
        smile_data = []
        all_ivs = []
        atm_strike = None
        min_dist = float("inf")

        for _, row in df.iterrows():
            strike = int(row.get("strikePrice", 0))
            if strike == 0:
                continue

            ce_iv = safe_float(row.get("CE_impliedVolatility"))
            pe_iv = safe_float(row.get("PE_impliedVolatility"))
            moneyness = round((strike / S - 1) * 100, 2)

            if abs(strike - S) < min_dist:
                min_dist = abs(strike - S)
                atm_strike = strike

            entry = {
                "strike": strike,
                "moneyness": moneyness,
                "callIV": ce_iv,
                "putIV": pe_iv,
                "avgIV": round((ce_iv + pe_iv) / 2, 2) if ce_iv and pe_iv else ce_iv or pe_iv,
            }
            smile_data.append(entry)
            if ce_iv and ce_iv > 0:
                all_ivs.append(ce_iv)

        # ATM IV
        atm_data = next((s for s in smile_data if s["strike"] == atm_strike), None)
        atm_iv = atm_data["callIV"] if atm_data else None

        # IV Skew metric: 25-delta OTM put IV - 25-delta OTM call IV
        otm_strikes = [s for s in smile_data if s["moneyness"] < -3 and s["putIV"]]
        itm_strikes = [s for s in smile_data if s["moneyness"] > 3 and s["callIV"]]
        skew_25d = None
        if otm_strikes and itm_strikes:
            # Use ~5% OTM as proxy for 25-delta
            otm_put = min(otm_strikes, key=lambda x: abs(x["moneyness"] + 5))
            otm_call = min(itm_strikes, key=lambda x: abs(x["moneyness"] - 5))
            if otm_put["putIV"] and otm_call["callIV"]:
                skew_25d = round(otm_put["putIV"] - otm_call["callIV"], 2)

        # Term structure from multiple expiries
        term_structure = []
        for exp_date in (expiry_dates[:8] if expiry_dates else []):
            t = _days_to_expiry(exp_date)
            # Use ATM IV values
            term_structure.append({
                "expiry": exp_date,
                "daysToExpiry": round(t * 365, 0),
                "atmIV": atm_iv,  # In live, fetch per-expiry
            })

        # IV surface (3D) - strikes x expiries
        surface_data = []
        for entry in smile_data:
            if entry["callIV"] and entry["callIV"] > 0:
                surface_data.append({
                    "strike": entry["strike"],
                    "moneyness": entry["moneyness"],
                    "iv": entry["callIV"],
                    "expiry": expiry_dates[0] if expiry_dates else "",
                    "daysToExpiry": round(_days_to_expiry(expiry_dates[0]) * 365, 0) if expiry_dates else 30,
                })

        # Statistics
        iv_stats = {}
        if all_ivs:
            iv_stats = {
                "mean": round(np.mean(all_ivs), 2),
                "median": round(np.median(all_ivs), 2),
                "min": round(min(all_ivs), 2),
                "max": round(max(all_ivs), 2),
                "std": round(np.std(all_ivs), 2),
            }

        return jsonify({
            "symbol": symbol,
            "underlyingValue": S,
            "atmStrike": atm_strike,
            "atmIV": atm_iv,
            "skew25Delta": skew_25d,
            "smileData": smile_data,
            "termStructure": term_structure,
            "surfaceData": surface_data,
            "ivStats": iv_stats,
            "cachedAt": cached_at,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
