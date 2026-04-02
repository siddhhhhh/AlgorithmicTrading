"""
MODULE 14 — AI ANALYST ENGINE
LLM-powered market interpretation using Gemini or Groq.
"""
from flask import Blueprint, jsonify, request
import sys, os, json

ai_analyst_bp = Blueprint("ai_analyst", __name__)

def _get_market_context(symbol):
    """Gather key market metrics for AI analysis."""
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from app import fetch_nse_option_chain, NSE_INDEX_SYMBOLS, safe_float

    is_index = symbol in NSE_INDEX_SYMBOLS or symbol in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
    result = fetch_nse_option_chain(symbol, is_index)
    df, expiry_dates, underlying_value = result[0], result[1], result[2]

    S = safe_float(underlying_value) or 0
    total_ce_oi = 0; total_pe_oi = 0
    max_ce_oi = 0; max_ce_strike = 0
    max_pe_oi = 0; max_pe_strike = 0
    ivs = []

    for _, row in df.iterrows():
        ce_oi = safe_float(row.get("CE_openInterest")) or 0
        pe_oi = safe_float(row.get("PE_openInterest")) or 0
        strike = int(row.get("strikePrice", 0))
        iv = safe_float(row.get("CE_impliedVolatility")) or 0

        total_ce_oi += ce_oi
        total_pe_oi += pe_oi
        if ce_oi > max_ce_oi:
            max_ce_oi = ce_oi; max_ce_strike = strike
        if pe_oi > max_pe_oi:
            max_pe_oi = pe_oi; max_pe_strike = strike
        if iv > 0:
            ivs.append(iv)

    pcr = round(float(total_pe_oi) / max(float(total_ce_oi), 1.0), 4)
    avg_iv = round(float(sum(ivs)) / len(ivs), 2) if ivs else 0.0

    return {
        "symbol": symbol,
        "spot": S,
        "pcr": pcr,
        "max_call_oi_strike": max_ce_strike,
        "max_put_oi_strike": max_pe_strike,
        "total_call_oi": total_ce_oi,
        "total_put_oi": total_pe_oi,
        "avg_iv": avg_iv,
        "near_expiry": expiry_dates[0] if expiry_dates else "N/A",
    }

def _call_groq(prompt, max_tokens=1200):
    """Call Groq LLM for analysis."""
    try:
        from groq import Groq
        from dotenv import load_dotenv
        load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.4,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"AI analysis unavailable: {str(e)}"

def _call_gemini(prompt, max_tokens=1200):
    """Call Gemini for analysis."""
    try:
        import google.generativeai as genai
        from dotenv import load_dotenv
        load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"AI analysis unavailable: {str(e)}"


@ai_analyst_bp.route("/api/ai/market-analysis")
def ai_market_analysis():
    """AI-powered market analysis for a given symbol."""
    symbol = request.args.get("symbol", "NIFTY").upper()
    llm = request.args.get("llm", "groq")  # groq or gemini

    try:
        ctx = _get_market_context(symbol)

        prompt = f"""You are a senior quantitative analyst at an institutional trading desk.
Analyze the following real-time NSE options data for {symbol} and provide a concise, actionable market analysis.

Market Data:
- Spot Price: {ctx['spot']}
- Put-Call Ratio (OI): {ctx['pcr']}
- Max Call OI Strike (Resistance): {ctx['max_call_oi_strike']} (OI: {ctx['total_call_oi']:,.0f})
- Max Put OI Strike (Support): {ctx['max_put_oi_strike']} (OI: {ctx['total_put_oi']:,.0f})
- Average IV: {ctx['avg_iv']}%
- Nearest Expiry: {ctx['near_expiry']}

Provide your analysis in this exact JSON format:
{{
    "sentiment": "Bullish/Bearish/Neutral",
    "confidence": 1-100,
    "summary": "2-3 sentence summary",
    "support": [list of key support levels],
    "resistance": [list of key resistance levels],
    "keyInsights": ["insight1", "insight2", "insight3"],
    "riskFactors": ["risk1", "risk2"],
    "suggestedStrategy": "Name of strategy",
    "strategyRationale": "Why this strategy"
}}

Be quantitative and precise. Reference specific numbers from the data."""

        if llm == "gemini":
            raw = _call_gemini(prompt)
        else:
            raw = _call_groq(prompt)

        # Parse JSON from response
        analysis = None
        try:
            # Try to extract JSON from markdown code block
            if "```json" in raw:
                json_str = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                json_str = raw.split("```")[1].split("```")[0].strip()
            else:
                json_str = raw.strip()
            analysis = json.loads(json_str)
        except Exception:
            analysis = {"rawAnalysis": raw}

        return jsonify({
            "symbol": symbol,
            "spotPrice": ctx["spot"],
            "analysis": analysis,
            "marketContext": ctx,
            "llmUsed": llm,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@ai_analyst_bp.route("/api/ai/explain-signal")
def explain_signal():
    """AI explains a specific trading signal."""
    signal_type = request.args.get("signal", "pcr")
    value = request.args.get("value", "1.2")
    symbol = request.args.get("symbol", "NIFTY")
    llm = request.args.get("llm", "groq")

    prompt = f"""You are a quant analyst. Briefly explain this trading signal for {symbol}:
Signal: {signal_type} = {value}

Provide:
1. What this signal means (1 sentence)
2. Historical context (1 sentence)
3. Actionable implication (1 sentence)

Keep it under 100 words total. Be precise and professional."""

    if llm == "gemini":
        explanation = _call_gemini(prompt, 300)
    else:
        explanation = _call_groq(prompt, 300)

    return jsonify({
        "signal": signal_type,
        "value": value,
        "symbol": symbol,
        "explanation": explanation,
    })

@ai_analyst_bp.route("/api/ai/generate-strategy", methods=["POST", "GET"])
def generate_strategy():
    """AI generates an executable Python trading strategy based on a description."""
    if request.method == "POST":
        data = request.json or {}
        prompt_text = data.get("prompt", "")
        llm = data.get("llm", "gemini")
    else:
        prompt_text = request.args.get("prompt", "")
        llm = request.args.get("llm", "gemini")

    if not prompt_text:
        return jsonify({"error": "No prompt provided"}), 400

    system_prompt = f"""You are an expert quantitative developer.
Create a Python algorithmic trading strategy based on this request: "{prompt_text}"

The strategy function MUST be named `custom_strategy` and take a single pandas DataFrame `df` as input.
The DataFrame `df` contains historical data with standard columns (e.g., 'Open', 'High', 'Low', 'Close', 'Volume').
You must return a Python dictionary with:
1. 'signals': A pandas Series of the same length as `df`, containing 1 (Buy), -1 (Sell), or 0 (Hold).
2. 'name': A string with a short name for the strategy.

Return ONLY the Python code block. Do not include explanations.

Example output format:
```python
import pandas as pd
import numpy as np

def custom_strategy(df):
    # Strategy logic here
    df['SMA_20'] = df['Close'].rolling(window=20).mean()
    df['SMA_50'] = df['Close'].rolling(window=50).mean()
    
    signals = pd.Series(0, index=df.index)
    signals[df['SMA_20'] > df['SMA_50']] = 1
    signals[df['SMA_20'] < df['SMA_50']] = -1
    
    return {{
        'signals': signals,
        'name': 'SMA Crossover'
    }}
```
"""

    if llm == "gemini":
        raw = _call_gemini(system_prompt, 2000)
    else:
        raw = _call_groq(system_prompt, 2000)

    # Clean the output to just get the Python code
    code = raw
    if "```python" in code:
        code = code.split("```python")[1].split("```")[0].strip()
    elif "```" in code:
        code = code.split("```")[1].split("```")[0].strip()

    return jsonify({
        "prompt": prompt_text,
        "code": code,
        "llmUsed": llm
    })
