import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, Flame, Snowflake, Plus, Wind, Sun, Zap,
  LogOut, Sparkles, User, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FolderHeart, ThumbsUp, Check
} from 'lucide-react'
import { 
  doc, setDoc, onSnapshot, collection, query, where 
} from 'firebase/firestore'
import { db } from '../firebase'
import { useLanguage } from '../context/LanguageContext'
import { useLivePrices } from '../context/LivePriceContext'
import { useAuth } from '../context/AuthContext'
import { WeatherIcon } from '../components/WeatherIcon'
import { translateIndustry, getCountryName } from '../data/translations'
import type { TranslationKey } from '../data/translations'
import { STOCK_CATALOG, type CatalogStock } from '../data/stockCatalog'
import { fetchLiveStockMetrics } from '../utils/fetchStockMetrics'
import { generateAndSaveStockAnalysis, fetchLiveStockMetricsAndAnalysisWithGemini } from '../utils/geminiAnalysis'
import SwipeableCard from '../components/SwipeableCard'
import LoginInline from '../components/LoginInline'
import StockDiscoverDeck from '../components/StockDiscoverDeck'
import {
  calculateFairPrice,
  calculateStockTemperature,
  getTemperatureDetails,
  calculateExpectedReturn,
} from '../utils/valuation'

const INDICES_CONFIG: { translationKey: TranslationKey; temp: number }[] = [
  { translationKey: 'kospi', temp: 37.1 },
  { translationKey: 'kosdaq', temp: 18.2 },
  { translationKey: 'sp500', temp: 42.5 },
  { translationKey: 'nasdaq', temp: 48.3 },
  { translationKey: 'shanghai', temp: 11.5 },
  { translationKey: 'shenzhen', temp: 8.2 },
  { translationKey: 'hangseng', temp: -3.5 },
  { translationKey: 'vnindex', temp: 32.2 },
  { translationKey: 'hnx', temp: 13.5 },
  { translationKey: 'nikkei', temp: 22.4 },
]

function isSubsequence(query: string, text: string): boolean {
  const q = query.toLowerCase().replace(/\s+/g, '')
  const textLower = text.toLowerCase().replace(/\s+/g, '')
  let qIdx = 0
  for (let tIdx = 0; tIdx < textLower.length && qIdx < q.length; tIdx++) {
    if (textLower[tIdx] === q[qIdx]) {
      qIdx++
    }
  }
  return qIdx === q.length
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const { t, language } = useLanguage()
  const [selectedCountry, setSelectedCountry] = useState<'ALL' | 'KR' | 'US' | 'VN' | 'CN'>(() => {
    return language === 'KO' ? 'KR' : language === 'VI' ? 'VN' : 'US'
  })
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL')
  const { stocks, prices, eps } = useLivePrices()
  const { user, logout } = useAuth()
  const isFiltered = selectedCountry !== 'ALL' || selectedIndustry !== 'ALL'

  // Automatically sync selected country when language changes
  useEffect(() => {
    if (language === 'KO') {
      setSelectedCountry('KR')
    } else if (language === 'VI') {
      setSelectedCountry('VN')
    } else if (language === 'EN') {
      setSelectedCountry('US')
    }
  }, [language])

  const scrollRef = useRef<HTMLDivElement>(null)
  const desktopAuthRef = useRef<HTMLDivElement>(null)
  const mobileAuthRef = useRef<HTMLDivElement>(null)
  const industryDropdownRef = useRef<HTMLDivElement>(null)
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false)

  const scrollToLogin = () => {
    const isMobileView = typeof window !== 'undefined' && window.innerWidth < 1024
    const target = isMobileView ? mobileAuthRef.current : desktopAuthRef.current
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const input = target.querySelector('input') as HTMLInputElement | null
      if (input) {
        setTimeout(() => input.focus(), 300)
      }
    }
  }

  // Real-time Firestore states
  const [profileData, setProfileData] = useState<any>({
    role: '',
    loginCount: 0,
    commentCount: 0,
    sponsorExpiry: null
  })

  // My Page Expanded Accordion
  const [isMyPageExpanded, setIsMyPageExpanded] = useState(false)
  const [myPageTab, setMyPageTab] = useState<'registered' | 'voted' | 'watchlist'>('registered')
  const [loadingMyPage, setLoadingMyPage] = useState(false)
  const [myVotes, setMyVotes] = useState<any[]>([])

  // Mobile View Mode: Category List vs Tinder-style Discover Deck
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'deck'>('list')

  // Mobile List 2-Tier Segmented Tab State (5-tier temperature + recommended)
  const [mobileListTab, setMobileListTab] = useState<'extreme_cold' | 'cold' | 'fair' | 'hot' | 'extreme_hot' | 'recommended'>('cold')

  // Desktop 3-Column Independent 2-Tier Tab States
  const [col1Tab, setCol1Tab] = useState<'extreme_cold' | 'cold'>('extreme_cold')
  const [col2Tab, setCol2Tab] = useState<'extreme_hot' | 'hot'>('extreme_hot')
  const [col3Tab, setCol3Tab] = useState<'fair' | 'recommended'>('fair')

  // Watchlist Local Storage
  const [watchlistIds, setWatchlistIds] = useState<string[]>([])

  const toggleWatchlist = (stockId: string) => {
    let updated: string[]
    if (watchlistIds.includes(stockId)) {
      updated = watchlistIds.filter(id => id !== stockId)
    } else {
      updated = [...watchlistIds, stockId]
    }
    setWatchlistIds(updated)
    localStorage.setItem('stocktemp_watchlist', JSON.stringify(updated))
  }

  // Hidden Stock List (Swipe-to-Dismiss)
  const [hiddenStockIds, setHiddenStockIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('stocktemp_hidden_stocks')
    return saved ? JSON.parse(saved) : []
  })

  // Add Stock Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addTicker, setAddTicker] = useState('')
  const [addName, setAddName] = useState('')
  const [addKoreanName, setAddKoreanName] = useState('')
  const [addCountry, setAddCountry] = useState<'KR' | 'US' | 'VN' | 'CN'>('KR')
  const [addIndustry, setAddIndustry] = useState('')
  const [addTargetPe, setAddPe] = useState<number>(15)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')
  const [autoFilledNotice, setAutoFilledNotice] = useState('')

  // Filter catalog suggestions with flexible matching (whitespace-insensitive)
  const catalogSuggestions = useMemo(() => {
    const raw = catalogSearchQuery.trim()
    if (!raw) return []
    const q = raw.toLowerCase()
    const cleanQ = q.replace(/\s+/g, '')

    return STOCK_CATALOG.filter(item => {
      const t = item.ticker.toLowerCase()
      const n = item.name.toLowerCase()
      const kn = (item.koreanName || '').toLowerCase()
      const cleanKn = kn.replace(/\s+/g, '')
      const cleanN = n.replace(/\s+/g, '')

      return (
        t.includes(q) ||
        n.includes(q) ||
        kn.includes(q) ||
        cleanKn.includes(cleanQ) ||
        cleanN.includes(cleanQ)
      )
    }).slice(0, 8)
  }, [catalogSearchQuery])

  const selectCatalogStock = (item: CatalogStock) => {
    setAddCountry(item.country)
    setAddTicker(item.ticker)
    setAddKoreanName(item.koreanName || item.name)
    setAddName(item.name)
    setAddIndustry(item.industry)
    setAddPe(item.targetPe || 15)
    setAutoFilledNotice(
      language === 'KO'
        ? `✨ '${item.koreanName || item.name}' (${item.ticker}) 정보가 자동 입력되었습니다!`
        : `✨ '${item.name}' (${item.ticker}) auto-filled successfully!`
    )
    setCatalogSearchQuery('')
  }

  // Scroll buttons handlers for horizontal indices tape
  const scrollIndices = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Translate vertical wheel scroll to horizontal scrolling on the indices tape
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        el.scrollLeft += e.deltaY * 0.8
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // Close industry dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(e.target as Node)) {
        setIsIndustryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sync profile data & auto promote admin email
  useEffect(() => {
    if (!user) {
      setProfileData({
        role: '',
        loginCount: 0,
        commentCount: 0,
        sponsorExpiry: null
      })
      return
    }

    const userRef = doc(db, 'users', user.uid)
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        if (user.email === 'thewayinvestment@gmail.com' && data.role !== 'admin') {
          setDoc(userRef, { role: 'admin' }, { merge: true })
        }
        setProfileData(data)
      }
    })

    return () => unsubscribe()
  }, [user])



  // Sync voted stocks for my page and ranking stats
  useEffect(() => {
    if (!user) {
      setMyVotes([])
      return
    }

    setLoadingMyPage(true)
    const q = query(
      collection(db, 'recommendations'),
      where('uid', '==', user.uid)
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const votes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setMyVotes(votes)
      setLoadingMyPage(false)
    }, (error) => {
      console.error('Error listening to my recommendations:', error)
      setLoadingMyPage(false)
    })

    return () => unsubscribe()
  }, [user])

  // Load watchlist
  useEffect(() => {
    const saved = localStorage.getItem('stocktemp_watchlist')
    if (saved) {
      setWatchlistIds(JSON.parse(saved))
    }
  }, [])

  // Compute live stock counts per country
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: stocks.length,
      KR: 0,
      US: 0,
      VN: 0,
      CN: 0,
    }
    stocks.forEach((s) => {
      if (s.country && counts[s.country] !== undefined) {
        counts[s.country]++
      }
    })
    return counts
  }, [stocks])

  // Dynamically compute unique industries present in the current country list
  const uniqueIndustries = useMemo(() => {
    const filteredByCountry = selectedCountry === 'ALL'
      ? stocks
      : stocks.filter(s => s.country === selectedCountry)
    const industries = filteredByCountry.map(s => translateIndustry(s.industry, language)).filter(Boolean)
    return ['ALL', ...Array.from(new Set(industries))].sort()
  }, [stocks, selectedCountry, language])

  // Reset selected industry if it doesn't exist in the current country's industry list
  useEffect(() => {
    if (selectedIndustry !== 'ALL' && !uniqueIndustries.includes(selectedIndustry)) {
      setSelectedIndustry('ALL')
    }
  }, [selectedCountry, uniqueIndustries, selectedIndustry])

  // Prepare stocks with their calculated valuation metrics
  const stocksWithMetrics = useMemo(() => {
    return stocks.map((stock) => {
      const currentPrice = prices[stock.id] || stock.currentPrice
      const currentEps = eps[stock.id] || stock.eps
      const isDeficit = currentEps <= 0
      const fairPrice = calculateFairPrice(currentEps, stock.defaultTargetPe, stock.bps, stock.pbr, currentPrice)
      const temperature = calculateStockTemperature(currentPrice, fairPrice)
      const currentPe = currentEps > 0 ? currentPrice / currentEps : 0
      const expectedReturn = calculateExpectedReturn(currentPe)
      const tempDetails = getTemperatureDetails(temperature)

      return {
        ...stock,
        currentPrice,
        fairPrice,
        temperature,
        expectedReturn,
        tempDetails,
        isDeficit,
      }
    })
  }, [stocks, prices, eps])

  // Web/Desktop Recently Viewed Stocks & Auto-Scroll Highlight
  const [recentStocks, setRecentStocks] = useState<any[]>([])
  const [highlightedStockId, setHighlightedStockId] = useState<string | null>(null)

  // Load recent stocks on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('stocktemp_recent_stocks')
      if (saved) {
        setRecentStocks(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load recent stocks:', e)
    }
  }, [])

  // Auto-restore last viewed stock (e.g. Nature Cell / 네이처셀) for both Web and Mobile
  useEffect(() => {
    if (typeof window === 'undefined') return
    const lastViewedId = sessionStorage.getItem('stocktemp_last_viewed')
    const lastViewMode = sessionStorage.getItem('stocktemp_last_view_mode')
    if (!lastViewedId || stocksWithMetrics.length === 0) return

    const targetStock = stocksWithMetrics.find(s => s.id === lastViewedId)
    if (targetStock) {
      if (lastViewMode === 'deck') {
        setMobileViewMode('deck')
      } else {
        setMobileViewMode('list')
        // Switch to the respective column/tab so it's guaranteed to be rendered
        if (targetStock.temperature < 0) {
          setCol1Tab('extreme_cold')
          setMobileListTab('extreme_cold')
        } else if (targetStock.temperature < 15) {
          setCol1Tab('cold')
          setMobileListTab('cold')
        } else if (targetStock.temperature > 40) {
          setCol2Tab('extreme_hot')
          setMobileListTab('extreme_hot')
        } else if (targetStock.temperature > 25) {
          setCol2Tab('hot')
          setMobileListTab('hot')
        } else {
          setCol3Tab('fair')
          setMobileListTab('fair')
        }
      }

      setHighlightedStockId(lastViewedId)

      // Smooth scroll to card after render
      const timer = setTimeout(() => {
        const el = document.getElementById(`stock-card-${lastViewedId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 350)

      // Clear highlight after 3.5 seconds
      const clearTimer = setTimeout(() => {
        setHighlightedStockId(null)
      }, 3500)

      return () => {
        clearTimeout(timer)
        clearTimeout(clearTimer)
      }
    }
  }, [stocksWithMetrics])

  // Hide stock helper
  const hideStock = (id: string) => {
    const updated = [...hiddenStockIds, id]
    setHiddenStockIds(updated)
    localStorage.setItem('stocktemp_hidden_stocks', JSON.stringify(updated))
  }

  // Filter based on search query, country, industry, and hiddenStockIds
  const filteredStocks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return stocksWithMetrics.filter((stock) => {
      const matchesSearch = !q ||
        isSubsequence(q, stock.name) ||
        (stock.koreanName && isSubsequence(q, stock.koreanName)) ||
        isSubsequence(q, stock.ticker)

      const matchesCountry = selectedCountry === 'ALL' || stock.country === selectedCountry
      const matchesIndustry = selectedIndustry === 'ALL' || translateIndustry(stock.industry, language) === selectedIndustry
      const matchesHidden = !hiddenStockIds.includes(stock.id)

      return matchesSearch && matchesCountry && matchesIndustry && matchesHidden
    })
  }, [stocksWithMetrics, searchQuery, selectedCountry, selectedIndustry, hiddenStockIds, language])

  // 1. Extreme Cold (< 0°C - 혹한기 기회주)
  const extremeColdStocks = useMemo(() => {
    const list = [...filteredStocks]
      .filter((s) => s.temperature < 0)
      .sort((a, b) => a.temperature - b.temperature)
    return isFiltered ? list : list.slice(0, 10)
  }, [filteredStocks, isFiltered])

  // 2. Normal Cold (0°C ~ 15°C - 쌀쌀함 저평가)
  const normalColdStocks = useMemo(() => {
    const list = [...filteredStocks]
      .filter((s) => s.temperature >= 0 && s.temperature < 15)
      .sort((a, b) => a.temperature - b.temperature)
    return isFiltered ? list : list.slice(0, 10)
  }, [filteredStocks, isFiltered])

  // 3. Fair / Stable (15°C ~ 25°C - 쾌적 안정주)
  const fairStocks = useMemo(() => {
    const list = [...filteredStocks]
      .filter((s) => s.temperature >= 15 && s.temperature <= 25)
      .sort((a, b) => a.temperature - b.temperature)
    return isFiltered ? list : list.slice(0, 10)
  }, [filteredStocks, isFiltered])

  // 4. Normal Hot (25°C ~ 40°C - 따뜻함/과열)
  const normalHotStocks = useMemo(() => {
    const list = [...filteredStocks]
      .filter((s) => s.temperature > 25 && s.temperature <= 40)
      .sort((a, b) => b.temperature - a.temperature)
    return isFiltered ? list : list.slice(0, 10)
  }, [filteredStocks, isFiltered])

  // 5. Extreme Hot (> 40°C - 폭염 위험주)
  const extremeHotStocks = useMemo(() => {
    const list = [...filteredStocks]
      .filter((s) => s.temperature > 40)
      .sort((a, b) => b.temperature - a.temperature)
    return isFiltered ? list : list.slice(0, 10)
  }, [filteredStocks, isFiltered])

  // 8. Recommended (추천 1회 이상)
  const recommendedStocks = useMemo(() => {
    const list = [...filteredStocks]
      .filter((s) => (s.recommendationCount || 0) >= 1)
      .sort((a, b) => (b.recommendationCount || 0) - (a.recommendationCount || 0))
    return isFiltered ? list : list.slice(0, 10)
  }, [filteredStocks, isFiltered])

  // Add stock handler
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Auth check
    if (!user) {
      setErrorMessage(
        language === 'KO' 
          ? '🔒 신규 종목을 등록하시려면 먼저 Google 로그인이 필요합니다.' 
          : language === 'VI'
          ? '🔒 Vui lòng đăng nhập để đăng ký mã cổ phiếu mới.'
          : '🔒 Please sign in with Google to register a new stock.'
      )
      return
    }

    // Korean locale requirements
    const nameRequired = language === 'KO' ? addKoreanName : addName
    if (!addTicker || !nameRequired || !addCountry || !addIndustry) {
      setErrorMessage(language === 'KO' ? '필수 항목(*)을 모두 입력해 주세요.' : 'Please fill in all required (*) fields.')
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    const formattedTicker = addTicker.trim().toUpperCase()
    const docId = `${addCountry}_${formattedTicker}`

    if (stocks.some(s => s.id === docId)) {
      setErrorMessage(language === 'KO' ? '이미 등록된 종목입니다.' : 'This stock is already registered.')
      setSubmitting(false)
      return
    }

    const currency = addCountry === 'KR' ? '₩' : addCountry === 'US' ? '$' : addCountry === 'VN' ? '₫' : '¥'
    let tradingViewSymbol = formattedTicker
    let naverTicker = formattedTicker

    if (addCountry === 'KR') {
      tradingViewSymbol = `KRX:${formattedTicker}`
      naverTicker = formattedTicker
    } else if (addCountry === 'US') {
      tradingViewSymbol = `NASDAQ:${formattedTicker}`
      naverTicker = `${formattedTicker}.O`
    } else if (addCountry === 'VN') {
      tradingViewSymbol = `HOSE:${formattedTicker}`
      naverTicker = `${formattedTicker}.HM`
    } else if (addCountry === 'CN') {
      if (formattedTicker.startsWith('6')) {
        tradingViewSymbol = `SSE:${formattedTicker}`
        naverTicker = `${formattedTicker}.SS`
      } else {
        tradingViewSymbol = `SZSE:${formattedTicker}`
        naverTicker = `${formattedTicker}.SZ`
      }
    }

    const targetPeVal = Number(addTargetPe) || 15
    let livePrice = 1
    let liveEps = 1
    let geminiReport: any = null

    try {
      // 1st Priority: Gemini Search Grounding (Primary: gemini-3.5-flash-lite, Fallback: gemini-3.6-flash)
      const geminiData = await fetchLiveStockMetricsAndAnalysisWithGemini(
        formattedTicker,
        addCountry,
        addIndustry.trim(),
        addName.trim(),
        addKoreanName.trim(),
        targetPeVal
      )

      if (geminiData && geminiData.currentPrice > 0) {
        livePrice = geminiData.currentPrice
        liveEps = geminiData.eps
        geminiReport = {
          latestNews_KO: geminiData.latestNews_KO,
          latestNews_EN: geminiData.latestNews_EN,
          latestNews_VI: geminiData.latestNews_VI,
          aiAnalyzedAt: new Date().toISOString(),
          ...(geminiData.bps ? { bps: geminiData.bps } : {}),
          ...(geminiData.pbr ? { pbr: geminiData.pbr } : {}),
          ...(geminiData.recommended_pe ? { defaultTargetPe: geminiData.recommended_pe } : {})
        }
      } else {
        // Fallback: Naver/Yahoo live proxy
        const metrics = await fetchLiveStockMetrics(formattedTicker, addCountry, targetPeVal)
        if (metrics.currentPrice > 0) livePrice = metrics.currentPrice
        if (metrics.eps > 0) liveEps = metrics.eps
      }
    } catch {
      // Fallback
    }

    const newStockData = {
      ticker: formattedTicker,
      name: addName.trim() || addKoreanName.trim(),
      koreanName: addKoreanName.trim() || addName.trim(),
      country: addCountry,
      industry: addIndustry.trim(),
      eps: liveEps,
      currentPrice: livePrice,
      currency,
      defaultTargetPe: targetPeVal,
      tradingViewSymbol,
      naverTicker,
      createdBy: user.uid,
      recommendationReason: 'Registered via Web',
      lastUpdated: new Date().toISOString(),
      ...(geminiReport || {})
    }

    try {
      await setDoc(doc(db, 'stocks', docId), newStockData)
      
      // If Gemini report wasn't generated synchronously, trigger background analysis
      if (!geminiReport) {
        generateAndSaveStockAnalysis({ id: docId, ...newStockData } as any).catch(() => {})
      }

      setAddTicker('')
      setAddName('')
      setAddKoreanName('')
      setAddIndustry('')
      setAddPe(15)
      setAutoFilledNotice('')
      setCatalogSearchQuery('')
      setIsAddModalOpen(false)
    } catch (err: any) {
      if (err.message && err.message.includes('insufficient permissions')) {
        setErrorMessage(
          language === 'KO'
            ? '🔒 등록 권한이 없습니다. 로그인이 유지되어 있는지 확인해 주세요.'
            : '🔒 Permission denied. Please check your login session.'
        )
      } else {
        setErrorMessage(err.message || 'Error occurred.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate dynamic grade & rank values
  const registeredCount = useMemo(() => {
    return stocks.filter(s => s.createdBy === user?.uid).length
  }, [stocks, user])

  const votedCount = useMemo(() => myVotes.length, [myVotes])
  // Contribution = stock registrations + votes (no supportPoints)
  const contribCount = useMemo(() => registeredCount + votedCount, [registeredCount, votedCount])

  // VIP Sponsor: active if sponsorExpiry exists and hasn't passed
  const isVipSponsor = useMemo(() => {
    if (!profileData.sponsorExpiry) return false
    const expiry = profileData.sponsorExpiry?.toDate ? profileData.sponsorExpiry.toDate() : new Date(profileData.sponsorExpiry)
    return new Date() < expiry
  }, [profileData.sponsorExpiry])

  // User Grade — login count only
  const userGradeVal = useMemo(() => {
    const lc = profileData.loginCount || 0
    if (lc >= 100) return language === 'KO' ? '💎 다이아 투자자' : language === 'VI' ? '💎 Kim Cương' : '💎 Diamond Investor'
    if (lc >= 50)  return language === 'KO' ? '🌟 골드 투자자'  : language === 'VI' ? '🌟 Vàng'       : '🌟 Gold Investor'
    if (lc >= 20)  return language === 'KO' ? '✨ 실버 투자자'  : language === 'VI' ? '✨ Bạc'        : '✨ Silver Investor'
    if (lc >= 5)   return language === 'KO' ? '☘️ 브론즈 투자자' : language === 'VI' ? '☘️ Đồng'      : '☘️ Bronze Investor'
    return           language === 'KO' ? '🌱 새싹 투자자'  : language === 'VI' ? '🌱 Mầm Non'    : '🌱 Starter Investor'
  }, [profileData.loginCount, language])

  // Contribution Rank — stock add + votes
  const contribRankVal = useMemo(() => {
    if (contribCount >= 50) return language === 'KO' ? '명예 기여자 👑' : language === 'VI' ? 'Danh Dự 👑'  : 'Honor Contributor 👑'
    if (contribCount >= 20) return language === 'KO' ? '골드 기여자 🥇' : language === 'VI' ? 'Vàng 🥇'     : 'Gold Contributor 🥇'
    if (contribCount >= 10) return language === 'KO' ? '실버 기여자 🥈' : language === 'VI' ? 'Bạc 🥈'      : 'Silver Contributor 🥈'
    if (contribCount >= 3)  return language === 'KO' ? '브론즈 기여자 🥉' : language === 'VI' ? 'Đồng 🥉'   : 'Bronze Contributor 🥉'
    return                   language === 'KO' ? '기여 없음 😶'  : language === 'VI' ? 'Chưa đóng góp 😶' : 'No Contribution 😶'
  }, [contribCount, language])

  // Knowledge Rank — comment count
  const knowledgeRankVal = useMemo(() => {
    const cc = profileData.commentCount || 0
    if (cc >= 50) return language === 'KO' ? '📚 지식인 마스터' : language === 'VI' ? '📚 Bậc Thầy'   : '📚 Knowledge Master'
    if (cc >= 20) return language === 'KO' ? '🎓 지식 전문가'  : language === 'VI' ? '🎓 Chuyên Gia'  : '🎓 Knowledge Expert'
    if (cc >= 10) return language === 'KO' ? '📖 지식 활동가'  : language === 'VI' ? '📖 Hoạt Động'   : '📖 Knowledge Activist'
    if (cc >= 3)  return language === 'KO' ? '💬 지식 새싹'   : language === 'VI' ? '💬 Mầm Non'     : '💬 Knowledge Sprout'
    return          language === 'KO' ? '🤐 아직 말수 없음' : language === 'VI' ? '🤐 Chưa có ý kiến' : '🤐 No Comments Yet'
  }, [profileData.commentCount, language])

  const getProfileText = (key: string) => {
    const loginCount = profileData.loginCount
    const registeredCount = stocks.filter((stock) => stock.createdBy === user?.uid).length
    const votedCount = myVotes.length
    const contribCount = registeredCount + votedCount + (profileData.supportPoints || 0)

    const texts: Record<string, { KO: string; EN: string; VI: string }> = {
      checkRecs: {
        KO: '투자자 추천 종목을 확인하고 직접 등록해 보세요.',
        EN: 'Check recommended stocks and register your own.',
        VI: 'Xem danh sách cổ phiếu được đề xuất và tự đăng ký.'
      },
      signInRequired: {
        KO: '로그인 하시면 종목 추천 투표및 신규 종목 등록이 활성화 됩니다.',
        EN: 'Sign in to recommend and add stocks.',
        VI: 'Đăng nhập để bình chọn khuyến nghị và thêm cổ phiếu mới.'
      },
      signIn: {
        KO: '로그인',
        EN: 'Sign In',
        VI: 'Đăng nhập'
      },
      collapse: {
        KO: '접기',
        EN: 'Collapse',
        VI: 'Thu gọn'
      },
      liveRecs: {
        KO: '실시간 추천 리스트',
        EN: 'Live Recommendations',
        VI: 'Danh sách khuyến nghị trực tuyến'
      },
      userGrade: {
        KO: '사용자 등급',
        EN: 'User Grade',
        VI: 'Hạng người dùng'
      },
      userGradeVal: {
        KO: profileData.isSponsor ? 'VIP 명예 회원 👑 (Diamond)' : (loginCount >= 30 ? '전문가 투자자 💎' : loginCount >= 10 ? '성숙한 투자자 🌳' : loginCount >= 3 ? '성장하는 투자자 🌿' : '새싹 투자자 🌱'),
        EN: profileData.isSponsor ? 'VIP Member 👑 (Diamond)' : (loginCount >= 30 ? 'Expert Investor 💎' : loginCount >= 10 ? 'Mature Investor 🌳' : loginCount >= 3 ? 'Growing Investor 🌿' : 'Novice Investor 🌱'),
        VI: profileData.isSponsor ? 'Thành viên VIP 👑 (Diamond)' : (loginCount >= 30 ? 'Chuyên gia 💎' : loginCount >= 10 ? 'Trưởng thành 🌳' : loginCount >= 3 ? 'Phát triển 🌿' : 'Mầm non 🌱')
      },
      contribRank: {
        KO: '기여 순위',
        EN: 'Contrib Rank',
        VI: 'Hạng đóng góp'
      },
      contribRankVal: {
        KO: contribCount >= 15 ? '명예 기여자 👑 (상위 1%)' : contribCount >= 7 ? '골드 기여자 🥇 (상위 10%)' : contribCount >= 3 ? '실버 기여자 🥈 (상위 30%)' : contribCount >= 1 ? '브론즈 기여자 🥉 (상위 70%)' : '기여 없음 😭 (상위 100%)',
        EN: contribCount >= 15 ? 'Honor Contributor 👑 (Top 1%)' : contribCount >= 7 ? 'Gold Contributor 🥇 (Top 10%)' : contribCount >= 3 ? 'Silver Contributor 🥈 (Top 30%)' : contribCount >= 1 ? 'Bronze Contributor 🥉 (Top 70%)' : 'No Contribution 😭 (Top 100%)',
        VI: contribCount >= 15 ? 'Danh dự 👑 (Top 1%)' : contribCount >= 7 ? 'Vàng 🥇 (Top 10%)' : contribCount >= 3 ? 'Bạc 🥈 (Top 30%)' : contribCount >= 1 ? 'Đồng 🥉 (Top 70%)' : 'Chưa đóng góp 😭 (Top 100%)'
      },
      knowledge: {
        KO: '기여도 점수',
        EN: 'Contribution Score',
        VI: 'Điểm đóng góp'
      },
      myPage: {
        KO: '마이 페이지',
        EN: 'My Page',
        VI: 'Trang của tôi'
      },
      tabAdded: {
        KO: '등록 종목',
        EN: 'My Stocks',
        VI: 'Đã đăng ký'
      },
      tabVoted: {
        KO: '추천/비추천',
        EN: 'Votes',
        VI: 'Đã biểu quyết'
      },
      tabWatchlist: {
        KO: '관심 목록',
        EN: 'Watchlist',
        VI: 'Theo dõi'
      },
      loading: {
        KO: '불러오는 중...',
        EN: 'Loading...',
        VI: 'Đang tải...'
      },
      emptyAdded: {
        KO: '직접 등록한 종목이 없습니다.',
        EN: 'You have not added any stocks.',
        VI: 'Bạn chưa đăng ký cổ phiếu nào.'
      },
      emptyVoted: {
        KO: '투표한 종목이 없습니다.',
        EN: 'You have not voted on any stocks.',
        VI: 'Bạn chưa biểu quyết cổ phiếu nào.'
      },
      emptyWatchlist: {
        KO: '관심 종목이 없습니다.',
        EN: 'Watchlist is empty.',
        VI: 'Danh sách theo dõi trống.'
      },
      logout: {
        KO: '로그아웃',
        EN: 'Log Out',
        VI: 'Đăng xuất'
      }
    }
    return texts[key]?.[language] || ''
  }

  // User Profile Card JSX
  const renderUserWidget = (refProp?: any) => {
    return user && (
      <div 
        ref={refProp}
        className="bg-gradient-to-br from-slate-900 to-slate-955 rounded-3xl p-5 md:p-6 shadow-xl space-y-4 scroll-mt-6 relative overflow-hidden select-none border border-slate-800/60"
      >
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-11 h-11 rounded-full border border-blue-500/30"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <User className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-slate-200 truncate flex items-center gap-1.5">
                <span>{user.displayName || 'StockTemp User'}</span>
                {isVipSponsor && (
                  <span 
                    className="text-[8px] bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black px-1.5 py-0.5 rounded-md shadow-md flex items-center shrink-0 leading-none select-none"
                    title={language === 'KO' ? 'VIP 명예 회원' : language === 'VI' ? 'Thành viên VIP' : 'VIP Member'}
                  >
                    👑 VIP Member
                  </span>
                )}
              </h4>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logout()
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-455 hover:bg-rose-500/5 transition-all cursor-pointer ml-auto flex-shrink-0"
            title={getProfileText('logout')}
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-955/60 rounded-2xl p-3.5 text-center select-none relative z-10">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">
              {language === 'KO' ? '사용자 등급' : language === 'VI' ? 'Hạng' : 'Grade'}
            </span>
            <span className="text-[10px] font-extrabold text-blue-400 block truncate">
              {userGradeVal}
            </span>
          </div>
          <div className="space-y-1 border-x border-slate-800/40">
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">
              {language === 'KO' ? '기여 순위' : language === 'VI' ? 'Hạng Đóng Góp' : 'Contrib Rank'}
            </span>
            <span className="text-[10px] font-extrabold text-emerald-400 block">
              {contribRankVal}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">
              {language === 'KO' ? '지식 순위' : language === 'VI' ? 'Hạng Kiến Thức' : 'Knowledge'}
            </span>
            <span className="text-[10px] font-extrabold text-rose-400 block">
              {knowledgeRankVal}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMyPageExpanded(!isMyPageExpanded)}
          className="w-full py-2.5 bg-slate-850/80 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm relative z-10"
        >
          <span>{getProfileText('myPage')}</span>
          {isMyPageExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isMyPageExpanded && (
          <div className="pt-4 border-t border-slate-800/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 text-left relative z-10">
            <div className="flex border-b border-slate-800/50 text-center text-[9px] tracking-wider uppercase">
              <button
                type="button"
                onClick={() => setMyPageTab('registered')}
                className={`flex-1 pb-1.5 border-b-2 font-bold transition-all cursor-pointer ${
                  myPageTab === 'registered' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-400'
                }`}
              >
                {getProfileText('tabAdded')}
              </button>
              <button
                type="button"
                onClick={() => setMyPageTab('voted')}
                className={`flex-1 pb-1.5 border-b-2 font-bold transition-all cursor-pointer ${
                  myPageTab === 'voted' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-400'
                }`}
              >
                {getProfileText('tabVoted')}
              </button>
              <button
                type="button"
                onClick={() => setMyPageTab('watchlist')}
                className={`flex-1 pb-1.5 border-b-2 font-bold transition-all cursor-pointer ${
                  myPageTab === 'watchlist' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-400'
                }`}
              >
                {getProfileText('tabWatchlist')}
              </button>
            </div>

            {loadingMyPage ? (
              <div className="text-center py-6 text-slate-500 text-xs font-mono">
                {getProfileText('loading')}
              </div>
            ) : (
              <>
                {myPageTab === 'registered' && (() => {
                  const myRegs = stocks.filter((s) => s.createdBy === user.uid)
                  if (myRegs.length === 0) {
                    return (
                      <div className="text-center py-8 text-xs text-slate-500 font-medium space-y-1">
                        <FolderHeart className="w-5 h-5 text-slate-700 mx-auto" />
                        <p>{getProfileText('emptyAdded')}</p>
                      </div>
                    )
                  }
                  return (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {myRegs.map((stock) => {
                        const displayName = language === 'KO' ? (stock.koreanName || stock.name) : stock.name
                        return (
                          <Link
                            key={stock.id}
                            to={`/stock/${stock.id}`}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-850/70 via-slate-900/50 to-slate-950/70 hover:from-slate-800/80 hover:via-slate-850/60 hover:to-slate-900/80 rounded-xl transition-all shadow-sm"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <span className="text-[9px] text-slate-500 font-mono block">{stock.ticker}</span>
                              <span className="text-xs font-bold text-slate-200 block truncate">{displayName}</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-400">
                              {stock.currency}{prices[stock.id] ? prices[stock.id].toLocaleString() : stock.currentPrice.toLocaleString()}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  )
                })()}

                {myPageTab === 'voted' && (() => {
                  if (myVotes.length === 0) {
                    return (
                      <div className="text-center py-8 text-xs text-slate-500 font-medium space-y-1">
                        <FolderHeart className="w-5 h-5 text-slate-700 mx-auto" />
                        <p>{getProfileText('emptyVoted')}</p>
                      </div>
                    )
                  }
                  return (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {myVotes.map((vote) => {
                        const stock = stocks.find((s) => s.id === vote.stockId)
                        if (!stock) return null
                        const displayName = language === 'KO' ? (stock.koreanName || stock.name) : stock.name
                        return (
                          <Link
                            key={vote.stockId}
                            to={`/stock/${vote.stockId}`}
                            className="block p-3 bg-gradient-to-r from-slate-850/70 via-slate-900/50 to-slate-950/70 hover:from-slate-800/80 hover:via-slate-850/60 hover:to-slate-900/80 rounded-xl transition-all shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1 pr-2">
                                <span className="text-[9px] text-slate-500 font-mono block">{stock.ticker}</span>
                                <span className="text-xs font-bold text-slate-200 block truncate">{displayName}</span>
                              </div>
                              {vote.type === 'up' ? (
                                <span className="text-[9px] font-black text-emerald-455 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase">Up</span>
                              ) : (
                                <span className="text-[9px] font-black text-rose-455 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-full uppercase">Down</span>
                              )}
                            </div>
                            {vote.reason && (
                              <p className="text-[10px] text-slate-400 bg-slate-955/40 px-2 py-1 rounded truncate italic mt-1 select-none">
                                &ldquo;{vote.reason}&rdquo;
                              </p>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )
                })()}

                {myPageTab === 'watchlist' && (() => {
                  const watchlistStocks = stocks.filter((s) => watchlistIds.includes(s.id))
                  if (watchlistStocks.length === 0) {
                    return (
                      <div className="text-center py-8 text-xs text-slate-500 font-medium space-y-1">
                        <FolderHeart className="w-5 h-5 text-slate-700 mx-auto" />
                        <p>{getProfileText('emptyWatchlist')}</p>
                      </div>
                    )
                  }
                  return (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {watchlistStocks.map((stock) => {
                        const displayName = language === 'KO' ? (stock.koreanName || stock.name) : stock.name
                        return (
                          <SwipeableCard
                            key={stock.id}
                            id={stock.id}
                            innerClassName="rounded-xl"
                            onDismiss={() => {
                              const updated = watchlistIds.filter((item) => item !== stock.id)
                              setWatchlistIds(updated)
                              localStorage.setItem('stocktemp_watchlist', JSON.stringify(updated))
                            }}
                          >
                            <Link
                              to={`/stock/${stock.id}`}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-850/70 via-slate-900/50 to-slate-950/70 hover:from-slate-800/80 hover:via-slate-850/60 hover:to-slate-900/80 rounded-xl transition-all shadow-sm"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <span className="text-[9px] text-slate-500 font-mono block">{stock.ticker}</span>
                                <span className="text-xs font-bold text-slate-200 block truncate">{displayName}</span>
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-450">
                                {stock.currency}{prices[stock.id] ? prices[stock.id].toLocaleString() : stock.currentPrice.toLocaleString()}
                              </span>
                            </Link>
                          </SwipeableCard>
                        )
                      })}
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // Unified Auth Widget (Login Inline or Profile Card)
  const renderAuthWidget = (isMobile = false) => {
    const targetRef = isMobile ? mobileAuthRef : desktopAuthRef
    if (!user) {
      return (
        <div 
          ref={targetRef}
          className="bg-gradient-to-br from-slate-900 to-slate-955 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden select-none border border-slate-800/60 scroll-mt-6"
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <LoginInline />
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed text-center px-1">
              {language === 'KO' 
                ? '로그인 하시면 종목 추천 투표및 신규 종목 등록이 활성화 됩니다.' 
                : language === 'VI' 
                ? 'Đăng nhập để biểu quyết và thêm cổ phiếu mới.' 
                : 'Please log in to vote on stocks and register new items.'}
            </p>
          </div>
        </div>
      )
    }

    return renderUserWidget(targetRef)
  }

  return (
    <div className="space-y-6">
      {/* Mobile Only: Top Auth / Profile / MyPage Section */}
      <div className="block lg:hidden">
        {renderAuthWidget(true)}
      </div>

      {/* Welcome & Market Temperature Section - Full Width Card with 2-Column Grid */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-955 border border-slate-800/60 rounded-3xl p-6 md:p-8 relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Left Column: Title and Description */}
          <div className="space-y-3 text-left">
            <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5.5 h-5.5 text-blue-400 animate-pulse" />
              <span>{t('heroTitle')}</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-450 leading-relaxed font-medium">
              {t('heroDesc')}
            </p>
            <p className="text-xs md:text-sm text-blue-300/90 leading-relaxed font-medium">
              {t('heroCommunityDesc')}
            </p>
          </div>

          {/* Right Column: Embedded Horizontal Scrolling Indices Card tape with Left/Right Buttons */}
          <div className="relative select-none w-full overflow-hidden group/indices">
            {/* Left Scroll Button (Desktop only) */}
            <button
              type="button"
              onClick={() => scrollIndices('left')}
              className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750/50 items-center justify-center shadow-xl transition-all cursor-pointer backdrop-blur-sm opacity-80 group-hover/indices:opacity-100"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>

            {/* Right Scroll Button (Desktop only) */}
            <button
              type="button"
              onClick={() => scrollIndices('right')}
              className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750/50 items-center justify-center shadow-xl transition-all cursor-pointer backdrop-blur-sm opacity-80 group-hover/indices:opacity-100"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>

            <div className="hidden md:block absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
            <div className="hidden md:block absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
            
            <div
              ref={scrollRef}
              className="flex gap-3.5 overflow-x-auto py-3 px-2 md:px-8 scrollbar-none scroll-smooth cursor-grab active:cursor-grabbing"
            >
              {INDICES_CONFIG.map((idx, index) => {
                const displayTemp = `${idx.temp}` // No plus prefix for positive temperatures
                const tempDetails = getTemperatureDetails(idx.temp)
                
                // Custom simplified label for index card badge matching the 5 levels
                const label = idx.temp >= 50
                  ? (language === 'KO' ? '극단적 고평가' : language === 'VI' ? 'Định giá cực cao' : 'Extreme Overvalued')
                  : idx.temp >= 35
                    ? (language === 'KO' ? '고평가' : language === 'VI' ? 'Định giá cao' : 'Overvalued')
                    : idx.temp >= 15
                      ? (language === 'KO' ? '적정가' : language === 'VI' ? 'Hợp lý' : 'Fair')
                      : idx.temp >= 0
                        ? (language === 'KO' ? '저평가' : language === 'VI' ? 'Định giá thấp' : 'Undervalued')
                        : (language === 'KO' ? '극심한 저평가' : language === 'VI' ? 'Định giá cực thấp' : 'Extreme Undervalued')

                // Color-only styling for badges without outlines
                const badgeColorClass = idx.temp >= 50
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-900/50'
                  : idx.temp >= 35
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-900/50'
                    : idx.temp >= 15
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-900/50'
                      : idx.temp >= 0
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-900/50'
                        : 'bg-blue-950/80 text-blue-300 border border-blue-900/50'

                const weatherIconColorClass = idx.temp >= 50
                  ? 'text-rose-550'
                  : idx.temp >= 35
                    ? 'text-amber-500'
                    : idx.temp >= 15
                      ? 'text-emerald-500'
                      : idx.temp >= 0
                        ? 'text-cyan-400'
                        : 'text-blue-400'

                const tempColorClass = idx.temp >= 50
                  ? 'text-rose-500'
                  : idx.temp >= 35
                    ? 'text-amber-400'
                    : idx.temp >= 15
                      ? 'text-emerald-400'
                      : idx.temp >= 0
                        ? 'text-cyan-400'
                        : 'text-blue-400'

                return (
                  <div
                    key={index}
                    className="w-36 h-28 flex flex-col justify-between items-center bg-slate-955/45 rounded-2xl p-3.5 shrink-0 transition-colors animate-in zoom-in-95 duration-200 border-none"
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {t(idx.translationKey)}
                    </span>
                    <span className={`text-base font-mono font-black mt-1 block ${tempColorClass}`}>
                      {displayTemp}°C
                    </span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <WeatherIcon name={tempDetails.iconName} className={`w-5 h-5 ${weatherIconColorClass}`} />
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold select-none leading-none tracking-wide ${badgeColorClass}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-slate-900/20 border-none rounded-3xl p-3.5 md:p-5 space-y-3">
        {/* Row 1: Search Input + Register Stock Button */}
        <div className="flex items-center gap-2 w-full">
          {/* Gradient Borderless Search Bar */}
          <div className="relative flex-1 p-[1px] rounded-2xl bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-850/80 shadow-md">
            <div className="relative w-full bg-slate-950/90 rounded-[15px] flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none rounded-[15px] pl-9.5 pr-4 py-2.5 text-xs text-slate-200 outline-none transition-all placeholder-slate-600 font-medium"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!user) {
                scrollToLogin()
              } else {
                setIsAddModalOpen(true)
              }
            }}
            className="px-4 py-2.5 text-[14px] font-bold rounded-2xl transition-all cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5 shrink-0 active:scale-95 whitespace-nowrap"
            title={language === 'KO' ? '종목 추가' : 'Add Stock'}
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'KO' ? '종목추가' : language === 'VI' ? 'Thêm mã' : 'Add Stock'}</span>
          </button>
        </div>

        {/* Row 2: 3x2 Grid on Mobile (5 Countries + Industry), 1-Row Flex on Desktop */}
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-2.5 pt-1">
          {/* Country Tabs: 'contents' on mobile (flows as 5 grid items), 'sm:flex' on desktop */}
          <div className="contents sm:flex sm:items-center sm:gap-1.5">
            {[
              { id: 'ALL', flag: '', label: t('all') },
              { id: 'KR', flag: '🇰🇷', label: t('korea') },
              { id: 'US', flag: '🇺🇸', label: t('usa') },
              { id: 'VN', flag: '🇻🇳', label: t('vietnam') },
              { id: 'CN', flag: '🇨🇳', label: t('china') }
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCountry(c.id as any)}
                className={`w-full sm:w-auto px-1.5 sm:px-3.5 py-2 text-[13px] sm:text-[14px] font-bold rounded-2xl transition-all cursor-pointer border-none flex items-center justify-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap min-w-0 ${
                  selectedCountry === c.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                    : 'bg-gradient-to-r from-slate-900/80 via-slate-950/70 to-slate-900/80 text-slate-350 hover:text-slate-100 hover:from-slate-850 hover:to-slate-850 shadow-sm'
                }`}
              >
                {c.flag && <span className="text-[13px] sm:text-[14px] shrink-0 leading-none">{c.flag}</span>}
                <span className="font-bold truncate">{c.label}</span>
                <span
                  className={`px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono rounded-full leading-none font-bold shrink-0 ${
                    selectedCountry === c.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {countryCounts[c.id] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Industry Dropdown: 6th grid item on mobile, right-aligned on desktop */}
          <div className="relative w-full sm:w-auto shrink-0 sm:min-w-[160px] h-full" ref={industryDropdownRef}>
            <div className="h-full p-[1px] rounded-2xl bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-850/80 shadow-md flex items-center">
              <button
                type="button"
                onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                className="w-full h-full bg-slate-950/90 hover:bg-slate-900/90 rounded-[15px] px-2 sm:px-4 py-2 text-xs font-bold text-slate-200 flex items-center justify-between gap-1 sm:gap-2 transition-all cursor-pointer border-none"
              >
                <span className="truncate text-center w-full">
                  {selectedIndustry === 'ALL'
                    ? (language === 'KO' ? '전체 업종' : language === 'VI' ? 'Tất cả ngành' : 'All Industries')
                    : selectedIndustry}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isIndustryDropdownOpen ? 'rotate-180 text-blue-400' : ''}`} />
              </button>
            </div>

            {isIndustryDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 max-w-[calc(100vw-2rem)] max-h-72 overflow-y-auto bg-slate-900/98 backdrop-blur-xl border border-slate-750/80 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIndustry('ALL')
                    setIsIndustryDropdownOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    selectedIndustry === 'ALL'
                      ? 'bg-blue-600/20 text-blue-400 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span>{language === 'KO' ? '전체 업종' : language === 'VI' ? 'Tất cả ngành nghề' : 'All Industries'}</span>
                  {selectedIndustry === 'ALL' && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>

                {uniqueIndustries.filter(ind => ind !== 'ALL').map((ind) => {
                  const isSelected = selectedIndustry === ind
                  return (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => {
                        setSelectedIndustry(ind)
                        setIsIndustryDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-400 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{ind}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Search Results / Lists view */}
        {searchQuery && (
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-450 uppercase tracking-wider">
                {t('searchResults')} ({filteredStocks.length})
              </h3>
            </div>
            {filteredStocks.length === 0 ? (
              <div className="text-center py-16 bg-slate-955/20 border border-slate-850 rounded-2xl space-y-4">
                <div className="text-slate-655 text-xs font-medium">
                  {language === 'KO' ? '검색된 종목이 없습니다.' : 'No matching stocks found.'}
                </div>
                {user && (
                  <button
                    onClick={() => {
                      setAddTicker(searchQuery)
                      setIsAddModalOpen(true)
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    {language === 'KO' ? `'${searchQuery}' 종목 직접 등록하기` : `Register '${searchQuery}' manually`}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStocks.map((stock) => (
                  <SwipeableCard
                    key={stock.id}
                    id={stock.id}
                    onDismiss={() => hideStock(stock.id)}
                  >
                    <StockCard 
                      stock={stock} 
                      isHighlighted={highlightedStockId === stock.id}
                    />
                  </SwipeableCard>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Lists Section (Coldest / Hottest / Recommended Lists) */}
      {!searchQuery && (
        <div className="space-y-6">
          {/* Recently Viewed Quick Bar (Web & Mobile - Placed at Top) */}
          {recentStocks.length > 0 && (
            <div className="flex items-center justify-between p-3 px-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
              <div 
                className="flex items-center gap-2.5 min-w-0 overflow-x-auto scrollbar-none no-scrollbar py-0.5 flex-1 overscroll-x-contain"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY * 0.85
                  }
                }}
              >
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0 pr-3 border-r border-slate-800 select-none">
                  <span className="text-amber-400">🕒</span>
                  <span className="whitespace-nowrap">{t('recentViewed')}</span>
                </span>
                <div className="flex items-center gap-2">
                  {recentStocks.map((rs) => {
                    const fullStock = stocksWithMetrics.find(s => s.id === rs.id)
                    const temp = fullStock ? fullStock.temperature : null
                    const tempDetails = temp !== null ? getTemperatureDetails(temp) : null
                    const name = language === 'KO' ? (rs.koreanName || rs.name) : rs.name
                    const isCurHighlighted = highlightedStockId === rs.id

                    return (
                      <Link
                        key={rs.id}
                        to={`/stock/${rs.id}`}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          isCurHighlighted
                            ? 'bg-blue-500/25 border-blue-400 text-blue-200 shadow-md shadow-blue-500/25 scale-105'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <span className="truncate max-w-[120px]">{name}</span>
                        {temp !== null && tempDetails && (
                          <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md ${tempDetails.badgeColorClass}`}>
                            {temp.toFixed(1)}°C
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRecentStocks([])
                  localStorage.removeItem('stocktemp_recent_stocks')
                }}
                className="text-[10px] text-slate-500 hover:text-slate-300 ml-3 shrink-0 cursor-pointer underline hover:no-underline whitespace-nowrap"
              >
                {language === 'KO' ? '기록 삭제' : 'Clear'}
              </button>
            </div>
          )}

          {/* Mobile View Mode Switcher (List View vs Tinder-style Swipe Discovery Deck) */}
          <div className="lg:hidden">
            <div className="p-[1px] bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 rounded-2xl shadow-lg">
              <div className="grid grid-cols-2 p-1 bg-slate-900/95 backdrop-blur-md rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setMobileViewMode('list')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mobileViewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-blue-300" />
                  <span>{language === 'KO' ? '분석형' : t('analysisView')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileViewMode('deck')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mobileViewMode === 'deck'
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                  <span>{language === 'KO' ? '직관형' : t('intuitiveView')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Tinder-Style Discover Deck View */}
          {mobileViewMode === 'deck' && (
            <div className="lg:hidden">
              <StockDiscoverDeck
                stocks={filteredStocks}
                watchlistIds={watchlistIds}
                onToggleWatchlist={toggleWatchlist}
              />
            </div>
          )}

          {/* Mobile Traditional Category List View */}
          {mobileViewMode === 'list' && (
            <div className="lg:hidden space-y-4">
              {/* Mobile Category Tab Selector (2-Tier 3x2 Grid) */}
              <div className="space-y-2">
                {/* Row 1: Low ~ Fair */}
                <div className="grid grid-cols-3 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-xl gap-1.5">
                  {/* 1. 극저평가 */}
                  <button
                    type="button"
                    onClick={() => setMobileListTab('extreme_cold')}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                      mobileListTab === 'extreme_cold'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                <Snowflake className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">
                  {language === 'KO' ? '극저평가' : language === 'VI' ? 'ĐG rất thấp' : 'Ex.Under V.'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 shrink-0">
                  {extremeColdStocks.length}
                </span>
              </button>

              {/* 2. 저평가 */}
              <button
                type="button"
                onClick={() => setMobileListTab('cold')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                  mobileListTab === 'cold'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wind className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">
                  {language === 'KO' ? '저평가' : language === 'VI' ? 'ĐG thấp' : 'Under V.'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 shrink-0">
                  {normalColdStocks.length}
                </span>
              </button>

              {/* 3. 적정가 */}
              <button
                type="button"
                onClick={() => setMobileListTab('fair')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                  mobileListTab === 'fair'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {language === 'KO' ? '적정가' : language === 'VI' ? 'Giá hợp lý' : 'Fair V.'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 shrink-0">
                  {fairStocks.length}
                </span>
              </button>
            </div>

            {/* Row 2: Hot ~ Recommended */}
            <div className="grid grid-cols-3 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-xl gap-1.5">
              {/* 4. 고평가 */}
              <button
                type="button"
                onClick={() => setMobileListTab('hot')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                  mobileListTab === 'hot'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  {language === 'KO' ? '고평가' : language === 'VI' ? 'ĐG cao' : 'Over V.'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 shrink-0">
                  {normalHotStocks.length}
                </span>
              </button>

              {/* 5. 극고평가 */}
              <button
                type="button"
                onClick={() => setMobileListTab('extreme_hot')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                  mobileListTab === 'extreme_hot'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" />
                <span className="truncate">
                  {language === 'KO' ? '극고평가' : language === 'VI' ? 'ĐG rất cao' : 'Ex.Over V.'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 shrink-0">
                  {extremeHotStocks.length}
                </span>
              </button>

              {/* 6. 추천 */}
              <button
                type="button"
                onClick={() => setMobileListTab('recommended')}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                  mobileListTab === 'recommended'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">
                  {language === 'KO' ? '추천' : language === 'VI' ? 'Đề xuất' : 'Recs'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 shrink-0">
                  {recommendedStocks.length}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Single Category View */}
          <div className="space-y-4">
            {/* 1. 극저평가 리스트 */}
            {mobileListTab === 'extreme_cold' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-b border-slate-850 pb-2.5">
                  <span className="font-bold flex items-center gap-1.5 text-cyan-400">
                    <Snowflake className="w-4 h-4" />
                    {language === 'KO' ? '극저평가 종목' : language === 'VI' ? 'Cổ phiếu cực thấp' : 'Extremely Undervalued'} ({extremeColdStocks.length})
                  </span>
                  <span className="text-slate-500">
                    {language === 'KO' ? '온도 0°C 미만 (혹한기)' : language === 'VI' ? 'Dưới 0°C (Băng giá)' : 'Under 0°C (Freezing)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {extremeColdStocks.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-slate-900 font-semibold select-none">
                      {language === 'KO' ? '해당 조건의 극저평가 종목이 없습니다.' : 'No extremely undervalued stocks.'}
                    </div>
                  ) : (
                    extremeColdStocks.map((stock, index) => (
                      <SwipeableCard
                        key={stock.id}
                        id={stock.id}
                        onDismiss={() => hideStock(stock.id)}
                      >
                        <StockCard stock={stock} rank={isFiltered ? undefined : index + 1} isHighlighted={highlightedStockId === stock.id} />
                      </SwipeableCard>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 2. 저평가 리스트 */}
            {mobileListTab === 'cold' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-b border-slate-850 pb-2.5">
                  <span className="font-bold flex items-center gap-1.5 text-blue-400">
                    <Wind className="w-4 h-4" />
                    {language === 'KO' ? '저평가 종목' : language === 'VI' ? 'Cổ phiếu định giá thấp' : 'Undervalued Stocks'} ({normalColdStocks.length})
                  </span>
                  <span className="text-slate-500">
                    {language === 'KO' ? '온도 0°C ~ 15°C (쌀쌀함)' : language === 'VI' ? '0°C ~ 15°C (Se lạnh)' : '0°C ~ 15°C (Chilly)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {normalColdStocks.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-slate-900 font-semibold select-none">
                      {t('emptyColdList')}
                    </div>
                  ) : (
                    normalColdStocks.map((stock, index) => (
                      <SwipeableCard
                        key={stock.id}
                        id={stock.id}
                        onDismiss={() => hideStock(stock.id)}
                      >
                        <StockCard stock={stock} rank={isFiltered ? undefined : index + 1} isHighlighted={highlightedStockId === stock.id} />
                      </SwipeableCard>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. 적정가 리스트 */}
            {mobileListTab === 'fair' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-b border-slate-850 pb-2.5">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <Sun className="w-4 h-4" />
                    {language === 'KO' ? '적정가 종목' : language === 'VI' ? 'Cổ phiếu giá hợp lý' : 'Fair Valued Stocks'} ({fairStocks.length})
                  </span>
                  <span className="text-slate-500">
                    {language === 'KO' ? '온도 15°C ~ 25°C (적정온도)' : language === 'VI' ? '15°C ~ 25°C (Dễ chịu)' : '15°C ~ 25°C (Moderate)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fairStocks.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-slate-900 font-semibold select-none">
                      {language === 'KO' ? '적정가 범위의 종목이 없습니다.' : 'No fair valued stocks.'}
                    </div>
                  ) : (
                    fairStocks.map((stock, index) => (
                      <SwipeableCard
                        key={stock.id}
                        id={stock.id}
                        onDismiss={() => hideStock(stock.id)}
                      >
                        <StockCard stock={stock} rank={isFiltered ? undefined : index + 1} isHighlighted={highlightedStockId === stock.id} />
                      </SwipeableCard>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. 고평가 리스트 */}
            {mobileListTab === 'hot' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-b border-slate-850 pb-2.5">
                  <span className="font-bold flex items-center gap-1.5 text-amber-400">
                    <Flame className="w-4 h-4" />
                    {language === 'KO' ? '고평가 종목' : language === 'VI' ? 'Cổ phiếu định giá cao' : 'Overvalued Stocks'} ({normalHotStocks.length})
                  </span>
                  <span className="text-slate-500">
                    {language === 'KO' ? '온도 25°C ~ 40°C (과열 구간)' : language === 'VI' ? '25°C ~ 40°C (Nóng ấm)' : '25°C ~ 40°C (Warm)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {normalHotStocks.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-slate-900 font-semibold select-none">
                      {t('emptyHotList')}
                    </div>
                  ) : (
                    normalHotStocks.map((stock, index) => (
                      <SwipeableCard
                        key={stock.id}
                        id={stock.id}
                        onDismiss={() => hideStock(stock.id)}
                      >
                        <StockCard stock={stock} rank={isFiltered ? undefined : index + 1} isHighlighted={highlightedStockId === stock.id} />
                      </SwipeableCard>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 5. 극고평가 리스트 */}
            {mobileListTab === 'extreme_hot' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-b border-slate-850 pb-2.5">
                  <span className="font-bold flex items-center gap-1.5 text-rose-400">
                    <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                    {language === 'KO' ? '극고평가 종목' : language === 'VI' ? 'Cổ phiếu cực cao' : 'Extremely Overvalued'} ({extremeHotStocks.length})
                  </span>
                  <span className="text-slate-500">
                    {language === 'KO' ? '온도 40°C 초과 (극단과열)' : language === 'VI' ? 'Trên 40°C (Rất nóng)' : 'Over 40°C (Furnace)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {extremeHotStocks.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-slate-900 font-semibold select-none">
                      {language === 'KO' ? '극고평가 상태인 종목이 없습니다.' : 'No extremely overvalued stocks.'}
                    </div>
                  ) : (
                    extremeHotStocks.map((stock, index) => (
                      <SwipeableCard
                        key={stock.id}
                        id={stock.id}
                        onDismiss={() => hideStock(stock.id)}
                      >
                        <StockCard stock={stock} rank={isFiltered ? undefined : index + 1} isHighlighted={highlightedStockId === stock.id} />
                      </SwipeableCard>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 6. 추천 리스트 */}
            {mobileListTab === 'recommended' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-b border-slate-850 pb-2.5">
                  <span className="font-bold flex items-center gap-1.5 text-indigo-400">
                    <ThumbsUp className="w-4 h-4" />
                    {language === 'KO' ? '투자자 추천 종목' : language === 'VI' ? 'Cổ phiếu khuyến nghị' : 'Most Recommended'} ({recommendedStocks.length})
                  </span>
                  <span className="text-slate-500">
                    {language === 'KO' ? '추천 1회 이상' : language === 'VI' ? 'Min 1 lượt chọn' : 'Min 1 Upvote'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendedStocks.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-slate-900 font-semibold select-none">
                      {language === 'KO' ? '아직 추천된 종목이 없습니다.' : language === 'VI' ? 'Chưa có khuyến nghị.' : 'No recommended stocks.'}
                    </div>
                  ) : (
                    recommendedStocks.map((stock, index) => (
                      <SwipeableCard
                        key={stock.id}
                        id={stock.id}
                        onDismiss={() => hideStock(stock.id)}
                      >
                        <StockCard stock={stock} rank={isFiltered ? undefined : index + 1} isHighlighted={highlightedStockId === stock.id} />
                      </SwipeableCard>
                    ))
                  )}
                </div>
              </div>
            )}
              </div>
            </div>
          )}

          {/* Desktop 3-Column Horizontal Slim Segmented Glass Tabs View (Option 1) */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-8 items-start">
            {/* Column 1: Undervalued Zone (Extreme Cold & Cold) */}
            <div className="space-y-4">
              {/* Horizontal 2-Way Slim Glass Segmented Tab (Plan A: Large Icons & Bold Typography) */}
              <div className="p-[1px] bg-gradient-to-r from-cyan-500/40 via-slate-800 to-blue-500/40 rounded-2xl shadow-xl shadow-black/30">
                <div className="grid grid-cols-2 p-1.5 bg-slate-900/95 backdrop-blur-md rounded-2xl gap-1.5">
                  {/* Left: Extreme Cold */}
                  <button
                    type="button"
                    onClick={() => setCol1Tab('extreme_cold')}
                    className={`py-2.5 px-2.5 rounded-xl text-[14px] font-black tracking-tight transition-all flex items-center justify-between cursor-pointer min-w-0 ${
                      col1Tab === 'extreme_cold'
                        ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/25 text-cyan-200 border border-cyan-400/50 shadow-md shadow-cyan-500/15'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Snowflake className="w-5 h-5 text-cyan-400 shrink-0" />
                      <span className="truncate">{language === 'KO' ? '극저평가' : language === 'VI' ? 'ĐG rất thấp' : 'Ex.Under V.'}</span>
                    </div>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 font-black ${
                      col1Tab === 'extreme_cold' ? 'bg-cyan-400 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {extremeColdStocks.length}
                    </span>
                  </button>

                  {/* Right: Cold */}
                  <button
                    type="button"
                    onClick={() => setCol1Tab('cold')}
                    className={`py-2.5 px-2.5 rounded-xl text-[14px] font-black tracking-tight transition-all flex items-center justify-between cursor-pointer min-w-0 ${
                      col1Tab === 'cold'
                        ? 'bg-gradient-to-r from-blue-500/30 to-indigo-500/25 text-blue-200 border border-blue-400/50 shadow-md shadow-blue-500/15'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Wind className="w-5 h-5 text-blue-400 shrink-0" />
                      <span className="truncate">{language === 'KO' ? '저평가' : language === 'VI' ? 'ĐG thấp' : 'Under V.'}</span>
                    </div>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 font-black ${
                      col1Tab === 'cold' ? 'bg-blue-400 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {normalColdStocks.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Subtitle Indicator */}
              <div className="flex items-center justify-between px-1 text-xs text-slate-500 border-b border-slate-850 pb-2">
                <span className="font-medium text-slate-400">
                  {col1Tab === 'extreme_cold'
                    ? (language === 'KO' ? '온도 0°C 미만 (혹한기)' : language === 'VI' ? 'Dưới 0°C (Băng giá)' : 'Under 0°C (Freezing)')
                    : (language === 'KO' ? '온도 0°C ~ 15°C (쌀쌀함)' : language === 'VI' ? '0°C ~ 15°C (Se lạnh)' : '0°C ~ 15°C (Chilly)')}
                </span>
                <span className="font-mono text-[11px] text-slate-400 font-bold">
                  {col1Tab === 'extreme_cold' ? extremeColdStocks.length : normalColdStocks.length}개
                </span>
              </div>

              {/* Stock Cards List */}
              {(() => {
                const targetList = col1Tab === 'extreme_cold' ? extremeColdStocks : normalColdStocks
                return (
                  <div className="grid grid-cols-1 gap-4">
                    {targetList.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-slate-900 font-semibold select-none">
                        {col1Tab === 'extreme_cold'
                          ? (language === 'KO' ? '해당 조건의 극저평가 종목이 없습니다.' : 'No extremely undervalued stocks.')
                          : t('emptyColdList')}
                      </div>
                    ) : (
                      targetList.map((stock, index) => (
                        <SwipeableCard
                          key={stock.id}
                          id={stock.id}
                          onDismiss={() => hideStock(stock.id)}
                        >
                          <StockCard 
                            stock={stock} 
                            rank={isFiltered ? undefined : index + 1} 
                            isHighlighted={highlightedStockId === stock.id}
                          />
                        </SwipeableCard>
                      ))
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Column 2: Overvalued Zone (Extreme Hot & Hot) */}
            <div className="space-y-4">
              {/* Horizontal 2-Way Slim Glass Segmented Tab (Plan A: Large Icons & Bold Typography) */}
              <div className="p-[1px] bg-gradient-to-r from-rose-500/40 via-slate-800 to-amber-500/40 rounded-2xl shadow-xl shadow-black/30">
                <div className="grid grid-cols-2 p-1.5 bg-slate-900/95 backdrop-blur-md rounded-2xl gap-1.5">
                  {/* Left: Extreme Hot */}
                  <button
                    type="button"
                    onClick={() => setCol2Tab('extreme_hot')}
                    className={`py-2.5 px-2.5 rounded-xl text-[14px] font-black tracking-tight transition-all flex items-center justify-between cursor-pointer min-w-0 ${
                      col2Tab === 'extreme_hot'
                        ? 'bg-gradient-to-r from-rose-500/30 to-red-500/25 text-rose-200 border border-rose-400/50 shadow-md shadow-rose-500/15'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Flame className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
                      <span className="truncate">{language === 'KO' ? '극고평가' : language === 'VI' ? 'ĐG rất cao' : 'Ex.Over V.'}</span>
                    </div>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 font-black ${
                      col2Tab === 'extreme_hot' ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {extremeHotStocks.length}
                    </span>
                  </button>

                  {/* Right: Hot */}
                  <button
                    type="button"
                    onClick={() => setCol2Tab('hot')}
                    className={`py-2.5 px-2.5 rounded-xl text-[14px] font-black tracking-tight transition-all flex items-center justify-between cursor-pointer min-w-0 ${
                      col2Tab === 'hot'
                        ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/25 text-amber-200 border border-amber-400/50 shadow-md shadow-amber-500/15'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Flame className="w-5 h-5 text-amber-400 shrink-0" />
                      <span className="truncate">{language === 'KO' ? '고평가' : language === 'VI' ? 'ĐG cao' : 'Over V.'}</span>
                    </div>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 font-black ${
                      col2Tab === 'hot' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {normalHotStocks.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Subtitle Indicator */}
              <div className="flex items-center justify-between px-1 text-xs text-slate-500 border-b border-slate-850 pb-2">
                <span className="font-medium text-slate-400">
                  {col2Tab === 'extreme_hot'
                    ? (language === 'KO' ? '온도 40°C 초과 (극단과열)' : language === 'VI' ? 'Trên 40°C (Rất nóng)' : 'Over 40°C (Furnace)')
                    : (language === 'KO' ? '온도 25°C ~ 40°C (과열 구간)' : language === 'VI' ? '25°C ~ 40°C (Nóng ấm)' : '25°C ~ 40°C (Warm)')}
                </span>
                <span className="font-mono text-[11px] text-slate-400 font-bold">
                  {col2Tab === 'extreme_hot' ? extremeHotStocks.length : normalHotStocks.length}개
                </span>
              </div>

              {/* Stock Cards List */}
              {(() => {
                const targetList = col2Tab === 'extreme_hot' ? extremeHotStocks : normalHotStocks
                return (
                  <div className="grid grid-cols-1 gap-4">
                    {targetList.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-slate-900 font-semibold select-none">
                        {col2Tab === 'extreme_hot'
                          ? (language === 'KO' ? '극고평가 상태인 종목이 없습니다.' : 'No extremely overvalued stocks.')
                          : t('emptyHotList')}
                      </div>
                    ) : (
                      targetList.map((stock, index) => (
                        <SwipeableCard
                          key={stock.id}
                          id={stock.id}
                          onDismiss={() => hideStock(stock.id)}
                        >
                          <StockCard 
                            stock={stock} 
                            rank={isFiltered ? undefined : index + 1} 
                            isHighlighted={highlightedStockId === stock.id}
                          />
                        </SwipeableCard>
                      ))
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Column 3: Stable & Recommendations Zone (Fair Valued & Recommended) */}
            <div className="space-y-4">
              {/* Horizontal 2-Way Slim Glass Segmented Tab (Plan A: Large Icons & Bold Typography) */}
              <div className="p-[1px] bg-gradient-to-r from-emerald-500/40 via-slate-800 to-indigo-500/40 rounded-2xl shadow-xl shadow-black/30">
                <div className="grid grid-cols-2 p-1.5 bg-slate-900/95 backdrop-blur-md rounded-2xl gap-1.5">
                  {/* Left: Fair Valued */}
                  <button
                    type="button"
                    onClick={() => setCol3Tab('fair')}
                    className={`py-2.5 px-2.5 rounded-xl text-[14px] font-black tracking-tight transition-all flex items-center justify-between cursor-pointer min-w-0 ${
                      col3Tab === 'fair'
                        ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/25 text-emerald-200 border border-emerald-400/50 shadow-md shadow-emerald-500/15'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Sun className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="truncate">{language === 'KO' ? '적정가' : language === 'VI' ? 'Giá hợp lý' : 'Fair V.'}</span>
                    </div>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 font-black ${
                      col3Tab === 'fair' ? 'bg-emerald-400 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {fairStocks.length}
                    </span>
                  </button>

                  {/* Right: Recommended */}
                  <button
                    type="button"
                    onClick={() => setCol3Tab('recommended')}
                    className={`py-2.5 px-2.5 rounded-xl text-[14px] font-black tracking-tight transition-all flex items-center justify-between cursor-pointer min-w-0 ${
                      col3Tab === 'recommended'
                        ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/25 text-indigo-200 border border-indigo-400/50 shadow-md shadow-indigo-500/15'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <ThumbsUp className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span className="truncate">{language === 'KO' ? '추천' : language === 'VI' ? 'Đề xuất' : 'Recs'}</span>
                    </div>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 font-black ${
                      col3Tab === 'recommended' ? 'bg-indigo-400 text-white shadow-sm' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {recommendedStocks.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Subtitle Indicator */}
              <div className="flex items-center justify-between px-1 text-xs text-slate-500 border-b border-slate-850 pb-2">
                <span className="font-medium text-slate-400">
                  {col3Tab === 'fair'
                    ? (language === 'KO' ? '온도 15°C ~ 25°C (쾌적 - 안정)' : '15°C ~ 25°C (Fair Valued)')
                    : (language === 'KO' ? '추천 1회 이상 (투자자 추천)' : 'Min 1 Upvote')}
                </span>
                <span className="font-mono text-[11px] text-slate-400 font-bold">
                  {col3Tab === 'fair' ? fairStocks.length : recommendedStocks.length}개
                </span>
              </div>

              {/* Desktop Only: Login / Profile / MyPage Widget */}
              <div className="hidden lg:block">
                {renderAuthWidget(false)}
              </div>

              {/* Stock Cards List */}
              {(() => {
                const targetList = col3Tab === 'fair' ? fairStocks : recommendedStocks
                return (
                  <div className="grid grid-cols-1 gap-4">
                    {targetList.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-slate-900 font-semibold select-none">
                        {col3Tab === 'fair'
                          ? (language === 'KO' ? '적정가 범위의 종목이 없습니다.' : 'No fair valued stocks.')
                          : (language === 'KO' ? '아직 추천된 종목이 없습니다.' : 'No recommended stocks.')}
                      </div>
                    ) : (
                      targetList.map((stock, index) => (
                        <SwipeableCard
                          key={stock.id}
                          id={stock.id}
                          onDismiss={() => hideStock(stock.id)}
                        >
                          <StockCard 
                            stock={stock} 
                            rank={isFiltered ? undefined : index + 1} 
                            isHighlighted={highlightedStockId === stock.id}
                          />
                        </SwipeableCard>
                      ))
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-4 text-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsAddModalOpen(false)
                setAutoFilledNotice('')
                setCatalogSearchQuery('')
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span>{language === 'KO' ? '신규 종목 등록' : language === 'VI' ? 'Đăng ký cổ phiếu mới' : 'Register New Stock'}</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium text-left">
                {language === 'KO' 
                  ? '💡 종목명을 검색하여 클릭하시면 국가, 티커, 업종 정보가 자동으로 입력됩니다.' 
                  : language === 'VI'
                  ? '💡 Tìm kiếm và nhấp vào cổ phiếu để tự động điền quốc gia, mã và ngành nghề.'
                  : '💡 Search and select a stock to auto-fill country, ticker, and industry.'}
              </p>
            </div>

            {/* 1. Quick Search & Auto-fill Box */}
            <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-3 space-y-2 text-left">
              <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>{language === 'KO' ? '빠른 종목 검색 (선택 시 자동 입력)' : language === 'VI' ? 'Tìm kiếm nhanh (Tự động điền)' : 'Quick Search (Auto-fill)'}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'KO' ? '예: 코나아이, 카카오, 애플, NVDA, FPT...' : 'e.g. Apple, NVDA, Samsung, FPT...'}
                  value={catalogSearchQuery}
                  onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-400 shadow-inner"
                />
                
                {/* Suggestions Dropdown */}
                {catalogSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950 border border-blue-500/40 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-800/80 max-h-56 overflow-y-auto">
                    {catalogSuggestions.map((item) => (
                      <button
                        key={`${item.country}_${item.ticker}`}
                        type="button"
                        onClick={() => selectCatalogStock(item)}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-blue-600/25 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {item.country === 'KR' ? '🇰🇷' : item.country === 'US' ? '🇺🇸' : item.country === 'VN' ? '🇻🇳' : '🇨🇳'}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-100 group-hover:text-blue-300">
                              {language === 'KO' ? (item.koreanName || item.name) : item.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.ticker} · {translateIndustry(item.industry, language)}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full shrink-0">
                          {language === 'KO' ? '자동 입력' : 'Auto Fill'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Auto-filled Notice Banner */}
            {autoFilledNotice && (
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl font-bold flex items-center justify-between animate-in fade-in">
                <span>{autoFilledNotice}</span>
                <button type="button" onClick={() => setAutoFilledNotice('')} className="text-emerald-400 hover:text-emerald-200">✕</button>
              </div>
            )}

            <form onSubmit={handleAddStock} className="space-y-3.5">
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium text-left">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    {language === 'KO' ? '국가 *' : language === 'VI' ? 'Quốc gia *' : 'Country *'}
                  </label>
                  <select
                    value={addCountry}
                    onChange={(e) => setAddCountry(e.target.value as any)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-355 focus:outline-none focus:border-blue-500"
                  >
                    <option value="KR">South Korea 🇰🇷</option>
                    <option value="US">United States 🇺🇸</option>
                    <option value="VN">Vietnam 🇻🇳</option>
                    <option value="CN">China 🇨🇳</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    {language === 'KO' ? '티커/코드 *' : language === 'VI' ? 'Mã cổ phiếu *' : 'Ticker *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 052400, AAPL"
                    value={addTicker}
                    onChange={(e) => setAddTicker(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {language === 'KO' ? '한글 종목명 *' : language === 'VI' ? 'Tên tiếng Hàn (Tùy chọn)' : 'Korean Name (Optional)'}
                </label>
                <input
                  type="text"
                  required={language === 'KO'}
                  placeholder="e.g. 코나아이, 삼성전자"
                  value={addKoreanName}
                  onChange={(e) => setAddKoreanName(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {language === 'KO' ? '영문 종목명 (선택)' : language === 'VI' ? 'Tên tiếng Anh *' : 'English Name *'}
                </label>
                <input
                  type="text"
                  required={language !== 'KO'}
                  placeholder="e.g. KONA I, Apple Inc."
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    {language === 'KO' ? '업종 *' : language === 'VI' ? 'Lĩnh vực *' : 'Industry *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 소프트웨어, 반도체"
                    value={addIndustry}
                    onChange={(e) => setAddIndustry(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    {language === 'KO' ? '적정 P/E (기본 15배)' : language === 'VI' ? 'P/E Mục tiêu (Mặc định 15)' : 'Target P/E (Default 15)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={addTargetPe}
                    onChange={(e) => setAddPe(parseFloat(e.target.value) || 15)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 tracking-tighter"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setAutoFilledNotice('')
                    setCatalogSearchQuery('')
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-955 border border-slate-855 hover:bg-slate-850 text-slate-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {language === 'KO' ? '취소' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  {submitting 
                    ? (language === 'KO' ? '등록 중...' : 'Submitting...') 
                    : (language === 'KO' ? '등록 완료' : 'Register')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StockCard({ stock, rank, isHighlighted }: { stock: any; rank?: number; isHighlighted?: boolean }) {
  const { t, language } = useLanguage()

  // Translate temperature label
  let tempLabel = stock.tempDetails.label
  if (language === 'EN') {
    if (stock.temperature < 0) tempLabel = t('tempFreezingLabel')
    else if (stock.temperature < 15) tempLabel = t('tempCoolLabel')
    else if (stock.temperature < 35) tempLabel = t('tempNormalLabel')
    else if (stock.temperature < 50) tempLabel = t('tempWarmLabel')
    else tempLabel = t('tempHotLabel')
  } else if (language === 'VI') {
    if (stock.temperature < 0) tempLabel = t('tempFreezingLabel')
    else if (stock.temperature < 15) tempLabel = t('tempCoolLabel')
    else if (stock.temperature < 35) tempLabel = t('tempNormalLabel')
    else if (stock.temperature < 50) tempLabel = t('tempWarmLabel')
    else tempLabel = t('tempHotLabel')
  }

  const displayName = language === 'KO' ? (stock.koreanName || stock.name) : stock.name

  return (
    <Link
      id={`stock-card-${stock.id}`}
      to={`/stock/${stock.id}`}
      onClick={() => {
        try {
          sessionStorage.setItem('stocktemp_last_view_mode', 'list')
        } catch (e) {}
      }}
      className={`group block rounded-2xl p-5 transition-all relative overflow-hidden ${
        isHighlighted
          ? 'bg-slate-850 border-2 border-blue-400 shadow-2xl shadow-blue-500/30 scale-[1.01] ring-4 ring-blue-500/20'
          : 'bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/[0.02]'
      }`}
    >
      {isHighlighted && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-bl-xl shadow-md flex items-center gap-1 animate-pulse">
          <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
          <span>{language === 'KO' ? '방금 본 종목' : 'Last Viewed'}</span>
        </div>
      )}
      {rank !== undefined && (
        <div className="absolute top-0 left-0 w-6 h-6 rounded-br-xl flex items-center justify-center text-[10px] font-black shadow-md border-r border-b bg-gradient-to-br from-amber-300 to-yellow-500 text-slate-950 border-yellow-600/30">
          {rank}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            {getCountryName(stock.country, language)} | {translateIndustry(stock.industry, language)}
          </span>
          <h4 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors mt-0.5">
            {displayName}
          </h4>
          <span className="text-xs font-mono text-slate-500 block mt-0.5">{stock.ticker}</span>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className={`text-xl font-black flex items-center justify-end gap-1.5 ${stock.tempDetails.colorClass}`}>
            <WeatherIcon name={stock.tempDetails.iconName} className="w-5 h-5" />
            <span>{stock.temperature}°C</span>
          </span>
          <span className={`block text-[10px] px-2 py-0.5 border rounded-full mt-1.5 font-bold ${stock.tempDetails.badgeColorClass}`}>
            {tempLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-slate-800/50 mt-4 pt-4 text-xs">
        <div className="text-left">
          <span className="block text-slate-500">{t('currentPrice')}</span>
          <span className="font-semibold text-slate-200 mt-0.5 block font-mono">
            {stock.currency} {stock.currentPrice.toLocaleString()}
          </span>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            <span className="block text-slate-500">{t('fairPrice')}</span>
            {stock.isDeficit && (
              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                {language === 'KO' ? 'BPS기준' : 'BPS Basis'}
              </span>
            )}
          </div>
          <span className="font-black text-sm md:text-base text-blue-400 mt-0.5 block font-mono">
            {stock.fairPrice > 0
              ? `${stock.currency} ${Math.round(stock.fairPrice).toLocaleString()}`
              : 'N/A'}
          </span>
        </div>
      </div>
    </Link>
  )
}
