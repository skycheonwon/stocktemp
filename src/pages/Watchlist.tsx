import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, ArrowLeft, Trash2, TrendingUp } from 'lucide-react'
import { translateIndustry, getCountryName } from '../data/translations'
import { WeatherIcon } from '../components/WeatherIcon'
import { useLanguage } from '../context/LanguageContext'
import { useLivePrices } from '../context/LivePriceContext'
import SwipeableCard from '../components/SwipeableCard'
import {
  calculateFairPrice,
  calculateStockTemperature,
  getTemperatureDetails,
  calculateExpectedReturn,
} from '../utils/valuation'

export default function Watchlist() {
  const [watchlistIds, setWatchlistIds] = useState<string[]>([])
  const { t, language } = useLanguage()
  const { stocks, prices, eps } = useLivePrices()

  // Load watchlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('stocktemp_watchlist')
    if (saved) {
      setWatchlistIds(JSON.parse(saved) as string[])
    }
  }, [])

  const removeFromWatchlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault() // prevent navigating to detail page when clicking remove
    const updated = watchlistIds.filter((item) => item !== id)
    setWatchlistIds(updated)
    localStorage.setItem('stocktemp_watchlist', JSON.stringify(updated))
  }

  // Get matching stocks with metrics
  const savedStocks = stocks.filter((s) => watchlistIds.includes(s.id)).map((stock) => {
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <Link
          to="/"
          className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" /> {t('watchlistTitle')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('watchlistDesc')}</p>
        </div>
      </div>

      {/* Main Content */}
      {savedStocks.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/20 border border-slate-900 rounded-3xl space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500">
            <Star className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-300">{t('emptyWatchlist')}</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {t('emptyWatchlistDesc')}
            </p>
          </div>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
          >
            {t('goToSearch')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedStocks.map((stock) => {
            const displayName = language === 'KO' ? (stock.koreanName || stock.name) : stock.name
            
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

            return (
              <SwipeableCard
                key={stock.id}
                id={stock.id}
                onDismiss={() => {
                  const updated = watchlistIds.filter((item) => item !== stock.id)
                  setWatchlistIds(updated)
                  localStorage.setItem('stocktemp_watchlist', JSON.stringify(updated))
                }}
              >
                <Link
                  to={`/stock/${stock.id}`}
                  className="group block bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-3xl p-5 relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                        {getCountryName(stock.country, language)} | {translateIndustry(stock.industry, language)}
                      </span>
                      <h4 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors mt-0.5">
                        {displayName}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{stock.ticker}</span>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className={`text-xl font-black flex items-center justify-end gap-1.5 ${stock.tempDetails.colorClass}`}>
                        <WeatherIcon name={stock.tempDetails.iconName} className="w-4 h-4" />
                        <span>{stock.temperature}°C</span>
                      </span>
                      <span className={`block text-[9px] px-1.5 py-0.2 border rounded-full mt-1.5 font-bold ${stock.tempDetails.badgeColorClass}`}>
                        {tempLabel}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-800/50 mt-4 pt-4 text-xs">
                    <div>
                      <span className="block text-slate-500 text-[10px]">{t('currentPrice')}</span>
                      <span className="font-semibold text-slate-200 mt-0.5 block font-mono">
                        {stock.currency} {stock.currentPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-slate-500 text-[10px]">{t('fairPrice')}</span>
                      <span className="font-black text-sm md:text-base text-blue-400 mt-0.5 block font-mono">
                        {stock.currency} {Math.round(stock.fairPrice).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Hover Action Bar */}
                  <div className="flex items-center justify-between border-t border-slate-800/40 mt-4 pt-3 text-[10px]">
                    <span className="text-slate-500 flex items-center gap-1 font-mono">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      {t('expectedReturn')}: {stock.expectedReturn}%
                    </span>
                    <button
                      onClick={(e) => removeFromWatchlist(stock.id, e)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-rose-950/20 hover:border-rose-900/30 text-slate-500 hover:text-rose-450 transition-colors cursor-pointer"
                      title={t('removeWatchlist')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Link>
              </SwipeableCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
