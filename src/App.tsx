import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import StockDetail from './pages/StockDetail'
import Watchlist from './pages/Watchlist'
import ScrollToTop from './components/ScrollToTop'
import AndroidBackButtonHandler from './components/AndroidBackButtonHandler'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AndroidBackButtonHandler />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="stock/:id" element={<StockDetail />} />
          <Route path="watchlist" element={<Watchlist />} />
          {/* Fallback route */}
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

