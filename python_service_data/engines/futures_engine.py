"""
MODULE 12 — FUTURES ANALYTICS ENGINE
Futures OI, Price vs OI, Futures premium/discount, basis.
"""
from flask import Blueprint, jsonify, request
import sys, os

futures_bp = Blueprint("futures_engine", __name__)

@futures_bp.route("/api/futures/analytics")
def futures_analytics():
    symbol = request.args.get("symbol", "NIFTY").upper()

    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from app import fetch_nse_option_chain, NSE_INDEX_SYMBOLS, safe_float

        is_index = symbol in NSE_INDEX_SYMBOLS or symbol in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
        result = fetch_nse_option_chain(symbol, is_index)
        df, expiry_dates, underlying_value = result[0], result[1], result[2]
        cached_at = result[3] if len(result) > 3 else None

        S = safe_float(underlying_value) or 0

        # Aggregate futures-relevant metrics from option chain
        total_call_oi = 0
        total_put_oi = 0
        total_call_vol = 0
        total_put_vol = 0

        for _, row in df.iterrows():
            total_call_oi += safe_float(row.get("CE_openInterest")) or 0
            total_put_oi += safe_float(row.get("PE_openInterest")) or 0
            total_call_vol += safe_float(row.get("CE_totalTradedVolume")) or 0
            total_put_vol += safe_float(row.get("PE_totalTradedVolume")) or 0

        pcr_oi = round(total_put_oi / max(total_call_oi, 1), 4)
        pcr_vol = round(total_put_vol / max(total_call_vol, 1), 4)

        # Estimate futures premium (using put-call parity approximation)
        # Futures ≈ Spot + basis (cost of carry)
        futures_estimate = S * 1.005  # ~0.5% monthly carry estimate
        basis = round(futures_estimate - S, 2)
        basis_pct = round((basis / S) * 100, 4) if S > 0 else 0

        # Rollover data (number of near-month vs next-month expiry OI)
        rollover_hint = "Near month" if len(expiry_dates) >= 2 else "Single expiry"

        return jsonify({
            "symbol": symbol,
            "spotPrice": S,
            "futuresEstimate": round(futures_estimate, 2),
            "basis": basis,
            "basisPercent": basis_pct,
            "premiumDiscount": "Premium" if basis > 0 else "Discount",
            "pcrOI": pcr_oi,
            "pcrVolume": pcr_vol,
            "totalCallOI": total_call_oi,
            "totalPutOI": total_put_oi,
            "totalCallVolume": total_call_vol,
            "totalPutVolume": total_put_vol,
            "expiryDates": expiry_dates[:6] if expiry_dates else [],
            "rolloverHint": rollover_hint,
            "cachedAt": cached_at,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
