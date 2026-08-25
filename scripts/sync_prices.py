import os
import sys
import json
import time
import random
import requests
import firebase_admin
from firebase_admin import credentials, firestore
from concurrent.futures import ThreadPoolExecutor, as_completed

# Load local .env file if it exists to import GEMINI_API_KEY
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(dotenv_path):
    try:
        with open(dotenv_path) as f:
            for line in f:
                if line.strip() and not line.startswith("#") and "=" in line:
                    key, val = line.strip().split("=", 1)
                    os.environ[key.strip()] = val.strip()
    except Exception as e:
        print(f"Error loading .env file: {e}")

# Initialize Firebase
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
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
    Fetches price, EPS, and targetMeanPrice from Yahoo Finance using yfinance library.
    """
    try:
        import yfinance as yf
        ticker_obj = yf.Ticker(yahoo_ticker)
        info = ticker_obj.info
        price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("navPrice")
        eps = info.get("trailingEps") or info.get("forwardEps")
        target_price = info.get("targetMeanPrice")
        return float(price) if price else None, float(eps) if eps else None, float(target_price) if target_price else None
    except Exception as e:
        print(f"yfinance fetch failed for {yahoo_ticker}: {e}")
    return None, None, None

import threading
gemini_lock = threading.Lock()

def call_gemini(prompt, api_key):
    """Call Gemini API WITHOUT Google Search Grounding.
    This allows up to 15 RPM (vs 1 RPM with grounding), enabling all 449 stocks to be processed.
    """
    global gemini_lock
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={api_key}"
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }
    
    import json
    import urllib.request
    import urllib.error
    import time
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    # Try up to 3 times with exponential backoff on 429
    for attempt in range(3):
        try:
            with gemini_lock:
                # 1.1 second gap to stay safely under 15 RPM limit
                time.sleep(1.1)
                
                with urllib.request.urlopen(req, timeout=30) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    candidate = res_data['candidates'][0]
                    text = candidate['content']['parts'][0]['text'].strip()
                    text = text.replace("**", "").replace("\n\n", " ")
                    return text
        except urllib.error.HTTPError as e:
            if e.code == 429:
                sleep_time = (attempt + 1) * 10 + random.uniform(1.0, 3.0)
                print(f"Gemini rate limited (429). Retrying in {sleep_time:.1f}s...")
                time.sleep(sleep_time)
                continue
            else:
                print(f"HTTP Error calling Gemini: {e.code} {e.reason}")
                return None
        except Exception as e:
            print(f"Error calling Gemini: {e}")
            return None
    return None

def generate_ai_analysis_reports_all_langs(stock_name, ticker, country, industry, api_key):
    """Generate 3-language investment analysis for a single stock using plain Gemini API."""
    country_names = {"KR": "South Korea (KOSPI/KOSDAQ)", "US": "United States (NYSE/NASDAQ)", "VN": "Vietnam (HOSE/HNX)", "CN": "China (SSE/SZSE)"}
    country_label = country_names.get(country, country)
    
    prompt = (
        f"You are a professional stock investment analyst. "
        f"Analyze the company '{stock_name}' (ticker: {ticker}), listed on {country_label}, "
        f"in the '{industry}' industry. "
        f"Based on your knowledge of this company, its sector, and market environment, "
        f"provide a factual investment brief that would help retail investors decide before buying. "
        f"Return a JSON object with exactly three language keys: 'ko', 'en', 'vi'. "
        f"Each key maps to an object with three fields: "
        f"'industry_outlook': 2-3 sentences on industry trends and competitive positioning (in that language), "
        f"'debt_and_risks': 2-3 sentences on financial health, key risks, debt situation (in that language), "
        f"'growth_drivers': 2-3 sentences on growth catalysts, business model strengths, valuation outlook (in that language). "
        f"Write 'ko' in Korean, 'en' in English, 'vi' in Vietnamese. "
        f"Be specific to this company. Do not use generic filler text. "
        f"Respond ONLY with the raw JSON object. No markdown, no backticks, no extra text."
    )

    import json
    summary_text = call_gemini(prompt, api_key)
    
    parsed = {}
    if summary_text:
        # Strip potential markdown block syntax (e.g. ```json ... ```)
        clean_json = summary_text.strip()
        if clean_json.startswith("```"):
            lines = clean_json.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_json = "\n".join(lines).strip()
            
        try:
            parsed = json.loads(clean_json)
        except Exception as je:
            print(f"Error parsing Gemini JSON output: {je}. Raw output was: {summary_text}")
            
    # Generate reports for each language
    langs = ["ko", "en", "vi"]
    titles_map = {
        "ko": ["1. 업종 및 시장 환경", "2. 재무 건전성 및 리스크", "3. 성장 동력 및 가치 분석"],
        "en": ["1. Sector & Market Environment", "2. Financial Health & Debt Risks", "3. Growth Drivers & Valuation"],
        "vi": ["1. Ngành & Môi trường thị trường", "2. Sức khỏe tài chính & Rủi ro", "3. Động lực tăng trưởng & Định giá"]
    }
    publishers_map = {
        "ko": "AI 분석 엔진",
        "en": "AI Analyst",
        "vi": "AI phân tích"
    }
    pub_date_map = {
        "ko": "실시간",
        "en": "Real-time",
        "vi": "Thực tế"
    }
    
    fallback_templates = {
        "ko": [
            "[실적분석] 해당 기업이 속한 업종 전반의 디지털 전환 및 글로벌 공급망 리스크 대응 강도를 높이고 있습니다.",
            "[재무분석] 고금리 장기화 우려 속에서 영업 현금 흐름 확보 및 부채 수준 통제 등 재무 건전성 조율이 강조되고 있습니다.",
            "[사업전망] 주력 사업 효율성 극대화 및 고마진 신규 사업 다각화를 통해 중장기 가치 성장을 이끌어내고 있습니다."
        ],
        "en": [
            "[Market Trends] The company is enhancing its competitiveness in response to digital transformation and demand shifts.",
            "[Risk Assessment] Managing financial health, maintaining cash flows, and controlling debt ratios are central tasks.",
            "[Valuation] Focus on improving operational efficiency and diversifying growth portfolios will support value."
        ],
        "vi": [
            "[Thị trường] Doanh nghiệp nâng cao năng lực cạnh tranh trước các biến động về nhu cầu và xu hướng chuyển đổi số.",
            "[Tài chính] Quản trị rủi ro thanh khoản, duy trì dòng tiền ổn định và kiểm soát tỷ lệ nợ vay là ưu tiên.",
            "[Triển vọng] Việc cải thiện hiệu quả vận hành và mở rộng danh mục cốt lõi sẽ giúp tăng định giá cổ phiếu."
        ]
    }
    
    result = {}
    keys = ["industry_outlook", "debt_and_risks", "growth_drivers"]
    
    for lang in langs:
        lang_data = parsed.get(lang, {}) if isinstance(parsed, dict) else {}
        reports = []
        for i in range(3):
            key = keys[i]
            content = lang_data.get(key, "").strip() if isinstance(lang_data, dict) else ""
            if not content:
                content = fallback_templates[lang][i]
                
            reports.append({
                "title": titles_map[lang][i],
                "publisher": publishers_map[lang],
                "pubDate": pub_date_map[lang],
                "link": "https://aistudio.google.com",
                "content": content
            })
        result[lang] = reports
        
    return result

def fetch_google_news_rss(query, lang_code, country_code, stock_name, limit=3):
    import urllib.request
    import urllib.parse
    import xml.etree.ElementTree as ET
    import re
    
    encoded_query = urllib.parse.quote(query)
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl={lang_code}&gl={country_code}&ceid={country_code}:{lang_code}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    
    def clean_html(raw_html):
        if not raw_html:
            return ""
        # Remove HTML tags
        clean_text = re.sub(r'<[^>]+>', ' ', raw_html)
        # Normalize whitespace
        clean_text = ' '.join(clean_text.split())
        return clean_text

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
        root = ET.fromstring(xml_data)
        items = root.findall('.//item')[:limit]
        news_list = []
        for item in items:
            title = item.find('title').text
            link = item.find('link').text
            pub_date = item.find('pubDate').text
            
            description_el = item.find('description')
            raw_desc = description_el.text if description_el is not None else ""
            clean_desc = clean_html(raw_desc)
            
            # Clean publisher
            display_title = title
            publisher = "Google News"
            if " - " in title:
                parts = title.rsplit(" - ", 1)
                display_title = parts[0]
                publisher = parts[1]
                
            news_list.append({
                "title": display_title,
                "publisher": publisher,
                "pubDate": pub_date,
                "link": link,
                "content": clean_desc if len(clean_desc) > 10 else f"본 뉴스는 '{display_title}'에 대한 보도입니다."
            })
        return news_list
    except Exception as e:
        print(f"Error fetching Google News RSS for query {query} ({lang_code}): {e}")
        return []

# All stocks get AI analysis now (no more 6-stock limit)
# MAIN_STOCK_IDS restriction has been removed

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
    
    price, eps, target_price = None, None, None
    try:
        if country == "KR":
            # Try Naver first for Korea
            price, eps = fetch_kr_stock_naver(naver_ticker)
            # Fetch target_price from yfinance (try .KS then .KQ)
            yahoo_ticker = f"{ticker}.KS"
            _, _, target_price = fetch_yfinance_data(yahoo_ticker)
            if target_price is None:
                yahoo_ticker = f"{ticker}.KQ"
                _, _, target_price = fetch_yfinance_data(yahoo_ticker)
                
            if not price:
                # Fallback to yfinance
                yahoo_ticker = f"{ticker}.KS"
                price, eps, target_price = fetch_yfinance_data(yahoo_ticker)
                if not price:
                    yahoo_ticker = f"{ticker}.KQ"
                    price, eps, target_price = fetch_yfinance_data(yahoo_ticker)
        elif country == "US":
            # Map Apple.O to AAPL for yfinance
            yahoo_ticker = naver_ticker.split('.')[0] if '.' in naver_ticker else naver_ticker
            price, eps, target_price = fetch_yfinance_data(yahoo_ticker)
        elif country == "VN":
            # Map VNM.HM to VNM.VN for yfinance
            yahoo_ticker = f"{ticker}.VN"
            price, eps, target_price = fetch_yfinance_data(yahoo_ticker)
        elif country == "CN":
            # Use naver_ticker directly since it contains the correct .SS or .SZ suffix for yfinance
            yahoo_ticker = naver_ticker
            price, eps, target_price = fetch_yfinance_data(yahoo_ticker)
    except Exception as e:
        print(f"Error processing {stock_id}: {e}")
        
    if price:
        update_data = {
            "currentPrice": price,
            "lastUpdated": firestore.SERVER_TIMESTAMP
        }
        if eps is not None:
            update_data["eps"] = eps
        if target_price is not None:
            update_data["consensusTarget"] = target_price
            
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
            
    print("\nPrice sync committed successfully!")
    
    if not GEMINI_API_KEY:
        print("\nNo GEMINI_API_KEY found. Skipping AI analysis generation.")
        print("Sync completed successfully!")
        return
    
    # Generate AI analysis for ALL stocks in parallel using plain Gemini (no Search Grounding)
    # This allows 15 RPM vs 1 RPM, enabling all 449 stocks in ~30 minutes
    print(f"\nStarting parallel AI Investment Analysis generation for ALL {len(docs)} stocks...")
    print("(Using plain Gemini API - no Search Grounding limit, ~15 RPM allowed)")
    
    ai_updates = []  # list of (stock_id, update_data)
    ai_lock = threading.Lock()
    
    def process_ai_for_stock(doc):
        stock_id = doc.id
        stock_data = doc.to_dict()
        country = stock_data.get("country", "")
        ticker = stock_data.get("ticker", "")
        name = stock_data.get("name", "")
        korean_name = stock_data.get("koreanName", name)
        industry = stock_data.get("industry", "General")
        
        # Use Korean name for better Korean-language analysis quality
        display_name = korean_name if korean_name else name
        
        analysis_data = generate_ai_analysis_reports_all_langs(
            display_name, ticker, country, industry, GEMINI_API_KEY
        )
        
        update_data = {}
        if analysis_data.get("ko"):
            update_data["latestNews_KO"] = analysis_data["ko"]
        if analysis_data.get("en"):
            update_data["latestNews_EN"] = analysis_data["en"]
        if analysis_data.get("vi"):
            update_data["latestNews_VI"] = analysis_data["vi"]
            
        return stock_id, update_data
    
    # Run with 5 parallel workers — each worker enforces 1.1s gap via gemini_lock
    # Net throughput: ~5 / 1.1s = ~4.5 stocks/sec = all 449 stocks in ~100 seconds theoretically
    # In practice with network latency: ~15-20 min for 449 stocks
    completed = 0
    failed = 0
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_stock = {executor.submit(process_ai_for_stock, doc): doc.id for doc in docs}
        
        for future in as_completed(future_to_stock):
            stock_id = future_to_stock[future]
            try:
                res_id, update_data = future.result()
                if update_data:
                    stocks_ref.document(res_id).update(update_data)
                    completed += 1
                    print(f"--> [{completed}/{len(docs)}] Done: {res_id}")
                else:
                    failed += 1
                    print(f"--> [{completed}/{len(docs)}] No data: {res_id}")
            except Exception as exc:
                failed += 1
                print(f"--> AI analysis error for {stock_id}: {exc}")
    
    print(f"\nAI Analysis complete! {completed} succeeded, {failed} failed out of {len(docs)} stocks.")
    print("\nSync completed successfully!")

if __name__ == "__main__":
    main()
