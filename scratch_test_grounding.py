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

if api_key:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={api_key}"
    
    # Payload requesting Google Search grounding
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": "베트남 노바랜드(Novaland)의 최근 부채 상황과 유동성 리스크에 대해 2문장으로 사실에 기반하여 한국어로 요약해줘."}
                ]
            }
        ],
        "tools": [
            {
                "googleSearch": {}
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
        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            print("Success calling Gemini with Google Search Grounding!")
            candidate = res_data['candidates'][0]
            print("AI Response:", candidate['content']['parts'][0]['text'])
            # Check if grounding metadata is present
            if 'groundingMetadata' in candidate:
                print("Grounding metadata found (Google Search sources used!)")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} {e.reason}")
        try:
            print("Error body:", e.read().decode('utf-8'))
        except Exception:
            pass
    except Exception as e:
        print(f"Error: {e}")
