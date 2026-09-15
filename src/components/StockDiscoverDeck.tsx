import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  RotateCcw, Sparkles, Zap, TrendingUp, TrendingDown,
  Award, Gem, Bot, BatteryCharging, Flame, Shuffle
} from 'lucide-react'
import type { Stock } from '../data/mockStocks'
import { WeatherIcon } from './WeatherIcon'
import WeatherCardAnimation from './WeatherCardAnimation'
import { 
  calculateFairPrice, 
  calculateStockTemperature, 
  getTemperatureDetails
} from '../utils/valuation'
import { translateIndustry, getCountryName } from '../data/translations'
import { useLanguage } from '../context/LanguageContext'
import { useLivePrices } from '../context/LivePriceContext'

export type DeckTheme = 'leaders' | 'gem_value' | 'ai_semi' | 'battery' | 'overheated' | 'random'

interface ThemeOption {
  id: DeckTheme
  icon: any
  labelKO: string
  labelEN: string
  labelVI: string
  activeBg: string
  activeBorder: string
  iconColor: string
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'leaders',
    icon: Award,
    labelKO: '대장주',
    labelEN: 'Leaders',
    labelVI: 'Dẫn dắt',
    activeBg: 'bg-amber-500/20 text-amber-300',
    activeBorder: 'border-amber-500/50',
    iconColor: 'text-amber-400'
  },
  {
    id: 'gem_value',
    icon: Gem,
    labelKO: '숨은보석',
    labelEN: 'Hidden Gems',
    labelVI: 'Ngọc ẩn',
    activeBg: 'bg-cyan-500/20 text-cyan-300',
    activeBorder: 'border-cyan-500/50',
    iconColor: 'text-cyan-400'
  },
  {
    id: 'ai_semi',
    icon: Bot,
    labelKO: 'AI·반도체',
    labelEN: 'AI & Chips',
    labelVI: 'AI·Bán dẫn',
    activeBg: 'bg-blue-500/20 text-blue-300',
    activeBorder: 'border-blue-500/50',
    iconColor: 'text-blue-400'
  },
  {
    id: 'battery',
    icon: BatteryCharging,
    labelKO: '2차전지',
    labelEN: 'EV Battery',
    labelVI: 'Pin & EV',
    activeBg: 'bg-emerald-500/20 text-emerald-300',
    activeBorder: 'border-emerald-500/50',
    iconColor: 'text-emerald-400'
  },
  {
    id: 'overheated',
    icon: Flame,
    labelKO: '과열주의',
    labelEN: 'Overheated',
    labelVI: 'Quá nhiệt',
    activeBg: 'bg-rose-500/20 text-rose-300',
    activeBorder: 'border-rose-500/50',
    iconColor: 'text-rose-400'
  },
  {
    id: 'random',
    icon: Shuffle,
    labelKO: '랜덤발견',
    labelEN: 'Shuffle',
    labelVI: 'Ngẫu nhiên',
    activeBg: 'bg-purple-500/20 text-purple-300',
    activeBorder: 'border-purple-500/50',
    iconColor: 'text-purple-400'
  }
]

const LEADER_TICKERS = new Set([
  // KR Leaders
  '005930', '000660', '005380', '035420', '035720', '373220', '207940', '068270', '000270', '051910', 
  '005490', '012330', '105560', '055550', '028260', '032830', '015760', '003550', '018260', '034730', 
  '086520', '247540', '066570', '010130', '009150', '030200', '017670', '033780', '011200', '009540',
  // US Leaders
  'NVDA', 'AAPL', 'MSFT', 'TSLA', 'GOOGL', 'GOOG', 'AMZN', 'META', 'AMD', 'AVGO', 'NFLX', 'PLTR', 
  'TSM', 'BRK.B', 'LLY', 'JNJ', 'JPM', 'V', 'WMT', 'ORCL', 'QCOM', 'CRM', 'INTC', 'COST', 'IBM', 'DIS', 'ADBE',
  // VN Leaders
  'VNM', 'VIC', 'VHM', 'FPT', 'HPG', 'VCB', 'TCB', 'MBB', 'MSN', 'MWG', 'GAS', 'VRE', 'SSI', 'VJC', 'STB', 'BID', 'CTG',
  // CN Leaders
  '9988', '0700', '3690', '9618', '9888', '2318', '0939', '1398', '1211', '1810', '9999', '2015', '9866'
])

const AI_SEMI_TICKERS = new Set([
  '005930', '000660', '042700', '353200', '039030', '058470', '035420', '035720', '067160', '376300', 
  '272210', '000990', '036570', '036540', '053800', '084370', '108320', '240810', '138490', '078600',
  'NVDA', 'AMD', 'TSM', 'ASML', 'AVGO', 'QCOM', 'MSFT', 'GOOGL', 'META', 'PLTR', 'ARM', 'SMCI', 
  'AMAT', 'LRCX', 'KLAC', 'MRVL', 'MU', 'INTC', 'ORCL', 'IBM', 'FPT'
])

const BATTERY_TICKERS = new Set([
  '373220', '051910', '006400', '096770', '247540', '086520', '003670', '005490', '005380', '000270', 
  '012330', '137400', '278280', '393890', '066970', '112610', '365340', '307950', '222800', '361390',
  'TSLA', 'RIVN', 'LCID', 'QS', 'ALB', 'SQM', 'ENPH', 'F', 'GM', '1211', '300750', '2015', '9866', '9868'
])

interface StockDiscoverDeckProps {
  stocks: Stock[]
  watchlistIds?: string[]
  onToggleWatchlist?: (stockId: string) => void
  onVoteUp?: (stockId: string) => void
  onClose?: () => void
}

export default function StockDiscoverDeck({
  stocks,
}: StockDiscoverDeckProps) {
  const { language, t } = useLanguage()
  const { prices, eps } = useLivePrices()
  const navigate = useNavigate()

  const [selectedTheme, setSelectedTheme] = useState<DeckTheme>('leaders')
  const [randomSeed, setRandomSeed] = useState(0)

  // Filter and sort stocks according to selected theme
  const deckStocks = useMemo(() => {
    if (!stocks || stocks.length === 0) return []

    switch (selectedTheme) {
      case 'leaders': {
        const leaders = stocks.filter(s => LEADER_TICKERS.has(s.ticker))
        return leaders.length > 0 ? leaders : stocks.slice(0, 30)
      }
      case 'gem_value': {
        // Sort by priceGapPct descending (most undervalued / highest upside first)
        const evaluated = stocks.map(s => {
          const livePrice = prices[s.ticker] ?? s.currentPrice
          const liveEps = eps[s.ticker] ?? s.eps
          const fairPrice = calculateFairPrice(liveEps, s.defaultTargetPe || 15, s.bps, s.pbr, livePrice)
          const priceGapPct = fairPrice > 0 ? ((fairPrice - livePrice) / livePrice) * 100 : -999
          return { stock: s, priceGapPct }
        })
        return evaluated
          .filter(item => item.priceGapPct > 0)
          .sort((a, b) => b.priceGapPct - a.priceGapPct)
          .map(item => item.stock)
      }
      case 'ai_semi': {
        return stocks.filter(s => {
          if (AI_SEMI_TICKERS.has(s.ticker)) return true
          const ind = (s.industry || '').toLowerCase()
          return ind.includes('반도체') || ind.includes('semiconductor') || ind.includes('소프트웨어') || ind.includes('software') || ind.includes('it') || ind.includes('미디어') || ind.includes('정보기술')
        })
      }
      case 'battery': {
        return stocks.filter(s => {
          if (BATTERY_TICKERS.has(s.ticker)) return true
          const ind = (s.industry || '').toLowerCase()
          return ind.includes('2차전지') || ind.includes('배터리') || ind.includes('전기차') || ind.includes('자동차') || ind.includes('battery') || ind.includes('chemical') || ind.includes('화학') || ind.includes('auto')
        })
      }
      case 'overheated': {
        // Sort by temperature descending (highest temp first)
        const evaluated = stocks.map(s => {
          const livePrice = prices[s.ticker] ?? s.currentPrice
          const liveEps = eps[s.ticker] ?? s.eps
          const fairPrice = calculateFairPrice(liveEps, s.defaultTargetPe || 15, s.bps, s.pbr, livePrice)
          const temp = calculateStockTemperature(livePrice, fairPrice)
          return { stock: s, temp }
        })
        return evaluated
          .filter(item => item.temp >= 30)
          .sort((a, b) => b.temp - a.temp)
          .map(item => item.stock)
      }
      case 'random': {
        const copy = [...stocks]
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy
      }
      default:
        return stocks
    }
  }, [stocks, selectedTheme, prices, eps, randomSeed])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [history, setHistory] = useState<number[]>([])

  // Touch / Drag interaction states
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [flyOutDirection, setFlyOutDirection] = useState<'left' | 'right' | null>(null)
  
  const cardRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragStartTimeRef = useRef<number>(0)

  // Handle Theme Switching
  const handleSelectTheme = (theme: DeckTheme) => {
    if (theme === 'random' && selectedTheme === 'random') {
      setRandomSeed(prev => prev + 1)
    }
    setSelectedTheme(theme)
    setCurrentIndex(0)
    setHistory([])
    setDragOffset({ x: 0, y: 0 })
    setFlyOutDirection(null)
  }

  // Count helper for theme chips
  const getThemeCount = useCallback((themeId: DeckTheme) => {
    if (!stocks) return 0
    switch (themeId) {
      case 'leaders':
        return stocks.filter(s => LEADER_TICKERS.has(s.ticker)).length
      case 'gem_value':
        return stocks.filter(s => {
          const livePrice = prices[s.ticker] ?? s.currentPrice
          const liveEps = eps[s.ticker] ?? s.eps
          const fairPrice = calculateFairPrice(liveEps, s.defaultTargetPe || 15, s.bps, s.pbr, livePrice)
          return fairPrice > livePrice
        }).length
      case 'ai_semi':
        return stocks.filter(s => {
          if (AI_SEMI_TICKERS.has(s.ticker)) return true
          const ind = (s.industry || '').toLowerCase()
          return ind.includes('반도체') || ind.includes('semiconductor') || ind.includes('소프트웨어') || ind.includes('software') || ind.includes('it') || ind.includes('미디어') || ind.includes('정보기술')
        }).length
      case 'battery':
        return stocks.filter(s => {
          if (BATTERY_TICKERS.has(s.ticker)) return true
          const ind = (s.industry || '').toLowerCase()
          return ind.includes('2차전지') || ind.includes('배터리') || ind.includes('전기차') || ind.includes('자동차') || ind.includes('battery') || ind.includes('chemical') || ind.includes('화학') || ind.includes('auto')
        }).length
      case 'overheated':
        return stocks.filter(s => {
          const livePrice = prices[s.ticker] ?? s.currentPrice
          const liveEps = eps[s.ticker] ?? s.eps
          const fairPrice = calculateFairPrice(liveEps, s.defaultTargetPe || 15, s.bps, s.pbr, livePrice)
          const temp = calculateStockTemperature(livePrice, fairPrice)
          return temp >= 30
        }).length
      case 'random':
      default:
        return stocks.length
    }
  }, [stocks, prices, eps])

  // Handle Card Dismiss (Swipe Left or Right)
  const triggerSwipe = useCallback((direction: 'left' | 'right') => {
    if (currentIndex >= deckStocks.length || flyOutDirection) return
    
    setFlyOutDirection(direction)

    setTimeout(() => {
      setHistory(prev => [...prev, currentIndex])
      setCurrentIndex(prev => prev + 1)
      setFlyOutDirection(null)
      setDragOffset({ x: 0, y: 0 })
      setIsDragging(false)
    }, 240)
  }, [currentIndex, deckStocks, flyOutDirection])

  // Undo previous swipe
  const handleUndo = () => {
    if (history.length === 0 || flyOutDirection) return
    const prevIndex = history[history.length - 1]
    setHistory(prev => prev.slice(0, -1))
    setCurrentIndex(prevIndex)
    setDragOffset({ x: 0, y: 0 })
    setFlyOutDirection(null)
  }

  // Keyboard navigation for testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') triggerSwipe('left')
      if (e.key === 'ArrowRight') triggerSwipe('right')
      if (e.key === 'Backspace' || e.key === 'z') handleUndo()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerSwipe])

  // Touch / Mouse Handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (flyOutDirection) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    startPosRef.current = { x: clientX, y: clientY }
    dragStartTimeRef.current = Date.now()
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || flyOutDirection) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const deltaX = clientX - startPosRef.current.x
    const deltaY = clientY - startPosRef.current.y
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleTouchEnd = () => {
    if (!isDragging || flyOutDirection) return
    setIsDragging(false)
    const horizontalThreshold = 75
    const dragDistance = Math.hypot(dragOffset.x, dragOffset.y)
    const dragDuration = Date.now() - dragStartTimeRef.current

    // Tap/Click Detection -> Navigate to Stock Detail Page directly in Intuitive Mode
    if (dragDistance < 8 && dragDuration < 300 && currentStock) {
      try {
        sessionStorage.setItem('stocktemp_scroll_y', String(window.scrollY))
        sessionStorage.setItem('stocktemp_mobile_view_mode', 'deck')
        sessionStorage.setItem('stocktemp_last_view_mode', 'deck')
        sessionStorage.setItem('stocktemp_last_viewed', currentStock.id)
      } catch (e) {}
      navigate(`/stock/${currentStock.id}`)
      return
    }

    if (dragOffset.x > horizontalThreshold) {
      triggerSwipe('right')
    } else if (dragOffset.x < -horizontalThreshold) {
      triggerSwipe('left')
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 })
    }
  }

  // Helper to compute stock metrics
  const getStockCardData = (stock: Stock) => {
    const livePrice = prices[stock.ticker] ?? stock.currentPrice
    const liveEps = eps[stock.ticker] ?? stock.eps
    const isDeficit = liveEps <= 0
    const fairPrice = calculateFairPrice(liveEps, stock.defaultTargetPe || 15, stock.bps, stock.pbr, livePrice)
    const temp = calculateStockTemperature(livePrice, fairPrice)
    const tempDetails = getTemperatureDetails(temp)

    // Price gap percentage identical to StockDetail valuation formula: ((fairPrice - currentPrice) / currentPrice) * 100
    const priceGapPct = fairPrice > 0 ? ((fairPrice - livePrice) / livePrice) * 100 : 0
    const isUndervalued = priceGapPct >= 0
    const absGap = Math.abs(priceGapPct).toFixed(1)

    return {
      livePrice,
      liveEps,
      isDeficit,
      fairPrice,
      temp,
      tempDetails,
      priceGapPct,
      isUndervalued,
      absGap
    }
  }

  // Helper to render Center Valuation Difference Badge (Large 2-Tier Hero Layout)
  const renderValuationDiffBadge = (data: ReturnType<typeof getStockCardData>) => {
    if (data.fairPrice <= 0) {
      return (
        <div className="flex flex-col items-center justify-center py-2 px-4 rounded-2xl bg-slate-950/15 border border-slate-700/35 shadow-lg shadow-black/40 w-full max-w-[250px] text-center">
          {/* Top: Pure text without warning icon */}
          <span className="font-black text-sm sm:text-base text-slate-100 tracking-tight drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
            {language === 'KO' 
              ? '적정가 산정불가' 
              : language === 'VI' 
              ? 'Không thể tính giá' 
              : 'Fair Price Not Applicable'}
          </span>

          {/* Bottom: Caption Subtext */}
          <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            {language === 'KO'
              ? (data.isDeficit ? '당기순손실 (적자기업)' : '재무 데이터 분석 중')
              : language === 'VI'
              ? (data.isDeficit ? 'Doanh nghiệp thua lỗ' : 'Đang phân tích')
              : (data.isDeficit ? 'Deficit Company' : 'Data Processing')}
          </span>
        </div>
      )
    }

    if (data.isUndervalued) {
      return (
        <div className="flex flex-col items-center justify-center py-2 px-4 rounded-2xl bg-emerald-950/15 border border-emerald-500/35 shadow-lg shadow-black/40 w-full max-w-[250px]">
          {/* Top: Large Arrow + Percentage */}
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-7 h-7 text-emerald-400 stroke-[2.8] animate-pulse drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] drop-shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
            <span className="font-mono font-black text-2xl sm:text-3xl text-emerald-300 tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]">
              +{data.absGap}%
            </span>
          </div>

          {/* Bottom: Caption Subtext */}
          <span className="text-[10px] font-bold text-emerald-300/90 mt-0.5 tracking-wider uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
            {language === 'KO'
              ? '적정가 대비 차이 (저평가)'
              : language === 'VI'
              ? 'Chênh lệch (Định giá thấp)'
              : 'vs Fair Value (Undervalued)'}
          </span>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-2 px-4 rounded-2xl bg-rose-950/15 border border-rose-500/35 shadow-lg shadow-black/40 w-full max-w-[250px]">
        {/* Top: Large Arrow + Percentage */}
        <div className="flex items-center gap-1.5">
          <TrendingDown className="w-7 h-7 text-rose-400 stroke-[2.8] animate-pulse drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] drop-shadow-[0_0_10px_rgba(244,63,94,0.7)]" />
          <span className="font-mono font-black text-2xl sm:text-3xl text-rose-300 tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]">
            -{data.absGap}%
          </span>
        </div>

        {/* Bottom: Caption Subtext */}
        <span className="text-[10px] font-bold text-rose-300/90 mt-0.5 tracking-wider uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
          {language === 'KO'
            ? '적정가 대비 차이 (고평가)'
            : language === 'VI'
            ? 'Chênh lệch (Định giá cao)'
            : 'vs Fair Value (Overvalued)'}
        </span>
      </div>
    )
  }

  // Helper to render Theme Selector Grid (2-Tier 3x2 Grid matching Analysis View)
  const renderThemePills = () => (
    <div className="grid grid-cols-3 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/80 shadow-xl gap-1 mb-1.5 w-full">
      {THEME_OPTIONS.map(opt => {
        const count = getThemeCount(opt.id)
        const isActive = selectedTheme === opt.id
        const Icon = opt.icon
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleSelectTheme(opt.id)}
            className={`py-1.5 px-1 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
              isActive
                ? `${opt.activeBg} ${opt.activeBorder} border shadow-sm font-black scale-[1.02]`
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? '' : opt.iconColor}`} />
            <span className="truncate">
              {language === 'KO' ? opt.labelKO : language === 'VI' ? opt.labelVI : opt.labelEN}
            </span>
            <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-full shrink-0 font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )

  // End of Deck or Empty State
  if (currentIndex >= deckStocks.length || deckStocks.length === 0) {
    return (
      <div className="relative w-full max-w-sm mx-auto select-none flex flex-col justify-center my-auto">
        {/* Theme Pills at top even at end of deck */}
        {renderThemePills()}

        <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 border border-slate-800 rounded-3xl text-center space-y-4 min-h-[380px] shadow-2xl animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/30 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Sparkles className="w-7 h-7 text-cyan-400 animate-pulse" />
          </div>
          <div className="space-y-1 max-w-xs">
            <h3 className="text-base font-black text-slate-100">
              {language === 'KO' ? '선택한 테마의 카드를 모두 확인했습니다!' : language === 'VI' ? 'Đã khám phá hết các mã trong chủ đề này!' : 'All stocks in this theme explored!'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'KO'
                ? '다른 테마 탭을 선택하거나 처음부터 다시 탐색해 보세요.'
                : 'Select another theme above or restart from the beginning.'}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setCurrentIndex(0)
                setHistory([])
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'KO' ? '처음부터 다시 보기' : language === 'VI' ? 'Xem lại từ đầu' : 'Start Over'}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Helper to get sophisticated subtle gradient border matching temperature with crisp bottom distinction
  const getCardBorderGradient = (temp: number) => {
    if (temp >= 50) return 'from-rose-500/60 via-rose-900/30 to-rose-500/45'
    if (temp >= 35) return 'from-amber-500/55 via-amber-900/30 to-amber-500/40'
    if (temp <= 0) return 'from-cyan-400/60 via-blue-900/30 to-cyan-400/45'
    if (temp < 20) return 'from-teal-400/55 via-emerald-900/30 to-teal-400/40'
    return 'from-slate-500/55 via-slate-750/30 to-slate-600/50'
  }

  const currentStock = deckStocks[currentIndex]
  const nextStock1 = deckStocks[currentIndex + 1]

  const currentData = getStockCardData(currentStock)
  const next1Data = nextStock1 ? getStockCardData(nextStock1) : null

  // Front Card Transform logic
  const rotation = dragOffset.x * 0.08
  const frontTransform = flyOutDirection
    ? flyOutDirection === 'right'
      ? 'translate3d(150%, 15px, 0) rotate(22deg)'
      : 'translate3d(-150%, 15px, 0) rotate(-22deg)'
    : `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`

  return (
    <div className="relative w-full max-w-sm mx-auto select-none flex flex-col justify-center my-auto">
      {/* 1. Theme Pill Selector */}
      {renderThemePills()}

      {/* 2. Top Header: Title, Undo, Progress Counter */}
      <div className="flex items-center justify-between px-2 mb-1.5 text-[10.5px] text-slate-400 font-bold">
        <span className="flex items-center gap-1.5 text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'KO' ? '직관형 탐색 덱' : 'Intuitive Deck'}</span>
        </span>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleUndo()
              }}
              className="flex items-center gap-1 text-[9.5px] text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-750 transition-colors cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-2.5 h-2.5 text-slate-400" />
              <span>{language === 'KO' ? '이전 종목' : 'Undo'}</span>
            </button>
          )}
          <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
            {currentIndex + 1} / {deckStocks.length}
          </span>
        </div>
      </div>

      {/* Card Deck Viewport */}
      <div className="relative h-[415px] w-full flex items-center justify-center">
        {/* Background Card 1 (Fixed & Stable Next Card right behind front card) */}
        {nextStock1 && next1Data && (
          <div 
            key={`rear-${nextStock1.id}`}
            className={`absolute inset-0 p-[1.5px] rounded-3xl bg-gradient-to-b ${getCardBorderGradient(next1Data.temp)} shadow-[0_16px_36px_-6px_rgba(0,0,0,0.9),0_0_20px_rgba(0,0,0,0.5)] pointer-events-none will-change-transform`}
            style={{
              zIndex: 2,
              transform: 'translate3d(0, 0, 0)',
            }}
          >
            <div className="w-full h-full bg-slate-900/95 rounded-[22.5px] p-3.5 flex flex-col justify-between overflow-hidden relative">
              {/* Weather Background Animation for Next Card */}
              <WeatherCardAnimation temperature={next1Data.temp} />

            {/* [1. Next Card Top: Visible when dragging front card DOWN] */}
            <div className="relative z-10 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[9.5px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                    <span>{getCountryName(nextStock1.country, language)}</span>
                    <span className="text-slate-600">•</span>
                    <span className="truncate">{translateIndustry(nextStock1.industry, language)}</span>
                  </span>
                  <h2 className="text-lg font-black text-slate-100 tracking-tight truncate mt-0.5">
                    {language === 'KO' && nextStock1.koreanName ? nextStock1.koreanName : nextStock1.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded-md border border-blue-500/20">
                      {nextStock1.ticker}
                    </span>
                    {next1Data.isDeficit && (
                      <span className="text-[8.5px] font-bold text-amber-400 bg-amber-500/15 px-1 py-0.2 rounded border border-amber-500/25">
                        {language === 'KO' ? '순익적자 (BPS)' : 'Deficit'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Temperature Badge & Compact Weather Icon Underneath */}
                <div className="flex flex-col items-end shrink-0">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border font-black text-xs sm:text-sm shadow-md ${next1Data.tempDetails.badgeColorClass}`}>
                    <WeatherIcon name={next1Data.tempDetails.iconName as any} className="w-3.5 h-3.5" />
                    <span className="font-mono">{next1Data.temp.toFixed(1)}°C</span>
                  </div>
                  <span className="text-[9.5px] font-extrabold text-slate-400 mt-0.5">
                    {next1Data.tempDetails.label}
                  </span>
                  {/* Subtle Weather Animation Icon Under Temperature */}
                  <div className="mt-1 opacity-60 flex items-center justify-center">
                    <WeatherIcon name={next1Data.tempDetails.iconName as any} className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* [2. Next Card Center: Identical Valuation Difference Badge] */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1">
              {renderValuationDiffBadge(next1Data)}
            </div>

            {/* [3. Next Card Bottom: Visible when lifting front card UP (Poker Squeeze!)] */}
            <div className="relative z-10 mt-auto w-full bg-slate-950/45 backdrop-blur-md border border-slate-800/60 rounded-2xl p-2.5 sm:p-3 shadow-xl">
              <div className="grid grid-cols-2 gap-3 text-center divide-x divide-slate-800/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
                    {t('currentPrice')}
                  </span>
                  <span className="text-lg sm:text-xl font-black font-mono text-slate-100 mt-0.5 block">
                    {nextStock1.country === 'KR'
                      ? `${next1Data.livePrice.toLocaleString()}원`
                      : nextStock1.country === 'VN'
                      ? `${next1Data.livePrice.toLocaleString()} ₫`
                      : `$${next1Data.livePrice.toLocaleString()}`}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      {t('fairPrice')} (AI)
                    </span>
                  </div>
                  <span className={`text-lg sm:text-xl font-black font-mono mt-0.5 block ${next1Data.fairPrice > 0 ? next1Data.tempDetails.colorClass : 'text-slate-400 text-xs font-sans'}`}>
                    {next1Data.fairPrice > 0
                      ? (nextStock1.country === 'KR'
                        ? `${Math.round(next1Data.fairPrice).toLocaleString()}원`
                        : nextStock1.country === 'VN'
                        ? `${Math.round(next1Data.fairPrice).toLocaleString()} ₫`
                        : `$${next1Data.fairPrice.toFixed(2)}`)
                      : (language === 'KO' ? '산정불가' : 'N/A')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Foreground Active Card */}
      <div
        key={`front-${currentStock.id}`}
        ref={cardRef}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: frontTransform,
          opacity: flyOutDirection ? 0 : 1,
          transition: isDragging ? 'none' : 'transform 0.24s cubic-bezier(0.2, 0.8, 0.4, 1), opacity 0.24s ease-out',
          zIndex: 10,
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        className={`absolute inset-0 p-[1.5px] rounded-3xl bg-gradient-to-b ${getCardBorderGradient(currentData.temp)} shadow-[0_16px_36px_-6px_rgba(0,0,0,0.9),0_0_20px_rgba(0,0,0,0.5)] will-change-transform group cursor-pointer`}
      >
        <div className="w-full h-full bg-slate-900/95 rounded-[22.5px] p-3.5 flex flex-col justify-between overflow-hidden relative">
          {/* Weather Background Animation Component */}
          <WeatherCardAnimation temperature={currentData.temp} />

          {/* [1. 상단] 종목명 & 적정 밸류 (온도/상태 뱃지 & 밑으로 은은한 날씨 아이콘) */}
          <div className="relative z-10 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[9.5px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                  <span>{getCountryName(currentStock.country, language)}</span>
                  <span className="text-slate-600">•</span>
                  <span className="truncate">{translateIndustry(currentStock.industry, language)}</span>
                </span>
                <h2 className="text-lg font-black text-slate-100 tracking-tight truncate mt-0.5 group-hover:text-blue-300 transition-colors">
                  {language === 'KO' && currentStock.koreanName ? currentStock.koreanName : currentStock.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded-md border border-blue-500/20">
                    {currentStock.ticker}
                  </span>
                  {currentData.isDeficit && (
                    <span className="text-[8.5px] font-bold text-amber-400 bg-amber-500/15 px-1 py-0.2 rounded border border-amber-500/25">
                      {language === 'KO' ? '순익적자 (BPS기준)' : 'Deficit (BPS Basis)'}
                    </span>
                  )}
                </div>
              </div>

              {/* Temperature & Valuation Status Badge */}
              <div className="flex flex-col items-end shrink-0">
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border font-black text-xs sm:text-sm shadow-md ${currentData.tempDetails.badgeColorClass}`}>
                  <WeatherIcon name={currentData.tempDetails.iconName as any} className="w-3.5 h-3.5" />
                  <span className="font-mono">{currentData.temp.toFixed(1)}°C</span>
                </div>
                <span className="text-[9.5px] font-extrabold text-slate-400 mt-0.5">
                  {currentData.tempDetails.label}
                </span>

                {/* Compact Weather Animation Icon Under Temperature with High Transparency */}
                <div className="mt-1 opacity-60 flex items-center justify-center">
                  <WeatherIcon name={currentData.tempDetails.iconName as any} className="w-5 h-5 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* [2. 중간 핵심 HERO] 세부정보와 완벽 동일한 밸류에이션 뱃지 (꺾인 번개 화살표 + 0.00% 차이 저평가/고평가) */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1">
            {renderValuationDiffBadge(currentData)}
          </div>

          {/* [3. 하단] 현재 주가 vs 적정 주가 (AI) 2열 카드 (카드 맨 하단 배치) */}
          <div className="relative z-10 mt-auto w-full bg-slate-950/45 backdrop-blur-md border border-slate-800/60 rounded-2xl p-2.5 sm:p-3 shadow-2xl">
            <div className="grid grid-cols-2 gap-3 text-center divide-x divide-slate-800/80">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
                  {t('currentPrice')}
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-slate-100 mt-0.5 block tracking-tight">
                  {currentStock.country === 'KR'
                    ? `${currentData.livePrice.toLocaleString()}원`
                    : currentStock.country === 'VN'
                    ? `${currentData.livePrice.toLocaleString()} ₫`
                    : `$${currentData.livePrice.toLocaleString()}`}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {t('fairPrice')} (AI)
                  </span>
                </div>
                <span className={`text-lg sm:text-xl font-black font-mono mt-0.5 block tracking-tight ${currentData.fairPrice > 0 ? currentData.tempDetails.colorClass : 'text-slate-400 text-xs font-sans'}`}>
                  {currentData.fairPrice > 0
                    ? (currentStock.country === 'KR'
                      ? `${Math.round(currentData.fairPrice).toLocaleString()}원`
                      : currentStock.country === 'VN'
                      ? `${Math.round(currentData.fairPrice).toLocaleString()} ₫`
                      : `$${currentData.fairPrice.toFixed(2)}`)
                    : (language === 'KO' ? '산정불가' : 'N/A')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
