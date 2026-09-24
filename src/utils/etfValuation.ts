export interface EtfDetails {
  isEtf: boolean
  baseIndex: string
  issuer: string
  expenseRatio: string
  dividendYield: string
  dividendYieldPct: number
  dividendFrequency: string
  currencyType: string
  nav: number
  disparityPct: number
  targetUpsidePct: number
  targetPrice1Y: number
  holdings: { name: string; ticker: string; weight: number; sector: string }[]
}

export const getEtfDetails = (stock: any, currentPrice: number, language: string): EtfDetails | null => {
  if (!stock) return null
  const nameLower = (stock.name || '').toLowerCase()
  const korLower = (stock.koreanName || '').toLowerCase()
  const tickerLower = (stock.ticker || '').toLowerCase()

  
  // 1. Explicit ETF flag or industry
  const isExplicitEtf = Boolean(stock.isEtf || (stock.industry && stock.industry.toUpperCase() === 'ETF'))

  // 2. Known US & Global ETF Tickers (Exact Match)
  const knownUsEtfTickers = new Set([
    'qqq', 'tqqq', 'sqqq', 'spy', 'voo', 'ivv', 'schd', 'soxx', 'smh', 'jepi', 'jepq', 'vti',
    'xlk', 'tlt', 'gld', 'vnm', 'dia', 'iemg', 'vwo', 'bnd', 'vnq', 'arkk', 'xle', 'xlf', 'xly', 'xlv'
  ])

  // 3. Known Vietnam ETF Tickers / Symbols (Exact Match)
  const knownVnEtfTickers = new Set([
    'fuevfvnd', 'e1vfvn30', 'fuessvfl', 'fuessv30', 'fuemav30', 'fuevn100', 'fuessv50', 'fueip100', 'fuekiv30'
  ])

  // 4. Known Korean ETF Tickers (Exact Match)
  const knownKrEtfTickers = new Set([
    '069500', '360750', '379810', '458730', '381180', '465580', '459580', '364980', '229200', '104580',
    '133690', '448290', '448300', '465540', '122630', '252670', '233740', '114800', '251340', '277630'
  ])

  // 5. Korean ETF Brand Prefixes (Must start with the brand name or have space boundary)
  const krEtfBrandPrefixes = [
    'kodex', 'tiger', 'kbstar', 'ace ', 'sol ', 'plus ', 'rise ', 'hanaro ', 'timefolio ', 'kosef ', 'arirang '
  ]
  const isKrBrandEtf = krEtfBrandPrefixes.some(prefix => 
    korLower.startsWith(prefix) || 
    nameLower.startsWith(prefix) || 
    korLower.includes(` ${prefix}`) || 
    nameLower.includes(` ${prefix}`)
  )

  const isEtfFlag = isExplicitEtf || 
    knownUsEtfTickers.has(tickerLower) || 
    knownVnEtfTickers.has(tickerLower) || 
    knownKrEtfTickers.has(tickerLower) || 
    isKrBrandEtf

  if (!isEtfFlag) return null

  let baseIndex = 'Global Index'
  let issuer = stock.country === 'KR' ? '삼성자산운용 (KODEX)' : stock.country === 'VN' ? 'Dragon Capital' : 'Vanguard'
  let expenseRatio = '연 0.05%'
  let dividendYield = '연 1.50%'
  let dividendYieldPct = 1.50
  let dividendFrequency = language === 'KO' ? '분기 분배 (1, 4, 7, 10월)' : language === 'VI' ? 'Hàng quý' : 'Quarterly'
  let currencyType = stock.country === 'KR' 
    ? (language === 'KO' ? '환노출형 (USD/KRW 환율 반영)' : 'Unhedged (USD/KRW)')
    : (stock.country === 'VN' ? (language === 'KO' ? 'VND 원화환산' : 'VND Direct') : 'USD Direct')
  let targetUpsidePct = 15.0
  let holdings: { name: string; ticker: string; weight: number; sector: string }[] = []

  // ----------------------------------------------------------------------
  // 1. 한국 시장 (KRX 상장 대표 ETF)
  // ----------------------------------------------------------------------
  if (tickerLower === '069500' || korLower.includes('kodex 200') || (korLower.includes('200') && !korLower.includes('미국'))) {
    // KODEX 200
    baseIndex = 'KOSPI 200 Index'
    issuer = '삼성자산운용 (KODEX)'
    expenseRatio = '연 0.015%'
    dividendYield = '연 2.10%'
    dividendYieldPct = 2.10
    targetUpsidePct = 16.5
    dividendFrequency = language === 'KO' ? '분기 분배 (1, 4, 7, 10월)' : 'Quarterly'
    currencyType = language === 'KO' ? '원화 자산 (환위험 없음)' : 'KRW Local'
    holdings = [
      { name: '삼성전자', ticker: '005930', weight: 26.2, sector: '반도체·스마트폰' },
      { name: 'SK하이닉스', ticker: '000660', weight: 12.4, sector: 'HBM·메모리' },
      { name: 'LG에너지솔루션', ticker: '373220', weight: 4.8, sector: '2차전지 배터리' },
      { name: '현대차', ticker: '005380', weight: 3.9, sector: '완성차·전기차' },
      { name: '기아', ticker: '000270', weight: 3.2, sector: '완성차·하이브리드' },
      { name: '셀트리온', ticker: '068270', weight: 3.0, sector: '바이오시밀러' },
      { name: 'KB금융', ticker: '105560', weight: 2.8, sector: '금융지주' },
      { name: 'NAVER', ticker: '035420', weight: 2.1, sector: '인터넷 플랫폼' },
    ]
  } else if (tickerLower === '360750' || (korLower.includes('tiger') && korLower.includes('s&p500'))) {
    // TIGER 미국S&P500
    baseIndex = 'S&P 500 Index'
    issuer = '미래에셋자산운용 (TIGER)'
    expenseRatio = '연 0.0068%'
    dividendYield = '연 1.35%'
    dividendYieldPct = 1.35
    targetUpsidePct = 14.8
    dividendFrequency = language === 'KO' ? '분기 분배 (1, 4, 7, 10월)' : 'Quarterly'
    currencyType = language === 'KO' ? '환노출형 (USD/KRW 환율 반영)' : 'Unhedged (USD)'
    holdings = [
      { name: 'Microsoft Corp.', ticker: 'MSFT', weight: 7.1, sector: '소프트웨어·클라우드' },
      { name: 'Apple Inc.', ticker: 'AAPL', weight: 6.8, sector: '스마트 디바이스' },
      { name: 'NVIDIA Corp.', ticker: 'NVDA', weight: 6.4, sector: 'AI 가속기' },
      { name: 'Amazon.com Inc.', ticker: 'AMZN', weight: 3.7, sector: '전자상거래·AWS' },
      { name: 'Meta Platforms', ticker: 'META', weight: 2.5, sector: 'SNS·AI' },
      { name: 'Alphabet Inc. (Class A)', ticker: 'GOOGL', weight: 2.3, sector: '검색엔진' },
      { name: 'Berkshire Hathaway', ticker: 'BRK.B', weight: 1.8, sector: '금융·복합기업' },
      { name: 'Eli Lilly and Co.', ticker: 'LLY', weight: 1.6, sector: '비만치료제·바이오' },
    ]
  } else if (tickerLower === '379810' || korLower.includes('나스닥100tr')) {
    // KODEX 미국나스닥100TR
    baseIndex = 'NASDAQ-100 Total Return Index'
    issuer = '삼성자산운용 (KODEX)'
    expenseRatio = '연 0.0062%'
    dividendYield = '연 1.07% (자동 재투자)'
    dividendYieldPct = 1.07
    targetUpsidePct = 18.4
    dividendFrequency = language === 'KO' ? '배당금 자동 재투자(TR)' : 'Total Return (Auto-Reinvest)'
    currencyType = language === 'KO' ? '환노출형 (USD/KRW 환율 반영)' : 'Unhedged (USD)'
    holdings = [
      { name: 'Apple Inc.', ticker: 'AAPL', weight: 8.9, sector: 'IT·스마트폰' },
      { name: 'Microsoft Corp.', ticker: 'MSFT', weight: 8.4, sector: '클라우드·AI' },
      { name: 'NVIDIA Corp.', ticker: 'NVDA', weight: 7.8, sector: 'AI 가속기' },
      { name: 'Amazon.com Inc.', ticker: 'AMZN', weight: 5.2, sector: '전자상거래' },
      { name: 'Meta Platforms', ticker: 'META', weight: 4.8, sector: '소셜미디어' },
      { name: 'Alphabet Inc. (Class A)', ticker: 'GOOGL', weight: 4.5, sector: '검색·클라우드' },
      { name: 'Broadcom Inc.', ticker: 'AVGO', weight: 4.1, sector: '통신 반도체' },
      { name: 'Tesla Inc.', ticker: 'TSLA', weight: 3.2, sector: '전기차·로봇' },
    ]
  } else if (tickerLower === '458730' || (korLower.includes('미국배당다우존스') || korLower.includes('슈드'))) {
    // TIGER 미국배당다우존스
    baseIndex = 'Dow Jones U.S. Dividend 100 Index'
    issuer = '미래에셋자산운용 (TIGER)'
    expenseRatio = '연 0.01%'
    dividendYield = '연 3.65% (월배당)'
    dividendYieldPct = 3.65
    targetUpsidePct = 12.0
    dividendFrequency = language === 'KO' ? '월배당 (매월 15일 전후 지급)' : 'Monthly Payout'
    currencyType = language === 'KO' ? '환노출형 (USD/KRW 환율 반영)' : 'Unhedged (USD)'
    holdings = [
      { name: 'AbbVie Inc.', ticker: 'ABBV', weight: 4.6, sector: '면역질환 의약품' },
      { name: 'Amgen Inc.', ticker: 'AMGN', weight: 4.4, sector: '바이오테크' },
      { name: 'Chevron Corp.', ticker: 'CVX', weight: 4.2, sector: '에너지·정유' },
      { name: 'Texas Instruments', ticker: 'TXN', weight: 4.0, sector: '차량용 반도체' },
      { name: 'Lockheed Martin', ticker: 'LMT', weight: 3.9, sector: '방위산업' },
      { name: 'Coca-Cola Co.', ticker: 'KO', weight: 3.8, sector: '글로벌 음료' },
      { name: 'Pfizer Inc.', ticker: 'PFE', weight: 3.6, sector: '제약' },
      { name: 'Cisco Systems', ticker: 'CSCO', weight: 3.5, sector: '네트워크 장비' },
    ]
  } else if (tickerLower === '381180' || korLower.includes('필라델피아반도체')) {
    // TIGER 미국필라델피아반도체나스닥
    baseIndex = 'PHLX Semiconductor Sector Index'
    issuer = '미래에셋자산운용 (TIGER)'
    expenseRatio = '연 0.45%'
    dividendYield = '연 0.85%'
    dividendYieldPct = 0.85
    targetUpsidePct = 23.5
    dividendFrequency = language === 'KO' ? '분기 분배 (1, 4, 7, 10월)' : 'Quarterly'
    currencyType = language === 'KO' ? '환노출형 (USD/KRW 환율 반영)' : 'Unhedged (USD)'
    holdings = [
      { name: 'NVIDIA Corp.', ticker: 'NVDA', weight: 9.8, sector: 'AI 가속기 칩' },
      { name: 'Broadcom Inc.', ticker: 'AVGO', weight: 8.9, sector: '통신·커스텀 ASIC' },
      { name: 'Qualcomm Inc.', ticker: 'QCOM', weight: 6.8, sector: '스마트폰 AP' },
      { name: 'Advanced Micro Devices', ticker: 'AMD', weight: 6.2, sector: 'CPU·서버용 GPU' },
      { name: 'Applied Materials', ticker: 'AMAT', weight: 5.5, sector: '반도체 식각장비' },
      { name: 'Micron Technology', ticker: 'MU', weight: 4.9, sector: '메모리 DRAM' },
      { name: 'ASML Holding NV', ticker: 'ASML', weight: 4.5, sector: 'EUV 노광장비' },
      { name: 'KLA Corporation', ticker: 'KLAC', weight: 4.2, sector: '반도체 검사장비' },
    ]
  } else if (tickerLower === '465580' || korLower.includes('빅테크top7')) {
    // ACE 미국빅테크TOP7 Plus
    baseIndex = 'Solactive US Big Tech Top7 Plus Index'
    issuer = '한국투자신탁운용 (ACE)'
    expenseRatio = '연 0.30%'
    dividendYield = '연 0.65%'
    dividendYieldPct = 0.65
    targetUpsidePct = 21.0
    dividendFrequency = language === 'KO' ? '분기 분배' : 'Quarterly'
    currencyType = language === 'KO' ? '환노출형 (USD/KRW 환율 반영)' : 'Unhedged (USD)'
    holdings = [
      { name: 'NVIDIA Corp.', ticker: 'NVDA', weight: 15.5, sector: 'AI 가속기' },
      { name: 'Apple Inc.', ticker: 'AAPL', weight: 15.2, sector: '소비자 디바이스' },
      { name: 'Microsoft Corp.', ticker: 'MSFT', weight: 15.0, sector: '엔터프라이즈 AI' },
      { name: 'Amazon.com Inc.', ticker: 'AMZN', weight: 14.2, sector: '전자상거래' },
      { name: 'Alphabet Inc.', ticker: 'GOOGL', weight: 13.8, sector: '검색·클라우드' },
      { name: 'Meta Platforms', ticker: 'META', weight: 13.5, sector: '소셜 네트워크' },
      { name: 'Tesla Inc.', ticker: 'TSLA', weight: 12.8, sector: '자율주행·전기차' },
    ]
  } else if (tickerLower === '459580' || korLower.includes('cd금리')) {
    // KODEX CD금리액티브(합성)
    baseIndex = 'KAP CD금리 지수 (91일물)'
    issuer = '삼성자산운용 (KODEX)'
    expenseRatio = '연 0.02%'
    dividendYield = '연 3.45% (일복리 가산)'
    dividendYieldPct = 3.45
    targetUpsidePct = 3.5
    dividendFrequency = language === 'KO' ? '이자 일복리 가산 (파킹통장형)' : 'Daily Compounded'
    currencyType = language === 'KO' ? '원화 단기금리 (원금보호성)' : 'KRW Cash Equivalent'
    holdings = [
      { name: 'CD(양도성예금증서) 91일물', ticker: 'CD91', weight: 65.0, sector: '초단기 우량 금융채' },
      { name: '단기 국고채권', ticker: 'KTB', weight: 20.0, sector: '대한민국 국채' },
      { name: '한국은행 환매조건부채권(RP)', ticker: 'BOK_RP', weight: 15.0, sector: '초단기 안전자산' },
    ]
  } else if (tickerLower === '364980' || korLower.includes('2차전지')) {
    // TIGER 2차전지TOP10
    baseIndex = 'FnGuide 2차전지 TOP10 Index'
    issuer = '미래에셋자산운용 (TIGER)'
    expenseRatio = '연 0.45%'
    dividendYield = '연 0.40%'
    dividendYieldPct = 0.40
    targetUpsidePct = 26.5
    dividendFrequency = language === 'KO' ? '연 1회 분배' : 'Annually'
    currencyType = language === 'KO' ? '원화 자산' : 'KRW Local'
    holdings = [
      { name: 'LG에너지솔루션', ticker: '373220', weight: 24.5, sector: '원통형·파우치 배터리' },
      { name: 'POSCO홀딩스', ticker: '005490', weight: 21.0, sector: '리튬·양극재 원료' },
      { name: '삼성SDI', ticker: '006400', weight: 18.2, sector: '각형 배터리·전고체' },
      { name: '에코프로비엠', ticker: '247540', weight: 11.5, sector: '하이니켈 양극재' },
      { name: '포스코퓨처엠', ticker: '003670', weight: 10.2, sector: '양·음극재 소재' },
      { name: '에코프로', ticker: '086520', weight: 6.8, sector: '2차전지 지주사' },
    ]
  } else if (tickerLower === '229200' || korLower.includes('코스닥150')) {
    // KODEX 코스닥150
    baseIndex = 'KOSDAQ 150 Index'
    issuer = '삼성자산운용 (KODEX)'
    expenseRatio = '연 0.19%'
    dividendYield = '연 0.60%'
    dividendYieldPct = 0.60
    targetUpsidePct = 19.5
    dividendFrequency = language === 'KO' ? '분기 분배' : 'Quarterly'
    currencyType = language === 'KO' ? '원화 자산' : 'KRW Local'
    holdings = [
      { name: '알테오젠', ticker: '196170', weight: 9.2, sector: '피하주사 바이오플랫폼' },
      { name: '에코프로비엠', ticker: '247540', weight: 7.8, sector: '2차전지 양극재' },
      { name: '에코프로', ticker: '086520', weight: 6.5, sector: '2차전지 소재지주' },
      { name: 'HLB', ticker: '028300', weight: 4.8, sector: '항암 신약개발' },
      { name: '리가켐바이오', ticker: '141080', weight: 3.6, sector: 'ADC 항암제' },
      { name: '클래시스', ticker: '214150', weight: 3.1, sector: '피부 미용의료기기' },
      { name: '엔켐', ticker: '348370', weight: 2.8, sector: '2차전지 전해액' },
    ]
  } else if (tickerLower === '104580' || korLower.includes('고배당주')) {
    // PLUS 고배당주
    baseIndex = 'FnGuide 고배당주 지수'
    issuer = '한화자산운용 (PLUS)'
    expenseRatio = '연 0.23%'
    dividendYield = '연 5.80% (월배당)'
    dividendYieldPct = 5.80
    targetUpsidePct = 11.5
    dividendFrequency = language === 'KO' ? '월배당 (매월 지급)' : 'Monthly'
    currencyType = language === 'KO' ? '원화 자산' : 'KRW Local'
    holdings = [
      { name: '우리금융지주', ticker: '316140', weight: 8.5, sector: '금융·은행' },
      { name: '하나금융지주', ticker: '086790', weight: 8.2, sector: '금융·은행' },
      { name: 'KT&G', ticker: '033780', weight: 7.8, sector: '필수소비재·배당' },
      { name: '기업은행', ticker: '024110', weight: 7.2, sector: '국책은행·고배당' },
      { name: 'SK텔레콤', ticker: '017670', weight: 6.9, sector: '통신 서비스' },
      { name: '삼성카드', ticker: '029780', weight: 6.1, sector: '신용카드·금융' },
    ]
  }

  // ----------------------------------------------------------------------
  // 2. 미국 시장 (NYSE / NASDAQ 상장 글로벌 대표 ETF)
  // ----------------------------------------------------------------------
  else if (tickerLower === 'spy' || tickerLower === 'voo' || tickerLower === 'ivv') {
    // SPY / VOO
    baseIndex = 'S&P 500 Index'
    issuer = tickerLower === 'spy' ? 'State Street Global (SPDR)' : 'Vanguard'
    expenseRatio = tickerLower === 'spy' ? '0.0945%' : '0.03%'
    dividendYield = '연 1.45%'
    dividendYieldPct = 1.45
    targetUpsidePct = 14.5
    dividendFrequency = language === 'KO' ? '분기 분배 (3, 6, 9, 12월)' : 'Quarterly'
    currencyType = language === 'KO' ? '미국 달러(USD) 직접투자' : 'USD Direct'
    holdings = [
      { name: 'Microsoft Corp.', ticker: 'MSFT', weight: 7.2, sector: '클라우드·AI' },
      { name: 'Apple Inc.', ticker: 'AAPL', weight: 6.9, sector: '스마트 디바이스' },
      { name: 'NVIDIA Corp.', ticker: 'NVDA', weight: 6.5, sector: 'GPU 가속기' },
      { name: 'Amazon.com Inc.', ticker: 'AMZN', weight: 3.8, sector: '전자상거래' },
      { name: 'Meta Platforms', ticker: 'META', weight: 2.6, sector: '소셜미디어' },
      { name: 'Alphabet Inc. (Class A)', ticker: 'GOOGL', weight: 2.3, sector: '검색·클라우드' },
      { name: 'Berkshire Hathaway', ticker: 'BRK.B', weight: 1.8, sector: '금융·지주' },
      { name: 'Eli Lilly and Co.', ticker: 'LLY', weight: 1.6, sector: '바이오·제약' },
    ]
  } else if (tickerLower === 'qqq' || tickerLower === 'qqqm') {
    // QQQ
    baseIndex = 'NASDAQ-100 Index'
    issuer = 'Invesco'
    expenseRatio = tickerLower === 'qqq' ? '0.20%' : '0.15%'
    dividendYield = '연 0.65%'
    dividendYieldPct = 0.65
    targetUpsidePct = 18.5
    dividendFrequency = language === 'KO' ? '분기 분배 (3, 6, 9, 12월)' : 'Quarterly'
    currencyType = language === 'KO' ? '미국 달러(USD) 직접투자' : 'USD Direct'
    holdings = [
      { name: 'Apple Inc.', ticker: 'AAPL', weight: 8.9, sector: '스마트 디바이스' },
      { name: 'Microsoft Corp.', ticker: 'MSFT', weight: 8.4, sector: '소프트웨어·클라우드' },
      { name: 'NVIDIA Corp.', ticker: 'NVDA', weight: 7.8, sector: 'AI 가속기' },
      { name: 'Amazon.com Inc.', ticker: 'AMZN', weight: 5.2, sector: '전자상거래' },
      { name: 'Meta Platforms', ticker: 'META', weight: 4.8, sector: '소셜미디어' },
      { name: 'Alphabet Inc. (Class A)', ticker: 'GOOGL', weight: 4.5, sector: '검색엔진' },
      { name: 'Broadcom Inc.', ticker: 'AVGO', weight: 4.1, sector: '통신 반도체' },
      { name: 'Tesla Inc.', ticker: 'TSLA', weight: 3.2, sector: '전기차·로봇' },
    ]
  } else if (tickerLower === 'schd') {
    // SCHD
    baseIndex = 'Dow Jones U.S. Dividend 100 Index'
    issuer = 'Charles Schwab'
    expenseRatio = '0.06%'
    dividendYield = '연 3.65%'
    dividendYieldPct = 3.65
    targetUpsidePct = 11.5
    dividendFrequency = language === 'KO' ? '분기 분배 (3, 6, 9, 12월)' : 'Quarterly'
    currencyType = language === 'KO' ? '미국 달러(USD) 직접투자' : 'USD Direct'
    holdings = [
      { name: 'AbbVie Inc.', ticker: 'ABBV', weight: 4.6, sector: '면역질환 신약' },
      { name: 'Amgen Inc.', ticker: 'AMGN', weight: 4.4, sector: '생명공학' },
      { name: 'Chevron Corp.', ticker: 'CVX', weight: 4.2, sector: '석유·에너지' },
      { name: 'Texas Instruments', ticker: 'TXN', weight: 4.0, sector: '아날로그 반도체' },
      { name: 'Lockheed Martin', ticker: 'LMT', weight: 3.9, sector: '방위산업' },
      { name: 'Coca-Cola Co.', ticker: 'KO', weight: 3.8, sector: '필수소비재' },
      { name: 'Pfizer Inc.', ticker: 'PFE', weight: 3.6, sector: '제약' },
      { name: 'Cisco Systems', ticker: 'CSCO', weight: 3.5, sector: '통신 장비' },
    ]
  } else if (tickerLower === 'soxx' || tickerLower === 'smh') {
    // SOXX
    baseIndex = 'PHLX Semiconductor Sector Index'
    issuer = 'BlackRock (iShares)'
    expenseRatio = '0.35%'
    dividendYield = '연 0.85%'
    dividendYieldPct = 0.85
    targetUpsidePct = 23.5
    dividendFrequency = language === 'KO' ? '분기 분배' : 'Quarterly'
    currencyType = language === 'KO' ? '미국 달러(USD) 직접투자' : 'USD Direct'
    holdings = [
      { name: 'NVIDIA Corp.', ticker: 'NVDA', weight: 9.8, sector: 'AI 가속기 칩' },
      { name: 'Broadcom Inc.', ticker: 'AVGO', weight: 8.9, sector: '통신 커스텀 ASIC' },
      { name: 'Qualcomm Inc.', ticker: 'QCOM', weight: 6.8, sector: '모바일 AP' },
      { name: 'Advanced Micro Devices', ticker: 'AMD', weight: 6.2, sector: 'CPU·서버 GPU' },
      { name: 'Applied Materials', ticker: 'AMAT', weight: 5.5, sector: '반도체 식각장비' },
      { name: 'Micron Technology', ticker: 'MU', weight: 4.9, sector: '메모리 DRAM' },
      { name: 'ASML Holding NV', ticker: 'ASML', weight: 4.5, sector: 'EUV 노광장비' },
    ]
  } else if (tickerLower === 'vti') {
    // VTI
    baseIndex = 'CRSP US Total Market Index'
    issuer = 'Vanguard'
    expenseRatio = '0.03%'
    dividendYield = '연 1.48%'
    dividendYieldPct = 1.48
    targetUpsidePct = 14.0
    dividendFrequency = language === 'KO' ? '분기 분배' : 'Quarterly'
    currencyType = language === 'KO' ? '미국 달러(USD) 직접투자' : 'USD Direct'
    holdings = [
      { name: 'Microsoft Corp.', ticker: 'MSFT', weight: 6.4, sector: '소프트웨어' },
      { name: 'Apple Inc.', ticker: 'AAPL', weight: 6.1, sector: '소비자 가전' },
      { name: 'NVIDIA Corp.', ticker: 'NVDA', weight: 5.8, sector: 'AI 칩' },
      { name: 'Amazon.com Inc.', ticker: 'AMZN', weight: 3.3, sector: '전자상거래' },
      { name: 'Meta Platforms', ticker: 'META', weight: 2.3, sector: 'SNS' },
      { name: 'Alphabet Inc.', ticker: 'GOOGL', weight: 2.0, sector: '검색' },
      { name: 'Berkshire Hathaway', ticker: 'BRK.B', weight: 1.6, sector: '금융지주' },
    ]
  } else if (tickerLower === 'jepi' || tickerLower === 'jepq') {
    // JEPI
    baseIndex = 'S&P 500 Covered Call Strategy'
    issuer = 'JPMorgan Chase'
    expenseRatio = '0.35%'
    dividendYield = '연 7.65% (고배당)'
    dividendYieldPct = 7.65
    targetUpsidePct = 8.5
    dividendFrequency = language === 'KO' ? '월배당 (매월 초 지급)' : 'Monthly Payout'
    currencyType = language === 'KO' ? '미국 달러(USD) 직접투자' : 'USD Direct'
    holdings = [
      { name: 'ELN (Equity Linked Notes)', ticker: 'ELN', weight: 15.2, sector: '콜옵션 프리미엄 파생자산' },
      { name: 'Trane Technologies', ticker: 'TT', weight: 1.8, sector: '공조·냉난방 기기' },
      { name: 'Progressive Corp.', ticker: 'PGR', weight: 1.7, sector: '자동차 보험' },
      { name: 'AbbVie Inc.', ticker: 'ABBV', weight: 1.6, sector: '제약' },
      { name: 'Southern Co.', ticker: 'SO', weight: 1.6, sector: '유틸리티 전력' },
      { name: 'Mastercard Inc.', ticker: 'MA', weight: 1.5, sector: '결제 네트워크' },
    ]
  } else if (tickerLower === 'xlk') {
    // XLK
    baseIndex = 'Technology Select Sector Index'
    issuer = 'State Street Global (SPDR)'
    expenseRatio = '0.09%'
    dividendYield = '연 0.65%'
    dividendYieldPct = 0.65
    targetUpsidePct = 20.5
    dividendFrequency = language === 'KO' ? '분기 분배' : 'Quarterly'
    currencyType = language === 'KO' ? '미국 달러(USD) 직접투자' : 'USD Direct'
    holdings = [
      { name: 'NVIDIA Corp.', ticker: 'NVDA', weight: 19.5, sector: 'AI 가속기' },
      { name: 'Microsoft Corp.', ticker: 'MSFT', weight: 18.8, sector: '소프트웨어' },
      { name: 'Apple Inc.', ticker: 'AAPL', weight: 15.2, sector: '스마트폰' },
      { name: 'Broadcom Inc.', ticker: 'AVGO', weight: 5.2, sector: '통신 반도체' },
      { name: 'Qualcomm Inc.', ticker: 'QCOM', weight: 3.1, sector: '모바일 칩' },
      { name: 'AMD', ticker: 'AMD', weight: 2.8, sector: '서버 프로세서' },
    ]
  } else if (tickerLower === 'tlt') {
    // TLT
    baseIndex = 'ICE U.S. Treasury 20+ Year Bond Index'
    issuer = 'BlackRock (iShares)'
    expenseRatio = '0.15%'
    dividendYield = '연 3.95% (월배당)'
    dividendYieldPct = 3.95
    targetUpsidePct = 16.0
    dividendFrequency = language === 'KO' ? '월배당 (매월 국채이자 지급)' : 'Monthly'
    currencyType = language === 'KO' ? '미국 장기 국채 (안전자산)' : 'USD US Treasury'
    holdings = [
      { name: '미국 재무부 30년물 국채 (2054 만기)', ticker: 'US_TREASURY_30Y', weight: 28.5, sector: '미국 국가신용 국채' },
      { name: '미국 재무부 25년물 국채 (2049 만기)', ticker: 'US_TREASURY_25Y', weight: 25.0, sector: '미국 국가신용 국채' },
      { name: '미국 재무부 20년물 국채 (2044 만기)', ticker: 'US_TREASURY_20Y', weight: 24.2, sector: '미국 국가신용 국채' },
      { name: '미국 재무부 단기 현금 RP', ticker: 'US_CASH_RP', weight: 22.3, sector: '초단기 유동성' },
    ]
  } else if (tickerLower === 'gld') {
    // GLD
    baseIndex = 'LBMA Gold Price PM'
    issuer = 'State Street Global (SPDR)'
    expenseRatio = '0.40%'
    dividendYield = '0.00% (원자재)'
    dividendYieldPct = 0.00
    targetUpsidePct = 13.5
    dividendFrequency = language === 'KO' ? '분배금 없음 (순수 금 실물)' : 'None (Physical Gold)'
    currencyType = language === 'KO' ? '런던 금고 보관 실물 금(Gold)' : 'Allocated Gold Bullion'
    holdings = [
      { name: '런던 HSBC/JP모건 금고 100% 실물 골드바', ticker: 'PHYSICAL_GOLD_BAR', weight: 100.0, sector: '순도 99.5% 런던 금 실물' },
    ]
  }

  // ----------------------------------------------------------------------
  // 3. 베트남 시장 (HOSE 상장 및 글로벌 베트남 대표 ETF)
  // ----------------------------------------------------------------------
  else if (tickerLower === 'fuevfvnd' || korLower.includes('다이아몬드')) {
    // FUEVFVND (VFMVN Diamond ETF) - 베트남 1위 ETF
    baseIndex = 'VN DIAMOND Index'
    issuer = 'Dragon Capital (DCVFM)'
    expenseRatio = '연 0.65%'
    dividendYield = '연 2.20%'
    dividendYieldPct = 2.20
    targetUpsidePct = 22.5
    dividendFrequency = language === 'KO' ? '연 1회 분배' : 'Annually'
    currencyType = language === 'KO' ? '베트남 동(VND) 직접투자' : 'VND Local'
    holdings = [
      { name: 'FPT Corporation (IT 대장주)', ticker: 'FPT', weight: 15.5, sector: '소프트웨어 수출·AI' },
      { name: 'Mobile World Corp (유통 1위)', ticker: 'MWG', weight: 14.2, sector: '가전·마트 유통' },
      { name: 'Techcombank (민간 1위 은행)', ticker: 'TCB', weight: 9.8, sector: '상업은행·금융' },
      { name: 'PNJ (베트남 1위 주얼리)', ticker: 'PNJ', weight: 8.5, sector: '귀금속·소비재' },
      { name: 'ACB (아시아상업은행)', ticker: 'ACB', weight: 8.0, sector: '우량 상업은행' },
      { name: 'Ree Corp (인프라·에너지)', ticker: 'REE', weight: 6.5, sector: '신재생에너지·건설' },
      { name: 'MBBank (군대은행)', ticker: 'MBB', weight: 6.2, sector: '디지털 금융' },
    ]
  } else if (tickerLower === 'e1vfvn30' || (tickerLower.includes('vn30') && !tickerLower.includes('kim'))) {
    // E1VFVN30 (VFMVN30 ETF)
    baseIndex = 'VN30 Index'
    issuer = 'Dragon Capital (DCVFM)'
    expenseRatio = '연 0.65%'
    dividendYield = '연 2.45%'
    dividendYieldPct = 2.45
    targetUpsidePct = 18.0
    dividendFrequency = language === 'KO' ? '연 1회 분배' : 'Annually'
    currencyType = language === 'KO' ? '베트남 동(VND) 직접투자' : 'VND Local'
    holdings = [
      { name: 'FPT Corporation', ticker: 'FPT', weight: 9.8, sector: 'IT·통신' },
      { name: 'Vietcombank', ticker: 'VCB', weight: 8.5, sector: '국영 1위 은행' },
      { name: 'Hoa Phat Group (철강 1위)', ticker: 'HPG', weight: 8.2, sector: '철강·제조' },
      { name: 'Vingroup', ticker: 'VIC', weight: 6.8, sector: '부동산·전기차' },
      { name: 'Techcombank', ticker: 'TCB', weight: 6.5, sector: '민간은행' },
      { name: 'Vinamilk (유제품 1위)', ticker: 'VNM', weight: 6.0, sector: '필수소비재' },
      { name: 'Vinhomes', ticker: 'VHM', weight: 5.5, sector: '주택 부동산 개발' },
      { name: 'Mobile World Corp', ticker: 'MWG', weight: 4.8, sector: '전자·유통' },
    ]
  } else if (tickerLower === 'fuessvfl') {
    // FUESSVFL (SSIAM VN FIN LEAD ETF)
    baseIndex = 'VN FINANCIAL LEAD Index'
    issuer = 'SSI Asset Management'
    expenseRatio = '연 0.70%'
    dividendYield = '연 2.80%'
    dividendYieldPct = 2.80
    targetUpsidePct = 24.0
    dividendFrequency = language === 'KO' ? '연 1회 분배' : 'Annually'
    currencyType = language === 'KO' ? '베트남 동(VND)' : 'VND Local'
    holdings = [
      { name: 'Techcombank', ticker: 'TCB', weight: 15.0, sector: '민간 금융' },
      { name: 'Vietcombank', ticker: 'VCB', weight: 14.5, sector: '국영 은행' },
      { name: 'MBBank', ticker: 'MBB', weight: 12.8, sector: '소매 금융' },
      { name: 'ACB Bank', ticker: 'ACB', weight: 11.2, sector: '상업은행' },
      { name: 'VPBank', ticker: 'VPB', weight: 10.5, sector: '소비자 금융' },
      { name: 'SSI Securities', ticker: 'SSI', weight: 8.5, sector: '1위 증권사' },
      { name: 'VNDIRECT', ticker: 'VND', weight: 6.2, sector: '온라인 증권' },
    ]
  } else if (tickerLower === 'fuessv30') {
    // FUESSV30 (SSIAM VN30)
    baseIndex = 'VN30 Index'
    issuer = 'SSI Asset Management'
    expenseRatio = '연 0.55%'
    dividendYield = '연 2.30%'
    dividendYieldPct = 2.30
    targetUpsidePct = 17.5
    dividendFrequency = language === 'KO' ? '연 1회 분배' : 'Annually'
    currencyType = language === 'KO' ? '베트남 동(VND)' : 'VND Local'
    holdings = [
      { name: 'FPT Corporation', ticker: 'FPT', weight: 9.5, sector: 'IT' },
      { name: 'Hoa Phat Group', ticker: 'HPG', weight: 8.4, sector: '철강' },
      { name: 'Vietcombank', ticker: 'VCB', weight: 8.1, sector: '은행' },
      { name: 'Techcombank', ticker: 'TCB', weight: 6.8, sector: '은행' },
      { name: 'Vinamilk', ticker: 'VNM', weight: 6.2, sector: '식음료' },
    ]
  } else if (tickerLower === 'fuemav30') {
    // FUEMAV30 (Mirae Asset VN30)
    baseIndex = 'VN30 Index'
    issuer = 'Mirae Asset Vietnam'
    expenseRatio = '연 0.50%'
    dividendYield = '연 2.30%'
    dividendYieldPct = 2.30
    targetUpsidePct = 17.5
    dividendFrequency = language === 'KO' ? '연 1회 분배' : 'Annually'
    currencyType = language === 'KO' ? '베트남 동(VND)' : 'VND Local'
    holdings = [
      { name: 'FPT Corporation', ticker: 'FPT', weight: 9.6, sector: 'IT' },
      { name: 'Hoa Phat Group', ticker: 'HPG', weight: 8.3, sector: '철강' },
      { name: 'Vietcombank', ticker: 'VCB', weight: 8.0, sector: '은행' },
      { name: 'Techcombank', ticker: 'TCB', weight: 6.9, sector: '은행' },
    ]
  } else if (tickerLower === 'fuevn100') {
    // FUEVN100 (VinaCapital VN100)
    baseIndex = 'VN100 Index'
    issuer = 'VinaCapital'
    expenseRatio = '연 0.67%'
    dividendYield = '연 2.10%'
    dividendYieldPct = 2.10
    targetUpsidePct = 19.0
    dividendFrequency = language === 'KO' ? '연 1회 분배' : 'Annually'
    currencyType = language === 'KO' ? '베트남 동(VND)' : 'VND Local'
    holdings = [
      { name: 'FPT Corporation', ticker: 'FPT', weight: 8.2, sector: 'IT' },
      { name: 'Hoa Phat Group', ticker: 'HPG', weight: 7.5, sector: '철강' },
      { name: 'Techcombank', ticker: 'TCB', weight: 6.2, sector: '은행' },
      { name: 'Gemadept (항만 1위)', ticker: 'GMD', weight: 4.1, sector: '항만 물류' },
    ]
  } else if (tickerLower === 'fuessv50') {
    // FUESSV50 (SSIAM VNX50)
    baseIndex = 'VNX50 Index (호치민+하노이 통합 50)'
    issuer = 'SSI Asset Management'
    expenseRatio = '연 0.60%'
    dividendYield = '연 2.20%'
    dividendYieldPct = 2.20
    targetUpsidePct = 18.5
    dividendFrequency = language === 'KO' ? '연 1회 분배' : 'Annually'
    currencyType = language === 'KO' ? '베트남 동(VND)' : 'VND Local'
    holdings = [
      { name: 'FPT Corporation', ticker: 'FPT', weight: 9.0, sector: 'IT' },
      { name: 'Hoa Phat Group', ticker: 'HPG', weight: 8.1, sector: '철강' },
      { name: 'Vietcombank', ticker: 'VCB', weight: 7.8, sector: '은행' },
    ]
  } else if (tickerLower === 'fueip100') {
    // FUEIP100 (IPAAM VN100)
    baseIndex = 'VN100 Index'
    issuer = 'IPA Asset Management (VNDIRECT)'
    expenseRatio = '연 0.60%'
    dividendYield = '연 2.05%'
    dividendYieldPct = 2.05
    targetUpsidePct = 18.5
    dividendFrequency = language === 'KO' ? '연 1회 분배' : 'Annually'
    currencyType = language === 'KO' ? '베트남 동(VND)' : 'VND Local'
    holdings = [
      { name: 'FPT Corporation', ticker: 'FPT', weight: 8.5, sector: 'IT' },
      { name: 'Hoa Phat Group', ticker: 'HPG', weight: 7.8, sector: '철강' },
      { name: 'Techcombank', ticker: 'TCB', weight: 6.5, sector: '은행' },
    ]
  } else if (tickerLower === 'vnm' && stock.country === 'US') {
    // VNM (VanEck Vietnam ETF - 미국 거래소 상장)
    baseIndex = 'MVIS Vietnam Index'
    issuer = 'VanEck'
    expenseRatio = '0.59%'
    dividendYield = '연 1.85%'
    dividendYieldPct = 1.85
    targetUpsidePct = 21.0
    dividendFrequency = language === 'KO' ? '연 1회 분배' : 'Annually'
    currencyType = language === 'KO' ? '미국 달러(USD) 직접투자' : 'USD Direct'
    holdings = [
      { name: 'Vinamilk', ticker: 'VNM', weight: 7.8, sector: '식음료' },
      { name: 'Vinhomes', ticker: 'VHM', weight: 7.2, sector: '부동산' },
      { name: 'Vingroup', ticker: 'VIC', weight: 6.9, sector: '복합 대기업' },
      { name: 'Hoa Phat Group', ticker: 'HPG', weight: 6.5, sector: '철강' },
      { name: 'Vietcombank', ticker: 'VCB', weight: 5.8, sector: '은행' },
    ]
  } else if (tickerLower === 'fuekiv30') {
    // FUEKIV30 (KIM Growth VN30 ETF)
    baseIndex = 'VN30 Index'
    issuer = '한국투자신탁운용 (KIM Vietnam)'
    expenseRatio = '연 0.50%'
    dividendYield = '연 2.30%'
    dividendYieldPct = 2.30
    targetUpsidePct = 18.0
    dividendFrequency = language === 'KO' ? '연 1회 분배' : 'Annually'
    currencyType = language === 'KO' ? '베트남 동(VND)' : 'VND Local'
    holdings = [
      { name: 'FPT Corporation', ticker: 'FPT', weight: 9.8, sector: 'IT' },
      { name: 'Hoa Phat Group', ticker: 'HPG', weight: 8.4, sector: '철강' },
      { name: 'Vietcombank', ticker: 'VCB', weight: 8.2, sector: '은행' },
      { name: 'Techcombank', ticker: 'TCB', weight: 6.9, sector: '은행' },
    ]
  } else {
    // Fallback for custom added ETFs
    baseIndex = `${stock.name || stock.ticker} Index`
    issuer = stock.country === 'KR' ? '국내 대표 자산운용사' : stock.country === 'VN' ? '베트남 자산운용사' : 'Global ETF Sponsor'
    expenseRatio = '연 0.15%'
    dividendYield = '연 1.80%'
    dividendYieldPct = 1.80
    targetUpsidePct = 15.0
    dividendFrequency = language === 'KO' ? '분기 분배' : 'Quarterly'
    currencyType = stock.country === 'KR' ? 'KRW' : stock.country === 'VN' ? 'VND' : 'USD'
    holdings = [
      { name: 'Top Asset 1', ticker: 'Asset 1', weight: 12.5, sector: '핵심 우량 자산' },
      { name: 'Top Asset 2', ticker: 'Asset 2', weight: 10.2, sector: '성장 자산' },
      { name: 'Top Asset 3', ticker: 'Asset 3', weight: 8.5, sector: '대표 가치 자산' },
      { name: 'Top Asset 4', ticker: 'Asset 4', weight: 7.1, sector: '배당 자산' },
      { name: 'Top Asset 5', ticker: 'Asset 5', weight: 5.8, sector: '인프라 자산' },
    ]
  }

  const disparityPct = 0.30
  const nav = stock.nav || Math.round(currentPrice * (1 - disparityPct / 100))
  const targetPrice1Y = Math.round(currentPrice * (1 + targetUpsidePct / 100))

  return {
    isEtf: true,
    baseIndex,
    issuer,
    expenseRatio,
    dividendYield,
    dividendYieldPct,
    dividendFrequency,
    currencyType,
    nav,
    disparityPct,
    targetUpsidePct,
    targetPrice1Y,
    holdings
  }
}
