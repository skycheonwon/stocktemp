import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext'
import { LivePriceProvider } from './context/LivePriceContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <LivePriceProvider>
        <App />
      </LivePriceProvider>
    </LanguageProvider>
  </StrictMode>,
)
