import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Star } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function BottomNav() {
  const location = useLocation()
  const { t } = useLanguage()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-6 py-2 flex justify-around items-center pb-safe-bottom">
      <Link
        to="/"
        className={`flex flex-col items-center gap-1 text-xs transition-colors ${
          isActive('/') ? 'text-blue-400 font-semibold' : 'text-slate-500'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>{t('dashboard')}</span>
      </Link>
      <Link
        to="/watchlist"
        className={`flex flex-col items-center gap-1 text-xs transition-colors ${
          isActive('/watchlist') ? 'text-blue-400 font-semibold' : 'text-slate-500'
        }`}
      >
        <Star className="w-5 h-5" />
        <span>{t('watchlist')}</span>
      </Link>
    </nav>
  )
}
