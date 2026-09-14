import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  RotateCcw, Sparkles, Zap, TrendingUp, TrendingDown
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

  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      const lastViewedId = sessionStorage.getItem('stocktemp_last_viewed')
      if (lastViewedId && stocks && stocks.length > 0) {
        const foundIdx = stocks.findIndex(s => s.id === lastViewedId)
        if (foundIdx >= 0) return foundIdx
      }
    } catch (e) {}
    return 0
  })
  const [history, setHistory] = useState<number[]>([])

  // Touch / Drag interaction states
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [flyOutDirection, setFlyOutDirection] = useState<'left' | 'right' | null>(null)
  
  const cardRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragStartTimeRef = useRef<number>(0)

  // Handle Card Dismiss (Swipe Left or Right)
  const triggerSwipe = useCallback((direction: 'left' | 'right') => {
    if (currentIndex >= stocks.length || flyOutDirection) return
    
    setFlyOutDirection(direction)

    setTimeout(() => {
      setHistory(prev => [...prev, currentIndex])
      setCurrentIndex(prev => prev + 1)
      setFlyOutDirection(null)
      setDragOffset({ x: 0, y: 0 })
      setIsDragging(false)
    }, 240)
  }, [currentIndex, stocks, flyOutDirection])

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
        <div className="flex flex-col items-center justify-center py-3.5 px-6 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-slate-955/90 border border-slate-750/60 shadow-xl backdrop-blur-xl w-full max-w-[270px] transform hover:scale-105 transition-all text-center">
          {/* Top: Pure text without warning icon */}
          <span className="font-black text-base sm:text-lg text-slate-200 tracking-tight">
            {language === 'KO' 
              ? '적정가 산정불가' 
              : language === 'VI' 
              ? 'Không thể tính giá' 
              : 'Fair Price Not Applicable'}
          </span>

          {/* Bottom: Caption Subtext */}
          <span className="text-[11px] font-bold text-slate-400 mt-1 tracking-wider">
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
        <div className="flex flex-col items-center justify-center py-3.5 px-6 rounded-3xl bg-gradient-to-b from-emerald-950/80 via-teal-950/70 to-slate-950/90 border border-emerald-500/40 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl w-full max-w-[270px] transform hover:scale-105 transition-all">
          {/* Top: Large Arrow + Percentage */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-emerald-400 stroke-[2.8] animate-pulse" />
            <span className="font-mono font-black text-3xl text-emerald-300 tracking-tight">
              +{data.absGap}%
            </span>
          </div>

          {/* Bottom: Caption Subtext */}
          <span className="text-[11px] font-bold text-emerald-400/90 mt-1.5 tracking-wider uppercase">
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
      <div className="flex flex-col items-center justify-center py-3.5 px-6 rounded-3xl bg-gradient-to-b from-rose-950/80 via-red-950/70 to-slate-950/90 border border-rose-500/40 shadow-2xl shadow-rose-500/20 backdrop-blur-xl w-full max-w-[270px] transform hover:scale-105 transition-all">
        {/* Top: Large Arrow + Percentage */}
        <div className="flex items-center gap-2">
          <TrendingDown className="w-8 h-8 text-rose-400 stroke-[2.8] animate-pulse" />
          <span className="font-mono font-black text-3xl text-rose-300 tracking-tight">
            -{data.absGap}%
          </span>
        </div>

        {/* Bottom: Caption Subtext */}
        <span className="text-[11px] font-bold text-rose-400/90 mt-1.5 tracking-wider uppercase">
          {language === 'KO'
            ? '적정가 대비 차이 (고평가)'
            : language === 'VI'
            ? 'Chênh lệch (Định giá cao)'
            : 'vs Fair Value (Overvalued)'}
        </span>
      </div>
    )
  }

  // End of Deck
  if (currentIndex >= stocks.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/90 border border-slate-800 rounded-3xl text-center space-y-5 min-h-[480px] shadow-2xl animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/30 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>
        <div className="space-y-1.5 max-w-xs">
          <h3 className="text-lg font-black text-slate-100">
            {language === 'KO' ? '모든 카드를 탐색했습니다!' : language === 'VI' ? 'Đã khám phá hết các mã!' : 'All stocks explored!'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {language === 'KO'
              ? '준비된 모든 종목의 온도를 확인했습니다. 처음부터 다시 탐색해 보세요.'
              : 'You have reviewed all stock temperatures in this catalog.'}
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setCurrentIndex(0)
              setHistory([])
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{language === 'KO' ? '처음부터 다시 보기' : language === 'VI' ? 'Xem lại từ đầu' : 'Start Over'}</span>
          </button>
        </div>
      </div>
    )
  }

  const currentStock = stocks[currentIndex]
  const nextStock1 = stocks[currentIndex + 1]
  const nextStock2 = stocks[currentIndex + 2]

  const currentData = getStockCardData(currentStock)
  const next1Data = nextStock1 ? getStockCardData(nextStock1) : null

  // Front Card Transform logic
  const rotation = dragOffset.x * 0.08
  const frontTransform = flyOutDirection
    ? flyOutDirection === 'right'
      ? 'translate3d(150%, 15px, 0) rotate(22deg)'
      : 'translate3d(-150%, 15px, 0) rotate(-22deg)'
    : `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`

  // Rear Card Transform logic (Poker Peek & Squeeze experience!)
  const rearTransform = flyOutDirection
    ? 'scale(1) translateY(0px)'
    : isDragging
    ? `scale(${0.94 + Math.min(0.05, (Math.abs(dragOffset.x) + Math.abs(dragOffset.y)) / 350)}) translateY(${12 - Math.min(10, Math.abs(dragOffset.y) / 18)}px)`
    : 'scale(0.94) translateY(12px)'

  const rearOpacity = flyOutDirection ? 1 : isDragging ? 0.95 : 0.72

  return (
    <div className="relative w-full max-w-sm mx-auto select-none flex flex-col justify-center my-auto py-1">
      {/* Top Header: Title, Undo, Progress Counter */}
      <div className="flex items-center justify-between px-2 mb-2 text-[11px] text-slate-400 font-bold">
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
              className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700 transition-colors cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>{language === 'KO' ? '이전 종목' : 'Undo'}</span>
            </button>
          )}
          <span className="font-mono text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
            {currentIndex + 1} / {stocks.length}
          </span>
        </div>
      </div>

      {/* Card Deck Viewport (Poker Card Squeeze & Peek Container) */}
      <div className="relative h-[485px] w-full flex items-center justify-center">
        {/* Background Card 2 (Bottom layer placeholder) */}
        {nextStock2 && (
          <div 
            className="absolute inset-0 bg-slate-950/60 border border-slate-850 rounded-3xl shadow-lg pointer-events-none transition-all duration-300"
            style={{
              transform: 'scale(0.88) translateY(24px)',
              zIndex: 1,
              opacity: 0.35
            }}
          />
        )}

        {/* Background Card 1 (Peekable Next Card) */}
        {nextStock1 && next1Data && (
          <div 
            key={`rear-${nextStock1.id}`}
            className="absolute inset-0 bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-xl pointer-events-none flex flex-col justify-between overflow-hidden will-change-transform"
            style={{
              transform: rearTransform,
              opacity: rearOpacity,
              zIndex: 2,
              transition: isDragging ? 'none' : 'transform 0.24s cubic-bezier(0.2, 0.8, 0.4, 1), opacity 0.24s ease-out'
            }}
          >
            {/* Weather Background Animation for Next Card */}
            <WeatherCardAnimation temperature={next1Data.temp} />

            {/* [1. Next Card Top: Visible when dragging front card DOWN] */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                    <span>{getCountryName(nextStock1.country, language)}</span>
                    <span className="text-slate-600">•</span>
                    <span className="truncate">{translateIndustry(nextStock1.industry, language)}</span>
                  </span>
                  <h2 className="text-xl font-black text-slate-100 tracking-tight truncate mt-0.5">
                    {language === 'KO' && nextStock1.koreanName ? nextStock1.koreanName : nextStock1.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                      {nextStock1.ticker}
                    </span>
                    {next1Data.isDeficit && (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/25">
                        {language === 'KO' ? '순익적자 (BPS)' : 'Deficit'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Temperature Badge & Compact Weather Icon Underneath */}
                <div className="flex flex-col items-end shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border font-black text-sm shadow-md ${next1Data.tempDetails.badgeColorClass}`}>
                    <WeatherIcon name={next1Data.tempDetails.iconName as any} className="w-4 h-4" />
                    <span className="font-mono">{next1Data.temp.toFixed(1)}°C</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 mt-0.5">
                    {next1Data.tempDetails.label}
                  </span>
                  {/* Subtle Weather Animation Icon Under Temperature */}
                  <div className="mt-1.5 opacity-60 flex items-center justify-center">
                    <WeatherIcon name={next1Data.tempDetails.iconName as any} className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* [2. Next Card Center: Identical Valuation Difference Badge] */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto py-3">
              {renderValuationDiffBadge(next1Data)}
            </div>

            {/* [3. Next Card Bottom: Visible when lifting front card UP (Poker Squeeze!)] */}
            <div className="relative z-10 mt-auto w-full bg-slate-950/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 shadow-xl">
              <div className="grid grid-cols-2 gap-4 text-center divide-x divide-slate-800/80">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight block">
                    {t('currentPrice')}
                  </span>
                  <span className="text-xl font-black font-mono text-slate-100 mt-1 block">
                    {nextStock1.country === 'KR'
                      ? `${next1Data.livePrice.toLocaleString()}원`
                      : nextStock1.country === 'VN'
                      ? `${next1Data.livePrice.toLocaleString()} ₫`
                      : `$${next1Data.livePrice.toLocaleString()}`}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                      {t('fairPrice')} (AI)
                    </span>
                  </div>
                  <span className={`text-xl font-black font-mono mt-1 block ${next1Data.fairPrice > 0 ? next1Data.tempDetails.colorClass : 'text-slate-400 text-sm font-sans'}`}>
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
          className="absolute inset-0 bg-slate-900 border border-slate-750/90 rounded-3xl p-5 shadow-2xl flex flex-col justify-between overflow-hidden will-change-transform group cursor-pointer"
        >
          {/* Weather Background Animation Component */}
          <WeatherCardAnimation temperature={currentData.temp} />

          {/* [1. 상단] 종목명 & 적정 밸류 (온도/상태 뱃지 & 밑으로 은은한 날씨 아이콘) */}
          <div className="relative z-10 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                  <span>{getCountryName(currentStock.country, language)}</span>
                  <span className="text-slate-600">•</span>
                  <span className="truncate">{translateIndustry(currentStock.industry, language)}</span>
                </span>
                <h2 className="text-xl font-black text-slate-100 tracking-tight truncate mt-0.5 group-hover:text-blue-300 transition-colors">
                  {language === 'KO' && currentStock.koreanName ? currentStock.koreanName : currentStock.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                    {currentStock.ticker}
                  </span>
                  {currentData.isDeficit && (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/25">
                      {language === 'KO' ? '순익적자 (BPS기준)' : 'Deficit (BPS Basis)'}
                    </span>
                  )}
                </div>
              </div>

              {/* Temperature & Valuation Status Badge */}
              <div className="flex flex-col items-end shrink-0">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border font-black text-sm shadow-md ${currentData.tempDetails.badgeColorClass}`}>
                  <WeatherIcon name={currentData.tempDetails.iconName as any} className="w-4 h-4" />
                  <span className="font-mono">{currentData.temp.toFixed(1)}°C</span>
                </div>
                <span className="text-[10px] font-extrabold text-slate-400 mt-0.5">
                  {currentData.tempDetails.label}
                </span>

                {/* Compact Weather Animation Icon Under Temperature with High Transparency */}
                <div className="mt-1.5 opacity-60 flex items-center justify-center">
                  <WeatherIcon name={currentData.tempDetails.iconName as any} className="w-6 h-6 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* [2. 중간 핵심 HERO] 세부정보와 완벽 동일한 밸류에이션 뱃지 (꺾인 번개 화살표 + 0.00% 차이 저평가/고평가) */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto py-3">
            <div className="transform hover:scale-105 transition-transform">
              {renderValuationDiffBadge(currentData)}
            </div>
          </div>

          {/* [3. 하단] 현재 주가 vs 적정 주가 (AI) 2열 카드 (카드 맨 하단 배치) */}
          <div className="relative z-10 mt-auto w-full bg-slate-950/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 shadow-2xl">
            <div className="grid grid-cols-2 gap-4 text-center divide-x divide-slate-800/80">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight block">
                  {t('currentPrice')}
                </span>
                <span className="text-xl font-black font-mono text-slate-100 mt-1 block tracking-tight">
                  {currentStock.country === 'KR'
                    ? `${currentData.livePrice.toLocaleString()}원`
                    : currentStock.country === 'VN'
                    ? `${currentData.livePrice.toLocaleString()} ₫`
                    : `$${currentData.livePrice.toLocaleString()}`}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                    {t('fairPrice')} (AI)
                  </span>
                </div>
                <span className={`text-xl font-black font-mono mt-1 block tracking-tight ${currentData.fairPrice > 0 ? currentData.tempDetails.colorClass : 'text-slate-400 text-sm font-sans'}`}>
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
  )
}
