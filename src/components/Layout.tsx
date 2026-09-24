import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import Footer from './Footer'
import NetworkStatusBanner from './NetworkStatusBanner'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header Navigation */}
      <Navbar />

      {/* Offline/Online Status Notice */}
      <NetworkStatusBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Legal Footer */}
      <Footer />

      {/* Mobile Navigation */}
      <BottomNav />
    </div>
  )
}

