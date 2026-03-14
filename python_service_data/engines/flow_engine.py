"""
MODULE 8 — OPTIONS FLOW ANALYTICS
Detect unusual options activity via Volume/OI ratio, block trades, sweeps.
"""
from flask import Blueprint, jsonify, request
import numpy as np
import sys, os

flow_bp = Blueprint("flow_engine", __name__)

@flow_bp.route("/api/options/flow")
def options_flow():
    symbol = request.args.get("symbol", "NIFTY").upper()

    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from app import fetch_nse_option_chain, NSE_INDEX_SYMBOLS, safe_float

        is_index = symbol in NSE_INDEX_SYMBOLS or symbol in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
        result = fetch_nse_option_chain(symbol, is_index)
        df, expiry_dates, underlying_value = result[0], result[1], result[2]
        cached_at = result[3] if len(result) > 3 else None

        S = safe_float(underlying_value) or 0
        flow_data = []
        unusual_activity = []

        for _, row in df.iterrows():
            strike = int(row.get("strikePrice", 0))
            if strike == 0:
                continue

            for opt_type, prefix in [("CE", "CE_"), ("PE", "PE_")]:
                vol = safe_float(row.get(f"{prefix}totalTradedVolume")) or 0
                oi = safe_float(row.get(f"{prefix}openInterest")) or 0
                oi_chg = safe_float(row.get(f"{prefix}changeinOpenInterest")) or 0
                ltp = safe_float(row.get(f"{prefix}lastPrice")) or 0
                iv = safe_float(row.get(f"{prefix}impliedVolatility")) or 0
                change = safe_float(row.get(f"{prefix}change")) or 0

                vol_oi_ratio = round(vol / max(oi, 1), 2)

                entry = {
                    "strike": strike,
                    "type": opt_type,
                    "volume": vol,
                    "oi": oi,
                    "oiChange": oi_chg,
                    "ltp": ltp,
                    "iv": iv,
                    "change": change,
                    "volOIRatio": vol_oi_ratio,
                }

                # Flag unusual activity
                flags = []
                if vol_oi_ratio > 2.0 and vol > 1000:
                    flags.append("High Vol/OI")
                if vol > 50000:
                    flags.append("Large Block")
                if oi_chg > 0 and abs(oi_chg) > oi * 0.3 and oi > 0:
                    flags.append("OI Surge")
                if iv and iv > 50:
                    flags.append("High IV")

                entry["flags"] = flags
                entry["isUnusual"] = len(flags) > 0
                flow_data.append(entry)

                if flags:
                    sentiment = "Bullish" if change > 0 else "Bearish" if change < 0 else "Neutral"
                    unusual_activity.append({
                        **entry,
                        "sentiment": sentiment,
                        "score": len(flags) * 25 + min(vol_oi_ratio * 10, 50),
                    })

        # Sort unusual by score descending
        unusual_activity.sort(key=lambda x: x.get("score", 0), reverse=True)

        # Summary
        total_ce_vol = sum(f["volume"] for f in flow_data if f["type"] == "CE")
        total_pe_vol = sum(f["volume"] for f in flow_data if f["type"] == "PE")
        bullish_flow = sum(1 for u in unusual_activity if u["sentiment"] == "Bullish")
        bearish_flow = sum(1 for u in unusual_activity if u["sentiment"] == "Bearish")

        return jsonify({
            "symbol": symbol,
            "underlyingValue": S,
            "flowData": flow_data,
            "unusualActivity": unusual_activity[:20],
            "summary": {
                "totalCallVolume": total_ce_vol,
                "totalPutVolume": total_pe_vol,
                "volRatio": round(total_ce_vol / max(total_pe_vol, 1), 2),
                "unusualCount": len(unusual_activity),
                "bullishFlows": bullish_flow,
                "bearishFlows": bearish_flow,
                "flowSentiment": "Bullish" if bullish_flow > bearish_flow * 1.3 else "Bearish" if bearish_flow > bullish_flow * 1.3 else "Neutral",
            },
            "cachedAt": cached_at,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
