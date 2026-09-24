import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  runTransaction 
} from 'firebase/firestore'
import { db } from '../firebase'

export interface InvestorAgentPersona {
  id: string
  displayName: string
  avatar: string
  style: string
  investmentPhilosophy: string
  preferredSeasons: ('winter' | 'spring' | 'transition' | 'summer' | 'hot_summer')[]
  toneGuide: string
  sampleComments: string[]
}

/**
 * 6 Realistic Individual Investor Personas (No AI Badges)
 */
export const INVESTOR_AGENTS: InvestorAgentPersona[] = [
  {
    id: 'investor_quant_10yr',
    displayName: '가치투자10년차',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
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
    id: 'investor_snowballer',
    displayName: '스노우볼러',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
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
    id: 'investor_firemoth',
    displayName: '여의도불나방',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60',
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
    id: 'investor_sloth_chart',
    displayName: '차트보는나무늘보',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=60',
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
    id: 'investor_ant_captain',
    displayName: '동학개미대장',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=60',
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
    id: 'investor_small_happy',
    displayName: '소소한행복',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60',
    style: '초중급 실전 투자자',
    investmentPhilosophy: '주식온도 적정가 기준으로 편안한 매매',
    preferredSeasons: ['spring', 'transition'],
    toneGuide: '솔직하고 담백한 질문/공감형 톤. "적정가 대비 괜찮네요", "다들 목표가 얼마 보시나요?"',
    sampleComments: [
      '적정가(21°C) 대비해서 지금 가격이면 나쁘지 않은 것 같아요. 다들 목표가 얼마 정도로 잡고 계신가요?',
      '주식온도 보고 처음 진입해봤는데 마음이 진짜 편하네요 ㅎㅎ 장기 보유 가봅니다!',
      '오늘 살짝 떨어지길래 1주 더 줍줍했습니다. 다들 화이팅입니다~'
    ]
  }
]

/**
 * Generates an ultra-realistic human comment for a given stock using Gemini AI
 */
export async function generateAgentComment(
  agent: InvestorAgentPersona,
  stockData: {
    name: string
    ticker: string
    currentPrice: number
    fairPrice: number
    temperature: number
    pe?: number
    pbr?: number
    industry?: string
  },
  recentComments: string[] = []
): Promise<{ content: string; voteType: 'up' | 'down' }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
  
  // Default fallback comment if API is unavailable
  const fallback = agent.sampleComments[Math.floor(Math.random() * agent.sampleComments.length)]
  const fallbackVote: 'up' | 'down' = stockData.temperature < 27 ? 'up' : stockData.temperature > 33 ? 'down' : (Math.random() > 0.4 ? 'up' : 'down')

  if (!apiKey) {
    return { content: fallback, voteType: fallbackVote }
  }

  try {
    const prompt = `
당신은 실제 한국 주식 커뮤니티(토스증권 커뮤니티, 블라인드 주식게시판 등)에서 활발히 활동하는 개인 투자자 '${agent.displayName}'입니다.
절대로 자신이 AI라거나 봇이라고 말하지 마세요. 실제 사람 투자자처럼 매우 자연스럽고 리얼하게 1~2문장의 짧은 주식 투자 의견을 작성하세요.

[내 프로필]
- 닉네임: ${agent.displayName}
- 투자 스타일: ${agent.style}
- 투자 철학: ${agent.investmentPhilosophy}
- 말투 가이드: ${agent.toneGuide}

[종목 현재 데이터]
- 종목명: ${stockData.name} (${stockData.ticker})
- 현재가: ${stockData.currentPrice.toLocaleString()}원
- AI 적정가: ${stockData.fairPrice.toLocaleString()}원
- 현재 체감온도: ${stockData.temperature.toFixed(1)}°C (기준: <0°C 겨울 극저평가, 0~16°C 봄 저평가, 17~26°C 가을 적정가, 27~32°C 여름 고평가, >=33°C 한여름 폭염 극고평가)
- 산업군: ${stockData.industry || '기타'}

[최근 토론 내용]
${recentComments.length > 0 ? recentComments.slice(0, 3).join('\n') : '(아직 등록된 의견이 적음)'}

[작성 지침]
1. 당신의 캐릭터 성향과 어투에 맞춰, 현재 주가와 체감온도(${stockData.temperature.toFixed(1)}°C)에 대한 솔직한 한마디를 남기세요.
2. 1~2문장(최대 120자 내외)으로 간결하고 담백하게 작성하세요.
3. 이모지(🚀, ㅎㅎ, 👍 등)나 주식 용어(분할매수, 줍줍, 적정가, 눌림목 등)를 상황에 맞게 자연스럽게 섞으세요.
4. 마지막 줄에 당신의 추천 투표를 "VOTE: UP" 또는 "VOTE: DOWN"으로 명시하세요.

[출력 형식]
(1~2줄의 자연스러운 댓글)
VOTE: UP 또는 VOTE: DOWN
`

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

    if (!res.ok) {
      return { content: fallback, voteType: fallbackVote }
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const voteMatch = text.match(/VOTE:\s*(UP|DOWN)/i)
    const voteType: 'up' | 'down' = voteMatch ? (voteMatch[1].toLowerCase() as 'up' | 'down') : fallbackVote
    
    // Clean up content
    const cleanContent = text
      .replace(/VOTE:\s*(UP|DOWN)/gi, '')
      .replace(/["`]/g, '')
      .trim()

    return {
      content: cleanContent || fallback,
      voteType
    }
  } catch (err) {
    console.warn('Gemini agent comment generation fallback used:', err)
    return { content: fallback, voteType: fallbackVote }
  }
}

/**
 * Dispatches an automated activity (comment + vote) by a selected agent on a stock
 */
export async function executeAgentActivityOnStock(
  stockId: string,
  stockData: {
    name: string
    ticker: string
    currentPrice: number
    fairPrice: number
    temperature: number
    pe?: number
    pbr?: number
    industry?: string
  },
  agentId?: string
) {
  // Pick an agent (or use provided agent)
  const agent = agentId 
    ? INVESTOR_AGENTS.find(a => a.id === agentId) || INVESTOR_AGENTS[0]
    : INVESTOR_AGENTS[Math.floor(Math.random() * INVESTOR_AGENTS.length)]

  // 1. Fetch recent discussions to prevent duplicate tone
  let recentList: string[] = []
  try {
    const q = query(
      collection(db, 'discussions'),
      where('stockId', '==', stockId),
      orderBy('createdAt', 'desc'),
      limit(5)
    )
    const snap = await getDocs(q)
    snap.forEach(d => {
      const data = d.data()
      if (data.content) recentList.push(data.content)
    })
  } catch (e) {
    console.warn('Failed to fetch recent discussions for agent:', e)
  }

  // 2. Generate content
  const { content, voteType } = await generateAgentComment(agent, stockData, recentList)

  // 3. Post Discussion to Firestore
  try {
    await addDoc(collection(db, 'discussions'), {
      stockId,
      uid: agent.id,
      displayName: agent.displayName,
      photoURL: agent.avatar,
      content,
      tempAtPost: stockData.temperature,
      createdAt: serverTimestamp(),
      likesCount: 0,
      repliesCount: 0,
      likedBy: []
    })
  } catch (err) {
    console.error('Failed to save agent discussion:', err)
  }

  // 4. Cast Vote to Firestore
  try {
    const voteRef = doc(db, 'stocks', stockId, 'votes', agent.id)
    const voteSnap = await getDoc(voteRef)
    const prevVote = voteSnap.exists() ? voteSnap.data()?.type : null

    if (!prevVote || prevVote !== voteType) {
      await runTransaction(db, async (tx) => {
        const sRef = doc(db, 'stocks', stockId)
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
  } catch (err) {
    console.error('Failed to cast agent vote:', err)
  }

  return { agent: agent.displayName, content, voteType }
}

/**
 * Checks and triggers simulated daily agent activities (e.g. 2~3 activities per day per stock)
 */
export async function checkAndTriggerDailyAgentSimulation(
  stockId: string,
  stockData: {
    name: string
    ticker: string
    currentPrice: number
    fairPrice: number
    temperature: number
    industry?: string
  }
) {
  // Use localStorage with last activity timestamp to throttle activities naturally
  const storageKey = `stocktemp_agent_act_${stockId}`
  const lastAct = localStorage.getItem(storageKey)
  const now = Date.now()
  
  // Throttle: Trigger at most once every 4 hours per client session (simulating 2~3 times a day)
  const MIN_INTERVAL_MS = 4 * 60 * 60 * 1000 // 4 hours
  
  if (lastAct && (now - parseInt(lastAct, 10)) < MIN_INTERVAL_MS) {
    return null
  }

  // 40% probability on view to keep it natural and organic
  if (Math.random() < 0.4) {
    localStorage.setItem(storageKey, now.toString())
    return await executeAgentActivityOnStock(stockId, stockData)
  }

  return null
}
