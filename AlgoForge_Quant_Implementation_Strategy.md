# AlgoForge: Quantitative Implementation Strategy

This document details the quantitative methods, financial mathematics, and algorithmic strategies implemented within the AlgoForge platform.

## 1. Options Pricing and Greeks Calculation

To provide a professional-grade Live Options Chain interface, AlgoForge computes theoretical values and risk metrics iteratively.
*   **Implied Volatility (IV):** The system calculates IV based on the Last Traded Price (LTP) of the NSE options, providing insights into market expectations of future volatility.
*   **The Greeks Computation:**
    *   **Delta:** Calculates the rate of change of the option price with respect to the underlying index's price movements.
    *   **Gamma:** Measures the rate of change of Delta (convexity of value).
    *   **Theta:** Computes the daily time decay of the option's premium.
    *   **Vega:** Assesses the option's sensitivity to a 1% change in implied volatility.

## 2. Backtesting Metrics & Performance Evaluation

The Backtesting Lab simulates trading strategies on historical OHLCV data using `pandas` and `NumPy`, evaluating performance through institutional-grade statistical metrics:
*   **Returns Analysis:**
    *   **Total Return:** Absolute percentage gain or loss over the simulation period.
    *   **Compound Annual Growth Rate (CAGR):** Measures the smoothed annualized return of the strategy, standardizing returns for multi-year backtests.
*   **Risk-Adjusted Ratios:**
    *   **Sharpe Ratio:** Evaluates the risk-adjusted return by dividing the strategy's excess return (over the risk-free rate) by the standard deviation of its returns.
    *   **Sortino Ratio:** A variation of the Sharpe ratio that only penalizes downside volatility, providing a better gauge for asymmetric return distributions.
    *   **Calmar Ratio:** Uses Maximum Drawdown as the risk measure instead of standard deviation (CAGR / Maximum Drawdown).
*   **Efficiency & Drawdown Metrics:**
    *   **Maximum Drawdown (MDD):** Calculates the largest peak-to-trough drop in the simulated portfolio's equity curve.
    *   **Hit Ratio (Win Rate):** Analyzes the percentage of total trades that closed profitably.
    *   **Profit Factor:** The ratio of gross profits to gross losses, determining the platform's expectancy.

## 3. Technical Indicator Computation

The Rule-Based Logic Builder allows users to construct strategies based on quantitative indicators. The Python backend processes these time-series transformations:
*   **Momentum Indicators:** Relative Strength Index (RSI), Moving Average Convergence Divergence (MACD).
*   **Trend Indicators:** Simple Moving Average (SMA) Crossovers, Exponential Moving Average (EMA).
*   **Volatility Indicators:** Average True Range (ATR) mapping and standard deviation breakouts.

## 4. Artificial Intelligence in Quant Strategies

AlgoForge utilizes LLaMA 3.3 for advanced parameter optimization and generative strategy creation:
*   **NLP to Quantitative Translation:** The system acts as a translator, breaking down qualitative user ideas ("buy when market is oversold") into strict quantitative threshold data (`RSI < 30` or `Price < Lower Bollinger Band`).
*   **Dynamic Rule Structuring:** Rather than hardcoding indicators, the AI constructs a serialized logical tree (JSON payload) connecting various indicators with `AND/OR` operations, mimicking a quantitative developer's code structure natively in the backend execution engine.
