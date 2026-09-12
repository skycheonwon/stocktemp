import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Stock } from '../data/mockStocks'

export interface AnalysisReportItem {
  title: string;
  publisher: string;
  pubDate: string;
  content: string;
  link: string;
}

export interface AiAnalysisResult {
  latestNews_KO: AnalysisReportItem[];
  latestNews_EN: AnalysisReportItem[];
  latestNews_VI: AnalysisReportItem[];
  recommended_pe?: number;
}

/**
 * Ultra-fast on-demand generation and caching of 3-language investment brief via Gemini 3.5 Flash-Lite (1.4s response)
 */
export async function generateAndSaveStockAnalysis(stock: Stock): Promise<AiAnalysisResult | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY is not configured.')
    return null
  }

  const countryNames: Record<string, string> = {
    KR: 'South Korea (KOSPI/KOSDAQ)',
    US: 'United States (NYSE/NASDAQ)',
    VN: 'Vietnam (HOSE/HNX)',
    CN: 'China (SSE/SZSE)',
  }
  const countryLabel = countryNames[stock.country] || stock.country
  const stockName = stock.koreanName ? `${stock.koreanName} (${stock.name})` : stock.name

  const prompt = `You are an expert equity analyst.
Analyze '${stockName}' (Ticker: ${stock.ticker}, Market: ${countryLabel}, Industry: '${stock.industry}').
Provide concise, high-value investment summary in 3 languages (KO, EN, VI).

Return ONLY raw JSON object:
{
  "recommended_pe": 15,
  "ko": {
    "industry_outlook": "2-3 sentences on market demand and competitive moat in Korean.",
    "debt_and_risks": "2-3 sentences on financial health, cash flow, and risk factors in Korean.",
    "growth_drivers": "2-3 sentences on growth catalysts and valuation outlook in Korean."
  },
  "en": {
    "industry_outlook": "2-3 sentences on market demand and competitive moat in English.",
    "debt_and_risks": "2-3 sentences on financial health, cash flow, and risk factors in English.",
    "growth_drivers": "2-3 sentences on growth catalysts and valuation outlook in English."
  },
  "vi": {
    "industry_outlook": "2-3 sentences on market demand and competitive moat in Vietnamese.",
    "debt_and_risks": "2-3 sentences on financial health, cash flow, and risk factors in Vietnamese.",
    "growth_drivers": "2-3 sentences on growth catalysts and valuation outlook in Vietnamese."
  }
}`

  try {
    // 1st choice: ultra-fast gemini-3.5-flash-lite (1.4s), fallback: gemini-3.6-flash
    const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash']
    let parsed: any = null

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
              maxOutputTokens: 800
            }
          }),
          signal: AbortSignal.timeout(10000)
        })

        if (res.ok) {
          const data = await res.json()
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            let clean = text.trim()
            if (clean.startsWith('```')) {
              const lines = clean.split('\n')
              clean = lines.slice(1, -1).join('\n').trim()
            }
            parsed = JSON.parse(clean)
            if (parsed?.ko && parsed?.en && parsed?.vi) {
              break
            }
          }
        }
      } catch {
        // Try next model
      }
    }

    if (!parsed || !parsed.ko) {
      return null
    }

    const buildNewsList = (data: any, lang: 'ko' | 'en' | 'vi'): AnalysisReportItem[] => {
      const titles = {
        ko: ['🌐 산업 전망 및 플랫폼 경쟁력', '⚠️ 재무 건전성 및 리스크 점검', '🚀 미래 성장 동력 및 가치 평가'],
        en: ['🌐 Industry Outlook & Platform Moat', '⚠️ Financial Health & Key Risks', '🚀 Growth Drivers & Fair Value'],
        vi: ['🌐 Triển vọng ngành & Vị thế cạnh tranh', '⚠️ Sức khỏe tài chính & Rủi ro', '🚀 Động lực tăng trưởng & Định giá']
      }
      const pubDates = {
        ko: '실시간 AI 분석',
        en: 'Real-time AI Brief',
        vi: 'Phân tích AI'
      }

      return [
        {
          title: titles[lang][0],
          publisher: 'Gemini AI Fast',
          pubDate: pubDates[lang],
          content: data.industry_outlook || '',
          link: 'https://aistudio.google.com'
        },
        {
          title: titles[lang][1],
          publisher: 'Gemini AI Fast',
          pubDate: pubDates[lang],
          content: data.debt_and_risks || '',
          link: 'https://aistudio.google.com'
        },
        {
          title: titles[lang][2],
          publisher: 'Gemini AI Fast',
          pubDate: pubDates[lang],
          content: data.growth_drivers || '',
          link: 'https://aistudio.google.com'
        }
      ]
    }

    const result: AiAnalysisResult = {
      latestNews_KO: buildNewsList(parsed.ko, 'ko'),
      latestNews_EN: buildNewsList(parsed.en, 'en'),
      latestNews_VI: buildNewsList(parsed.vi, 'vi'),
      recommended_pe: parsed.recommended_pe ? Number(parsed.recommended_pe) : undefined
    }

    // Save/Cache permanently to Firestore
    try {
      const stockRef = doc(db, 'stocks', stock.id)
      await updateDoc(stockRef, {
        latestNews_KO: result.latestNews_KO,
        latestNews_EN: result.latestNews_EN,
        latestNews_VI: result.latestNews_VI,
        aiAnalyzedAt: new Date().toISOString(),
        ...(result.recommended_pe ? { defaultTargetPe: result.recommended_pe } : {})
      })
      console.log(`[Gemini AI] Fast analysis generated and cached for ${stock.ticker}`)
    } catch (dbErr) {
      console.warn('Error saving AI analysis to Firestore cache:', dbErr)
    }

    return result
  } catch (err) {
    console.error('Error generating fast AI analysis:', err)
    return null
  }
}

export interface GeminiStockRegistrationData {
  currentPrice: number;
  eps: number;
  per?: number;
  bps?: number;
  pbr?: number;
  recommended_pe?: number;
  latestNews_KO: AnalysisReportItem[];
  latestNews_EN: AnalysisReportItem[];
  latestNews_VI: AnalysisReportItem[];
}

/**
 * One-stop real-time metric collection + 3-language AI brief upon new stock registration via Gemini API (with Search Grounding)
 * Primary: gemini-3.5-flash-lite (fast response), Fallback: gemini-3.6-flash
 */
export async function fetchLiveStockMetricsAndAnalysisWithGemini(
  ticker: string,
  country: string,
  industry: string,
  stockName: string,
  koreanName: string,
  defaultTargetPe: number = 15
): Promise<GeminiStockRegistrationData | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY is not configured.')
    return null
  }

  const countryNames: Record<string, string> = {
    KR: 'South Korea (KRX: KOSPI/KOSDAQ)',
    US: 'United States (NYSE/NASDAQ)',
    VN: 'Vietnam (HOSE/HNX)',
    CN: 'China (SSE/SZSE)',
  }
  const countryLabel = countryNames[country] || country
  const displayName = koreanName ? `${koreanName} (${stockName || ticker})` : (stockName || ticker)

  const prompt = `You are a professional real-time financial analyst.
Search the latest real-time stock market data and financial statements for '${displayName}' (Ticker: ${ticker}, Market: ${countryLabel}, Industry: '${industry}').

Extract the following accurate data:
1. Real-time / latest closing stock price (currentPrice) as a pure number in local market currency (KRW for KR, USD for US, VND for VN, CNY for CN).
2. Trailing/latest EPS (Earnings Per Share) as a pure number. If negative (net loss), provide negative number.
3. PER (Price to Earnings Ratio).
4. BPS (Book Value Per Share) and PBR (Price to Book Ratio) if available.
5. Reasonable target P/E (recommended_pe) based on industry and growth prospects (e.g. 15).
6. Concise, high-value investment summary in 3 languages (KO, EN, VI): industry outlook, debt/financial risk, growth drivers.

Return ONLY raw JSON in this format:
{
  "currentPrice": 136500,
  "eps": 1840,
  "per": 74.18,
  "bps": 27552,
  "pbr": 4.95,
  "recommended_pe": 15,
  "ko": {
    "industry_outlook": "2-3 sentences in Korean.",
    "debt_and_risks": "2-3 sentences in Korean.",
    "growth_drivers": "2-3 sentences in Korean."
  },
  "en": {
    "industry_outlook": "2-3 sentences in English.",
    "debt_and_risks": "2-3 sentences in English.",
    "growth_drivers": "2-3 sentences in English."
  },
  "vi": {
    "industry_outlook": "2-3 sentences in Vietnamese.",
    "debt_and_risks": "2-3 sentences in Vietnamese.",
    "growth_drivers": "2-3 sentences in Vietnamese."
  }
}`

  const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash']

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1200
          }
        }),
        signal: AbortSignal.timeout(12000)
      })

      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          let clean = text.trim()
          if (clean.includes('```')) {
            const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
            if (match && match[1]) {
              clean = match[1].trim()
            }
          }
          const parsed = JSON.parse(clean)
          if (parsed && typeof parsed.currentPrice === 'number' && parsed.currentPrice > 0) {
            const buildNewsList = (data: any, lang: 'ko' | 'en' | 'vi'): AnalysisReportItem[] => {
              const titles = {
                ko: ['🌐 산업 전망 및 플랫폼 경쟁력', '⚠️ 재무 건전성 및 리스크 점검', '🚀 미래 성장 동력 및 가치 평가'],
                en: ['🌐 Industry Outlook & Platform Moat', '⚠️ Financial Health & Key Risks', '🚀 Growth Drivers & Fair Value'],
                vi: ['🌐 Triển vọng ngành & Vị thế cạnh tranh', '⚠️ Sức khỏe tài chính & Rủi ro', '🚀 Động lực tăng trưởng & Định giá']
              }
              const pubDates = {
                ko: '실시간 AI 분석',
                en: 'Real-time AI Brief',
                vi: 'Phân tích AI'
              }

              return [
                {
                  title: titles[lang][0],
                  publisher: 'Gemini AI Live',
                  pubDate: pubDates[lang],
                  content: data?.industry_outlook || '',
                  link: 'https://aistudio.google.com'
                },
                {
                  title: titles[lang][1],
                  publisher: 'Gemini AI Live',
                  pubDate: pubDates[lang],
                  content: data?.debt_and_risks || '',
                  link: 'https://aistudio.google.com'
                },
                {
                  title: titles[lang][2],
                  publisher: 'Gemini AI Live',
                  pubDate: pubDates[lang],
                  content: data?.growth_drivers || '',
                  link: 'https://aistudio.google.com'
                }
              ]
            }

            return {
              currentPrice: Number(parsed.currentPrice),
              eps: Number(parsed.eps) || (parsed.currentPrice / (parsed.per || defaultTargetPe)),
              per: parsed.per ? Number(parsed.per) : undefined,
              bps: parsed.bps ? Number(parsed.bps) : undefined,
              pbr: parsed.pbr ? Number(parsed.pbr) : undefined,
              recommended_pe: parsed.recommended_pe ? Number(parsed.recommended_pe) : defaultTargetPe,
              latestNews_KO: buildNewsList(parsed.ko || {}, 'ko'),
              latestNews_EN: buildNewsList(parsed.en || {}, 'en'),
              latestNews_VI: buildNewsList(parsed.vi || {}, 'vi')
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[Gemini API] Failed with ${model}, trying next model...`, e)
    }
  }

  return null
}
