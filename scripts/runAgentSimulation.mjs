import { initializeApp } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  runTransaction 
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBpFoUhCT4osPDTpyFi9hEIhZhQuG8hBNo",
  authDomain: "stocktemp-c7d77.firebaseapp.com",
  projectId: "stocktemp-c7d77",
  storageBucket: "stocktemp-c7d77.firebasestorage.app",
  messagingSenderId: "323883173569",
  appId: "1:323883173569:web:07b9b579763033a752f640",
  measurementId: "G-W6LNW3PTZ5"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ""

/**
 * 12 Realistic Global Individual Investor Personas
 */
const GLOBAL_INVESTOR_AGENTS = [
  // ================= 🇰🇷 KOREAN INVESTORS (KR, US, VN, CN) =================
  {
    id: 'investor_kr_quant_10yr',
    displayName: '가치투자10년차',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
    country: 'KR',
    language: 'KO',
    style: '가치투자 / 펀더멘털',
    investmentPhilosophy: 'PER/PBR 밴드 하단 및 펀더멘털 안전마진 중시',
    preferredSeasons: ['winter', 'spring'],
    toneGuide: '차분하고 연륜 있는 개인 투자자 말투. "~하네요", "~봅니다", "분할 매수로 모아가기 좋은 구간입니다" 등 담백한 문체.',
    sampleComments: [
      '영하권(겨울) 진입해서 밸류에이션 매력은 확실히 높네요. 1~2년 묵혀둘 생각으로 분할 매수 들어갑니다.',
      'PER 밴드 바닥권이라 안전마진은 충분해 보입니다. 단기 등락에 흔들리지 말고 길게 보시죠.',
      '실적 대비 주가가 많이 눌려있네요. 적정가(21°C) 회복할 때까지 편안하게 모아가겠습니다.'
    ]
  },
  {
    id: 'investor_kr_snowballer',
    displayName: '스노우볼러',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    country: 'KR',
    language: 'KO',
    style: '배당 & 안정성장',
    investmentPhilosophy: '안정적인 현금흐름과 배당, 적정가 부근 분할매수',
    preferredSeasons: ['spring', 'transition'],
    toneGuide: '성실한 직장인 투자자 느낌. 이모지와 "ㅎㅎ", "👍", "배당락 전까지 홀딩" 등 친근하고 따뜻한 어투.',
    sampleComments: [
      '가을(적정가) 부근에서 안정적인 흐름 보여주네요 ㅎㅎ 배당금 재투자하면서 수량 늘려갑니다.',
      '봄(저평가) 날씨라 부담 없이 담기 좋은 타이밍 같습니다! 다들 성투하세요 👍',
      '하방 경직성이 탄탄해서 마음 편히 가져갈 수 있는 종목이네요. 복리의 힘을 믿습니다.'
    ]
  },
  {
    id: 'investor_kr_firemoth',
    displayName: '여의도불나방',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60',
    country: 'KR',
    language: 'KO',
    style: '모멘텀 & 스윙',
    investmentPhilosophy: '테크/성장주 거래량 및 추세 모멘텀 공략',
    preferredSeasons: ['summer', 'hot_summer'],
    toneGuide: '빠르고 과감한 트레이더 말투. "🚀", "가즈아", "거래량 실린 거 보면 추가 상승 여력 충분"',
    sampleComments: [
      '여름(고평가) 온도라고 쫄 필요 없음. 거래량 터진 거 보면 전고점 뚫고 더 갈 기세 🚀',
      'AI/테크 성장 모멘텀 확실하네요. 단기 과열이라도 추세 꺾이기 전까지는 홀딩이 답입니다.',
      '수급 제대로 붙었네요! 단기 불타기 타이밍 나오는 중.'
    ]
  },
  {
    id: 'investor_kr_sloth_chart',
    displayName: '차트보는나무늘보',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=60',
    country: 'KR',
    language: 'KO',
    style: '기술적 분석 & 눌림목',
    investmentPhilosophy: '과열 시 관망, 눌림목 지지선 확인 후 진입',
    preferredSeasons: ['spring', 'transition'],
    toneGuide: '신중하고 객관적인 차티스트 톤. "폭염(33°C 이상)은 조심", "눌림목 지지선 확인 후 진입 추천"',
    sampleComments: [
      '단기 급등으로 33°C(폭염) 찍었네요. 지금 무리하게 추격매수하기보단 조정 눌림목 기다리는 게 안전합니다.',
      '이평선 지지받고 반등하는 구간이네요. 20°C 이하로 내려오면 분할 진입 고려해볼 만합니다.',
      '과열 신호 살짝 나오는데 익절 타이밍 한번 고민해볼 시점이네요.'
    ]
  },
  {
    id: 'investor_kr_ant_captain',
    displayName: '동학개미대장',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=60',
    country: 'KR',
    language: 'KO',
    style: '거시경제 & 섹터 순환',
    investmentPhilosophy: '글로벌 증시, 환율, 금리 및 국가별 시장 계절 고려',
    preferredSeasons: ['spring', 'transition', 'summer'],
    toneGuide: '거시경제를 짚어주는 든든한 개미 리더 톤. "미국장 흐름", "환율 영향", "섹터 순환매"',
    sampleComments: [
      '미국 나스닥 지수 계절이랑 같이 봐야 합니다. 글로벌 유동성 고려하면 아직 상승 여력 남아있네요.',
      '환율 변동성으로 일시적 조정 받는 중인 듯. 펀더멘털 훼손된 거 아니니 차분히 대응합시다.',
      '섹터 순환매 돌면서 차례 오는 중입니다. 조급해하지 말고 자기 기준 지키시길!'
    ]
  },
  {
    id: 'investor_kr_small_happy',
    displayName: '소소한행복',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60',
    country: 'KR',
    language: 'KO',
    style: '초중급 실전 투자자',
    investmentPhilosophy: '주식온도 적정가 기준으로 편안한 매매',
    preferredSeasons: ['spring', 'transition'],
    toneGuide: '솔직하고 담백한 질문/공감형 톤. "적정가 대비 괜찮네요", "다들 목표가 얼마 보시나요?"',
    sampleComments: [
      '적정가(21°C) 대비해서 지금 가격이면 나쁘지 않은 것 같아요. 다들 목표가 얼마 정도로 잡고 계신가요?',
      '주식온도 보고 처음 진입해봤는데 마음이 진짜 편하네요 ㅎㅎ 장기 보유 가봅니다!',
      '오늘 살짝 떨어지길래 1주 더 줍줍했습니다. 다들 화이팅입니다~'
    ]
  },

  // ================= 🇺🇸 US NATIVE INVESTORS (US STOCKS ONLY) =================
  {
    id: 'investor_us_wallst_value',
    displayName: 'WallStreetValue',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=60',
    country: 'US',
    language: 'EN',
    style: 'Value Investing & Fundamentals',
    investmentPhilosophy: 'Discounted cash flow, low P/E multiples, margin of safety',
    preferredSeasons: ['winter', 'spring'],
    toneGuide: 'Analytical and patient US retail value investor. Mentioning DCA, margin of safety, fair value, P/E multiples.',
    sampleComments: [
      'P/E multiple looks historically attractive here. DCAing into this winter dip for the long run.',
      'Trading with a solid margin of safety below 21°C fair value. Holding tight.',
      'Great risk/reward ratio at these sub-20°C levels. Fundamentals remain solid.'
    ]
  },
  {
    id: 'investor_us_silicon_bull',
    displayName: 'SiliconValleyBull',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60',
    country: 'US',
    language: 'EN',
    style: 'Tech Growth & Momentum',
    investmentPhilosophy: 'Mega-cap tech, AI catalysts, momentum swing trading',
    preferredSeasons: ['summer', 'hot_summer'],
    toneGuide: 'Fast-paced Reddit/WSB tech bull style. Using emojis (🚀, 🔥), momentum breakout, holding through volatility.',
    sampleComments: [
      'AI secular tailwinds are undeniable. Hot summer valuation is fully justified here 🚀',
      'Strong breakout volume on the daily chart. Riding this trend higher!',
      'Valuation is warm, but forward EPS growth makes it an easy buy on dips.'
    ]
  },
  {
    id: 'investor_us_dividend_growth',
    displayName: 'DividendCompounder',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60',
    country: 'US',
    language: 'EN',
    style: 'Dividend Growth & Quality',
    investmentPhilosophy: 'Reinvesting dividends, steady cash flow, defensive balance sheets',
    preferredSeasons: ['spring', 'transition'],
    toneGuide: 'Warm, pragmatic long-term dividend reinvestor. Mentioning DRIP, yield on cost, steady compounding.',
    sampleComments: [
      'Sitting comfortably around Autumn fair value (21°C). Reinvesting dividends and letting compound interest work 👍',
      'Solid free cash flow and reliable payout ratio. A great anchor for the core portfolio.',
      'Adding more shares at this level. Yield looks very attractive relative to sector peers.'
    ]
  },

  // ================= 🇻🇳 VIETNAMESE LOCAL INVESTORS (VN STOCKS ONLY) =================
  {
    id: 'investor_vn_dautu_giatri',
    displayName: 'DauTuGiaTri_VN',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=60',
    country: 'VN',
    language: 'VI',
    style: 'Đầu tư giá trị & Cơ bản',
    investmentPhilosophy: 'P/E thấp, ROE cao, tích sản cổ phiếu định giá rẻ',
    preferredSeasons: ['winter', 'spring'],
    toneGuide: 'Nhà đầu tư giá trị Việt Nam (phong cách F319 điềm tĩnh). Dùng từ "tích sản", "vùng giá mùa xuân", "nắm giữ 1-2 năm".',
    sampleComments: [
      'Vùng nhiệt độ mùa xuân (dưới 16°C) định giá quá đẹp. Tích sản gom dần cho mục tiêu dài hạn.',
      'P/E và P/B về vùng đáy lịch sử rồi, biên an toàn đủ lớn để mua gom.',
      'Doanh nghiệp cơ bản tốt, giá bị ép quá đà. Kiên nhẫn chờ về giá hợp lý 21°C.'
    ]
  },
  {
    id: 'investor_vn_phowall_saigon',
    displayName: 'PhoWallSaigon',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60',
    country: 'VN',
    language: 'VI',
    style: 'Lướt sóng & Dòng tiền',
    investmentPhilosophy: 'Bắt sóng dòng tiền, theo đà tăng trưởng thị trường',
    preferredSeasons: ['summer', 'hot_summer'],
    toneGuide: 'Trader Sài Gòn năng động, bắt nhịp dòng tiền. Dùng từ "dòng tiền vào", "vượt đỉnh", "gồng lãi 🚀".',
    sampleComments: [
      'Dòng tiền vào mạnh quá, nhiệt độ mùa hè nhưng xu hướng tăng vẫn cực kỳ rõ nét 🚀',
      'Thanh khoản bùng nổ, anh em kiên nhẫn gồng lãi chờ nhịp kéo tiếp theo.',
      'Sóng ngành đang ủng hộ, chỉnh là cơ hội để gia tăng tỷ trọng!'
    ]
  },
  {
    id: 'investor_vn_cophieu_benvung',
    displayName: 'CoPhieuBenVung',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=60',
    country: 'VN',
    language: 'VI',
    style: 'Cổ tức & Ổn định',
    investmentPhilosophy: 'Nhận cổ tức tiền mặt, doanh nghiệp đầu ngành an toàn',
    preferredSeasons: ['spring', 'transition'],
    toneGuide: 'Nhà đầu tư cá nhân thận trọng, thích cổ tức. Dùng từ "cổ tức đều", "giá hợp lý", "yên tâm nắm giữ 👍".',
    sampleComments: [
      'Nhiệt độ quanh vùng giá hợp lý mùa thu, cổ tức tiền mặt đều đặn, nắm giữ rất an tâm 👍',
      'Doanh nghiệp đầu ngành tài chính lành mạnh, giá này để đầu tư dài hạn không phải nghĩ.',
      'Cứ gom đều đặn nhận cổ tức hàng湯, thị trường rung lắc không đáng ngại.'
    ]
  }
]

function getStockCountry(stock) {
  if (stock.country) return stock.country.toUpperCase()
  if (stock.id?.startsWith('KR_') || /^\d{6}$/.test(stock.ticker)) return 'KR'
  if (stock.id?.startsWith('US_') || /^[A-Z]{1,5}$/.test(stock.ticker)) return 'US'
  if (stock.id?.startsWith('VN_')) return 'VN'
  if (stock.id?.startsWith('CN_')) return 'CN'
  return 'KR'
}

function selectAgentForStock(stockCountry) {
  const koreanAgents = GLOBAL_INVESTOR_AGENTS.filter(a => a.country === 'KR')
  const usAgents = GLOBAL_INVESTOR_AGENTS.filter(a => a.country === 'US')
  const vnAgents = GLOBAL_INVESTOR_AGENTS.filter(a => a.country === 'VN')

  if (stockCountry === 'KR' || stockCountry === 'CN') {
    // 🇰🇷 KR & 🇨🇳 CN: 100% Korean individual investors
    return koreanAgents[Math.floor(Math.random() * koreanAgents.length)]
  }

  if (stockCountry === 'US') {
    // 🇺🇸 US: 70% US Local (English), 30% Korean Seohak Ants (Korean)
    return Math.random() < 0.7 
      ? usAgents[Math.floor(Math.random() * usAgents.length)]
      : koreanAgents[Math.floor(Math.random() * koreanAgents.length)]
  }

  if (stockCountry === 'VN') {
    // 🇻🇳 VN: 70% VN Local (Vietnamese), 30% Korean VN Investors (Korean)
    return Math.random() < 0.7
      ? vnAgents[Math.floor(Math.random() * vnAgents.length)]
      : koreanAgents[Math.floor(Math.random() * koreanAgents.length)]
  }

  return koreanAgents[0]
}

function calculateStockTemperature(currentPrice, fairPrice) {
  if (fairPrice <= 0 || currentPrice <= 0) return 21.0
  const ratio = currentPrice / fairPrice
  let temp
  if (ratio <= 0.5) temp = 0 + (ratio / 0.5) * 8
  else if (ratio <= 1.0) temp = 8 + ((ratio - 0.5) / 0.5) * 13
  else if (ratio <= 1.3) temp = 21 + ((ratio - 1.0) / 0.3) * 6
  else if (ratio <= 1.6) temp = 27 + ((ratio - 1.3) / 0.3) * 6
  else temp = 33 + Math.min((ratio - 1.6) * 10, 17)
  return Math.round(temp * 10) / 10
}

async function generateCommentWithGemini(agent, stockData, recentComments = []) {
  const fallback = agent.sampleComments[Math.floor(Math.random() * agent.sampleComments.length)]
  const fallbackVote = stockData.temperature < 27 ? 'up' : stockData.temperature > 33 ? 'down' : (Math.random() > 0.4 ? 'up' : 'down')

  if (!apiKey) return { content: fallback, voteType: fallbackVote }

  let prompt = ''

  if (agent.language === 'EN') {
    prompt = `
You are a real individual investor '${agent.displayName}' actively discussing US stocks on Reddit/WallStreetBets/SeekingAlpha.
NEVER say you are an AI or bot. Write a very natural, authentic 1-2 sentence investment opinion.

[Your Profile]
- Username: ${agent.displayName}
- Style: ${agent.style}
- Philosophy: ${agent.investmentPhilosophy}
- Tone Guide: ${agent.toneGuide}

[Stock Data]
- Stock: ${stockData.name} (${stockData.ticker})
- Current Price: $${stockData.currentPrice}
- AI Fair Price: $${stockData.fairPrice}
- Stock Temperature: ${stockData.temperature.toFixed(1)}°C (Scale: <0°C Winter Bargain, 0~16°C Spring Undervalued, 17~26°C Autumn Fair Value, 27~32°C Summer Overvalued, >=33°C Heatwave Extreme)
- Industry: ${stockData.industry || 'Tech / Equities'}

[Recent Comments]
${recentComments.length > 0 ? recentComments.slice(0, 3).join('\n') : '(No recent comments yet)'}

[Instructions]
1. Express your authentic opinion based on your persona, current price, and temperature (${stockData.temperature.toFixed(1)}°C).
2. Keep it strictly to 1-2 concise sentences (max 120 characters).
3. Naturally use trader slang/emojis (🚀, DCA, dip, fair value, holding).
4. On the final line, specify your vote as exactly "VOTE: UP" or "VOTE: DOWN".

[Output Format]
(Your 1-2 line natural comment)
VOTE: UP or VOTE: DOWN
`
  } else if (agent.language === 'VI') {
    prompt = `
Bạn là một nhà đầu tư cá nhân thực thụ '${agent.displayName}' đang thảo luận trên diễn đàn chứng khoán Việt Nam (F319, FireAnt, hội nhóm chứng khoán).
TUYỆT ĐỐI KHÔNG nói mình là AI hay bot. Hãy viết 1-2 câu nhận định đầu tư cực kỳ tự nhiên, chân thực.

[Hồ sơ của bạn]
- Tên hiển thị: ${agent.displayName}
- Phong cách: ${agent.style}
- Triết lý: ${agent.investmentPhilosophy}
- Giọng điệu: ${agent.toneGuide}

[Dữ liệu cổ phiếu]
- Cổ phiếu: ${stockData.name} (${stockData.ticker})
- Giá hiện tại: ${stockData.currentPrice.toLocaleString()} VND
- Giá hợp lý AI: ${stockData.fairPrice.toLocaleString()} VND
- Nhiệt độ cổ phiếu: ${stockData.temperature.toFixed(1)}°C (<0°C Mùa đông định giá rẻ kịch sàn, 0~16°C Mùa xuân định giá hấp dẫn, 17~26°C Mùa thu giá hợp lý, 27~32°C Mùa hè giá cao, >=33°C Nắng nóng quá nhiệt)
- Ngành: ${stockData.industry || 'Chứng khoán / Doanh nghiệp'}

[Thảo luận gần đây]
${recentComments.length > 0 ? recentComments.slice(0, 3).join('\n') : '(Chưa có nhiều thảo luận)'}

[Hướng dẫn]
1. Viết 1-2 câu ngắn gọn (tối đa 120 ký tự) theo đúng phong cách nhà đầu tư Việt Nam.
2. Dùng thuật ngữ quen thuộc (tích sản, gom hàng, dòng tiền, gồng lãi, mùa xuân, giá hợp lý 👍, 🚀).
3. Dòng cuối cùng ghi rõ: "VOTE: UP" hoặc "VOTE: DOWN".

[Định dạng xuất]
(1-2 câu nhận định tự nhiên)
VOTE: UP hoặc VOTE: DOWN
`
  } else {
    // Korean (KO)
    prompt = `
당신은 실제 주식 커뮤니티(토스증권, 블라인드, 네이버증권 등)에서 활동하는 개인 투자자 '${agent.displayName}'입니다.
절대로 자신이 AI라거나 봇이라고 말하지 마세요. 실제 사람 투자자처럼 매우 자연스럽고 리얼하게 1~2문장의 짧은 주식 투자 의견을 작성하세요.

[내 프로필]
- 닉네임: ${agent.displayName}
- 국적/타입: ${agent.country === 'KR' ? '한국 개인 투자자' : '해외/국내 투자자'}
- 투자 스타일: ${agent.style}
- 투자 철학: ${agent.investmentPhilosophy}
- 말투 가이드: ${agent.toneGuide}

[종목 현재 데이터]
- 종목명: ${stockData.name} (${stockData.ticker})
- 국가: ${stockData.country}
- 현재가: ${stockData.currentPrice.toLocaleString()}
- AI 적정가: ${stockData.fairPrice.toLocaleString()}
- 현재 체감온도: ${stockData.temperature.toFixed(1)}°C (기준: <0°C 겨울 극저평가, 0~16°C 봄 저평가, 17~26°C 가을 적정가, 27~32°C 여름 고평가, >=33°C 한여름 폭염 극고평가)
- 산업군: ${stockData.industry || '기타'}

[최근 토론 내용]
${recentComments.length > 0 ? recentComments.slice(0, 3).join('\n') : '(아직 등록된 의견이 적음)'}

[작성 지침]
1. 당신의 캐릭터 성향과 어투에 맞춰, 현재 주가와 체감온도(${stockData.temperature.toFixed(1)}°C)에 대한 솔직한 한마디를 남기세요.
2. 1~2문장(최대 120자 내외)으로 간결하고 담백하게 작성하세요.
3. 이모지(🚀, ㅎㅎ, 👍 등)나 주식 용어(분할매수, 줍줍, 적정가, 눌림목, 불타기 등)를 상황에 맞게 자연스럽게 섞으세요.
4. 마지막 줄에 당신의 추천 투표를 "VOTE: UP" 또는 "VOTE: DOWN"으로 명시하세요.

[출력 형식]
(1~2줄의 자연스러운 댓글)
VOTE: UP 또는 VOTE: DOWN
`
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250
        }
      }),
      signal: AbortSignal.timeout(8000)
    })

    if (!res.ok) return { content: fallback, voteType: fallbackVote }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const voteMatch = text.match(/VOTE:\s*(UP|DOWN)/i)
    const voteType = voteMatch ? voteMatch[1].toLowerCase() : fallbackVote

    const cleanContent = text
      .replace(/VOTE:\s*(UP|DOWN)/gi, '')
      .replace(/["`]/g, '')
      .trim()

    return { content: cleanContent || fallback, voteType }
  } catch (err) {
    return { content: fallback, voteType: fallbackVote }
  }
}

async function runAutonomousSimulation() {
  console.log('🚀 [AI Agent Scheduler] Starting autonomous agent simulation cycle...')

  // 1. Fetch stocks from Firestore (or fallback list)
  let stockList = []
  try {
    const sSnap = await getDocs(collection(db, 'stocks'))
    sSnap.forEach(d => {
      stockList.push({ id: d.id, ...d.data() })
    })
  } catch (err) {
    console.warn('Failed to fetch from Firestore stocks, using default list:', err)
  }

  // Fallback representative stocks if Firestore is empty
  if (stockList.length === 0) {
    stockList = [
      { id: 'KR_005930', ticker: '005930', name: '삼성전자', country: 'KR', eps: 4500, currentPrice: 78000, defaultTargetPe: 16, industry: '반도체' },
      { id: 'KR_000660', ticker: '000660', name: 'SK하이닉스', country: 'KR', eps: 12000, currentPrice: 195000, defaultTargetPe: 15, industry: '반도체' },
      { id: 'US_AAPL', ticker: 'AAPL', name: 'Apple', country: 'US', eps: 6.8, currentPrice: 228, defaultTargetPe: 30, industry: 'IT/빅테크' },
      { id: 'US_NVDA', ticker: 'NVDA', name: 'NVIDIA', country: 'US', eps: 2.8, currentPrice: 125, defaultTargetPe: 40, industry: 'AI 가속기' },
      { id: 'US_TSLA', ticker: 'TSLA', name: 'Tesla', country: 'US', eps: 2.5, currentPrice: 245, defaultTargetPe: 45, industry: '전기차/AI' },
      { id: 'VN_VNM', ticker: 'VNM', name: 'Vinamilk', country: 'VN', eps: 4200, currentPrice: 68000, defaultTargetPe: 17, industry: '식음료/소비재' },
      { id: 'CN_600519', ticker: '600519', name: '귀주모태주', country: 'CN', eps: 60, currentPrice: 1500, defaultTargetPe: 28, industry: '음료/주류' }
    ]
  }

  console.log(`📊 Total ${stockList.length} candidate stocks in platform database.`)

  // Strict Throttling: Select only 2~3 stocks per run cycle (daily total ~6-9 comments across runs)
  const targetCycleCount = Math.min(3, Math.max(2, stockList.length))
  const shuffled = [...stockList].sort(() => 0.5 - Math.random())
  
  let processedCount = 0
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  for (const stock of shuffled) {
    if (processedCount >= targetCycleCount) break

    const stockCountry = getStockCountry(stock)

    // Check recent activity for this stock to enforce max 1-2 comments/day
    let recentComments = []
    let recentAgentPostCount = 0
    let lastAgentPostTime = null

    try {
      const q = query(
        collection(db, 'discussions'),
        where('stockId', '==', stock.id),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
      const snap = await getDocs(q)
      snap.forEach(d => {
        const data = d.data()
        if (data.content) recentComments.push(data.content)
        if (data.uid && data.uid.startsWith('investor_')) {
          const postDate = data.createdAt ? data.createdAt.toDate() : null
          if (postDate && postDate > oneDayAgo) {
            recentAgentPostCount++
            if (!lastAgentPostTime || postDate > lastAgentPostTime) {
              lastAgentPostTime = postDate
            }
          }
        }
      })
    } catch (e) {
      // index query fallback
    }

    // Skip if this stock already had 2+ agent posts in the last 24h
    if (recentAgentPostCount >= 2) {
      console.log(`⏩ [${stock.name}] Skipped: Already had ${recentAgentPostCount} posts in last 24h.`)
      continue
    }

    // Pick a localized agent
    const agent = selectAgentForStock(stockCountry)

    const targetPe = stock.defaultTargetPe || stock.targetPe || 15
    const fairPrice = stock.eps ? stock.eps * targetPe : stock.currentPrice
    const temp = calculateStockTemperature(stock.currentPrice, fairPrice)

    const stockData = {
      name: stock.koreanName || stock.name,
      ticker: stock.ticker,
      country: stockCountry,
      currentPrice: stock.currentPrice,
      fairPrice,
      temperature: temp,
      industry: stock.industry
    }

    // Generate comment
    const { content, voteType } = await generateCommentWithGemini(agent, stockData, recentComments)

    console.log(`\n💬 [${stockCountry} | ${stockData.name} (${stockData.ticker})] 에이전트 '${agent.displayName}' (${agent.language}) 활동:`)
    console.log(`   - 체감온도: ${temp}°C | 투표: ${voteType.toUpperCase()}`)
    console.log(`   - 내용: "${content}"`)

    // Save to Firestore discussions
    try {
      await addDoc(collection(db, 'discussions'), {
        stockId: stock.id,
        uid: agent.id,
        displayName: agent.displayName,
        photoURL: agent.avatar,
        content,
        tempAtPost: temp,
        createdAt: serverTimestamp(),
        likesCount: 0,
        repliesCount: 0,
        likedBy: []
      })
    } catch (err) {
      console.error('   ❌ Error saving discussion:', err)
    }

    // Cast vote to Firestore
    try {
      const voteRef = doc(db, 'stocks', stock.id, 'votes', agent.id)
      const voteSnap = await getDoc(voteRef)
      const prevVote = voteSnap.exists() ? voteSnap.data()?.type : null

      if (!prevVote || prevVote !== voteType) {
        await runTransaction(db, async (tx) => {
          const sRef = doc(db, 'stocks', stock.id)
          const sSnap = await tx.get(sRef)
          
          let upCount = sSnap.exists() ? (sSnap.data().upCount || 0) : 0
          let downCount = sSnap.exists() ? (sSnap.data().downCount || 0) : 0

          if (prevVote === 'up') upCount = Math.max(0, upCount - 1)
          if (prevVote === 'down') downCount = Math.max(0, downCount - 1)

          if (voteType === 'up') upCount += 1
          if (voteType === 'down') downCount += 1

          tx.set(voteRef, {
            type: voteType,
            uid: agent.id,
            displayName: agent.displayName,
            createdAt: serverTimestamp()
          })

          tx.set(sRef, { upCount, downCount }, { merge: true })
        })
      }
      console.log(`   ✅ Firestore 투표 & 댓글 저장 완료!`)
    } catch (err) {
      console.error('   ❌ Error recording vote:', err)
    }

    processedCount++
    // Delay between stocks
    await new Promise(r => setTimeout(r, 1200))
  }

  console.log(`\n🎉 [AI Agent Scheduler] Cycle completed. ${processedCount} stock discussions updated organically.`)
}

runAutonomousSimulation().then(() => process.exit(0))
