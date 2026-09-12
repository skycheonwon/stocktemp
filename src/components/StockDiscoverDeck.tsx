import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { 
  RotateCcw, ChevronRight,
  Sparkles, Zap
} from 'lucide-react'
import type { Stock } from '../data/mockStocks'
import { WeatherIcon } from './WeatherIcon'
import { 
  calculateFairPrice, 
  calculateStockTemperature, 
  getTemperatureDetails,
  calculateExpectedReturn 
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [history, setHistory] = useState<number[]>([])

  // Touch / Drag interaction states
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [flyOutDirection, setFlyOutDirection] = useState<'left' | 'right' | null>(null)
  
  const cardRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Handle Card Dismiss (Swipe Left or Right to discard current card)
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

  // Keyboard navigation for desktop testing (Left/Right to dismiss, Backspace to undo)
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
    const horizontalThreshold = 80

    // Only horizontal swipes dismiss the card
    if (dragOffset.x > horizontalThreshold) {
      triggerSwipe('right')
    } else if (dragOffset.x < -horizontalThreshold) {
      triggerSwipe('left')
    } else {
      // Up & Down dragging is for peeking behind the card -> Always snap back smoothly to (0, 0)!
      setDragOffset({ x: 0, y: 0 })
    }
  }

  // Helper to compute stock metrics
  const getStockCardData = (stock: Stock) => {
    const livePrice = prices[stock.ticker] ?? stock.currentPrice
    const liveEps = eps[stock.ticker] ?? stock.eps
    const isDeficit = liveEps <= 0
    const currentPe = liveEps > 0 ? livePrice / liveEps : 0
    const fairPrice = calculateFairPrice(liveEps, stock.defaultTargetPe || 15, stock.bps, stock.pbr, livePrice)
    const temp = calculateStockTemperature(livePrice, fairPrice)
    const tempDetails = getTemperatureDetails(temp)
    const expectedReturn = calculateExpectedReturn(currentPe)
    return {
      livePrice,
      liveEps,
      isDeficit,
      currentPe,
      fairPrice,
      temp,
      tempDetails,
      expectedReturn
    }
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
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

  // Rear Card Transform logic (scales up seamlessly to 1.0 when front card flies away)
  const rearTransform = flyOutDirection
    ? 'scale(1) translateY(0px)'
    : isDragging
    ? `scale(${0.94 + Math.min(0.05, (Math.abs(dragOffset.x) + Math.abs(dragOffset.y)) / 350)}) translateY(${12 - Math.min(10, Math.abs(dragOffset.y) / 18)}px)`
    : 'scale(0.94) translateY(12px)'

  const rearOpacity = flyOutDirection ? 1 : isDragging ? 0.95 : 0.72

  return (
    <div className="relative w-full max-w-sm mx-auto select-none py-1">
      {/* Top Header: Title, Undo, Progress Counter */}
      <div className="flex items-center justify-between px-2 mb-2.5 text-[11px] text-slate-400 font-bold">
        <span className="flex items-center gap-1.5 text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'KO' ? '탐색 덱' : 'Discover Deck'}</span>
        </span>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
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

      {/* Card Deck Viewport */}
      <div className="relative h-[495px] w-full flex items-center justify-center">
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

        {/* Background Card 1 (Real Next Card - Peekable Poker Layer that seamlessly rises in place) */}
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
            {/* Next Card Ambient Glow */}
            <div 
              className={`absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20 bg-gradient-to-br ${next1Data.tempDetails.gradientClass}`}
            />

            {/* Next Card Top: Stock Identity & Temperature (Visible when pulling front card DOWN) */}
            <div className="space-y-2">
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
                        {language === 'KO' ? '⚠️ 순익적자(BPS)' : 'Deficit (BPS)'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Next Card Temperature Badge */}
                <div className="flex flex-col items-end shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border font-black text-sm shadow-md ${next1Data.tempDetails.badgeColorClass}`}>
                    <WeatherIcon name={next1Data.tempDetails.iconName as any} className="w-4 h-4" />
                    <span className="font-mono">{next1Data.temp.toFixed(1)}°C</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 mt-1">
                    {next1Data.tempDetails.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Card Center: Financial Metrics (EPS, Target P/E, ROE, PBR) */}
            <div className="grid grid-cols-4 gap-2 text-center bg-slate-950/40 p-2.5 rounded-2xl border border-slate-800/60 text-xs my-2">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase block">EPS</span>
                <span className="font-mono font-bold text-slate-200 text-[11px] mt-0.5 block truncate">
                  {next1Data.liveEps > 0 ? (nextStock1.country === 'KR' ? `${Math.round(next1Data.liveEps).toLocaleString()}` : next1Data.liveEps.toFixed(1)) : '-'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase block">목표 P/E</span>
                <span className="font-mono font-bold text-indigo-400 text-[11px] mt-0.5 block">
                  {nextStock1.defaultTargetPe || 15}x
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase block">ROE</span>
                <span className="font-mono font-bold text-emerald-400 text-[11px] mt-0.5 block">
                  {nextStock1.roe !== undefined ? `${nextStock1.roe.toFixed(1)}%` : '-'}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase block">PBR</span>
                <span className="font-mono font-bold text-slate-200 text-[11px] mt-0.5 block">
                  {nextStock1.pbr ? `${nextStock1.pbr.toFixed(2)}x` : '-'}
                </span>
              </div>
            </div>

            {/* Next Card Bottom: Current Price vs Fair Price (Visible when pulling front card UP) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
                    {t('currentPrice')}
                  </span>
                  <span className="text-base font-black font-mono text-slate-100 mt-0.5 block">
                    {nextStock1.country === 'KR'
                      ? `${next1Data.livePrice.toLocaleString()}원`
                      : nextStock1.country === 'VN'
                      ? `${next1Data.livePrice.toLocaleString()} ₫`
                      : `$${next1Data.livePrice.toLocaleString()}`}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
                    {t('fairPrice')} (AI)
                  </span>
                  <span className={`text-base font-black font-mono mt-0.5 block ${next1Data.tempDetails.colorClass}`}>
                    {next1Data.fairPrice > 0
                      ? (nextStock1.country === 'KR'
                        ? `${Math.round(next1Data.fairPrice).toLocaleString()}원`
                        : nextStock1.country === 'VN'
                        ? `${Math.round(next1Data.fairPrice).toLocaleString()} ₫`
                        : `$${next1Data.fairPrice.toFixed(2)}`)
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Detail button placeholder */}
              <div className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-slate-800/60 text-slate-400 text-xs font-bold border border-slate-750">
                <span>{language === 'KO' ? '상세 재무 / AI 토론 보기' : 'View Full Details & AI'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
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
          className="absolute inset-0 bg-slate-900 border border-slate-750/90 rounded-3xl p-5 shadow-2xl flex flex-col justify-between overflow-hidden will-change-transform group"
        >
          {/* Ambient Weather Glow Aura */}
          <div 
            className={`absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-25 bg-gradient-to-br ${currentData.tempDetails.gradientClass}`}
          />

          {/* [1. 상단] 종목명 & 적정 밸류 (온도/상태 뱃지) */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                  <span>{getCountryName(currentStock.country, language)}</span>
                  <span className="text-slate-600">•</span>
                  <span className="truncate">{translateIndustry(currentStock.industry, language)}</span>
                </span>
                <h2 className="text-xl font-black text-slate-100 tracking-tight truncate mt-0.5">
                  {language === 'KO' && currentStock.koreanName ? currentStock.koreanName : currentStock.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                    {currentStock.ticker}
                  </span>
                  {currentData.isDeficit && (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/25">
                      {language === 'KO' ? '⚠️ 순익적자 (BPS기준)' : 'Deficit (BPS Basis)'}
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
                <span className="text-[10px] font-extrabold text-slate-400 mt-1">
                  {currentData.tempDetails.label}
                </span>
              </div>
            </div>
          </div>

          {/* [2. 중간] EPS & 핵심 밸류에이션 지표 */}
          <div className="grid grid-cols-4 gap-2 text-center bg-slate-950/40 p-2.5 rounded-2xl border border-slate-850 text-xs my-2">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">EPS</span>
              <span className="font-mono font-bold text-slate-100 text-[11px] mt-0.5 block truncate">
                {currentData.liveEps > 0 
                  ? (currentStock.country === 'KR' ? `${Math.round(currentData.liveEps).toLocaleString()}` : currentData.liveEps.toFixed(1)) 
                  : '-'}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">목표 P/E</span>
              <span className="font-mono font-bold text-indigo-400 text-[11px] mt-0.5 block">
                {currentStock.defaultTargetPe || 15}x
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">ROE</span>
              <span className="font-mono font-bold text-emerald-400 text-[11px] mt-0.5 block">
                {currentStock.roe !== undefined ? `${currentStock.roe.toFixed(1)}%` : '-'}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">PBR</span>
              <span className="font-mono font-bold text-slate-200 text-[11px] mt-0.5 block">
                {currentStock.pbr ? `${currentStock.pbr.toFixed(2)}x` : '-'}
              </span>
            </div>
          </div>

          {/* [3. 하단] 현재주가 vs 적정주가 비교 & 상세 링크 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
                  {t('currentPrice')}
                </span>
                <span className="text-lg font-black font-mono text-slate-100 mt-0.5 block">
                  {currentStock.country === 'KR'
                    ? `${currentData.livePrice.toLocaleString()}원`
                    : currentStock.country === 'VN'
                    ? `${currentData.livePrice.toLocaleString()} ₫`
                    : `$${currentData.livePrice.toLocaleString()}`}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-400" />
                    {t('fairPrice')} (AI)
                  </span>
                </div>
                {/* 적정주가 색상을 저평가/고평가/적정가 상태 색상과 동일하게 표시 */}
                <span className={`text-lg font-black font-mono mt-0.5 block ${currentData.tempDetails.colorClass}`}>
                  {currentData.fairPrice > 0
                    ? (currentStock.country === 'KR'
                      ? `${Math.round(currentData.fairPrice).toLocaleString()}원`
                      : currentStock.country === 'VN'
                      ? `${Math.round(currentData.fairPrice).toLocaleString()} ₫`
                      : `$${currentData.fairPrice.toFixed(2)}`)
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* 기대 수익률 밴드 (기준금리 대비 초과수익 표시) */}
            {(() => {
              const baseRate = currentStock.country === 'KR' ? 3.50 : currentStock.country === 'US' ? 5.25 : currentStock.country === 'VN' ? 4.50 : 3.35
              const spread = Number((currentData.expectedReturn - baseRate).toFixed(1))
              const isPositive = spread >= 0

              return (
                <div className="pt-2 border-t border-slate-850/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">
                      {t('expectedReturn')} (1/PER)
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                      isPositive ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                    }`}>
                      {isPositive ? `✨ 금리+${spread}%p 초과` : `⚠️ 금리${spread}%p`}
                    </span>
                  </div>
                  <span className={`font-mono font-black ${
                    isPositive ? 'text-emerald-400' : 'text-slate-200'
                  }`}>
                    {currentData.expectedReturn.toFixed(1)}%
                  </span>
                </div>
              )
            })()}

            {/* 적정가 밑에 상세 재무/토론 보기 링크 */}
            <Link
              to={`/stock/${currentStock.id}`}
              onClick={(e) => {
                e.stopPropagation()
                try {
                  sessionStorage.setItem('stocktemp_last_view_mode', 'deck')
                } catch (err) {}
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold transition-all border border-blue-500/30 cursor-pointer shadow-md shadow-blue-500/10 active:scale-[0.98]"
            >
              <span>{language === 'KO' ? '상세 재무 / AI 토론 보기' : 'View Full Details & AI'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
