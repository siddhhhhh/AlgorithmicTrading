"""
MODULE 9 — STRATEGY ANALYTICS ENGINE
Payoff charts for common multi-leg option strategies.
"""
from flask import Blueprint, jsonify, request
import numpy as np

strategy_bp = Blueprint("strategy_engine", __name__)

STRATEGY_TEMPLATES = {
    "bull_call_spread": {
        "name": "Bull Call Spread",
        "legs": [
            {"type": "call", "action": "buy", "strike_offset": 0},
            {"type": "call", "action": "sell", "strike_offset": 1},
        ],
        "market_view": "Moderately Bullish",
        "max_profit": "Limited",
        "max_loss": "Limited",
    },
    "bear_put_spread": {
        "name": "Bear Put Spread",
        "legs": [
            {"type": "put", "action": "buy", "strike_offset": 0},
            {"type": "put", "action": "sell", "strike_offset": -1},
        ],
        "market_view": "Moderately Bearish",
        "max_profit": "Limited",
        "max_loss": "Limited",
    },
    "long_straddle": {
        "name": "Long Straddle",
        "legs": [
            {"type": "call", "action": "buy", "strike_offset": 0},
            {"type": "put", "action": "buy", "strike_offset": 0},
        ],
        "market_view": "Volatile / Directional",
        "max_profit": "Unlimited",
        "max_loss": "Limited (premium paid)",
    },
    "short_straddle": {
        "name": "Short Straddle",
        "legs": [
            {"type": "call", "action": "sell", "strike_offset": 0},
            {"type": "put", "action": "sell", "strike_offset": 0},
        ],
        "market_view": "Range Bound",
        "max_profit": "Limited (premium received)",
        "max_loss": "Unlimited",
    },
    "long_strangle": {
        "name": "Long Strangle",
        "legs": [
            {"type": "call", "action": "buy", "strike_offset": 1},
            {"type": "put", "action": "buy", "strike_offset": -1},
        ],
        "market_view": "Highly Volatile",
        "max_profit": "Unlimited",
        "max_loss": "Limited (premium paid)",
    },
    "iron_condor": {
        "name": "Iron Condor",
        "legs": [
            {"type": "put", "action": "buy", "strike_offset": -2},
            {"type": "put", "action": "sell", "strike_offset": -1},
            {"type": "call", "action": "sell", "strike_offset": 1},
            {"type": "call", "action": "buy", "strike_offset": 2},
        ],
        "market_view": "Range Bound / Low Volatility",
        "max_profit": "Limited (net credit)",
        "max_loss": "Limited",
    },
    "iron_butterfly": {
        "name": "Iron Butterfly",
        "legs": [
            {"type": "put", "action": "buy", "strike_offset": -1},
            {"type": "put", "action": "sell", "strike_offset": 0},
            {"type": "call", "action": "sell", "strike_offset": 0},
            {"type": "call", "action": "buy", "strike_offset": 1},
        ],
        "market_view": "Range Bound / Low Volatility",
        "max_profit": "Limited (net credit)",
        "max_loss": "Limited",
    },
    "covered_call": {
        "name": "Covered Call",
        "legs": [
            {"type": "stock", "action": "buy", "strike_offset": 0},
            {"type": "call", "action": "sell", "strike_offset": 1},
        ],
        "market_view": "Mildly Bullish",
        "max_profit": "Limited",
        "max_loss": "Large (stock drops)",
    },
    "protective_put": {
        "name": "Protective Put",
        "legs": [
            {"type": "stock", "action": "buy", "strike_offset": 0},
            {"type": "put", "action": "buy", "strike_offset": -1},
        ],
        "market_view": "Bullish with Protection",
        "max_profit": "Unlimited",
        "max_loss": "Limited",
    },
    "ratio_call_spread": {
        "name": "Ratio Call Spread",
        "legs": [
            {"type": "call", "action": "buy", "strike_offset": 0, "qty": 1},
            {"type": "call", "action": "sell", "strike_offset": 1, "qty": 2},
        ],
        "market_view": "Moderately Bullish",
        "max_profit": "Limited",
        "max_loss": "Unlimited (above upper strike)",
    },
}

def compute_payoff(legs, price_range, lot_size=1):
    """Compute payoff at expiry for given price range."""
    payoffs = []
    for price in price_range:
        total = 0
        for leg in legs:
            strike = leg.get("strike", 0)
            premium = leg.get("premium", 0)
            qty = leg.get("qty", 1) * lot_size
            action_mult = 1 if leg["action"] == "buy" else -1

            if leg["type"] == "call":
                intrinsic = max(price - strike, 0)
                total += action_mult * (intrinsic - premium) * qty
            elif leg["type"] == "put":
                intrinsic = max(strike - price, 0)
                total += action_mult * (intrinsic - premium) * qty
            elif leg["type"] == "stock":
                total += action_mult * (price - strike) * qty

        payoffs.append(round(total, 2))
    return payoffs

def find_breakevens(price_range, payoffs):
    """Find where payoff crosses zero."""
    breakevens = []
    for i in range(1, len(payoffs)):
        if payoffs[i - 1] * payoffs[i] < 0:
            # Linear interpolation
            p1, p2 = price_range[i - 1], price_range[i]
            v1, v2 = payoffs[i - 1], payoffs[i]
            be = p1 + (0 - v1) * (p2 - p1) / (v2 - v1)
            breakevens.append(round(be, 2))
    return breakevens


@strategy_bp.route("/api/options/strategies")
def list_strategies():
    """List all available strategy templates."""
    templates = []
    for key, tpl in STRATEGY_TEMPLATES.items():
        templates.append({
            "id": key,
            "name": tpl["name"],
            "legs": len(tpl["legs"]),
            "marketView": tpl["market_view"],
            "maxProfit": tpl["max_profit"],
            "maxLoss": tpl["max_loss"],
        })
    return jsonify({"strategies": templates})


@strategy_bp.route("/api/options/strategy/payoff")
def strategy_payoff():
    """Compute payoff chart for a strategy."""
    strategy_id = request.args.get("strategy", "bull_call_spread")
    spot = float(request.args.get("spot", 22000))
    strike_step = float(request.args.get("step", 100))
    lot_size = int(request.args.get("lot", 25))

    template = STRATEGY_TEMPLATES.get(strategy_id)
    if not template:
        return jsonify({"error": f"Unknown strategy: {strategy_id}"}), 400

    # Build legs with actual strikes and dummy premiums
    legs = []
    for leg_tpl in template["legs"]:
        strike = spot + leg_tpl["strike_offset"] * strike_step
        # Estimate premium based on distance from spot
        dist = abs(strike - spot)
        if leg_tpl["type"] == "call":
            premium = max(spot * 0.02 - dist * 0.3, spot * 0.002)
        elif leg_tpl["type"] == "put":
            premium = max(spot * 0.02 - dist * 0.3, spot * 0.002)
        else:
            premium = spot  # stock

        legs.append({
            "type": leg_tpl["type"],
            "action": leg_tpl["action"],
            "strike": strike,
            "premium": round(premium, 2),
            "qty": leg_tpl.get("qty", 1),
        })

    # Price range: spot ± 10%
    low = spot * 0.9
    high = spot * 1.1
    price_range = list(np.linspace(low, high, 200))
    payoffs = compute_payoff(legs, price_range, lot_size)
    breakevens = find_breakevens(price_range, payoffs)

    return jsonify({
        "strategy": strategy_id,
        "name": template["name"],
        "spot": spot,
        "legs": legs,
        "lotSize": lot_size,
        "priceRange": [round(p, 2) for p in price_range],
        "payoffs": payoffs,
        "breakevens": breakevens,
        "maxProfit": round(max(payoffs), 2),
        "maxLoss": round(min(payoffs), 2),
        "marketView": template["market_view"],
    })


@strategy_bp.route("/api/options/strategy/custom", methods=["POST"])
def custom_strategy():
    """Compute payoff for a custom multi-leg strategy."""
    data = request.get_json()
    if not data or "legs" not in data:
        return jsonify({"error": "Provide legs array"}), 400

    spot = float(data.get("spot", 22000))
    lot_size = int(data.get("lotSize", 25))
    legs = data["legs"]

    low = spot * 0.9
    high = spot * 1.1
    price_range = list(np.linspace(low, high, 200))
    payoffs = compute_payoff(legs, price_range, lot_size)
    breakevens = find_breakevens(price_range, payoffs)

    net_premium = sum(
        (-1 if l["action"] == "buy" else 1) * l.get("premium", 0) * l.get("qty", 1) * lot_size
        for l in legs if l["type"] != "stock"
    )

    return jsonify({
        "strategy": "custom",
        "spot": spot,
        "legs": legs,
        "lotSize": lot_size,
        "priceRange": [round(p, 2) for p in price_range],
        "payoffs": payoffs,
        "breakevens": breakevens,
        "maxProfit": round(max(payoffs), 2),
        "maxLoss": round(min(payoffs), 2),
        "netPremium": round(net_premium, 2),
    })
