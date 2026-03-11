import sys
import yfinance as yf
print("YF imported", flush=True)

try:
    t = yf.Ticker("RELIANCE.NS")
    print("Ticker created", flush=True)
    info = t.info
    print("Info fetched", flush=True)
except Exception as e:
    print("Error:", e, flush=True)
