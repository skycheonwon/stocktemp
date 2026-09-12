import { useLocation, Link } from 'react-router-dom'
import { Thermometer } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function Navbar() {
  const location = useLocation()
  const { language, t, changeLanguage } = useLanguage()
  
  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-rose-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Thermometer className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center">
            StockTemp <span className="hidden xs:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 ml-1.5 align-middle whitespace-nowrap">{t('stocktemp')}</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
            <Link
              to="/"
              className={`transition-all ${
                isActive('/') ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('dashboard')}
            </Link>
            <Link
              to="/watchlist"
              className={`transition-all ${
                isActive('/watchlist') ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('watchlist')}
            </Link>
          </nav>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-850 p-0.5 rounded-xl text-[10px] font-bold">
            {(['KO', 'EN', 'VI'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => changeLanguage(lang)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === lang
                    ? 'bg-slate-800 text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
