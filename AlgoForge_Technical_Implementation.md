# AlgoForge: Technical Implementation Guide

This document outlines the technical architecture and implementation details of the AlgoForge algorithmic trading platform.

## 1. System Architecture

AlgoForge is built on a modern, decoupled client-server architecture, separating the presentation layer from the intensive computational engine.

### Frontend (Client-Side)
*   **Framework:** React 18 with TypeScript for type safety and scalability.
*   **Build Tool:** Vite 5 for rapid development and optimized production bundling.
*   **Styling & UI:** Tailwind CSS combined with Aceternity UI components for a responsive, modern interface.
*   **Routing:** React Router v6 for client-side navigation.
*   **State Management:** React Context API manages complex global states, including the real-time polling data for market indices and user authentication.

### Backend (Server-Side Engine)
*   **Framework:** Python 3.10+ using Flask as the REST API framework.
*   **Data Processing:** NumPy and pandas are utilized for heavy numerical lifting, such as calculating moving averages, technical indicators, and backtesting metrics.
*   **Database:** SQLite serves as a lightweight, secure mock-database handling user profiles, saved strategies, and virtual portfolio states.

## 2. Core Modules Implementation

### Market Data Ingestion Pipeline
*   **Live Indices & Stocks:** A polling mechanism fetches live market data from Yahoo Finance at 30-second intervals to display benchmarks (SENSEX, NIFTY 50, BANK NIFTY) and the top 50 constituent stocks.
*   **Options Chain Scraping:** Python backend scripts scrape the live NSE (National Stock Exchange) website to retrieve raw options chain data for NIFTY, BANKNIFTY, and FINNIFTY. This data is cleaned, parsed, and served as structured JSON.

### AI Generative Strategy Engine
*   **LLM Integration:** Integrates the Groq API utilizing the high-speed **LLaMA 3.3 70B** model.
*   **Execution Workflow:** The user inputs a natural language prompt (e.g., "Build an RSI mean reversion strategy"). The Flask backend formats and sends the prompt to the Groq endpoint with a strict system prompt. The model returns an executable JSON strategy payload, which seamlessly translates into the Rule-Based Logic Builder on the frontend.

### Historical Simulation (Backtesting) Simulator
*   **Data Sourcing:** Historical daily OHLCV (Open, High, Low, Close, Volume) equity data is dynamically requested via the Yahoo Finance API (using the `yfinance` Python library).
*   **Simulation Engine:** The Python backend processes the historical time-series data chronologically, executing user-defined entry and exit rules. It accounts for initial capital, brokerage delays, and symbol-specific parameters to recreate a reliable paper-trading environment.

## 3. Communication Protocol & Deployment
*   **RESTful APIs:** The React frontend communicates with the Flask backend via standard HTTP REST APIs. Responses are strictly formatted in JSON to ensure seamless parsing for UI updates, chart rendering (SVG charts), and backtest result tables.
*   **Extensibility:** The decoupled nature allows for easy future containerization (via Docker) and scalability for production deployment.
