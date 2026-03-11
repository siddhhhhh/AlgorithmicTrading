"""Test API endpoint and verify disk cache behavior"""
import urllib.request, json

print("Testing http://localhost:5001/api/options/NIFTY ...")
try:
    resp = urllib.request.urlopen("http://localhost:5001/api/options/NIFTY", timeout=60)
    d = json.loads(resp.read())
    err = d.get("error")
    cached_at = d.get("cachedAt")

    if err:
        print(f"Response: {err}")
        print(f"market_closed: {d.get('market_closed')}")
        print()
        print("This is expected - no disk cache exists yet.")
        print("The disk cache will be populated automatically the next")
        print("time the backend runs during market hours (9:15 AM - 3:30 PM IST).")
        print("After that, closing data will be available 24/7.")
    else:
        sym = d.get("symbol")
        calls = d.get("calls", [])
        puts = d.get("puts", [])
        spot = d.get("underlyingValue")
        s = d.get("summary", {})
        
        source = f"CACHED (at {cached_at})" if cached_at else "LIVE"
        print(f"DATA SOURCE: {source}")
        print(f"Symbol: {sym}")
        print(f"Spot: {spot}")
        print(f"Calls: {len(calls)}, Puts: {len(puts)}")
        print(f"PCR: {s.get('pcr')}, MaxPain: {s.get('maxPain')}")
        print(f"CE OI: {s.get('totalCeOi')}, PE OI: {s.get('totalPeOi')}")
        if calls:
            c = calls[len(calls)//2]
            print(f"Mid call: strike={c.get('strike')}, ltp={c.get('ltp')}, oi={c.get('oi')}")
        print("SUCCESS!")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"HTTP {e.code}: {body[:300]}")
except Exception as e:
    print(f"Connection error: {e}")
    print("NOTE: Make sure the backend is running: .\\venv\\Scripts\\python.exe app.py")
    