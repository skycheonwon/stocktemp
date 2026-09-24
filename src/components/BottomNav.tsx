import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Star } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useState } from 'react'
import TemperatureGuideModal from './TemperatureGuideModal'
import StockTempLogo from './StockTempLogo'

export default function BottomNav() {
  const location = useLocation()
  const { t, language } = useLanguage()
  const [guideOpen, setGuideOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const guideLabel = {
    KO: '온도 가이드',
    EN: 'Guide',
    VI: 'Hướng dẫn'
  }[language as 'KO' | 'EN' | 'VI'] || 'Guide'

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-lg px-6 pt-2.5 pb-[max(env(safe-area-inset-bottom),0.75rem)] flex justify-around items-center shadow-2xl">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-all active:scale-95 ${
            isActive('/') ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${isActive('/') ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span>{t('dashboard')}</span>
        </Link>

        <button
          onClick={() => setGuideOpen(true)}
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-all active:scale-95"
        >
          <div className="p-0.5 rounded-xl">
            <StockTempLogo size="xs" className="w-6 h-6 rounded-lg p-1" />
          </div>
          <span>{guideLabel}</span>
        </button>


        <Link
          to="/watchlist"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-all active:scale-95 ${
            isActive('/watchlist') ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${isActive('/watchlist') ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : ''}`}>
            <Star className="w-5 h-5" />
          </div>
          <span>{t('watchlist')}</span>
        </Link>
      </nav>

      <TemperatureGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}

