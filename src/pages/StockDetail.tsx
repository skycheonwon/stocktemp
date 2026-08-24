import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, TrendingUp, TrendingDown, RefreshCw, Activity } from 'lucide-react'
import { COUNTRY_NAMES } from '../data/mockStocks'
import { useLanguage } from '../context/LanguageContext'
import { useLivePrices } from '../context/LivePriceContext'
import {
  calculateFairPrice,
  calculateExpectedReturn,
} from '../utils/valuation'

export default function StockDetail() {
  const { id } = useParams<{ id: string }>()
  const { stocks, prices, eps, loading } = useLivePrices()
  const stock = stocks.find((s) => s.id === id)
  const { t, language } = useLanguage()

  // State
  const [targetPe, setTargetPe] = useState<number>(15)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const [livePriceFeed, setLivePriceFeed] = useState<boolean>(false)

  // Sync state when stock and live price loads
  useEffect(() => {
    if (stock) {
      setTargetPe((prev) => (prev === 15 ? stock.defaultTargetPe : prev))
      const livePrice = prices[stock.id] || stock.currentPrice
      setCurrentPrice((prev) => (prev === 0 ? livePrice : prev))
    }
  }, [stock, prices])

  // Also sync currentPrice dynamically if livePrice updates from Firestore
  const livePrice = stock ? (prices[stock.id] || stock.currentPrice) : 0
  useEffect(() => {
    if (stock) {
      setCurrentPrice(livePrice)
    }
  }, [livePrice, stock])

  // Watchlist LocalStorage sync
  useEffect(() => {
    if (!stock) return
    const saved = localStorage.getItem('stocktemp_watchlist')
    if (saved) {
      const watchlist = JSON.parse(saved) as string[]
      setIsSaved(watchlist.includes(stock.id))
    }
  }, [stock])

  // Simulate price changes for proto
  useEffect(() => {
    if (!livePriceFeed || !stock) return

    const interval = setInterval(() => {
      // Simulate small random fluctuations (+-0.2%)
      setCurrentPrice((prev) => {
        const changePercent = (Math.random() * 0.4 - 0.2) / 100
        const newPrice = prev * (1 + changePercent)
        return Number(newPrice.toFixed(stock.country === 'US' ? 2 : 0))
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [livePriceFeed, stock])

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

  const currentEps = eps[stock.id] || stock.eps

  // Recalculate metrics based on slider targetPe & currentPrice state
  const fairPrice = calculateFairPrice(currentEps, targetPe)
  const expectedReturn = calculateExpectedReturn(currentPrice / currentEps)

  const displayName = language === 'KO' ? (stock.koreanName || stock.name) : stock.name

  const mockNews = getMockNews(displayName, language)
  const baseRate = getBaseInterestRate(stock.country)

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
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('currentPrice')}</span>
          <span className="block text-xl font-black text-slate-200 mt-1.5 font-mono">
            {stock.currency} {currentPrice.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('fairPrice')}</span>
          <span className="block text-xl font-black text-blue-400 mt-1.5 font-mono">
            {stock.currency} {Math.round(fairPrice).toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('baseInterestRate')}</span>
          <span className="block text-xl font-black text-amber-500 mt-1.5 font-mono">
            {baseRate}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('expectedReturn')}</span>
          <span className={`block text-xl font-black mt-1.5 font-mono flex items-center gap-1.5 ${
            expectedReturn > 10 ? 'text-emerald-400' : 'text-slate-300'
          }`}>
            <TrendingUp className="w-5 h-5" />
            {expectedReturn}%
          </span>
        </div>
      </div>

      {/* Middle Layout: Interactive Valuation Slider & SVG Charts Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Valuation Controller (Lg: 4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('valuationCalc')}</h3>
              
              {/* Live Price Switch */}
              <button
                onClick={() => setLivePriceFeed(!livePriceFeed)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all ${
                  livePriceFeed
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${livePriceFeed ? 'animate-spin' : ''}`} />
                {t('livePriceFeed')} {livePriceFeed ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Target P/E Multiple Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">{t('targetPeSlider')}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-500 font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                    {language === 'KO' ? `AI 추천: ${stock.defaultTargetPe}배` : language === 'VI' ? `AI gợi ý: ${stock.defaultTargetPe}x` : `AI Rec: ${stock.defaultTargetPe}x`}
                  </span>
                  <span className="font-bold text-blue-400 text-sm font-mono">{targetPe} {t('times')}</span>
                </div>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="1"
                value={targetPe}
                onChange={(e) => setTargetPe(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>{t('conservative')}</span>
                <span>{t('fair')}</span>
                <span>{t('aggressive')}</span>
              </div>
            </div>

            {/* Additional stock properties (PE & EPS) */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-800/50 pt-4 text-xs">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="block text-slate-500 text-[10px] font-bold uppercase">{t('eps')}</span>
                <span className="font-bold text-slate-300 mt-1 block font-mono">
                  {stock.currency} {currentEps.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="block text-slate-500 text-[10px] font-bold uppercase">{t('pe')}</span>
                <span className="font-bold text-slate-300 mt-1 block font-mono">
                  {(currentPrice / currentEps).toFixed(2)} {t('times')}
                </span>
              </div>
            </div>

            {/* Price Simulator Controls */}
            <div className="space-y-3 border-t border-slate-800/50 pt-4">
              <span className="text-xs text-slate-400 font-medium block">{t('priceSimulator')}</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCurrentPrice((prev) => Math.max(1, prev * 0.95))}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-xs font-semibold text-cyan-400 transition-colors"
                >
                  <TrendingDown className="w-4 h-4" /> {t('currentPrice')} -5%
                </button>
                <button
                  onClick={() => setCurrentPrice((prev) => prev * 1.05)}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-xs font-semibold text-rose-400 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" /> {t('currentPrice')} +5%
                </button>
              </div>
            </div>

            {/* AI Analysis Details */}
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 text-[10px] text-slate-400 leading-relaxed space-y-1.5">
              <span className="font-bold text-indigo-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                {language === 'KO' ? 'AI 멀티플 분석 근거' : language === 'VI' ? 'Cơ sở phân tích AI' : 'AI Valuation Analysis'}
              </span>
              <p>
                {(() => {
                  const pe = stock.defaultTargetPe
                  if (language === 'KO') {
                    return `이 종목은 '${stock.industry}' 업종 특성, 이익 성장성(PEG), 국가별 기준 금리(${baseRate})를 종합 분석하여 AI가 적정 P/E를 ${pe}배로 자동 산정했습니다. 사용자는 분석 결과에 따라 즉시 적정 가치를 판단할 수 있으며, 필요 시 슬라이더로 조절 가능합니다.`
                  }
                  if (language === 'VI') {
                    return `Cổ phiếu này được AI tự động phân tích và đưa ra số nhân P/E hợp lý là ${pe}x dựa trên đặc thù ngành '${stock.industry}', tiềm năng tăng trưởng (PEG) và lãi suất cơ bản quốc gia (${baseRate}). Bạn có thể tùy chỉnh nếu cần.`
                  }
                  return `This stock's fair P/E was automatically determined as ${pe}x by AI after analyzing '${stock.industry}' industry properties, growth potential (PEG), and base interest rate (${baseRate}). You can adjust it anytime.`
                })()}
              </p>
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
        <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" /> {t('latestNews')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockNews.map((news, idx) => (
            <a 
              key={idx}
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex justify-between items-start text-[10px] text-slate-500 font-bold mb-2">
                <span>{news.publisher}</span>
                <span className="font-mono">{news.pubDate}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 leading-relaxed transition-colors line-clamp-2">
                {news.title}
              </h4>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}



/**
 * Helpers & Custom SVG Charting Components
 */

const getBaseInterestRate = (country: string) => {
  switch (country) {
    case 'KR': return '3.50%';
    case 'US': return '5.25%';
    case 'VN': return '4.50%';
    case 'CN': return '3.35%';
    default: return '3.50%';
  }
}

function getMockNews(stockName: string, language: string) {
  if (language === 'KO') {
    return [
      {
        title: `${stockName}, 하반기 실적 개선 기대감에 기관 매수세 유입`,
        publisher: '한국경제',
        pubDate: '2시간 전',
        link: 'https://www.hankyung.com'
      },
      {
        title: `금리 변동성에 따른 ${stockName} 가치 평가 및 투자 리스크 분석`,
        publisher: '매일경제',
        pubDate: '5시간 전',
        link: 'https://www.mk.co.kr'
      },
      {
        title: `${stockName}, 신규 사업 진출을 통한 중장기 성장 모멘텀 확보`,
        publisher: '연합뉴스',
        pubDate: '어제',
        link: 'https://www.yna.co.kr'
      }
    ]
  } else if (language === 'VI') {
    return [
      {
        title: `${stockName} kỳ vọng kết quả kinh doanh tăng trưởng mạnh nửa cuối năm`,
        publisher: 'Cafef',
        pubDate: '2 giờ trước',
        link: 'https://cafef.vn'
      },
      {
        title: `Phân tích định giá và rủi ro đầu tư của ${stockName} trước biến động lãi suất`,
        publisher: 'Vietstock',
        pubDate: '5 giờ trước',
        link: 'https://vietstock.vn'
      },
      {
        title: `${stockName} mở rộng hoạt động kinh doanh tạo động lực tăng trưởng dài hạn`,
        publisher: 'VnExpress',
        pubDate: 'Hôm qua',
        link: 'https://vnexpress.net'
      }
    ]
  } else {
    return [
      {
        title: `${stockName} shares surge on strong institutional buying interest`,
        publisher: 'MarketWatch',
        pubDate: '2 hours ago',
        link: 'https://www.marketwatch.com'
      },
      {
        title: `Valuation analysis: Assessing risks and upside for ${stockName}`,
        publisher: 'Bloomberg',
        pubDate: '5 hours ago',
        link: 'https://www.bloomberg.com'
      },
      {
        title: `${stockName} expands operations to secure long-term growth momentum`,
        publisher: 'Reuters',
        pubDate: 'Yesterday',
        link: 'https://www.reuters.com'
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
  const consensusTarget = Math.round(fairPrice * 1.15)
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
