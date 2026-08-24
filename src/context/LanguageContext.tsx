import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { TRANSLATIONS } from '../data/translations'
import type { Language, TranslationKey } from '../data/translations'

interface LanguageContextType {
  language: Language;
  t: (key: TranslationKey) => string;
  changeLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Try loading saved language from localStorage, default to 'KO'
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('stocktemp_language')
    if (saved === 'KO' || saved === 'EN' || saved === 'VI') {
      return saved
    }
    return 'KO'
  })

  // Save to localStorage when language changes
  useEffect(() => {
    localStorage.setItem('stocktemp_language', language)
  }, [language])

  // Translation helper
  const t = (key: TranslationKey): string => {
    const dict = TRANSLATIONS[language]
    if (dict && key in dict) {
      return dict[key]
    }
    // Fallback to KO if key not found
    return TRANSLATIONS.KO[key] || String(key)
  }

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
  }

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
