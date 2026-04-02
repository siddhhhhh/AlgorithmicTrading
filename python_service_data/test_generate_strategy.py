import requests
import json
import traceback

def test_api():
    try:
        url = "http://localhost:5001/api/ai/generate-strategy"
        payload = {
            "prompt": "Create a moving average crossover strategy using 20 and 50 period SMA.",
            "llm": "gemini" 
        }
        print("Sending request to:", url)
        # Assuming the flask app runs on localhost:5000
        res = requests.post(url, json=payload, timeout=30)
        print("Status code:", res.status_code)
        
        if res.status_code == 200:
            data = res.json()
            print("Prompt:", data.get("prompt"))
            print("LLM Used:", data.get("llmUsed"))
            print("=== GENERATED CODE ===")
            print(data.get("code"))
            print("======================")
        else:
            print("Error response:", res.text)
            
    except Exception as e:
        print("Exception occurred:")
        traceback.print_exc()

if __name__ == "__main__":
    test_api()
