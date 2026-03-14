"""
MODULE 7 — VOLUME PROFILE ENGINE
Detect high-volume strikes, liquidity zones, volume spikes.
"""
from flask import Blueprint, jsonify, request
import numpy as np
import sys, os

volume_bp = Blueprint("volume_engine", __name__)

@volume_bp.route("/api/options/volume-profile")
def volume_profile():
    symbol = request.args.get("symbol", "NIFTY").upper()

    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from app import fetch_nse_option_chain, NSE_INDEX_SYMBOLS, safe_float

        is_index = symbol in NSE_INDEX_SYMBOLS or symbol in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
        result = fetch_nse_option_chain(symbol, is_index)
        df, expiry_dates, underlying_value = result[0], result[1], result[2]
        cached_at = result[3] if len(result) > 3 else None

        S = safe_float(underlying_value) or 0
        volume_data = []
        all_volumes = []

        for _, row in df.iterrows():
            strike = int(row.get("strikePrice", 0))
            if strike == 0:
                continue
            ce_vol = safe_float(row.get("CE_totalTradedVolume")) or 0
            pe_vol = safe_float(row.get("PE_totalTradedVolume")) or 0
            total_vol = ce_vol + pe_vol
            all_volumes.append(total_vol)

            volume_data.append({
                "strike": strike,
                "callVolume": ce_vol,
                "putVolume": pe_vol,
                "totalVolume": total_vol,
                "callOI": safe_float(row.get("CE_openInterest")) or 0,
                "putOI": safe_float(row.get("PE_openInterest")) or 0,
            })

        # Detect high-volume strikes (> 2 std devs above mean)
        if all_volumes:
            mean_vol = np.mean(all_volumes)
            std_vol = np.std(all_volumes)
            threshold = mean_vol + 1.5 * std_vol
        else:
            threshold = 0

        high_volume_strikes = []
        liquidity_zones = []

        for v in volume_data:
            is_high = v["totalVolume"] > threshold
            v["isHighVolume"] = is_high
            if is_high:
                high_volume_strikes.append({
                    "strike": v["strike"],
                    "volume": v["totalVolume"],
                    "callVolume": v["callVolume"],
                    "putVolume": v["putVolume"],
                })

        # Liquidity zones: clusters of 3+ consecutive high-volume strikes
        sorted_hvs = sorted(high_volume_strikes, key=lambda x: x["strike"])
        if sorted_hvs:
            cluster = [sorted_hvs[0]]
            step = sorted_hvs[0]["strike"]
            for i in range(1, len(sorted_hvs)):
                if sorted_hvs[i]["strike"] - sorted_hvs[i-1]["strike"] <= (100 if is_index else S * 0.02):
                    cluster.append(sorted_hvs[i])
                else:
                    if len(cluster) >= 2:
                        liquidity_zones.append({
                            "from": cluster[0]["strike"],
                            "to": cluster[-1]["strike"],
                            "avgVolume": round(np.mean([c["volume"] for c in cluster]), 0),
                        })
                    cluster = [sorted_hvs[i]]
            if len(cluster) >= 2:
                liquidity_zones.append({
                    "from": cluster[0]["strike"],
                    "to": cluster[-1]["strike"],
                    "avgVolume": round(np.mean([c["volume"] for c in cluster]), 0),
                })

        return jsonify({
            "symbol": symbol,
            "underlyingValue": S,
            "volumeData": volume_data,
            "highVolumeStrikes": high_volume_strikes,
            "liquidityZones": liquidity_zones,
            "meanVolume": round(np.mean(all_volumes), 0) if all_volumes else 0,
            "volumeThreshold": round(threshold, 0),
            "cachedAt": cached_at,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
