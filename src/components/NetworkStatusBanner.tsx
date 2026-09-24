import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [showRestored, setShowRestored] = useState<boolean>(false)
  const { language } = useLanguage()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowRestored(true)
      const timer = setTimeout(() => setShowRestored(false), 3000)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowRestored(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const offlineMsg = {
    KO: '인터넷 연결이 원활하지 않습니다. 오프라인 모드로 동작 중입니다.',
    EN: 'Internet connection lost. Operating in offline mode.',
    VI: 'Mất kết nối Internet. Đang hoạt động ở chế độ ngoại tuyến.'
  }[language as 'KO' | 'EN' | 'VI'] || 'Internet connection lost.'

  const onlineMsg = {
    KO: '인터넷 연결이 다시 복구되었습니다.',
    EN: 'Internet connection restored.',
    VI: 'Đã khôi phục kết nối Internet.'
  }[language as 'KO' | 'EN' | 'VI'] || 'Internet connection restored.'

  if (!isOnline) {
    return (
      <div className="w-full bg-amber-600/90 text-amber-50 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 backdrop-blur-md sticky top-14 z-40 shadow-sm animate-pulse">
        <WifiOff className="w-4 h-4" />
        <span>{offlineMsg}</span>
      </div>
    )
  }

  if (showRestored) {
    return (
      <div className="w-full bg-emerald-600/90 text-emerald-50 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 backdrop-blur-md sticky top-14 z-40 shadow-sm transition-opacity duration-300">
        <Wifi className="w-4 h-4" />
        <span>{onlineMsg}</span>
      </div>
    )
  }

  return null
}
