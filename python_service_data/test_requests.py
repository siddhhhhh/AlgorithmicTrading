import requests
print("Requests imported", flush=True)
try:
    resp = requests.get("https://query2.finance.yahoo.com", timeout=5)
    print("Request finished", flush=True)
except Exception as e:
    print("Error:", e, flush=True)
