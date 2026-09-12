import os
import json
import urllib.request
import urllib.error

# Load project root .env file
dotenv_path = "/Users/kwankilkim/Projects/stocktemp/.env"
if os.path.exists(dotenv_path):
    with open(dotenv_path) as f:
        for line in f:
            if line.strip() and not line.startswith("#") and "=" in line:
                key, val = line.strip().split("=", 1)
                os.environ[key.strip()] = val.strip()

api_key = os.environ.get("GEMINI_API_KEY")
print(f"Loaded GEMINI_API_KEY: {api_key[:10]}... (length {len(api_key)})" if api_key else "No GEMINI_API_KEY found")

models_to_test = [
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite"
]

if api_key:
    for model in models_to_test:
        print(f"\nTesting model: {model}...")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": "Hello, write a short greeting."}
                    ]
                }
            ]
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                print(f"Success for {model}!")
                print(response.read().decode('utf-8'))
                break
        except urllib.error.HTTPError as e:
            print(f"HTTP Error for {model}: {e.code} {e.reason}")
            try:
                print("Error body:", e.read().decode('utf-8'))
            except Exception:
                pass
        except Exception as e:
            print(f"Generic error for {model}: {e}")
