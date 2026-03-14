"""
MODULE 3 — IMPLIED VOLATILITY ENGINE
Newton-Raphson IV solver + IV Rank, Percentile, Term Structure.
"""
from flask import Blueprint, jsonify, request
import numpy as np
from scipy.stats import norm
import sys, os

iv_bp = Blueprint("iv_engine", __name__)

# ── Newton-Raphson IV Solver ──────────────────────────────────────────────────

def bs_price(S, K, T, r, sigma, option_type="call"):
    if T <= 0 or sigma <= 0:
        return max(S - K, 0) if option_type == "call" else max(K - S, 0)
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if option_type == "call":
        return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

def bs_vega(S, K, T, r, sigma):
    if T <= 0 or sigma <= 0:
        return 0.0
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    return S * norm.pdf(d1) * np.sqrt(T)

def implied_volatility_newton(market_price, S, K, T, r, option_type="call",
                                max_iter=100, tol=1e-6):
    """Newton-Raphson method to find implied volatility."""
    if market_price <= 0 or S <= 0 or K <= 0 or T <= 0:
        return None

    # Check intrinsic value
    intrinsic = max(S - K, 0) if option_type == "call" else max(K - S, 0)
    if market_price < intrinsic:
        return None

    sigma = 0.25  # initial guess
    for _ in range(max_iter):
        price = bs_price(S, K, T, r, sigma, option_type)
        vega = bs_vega(S, K, T, r, sigma)

        if abs(vega) < 1e-12:
            break

        diff = market_price - price
        if abs(diff) < tol:
            return sigma

        sigma = sigma + diff / vega
        if sigma <= 0.001:
            sigma = 0.001
        if sigma > 5.0:
            return None

    return sigma if 0.001 < sigma < 5.0 else None


def _days_to_expiry(expiry_str):
    from datetime import datetime
    try:
        exp = datetime.strptime(expiry_str, "%d-%b-%Y")
        delta = (exp - datetime.now()).total_seconds() / (365.25 * 86400)
        return max(delta, 1 / 365.25)
    except Exception:
        return 30 / 365.25


# ── IV Analytics ──────────────────────────────────────────────────────────────

def compute_iv_rank(current_iv, iv_history):
    """IV Rank = (Current - Min) / (Max - Min) * 100"""
    if not iv_history or len(iv_history) < 2:
        return None
    min_iv = min(iv_history)
    max_iv = max(iv_history)
    if max_iv == min_iv:
        return 50.0
    return round(((current_iv - min_iv) / (max_iv - min_iv)) * 100, 2)

def compute_iv_percentile(current_iv, iv_history):
    """IV Percentile = % of days IV was below current level"""
    if not iv_history:
        return None
    below = sum(1 for iv in iv_history if iv < current_iv)
    return round((below / len(iv_history)) * 100, 2)


# ── API Endpoints ─────────────────────────────────────────────────────────────

@iv_bp.route("/api/options/implied-volatility")
def implied_vol():
    """Calculate IV for all strikes using Newton-Raphson."""
    symbol = request.args.get("symbol", "NIFTY").upper()
    expiry = request.args.get("expiry", None)
    r = float(request.args.get("risk_free_rate", 0.07))

    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from app import fetch_nse_option_chain, NSE_INDEX_SYMBOLS, safe_float

        is_index = symbol in NSE_INDEX_SYMBOLS or symbol in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
        result = fetch_nse_option_chain(symbol, is_index)
        df = result[0]
        expiry_dates = result[1]
        underlying_value = result[2]
        cached_at = result[3] if len(result) > 3 else None

        S = safe_float(underlying_value) or 0
        if S <= 0:
            return jsonify({"error": "No underlying price"}), 400

        T = _days_to_expiry(expiry or (expiry_dates[0] if expiry_dates else ""))

        iv_data = []
        all_ce_ivs = []
        all_pe_ivs = []

        for _, row in df.iterrows():
            strike = int(row.get("strikePrice", 0))
            if strike == 0:
                continue

            ce_ltp = safe_float(row.get("CE_lastPrice")) or 0
            pe_ltp = safe_float(row.get("PE_lastPrice")) or 0
            nse_ce_iv = safe_float(row.get("CE_impliedVolatility"))
            nse_pe_iv = safe_float(row.get("PE_impliedVolatility"))

            # Compute IV via Newton-Raphson
            computed_ce_iv = implied_volatility_newton(ce_ltp, S, strike, T, r, "call")
            computed_pe_iv = implied_volatility_newton(pe_ltp, S, strike, T, r, "put")

            ce_iv_pct = round(computed_ce_iv * 100, 2) if computed_ce_iv else nse_ce_iv
            pe_iv_pct = round(computed_pe_iv * 100, 2) if computed_pe_iv else nse_pe_iv

            if ce_iv_pct and ce_iv_pct > 0:
                all_ce_ivs.append(ce_iv_pct)
            if pe_iv_pct and pe_iv_pct > 0:
                all_pe_ivs.append(pe_iv_pct)

            iv_data.append({
                "strike": strike,
                "call_iv": ce_iv_pct,
                "put_iv": pe_iv_pct,
                "call_iv_nse": nse_ce_iv,
                "put_iv_nse": nse_pe_iv,
                "call_ltp": ce_ltp,
                "put_ltp": pe_ltp,
                "moneyness": round((strike - S) / S * 100, 2),
            })

        # ATM IV
        atm_idx = min(range(len(iv_data)), key=lambda i: abs(iv_data[i]["strike"] - S)) if iv_data else 0
        atm_ce_iv = iv_data[atm_idx]["call_iv"] if iv_data else 0
        atm_pe_iv = iv_data[atm_idx]["put_iv"] if iv_data else 0

        # IV Rank & Percentile (using current session data as proxy)
        avg_iv = np.mean(all_ce_ivs) if all_ce_ivs else 0

        # Term structure (IV by expiry - using current data)
        term_structure = []
        for exp_date in (expiry_dates[:6] if expiry_dates else []):
            t_exp = _days_to_expiry(exp_date)
            # Use ATM IV scaled by sqrt(time) as approximation
            scaled_iv = atm_ce_iv * np.sqrt(T / max(t_exp, 0.001)) if atm_ce_iv and T > 0 else atm_ce_iv
            term_structure.append({
                "expiry": exp_date,
                "daysToExpiry": round(t_exp * 365, 0),
                "atmIV": round(scaled_iv, 2) if scaled_iv else None,
            })

        return jsonify({
            "symbol": symbol,
            "underlyingValue": S,
            "timeToExpiry": round(T, 6),
            "expiry": expiry or (expiry_dates[0] if expiry_dates else None),
            "expiryDates": expiry_dates[:12] if expiry_dates else [],
            "ivData": iv_data,
            "atmCallIV": atm_ce_iv,
            "atmPutIV": atm_pe_iv,
            "avgCallIV": round(np.mean(all_ce_ivs), 2) if all_ce_ivs else None,
            "avgPutIV": round(np.mean(all_pe_ivs), 2) if all_pe_ivs else None,
            "ivRank": compute_iv_rank(atm_ce_iv, all_ce_ivs) if atm_ce_iv else None,
            "ivPercentile": compute_iv_percentile(atm_ce_iv, all_ce_ivs) if atm_ce_iv else None,
            "termStructure": term_structure,
            "cachedAt": cached_at,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
