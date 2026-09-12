import os
import sys
import json
import time
import requests
import pandas as pd
from bs4 import BeautifulSoup
import yfinance as yf
import firebase_admin
from firebase_admin import credentials, firestore
from concurrent.futures import ThreadPoolExecutor, as_completed

# Setup path for service account
scripts_dir = os.path.dirname(os.path.abspath(__file__))
local_key_path = os.path.join(scripts_dir, "service-account.json")

if not os.path.exists(local_key_path):
    print("Error: service-account.json not found")
    sys.exit(1)

with open(local_key_path) as f:
    service_account_info = json.load(f)

# Initialize Firebase if not already initialized
if not firebase_admin._apps:
    cred = credentials.Certificate(service_account_info)
    firebase_admin.initialize_app(cred)
db = firestore.client()

print("Connected to Firestore successfully.")

# 1. Fetch existing stock IDs to avoid duplicates
existing_ids = set()
stocks_ref = db.collection("stocks")
docs = stocks_ref.select([]).stream()  # Only fetch document IDs
for doc in docs:
    existing_ids.add(doc.id)

print(f"Loaded {len(existing_ids)} existing stock IDs from Firestore.")

# 2. Scrape S&P 500 (US)
print("Scraping S&P 500 tickers from Wikipedia...")
us_stocks = []
try:
    r = requests.get('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies', headers={'User-Agent': 'Mozilla/5.0'})
    tables = pd.read_html(r.text)
    df = tables[0]
    for idx, row in df.iterrows():
        symbol = str(row['Symbol']).replace('.', '-')
        name = str(row['Security'])
        industry = str(row['GICS Sector'])
        us_stocks.append({
            "ticker": symbol,
            "name": name,
            "country": "US",
            "industry": industry,
            "currency": "$"
        })
    print(f"Found {len(us_stocks)} US stocks from S&P 500.")
except Exception as e:
    print(f"Error scraping S&P 500: {e}")

# 3. Scrape KR stocks (KOSPI & KOSDAQ) from Naver Finance
print("Scraping KOSPI/KOSDAQ from Naver Finance...")
kr_stocks = []
headers = {'User-Agent': 'Mozilla/5.0'}

# Scrape KOSPI (sosok=0) - top 150 (3 pages, 50 per page)
for page in range(1, 4):
    url = f"https://finance.naver.com/sise/sise_market_sum.naver?sosok=0&page={page}"
    try:
        r = requests.get(url, headers=headers)
        soup = BeautifulSoup(r.content, 'html.parser')
        for a in soup.select('a.tltle'):
            href = a.get('href')
            code = href.split('code=')[-1]
            name = a.text.strip()
            if code and name:
                kr_stocks.append({
                    "ticker": code,
                    "name": name,
                    "koreanName": name,
                    "country": "KR",
                    "industry": "General", # We will look this up or default
                    "currency": "₩"
                })
    except Exception as e:
        print(f"Error scraping KOSPI page {page}: {e}")

# Scrape KOSDAQ (sosok=1) - top 100 (2 pages)
for page in range(1, 3):
    url = f"https://finance.naver.com/sise/sise_market_sum.naver?sosok=1&page={page}"
    try:
        r = requests.get(url, headers=headers)
        soup = BeautifulSoup(r.content, 'html.parser')
        for a in soup.select('a.tltle'):
            href = a.get('href')
            code = href.split('code=')[-1]
            name = a.text.strip()
            if code and name:
                kr_stocks.append({
                    "ticker": code,
                    "name": name,
                    "koreanName": name,
                    "country": "KR",
                    "industry": "General",
                    "currency": "₩"
                })
    except Exception as e:
        print(f"Error scraping KOSDAQ page {page}: {e}")

print(f"Found {len(kr_stocks)} KR stocks from Naver Finance.")

# 4. VN Tickers list
vn_tickers_list = [
    "VCB", "BID", "CTG", "TCB", "MBB", "VPB", "ACB", "HDB", "STB", "VIB", "TPB", "LPB", "SHB", "MSB", "OCB", "SSB", "EIB",
    "VIC", "VHM", "VRE", "NVL", "KDH", "NLG", "PDR", "DIG", "DXG", "KBC", "VGC", "SJS", "IDC", "SZC", "ITA", "TCH", "CRE",
    "VNM", "MSN", "SAB", "MWG", "PNJ", "FRT", "DGW", "KDC", "SBT", "VHC", "ANV", "FMC", "TLG", "HAX",
    "FPT", "FOX", "CTR", "ELC",
    "HPG", "HSG", "NKG", "GVR", "DGC", "DCM", "DPM", "PHR", "DPR", "BMP", "NTP", "HT1", "BCC",
    "GAS", "PLX", "BSR", "POW", "PVD", "PVS", "PVT", "NT2", "REE", "GEG", "HDG", "PC1", "VSH", "TV2",
    "SSI", "VND", "VCI", "HCM", "FTS", "MBS", "SHS", "CTS", "AGR", "BSI", "BVH", "PVI",
    "VJC", "HVN", "GMD", "ACV", "HHV", "VTO", "VIP", "HAH", "DXP", "CII", "LCG", "FCN",
    "DHG", "IMP", "TRA", "DBD", "VCF", "RAL", "DHC"
]
vn_stocks = [{
    "ticker": t,
    "name": t,
    "country": "VN",
    "industry": "General",
    "currency": "₫"
} for t in vn_tickers_list]

# 5. CN Tickers list
cn_adrs = [
    "BABA", "PDD", "JD", "BIDU", "NTES", "TCEHY", "LI", "NIO", "XPEV", "BYDDF", "YUMC", "KE", "ZTO", "TME", "TAL", "EDU", "VIPS", "IQ", "GDS", "HITH", "BZ"
]
cn_ashares = [
    "600519", "601398", "601857", "601288", "601988", "601628", "600036", "600900", "601088", "601318", "601658", "601166", "600028", "601818", "601328",
    "600030", "601006", "601668", "601899", "600309", "601939", "600019", "600887", "600690", "601888", "603259", "600585", "601601", "600000", "601998",
    "000858", "002594", "300750", "000333", "000001", "000651", "002415", "000792", "300059", "002475", "300124", "002241", "000568", "000063", "002714",
    "002142", "002027", "300498", "000423", "300274", "002352", "000895", "000725", "300015", "002460", "300033", "002230", "000100", "002466", "000776"
]
cn_stocks = []
for t in cn_adrs:
    cn_stocks.append({"ticker": t, "name": t, "country": "CN", "industry": "General", "currency": "¥"})
for t in cn_ashares:
    cn_stocks.append({"ticker": t, "name": t, "country": "CN", "industry": "General", "currency": "¥"})

# 6. Merge & Filter existing ones
all_candidates = us_stocks + kr_stocks + vn_stocks + cn_stocks
to_add = []
seen_cand_ids = set()

for c in all_candidates:
    stock_id = f"{c['country']}_{c['ticker']}"
    if stock_id not in existing_ids and stock_id not in seen_cand_ids:
        c["id"] = stock_id
        to_add.append(c)
        seen_cand_ids.add(stock_id)

print(f"Total potential new stocks to add: {len(to_add)}")

# Function to fetch metadata from yfinance
def fill_yfinance_metadata(stock):
    ticker_str = stock["ticker"]
    country = stock["country"]
    
    # Map to yfinance ticker symbol
    yf_symbol = ticker_str
    if country == "VN":
        yf_symbol = f"{ticker_str}.VN"
    elif country == "CN":
        # A-share
        if ticker_str.startswith("6"):
            yf_symbol = f"{ticker_str}.SS"
        elif ticker_str.startswith("0") or ticker_str.startswith("3"):
            yf_symbol = f"{ticker_str}.SZ"
    elif country == "KR":
        yf_symbol = f"{ticker_str}.KS"
        
    try:
        t_obj = yf.Ticker(yf_symbol)
        info = t_obj.info
        if info:
            if country != "KR":
                name = info.get("longName") or info.get("shortName") or stock["name"]
                stock["name"] = name
            
            sector = info.get("sector") or info.get("industry")
            if sector:
                stock["industry"] = sector
                
            exchange = info.get("exchange", "")
            # Set tradingview symbol
            if country == "US":
                if exchange in ["NMS", "NGS", "NCM"]:
                    stock["tradingViewSymbol"] = f"NASDAQ:{ticker_str}"
                elif exchange == "NYQ":
                    stock["tradingViewSymbol"] = f"NYSE:{ticker_str}"
                else:
                    stock["tradingViewSymbol"] = f"NASDAQ:{ticker_str}"
            elif country == "VN":
                stock["tradingViewSymbol"] = f"HOSE:{ticker_str}"
            elif country == "CN":
                if yf_symbol.endswith(".SS"):
                    stock["tradingViewSymbol"] = f"SSE:{ticker_str}"
                elif yf_symbol.endswith(".SZ"):
                    stock["tradingViewSymbol"] = f"SZSE:{ticker_str}"
                else:
                    stock["tradingViewSymbol"] = f"NASDAQ:{ticker_str}"
            elif country == "KR":
                stock["tradingViewSymbol"] = f"KRX:{ticker_str}"
    except Exception as e:
        # Silently fail, fall back to defaults
        pass
        
    # Apply standard defaults if missing
    if "tradingViewSymbol" not in stock:
        if country == "US":
            stock["tradingViewSymbol"] = f"NASDAQ:{ticker_str}"
        elif country == "KR":
            stock["tradingViewSymbol"] = f"KRX:{ticker_str}"
        elif country == "VN":
            stock["tradingViewSymbol"] = f"HOSE:{ticker_str}"
        elif country == "CN":
            stock["tradingViewSymbol"] = f"SSE:{ticker_str}"
            
    if country == "KR":
        stock["naverTicker"] = ticker_str
    elif country == "VN":
        stock["naverTicker"] = f"{ticker_str}.HM"
    elif country == "CN":
        if yf_symbol.endswith(".SS") or yf_symbol.endswith(".SZ"):
            stock["naverTicker"] = yf_symbol
        else:
            stock["naverTicker"] = ticker_str
            
    stock["eps"] = 1
    stock["currentPrice"] = 1
    stock["defaultTargetPe"] = 15
    stock["isAwaitingSync"] = True
    
    return stock

# 7. Fetch metadata in parallel
print("Fetching yfinance metadata in parallel for new stocks...")
final_stocks = []
processed = 0

with ThreadPoolExecutor(max_workers=15) as executor:
    futures = {executor.submit(fill_yfinance_metadata, s): s for s in to_add}
    for future in as_completed(futures):
        res = future.result()
        if res:
            final_stocks.append(res)
        processed += 1
        if processed % 50 == 0:
            print(f"Processed {processed}/{len(to_add)} stocks...")

print(f"Completed metadata fetching. Prepped {len(final_stocks)} new stocks.")

# 8. Batch upload to Firestore
print("Uploading new stocks to Firestore in batches of 400...")
batch = db.batch()
count = 0
total_uploaded = 0

for stock in final_stocks:
    doc_ref = db.collection("stocks").document(stock["id"])
    batch.set(doc_ref, stock)
    count += 1
    total_uploaded += 1
    
    if count >= 400:
        batch.commit()
        print(f"Committed batch of {count} stocks (Total: {total_uploaded}).")
        batch = db.batch()
        count = 0

if count > 0:
    batch.commit()
    print(f"Committed final batch of {count} stocks (Total: {total_uploaded}).")

print(f"Seeding completed successfully! Total {total_uploaded} new stocks added.")
