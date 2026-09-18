import os
import sys
import json
import requests
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(dotenv_path):
    with open(dotenv_path) as f:
        for line in f:
            if line.strip() and not line.startswith("#") and "=" in line:
                k, v = line.strip().split("=", 1)
                os.environ[k.strip()] = v.strip()

service_account_info = None
firebase_secret = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
if firebase_secret:
    service_account_info = json.loads(firebase_secret)
else:
    local_key_path = os.path.join(os.path.dirname(__file__), "service-account.json")
    if os.path.exists(local_key_path):
        with open(local_key_path) as f:
            service_account_info = json.load(f)

if not service_account_info:
    print("Error: No Firebase credentials found.")
    sys.exit(1)

if not firebase_admin._apps:
    cred = credentials.Certificate(service_account_info)
    firebase_admin.initialize_app(cred)
db = firestore.client()

ETFS = [
    # 🇰🇷 한국 대표 ETF 10선
    {
        "id": "KR_069500",
        "ticker": "069500",
        "name": "KODEX 200",
        "koreanName": "KODEX 200",
        "country": "KR",
        "industry": "ETF",
        "currency": "₩",
        "eps": 1750,
        "currentPrice": 34500,
        "defaultTargetPe": 15,
        "isEtf": True,
        "tradingViewSymbol": "KRX:069500",
        "naverTicker": "069500"
    },
    {
        "id": "KR_360750",
        "ticker": "360750",
        "name": "TIGER US S&P500",
        "koreanName": "TIGER 미국S&P500",
        "country": "KR",
        "industry": "ETF",
        "currency": "₩",
        "eps": 850,
        "currentPrice": 19800,
        "defaultTargetPe": 15,
        "isEtf": True,
        "tradingViewSymbol": "KRX:360750",
        "naverTicker": "360750"
    },
    {
        "id": "KR_379810",
        "ticker": "379810",
        "name": "KODEX US Nasdaq100TR",
        "koreanName": "KODEX 미국나스닥100TR",
        "country": "KR",
        "industry": "ETF",
        "currency": "₩",
        "eps": 1200,
        "currentPrice": 26655,
        "defaultTargetPe": 18,
        "isEtf": True,
        "tradingViewSymbol": "KRX:379810",
        "naverTicker": "379810"
    },
    {
        "id": "KR_458730",
        "ticker": "458730",
        "name": "TIGER US Dividend DowJones",
        "koreanName": "TIGER 미국배당다우존스",
        "country": "KR",
        "industry": "ETF",
        "currency": "₩",
        "eps": 520,
        "currentPrice": 11500,
        "defaultTargetPe": 12,
        "isEtf": True,
        "tradingViewSymbol": "KRX:458730",
        "naverTicker": "458730"
    },
    {
        "id": "KR_381180",
        "ticker": "381180",
        "name": "TIGER US Philly Semiconductor",
        "koreanName": "TIGER 미국필라델피아반도체나스닥",
        "country": "KR",
        "industry": "ETF",
        "currency": "₩",
        "eps": 980,
        "currentPrice": 18200,
        "defaultTargetPe": 20,
        "isEtf": True,
        "tradingViewSymbol": "KRX:381180",
        "naverTicker": "381180"
    },
    {
        "id": "KR_465580",
        "ticker": "465580",
        "name": "ACE US BigTech TOP7 Plus",
        "koreanName": "ACE 미국빅테크TOP7 Plus",
        "country": "KR",
        "industry": "ETF",
        "currency": "₩",
        "eps": 750,
        "currentPrice": 14800,
        "defaultTargetPe": 18,
        "isEtf": True,
        "tradingViewSymbol": "KRX:465580",
        "naverTicker": "465580"
    },
    {
        "id": "KR_459580",
        "ticker": "459580",
        "name": "KODEX CD Rate Active",
        "koreanName": "KODEX CD금리액티브(합성)",
        "country": "KR",
        "industry": "ETF",
        "currency": "₩",
        "eps": 3550,
        "currentPrice": 104200,
        "defaultTargetPe": 10,
        "isEtf": True,
        "tradingViewSymbol": "KRX:459580",
        "naverTicker": "459580"
    },
    {
        "id": "KR_364980",
        "ticker": "364980",
        "name": "TIGER Secondary Battery TOP10",
        "koreanName": "TIGER 2차전지TOP10",
        "country": "KR",
        "industry": "ETF",
        "currency": "₩",
        "eps": 420,
        "currentPrice": 16500,
        "defaultTargetPe": 15,
        "isEtf": True,
        "tradingViewSymbol": "KRX:364980",
        "naverTicker": "364980"
    },
    {
        "id": "KR_229200",
        "ticker": "229200",
        "name": "KODEX KOSDAQ 150",
        "koreanName": "KODEX 코스닥150",
        "country": "KR",
        "industry": "ETF",
        "currency": "₩",
        "eps": 580,
        "currentPrice": 12400,
        "defaultTargetPe": 15,
        "isEtf": True,
        "tradingViewSymbol": "KRX:229200",
        "naverTicker": "229200"
    },
    {
        "id": "KR_104580",
        "ticker": "104580",
        "name": "PLUS High Dividend",
        "koreanName": "PLUS 고배당주",
        "country": "KR",
        "industry": "ETF",
        "currency": "₩",
        "eps": 1100,
        "currentPrice": 15200,
        "defaultTargetPe": 12,
        "isEtf": True,
        "tradingViewSymbol": "KRX:104580",
        "naverTicker": "104580"
    },

    # 🇺🇸 미국 글로벌 대표 ETF 10선
    {
        "id": "US_SPY",
        "ticker": "SPY",
        "name": "SPDR S&P 500 ETF Trust",
        "koreanName": "SPDR S&P 500 ETF (스파이)",
        "country": "US",
        "industry": "ETF",
        "currency": "$",
        "eps": 24.5,
        "currentPrice": 585.0,
        "defaultTargetPe": 15,
        "isEtf": True,
        "tradingViewSymbol": "AMEX:SPY",
        "naverTicker": "SPY"
    },
    {
        "id": "US_VOO",
        "ticker": "VOO",
        "name": "Vanguard S&P 500 ETF",
        "koreanName": "뱅가드 S&P 500 ETF (VOO)",
        "country": "US",
        "industry": "ETF",
        "currency": "$",
        "eps": 22.5,
        "currentPrice": 535.0,
        "defaultTargetPe": 15,
        "isEtf": True,
        "tradingViewSymbol": "AMEX:VOO",
        "naverTicker": "VOO"
    },
    {
        "id": "US_QQQ",
        "ticker": "QQQ",
        "name": "Invesco QQQ Trust",
        "koreanName": "인베스코 QQQ (나스닥100)",
        "country": "US",
        "industry": "ETF",
        "currency": "$",
        "eps": 22.0,
        "currentPrice": 490.0,
        "defaultTargetPe": 18,
        "isEtf": True,
        "tradingViewSymbol": "NASDAQ:QQQ",
        "naverTicker": "QQQ"
    },
    {
        "id": "US_SCHD",
        "ticker": "SCHD",
        "name": "Schwab US Dividend Equity ETF",
        "koreanName": "슈왑 미국 배당 다우존스 (SCHD)",
        "country": "US",
        "industry": "ETF",
        "currency": "$",
        "eps": 3.5,
        "currentPrice": 83.0,
        "defaultTargetPe": 12,
        "isEtf": True,
        "tradingViewSymbol": "AMEX:SCHD",
        "naverTicker": "SCHD"
    },
    {
        "id": "US_SOXX",
        "ticker": "SOXX",
        "name": "iShares Semiconductor ETF",
        "koreanName": "아이셰어즈 반도체 ETF (SOXX)",
        "country": "US",
        "industry": "ETF",
        "currency": "$",
        "eps": 9.8,
        "currentPrice": 225.0,
        "defaultTargetPe": 20,
        "isEtf": True,
        "tradingViewSymbol": "NASDAQ:SOXX",
        "naverTicker": "SOXX"
    },
    {
        "id": "US_VTI",
        "ticker": "VTI",
        "name": "Vanguard Total Stock Market ETF",
        "koreanName": "뱅가드 미국 전체시장 ETF (VTI)",
        "country": "US",
        "industry": "ETF",
        "currency": "$",
        "eps": 12.0,
        "currentPrice": 285.0,
        "defaultTargetPe": 15,
        "isEtf": True,
        "tradingViewSymbol": "AMEX:VTI",
        "naverTicker": "VTI"
    },
    {
        "id": "US_JEPI",
        "ticker": "JEPI",
        "name": "JPMorgan Equity Premium Income ETF",
        "koreanName": "JP모건 미국 고배당 월배당 (JEPI)",
        "country": "US",
        "industry": "ETF",
        "currency": "$",
        "eps": 4.8,
        "currentPrice": 58.5,
        "defaultTargetPe": 10,
        "isEtf": True,
        "tradingViewSymbol": "AMEX:JEPI",
        "naverTicker": "JEPI"
    },
    {
        "id": "US_XLK",
        "ticker": "XLK",
        "name": "Technology Select Sector SPDR",
        "koreanName": "테크놀로지 셀렉트 섹터 SPDR (XLK)",
        "country": "US",
        "industry": "ETF",
        "currency": "$",
        "eps": 8.5,
        "currentPrice": 230.0,
        "defaultTargetPe": 18,
        "isEtf": True,
        "tradingViewSymbol": "AMEX:XLK",
        "naverTicker": "XLK"
    },
    {
        "id": "US_TLT",
        "ticker": "TLT",
        "name": "iShares 20+ Year Treasury Bond ETF",
        "koreanName": "미국 20년+ 만기 장기국채 ETF (TLT)",
        "country": "US",
        "industry": "ETF",
        "currency": "$",
        "eps": 4.0,
        "currentPrice": 95.0,
        "defaultTargetPe": 12,
        "isEtf": True,
        "tradingViewSymbol": "NASDAQ:TLT",
        "naverTicker": "TLT"
    },
    {
        "id": "US_GLD",
        "ticker": "GLD",
        "name": "SPDR Gold Shares",
        "koreanName": "SPDR 골드 셰어즈 (금 실물 ETF)",
        "country": "US",
        "industry": "ETF",
        "currency": "$",
        "eps": 0,
        "currentPrice": 245.0,
        "defaultTargetPe": 15,
        "isEtf": True,
        "tradingViewSymbol": "AMEX:GLD",
        "naverTicker": "GLD"
    },

    # 🇻🇳 베트남 대표 ETF 10선
    {
        "id": "VN_FUEVFVND",
        "ticker": "FUEVFVND",
        "name": "DCVFMVN DIAMOND ETF",
        "koreanName": "드래곤캐피탈 VN 다이아몬드 ETF (1위)",
        "country": "VN",
        "industry": "ETF",
        "currency": "₫",
        "eps": 1500,
        "currentPrice": 31200,
        "defaultTargetPe": 15,
        "isEtf": True,
        "tradingViewSymbol": "HOSE:FUEVFVND",
        "naverTicker": "FUEVFVND"
    },
    {
        "id": "VN_E1VFVN30",
        "ticker": "E1VFVN30",
        "name": "DCVFMVN30 ETF",
        "koreanName": "드래곤캐피탈 VN30 ETF",
        "country": "VN",
        "industry": "ETF",
        "currency": "₫",
        "eps": 1350,
        "currentPrice": 24800,
        "defaultTargetPe": 14,
        "isEtf": True,
        "tradingViewSymbol": "HOSE:E1VFVN30",
        "naverTicker": "E1VFVN30"
    },
    {
        "id": "VN_FUESSVFL",
        "ticker": "FUESSVFL",
        "name": "SSIAM VNFIN LEAD ETF",
        "koreanName": "SSI 베트남 금융/은행 리딩 ETF",
        "country": "VN",
        "industry": "ETF",
        "currency": "₫",
        "eps": 1420,
        "currentPrice": 22600,
        "defaultTargetPe": 14,
        "isEtf": True,
        "tradingViewSymbol": "HOSE:FUESSVFL",
        "naverTicker": "FUESSVFL"
    },
    {
        "id": "VN_FUESSV30",
        "ticker": "FUESSV30",
        "name": "SSIAM VN30 ETF",
        "koreanName": "SSI 자산운용 VN30 ETF",
        "country": "VN",
        "industry": "ETF",
        "currency": "₫",
        "eps": 1280,
        "currentPrice": 20500,
        "defaultTargetPe": 14,
        "isEtf": True,
        "tradingViewSymbol": "HOSE:FUESSV30",
        "naverTicker": "FUESSV30"
    },
    {
        "id": "VN_FUEMAV30",
        "ticker": "FUEMAV30",
        "name": "Mirae Asset VN30 ETF",
        "koreanName": "미래에셋 베트남 VN30 ETF",
        "country": "VN",
        "industry": "ETF",
        "currency": "₫",
        "eps": 1250,
        "currentPrice": 18900,
        "defaultTargetPe": 14,
        "isEtf": True,
        "tradingViewSymbol": "HOSE:FUEMAV30",
        "naverTicker": "FUEMAV30"
    },
    {
        "id": "VN_FUEVN100",
        "ticker": "FUEVN100",
        "name": "VinaCapital VN100 ETF",
        "koreanName": "비나캐피탈 VN100 ETF",
        "country": "VN",
        "industry": "ETF",
        "currency": "₫",
        "eps": 1100,
        "currentPrice": 17800,
        "defaultTargetPe": 14,
        "isEtf": True,
        "tradingViewSymbol": "HOSE:FUEVN100",
        "naverTicker": "FUEVN100"
    },
    {
        "id": "VN_FUESSV50",
        "ticker": "FUESSV50",
        "name": "SSIAM VNX50 ETF",
        "koreanName": "SSI 베트남 통합 VNX50 ETF",
        "country": "VN",
        "industry": "ETF",
        "currency": "₫",
        "eps": 1300,
        "currentPrice": 21400,
        "defaultTargetPe": 14,
        "isEtf": True,
        "tradingViewSymbol": "HOSE:FUESSV50",
        "naverTicker": "FUESSV50"
    },
    {
        "id": "VN_FUEIP100",
        "ticker": "FUEIP100",
        "name": "IPAAM VN100 ETF",
        "koreanName": "IPA 자산운용 VN100 ETF",
        "country": "VN",
        "industry": "ETF",
        "currency": "₫",
        "eps": 980,
        "currentPrice": 15600,
        "defaultTargetPe": 14,
        "isEtf": True,
        "tradingViewSymbol": "HOSE:FUEIP100",
        "naverTicker": "FUEIP100"
    },
    {
        "id": "US_VNM",
        "ticker": "VNM",
        "name": "VanEck Vietnam ETF",
        "koreanName": "반에크 글로벌 베트남 ETF (미국상장)",
        "country": "US",
        "industry": "ETF",
        "currency": "$",
        "eps": 0.85,
        "currentPrice": 13.8,
        "defaultTargetPe": 15,
        "isEtf": True,
        "tradingViewSymbol": "AMEX:VNM",
        "naverTicker": "VNM"
    },
    {
        "id": "VN_FUEKIV30",
        "ticker": "FUEKIV30",
        "name": "KIM Growth VN30 ETF",
        "koreanName": "한국투자신탁운용 베트남 VN30 ETF",
        "country": "VN",
        "industry": "ETF",
        "currency": "₫",
        "eps": 1220,
        "currentPrice": 14200,
        "defaultTargetPe": 14,
        "isEtf": True,
        "tradingViewSymbol": "HOSE:FUEKIV30",
        "naverTicker": "FUEKIV30"
    },
]

def fetch_live_price(stock):
    country = stock["country"]
    ticker = stock["ticker"]
    
    # 1. KR Stocks (Naver)
    if country == "KR":
        try:
            url = f"https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:{ticker}"
            r = requests.get(url, timeout=5)
            if r.status_code == 200:
                data = r.json()
                areas = data.get("result", {}).get("areas", [])
                if areas and areas[0].get("datas"):
                    price = areas[0]["datas"][0].get("nv")
                    if price:
                        return float(price)
        except Exception as e:
            pass

    # 2. US Stocks (Yahoo Finance)
    elif country == "US":
        try:
            import yfinance as yf
            t = yf.Ticker(ticker)
            info = t.info
            price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose") or info.get("navPrice")
            if price:
                return float(price)
        except Exception as e:
            pass

    # 3. VN Stocks (TCBS)
    elif country == "VN":
        try:
            url = f"https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long-term?ticker={ticker}&type=stock&resolution=D&count=1"
            r = requests.get(url, timeout=5)
            if r.status_code == 200:
                data = r.json().get("data", [])
                if data and "close" in data[0]:
                    return float(data[0]["close"]) * 1000
        except Exception as e:
            pass

    return stock["currentPrice"]

def main():
    print(f"Seeding {len(ETFS)} ETFs to Firestore...")
    batch = db.batch()
    
    for stock in ETFS:
        live_price = fetch_live_price(stock)
        stock["currentPrice"] = live_price
        doc_ref = db.collection("stocks").document(stock["id"])
        batch.set(doc_ref, stock, merge=True)
        print(f"✓ {stock['id']} ({stock['koreanName']}) -> Live Price: {live_price:,.2f} {stock['currency']}")
        
    batch.commit()
    print("All 30 ETFs successfully seeded and synchronized to Firestore!")

if __name__ == "__main__":
    main()
