import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { MOCK_STOCKS, type Stock } from '../data/mockStocks'

interface LivePriceContextType {
  stocks: Stock[];
  prices: { [id: string]: number };
  eps: { [id: string]: number };
  loading: boolean;
  refreshPrices: () => Promise<void>;
}

const LivePriceContext = createContext<LivePriceContextType | undefined>(undefined)

export function LivePriceProvider({ children }: { children: ReactNode }) {
  // Initialize with local mock stocks metadata so UI is never empty on cold start
  const [stocks, setStocks] = useState<Stock[]>(() => MOCK_STOCKS)

  const [prices, setPrices] = useState<{ [id: string]: number }>(() => {
    const initial: { [id: string]: number } = {}
    MOCK_STOCKS.forEach((stock) => {
      initial[stock.id] = stock.currentPrice
    })
    return initial
  })

  const [eps, setEps] = useState<{ [id: string]: number }>(() => {
    const initial: { [id: string]: number } = {}
    MOCK_STOCKS.forEach((stock) => {
      initial[stock.id] = stock.eps
    })
    return initial
  })

  const [loading, setLoading] = useState(true)

  // Fetch and sync live stocks, prices, and EPS from Cloud Firestore in real-time
  useEffect(() => {
    setLoading(true)
    const unsubscribe = onSnapshot(
      collection(db, 'stocks'),
      (snapshot) => {
        const loadedStocks: Stock[] = []
        const updatedPrices: { [id: string]: number } = {}
        const updatedEps: { [id: string]: number } = {}
        
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<Stock, 'id'>
          loadedStocks.push({
            id: doc.id,
            ...data
          })
          
          if (data.currentPrice !== undefined) {
            updatedPrices[doc.id] = Number(data.currentPrice)
          }
          if (data.eps !== undefined) {
            updatedEps[doc.id] = Number(data.eps)
          }
        })
        
        // Sort stocks alphabetically by default
        loadedStocks.sort((a, b) => a.name.localeCompare(b.name))
        
        if (loadedStocks.length > 0) {
          setStocks(loadedStocks)
        }
        setPrices((prev) => ({ ...prev, ...updatedPrices }))
        setEps((prev) => ({ ...prev, ...updatedEps }))
        setLoading(false)
      },
      (error) => {
        console.error('Error listening to Firestore stocks:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const refreshPrices = async () => {
    console.log('Real-time syncing is handled automatically via Firestore.')
  }

  return (
    <LivePriceContext.Provider value={{ stocks, prices, eps, loading, refreshPrices }}>
      {children}
    </LivePriceContext.Provider>
  )
}

export function useLivePrices() {
  const context = useContext(LivePriceContext)
  if (context === undefined) {
    throw new Error('useLivePrices must be used within a LivePriceProvider')
  }
  return context
}
