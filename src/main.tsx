import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext'
import { LivePriceProvider } from './context/LivePriceContext'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <LivePriceProvider>
          <App />
        </LivePriceProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
