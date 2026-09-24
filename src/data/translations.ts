export type Language = 'KO' | 'EN' | 'VI';

export const TRANSLATIONS = {
  KO: {
    // Navigation
    dashboard: '대시보드',
    watchlist: '관심 종목',
    stocktemp: '주식온도',
    
    // Dashboard
    heroTitle: '고평가·저평가를 알면, 종목의 다음 계절이 보입니다',
    heroDesc: '기업 재무데이터를 AI가 분석하여 고평가·저평가 상태를 5단계 계절(체감온도)로 진단합니다. 누구나 종목을 직접 등록해 체감온도를 확인하고 의견을 나눌 수 있는 오픈 밸류에이션 플랫폼입니다.',
    marketSeasonsTitle: '국가별 시장 계절',
    marketSeasonsDesc: '글로벌 주요 증시의 고평가·저평가 흐름을 5단계 계절 온도로 한눈에 파악합니다.',
    heroCommunityTitle: '100% 무료 & 유저 참여형 플랫폼',
    heroCommunityDesc: '종목 추가 시 AI가 고평가·저평가 상태를 실시간으로 즉시 분석해 드립니다. 누구나 자유롭게 관심 종목을 등록하고, 투표와 의견을 나눠 시장의 체감 온도를 함께 완성해 보세요. (100% 무료)',
    heroBadgeFree: '100% 무료 개방',
    heroBadgeAddStock: '직접 종목 등록',
    heroBadgeVote: '집단지성 투표 & 의견',
    kospi: 'KOSPI',
    kosdaq: 'KOSDAQ',
    sp500: 'S&P 500',
    nasdaq: 'NASDAQ',
    shanghai: '상해 종합',
    shenzhen: '심천 성분',
    hangseng: '항셍 지수',
    vnindex: 'VN-INDEX',
    hnx: 'HNX Index',
    nikkei: '닛케이 225',
    searchPlaceholder: '종목명, 초성 또는 종목코드로 검색하세요...',
    searchResults: '검색 결과',
    searchEmpty: '검색된 종목이 없습니다. 철자가 정확한지 확인해 주세요.',
    coldestStocks: '저평가 종목',
    hottestStocks: '고평가 종목',
    tempUnder20: '온도 20°C 미만 (저평가)',
    tempOver20: '온도 20°C 초과 (고평가)',
    emptyColdList: '저평가 종목이 존재하지 않거나 필터링되었습니다.',
    emptyHotList: '고평가 종목이 존재하지 않거나 필터링되었습니다.',
    currentPrice: '현재 주가',
    expectedReturn: '기대 수익률',
    fairPrice: '적정 주가',
    industry: '산업군',
    country: '국가',
    all: '전체',
    korea: '한국',
    usa: '미국',
    vietnam: '베트남',
    china: '중국',

    // Stock Detail
    stockNotFound: '종목을 찾을 수 없습니다.',
    backToDashboard: '대시보드로 돌아가기',
    addWatchlist: '관심 등록',
    removeWatchlist: '관심 해제',
    currentStockTemp: '현재 주식 온도',
    valuationCalc: '가치 계산 및 시뮬레이션',
    livePriceFeed: '실시간 변동',
    targetPeSlider: '목표 P/E 멀티플 (적정 배수)',
    conservative: '보수적 (5배)',
    fair: '적정 (15배)',
    aggressive: '공격적 (45배)',
    priceSimulator: '인위적 주가 조절 (테스트용)',
    liveStreaming: '실시간 데이터 스트리밍',
    tradingviewChart: '트레이딩뷰 실시간 차트',
    eps: '주당순이익 (EPS)',
    pe: '주가수익비율 (P/E)',
    roe: 'ROE',
    pbr: 'PBR',
    debtRatio: '부채비율',
    investValueMultiplier: '투자 가치 배율',
    undervaluedText: '저평가',
    overvaluedText: '고평가',
    relativeToCurrent: '현재 대비',
    times: '배',
    baseInterestRate: '기준 금리',
    quarterlyRevenueEps: '분기 매출 및 EPS 추이',
    quarterlyBps: '분기 BPS 추이',
    consensusVsFair: '목표가 vs 적정가 비교',
    latestNews: 'AI 투자 핵심 분석',
    analystTarget: '증권사 목표주가',
    analysisView: '분석형',
    intuitiveView: '직관형',
    surplusInterest: '이자보다 수혜 여유',
    deficitInterest: '이자보다 수혜 부족',
    recentViewed: '최근 본 종목',
    noConsensusData: '데이터 없음',

    // Watchlist
    watchlistTitle: '관심 종목',
    watchlistDesc: '내가 추가한 주식과 실시간 온도를 모아서 모니터링합니다.',
    emptyWatchlist: '관심 등록된 종목이 없습니다.',
    emptyWatchlistDesc: '대시보드에서 분석하고자 하는 종목을 검색하고 별표를 눌러 관심 종목에 추가해 보세요.',
    goToSearch: '주식 검색하러 가기',

    // Temperature details
    tempFreezingLabel: '극저평가 (겨울)',
    tempFreezingDesc: '기업 펀더멘털 대비 주가가 통계적 최하단(영하권)에 머물러 있는 상태입니다.',
    tempCoolLabel: '저평가 (봄)',
    tempCoolDesc: '역사적 밸류에이션 평균치 대비 상대적 저평가 영역에 위치한 상태입니다.',
    tempNormalLabel: '가을 (적정가)',
    tempNormalDesc: '가을철 쾌적한 평년 기온처럼 기업의 실적 및 자산가치와 시장 멀티플이 조화롭게 부합하는 균형 구간입니다.',
    tempWarmLabel: '고평가 (여름)',
    tempWarmDesc: '밸류에이션 지표가 역사적 평균 상단에 진입하여 과열 영역에 위치한 상태입니다.',
    tempHotLabel: '극고평가 (한여름)',
    tempHotDesc: '역사적 밸류에이션 밴드 상단을 크게 초과하여 통계적 최상단에 도달한 상태입니다.',
  },

  EN: {
    // Navigation
    dashboard: 'Dashboard',
    watchlist: 'Watchlist',
    stocktemp: 'StockTemp',

    // Dashboard
    heroTitle: "Know the Valuation, See the Stock's Next Season",
    heroDesc: 'AI analyzes corporate financial data to diagnose overvalued and undervalued states as 5 seasonal temperatures. An open valuation platform where anyone can register stocks, check temperatures, and share insights.',
    marketSeasonsTitle: 'Market Seasons by Country',
    marketSeasonsDesc: 'Quickly grasp the valuation trends of major global markets with 5 seasonal temperatures.',
    heroCommunityTitle: '100% Free & Community-Driven Platform',
    heroCommunityDesc: 'When you add a stock, AI instantly analyzes its valuation status in real time. Feel free to register any stock, vote, and share your thoughts to gauge the true market temperature. (100% Free)',
    heroBadgeFree: '100% Free',
    heroBadgeAddStock: 'Register Stocks',
    heroBadgeVote: 'Community Votes & Opinions',
    kospi: 'KOSPI',
    kosdaq: 'KOSDAQ',
    sp500: 'S&P 500',
    nasdaq: 'NASDAQ',
    shanghai: 'Shanghai',
    shenzhen: 'Shenzhen',
    hangseng: 'Hang Seng',
    vnindex: 'VN-INDEX',
    hnx: 'HNX Index',
    nikkei: 'Nikkei 225',
    searchPlaceholder: 'Search by ticker, English or Korean name...',
    searchResults: 'Search Results',
    searchEmpty: 'No stocks found. Please check your spelling.',
    coldestStocks: 'Undervalued Stocks',
    hottestStocks: 'Overvalued Stocks',
    tempUnder20: 'Temp under 20°C (Undervalued)',
    tempOver20: 'Temp over 20°C (Overvalued)',
    emptyColdList: 'No undervalued stocks found.',
    emptyHotList: 'No overvalued stocks found.',
    currentPrice: 'Current Price',
    expectedReturn: 'Expected Return',
    fairPrice: 'Fair Value',
    industry: 'Industry',
    country: 'Country',
    all: 'All',
    korea: 'Korea',
    usa: 'USA',
    vietnam: 'Vietnam',
    china: 'China',

    // Stock Detail
    stockNotFound: 'Stock not found.',
    backToDashboard: 'Back to Dashboard',
    addWatchlist: 'Add Watchlist',
    removeWatchlist: 'Saved',
    currentStockTemp: 'Current Stock Temperature',
    valuationCalc: 'Valuation & Simulation',
    livePriceFeed: 'Live Feed',
    targetPeSlider: 'Target P/E Multiple',
    conservative: 'Conservative (5x)',
    fair: 'Fair (15x)',
    aggressive: 'Aggressive (45x)',
    priceSimulator: 'Price Simulation',
    liveStreaming: 'Live Streaming Data',
    tradingviewChart: 'TradingView Real-Time Chart',
    eps: 'Earnings Per Share (EPS)',
    pe: 'P/E Ratio',
    roe: 'ROE',
    pbr: 'PBR',
    debtRatio: 'Debt Ratio',
    investValueMultiplier: 'Investment Multiplier',
    undervaluedText: 'Undervalued',
    overvaluedText: 'Overvalued',
    relativeToCurrent: 'vs Current',
    times: 'x',
    baseInterestRate: 'Base Interest Rate',
    quarterlyRevenueEps: 'Quarterly Revenue & EPS',
    quarterlyBps: 'Quarterly BPS Trend',
    consensusVsFair: 'Target vs Fair Price',
    latestNews: 'AI Investment Analysis',
    analystTarget: 'Analyst Target Price',
    analysisView: 'Analysis',
    intuitiveView: 'Intuitive',
    surplusInterest: 'Surplus over Interest',
    deficitInterest: 'Deficit under Interest',
    recentViewed: 'Recently Viewed',
    noConsensusData: 'No Data',

    // Watchlist
    watchlistTitle: 'Watchlist',
    watchlistDesc: 'Monitor real-time temperatures for your tracked stocks.',
    emptyWatchlist: 'Your watchlist is empty.',
    emptyWatchlistDesc: 'Search for stocks on the dashboard and click the star to track them.',
    goToSearch: 'Search Stocks',

    // Temperature details
    tempFreezingLabel: 'Deep Undervalued (Winter)',
    tempFreezingDesc: 'Stock price is positioned at the statistical lower bound relative to financial fundamentals.',
    tempCoolLabel: 'Undervalued (Spring)',
    tempCoolDesc: 'Trading below historical average valuation multiples relative to corporate earnings.',
    tempNormalLabel: 'Fair Value (Autumn)',
    tempNormalDesc: 'Balanced valuation zone statistically aligned with corporate earnings and asset value.',
    tempWarmLabel: 'Overvalued (Summer)',
    tempWarmDesc: 'Valuation multiples are entering upper statistical bands above historic averages.',
    tempHotLabel: 'Deep Overvalued (Hot Summer)',

    tempHotDesc: 'Trading significantly beyond the upper boundaries of historical valuation models.',
  },

  VI: {
    // Navigation
    dashboard: 'Bảng điều khiển',
    watchlist: 'Mục theo dõi',
    stocktemp: 'Nhiệt độ cổ phiếu',

    // Dashboard
    heroTitle: 'Hiểu rõ định giá, nhìn thấy mùa tiếp theo của cổ phiếu',
    heroDesc: 'AI phân tích dữ liệu tài chính doanh nghiệp để chẩn đoán trạng thái định giá qua 5 thang nhiệt độ mùa vụ. Nền tảng mở cho phép mọi người tự do đăng ký mã, xem nhiệt độ và chia sẻ nhận định.',
    marketSeasonsTitle: 'Mùa thị trường theo quốc gia',
    marketSeasonsDesc: 'Nhanh chóng nắm bắt xu hướng định giá của các thị trường lớn qua 5 thang nhiệt độ mùa vụ.',
    heroCommunityTitle: '100% Miễn phí & Nền tảng do cộng đồng xây dựng',
    heroCommunityDesc: 'Khi bạn thêm mã cổ phiếu, AI sẽ phân tích tức thì trạng thái định giá theo thời gian thực. Hãy thoải mái đăng ký mã yêu thích, biểu quyết và chia sẻ nhận định để đo lường nhiệt độ thị trường. (100% Miễn phí)',
    heroBadgeFree: '100% Miễn phí',
    heroBadgeAddStock: 'Đăng ký mã cổ phiếu',
    heroBadgeVote: 'Biểu quyết & Ý kiến cộng đồng',
    kospi: 'KOSPI',
    kosdaq: 'KOSDAQ',
    sp500: 'S&P 500',
    nasdaq: 'NASDAQ',
    shanghai: 'Thượng Hải',
    shenzhen: 'Thâm Quyến',
    hangseng: 'Hằng Sinh',
    vnindex: 'VN-INDEX',
    hnx: 'HNX Index',
    nikkei: 'Nikkei 225',
    searchPlaceholder: 'Tìm kiếm theo mã cổ phiếu, tên tiếng Anh hoặc tên tiếng Hàn...',
    searchResults: 'Kết quả tìm kiếm',
    searchEmpty: 'Không tìm thấy cổ phiếu nào. Vui lòng kiểm tra lại chính tả.',
    coldestStocks: 'Cổ phiếu định giá thấp',
    hottestStocks: 'Cổ phiếu định giá cao',
    tempUnder20: 'Nhiệt độ dưới 20°C (Định giá thấp)',
    tempOver20: 'Nhiệt độ trên 20°C (Định giá cao)',
    emptyColdList: 'Không tìm thấy cổ phiếu định giá thấp nào.',
    emptyHotList: 'Không tìm thấy cổ phiếu định giá cao nào.',
    currentPrice: 'Giá hiện tại',
    expectedReturn: 'Tỷ suất sinh lời kỳ vọng',
    fairPrice: 'Giá hợp lý',
    industry: 'Ngành nghề',
    country: 'Quốc gia',
    all: 'Tất cả',
    korea: 'Hàn Quốc',
    usa: 'Mỹ',
    vietnam: 'Việt Nam',
    china: 'Trung Quốc',

    // Stock Detail
    stockNotFound: 'Không tìm thấy mã cổ phiếu.',
    backToDashboard: 'Quay lại Bảng điều khiển',
    addWatchlist: 'Theo dõi',
    removeWatchlist: 'Đã lưu',
    currentStockTemp: 'Nhiệt độ cổ phiếu hiện tại',
    valuationCalc: 'Định giá & Mô phỏng',
    livePriceFeed: 'Giá chạy trực tiếp',
    targetPeSlider: 'Chỉ số P/E mục tiêu',
    conservative: 'Thận trọng (5x)',
    fair: 'Hợp lý (15x)',
    aggressive: 'Tấn công (45x)',
    priceSimulator: 'Giả lập biến động giá',
    liveStreaming: 'Dữ liệu thời gian thực',
    tradingviewChart: 'Biểu đồ TradingView trực tiếp',
    eps: 'Thu nhập trên mỗi cổ phiếu (EPS)',
    pe: 'Chỉ số P/E',
    roe: 'ROE',
    pbr: 'PBR',
    debtRatio: 'Tỷ lệ nợ',
    investValueMultiplier: 'Hệ số giá trị đầu tư',
    undervaluedText: 'Định giá thấp',
    overvaluedText: 'Định giá cao',
    relativeToCurrent: 'So với hiện tại',
    times: 'x',
    baseInterestRate: 'Lãi suất cơ bản',
    quarterlyRevenueEps: 'Xu hướng Doanh thu & EPS quý',
    quarterlyBps: 'Xu hướng BPS quý',
    consensusVsFair: 'So sánh Giá mục tiêu & Hợp lý',
    latestNews: 'AI Phân tích Đầu tư',
    analystTarget: 'Giá mục tiêu của CTCK',
    analysisView: 'Phân tích',
    intuitiveView: 'Trực quan',
    surplusInterest: 'Dư thừa so với lãi suất',
    deficitInterest: 'Thiếu hụt so với lãi suất',
    recentViewed: 'Đã xem gần đây',
    noConsensusData: 'Không có dữ liệu',

    // Watchlist
    watchlistTitle: 'Danh sách theo dõi',
    watchlistDesc: 'Giám sát nhiệt độ thời gian thực của các cổ phiếu bạn quan tâm.',
    emptyWatchlist: 'Danh sách theo dõi của bạn trống.',
    emptyWatchlistDesc: 'Tìm kiếm cổ phiếu trên bảng điều khiển và nhấp vào biểu tượng ngôi sao để thêm vào danh sách theo dõi.',
    goToSearch: 'Tìm kiếm cổ phiếu',

    // Temperature details
    tempFreezingLabel: 'Định giá cực thấp (Mùa đông)',
    tempFreezingDesc: 'Giá cổ phiếu ở vùng đáy thống kê so với các chỉ số tài chính cơ bản.',
    tempCoolLabel: 'Định giá thấp (Mùa xuân)',
    tempCoolDesc: 'Giao dịch ở mức định giá thấp hơn so với mức trung bình lịch sử.',
    tempNormalLabel: 'Giá hợp lý (Mùa thu)',
    tempNormalDesc: 'Vùng định giá cân bằng, phù hợp với kết quả kinh doanh và giá trị tài sản.',
    tempWarmLabel: 'Định giá cao (Mùa hè)',
    tempWarmDesc: 'Các chỉ số định giá đang tiến vào vùng biên trên so với mức trung bình lịch sử.',
    tempHotLabel: 'Định giá cực cao (Giữa hè)',
    tempHotDesc: 'Đang giao dịch vượt xa giới hạn trên của các mô hình định giá lịch sử.',
  },

};

export type TranslationKey = keyof typeof TRANSLATIONS.KO;

export const getCountryName = (country: string, lang: Language): string => {
  const map: Record<string, Record<Language, string>> = {
    KR: { KO: '대한민국 🇰🇷', EN: 'South Korea 🇰🇷', VI: 'Hàn Quốc 🇰🇷' },
    US: { KO: '미국 🇺🇸', EN: 'USA 🇺🇸', VI: 'Mỹ 🇺🇸' },
    VN: { KO: '베트남 🇻🇳', EN: 'Vietnam 🇻🇳', VI: 'Việt Nam 🇻🇳' },
    CN: { KO: '중국 🇨🇳', EN: 'China 🇨🇳', VI: 'Trung Quốc 🇨🇳' },
  };
  return map[country]?.[lang] || map[country]?.['EN'] || country;
};

interface IndustryDict {
  KO: string;
  EN: string;
  VI: string;
}

const INDUSTRY_MAP: Record<string, IndustryDict> = {
  "Agriculture & Food": {
    "KO": "농업 및 식품",
    "EN": "Agriculture & Food",
    "VI": "Nông nghiệp & Thực phẩm"
  },
  "Banking": {
    "KO": "은행",
    "EN": "Banking",
    "VI": "Ngân hàng"
  },
  "Basic Materials": {
    "KO": "기초 소재/원자재",
    "EN": "Basic Materials",
    "VI": "Nguyên vật liệu cơ bản"
  },
  "Beverage": {
    "KO": "음료",
    "EN": "Beverage",
    "VI": "Đồ uống"
  },
  "Building Materials & Furniture": {
    "KO": "건축자재 및 가구",
    "EN": "Building Materials & Furniture",
    "VI": "Vật liệu xây dựng & Nội thất"
  },
  "Chemicals": {
    "KO": "화학",
    "EN": "Chemicals",
    "VI": "Hóa chất"
  },
  "Conglomerate & Agriculture": {
    "KO": "복합기업 및 농업",
    "EN": "Conglomerate & Agriculture",
    "VI": "Tập đoàn & Nông nghiệp"
  },
  "Conglomerate & Real Estate": {
    "KO": "복합기업 및 부동산",
    "EN": "Conglomerate & Real Estate",
    "VI": "Tập đoàn & Bất động sản"
  },
  "Consumer Cyclical": {
    "KO": "경기소비재",
    "EN": "Consumer Cyclical",
    "VI": "Hàng tiêu dùng chu kỳ"
  },
  "Consumer Defensive": {
    "KO": "필수소비재",
    "EN": "Consumer Defensive",
    "VI": "Hàng tiêu dùng thiết yếu"
  },
  "Consumer Goods": {
    "KO": "소비재",
    "EN": "Consumer Goods",
    "VI": "Hàng tiêu dùng"
  },
  "Electrical Equipment": {
    "KO": "전력기기",
    "EN": "Electrical Equipment",
    "VI": "Thiết bị điện"
  },
  "Energy & Oil": {
    "KO": "에너지 및 정유",
    "EN": "Energy & Oil",
    "VI": "Năng lượng & Dầu khí"
  },
  "Energy Services": {
    "KO": "에너지 서비스",
    "EN": "Energy Services",
    "VI": "Dịch vụ năng lượng"
  },
  "ETF": {
    "KO": "ETF (지수·테마)",
    "EN": "ETF & Index Funds",
    "VI": "Quỹ ETF"
  },
  "ETF (지수·테마)": {
    "KO": "ETF (지수·테마)",
    "EN": "ETF & Index Funds",
    "VI": "Quỹ ETF"
  },
  "Financial Services": {
    "KO": "금융 서비스",
    "EN": "Financial Services",
    "VI": "Dịch vụ tài chính"
  },
  "Food Processing": {
    "KO": "식품 가공",
    "EN": "Food Processing",
    "VI": "Chế biến thực phẩm"
  },
  "IT & Brand Distribution": {
    "KO": "IT 및 브랜드 유통",
    "EN": "IT & Brand Distribution",
    "VI": "Phân phối CNTT & Thương hiệu"
  },
  "IT Distribution": {
    "KO": "IT 유통",
    "EN": "IT Distribution",
    "VI": "Phân phối CNTT"
  },
  "IT Services": {
    "KO": "IT 서비스",
    "EN": "IT Services",
    "VI": "Dịch vụ CNTT"
  },
  "Industrial Real Estate": {
    "KO": "산업단지 부동산",
    "EN": "Industrial Real Estate",
    "VI": "Bất động sản công nghiệp"
  },
  "Industrials": {
    "KO": "산업재",
    "EN": "Industrials",
    "VI": "Công nghiệp"
  },
  "Logistics": {
    "KO": "물류 및 운송",
    "EN": "Logistics",
    "VI": "Hậu cần & Logistics"
  },
  "Pharmaceuticals": {
    "KO": "제약",
    "EN": "Pharmaceuticals",
    "VI": "Dược phẩm"
  },
  "Real Estate": {
    "KO": "부동산",
    "EN": "Real Estate",
    "VI": "Bất động sản"
  },
  "Retail": {
    "KO": "소비재 유통",
    "EN": "Retail",
    "VI": "Bán lẻ"
  },
  "Steel & Materials": {
    "KO": "철강 및 소재",
    "EN": "Steel & Materials",
    "VI": "Thép & Vật liệu"
  },
  "Telecommunications Infrastructure": {
    "KO": "통신 인프라",
    "EN": "Telecommunications Infrastructure",
    "VI": "Hạ tầng viễn thông"
  },
  "Transportation & Aviation": {
    "KO": "항공 및 운송",
    "EN": "Transportation & Aviation",
    "VI": "Vận tải & Hàng không"
  },
  "Utilities": {
    "KO": "유틸리티/전력",
    "EN": "Utilities",
    "VI": "Tiện ích & Năng lượng"
  },
  "Utilities & EPC": {
    "KO": "유틸리티 및 EPC",
    "EN": "Utilities & EPC",
    "VI": "Tiện ích & Xây lắp EPC"
  },
  "Utilities & Gas": {
    "KO": "가스 및 유틸리티",
    "EN": "Utilities & Gas",
    "VI": "Tiện ích & Khí đốt"
  },
  "Utilities & M&E": {
    "KO": "기계전기 및 유틸리티",
    "EN": "Utilities & M&E",
    "VI": "Tiện ích & Cơ điện M&E"
  },
  "Utilities & Real Estate": {
    "KO": "유틸리티 및 부동산",
    "EN": "Utilities & Real Estate",
    "VI": "Tiện ích & Bất động sản"
  },
  "Aerospace": {
    "KO": "항공우주",
    "EN": "Aerospace",
    "VI": "Hàng không vũ trụ"
  },
  "Aerospace & Defense": {
    "KO": "항공우주 및 방위산업",
    "EN": "Aerospace & Defense",
    "VI": "Hàng không vũ trụ & Quốc phòng"
  },
  "Apparel": {
    "KO": "의류 및 패션",
    "EN": "Apparel",
    "VI": "May mặc & Thời trang"
  },
  "Asset Management": {
    "KO": "자산운용",
    "EN": "Asset Management",
    "VI": "Quản lý tài sản"
  },
  "Automotive": {
    "KO": "자동차",
    "EN": "Automotive",
    "VI": "Ô tô & Xe máy"
  },
  "Biotechnology": {
    "KO": "바이오기술",
    "EN": "Biotechnology",
    "VI": "Công nghệ sinh học"
  },
  "Communication Services": {
    "KO": "커뮤니케이션 서비스",
    "EN": "Communication Services",
    "VI": "Dịch vụ truyền thông"
  },
  "Computer Hardware": {
    "KO": "컴퓨터 하드웨어",
    "EN": "Computer Hardware",
    "VI": "Phần cứng máy tính"
  },
  "Computer Networking": {
    "KO": "컴퓨터 네트워크",
    "EN": "Computer Networking",
    "VI": "Mạng máy tính"
  },
  "Conglomerate": {
    "KO": "복합 대기업",
    "EN": "Conglomerate",
    "VI": "Tập đoàn đa ngành"
  },
  "Consumer Services": {
    "KO": "소비자 서비스",
    "EN": "Consumer Services",
    "VI": "Dịch vụ tiêu dùng"
  },
  "Defense & Tech": {
    "KO": "방산 및 첨단기술",
    "EN": "Defense & Tech",
    "VI": "Quốc phòng & Công nghệ"
  },
  "Energy": {
    "KO": "에너지",
    "EN": "Energy",
    "VI": "Năng lượng"
  },
  "Energy & Materials": {
    "KO": "에너지 및 소재",
    "EN": "Energy & Materials",
    "VI": "Năng lượng & Vật liệu"
  },
  "Entertainment": {
    "KO": "엔터테인먼트",
    "EN": "Entertainment",
    "VI": "Giải trí"
  },
  "EV & New Energy": {
    "KO": "전기차 및 신에너지",
    "EN": "EV & New Energy",
    "VI": "Xe điện & Năng lượng mới"
  },
  "Financials": {
    "KO": "금융",
    "EN": "Financials",
    "VI": "Tài chính"
  },
  "General": {
    "KO": "일반",
    "EN": "General",
    "VI": "Tổng hợp"
  },
  "Healthcare": {
    "KO": "헬스케어/의료",
    "EN": "Healthcare",
    "VI": "Chăm sóc sức khỏe"
  },
  "Healthcare Equipment": {
    "KO": "의료 장비",
    "EN": "Healthcare Equipment",
    "VI": "Thiết bị y tế"
  },
  "Healthcare Services": {
    "KO": "의료 서비스",
    "EN": "Healthcare Services",
    "VI": "Dịch vụ y tế"
  },
  "Insurance": {
    "KO": "보험",
    "EN": "Insurance",
    "VI": "Bảo hiểm"
  },
  "Internet & Services": {
    "KO": "인터넷 서비스",
    "EN": "Internet & Services",
    "VI": "Dịch vụ Internet"
  },
  "Internet & Travel": {
    "KO": "인터넷 및 여행",
    "EN": "Internet & Travel",
    "VI": "Internet & Du lịch"
  },
  "Machinery": {
    "KO": "기계 및 장비",
    "EN": "Machinery",
    "VI": "Máy móc & Thiết bị"
  },
  "Restaurants": {
    "KO": "외식업",
    "EN": "Restaurants",
    "VI": "Nhà hàng & Dịch vụ ăn uống"
  },
  "Restaurants & Retail": {
    "KO": "외식 및 유통",
    "EN": "Restaurants & Retail",
    "VI": "Nhà hàng & Bán lẻ"
  },
  "Retail & E-commerce": {
    "KO": "이커머스 및 유통",
    "EN": "Retail & E-commerce",
    "VI": "Bán lẻ & Thương mại điện tử"
  },
  "Retail & Services": {
    "KO": "소매 및 서비스",
    "EN": "Retail & Services",
    "VI": "Bán lẻ & Dịch vụ"
  },
  "Semiconductors": {
    "KO": "반도체",
    "EN": "Semiconductors",
    "VI": "Bán dẫn"
  },
  "Semiconductors & ADAS": {
    "KO": "반도체 및 자율주행",
    "EN": "Semiconductors & ADAS",
    "VI": "Bán dẫn & Lái xe tự động"
  },
  "Semiconductors & Healthcare": {
    "KO": "반도체 및 헬스케어",
    "EN": "Semiconductors & Healthcare",
    "VI": "Bán dẫn & Y tế"
  },
  "Social Media": {
    "KO": "소셜 미디어",
    "EN": "Social Media",
    "VI": "Mạng xã hội"
  },
  "Software": {
    "KO": "소프트웨어",
    "EN": "Software",
    "VI": "Phần mềm"
  },
  "Software & Finance": {
    "KO": "금융 소프트웨어",
    "EN": "Software & Finance",
    "VI": "Phần mềm tài chính"
  },
  "Solar Energy": {
    "KO": "태양광 에너지",
    "EN": "Solar Energy",
    "VI": "Năng lượng mặt trời"
  },
  "Tech & Internet": {
    "KO": "기술 및 인터넷",
    "EN": "Tech & Internet",
    "VI": "Công nghệ & Internet"
  },
  "Technology": {
    "KO": "정보기술(IT)",
    "EN": "Technology",
    "VI": "Công nghệ thông tin"
  },
  "Technology Hardware": {
    "KO": "IT 하드웨어",
    "EN": "Technology Hardware",
    "VI": "Phần cứng công nghệ"
  },
  "Telecommunications": {
    "KO": "통신",
    "EN": "Telecommunications",
    "VI": "Viễn thông"
  },
  "Tobacco": {
    "KO": "담배/기호품",
    "EN": "Tobacco",
    "VI": "Thuốc lá & Tiêu dùng"
  },
  "Transportation": {
    "KO": "운송",
    "EN": "Transportation",
    "VI": "Vận tải"
  },
  "Transportation & Services": {
    "KO": "운송 및 서비스",
    "EN": "Transportation & Services",
    "VI": "Vận tải & Dịch vụ"
  },
  "2차전지": {
    "KO": "2차전지/배터리",
    "EN": "EV Battery",
    "VI": "Pin & Năng lượng mới"
  },
  "2차전지소재": {
    "KO": "2차전지소재",
    "EN": "EV Battery Materials",
    "VI": "Vật liệu Pin xe điện"
  },
  "IT소재및에너지": {
    "KO": "IT 소재 및 에너지",
    "EN": "IT Materials & Energy",
    "VI": "Vật liệu CNTT & Năng lượng"
  },
  "IT소재및화학": {
    "KO": "IT 소재 및 화학",
    "EN": "IT Materials & Chemicals",
    "VI": "Vật liệu CNTT & Hóa chất"
  },
  "IT전자부품": {
    "KO": "IT 전자부품",
    "EN": "IT Electronic Components",
    "VI": "Linh kiện điện tử"
  },
  "가전제품": {
    "KO": "가전제품",
    "EN": "Home Appliances",
    "VI": "Thiết bị gia dụng"
  },
  "게임": {
    "KO": "게임",
    "EN": "Gaming",
    "VI": "Trò chơi điện tử"
  },
  "금융서비스": {
    "KO": "금융 서비스",
    "EN": "Financial Services",
    "VI": "Dịch vụ tài chính"
  },
  "무선통신업": {
    "KO": "무선통신",
    "EN": "Wireless Telecom",
    "VI": "Viễn thông không dây"
  },
  "반도체및반도체장비": {
    "KO": "반도체및반도체장비",
    "EN": "Semiconductors & Equipment",
    "VI": "Bán dẫn & Thiết bị"
  },
  "방위산업": {
    "KO": "방위산업",
    "EN": "Defense",
    "VI": "Quốc phòng"
  },
  "방위산업/항공": {
    "KO": "방위산업/항공",
    "EN": "Defense & Aerospace",
    "VI": "Quốc phòng & Hàng không"
  },
  "보험": {
    "KO": "보험",
    "EN": "Insurance",
    "VI": "Bảo hiểm"
  },
  "분자진단": {
    "KO": "분자진단",
    "EN": "Molecular Diagnostics",
    "VI": "Chẩn đoán phân tử"
  },
  "생활용품및화장품": {
    "KO": "생활용품 및 화장품",
    "EN": "Consumer Goods & Cosmetics",
    "VI": "Hàng tiêu dùng & Mỹ phẩm"
  },
  "소비자서비스": {
    "KO": "소비자 서비스",
    "EN": "Consumer Services",
    "VI": "Dịch vụ tiêu dùng"
  },
  "소프트웨어": {
    "KO": "소프트웨어",
    "EN": "Software",
    "VI": "Phần mềm"
  },
  "식음료": {
    "KO": "식음료",
    "EN": "Food & Beverage",
    "VI": "Thực phẩm & Đồ uống"
  },
  "양방향미디어와서비스": {
    "KO": "인터넷/플랫폼",
    "EN": "Interactive Media & Services",
    "VI": "Truyền thông & Dịch vụ số"
  },
  "엔터테인먼트": {
    "KO": "엔터테인먼트",
    "EN": "Entertainment",
    "VI": "Giải trí"
  },
  "유통": {
    "KO": "유통",
    "EN": "Retail & Distribution",
    "VI": "Bán lẻ & Phân phối"
  },
  "은행": {
    "KO": "은행",
    "EN": "Banking",
    "VI": "Ngân hàng"
  },
  "의료기기": {
    "KO": "의료기기",
    "EN": "Medical Devices",
    "VI": "Thiết bị y tế"
  },
  "의료기기및제약": {
    "KO": "의료기기 및 제약",
    "EN": "Medical Devices & Pharma",
    "VI": "Thiết bị y tế & Dược"
  },
  "자동차": {
    "KO": "자동차",
    "EN": "Automotive",
    "VI": "Ô tô & Xe máy"
  },
  "자동차부품": {
    "KO": "자동차부품",
    "EN": "Auto Parts",
    "VI": "Phụ tùng ô tô"
  },
  "재생의학/의료기기": {
    "KO": "재생의학/의료기기",
    "EN": "Regenerative Medicine",
    "VI": "Y học tái tạo"
  },
  "전력기기": {
    "KO": "전력기기",
    "EN": "Electrical Equipment",
    "VI": "Thiết bị điện"
  },
  "전력기기및중공업": {
    "KO": "전력기기 및 중공업",
    "EN": "Electrical & Heavy Industry",
    "VI": "Thiết bị điện & Công nghiệp nặng"
  },
  "정유": {
    "KO": "정유/석유화학",
    "EN": "Oil & Gas",
    "VI": "Dầu khí"
  },
  "제약": {
    "KO": "제약",
    "EN": "Pharmaceuticals",
    "VI": "Dược phẩm"
  },
  "제약/바이오": {
    "KO": "제약/바이오",
    "EN": "Pharmaceuticals & Biotech",
    "VI": "Dược phẩm & Sinh học"
  },
  "조선": {
    "KO": "조선",
    "EN": "Shipbuilding",
    "VI": "Đóng tàu"
  },
  "조선/중공업": {
    "KO": "조선/중공업",
    "EN": "Shipbuilding & Heavy Industry",
    "VI": "Đóng tàu & Cơ khí nặng"
  },
  "종합상사및건설": {
    "KO": "종합상사 및 건설",
    "EN": "Trading & Construction",
    "VI": "Thương mại & Xây dựng"
  },
  "중공업및친환경에너지": {
    "KO": "중공업 및 친환경에너지",
    "EN": "Heavy Industry & Green Energy",
    "VI": "Công nghiệp nặng & Năng lượng xanh"
  },
  "지주회사": {
    "KO": "지주회사",
    "EN": "Holding Company",
    "VI": "Công ty cổ phần đầu tư"
  },
  "철강및소재": {
    "KO": "철강 및 소재",
    "EN": "Steel & Materials",
    "VI": "Thép & Vật liệu"
  },
  "철도및방위산업": {
    "KO": "철도 및 방위산업",
    "EN": "Railways & Defense",
    "VI": "Đường sắt & Quốc phòng"
  },
  "친환경에너지": {
    "KO": "친환경 에너지",
    "EN": "Green Energy",
    "VI": "Năng lượng xanh"
  },
  "태양광및화학": {
    "KO": "태양광 및 화학",
    "EN": "Solar & Chemicals",
    "VI": "Năng lượng mặt trời & Hóa chất"
  },
  "화장품": {
    "KO": "화장품/뷰티",
    "EN": "Cosmetics",
    "VI": "Mỹ phẩm"
  },
  "화장품유통": {
    "KO": "화장품 유통",
    "EN": "Cosmetics Distribution",
    "VI": "Phân phối mỹ phẩm"
  },
  "화학": {
    "KO": "화학",
    "EN": "Chemicals",
    "VI": "Hóa chất"
  },
  "화학및친환경에너지": {
    "KO": "화학 및 친환경에너지",
    "EN": "Chemicals & Green Energy",
    "VI": "Hóa chất & Năng lượng xanh"
  }
};

// Lookup helper supporting exact match and normalized lowercase match
const NORMALIZED_INDUSTRY_MAP: Record<string, IndustryDict> = {};
for (const [key, val] of Object.entries(INDUSTRY_MAP)) {
  NORMALIZED_INDUSTRY_MAP[key.toLowerCase().trim()] = val;
}

export const translateIndustry = (industry: string, lang: Language = 'KO'): string => {
  if (!industry) return '';
  const trimmed = industry.trim();
  
  // 1. Direct match
  if (INDUSTRY_MAP[trimmed]) {
    return INDUSTRY_MAP[trimmed][lang] || INDUSTRY_MAP[trimmed]['EN'] || trimmed;
  }
  
  // 2. Normalized lower-case match
  const lower = trimmed.toLowerCase();
  if (NORMALIZED_INDUSTRY_MAP[lower]) {
    return NORMALIZED_INDUSTRY_MAP[lower][lang] || NORMALIZED_INDUSTRY_MAP[lower]['EN'] || trimmed;
  }
  
  // 3. Fallback: return original string
  return trimmed;
};
