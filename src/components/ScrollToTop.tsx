import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // If returning to dashboard ('/') and we have a saved scroll position or viewed stock, do NOT force scroll to top
    if (pathname === '/') {
      const savedScrollY = sessionStorage.getItem('stocktemp_scroll_y')
      const lastViewedId = sessionStorage.getItem('stocktemp_last_viewed')
      if (savedScrollY && lastViewedId) {
        const scrollY = parseInt(savedScrollY, 10)
        if (!isNaN(scrollY) && scrollY > 0) {
          window.scrollTo({
            top: scrollY,
            left: 0,
            behavior: 'instant' as ScrollBehavior
          })
          return
        }
      }
      return
    }

    // For other pages (like /stock/:id), scroll to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior
    })
  }, [pathname])

  return null
}
