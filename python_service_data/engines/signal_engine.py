"""
MODULE 13 — QUANT SIGNAL ENGINE
Multi-factor signals based on OI, Gamma, PCR, IV, and Volume.
"""
from flask import Blueprint, jsonify, request
import sys, os

signal_bp = Blueprint("signal_engine", __name__)

def _score_signal(value, thresholds, higher_is_bullish=True):
    """Score a metric on -100 to +100 scale."""
    low, mid, high = thresholds
    if value is None:
        return 0
    if higher_is_bullish:
        if value >= high:
            return 80
        elif value >= mid:
            return 40
        elif value <= low:
            return -80
        elif value <= mid:
            return -40
        return 0
    else:
        if value >= high:
            return -80
        elif value >= mid:
            return -40
        elif value <= low:
            return 80
        elif value <= mid:
            return 40
        return 0


@signal_bp.route("/api/signals")
def quant_signals():
    symbol = request.args.get("symbol", "NIFTY").upper()

    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from app import fetch_nse_option_chain, NSE_INDEX_SYMBOLS, safe_float

        is_index = symbol in NSE_INDEX_SYMBOLS or symbol in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
        result = fetch_nse_option_chain(symbol, is_index)
        df, expiry_dates, underlying_value = result[0], result[1], result[2]
        cached_at = result[3] if len(result) > 3 else None

        S = safe_float(underlying_value) or 0

        # Compute raw metrics
        total_ce_oi = 0
        total_pe_oi = 0
        total_ce_vol = 0
        total_pe_vol = 0
        max_ce_oi_strike = 0
        max_ce_oi = 0
        max_pe_oi_strike = 0
        max_pe_oi = 0
        all_ce_ivs = []
        all_pe_ivs = []

        for _, row in df.iterrows():
            strike = int(row.get("strikePrice", 0))
            if strike == 0:
                continue

            ce_oi = safe_float(row.get("CE_openInterest")) or 0
            pe_oi = safe_float(row.get("PE_openInterest")) or 0
            ce_vol = safe_float(row.get("CE_totalTradedVolume")) or 0
            pe_vol = safe_float(row.get("PE_totalTradedVolume")) or 0
            ce_iv = safe_float(row.get("CE_impliedVolatility"))
            pe_iv = safe_float(row.get("PE_impliedVolatility"))

            total_ce_oi += ce_oi
            total_pe_oi += pe_oi
            total_ce_vol += ce_vol
            total_pe_vol += pe_vol

            if ce_oi > max_ce_oi:
                max_ce_oi = ce_oi
                max_ce_oi_strike = strike
            if pe_oi > max_pe_oi:
                max_pe_oi = pe_oi
                max_pe_oi_strike = strike

            if ce_iv and ce_iv > 0:
                all_ce_ivs.append(ce_iv)
            if pe_iv and pe_iv > 0:
                all_pe_ivs.append(pe_iv)

        pcr_oi = round(total_pe_oi / max(total_ce_oi, 1), 4)
        pcr_vol = round(total_pe_vol / max(total_ce_vol, 1), 4)
        avg_ce_iv = round(sum(all_ce_ivs) / len(all_ce_ivs), 2) if all_ce_ivs else 0
        avg_pe_iv = round(sum(all_pe_ivs) / len(all_pe_ivs), 2) if all_pe_ivs else 0

        # Generate signals
        signals = []

        # 1. PCR Signal
        pcr_score = _score_signal(pcr_oi, (0.5, 1.0, 1.5), higher_is_bullish=True)
        signals.append({
            "name": "Put-Call Ratio (OI)",
            "value": pcr_oi,
            "score": pcr_score,
            "direction": "Bullish" if pcr_score > 30 else "Bearish" if pcr_score < -30 else "Neutral",
            "description": f"PCR of {pcr_oi} — {'Put writers dominating (bullish)' if pcr_oi > 1.2 else 'Call writers dominating (bearish)' if pcr_oi < 0.7 else 'Balanced'}",
            "category": "OI Analysis",
        })

        # 2. Max OI Resistance/Support
        max_oi_score = 0
        if S > 0:
            if max_ce_oi_strike > S:
                resistance_dist = (max_ce_oi_strike - S) / S * 100
                max_oi_score = 40 if resistance_dist > 2 else -20
            if max_pe_oi_strike < S:
                support_dist = (S - max_pe_oi_strike) / S * 100
                max_oi_score += 40 if support_dist < 2 else -20

        signals.append({
            "name": "OI Concentration",
            "value": f"Resistance: {max_ce_oi_strike}, Support: {max_pe_oi_strike}",
            "score": max_oi_score,
            "direction": "Bullish" if max_oi_score > 30 else "Bearish" if max_oi_score < -30 else "Neutral",
            "description": f"Max Call OI at {max_ce_oi_strike} (Resistance), Max Put OI at {max_pe_oi_strike} (Support)",
            "category": "OI Analysis",
        })

        # 3. IV Signal (high IV = potential reversal)
        iv_score = _score_signal(avg_ce_iv, (12, 20, 35), higher_is_bullish=False)
        signals.append({
            "name": "IV Level",
            "value": avg_ce_iv,
            "score": iv_score,
            "direction": "Bullish" if iv_score > 30 else "Bearish" if iv_score < -30 else "Neutral",
            "description": f"Avg IV: {avg_ce_iv}% — {'Low IV, potential breakout' if avg_ce_iv < 15 else 'High IV, potential mean reversion' if avg_ce_iv > 30 else 'Normal IV'}",
            "category": "Volatility",
        })

        # 4. Volume Signal
        vol_ratio = round(total_ce_vol / max(total_pe_vol, 1), 2)
        vol_score = _score_signal(vol_ratio, (0.5, 1.0, 1.5), higher_is_bullish=False)
        signals.append({
            "name": "Call/Put Volume Ratio",
            "value": vol_ratio,
            "score": vol_score,
            "direction": "Bullish" if vol_score > 30 else "Bearish" if vol_score < -30 else "Neutral",
            "description": f"CE/PE Volume: {vol_ratio} — {'Bearish volume bias' if vol_ratio > 1.5 else 'Bullish volume bias' if vol_ratio < 0.6 else 'Balanced'}",
            "category": "Volume",
        })

        # 5. IV Skew Signal
        if all_ce_ivs and all_pe_ivs:
            iv_skew = round(avg_pe_iv - avg_ce_iv, 2)
            skew_score = _score_signal(iv_skew, (-5, 0, 8), higher_is_bullish=False)
            signals.append({
                "name": "IV Skew (Put - Call)",
                "value": iv_skew,
                "score": skew_score,
                "direction": "Bullish" if skew_score > 30 else "Bearish" if skew_score < -30 else "Neutral",
                "description": f"Put IV premium: {iv_skew}% — {'Elevated put demand (fear)' if iv_skew > 5 else 'Normal skew'}",
                "category": "Volatility",
            })

        # Overall composite score
        if signals:
            composite = round(sum(s["score"] for s in signals) / len(signals), 1)
        else:
            composite = 0

        overall = "Strong Buy" if composite > 50 else "Buy" if composite > 20 else "Strong Sell" if composite < -50 else "Sell" if composite < -20 else "Neutral"

        return jsonify({
            "symbol": symbol,
            "underlyingValue": S,
            "signals": signals,
            "compositeScore": composite,
            "overallSignal": overall,
            "metrics": {
                "pcrOI": pcr_oi,
                "pcrVolume": pcr_vol,
                "avgCallIV": avg_ce_iv,
                "avgPutIV": avg_pe_iv,
                "maxCallOIStrike": max_ce_oi_strike,
                "maxPutOIStrike": max_pe_oi_strike,
            },
            "cachedAt": cached_at,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
