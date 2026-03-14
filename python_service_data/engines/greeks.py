"""
MODULE 2 — OPTIONS GREEKS ENGINE
Black-Scholes pricing + Delta, Gamma, Theta, Vega, Rho for every strike.
"""
from flask import Blueprint, jsonify, request
import numpy as np
from scipy.stats import norm
import sys, os, time as _time

greeks_bp = Blueprint("greeks", __name__)

# ── Black-Scholes core ────────────────────────────────────────────────────────

def bs_d1(S, K, T, r, sigma):
    """Compute d1 in Black-Scholes formula."""
    if T <= 0 or sigma <= 0 or S <= 0 or K <= 0:
        return 0.0
    return (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))

def bs_d2(S, K, T, r, sigma):
    return bs_d1(S, K, T, r, sigma) - sigma * np.sqrt(T)

def bs_price(S, K, T, r, sigma, option_type="call"):
    """Black-Scholes option price."""
    if T <= 0:
        if option_type == "call":
            return max(S - K, 0)
        return max(K - S, 0)
    d1 = bs_d1(S, K, T, r, sigma)
    d2 = d1 - sigma * np.sqrt(T)
    if option_type == "call":
        return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    else:
        return K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

# ── Greeks ────────────────────────────────────────────────────────────────────

def compute_delta(S, K, T, r, sigma, option_type="call"):
    if T <= 0 or sigma <= 0:
        return 0.0
    d1 = bs_d1(S, K, T, r, sigma)
    if option_type == "call":
        return float(norm.cdf(d1))
    return float(norm.cdf(d1) - 1)

def compute_gamma(S, K, T, r, sigma):
    if T <= 0 or sigma <= 0 or S <= 0:
        return 0.0
    d1 = bs_d1(S, K, T, r, sigma)
    return float(norm.pdf(d1) / (S * sigma * np.sqrt(T)))

def compute_theta(S, K, T, r, sigma, option_type="call"):
    if T <= 0 or sigma <= 0:
        return 0.0
    d1 = bs_d1(S, K, T, r, sigma)
    d2 = d1 - sigma * np.sqrt(T)
    common = -(S * norm.pdf(d1) * sigma) / (2 * np.sqrt(T))
    if option_type == "call":
        return float((common - r * K * np.exp(-r * T) * norm.cdf(d2)) / 365)
    return float((common + r * K * np.exp(-r * T) * norm.cdf(-d2)) / 365)

def compute_vega(S, K, T, r, sigma):
    if T <= 0 or sigma <= 0:
        return 0.0
    d1 = bs_d1(S, K, T, r, sigma)
    return float(S * norm.pdf(d1) * np.sqrt(T) / 100)  # per 1% IV change

def compute_rho(S, K, T, r, sigma, option_type="call"):
    if T <= 0 or sigma <= 0:
        return 0.0
    d2 = bs_d2(S, K, T, r, sigma)
    if option_type == "call":
        return float(K * T * np.exp(-r * T) * norm.cdf(d2) / 100)
    return float(-K * T * np.exp(-r * T) * norm.cdf(-d2) / 100)

def compute_all_greeks(S, K, T, r, sigma, option_type="call"):
    return {
        "delta": round(compute_delta(S, K, T, r, sigma, option_type), 6),
        "gamma": round(compute_gamma(S, K, T, r, sigma), 6),
        "theta": round(compute_theta(S, K, T, r, sigma, option_type), 6),
        "vega": round(compute_vega(S, K, T, r, sigma), 6),
        "rho": round(compute_rho(S, K, T, r, sigma, option_type), 6),
    }


def _days_to_expiry(expiry_str):
    """Parse expiry string (e.g. '27-Mar-2025') and return T in years."""
    from datetime import datetime
    try:
        exp = datetime.strptime(expiry_str, "%d-%b-%Y")
        delta = (exp - datetime.now()).total_seconds() / (365.25 * 86400)
        return max(delta, 1 / 365.25)  # min 1 day
    except Exception:
        return 30 / 365.25  # default 30 days


# ── API Endpoint ──────────────────────────────────────────────────────────────

@greeks_bp.route("/api/options/greeks")
def options_greeks():
    """Compute Greeks for all strikes in the option chain."""
    symbol = request.args.get("symbol", "NIFTY").upper()
    expiry = request.args.get("expiry", None)
    r = float(request.args.get("risk_free_rate", 0.07))  # India 10Y ~7%

    try:
        # Import the option chain fetcher from main app
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from app import fetch_nse_option_chain, NSE_INDEX_SYMBOLS, safe_float

        is_index = symbol in NSE_INDEX_SYMBOLS or symbol in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
        result = fetch_nse_option_chain(symbol, is_index)
        df, expiry_dates, underlying_value, cached_at = result[0], result[1], result[2], result[3] if len(result) > 3 else None

        S = safe_float(underlying_value) or 0
        if S <= 0:
            return jsonify({"error": "No underlying price available"}), 400

        T = _days_to_expiry(expiry or (expiry_dates[0] if expiry_dates else ""))

        greeks_data = []
        for _, row in df.iterrows():
            strike = int(row.get("strikePrice", 0))
            if strike == 0:
                continue

            ce_iv = safe_float(row.get("CE_impliedVolatility")) or 0
            pe_iv = safe_float(row.get("PE_impliedVolatility")) or 0
            ce_sigma = ce_iv / 100 if ce_iv > 0 else 0.20
            pe_sigma = pe_iv / 100 if pe_iv > 0 else 0.20

            entry = {
                "strike": strike,
                "call": compute_all_greeks(S, strike, T, r, ce_sigma, "call") if ce_sigma > 0 else None,
                "put": compute_all_greeks(S, strike, T, r, pe_sigma, "put") if pe_sigma > 0 else None,
                "call_iv": ce_iv,
                "put_iv": pe_iv,
                "call_ltp": safe_float(row.get("CE_lastPrice")),
                "put_ltp": safe_float(row.get("PE_lastPrice")),
                "call_bs_price": round(bs_price(S, strike, T, r, ce_sigma, "call"), 2) if ce_sigma > 0 else None,
                "put_bs_price": round(bs_price(S, strike, T, r, pe_sigma, "put"), 2) if pe_sigma > 0 else None,
            }
            greeks_data.append(entry)

        return jsonify({
            "symbol": symbol,
            "underlyingValue": S,
            "timeToExpiry": round(T, 6),
            "riskFreeRate": r,
            "expiry": expiry or (expiry_dates[0] if expiry_dates else None),
            "expiryDates": expiry_dates[:12] if expiry_dates else [],
            "greeks": greeks_data,
            "cachedAt": cached_at,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
