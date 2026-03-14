"""
MODULE 6 — GAMMA EXPOSURE ENGINE (GEX)
GEX = Gamma × OI × Contract Size × Spot² / 100 per strike.
"""
from flask import Blueprint, jsonify, request
import numpy as np
from scipy.stats import norm
import sys, os

gex_bp = Blueprint("gex_engine", __name__)

def bs_gamma(S, K, T, r, sigma):
    if T <= 0 or sigma <= 0 or S <= 0:
        return 0.0
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    return float(norm.pdf(d1) / (S * sigma * np.sqrt(T)))

def _days_to_expiry(expiry_str):
    from datetime import datetime
    try:
        exp = datetime.strptime(expiry_str, "%d-%b-%Y")
        delta = (exp - datetime.now()).total_seconds() / (365.25 * 86400)
        return max(delta, 1 / 365.25)
    except Exception:
        return 30 / 365.25

@gex_bp.route("/api/options/gex")
def gamma_exposure():
    symbol = request.args.get("symbol", "NIFTY").upper()
    expiry = request.args.get("expiry", None)
    r = float(request.args.get("risk_free_rate", 0.07))

    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from app import fetch_nse_option_chain, NSE_INDEX_SYMBOLS, safe_float

        is_index = symbol in NSE_INDEX_SYMBOLS or symbol in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
        
        # Contract sizes for NSE
        lot_sizes = {"NIFTY": 25, "BANKNIFTY": 15, "FINNIFTY": 25, "MIDCPNIFTY": 50}
        contract_size = lot_sizes.get(symbol, 1) if is_index else 1

        result = fetch_nse_option_chain(symbol, is_index)
        df, expiry_dates, underlying_value = result[0], result[1], result[2]
        cached_at = result[3] if len(result) > 3 else None

        S = safe_float(underlying_value) or 0
        if S <= 0:
            return jsonify({"error": "No underlying price"}), 400

        T = _days_to_expiry(expiry or (expiry_dates[0] if expiry_dates else ""))

        gex_data = []
        total_positive_gex = 0
        total_negative_gex = 0
        max_gex_strike = 0
        max_gex_value = 0

        for _, row in df.iterrows():
            strike = int(row.get("strikePrice", 0))
            if strike == 0:
                continue

            ce_oi = safe_float(row.get("CE_openInterest")) or 0
            pe_oi = safe_float(row.get("PE_openInterest")) or 0
            ce_iv = (safe_float(row.get("CE_impliedVolatility")) or 20) / 100
            pe_iv = (safe_float(row.get("PE_impliedVolatility")) or 20) / 100

            ce_gamma = bs_gamma(S, strike, T, r, ce_iv)
            pe_gamma = bs_gamma(S, strike, T, r, pe_iv)

            # Dealer GEX: calls positive (dealers are short gamma on calls they sold)
            # puts negative (dealers are long gamma on puts they sold)
            call_gex = ce_gamma * ce_oi * contract_size * S * S / 1e7  # in Cr
            put_gex = -pe_gamma * pe_oi * contract_size * S * S / 1e7
            net_gex = call_gex + put_gex

            if net_gex > 0:
                total_positive_gex += net_gex
            else:
                total_negative_gex += net_gex

            if abs(net_gex) > abs(max_gex_value):
                max_gex_value = net_gex
                max_gex_strike = strike

            gex_data.append({
                "strike": strike,
                "callGex": round(call_gex, 4),
                "putGex": round(put_gex, 4),
                "netGex": round(net_gex, 4),
                "callOI": ce_oi,
                "putOI": pe_oi,
                "callGamma": round(ce_gamma, 8),
                "putGamma": round(pe_gamma, 8),
            })

        # Find gamma flip point (where net GEX changes sign)
        gamma_flip = None
        for i in range(1, len(gex_data)):
            if gex_data[i - 1]["netGex"] * gex_data[i]["netGex"] < 0:
                gamma_flip = gex_data[i]["strike"]
                break

        # Gamma walls: top 3 strikes by absolute GEX
        sorted_gex = sorted(gex_data, key=lambda x: abs(x["netGex"]), reverse=True)
        gamma_walls = [{"strike": g["strike"], "gex": g["netGex"]} for g in sorted_gex[:5]]

        return jsonify({
            "symbol": symbol,
            "underlyingValue": S,
            "contractSize": contract_size,
            "gexData": gex_data,
            "totalPositiveGex": round(total_positive_gex, 4),
            "totalNegativeGex": round(total_negative_gex, 4),
            "netGex": round(total_positive_gex + total_negative_gex, 4),
            "maxGexStrike": max_gex_strike,
            "gammaFlip": gamma_flip,
            "gammaWalls": gamma_walls,
            "cachedAt": cached_at,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
