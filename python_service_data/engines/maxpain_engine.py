"""
MODULE 5 — MAX PAIN ENGINE
Max Pain = strike where total option writer loss is minimized.
"""
from flask import Blueprint, jsonify, request
import sys, os

maxpain_bp = Blueprint("maxpain_engine", __name__)

@maxpain_bp.route("/api/options/maxpain")
def max_pain():
    symbol = request.args.get("symbol", "NIFTY").upper()

    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from app import fetch_nse_option_chain, NSE_INDEX_SYMBOLS, safe_float

        is_index = symbol in NSE_INDEX_SYMBOLS or symbol in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
        result = fetch_nse_option_chain(symbol, is_index)
        df, expiry_dates, underlying_value = result[0], result[1], result[2]
        cached_at = result[3] if len(result) > 3 else None

        S = safe_float(underlying_value) or 0

        # Build strike -> OI maps
        call_oi_map = {}
        put_oi_map = {}
        strikes = []

        for _, row in df.iterrows():
            strike = int(row.get("strikePrice", 0))
            if strike == 0:
                continue
            ce_oi = safe_float(row.get("CE_openInterest")) or 0
            pe_oi = safe_float(row.get("PE_openInterest")) or 0
            call_oi_map[strike] = ce_oi
            put_oi_map[strike] = pe_oi
            strikes.append(strike)

        strikes = sorted(set(strikes))

        # Calculate total writer pain at each possible expiry price
        pain_data = []
        min_pain = float("inf")
        max_pain_strike = 0

        for test_price in strikes:
            call_pain = 0
            put_pain = 0
            for s in strikes:
                # Call writers lose when price > strike
                if test_price > s:
                    call_pain += call_oi_map.get(s, 0) * (test_price - s)
                # Put writers lose when price < strike
                if test_price < s:
                    put_pain += put_oi_map.get(s, 0) * (s - test_price)

            total_pain = call_pain + put_pain
            pain_data.append({
                "strike": test_price,
                "callPain": round(call_pain, 0),
                "putPain": round(put_pain, 0),
                "totalPain": round(total_pain, 0),
            })

            if total_pain < min_pain:
                min_pain = total_pain
                max_pain_strike = test_price

        # Distance from spot to max pain
        distance = round(((max_pain_strike - S) / S) * 100, 2) if S > 0 else 0

        return jsonify({
            "symbol": symbol,
            "underlyingValue": S,
            "maxPain": max_pain_strike,
            "maxPainDistance": distance,
            "painData": pain_data,
            "expiryDates": expiry_dates[:12] if expiry_dates else [],
            "callOIMap": {str(k): v for k, v in call_oi_map.items()},
            "putOIMap": {str(k): v for k, v in put_oi_map.items()},
            "cachedAt": cached_at,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
