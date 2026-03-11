import app
with app.app.test_request_context():
    resp = app.get_market_data()
    print("STATUS:", resp.status_code)
    import json
    try:
        data = json.loads(resp.get_data(as_text=True))
        if "error" in data:
            print("ERROR IN RESPONSE:", data["error"])
        else:
            print("SUCCESS")
    except Exception as e:
        print("COULD NOT PARSE RESPONSE:", e)
