import os
import sys
import json
import time
import random
import firebase_admin
from firebase_admin import credentials, firestore

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

def get_fallback_shares(ticker, country):
    if country == 'US':
        if ticker in ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMZN', 'META']:
            return 6_000_000_000
        return 1_500_000_000
    if country == 'KR':
        if ticker == '005930': return 5_970_000_000
        if ticker == '000660': return 728_000_000
        if ticker == '005380': return 213_000_000
        if ticker == '000270': return 400_000_000
        if ticker == '035420': return 160_000_000
        if ticker == '035720': return 440_000_000
        if ticker == '068270': return 217_000_000
        if ticker == '105560': return 400_000_000
        if ticker == '055550': return 510_000_000
        return 20_000_000
    if country == 'VN':
        return 1_500_000_000
    if country == 'CN':
        return 4_000_000_000
    return 100_000_000

def get_yahoo_ticker(ticker, country, naver_ticker):
    naver_ticker = naver_ticker or ''
    if country == "KR":
        return f"{ticker}.KS"
    elif country == "US":
        return naver_ticker.split('.')[0] if '.' in naver_ticker else (naver_ticker or ticker)
    elif country == "VN":
        return f"{ticker}.VN"
    elif country == "CN":
        return naver_ticker or ticker
    return ticker

def fetch_quarterly_financials(yahoo_ticker, ticker, country):
    """
    Fetches actual quarterly financial statements from Yahoo Finance
    and parses them into quarters: ['25.Q3', '25.Q4', '26.Q1', '26.Q2'] etc.
    """
    try:
        import yfinance as yf
        stock_obj = yf.Ticker(yahoo_ticker)
        
        income = stock_obj.quarterly_income_stmt
        balance = stock_obj.quarterly_balance_sheet
        info = stock_obj.info

        if income.empty or balance.empty:
            print(f"Empty dataframes returned for {yahoo_ticker}")
            return None

        # Identify columns
        cols = income.columns[:4]
        if len(cols) == 0:
            return None

        # Fetch shares outstanding or estimate fallback
        shares = info.get("sharesOutstanding") or get_fallback_shares(ticker, country)

        quarterly_list = []
        
        # We want to map columns to quarter labels (e.g. 24.Q4)
        for col in cols:
            date_val = col
            # Formulate label like '24.Q4'
            year = str(date_val.year)[2:]
            month = date_val.month
            if month in [1, 2, 3]:
                q_label = f"{year}.Q1"
            elif month in [4, 5, 6]:
                q_label = f"{year}.Q2"
            elif month in [7, 8, 9]:
                q_label = f"{year}.Q3"
            else:
                q_label = f"{year}.Q4"

            # Parse revenue
            rev_val = None
            for rev_key in ['Total Revenue', 'Operating Revenue']:
                if rev_key in income.index:
                    rev_val = income.loc[rev_key][col]
                    break
            if rev_val is None or str(rev_val) == 'nan':
                continue
                
            # Parse net income
            ni_val = None
            for ni_key in ['Net Income', 'Net Income Common Stockholders']:
                if ni_key in income.index:
                    ni_val = income.loc[ni_key][col]
                    break
            if ni_val is None or str(ni_val) == 'nan':
                ni_val = 0

            # Parse equity
            eq_val = None
            for eq_key in ['Stockholders Equity', 'Total Equity Gross Minority Interest', 'Total Stockholder Equity']:
                if eq_key in balance.index:
                    eq_val = balance.loc[eq_key][col]
                    break
            if eq_val is None or str(eq_val) == 'nan':
                eq_val = 0

            # Compute EPS & BPS
            eps = round(float(ni_val) / shares, 2)
            bps = round(float(eq_val) / shares, 2)

            quarterly_list.append({
                "quarter": q_label,
                "revenue": float(rev_val),
                "eps": eps,
                "bps": bps
            })

        # Return list sorted chronologically (e.g. Q3, Q4, Q1, Q2)
        quarterly_list.reverse()
        return quarterly_list

    except Exception as e:
        print(f"yfinance quarterly fetch failed for {yahoo_ticker}: {e}")
        return None

def main():
    print("Starting sync_financials_free.py...")
    stocks_ref = db.collection("stocks")
    docs = stocks_ref.get()
    
    print(f"Found {len(docs)} stocks. Commencing quarterly data sync...")
    
    for doc in docs:
        stock_id = doc.id
        stock_data = doc.to_dict()
        country = stock_data.get("country")
        ticker = stock_data.get("ticker")
        naver_ticker = stock_data.get("naverTicker")
        
        # Stagger requests slightly
        time.sleep(random.uniform(0.5, 1.5))
        
        yahoo_ticker = get_yahoo_ticker(ticker, country, naver_ticker)
        print(f"Syncing {stock_id} using Yahoo ticker: {yahoo_ticker}...")
        
        q_data = fetch_quarterly_financials(yahoo_ticker, ticker, country)
        if q_data:
            stocks_ref.document(stock_id).update({
                "quarterlyData": q_data
            })
            print(f"--> Success: {stock_id} updated with {len(q_data)} quarters.")
        else:
            print(f"--> Skipped/Failed: {stock_id}")

    print("\nSync completed successfully!")

if __name__ == "__main__":
    main()
