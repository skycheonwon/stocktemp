import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

export default function AndroidBackButtonHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const lastBackPressRef = useRef<number>(0)
  const [showExitToast, setShowExitToast] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const backListener = CapApp.addListener('backButton', () => {
      // If we are not on the root dashboard page, navigate back within the app
      if (location.pathname !== '/') {
        navigate(-1)
      } else {
        const now = Date.now()
        // If pressed twice within 2 seconds, exit app
        if (now - lastBackPressRef.current < 2000) {
          CapApp.exitApp()
        } else {
          lastBackPressRef.current = now
          setShowExitToast(true)
          setTimeout(() => setShowExitToast(false), 2000)
        }
      }
    })

    return () => {
      backListener.then((handle) => handle.remove())
    }
  }, [location.pathname, navigate])

  if (!showExitToast) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-slate-900/95 border border-slate-700/80 text-slate-200 text-xs font-medium rounded-full shadow-xl backdrop-blur-md pointer-events-none transition-all">
      뒤로가기 버튼을 한 번 더 누르면 앱이 종료됩니다.
    </div>
  )
}
