import os
import sys
import json
import time
import random
import requests
import firebase_admin
from firebase_admin import credentials, firestore
from concurrent.futures import ThreadPoolExecutor, as_completed

# Initialize Firebase
service_account_info = None

# In GitHub Actions, read credentials from env var
firebase_secret = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
if firebase_secret:
    try:
        service_account_info = json.loads(firebase_secret)
    except Exception as e:
        print(f"Error parsing FIREBASE_SERVICE_ACCOUNT env var: {e}")
        sys.exit(1)

if not service_account_info:
    # Try reading from local file
    local_key_path = os.path.join(os.path.dirname(__file__), "service-account.json")
    if os.path.exists(local_key_path):
        try:
            with open(local_key_path) as f:
                service_account_info = json.load(f)
        except Exception as e:
            print(f"Error reading local service-account.json: {e}")
            sys.exit(1)

if not service_account_info:
    print("Error: No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT env var or scripts/service-account.json file.")
    sys.exit(1)

cred = credentials.Certificate(service_account_info)
firebase_admin.initialize_app(cred)
db = firestore.client()

def fetch_kr_stock_naver(ticker):
    """
    Fetches real-time price and EPS for Korean stocks from Naver Finance Polling API.
    """
    url = f"https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:{ticker}"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            areas = data.get("result", {}).get("areas", [])
            if areas:
                datas = areas[0].get("datas", [])
                if datas:
                    item = datas[0]
                    price = item.get("nv")
                    eps = item.get("eps")
                    return float(price) if price else None, float(eps) if eps else None
    except Exception as e:
        print(f"Naver fetch failed for KR {ticker}: {e}")
    return None, None

def fetch_yfinance_data(yahoo_ticker):
    """
    Fetches price and EPS from Yahoo Finance using yfinance library.
    """
    try:
        import yfinance as yf
        ticker_obj = yf.Ticker(yahoo_ticker)
        info = ticker_obj.info
        price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("navPrice")
        eps = info.get("trailingEps") or info.get("forwardEps")
        return float(price) if price else None, float(eps) if eps else None
    except Exception as e:
        print(f"yfinance fetch failed for {yahoo_ticker}: {e}")
    return None, None

def process_single_stock(doc):
    """
    Worker function to fetch data for one stock document snapshot.
    """
    stock_id = doc.id
    stock_data = doc.to_dict()
    country = stock_data.get("country")
    ticker = stock_data.get("ticker")
    naver_ticker = stock_data.get("naverTicker")
    
    # Tiny random stagger to stagger parallel queries nicely
    time.sleep(random.uniform(0.0, 0.2))
    
    price, eps = None, None
    try:
        if country == "KR":
            # Try Naver first for Korea
            price, eps = fetch_kr_stock_naver(naver_ticker)
            if not price:
                # Fallback to yfinance
                yahoo_ticker = f"{ticker}.KS"
                price, eps = fetch_yfinance_data(yahoo_ticker)
        elif country == "US":
            # Map Apple.O to AAPL for yfinance
            yahoo_ticker = naver_ticker.split('.')[0] if '.' in naver_ticker else naver_ticker
            price, eps = fetch_yfinance_data(yahoo_ticker)
        elif country == "VN":
            # Map VNM.HM to VNM.VN for yfinance
            yahoo_ticker = f"{ticker}.VN"
            price, eps = fetch_yfinance_data(yahoo_ticker)
        elif country == "CN":
            # Use naver_ticker directly since it contains the correct .SS or .SZ suffix for yfinance
            yahoo_ticker = naver_ticker
            price, eps = fetch_yfinance_data(yahoo_ticker)
    except Exception as e:
        print(f"Error processing {stock_id}: {e}")
        
    if price:
        update_data = {
            "currentPrice": price,
            "lastUpdated": firestore.SERVER_TIMESTAMP
        }
        if eps is not None:
            update_data["eps"] = eps
        return stock_id, update_data
        
    return stock_id, None

def main():
    print("Starting sync_prices.py...")
    stocks_ref = db.collection("stocks")
    docs = stocks_ref.get()
    
    successful_updates = []
    
    # Moderate worker pool size to get good throughput without hitting rate limits
    max_workers = 8
    print(f"Running price sync with {max_workers} worker threads for {len(docs)} stocks...")
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_stock = {executor.submit(process_single_stock, doc): doc.id for doc in docs}
        
        for future in as_completed(future_to_stock):
            stock_id = future_to_stock[future]
            try:
                res_id, update_data = future.result()
                if update_data:
                    successful_updates.append((res_id, update_data))
                    print(f"--> Done: {res_id} (Price: {update_data['currentPrice']})")
                else:
                    print(f"--> Failed: {res_id}")
            except Exception as exc:
                print(f"--> {stock_id} generated an exception: {exc}")
                
    # Batch write back to Firestore in chunks of 500 documents
    if successful_updates:
        print(f"\nCommitting {len(successful_updates)} updates to Firestore in batches of 500...")
        batch = db.batch()
        count = 0
        batch_count = 1
        
        for stock_id, update_data in successful_updates:
            doc_ref = stocks_ref.document(stock_id)
            batch.update(doc_ref, update_data)
            count += 1
            if count == 500:
                print(f"Committing batch #{batch_count}...")
                batch.commit()
                batch = db.batch()
                count = 0
                batch_count += 1
                
        if count > 0:
            print(f"Committing final batch #{batch_count}...")
            batch.commit()
            
    print("\nSync completed successfully!")

if __name__ == "__main__":
    main()
