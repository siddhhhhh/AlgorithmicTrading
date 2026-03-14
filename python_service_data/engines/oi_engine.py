"""
MODULE 4 — OI BUILDUP CLASSIFICATION
Detects: Long Buildup, Short Buildup, Short Covering, Long Unwinding.
"""
from flask import Blueprint, jsonify, request
import sys, os

oi_bp = Blueprint("oi_engine", __name__)

def classify_oi_buildup(price_change, oi_change):
    """
    Price ↑ + OI ↑ = Long Buildup
    Price ↓ + OI ↑ = Short Buildup
    Price ↑ + OI ↓ = Short Covering
    Price ↓ + OI ↓ = Long Unwinding
    """
    if price_change is None or oi_change is None:
        return "Neutral"
    if price_change > 0 and oi_change > 0:
        return "Long Buildup"
    elif price_change < 0 and oi_change > 0:
        return "Short Buildup"
    elif price_change > 0 and oi_change < 0:
        return "Short Covering"
    elif price_change < 0 and oi_change < 0:
        return "Long Unwinding"
    return "Neutral"


@oi_bp.route("/api/options/oi-analysis")
def oi_analysis():
    symbol = request.args.get("symbol", "NIFTY").upper()

    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from app import fetch_nse_option_chain, NSE_INDEX_SYMBOLS, safe_float

        is_index = symbol in NSE_INDEX_SYMBOLS or symbol in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
        result = fetch_nse_option_chain(symbol, is_index)
        df, expiry_dates, underlying_value = result[0], result[1], result[2]
        cached_at = result[3] if len(result) > 3 else None

        S = safe_float(underlying_value) or 0
        analysis = []
        buildup_summary = {"Long Buildup": 0, "Short Buildup": 0, "Short Covering": 0, "Long Unwinding": 0, "Neutral": 0}

        # OI concentration
        max_ce_oi = 0
        max_ce_oi_strike = 0
        max_pe_oi = 0
        max_pe_oi_strike = 0
        total_ce_oi = 0
        total_pe_oi = 0

        for _, row in df.iterrows():
            strike = int(row.get("strikePrice", 0))
            if strike == 0:
                continue

            ce_oi = safe_float(row.get("CE_openInterest")) or 0
            pe_oi = safe_float(row.get("PE_openInterest")) or 0
            ce_oi_chg = safe_float(row.get("CE_changeinOpenInterest")) or 0
            pe_oi_chg = safe_float(row.get("PE_changeinOpenInterest")) or 0
            ce_change = safe_float(row.get("CE_change")) or 0
            pe_change = safe_float(row.get("PE_change")) or 0

            ce_buildup = classify_oi_buildup(ce_change, ce_oi_chg)
            pe_buildup = classify_oi_buildup(pe_change, pe_oi_chg)

            buildup_summary[ce_buildup] = buildup_summary.get(ce_buildup, 0) + 1
            buildup_summary[pe_buildup] = buildup_summary.get(pe_buildup, 0) + 1

            total_ce_oi += ce_oi
            total_pe_oi += pe_oi
            if ce_oi > max_ce_oi:
                max_ce_oi = ce_oi
                max_ce_oi_strike = strike
            if pe_oi > max_pe_oi:
                max_pe_oi = pe_oi
                max_pe_oi_strike = strike

            analysis.append({
                "strike": strike,
                "callOI": ce_oi,
                "putOI": pe_oi,
                "callOIChange": ce_oi_chg,
                "putOIChange": pe_oi_chg,
                "callChange": ce_change,
                "putChange": pe_change,
                "callBuildup": ce_buildup,
                "putBuildup": pe_buildup,
            })

        # Overall market sentiment from OI buildups
        bullish_signals = buildup_summary.get("Long Buildup", 0) + buildup_summary.get("Short Covering", 0)
        bearish_signals = buildup_summary.get("Short Buildup", 0) + buildup_summary.get("Long Unwinding", 0)
        if bullish_signals > bearish_signals * 1.3:
            sentiment = "Bullish"
        elif bearish_signals > bullish_signals * 1.3:
            sentiment = "Bearish"
        else:
            sentiment = "Neutral"

        return jsonify({
            "symbol": symbol,
            "underlyingValue": S,
            "analysis": analysis,
            "buildupSummary": buildup_summary,
            "sentiment": sentiment,
            "concentration": {
                "maxCallOI": max_ce_oi,
                "maxCallOIStrike": max_ce_oi_strike,
                "maxPutOI": max_pe_oi,
                "maxPutOIStrike": max_pe_oi_strike,
                "totalCallOI": total_ce_oi,
                "totalPutOI": total_pe_oi,
                "pcr": round(total_pe_oi / max(total_ce_oi, 1), 4),
            },
            "cachedAt": cached_at,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
