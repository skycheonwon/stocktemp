import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, Flame, Snowflake, Activity, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useLanguage } from '../context/LanguageContext'
import { useLivePrices } from '../context/LivePriceContext'
import { COUNTRY_NAMES } from '../data/mockStocks'
import { WeatherIcon } from '../components/WeatherIcon'
import type { TranslationKey } from '../data/translations'
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

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<'ALL' | 'KR' | 'US' | 'VN' | 'CN'>('ALL')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL')
  const { t, language } = useLanguage()
  const { stocks, prices, eps } = useLivePrices()
  const isFiltered = selectedCountry !== 'ALL' || selectedIndustry !== 'ALL'

  const scrollRef = useRef<HTMLDivElement>(null)

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

  // Dynamically compute unique industries present in the current country list
  const uniqueIndustries = useMemo(() => {
    const filteredByCountry = selectedCountry === 'ALL'
      ? stocks
      : stocks.filter(s => s.country === selectedCountry)
    const industries = filteredByCountry.map(s => s.industry).filter(Boolean)
    return ['ALL', ...Array.from(new Set(industries))].sort()
  }, [stocks, selectedCountry])

  // Reset selected industry if it doesn't exist in the current country's industry list
  useEffect(() => {
    if (selectedIndustry !== 'ALL' && !uniqueIndustries.includes(selectedIndustry)) {
      setSelectedIndustry('ALL')
    }
  }, [selectedCountry, uniqueIndustries, selectedIndustry])

  // Add Stock Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addTicker, setAddTicker] = useState('')
  const [addName, setAddName] = useState('')
  const [addKoreanName, setAddKoreanName] = useState('')
  const [addCountry, setAddCountry] = useState<'KR' | 'US' | 'VN' | 'CN'>('KR')
  const [addIndustry, setAddIndustry] = useState('')
  const [addTargetPe, setAddTargetPe] = useState<number>(15)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Prepare stocks with their calculated valuation metrics
  const stocksWithMetrics = useMemo(() => {
    return stocks.map((stock) => {
      const currentPrice = prices[stock.id] || stock.currentPrice
      const currentEps = eps[stock.id] || stock.eps
      const fairPrice = calculateFairPrice(currentEps, stock.defaultTargetPe)
      const temperature = calculateStockTemperature(currentPrice, fairPrice)
      const expectedReturn = calculateExpectedReturn(currentPrice / currentEps) // estimate P/E as price/eps
      const tempDetails = getTemperatureDetails(temperature)

      return {
        ...stock,
        currentPrice,
        fairPrice,
        temperature,
        expectedReturn,
        tempDetails,
      }
    })
  }, [stocks, prices, eps])

  // Filter based on search query, country selection, and industry selection
  const filteredStocks = useMemo(() => {
    return stocksWithMetrics.filter((stock) => {
      const matchesSearch =
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (stock.koreanName && stock.koreanName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        stock.ticker.includes(searchQuery)

      const matchesCountry = selectedCountry === 'ALL' || stock.country === selectedCountry
      const matchesIndustry = selectedIndustry === 'ALL' || stock.industry === selectedIndustry

      return matchesSearch && matchesCountry && matchesIndustry
    })
  }, [stocksWithMetrics, searchQuery, selectedCountry, selectedIndustry])

  // Split into Hottest (Overvalued) and Coldest (Undervalued) lists
  const hottestStocks = useMemo(() => {
    const list = [...filteredStocks]
      .filter((s) => s.temperature > 20)
      .sort((a, b) => b.temperature - a.temperature)
    return isFiltered ? list : list.slice(0, 10)
  }, [filteredStocks, isFiltered])

  const coldestStocks = useMemo(() => {
    const list = [...filteredStocks]
      .filter((s) => s.temperature < 20)
      .sort((a, b) => a.temperature - b.temperature)
    return isFiltered ? list : list.slice(0, 10)
  }, [filteredStocks, isFiltered])

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addTicker || !addName || !addCountry || !addIndustry) {
      setErrorMessage(language === 'KO' ? '필수 항목(*)을 모두 입력해 주세요.' : 'Please fill in all required (*) fields.')
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    const formattedTicker = addTicker.trim().toUpperCase()
    const docId = `${addCountry}_${formattedTicker}`

    // Check if stock already exists in our loaded list
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

    const newStockData = {
      ticker: formattedTicker,
      name: addName.trim(),
      koreanName: addKoreanName.trim() || addName.trim(),
      country: addCountry,
      industry: addIndustry.trim(),
      eps: 1, // Placeholder EPS
      currentPrice: 1, // Placeholder price
      currency,
      defaultTargetPe: Number(addTargetPe) || 15,
      tradingViewSymbol,
      naverTicker,
      lastUpdated: new Date().toISOString()
    }

    try {
      await setDoc(doc(db, 'stocks', docId), newStockData)
      
      // Reset form
      setAddTicker('')
      setAddName('')
      setAddKoreanName('')
      setAddCountry('KR')
      setAddIndustry('')
      setAddTargetPe(15)
      setIsAddModalOpen(false)
      
      alert(language === 'KO' ? '종목이 정상 등록되었습니다! 10분 내로 실시간 가격 정보가 수집되어 반영됩니다.' : 'Stock registered successfully! Real-time price will be synced in a few minutes.')
    } catch (err: any) {
      console.error('Error adding stock:', err)
      setErrorMessage(err.message || 'Failed to register stock.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Welcome banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/80 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-rose-500/10" />
        <div className="relative z-10 space-y-2 text-center md:text-left max-w-lg">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {t('heroTitle')}
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {t('heroDesc')}
          </p>
        </div>
        
        {/* Simple Market Summary Widgets - Horizontal Scroll Tape */}
        <div className="relative group/indices z-10 w-full md:max-w-[400px] lg:max-w-[480px] xl:max-w-[580px] flex items-center">
          {/* Scroll Left Button */}
          <button 
            type="button"
            onClick={() => {
              if (scrollRef.current) scrollRef.current.scrollBy({ left: -220, behavior: 'smooth' })
            }}
            className="absolute left-1 z-20 w-7 h-7 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center shadow-lg transition-all opacity-0 group-hover/indices:opacity-100 hover:scale-105 active:scale-95 backdrop-blur-sm cursor-pointer"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div 
            ref={scrollRef}
            className="w-full flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x snap-mandatory"
            style={{
              maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
            }}
          >
            {INDICES_CONFIG.map((indexItem) => {
              const tempDetails = getTemperatureDetails(indexItem.temp)
              let tempLabel = tempDetails.label
              if (language === 'EN') {
                if (indexItem.temp < 0) tempLabel = t('tempFreezingLabel')
                else if (indexItem.temp < 15) tempLabel = t('tempCoolLabel')
                else if (indexItem.temp <= 25) tempLabel = t('tempNormalLabel')
                else if (indexItem.temp <= 45) tempLabel = t('tempWarmLabel')
                else tempLabel = t('tempHotLabel')
              } else if (language === 'VI') {
                if (indexItem.temp < 0) tempLabel = t('tempFreezingLabel')
                else if (indexItem.temp < 15) tempLabel = t('tempCoolLabel')
                else if (indexItem.temp <= 25) tempLabel = t('tempNormalLabel')
                else if (indexItem.temp <= 45) tempLabel = t('tempWarmLabel')
                else tempLabel = t('tempHotLabel')
              }
              // Strip parenthesis for cleaner look on small cards (e.g. "혹한기 (극심한 저평가)" -> "혹한기")
              const cleanLabel = tempLabel.includes(' (') ? tempLabel.split(' (')[0] : tempLabel

              return (
                <div 
                  key={indexItem.translationKey}
                  className="flex-shrink-0 w-28 bg-slate-950/60 backdrop-blur border border-slate-800 rounded-2xl p-3 text-center snap-start transition-all duration-300 hover:border-slate-700 hover:bg-slate-950/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/[0.03] group cursor-default"
                >
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
                    {t(indexItem.translationKey)}
                  </span>
                  <span className={`block text-sm font-semibold mt-1 font-mono transition-colors group-hover:${tempDetails.colorClass}`}>
                    {indexItem.temp}°C
                  </span>
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    <WeatherIcon name={tempDetails.iconName} className="w-3.5 h-3.5" />
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${tempDetails.badgeColorClass}`}>
                      {cleanLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Scroll Right Button */}
          <button 
            type="button"
            onClick={() => {
              if (scrollRef.current) scrollRef.current.scrollBy({ left: 220, behavior: 'smooth' })
            }}
            className="absolute right-1 z-20 w-7 h-7 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center shadow-lg transition-all opacity-0 group-hover/indices:opacity-100 hover:scale-105 active:scale-95 backdrop-blur-sm cursor-pointer"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl pl-11 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
              />
            </div>
            <button
              onClick={() => {
                setAddTicker('')
                setIsAddModalOpen(true)
              }}
              className="px-4 py-3 bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-2xl transition-all shadow-md flex items-center gap-1.5 font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'KO' ? '종목 추가' : language === 'VI' ? 'Thêm cổ phiếu' : 'Add Stock'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Country buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900/60 border border-slate-800/50 p-1 rounded-2xl">
              {(['ALL', 'KR', 'US', 'VN', 'CN'] as const).map((country) => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCountry === country
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {country === 'ALL' ? t('all') : country === 'KR' ? t('korea') : country === 'US' ? t('usa') : country === 'VN' ? t('vietnam') : language === 'KO' ? '중국 🇨🇳' : language === 'VI' ? 'Trung Quốc 🇨🇳' : 'China 🇨🇳'}
                </button>
              ))}
            </div>

            {/* Industry select dropdown */}
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="bg-slate-900 border border-slate-800/80 rounded-2xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 hover:border-slate-700/80 transition-all font-semibold cursor-pointer max-w-[220px]"
            >
              <option value="ALL">
                {language === 'KO' ? '모든 업종' : language === 'VI' ? 'Tất cả ngành' : 'All Industries'}
              </option>
              {uniqueIndustries.filter(ind => ind !== 'ALL').map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Search Results Grid */}
        {searchQuery && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> {t('searchResults')} ({filteredStocks.length})
            </h3>
            {filteredStocks.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="text-slate-500 text-sm">
                  {language === 'KO' ? '검색된 종목이 없습니다.' : 'No matching stocks found.'}
                </div>
                <button
                  onClick={() => {
                    setAddTicker(searchQuery)
                    setIsAddModalOpen(true)
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                >
                  {language === 'KO' ? `'${searchQuery}' 종목 직접 등록하기` : `Register '${searchQuery}' manually`}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStocks.map((stock) => (
                  <StockCard key={stock.id} stock={stock} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Lists Section */}
      {!searchQuery && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coldest Stocks (Undervalued) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Snowflake className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                {t('coldestStocks')}
              </h3>
              <span className="text-xs text-slate-500 font-medium">{t('tempUnder20')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coldestStocks.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-slate-900">
                  {t('emptyColdList')}
                </div>
              ) : (
                coldestStocks.map((stock, index) => <StockCard key={stock.id} stock={stock} rank={isFiltered ? undefined : index + 1} />)
              )}
            </div>
          </div>

          {/* Hottest Stocks (Overvalued) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <Flame className="w-5 h-5" />
                </div>
                {t('hottestStocks')}
              </h3>
              <span className="text-xs text-slate-500 font-medium">{t('tempOver20')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hottestStocks.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 text-sm bg-slate-900/20 rounded-2xl border border-slate-900">
                  {t('emptyHotList')}
                </div>
              ) : (
                hottestStocks.map((stock, index) => <StockCard key={stock.id} stock={stock} rank={isFiltered ? undefined : index + 1} />)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                {language === 'KO' ? '새 주식 종목 등록' : language === 'VI' ? 'Thêm cổ phiếu mới' : 'Add New Stock'}
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStock} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    {language === 'KO' ? '국가 *' : language === 'VI' ? 'Quốc gia *' : 'Country *'}
                  </label>
                  <select
                    value={addCountry}
                    onChange={(e) => setAddCountry(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="KR">South Korea 🇰🇷</option>
                    <option value="US">United States 🇺🇸</option>
                    <option value="VN">Vietnam 🇻🇳</option>
                    <option value="CN">China 🇨🇳</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    {language === 'KO' ? '티커/코드 *' : language === 'VI' ? 'Mã cổ phiếu *' : 'Ticker *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AAPL, 005930"
                    value={addTicker}
                    onChange={(e) => setAddTicker(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {language === 'KO' ? '회사 영문명 *' : language === 'VI' ? 'Tên tiếng Anh *' : 'English Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple Inc."
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {language === 'KO' ? '회사 한글명 (선택)' : language === 'VI' ? 'Tên tiếng Hàn (Tùy chọn)' : 'Korean Name (Opt)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 애플"
                  value={addKoreanName}
                  onChange={(e) => setAddKoreanName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    {language === 'KO' ? '업종 *' : language === 'VI' ? 'Lĩnh vực *' : 'Industry *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT, Semiconductors"
                    value={addIndustry}
                    onChange={(e) => setAddIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    {language === 'KO' ? '목표 P/E 배수' : language === 'VI' ? 'Chỉ số P/E mục tiêu' : 'Target P/E'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={addTargetPe}
                    onChange={(e) => setAddTargetPe(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all"
                >
                  {language === 'KO' ? '취소' : language === 'VI' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
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

function StockCard({ stock, rank }: { stock: any; rank?: number }) {
  const { t, language } = useLanguage()

  // Translate temperature label
  let tempLabel = stock.tempDetails.label
  if (language === 'EN') {
    if (stock.temperature < 0) tempLabel = t('tempFreezingLabel')
    else if (stock.temperature < 15) tempLabel = t('tempCoolLabel')
    else if (stock.temperature <= 25) tempLabel = t('tempNormalLabel')
    else if (stock.temperature <= 45) tempLabel = t('tempWarmLabel')
    else tempLabel = t('tempHotLabel')
  } else if (language === 'VI') {
    if (stock.temperature < 0) tempLabel = t('tempFreezingLabel')
    else if (stock.temperature < 15) tempLabel = t('tempCoolLabel')
    else if (stock.temperature <= 25) tempLabel = t('tempNormalLabel')
    else if (stock.temperature <= 45) tempLabel = t('tempWarmLabel')
    else tempLabel = t('tempHotLabel')
  }

  const displayName = language === 'KO' ? (stock.koreanName || stock.name) : stock.name

  return (
    <Link
      to={`/stock/${stock.id}`}
      className="group block bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/[0.02] relative overflow-hidden"
    >
      {rank !== undefined && (
        <div className="absolute top-0 left-0 w-6 h-6 rounded-br-xl flex items-center justify-center text-[10px] font-black shadow-md border-r border-b bg-gradient-to-br from-amber-300 to-yellow-500 text-slate-950 border-yellow-600/30">
          {rank}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            {COUNTRY_NAMES[stock.country as 'KR' | 'US' | 'VN']} | {stock.industry}
          </span>
          <h4 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors mt-0.5">
            {displayName}
          </h4>
          <span className="text-xs font-mono text-slate-500 block mt-0.5">{stock.ticker}</span>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className={`text-xl font-black flex items-center justify-end gap-1.5 ${stock.tempDetails.colorClass}`}>
            <WeatherIcon name={stock.tempDetails.iconName} className="w-4 h-4" />
            <span>{stock.temperature}°C</span>
          </span>
          <span className={`block text-[10px] px-2 py-0.5 border rounded-full mt-1.5 font-bold ${stock.tempDetails.badgeColorClass}`}>
            {tempLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-slate-800/50 mt-4 pt-4 text-xs">
        <div>
          <span className="block text-slate-500">{t('currentPrice')}</span>
          <span className="font-semibold text-slate-200 mt-0.5 block font-mono">
            {stock.currency} {stock.currentPrice.toLocaleString()}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-slate-500">{t('fairPrice')}</span>
          <span className="font-black text-sm md:text-base text-blue-400 mt-0.5 block font-mono">
            {stock.currency} {Math.round(stock.fairPrice).toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  )
}

