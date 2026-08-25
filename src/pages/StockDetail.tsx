import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, TrendingUp, Zap } from 'lucide-react'
import { COUNTRY_NAMES } from '../data/mockStocks'
import { useLanguage } from '../context/LanguageContext'
import { useLivePrices } from '../context/LivePriceContext'
import {
  calculateFairPrice,
  calculateExpectedReturn,
  calculateStockTemperature,
} from '../utils/valuation'
import { WeatherIcon } from '../components/WeatherIcon'

export default function StockDetail() {
  const { id } = useParams<{ id: string }>()
  const { stocks, prices, eps, loading } = useLivePrices()
  const stock = stocks.find((s) => s.id === id)
  const { t, language } = useLanguage()

  // State
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const [expandedNewsIndex, setExpandedNewsIndex] = useState<number | null>(null)

  // Watchlist LocalStorage sync
  useEffect(() => {
    if (!stock) return
    const saved = localStorage.getItem('stocktemp_watchlist')
    if (saved) {
      const watchlist = JSON.parse(saved) as string[]
      setIsSaved(watchlist.includes(stock.id))
    }
  }, [stock])

  if (loading && !stock) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading stock data...</p>
      </div>
    )
  }

  if (!stock) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-slate-300">{t('stockNotFound')}</h2>
        <Link to="/" className="text-blue-400 hover:underline flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('backToDashboard')}
        </Link>
      </div>
    )
  }

  const toggleWatchlist = () => {
    const saved = localStorage.getItem('stocktemp_watchlist')
    let watchlist: string[] = saved ? JSON.parse(saved) : []

    if (watchlist.includes(stock.id)) {
      watchlist = watchlist.filter((item) => item !== stock.id)
      setIsSaved(false)
    } else {
      watchlist.push(stock.id)
      setIsSaved(true)
    }
    localStorage.setItem('stocktemp_watchlist', JSON.stringify(watchlist))
  }

  const currentPrice = prices[stock.id] || stock.currentPrice
  const targetPe = stock.defaultTargetPe
  const currentEps = eps[stock.id] || stock.eps

  // Recalculate metrics based on targetPe & currentPrice state
  const fairPrice = calculateFairPrice(currentEps, targetPe)
  const expectedReturn = calculateExpectedReturn(currentPrice / currentEps)
  const stockTemp = calculateStockTemperature(currentPrice, fairPrice)

  const getLocalizedTempDetails = (temp: number, t: any) => {
    if (temp <= -2.5) {
      return {
        label: t('tempFreezingLabel'),
        description: t('tempFreezingDesc'),
        colorClass: 'text-blue-400',
        badgeColorClass: 'bg-blue-950/80 text-blue-300 border-blue-900/50',
        emoji: '❄️',
        iconName: 'snowflake' as const,
        tempVal: `${temp}°C`,
      }
    } else if (temp < 12.5) {
      return {
        label: t('tempCoolLabel'),
        description: t('tempCoolDesc'),
        colorClass: 'text-cyan-400',
        badgeColorClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-900/50',
        emoji: '🔵',
        iconName: 'wind' as const,
        tempVal: `${temp}°C`,
      }
    } else if (temp <= 27.5) {
      return {
        label: t('tempNormalLabel'),
        description: t('tempNormalDesc'),
        colorClass: 'text-emerald-400',
        badgeColorClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-900/50',
        emoji: '🟢',
        iconName: 'cloud-sun' as const,
        tempVal: `${temp}°C`,
      }
    } else if (temp <= 42.5) {
      return {
        label: t('tempWarmLabel'),
        description: t('tempWarmDesc'),
        colorClass: 'text-amber-400',
        badgeColorClass: 'bg-amber-950/80 text-amber-300 border-amber-900/50',
        emoji: '🟠',
        iconName: 'sun' as const,
        tempVal: `${temp}°C`,
      }
    } else {
      return {
        label: t('tempHotLabel'),
        description: t('tempHotDesc'),
        colorClass: 'text-rose-500',
        badgeColorClass: 'bg-rose-950/80 text-rose-300 border-rose-900/50',
        emoji: '🔴',
        iconName: 'flame' as const,
        tempVal: `${temp}°C`,
      }
    }
  }

  const tempDetails = getLocalizedTempDetails(stockTemp, t)

  const displayName = language === 'KO' ? (stock.koreanName || stock.name) : stock.name
  const baseRate = getBaseInterestRate(stock.country)

  // Load real-world synced news or fallback to mock news
  let newsList: any[] = []
  if (language === 'KO' && stock.latestNews_KO && stock.latestNews_KO.length > 0) {
    newsList = stock.latestNews_KO
  } else if (language === 'VI' && stock.latestNews_VI && stock.latestNews_VI.length > 0) {
    newsList = stock.latestNews_VI
  } else if (stock.latestNews_EN && stock.latestNews_EN.length > 0) {
    newsList = stock.latestNews_EN
  } else {
    newsList = getMockNews(stock, displayName, language)
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {COUNTRY_NAMES[stock.country as 'KR' | 'US' | 'VN' | 'CN']} | {stock.industry}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-xl md:text-2xl font-black text-slate-100">
                {displayName}
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg">
                {stock.ticker}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={toggleWatchlist}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
            isSaved
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
          {isSaved ? t('removeWatchlist') : t('addWatchlist')}
        </button>
      </div>

      {/* Top Metrics Grid (4-Card) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="block text-xs text-slate-200 font-bold uppercase tracking-wider">{t('currentPrice')}</span>
          <span className="block text-xl md:text-2xl font-black text-slate-200 mt-1.5 font-mono">
            {stock.currency} {currentPrice.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="block text-xs text-slate-200 font-bold uppercase tracking-wider">{t('fairPrice')}</span>
          <span className="block text-xl md:text-2xl font-black text-blue-400 mt-1.5 font-mono">
            {stock.currency} {Math.round(fairPrice).toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="block text-xs text-slate-200 font-bold uppercase tracking-wider">{t('baseInterestRate')}</span>
          <span className="block text-xl md:text-2xl font-black text-amber-500 mt-1.5 font-mono">
            {baseRate}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="block text-xs text-slate-200 font-bold uppercase tracking-wider">{t('expectedReturn')}</span>
          <span className={`block text-xl md:text-2xl font-black mt-1.5 font-mono flex items-center gap-1.5 ${
            expectedReturn > 10 ? 'text-emerald-400' : 'text-slate-300'
          }`}>
            <TrendingUp className="w-5 h-5 shrink-0" />
            {expectedReturn}%
          </span>
        </div>
      </div>

      {/* Middle Layout: Interactive Valuation Slider & SVG Charts Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: AI Valuation & Stock Temperature Summary Card (Lg: 4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-full">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  {language === 'KO' ? 'StockTemp 가치 평가 요약' : language === 'VI' ? 'Tóm tắt định giá StockTemp' : 'StockTemp Valuation Summary'}
                </h3>
              </div>

              {/* Grid layout for left text summary and right vertical gauge */}
              <div className="grid grid-cols-12 gap-4 items-stretch">
                {/* Left side (8/12 column): Temp Banner and Action Guide with reduced width */}
                <div className="col-span-8 flex flex-col justify-between gap-4">
                  {/* Stock Temperature Banner with WeatherIcon only */}
                  <div className="flex items-center gap-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4 flex-1">
                    <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl shadow-inner shrink-0">
                      <WeatherIcon name={tempDetails.iconName} className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        {t('currentStockTemp')}
                      </span>
                      <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 mt-0.5">
                        <span className={`text-lg font-black font-mono leading-none ${tempDetails.colorClass}`}>
                          {tempDetails.tempVal}
                        </span>
                        <span className={`text-[10px] font-bold ${tempDetails.colorClass}`}>
                          {tempDetails.emoji} {tempDetails.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Recommendation Message (Same width) */}
                  <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">
                      {language === 'KO' ? '행동 가이드' : language === 'VI' ? 'Hướng dẫn hành động' : 'Action Guide'}
                    </span>
                    {tempDetails.description}
                  </div>
                </div>

                {/* Right side (4/12 column): Vertical Temperature Gauge (Wider, Bolder & Stretched) */}
                <div className="col-span-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl p-1.5 flex flex-col items-center justify-center min-h-[185px]">
                  {renderVerticalTempGauge(stockTemp)}
                </div>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 border-t border-slate-800/50 pt-5">
              {/* 1. Target P/E Multiple (AI Target) */}
              <div className="bg-slate-950/40 p-2 sm:p-3 rounded-xl border border-slate-850 text-center space-y-1 min-w-0">
                <span className="block text-slate-550 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider leading-tight whitespace-normal">
                  {language === 'KO' ? '적정 P/E (AI)' : language === 'VI' ? 'P/E hợp lý (AI)' : 'Fair P/E (AI)'}
                </span>
                <span className="block font-black text-blue-400 font-mono text-sm sm:text-base mt-0.5">
                  {targetPe}x
                </span>
              </div>

              {/* 2. Current P/E Ratio */}
              <div className="bg-slate-950/40 p-2 sm:p-3 rounded-xl border border-slate-850 text-center space-y-1 min-w-0">
                <span className="block text-slate-550 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider leading-tight whitespace-normal">
                  {language === 'KO' ? '현재 P/E' : language === 'VI' ? 'P/E hiện tại' : 'Current P/E'}
                </span>
                <span className="block font-black text-slate-200 font-mono text-sm sm:text-base mt-0.5">
                  {(currentPrice / currentEps).toFixed(1)}x
                </span>
              </div>

              {/* 3. Earnings Per Share (EPS) */}
              <div className="bg-slate-950/40 p-2 sm:p-3 rounded-xl border border-slate-850 text-center space-y-1 min-w-0">
                <span className="block text-slate-550 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider leading-tight whitespace-normal">
                  {language === 'KO' ? '현재 EPS' : language === 'VI' ? 'EPS hiện tại' : 'Current EPS'}
                </span>
                <span className="block font-black text-slate-200 font-mono text-[11px] sm:text-xs md:text-sm mt-0.5 truncate">
                  {stock.currency} {Math.round(currentEps).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Custom Financial Charts Dashboard (Lg: 8/12) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomRevenueEpsChart stock={stock} currentEps={currentEps} language={language} t={t} />
            <CustomBpsChart stock={stock} currentPrice={currentPrice} t={t} />
          </div>
          
          <ConsensusCompareChart stock={stock} currentPrice={currentPrice} fairPrice={fairPrice} language={language} t={t} />
        </div>
      </div>

      {/* Bottom: Latest News Section (Max 3 articles) */}
      <div className="border-t border-slate-800/60 pt-8 space-y-4">
        <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400/20" /> {t('latestNews')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {newsList.map((news, idx) => {
            const isExpanded = expandedNewsIndex === idx
            return (
              <div 
                key={idx} 
                className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-200 shadow-md flex flex-col"
              >
                {/* Header / Click Trigger */}
                <button
                  onClick={() => setExpandedNewsIndex(isExpanded ? null : idx)}
                  className="w-full text-left p-5 flex flex-col justify-between hover:bg-slate-850/50 transition-colors h-full"
                >
                  <div className="flex justify-between items-start text-[10px] text-slate-500 font-bold mb-3 w-full">
                    <span>{news.publisher}</span>
                    <span className="truncate max-w-[100px]">{news.pubDate}</span>
                  </div>
                  <div className="flex justify-between items-end gap-2 w-full">
                    <h4 className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors leading-snug line-clamp-2 flex-1">
                      {news.title}
                    </h4>
                    <span className={`text-[10px] text-slate-500 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 text-blue-400' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Accordion Expanded Content */}
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-[300px] border-t border-slate-850' : 'max-h-0'
                  }`}
                >
                  <div className="p-5 bg-slate-950/20 text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                    {news.content || (
                      language === 'KO' 
                        ? `[금융분석요약] 본 뉴스는 '${news.title}'에 대한 보도입니다.\n\n최근 금융투자업계에서는 해당 기업의 이번 소식이 향후 영업 마진 및 밸류에이션(P/E)에 미칠 중장기 영향에 주목하고 있습니다. 전문가들은 단기 주가 흐름보다는 중장기 밸류에이션의 실질적인 변화를 꾸준히 모니터링할 것을 권장합니다.`
                        : language === 'VI'
                          ? `[Tóm tắt phân tích tài chính] Bản tin này phản ánh về '${news.title}'.\n\nGiới đầu tư đang đánh giá tác động của sự kiện này đối với triển vọng doanh thu và định giá. Khuyến nghị nhà đầu tư tiếp tục theo dõi báo cáo tài chính để kiểm chứng thực tế.`
                          : `[Financial Analysis Summary] This news article reports on '${news.title}'.\n\nMarket participants are evaluating how this development will influence the revenue growth trajectory and valuation multiples. Investors are encouraged to monitor long-term earnings statements.`
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}



const renderVerticalTempGauge = (temp: number) => {
  // Clamp temp between -10 and 100
  const clampedTemp = Math.max(-10, Math.min(100, temp));
  
  // Non-linear visual height mapping:
  // Total viewBox height is 140.
  // 100C is at Y = 5
  // 0C baseline is at Y = 95
  // -10C is at Y = 135
  // Positive range (0 to 100) spans 90px
  // Negative range (0 to -10) spans 40px
  const y_0 = 95;
  const y_minus_10 = 135;
  let y_curr = y_0;
  
  if (clampedTemp >= 0) {
    y_curr = y_0 - (clampedTemp / 100) * 90;
  } else {
    y_curr = y_0 + (Math.abs(clampedTemp) / 10) * 40;
  }
  
  const isPositive = clampedTemp >= 0;
  const pointerColor = isPositive ? '#ef4444' : '#3b82f6';

  return (
    <svg viewBox="0 0 100 140" className="w-full h-full max-h-[185px] select-none">
      <defs>
        {/* Gradation definitions */}
        <linearGradient id="redGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="30%" stopColor="#fdba74" />
          <stop offset="65%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="35%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        
        {/* Clip path for the whole thermometer track */}
        <clipPath id="trackClip">
          <rect x="44" y="5" width="18" height="130" rx="9" />
        </clipPath>
      </defs>

      {/* Background Track border/shadow outline */}
      <rect x="44" y="5" width="18" height="130" rx="9" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
      
      {/* Seamless Gradient Fills inside Clip Path */}
      <g clipPath="url(#trackClip)">
        {/* Below 0C: Blue Gradient Bar (0 to -10) */}
        <rect x="44" y="95" width="18" height="40" fill="url(#blueGrad)" />
        {/* Above 0C: Red Gradient Bar (0 to 100) */}
        <rect x="44" y="5" width="18" height="90" fill="url(#redGrad)" />
      </g>
      
      {/* 0C Baseline marker inside track */}
      <line x1="40" y1={y_0} x2="66" y2={y_0} stroke="#334155" strokeWidth="2" opacity="0.8" />
      
      {/* Current Temperature White Circle Indicator centered in the bar */}
      <circle cx="53" cy={y_curr} r="5.5" fill="#ffffff" stroke={pointerColor} strokeWidth="2.5" />
      
      {/* Indicator Pointer & Value Label on the Left */}
      <line x1="32" y1={y_curr} x2="44" y2={y_curr} stroke={pointerColor} strokeWidth="1.5" strokeDasharray="1.5,1.5" />
      <polygon points={`34,${y_curr-4} 42,${y_curr} 34,${y_curr+4}`} fill={pointerColor} />
      
      {/* Left text label showing the exact temp */}
      <text 
        x="28" 
        y={y_curr + 3.5} 
        fill={pointerColor} 
        textAnchor="end"
        className="text-[9.5px] font-black font-mono"
      >
        {temp.toFixed(1)}°
      </text>
      
      {/* Grid Scale Lines & Text labels on the Right */}
      {/* 100C */}
      <line x1="62" y1="5" x2="70" y2="5" stroke="#475569" strokeWidth="1" />
      <text x="74" y="8.5" fill="#64748b" className="text-[9.5px] font-bold font-mono">100</text>
      
      {/* 0C */}
      <line x1="62" y1={y_0} x2="72" y2={y_0} stroke="#64748b" strokeWidth="1.5" />
      <text x="76" y={y_0+3.5} fill="#94a3b8" className="text-[10px] font-black font-mono">0</text>
      
      {/* -10C */}
      <line x1="62" y1={y_minus_10} x2="70" y2={y_minus_10} stroke="#475569" strokeWidth="1" />
      <text x="74" y={y_minus_10+3.5} fill="#64748b" className="text-[9.5px] font-bold font-mono">-10</text>
    </svg>
  );
};

const getBaseInterestRate = (country: string) => {
  switch (country) {
    case 'KR': return '3.50%';
    case 'US': return '5.25%';
    case 'VN': return '4.50%';
    case 'CN': return '3.35%';
    default: return '3.50%';
  }
}

function getMockNews(stock: any, stockName: string, language: string) {
  const stockId = stock?.id || "";

  if (language === 'KO') {
    if (stockId === 'VN_NVL') {
      return [
        {
          title: '1. 업종 및 시장 환경',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[시장환경] 베트남 부동산 시장은 정부의 금리 인하 및 규제 완화 기조에도 불구하고 거래 침체가 지속되며 전반적으로 위축된 상태입니다. 신규 프로젝트 승인 지연과 민간 개발사들의 사업 착수 지연이 건설 경기 동반 부진을 낳고 있어 노바랜드의 분양 매출 회복에 시간이 걸리고 있습니다.`
        },
        {
          title: '2. 재무 건전성 및 리스크',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[재무분석] 노바랜드는 높은 회사채 발행 잔액과 만기 도래에 따른 유동성 리스크가 지속되고 있습니다. 채권단과의 만기 연장 및 자산 매각을 통한 채무 구조조정을 적극 추진 중이나, 현금성 자산 부족으로 인한 단기 부도 및 디폴트 리스크 모니터링이 핵심 요인입니다.`
        },
        {
          title: '3. 성장 동력 및 가치 분석',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[가치전망] 핵심 리조트 단지(Aqua City, NovaWorld 등)의 인프라 정비 및 공사 재개가 장기 성장 모멘텀의 전제 조건입니다. 정부 차원의 특별 태스크포스(TF) 지원에 따른 법적 규제 해소 여부가 향후 기업 가치 정상화의 최대 분수령이 될 전망입니다.`
        }
      ]
    }
    if (stockId === 'KR_078600') {
      return [
        {
          title: '1. 업종 및 시장 환경',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[배터리 시장] 전기차 배터리 시장의 에너지 밀도 향상 요구로 기존 흑연 음극재에 실리콘 음극재를 섞어 쓰는 비중이 급격히 확대되고 있습니다. 대주전자재료는 독보적인 실리콘 음극재 양산 기술력을 보유하여 글로벌 이차전지 소재 공급망에서 지위를 다지고 있습니다.`
        },
        {
          title: '2. 재무 건전성 및 리스크',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[CapEx 리스크] 대규모 실리콘 음극재 생산 능력 증설을 위한 지속적인 설비 투자가 수반되면서 차입 부채 증가 및 일시적 영업 현금 흐름 둔화 부담이 발생하고 있습니다. 투자 자금 대비 전기차 수요 캐즘(일시적 수요 둔화) 장기화 시 고정비 부담이 가중될 수 있어 철저한 예산 관리가 필요합니다.`
        },
        {
          title: '3. 성장 동력 및 가치 분석',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[성장 동력] 글로벌 메이저 완성차 기업들의 실리콘 음극재 적용 확대 모델 출시가 주당순이익(EPS) 및 밸류에이션 리레이팅의 핵심 엔진입니다. 차세대 제품 라인업 다변화를 통한 장기 성장이 기대됩니다.`
        }
      ]
    }
    if (stockId === 'US_AAPL') {
      return [
        {
          title: '1. 업종 및 시장 환경',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[시장 트렌드] 글로벌 프리미엄 스마트폰 수요 정체 속에서 기기 자체에서 AI 기능을 구동하는 온디바이스 AI(애플 인텔리전스)로의 패러다임 전환이 교체 수요를 자극하고 있습니다.`
        },
        {
          title: '2. 재무 건전성 및 리스크',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[재무분석] 애플은 연간 수천억 달러에 달하는 압도적 현금 창출력과 적극적 자사주 매입으로 강력한 재무 안정성을 보여주고 있습니다. 다만, 미국 및 유럽연합(EU)의 독점 규제 소송 및 앱스토어 수수료 구조 강제 개편 리스크가 최대 재무 위협 요인입니다.`
        },
        {
          title: '3. 성장 동력 및 가치 분석',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[성장엔진] 앱스토어, 서비스 구독 등 고마진 부문의 매출 비중 지속 증가와 신규 하드웨어 폼팩터(폴더블 아이폰 등) 도입이 장기 밸류에이션 성장을 견인할 전망입니다.`
        }
      ]
    }
    if (stockId === 'US_BA') {
      return [
        {
          title: '1. 업종 및 시장 환경',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[항공 산업] 글로벌 여객 수요 증가로 여객기 신규 인도 수요는 풍부하나, 공급망 차질과 제조 결함 이슈로 부품 조달 및 생산 적체가 전 세계적으로 장기화되고 있습니다.`
        },
        {
          title: '2. 재무 건전성 및 리스크',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[유동성 위기] 안전 결함 조사 및 737 MAX 조립 속도 둔화로 현금 소모가 심화되어 재무 등급 강등 위험과 부채 상환 부담이 지속되고 있습니다. 재무 구조 개선을 위한 추가 자본 조달 가능성이 잠재적 리스크입니다.`
        },
        {
          title: '3. 성장 동력 및 가치 분석',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[가치 분석] 인도량 정상화와 품질 관리 신뢰성 회복이 최우선 선결 조건이며, 인도 지연으로 누적된 백오더(주문 대기분)의 안정적인 인도가 개시될 때 가치가 정상화될 것입니다.`
        }
      ]
    }

    // Default Neutral Fallback
    return [
      {
        title: '1. 업종 및 시장 환경',
        publisher: 'AI 분석 엔진',
        pubDate: '실시간',
        link: 'https://aistudio.google.com',
        content: `[시장 동향] ${stockName}이 속한 업계 전반의 디지털 전환 및 수요 변동성에 대응하여 시장 경쟁력 강화를 꾀하고 있습니다. 거시경제 변화와 글로벌 공급망 리스크 관리가 해당 업계의 주요 당면 과제로 대두되고 있습니다.`
      },
      {
        title: '2. 재무 건전성 및 리스크',
        publisher: 'AI 분석 엔진',
        pubDate: '실시간',
        link: 'https://aistudio.google.com',
        content: `[리스크 분석] 거시경제의 금리 변동 우려 속에서 ${stockName}의 안정적인 현금 흐름 확보와 부채 비율 조절 등 재무 건전성 리스크 관리가 화두입니다. 자본 운용 효율성 강화를 위해 영업 현금 흐름 개선에 주력하고 있습니다.`
      },
      {
        title: '3. 성장 동력 및 가치 분석',
        publisher: 'AI 분석 엔진',
        pubDate: '실시간',
        link: 'https://aistudio.google.com',
        content: `[가치 평가] ${stockName}은 주력 사업의 경쟁 우위 유지 및 운영 효율성 개선을 통해 중장기 영업 마진 확보와 신성장 포트폴리오 다변화를 추진 중이며, 이는 기업의 장기 가치 상승에 긍정적인 요인입니다.`
      }
    ]
  } else if (language === 'VI') {
    if (stockId === 'VN_NVL') {
      return [
        {
          title: '1. Ngành & Môi trường thị trường',
          publisher: 'AI phân tích',
          pubDate: 'Thực tế',
          link: 'https://aistudio.google.com',
          content: `[Môi trường] Thị trường bất động sản Việt Nam vẫn trầm lắng dù Chính phủ có chính sách hạ lãi suất và tháo gỡ pháp lý. Tiến độ cấp phép dự án chậm và tâm lý e ngại của người mua đang ảnh hưởng trực tiếp đến doanh số bán hàng của Novaland.`
        },
        {
          title: '2. Sức khỏe tài chính & Rủi ro',
          publisher: 'AI phân tích',
          pubDate: 'Thực tế',
          link: 'https://aistudio.google.com',
          content: `[Tài chính] Novaland đối mặt với rủi ro thanh khoản lớn do dư nợ trái phiếu đến hạn cao. Mặc dù công ty đang tích cực đàm phán gia hạn nợ và tái cơ cấu tài sản, tình trạng thiếu hụt dòng tiền ngắn hạn vẫn là thách thức cực kỳ nghiêm trọng.`
        },
        {
          title: '3. Động lực tăng trưởng & Định giá',
          publisher: 'AI phân tích',
          pubDate: 'Thực tế',
          link: 'https://aistudio.google.com',
          content: `[Triển vọng] Việc tái khởi công các dự án trọng điểm như Aqua City, NovaWorld Phan Thiết là chìa khóa phục hồi doanh thu. Tiến độ tháo gỡ pháp lý từ các tổ chức ban ngành sẽ quyết định việc đánh giá lại giá trị cổ phiếu NVL.`
        }
      ]
    }
    if (stockId === 'KR_078600') {
      return [
        {
          title: '1. Ngành & Môi trường thị trường',
          publisher: 'AI phân tích',
          pubDate: 'Thực tế',
          link: 'https://aistudio.google.com',
          content: `[Thị trường] Xu hướng tăng hàm lượng Silicon trong cực âm pin xe điện đang mở rộng mạnh mẽ. Daejoo Electronic Materials giữ vị thế dẫn đầu trong chuỗi cung ứng vật liệu pin toàn cầu nhờ công nghệ sản xuất hàng loạt độc quyền.`
        },
        {
          title: '2. Sức khỏe tài chính & Rủi ro',
          publisher: 'AI phân tích',
          pubDate: 'Thực tế',
          link: 'https://aistudio.google.com',
          content: `[Rủi ro CapEx] Chi phí đầu tư lớn cho việc nâng công suất nhà máy dẫn đến tăng nợ vay tài chính ngắn hạn. Nếu giai đoạn chững lại của thị trường xe điện toàn cầu kéo dài, chi phí cố định tăng cao có thể ảnh hưởng biên lợi nhuận.`
        },
        {
          title: '3. Động lực tăng trưởng & Định giá',
          publisher: 'AI phân tích',
          pubDate: 'Thực tế',
          link: 'https://aistudio.google.com',
          content: `[Động lực] Việc các hãng xe điện lớn tích hợp cực âm Silicon vào các dòng xe thế hệ mới là động lực thúc đẩy tăng trưởng định giá cổ phiếu.`
        }
      ]
    }

    // Default Neutral Fallback
    return [
      {
        title: '1. Ngành & Môi trường thị trường',
        publisher: 'AI phân tích',
        pubDate: 'Thực tế',
        link: 'https://aistudio.google.com',
        content: `[Thị trường] Doanh nghiệp ${stockName} đang nỗ lực nâng cao năng lực cạnh tranh trước các biến động về nhu cầu và xu hướng chuyển đổi số. Việc quản trị rủi ro chuỗi cung ứng là ưu tiên hàng đầu của ngành.`
      },
      {
        title: '2. Sức khỏe tài chính & Rủi ro',
        publisher: 'AI phân tích',
        pubDate: 'Thực tế',
        link: 'https://aistudio.google.com',
        content: `[Rủi ro tài chính] Quản trị rủi ro thanh khoản, duy trì dòng tiền ổn định và kiểm soát tỷ lệ nợ vay là những yếu tố then chốt đối với ${stockName} trong bối cảnh vĩ mô còn nhiều biến động về lãi suất.`
      },
      {
        title: '3. Động lực tăng trưởng & Định giá',
        publisher: 'AI phân tích',
        pubDate: 'Thực tế',
        link: 'https://aistudio.google.com',
        content: `[Triển vọng] Việc cải thiện hiệu quả vận hành và mở rộng danh mục kinh doanh cốt lõi của ${stockName} sẽ giúp củng cố biên lợi nhuận trung hạn, tạo tiền đề nâng cao định giá cổ phiếu.`
      }
    ]
  } else {
    if (stockId === 'VN_NVL') {
      return [
        {
          title: '1. Sector & Market Environment',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Market Outlook] The Vietnamese real estate sector remains sluggish despite government interest rate cuts and supportive policies. Delayed project approvals and slow market absorption rates directly pressure Novaland's presales performance.`
        },
        {
          title: '2. Financial Health & Debt Risks',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Debt Analysis] Novaland faces severe liquidity risks due to high corporate debt maturities. While management is actively restructuring debt and extending bond maturities, short-term cash flow constraints remain a critical threat.`
        },
        {
          title: '3. Growth Drivers & Valuation',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Valuation] Resuming construction at flagship projects like Aqua City and NovaWorld Phan Thiet is essential for revenue recovery. Resolution of legal bottlenecks under government support will be the primary driver for NVL's valuation recovery.`
        }
      ]
    }
    if (stockId === 'KR_078600') {
      return [
        {
          title: '1. Sector & Market Environment',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Sector Outlook] The adoption of silicon anode materials is expanding rapidly in the EV battery sector to enhance energy density. Daejoo Electronic Materials leads the industry with its proprietary mass production technology.`
        },
        {
          title: '2. Financial Health & Debt Risks',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[CapEx Risks] Continuous capital expenditures for factory expansion have led to increased debt and temporary cash flow pressure. Prolonged EV market slowdowns could raise fixed-cost burdens, requiring strict budget management.`
        },
        {
          title: '3. Growth Drivers & Valuation',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Valuation] The rollout of new EV models utilizing silicon anodes by major global OEMs serves as the primary catalyst for EPS and valuation multiple rerating.`
        }
      ]
    }
    if (stockId === 'US_AAPL') {
      return [
        {
          title: '1. Sector & Market Environment',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Market Environment] While premium smartphone demand remains mature, the transition to on-device AI (Apple Intelligence) is serving as a major catalyst for device upgrade cycles.`
        },
        {
          title: '2. Financial Health & Debt Risks',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Financial Health] Apple generates dominant free cash flows, supporting massive buybacks and dividends. However, regulatory antitrust lawsuits in the US and EU regarding App Store policies present the main risk.`
        },
        {
          title: '3. Growth Drivers & Valuation',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Valuation] The growing share of high-margin services revenue and potential smart form-factor innovations (such as foldable iPhones) support long-term valuation premiums.`
        }
      ]
    }
    if (stockId === 'US_BA') {
      return [
        {
          title: '1. Sector & Market Environment',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Industry Trend] While global passenger travel demand drives strong aircraft backlogs, supply chain bottlenecks and manufacturing quality issues constrain Boeing's production capacity.`
        },
        {
          title: '2. Financial Health & Debt Risks',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Liquidity Risk] Delivery delays and regulatory audits have increased cash burn, threatening credit ratings and raising debt burdens. Potential equity dilution for debt repayment remains a key concern.`
        },
        {
          title: '3. Growth Drivers & Valuation',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Valuation] Restoring quality control credibility and normalizing delivery rates are crucial for Boeing. Valuation recovery depends on successfully clearing massive delivery backlogs.`
        }
      ]
    }

    // Default Neutral Fallback
    return [
      {
        title: '1. Sector & Market Environment',
        publisher: 'AI Analyst',
        pubDate: 'Real-time',
        link: 'https://aistudio.google.com',
        content: `[Market Trends] ${stockName} is enhancing its market competitiveness in response to digital transformation and demand shifts. Supply chain management remains a key focal point for the industry.`
      },
      {
        title: '2. Financial Health & Debt Risks',
        publisher: 'AI Analyst',
        pubDate: 'Real-time',
        link: 'https://aistudio.google.com',
        content: `[Risk Assessment] Managing financial health, maintaining stable free cash flows, and controlling debt ratios are central tasks for ${stockName} under macroeconomic fluctuations.`
      },
      {
        title: '3. Growth Drivers & Valuation',
        publisher: 'AI Analyst',
        pubDate: 'Real-time',
        link: 'https://aistudio.google.com',
        content: `[Valuation] Focus on improving operational efficiency and diversifying growth portfolios will support ${stockName}'s mid-term margin stability and drive long-term corporate value compounding.`
      }
    ]
  }
}

function CustomRevenueEpsChart({ stock, currentEps, language, t }: { stock: any; currentEps: number; language: string; t: any }) {
  let quarters = ['25.Q3', '25.Q4', '26.Q1', '26.Q2']
  let epsData = [
    Number((currentEps * 0.28).toFixed(2)),
    Number((currentEps * 0.22).toFixed(2)),
    Number((currentEps * 0.24).toFixed(2)),
    Number((currentEps * 0.26).toFixed(2))
  ]
  
  const shares = getSharesOutstanding(stock.ticker, stock.country)
  const npm = getNetProfitMargin(stock.industry)
  const quarterlyRevenues = epsData.map(qEps => (qEps * shares) / npm)
  
  const estimatedMarketCap = stock.currentPrice * shares
  const { label: unitLabel, divisor } = getRevenueUnitAndScale(stock.country, estimatedMarketCap)
  
  let revenueData = quarterlyRevenues.map(rev => Math.round(rev / divisor))

  if (stock.quarterlyData && stock.quarterlyData.length >= 3) {
    quarters = stock.quarterlyData.map((q: any) => q.quarter)
    epsData = stock.quarterlyData.map((q: any) => q.eps)
    revenueData = stock.quarterlyData.map((q: any) => Math.round(q.revenue / divisor))
  }
  
  const maxRevenue = Math.max(...revenueData) * 1.15
  const maxEps = Math.max(...epsData) * 1.15

  // SVG dimensions
  const width = 360
  const height = 140
  const padding = { top: 20, right: 35, bottom: 20, left: 35 }

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  return (
    <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-300">{t('quarterlyRevenueEps')}</span>
        <div className="flex gap-3 text-[9px] font-bold">
          <span className="text-indigo-400 flex items-center gap-1">
            <span className="inline-block w-2.5 h-1.5 bg-indigo-500 rounded" />
            {language === 'KO' ? '매출' : language === 'VI' ? 'Doanh thu' : 'Revenue'} ({unitLabel})
          </span>
          <span className="text-teal-400 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full border border-teal-400 bg-slate-950" />
            EPS
          </span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
            const y = padding.top + chartHeight * r
            return (
              <line
                key={i}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="2"
              />
            )
          })}

          {/* Bar Charts (Revenue) */}
          {revenueData.map((val, idx) => {
            const barWidth = 24
            const x = padding.left + (chartWidth / 4) * idx + (chartWidth / 8) - barWidth / 2
            const barHeight = maxRevenue === 0 ? 0 : (val / maxRevenue) * chartHeight
            const y = padding.top + chartHeight - barHeight

            return (
              <g key={idx} className="group/bar">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={`url(#revGrad_${idx})`}
                  rx="3"
                  className="transition-all duration-300 hover:opacity-80"
                />
                <defs>
                  <linearGradient id={`revGrad_${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                {/* Value tooltip */}
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  fill="#94a3b8"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="opacity-0 group-hover/bar:opacity-100 transition-opacity"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            )
          })}

          {/* Line Chart (EPS) */}
          {(() => {
            const points = epsData.map((val, idx) => {
              const x = padding.left + (chartWidth / 4) * idx + (chartWidth / 8)
              const y = padding.top + chartHeight - (maxEps === 0 ? 0 : (val / maxEps) * chartHeight)
              return { x, y, val }
            })

            const d = points.reduce((path, p, i) => {
              return path + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
            }, '')

            return (
              <g>
                {/* Line Path */}
                <path
                  d={d}
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Dots */}
                {points.map((p, idx) => (
                  <g key={idx} className="group/dot">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#0f172a"
                      stroke="#2dd4bf"
                      strokeWidth="2"
                      className="cursor-pointer"
                    />
                    {/* Tooltip value */}
                    <text
                      x={p.x}
                      y={p.y - 8}
                      fill="#2dd4bf"
                      fontSize="8"
                      fontWeight="black"
                      textAnchor="middle"
                      className="opacity-0 group-hover/dot:opacity-100 transition-opacity"
                    >
                      {p.val.toLocaleString()}
                    </text>
                  </g>
                ))}
              </g>
            )
          })()}

          {/* X Axis Labels */}
          {quarters.map((q, idx) => {
            const x = padding.left + (chartWidth / 4) * idx + (chartWidth / 8)
            return (
              <text
                key={idx}
                x={x}
                y={height - 4}
                fill="#64748b"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
              >
                {q}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function CustomBpsChart({ stock, currentPrice, t }: { stock: any; currentPrice: number; t: any }) {
  let quarters = ['25.Q3', '25.Q4', '26.Q1', '26.Q2']
  const pb = getPbMultiple(stock.industry)
  const baseBps = currentPrice / pb
  let bpsData = [
    Math.round(baseBps * 0.94),
    Math.round(baseBps * 0.96),
    Math.round(baseBps * 0.98),
    Math.round(baseBps * 1.0)
  ]

  if (stock.quarterlyData && stock.quarterlyData.length >= 3) {
    quarters = stock.quarterlyData.map((q: any) => q.quarter)
    bpsData = stock.quarterlyData.map((q: any) => Math.round(q.bps))
  }

  const maxBps = Math.max(...bpsData) * 1.1
  const minBps = Math.min(...bpsData) * 0.9

  // SVG dimensions
  const width = 360
  const height = 140
  const padding = { top: 20, right: 25, bottom: 20, left: 25 }

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  return (
    <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-300">{t('quarterlyBps')}</span>
        <span className="text-emerald-400 text-[10px] font-bold font-mono">
          BPS: {bpsData[bpsData.length - 1].toLocaleString()} {stock.currency}
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
            const y = padding.top + chartHeight * r
            return (
              <line
                key={i}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="2"
              />
            )
          })}

          {/* Area & Line Chart */}
          {(() => {
            const points = bpsData.map((val, idx) => {
              const x = padding.left + (chartWidth / (bpsData.length - 1)) * idx
              const diff = maxBps - minBps
              const ratio = diff === 0 ? 0 : (val - minBps) / diff
              const y = padding.top + chartHeight - ratio * chartHeight
              return { x, y, val }
            })

            const lineD = points.reduce((path, p, i) => {
              return path + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
            }, '')

            const areaD = lineD + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`

            return (
              <g>
                {/* Area Gradient Path */}
                <path d={areaD} fill="url(#areaGrad)" />
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Line Path */}
                <path
                  d={lineD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Dots & Tooltips */}
                {points.map((p, idx) => (
                  <g key={idx} className="group/bpsdot">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4.5"
                      fill="#0f172a"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      className="cursor-pointer"
                    />
                    <text
                      x={p.x}
                      y={p.y - 8}
                      fill="#10b981"
                      fontSize="8"
                      fontWeight="black"
                      textAnchor="middle"
                      className="opacity-0 group-hover/bpsdot:opacity-100 transition-opacity"
                    >
                      {p.val.toLocaleString()}
                    </text>
                  </g>
                ))}
              </g>
            )
          })()}

          {/* X Axis Labels */}
          {quarters.map((q, idx) => {
            const x = padding.left + (chartWidth / (quarters.length - 1)) * idx
            return (
              <text
                key={idx}
                x={x}
                y={height - 4}
                fill="#64748b"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
              >
                {q}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function ConsensusCompareChart({ stock, currentPrice, fairPrice, language, t }: { stock: any; currentPrice: number; fairPrice: number; language: string; t: any }) {
  const consensusTarget = stock.consensusTarget ? Math.round(stock.consensusTarget) : Math.round(fairPrice * 1.15)
  const currency = stock.currency

  const minVal = Math.min(currentPrice, fairPrice, consensusTarget) * 0.9
  const maxVal = Math.max(currentPrice, fairPrice, consensusTarget) * 1.1
  const range = maxVal - minVal

  const getPercent = (val: number) => {
    return range === 0 ? 0 : ((val - minVal) / range) * 100
  }

  const cpPct = getPercent(currentPrice)
  const fpPct = getPercent(fairPrice)
  const ctPct = getPercent(consensusTarget)

  const isUpside = fairPrice > currentPrice
  const upsidePct = Math.abs(((fairPrice - currentPrice) / currentPrice) * 100).toFixed(1)

  return (
    <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-5">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-300">{t('consensusVsFair')}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isUpside 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
        }`}>
          {isUpside 
            ? `+${upsidePct}% ${language === 'KO' ? '적정가 괴리율' : 'Upside'}` 
            : `-${upsidePct}% ${language === 'KO' ? '적정가 괴리율' : 'Downside'}`}
        </span>
      </div>

      <div className="space-y-6 py-2">
        <div className="relative h-2 bg-slate-900 rounded-full border border-slate-850">
          {/* Current Price Marker */}
          <div 
            className="absolute -top-1.5 w-5 h-5 rounded-full bg-slate-100 border-4 border-slate-950 shadow-md flex items-center justify-center -translate-x-1/2 z-10 transition-all duration-500"
            style={{ left: `${cpPct}%` }}
            title={`${t('currentPrice')}: ${currentPrice.toLocaleString()}`}
          >
            <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
          </div>
          
          {/* Fair Price Marker */}
          <div 
            className="absolute -top-1.5 w-5 h-5 rounded-full bg-blue-500 border-4 border-slate-950 shadow-md flex items-center justify-center -translate-x-1/2 z-10 transition-all duration-500"
            style={{ left: `${fpPct}%` }}
            title={`${t('fairPrice')}: ${fairPrice.toLocaleString()}`}
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          </div>

          {/* Consensus Target Marker */}
          <div 
            className="absolute -top-1.5 w-5 h-5 rounded-full bg-amber-500 border-4 border-slate-950 shadow-md flex items-center justify-center -translate-x-1/2 z-10 transition-all duration-500"
            style={{ left: `${ctPct}%` }}
            title={`${t('analystTarget')}: ${consensusTarget.toLocaleString()}`}
          >
            <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
          <div className="text-left space-y-0.5">
            <span className="block text-slate-500 font-bold uppercase tracking-wider">{t('currentPrice')}</span>
            <span className="block font-semibold text-slate-300 font-mono">{currency} {currentPrice.toLocaleString()}</span>
          </div>
          <div className="text-center space-y-0.5">
            <span className="block text-blue-400 font-bold uppercase tracking-wider">{t('fairPrice')}</span>
            <span className="block font-black text-blue-400 font-mono">{currency} {Math.round(fairPrice).toLocaleString()}</span>
          </div>
          <div className="text-right space-y-0.5">
            <span className="block text-amber-400 font-bold uppercase tracking-wider">{t('analystTarget')}</span>
            <span className="block font-semibold text-amber-400 font-mono">{currency} {consensusTarget.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Helpers & Custom SVG Charting Components with realistic scaling
 */

const getSharesOutstanding = (ticker: string, country: string) => {
  if (country === 'US') {
    if (['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMZN', 'META'].includes(ticker)) {
      return 6_000_000_000
    }
    return 1_500_000_000
  }
  if (country === 'KR') {
    switch (ticker) {
      case '005930': return 5_970_000_000 // Samsung
      case '000660': return 728_000_000   // SK Hynix
      case '005380': return 213_000_000   // Hyundai
      case '000270': return 400_000_000   // Kia
      case '035420': return 160_000_000   // NAVER
      case '035720': return 440_000_000   // Kakao
      case '068270': return 217_000_000   // Celltrion
      case '105560': return 400_000_000   // KB Financial
      case '055550': return 510_000_000   // Shinhan Financial
      default: return 20_000_000
    }
  }
  if (country === 'VN') {
    return 1_500_000_000
  }
  if (country === 'CN') {
    return 4_000_000_000
  }
  return 100_000_000
}

const getNetProfitMargin = (industry: string) => {
  const ind = industry.toLowerCase()
  if (ind.includes('금융') || ind.includes('은행') || ind.includes('bank') || ind.includes('finance')) {
    return 0.15
  }
  if (ind.includes('양방향') || ind.includes('미디어') || ind.includes('소프트웨어') || ind.includes('software') || ind.includes('game') || ind.includes('게임')) {
    return 0.20
  }
  if (ind.includes('반도체') || ind.includes('semiconductor') || ind.includes('it')) {
    return 0.12
  }
  return 0.08
}

const getPbMultiple = (industry: string) => {
  const ind = industry.toLowerCase()
  if (ind.includes('금융') || ind.includes('은행') || ind.includes('bank') || ind.includes('finance')) {
    return 0.8
  }
  if (ind.includes('양방향') || ind.includes('미디어') || ind.includes('소프트웨어') || ind.includes('software') || ind.includes('game') || ind.includes('게임') || ind.includes('반도체') || ind.includes('semiconductor')) {
    return 3.0
  }
  return 1.8
}

const getRevenueUnitAndScale = (country: string, estimatedMarketCap: number) => {
  switch (country) {
    case 'KR':
      if (estimatedMarketCap >= 5_000_000_000_000) {
        return { label: '조원', divisor: 1_000_000_000_000, format: (v: number) => v.toFixed(1) }
      } else {
        return { label: '억원', divisor: 100_000_000, format: (v: number) => Math.round(v).toLocaleString() }
      }
    case 'US':
      return { label: 'Billion $', divisor: 1_000_000_000, format: (v: number) => v.toFixed(1) }
    case 'VN':
      return { label: 'Tỷ ₫', divisor: 1_000_000_000, format: (v: number) => Math.round(v).toLocaleString() }
    case 'CN':
      return { label: '억 元', divisor: 100_000_000, format: (v: number) => v.toFixed(1) }
    default:
      return { label: 'Billion', divisor: 1_000_000_000, format: (v: number) => v.toFixed(1) }
  }
}
