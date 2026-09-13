import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Star, Zap, ThumbsUp, ThumbsDown, MessageSquare, 
  Trash2, Calendar, User, LogIn, ChevronDown, ChevronUp, Sparkles, Send, Info,
  TrendingUp, TrendingDown 
} from 'lucide-react'
import { 
  doc, runTransaction, collection, query, where, onSnapshot, 
  serverTimestamp, addDoc, deleteDoc, updateDoc, increment 
} from 'firebase/firestore'
import { db } from '../firebase'
import { translateIndustry, getCountryName } from '../data/translations'
import { useLanguage } from '../context/LanguageContext'
import { useLivePrices } from '../context/LivePriceContext'
import { useAuth } from '../context/AuthContext'
import { generateAndSaveStockAnalysis } from '../utils/geminiAnalysis'
import {
  calculateFairPrice,
  calculateExpectedReturn,
  calculateStockTemperature,
} from '../utils/valuation'
import { WeatherIcon } from '../components/WeatherIcon'
import LoginInline from '../components/LoginInline'
import OpinionReplies from '../components/OpinionReplies'

export default function StockDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { stocks, prices, eps, loading } = useLivePrices()
  const stock = stocks.find((s) => s.id === id)
  const { t, language } = useLanguage()
  const { user } = useAuth()

  // State
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const [expandedNewsIndex, setExpandedNewsIndex] = useState<number | null>(null)
  const [dynamicAiReports, setDynamicAiReports] = useState<any>(null)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  
  // One-Click Voting States
  const [isDetailLoginOpen, setIsDetailLoginOpen] = useState(false)
  const [myVote, setMyVote] = useState<any>(null)
  const [votingLoading, setVotingLoading] = useState(false)

  // Free Discussion Community States
  const [discussions, setDiscussions] = useState<any[]>([])
  const [discussionContent, setDiscussionContent] = useState('')
  const [discussionSubmitting, setDiscussionSubmitting] = useState(false)

  // Scroll to top immediately when viewing a stock
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [id])

  // Track last viewed and recently viewed stocks
  useEffect(() => {
    if (!stock) return
    try {
      sessionStorage.setItem('stocktemp_last_viewed', stock.id)
      
      const savedRecents = localStorage.getItem('stocktemp_recent_stocks')
      let recents: any[] = savedRecents ? JSON.parse(savedRecents) : []
      recents = recents.filter(item => item.id !== stock.id)
      recents.unshift({
        id: stock.id,
        ticker: stock.ticker,
        name: stock.name,
        koreanName: stock.koreanName,
        country: stock.country,
        industry: stock.industry,
        viewedAt: Date.now()
      })
      localStorage.setItem('stocktemp_recent_stocks', JSON.stringify(recents.slice(0, 10)))
    } catch (e) {
      console.error('Error saving recent stock:', e)
    }
  }, [stock?.id])

  // Trigger On-demand Gemini AI Analysis if stock has no cached analysis
  useEffect(() => {
    if (!stock) return
    const hasAiReports = Boolean(
      (stock.latestNews_KO && stock.latestNews_KO.length > 0) ||
      (stock.latestNews_EN && stock.latestNews_EN.length > 0) ||
      (stock.latestNews_VI && stock.latestNews_VI.length > 0)
    )

    if (!hasAiReports && !isGeneratingAi && !dynamicAiReports) {
      setIsGeneratingAi(true)
      generateAndSaveStockAnalysis(stock)
        .then((res) => {
          if (res) {
            setDynamicAiReports(res)
          }
          setIsGeneratingAi(false)
        })
        .catch(() => {
          setIsGeneratingAi(false)
        })
    }
  }, [stock?.id])

  // Watchlist LocalStorage sync
  useEffect(() => {
    if (!stock) return
    const saved = localStorage.getItem('stocktemp_watchlist')
    if (saved) {
      const watchlist = JSON.parse(saved) as string[]
      setIsSaved(watchlist.includes(stock.id))
    }
  }, [stock])

  // 1. Subscribe to user's vote status for this stock
  useEffect(() => {
    if (!id || !user) {
      setMyVote(null)
      return
    }
    const recDocId = `${user.uid}_${id}`
    const unsubscribe = onSnapshot(doc(db, 'recommendations', recDocId), (docSnap) => {
      if (docSnap.exists()) {
        setMyVote({ id: docSnap.id, ...docSnap.data() })
      } else {
        setMyVote(null)
      }
    }, (err) => {
      console.error('Error listening to my vote:', err)
    })
    return () => unsubscribe()
  }, [id, user])

  // 2. Subscribe to real-time community discussions for this stock
  useEffect(() => {
    if (!id) return
    const q = query(
      collection(db, 'discussions'),
      where('stockId', '==', id)
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = []
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() })
      })
      // Client-side sort by createdAt desc to eliminate composite index requirement
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0)
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0)
        return timeB - timeA
      })
      setDiscussions(list)
    }, (error) => {
      console.error('Error listening to discussions:', error)
    })
    return () => unsubscribe()
  }, [id])

  // One-click Toggle Vote (UP or DOWN)
  const handleVoteToggle = async (targetType: 'up' | 'down') => {
    if (!user) {
      setIsDetailLoginOpen(true)
      return
    }
    if (!id || !stock || votingLoading) return

    setVotingLoading(true)
    const recDocId = `${user.uid}_${id}`
    const recRef = doc(db, 'recommendations', recDocId)
    const stockRef = doc(db, 'stocks', id)

    try {
      await runTransaction(db, async (transaction) => {
        const stockSnapshot = await transaction.get(stockRef)
        const recSnapshot = await transaction.get(recRef)

        const currentStockData = stockSnapshot.exists() ? stockSnapshot.data() : null
        const recCount = currentStockData?.recommendationCount || 0
        const disCount = currentStockData?.dislikeCount || 0

        if (recSnapshot.exists()) {
          const currentRec = recSnapshot.data()
          if (currentRec.type === targetType) {
            // Cancel vote
            transaction.delete(recRef)
            if (stockSnapshot.exists()) {
              if (targetType === 'up') {
                transaction.update(stockRef, { recommendationCount: Math.max(0, recCount - 1) })
              } else {
                transaction.update(stockRef, { dislikeCount: Math.max(0, disCount - 1) })
              }
            }
          } else {
            // Change vote from up -> down or down -> up
            transaction.update(recRef, { type: targetType, updatedAt: serverTimestamp() })
            if (stockSnapshot.exists()) {
              if (targetType === 'up') {
                transaction.update(stockRef, { 
                  recommendationCount: recCount + 1,
                  dislikeCount: Math.max(0, disCount - 1)
                })
              } else {
                transaction.update(stockRef, { 
                  recommendationCount: Math.max(0, recCount - 1),
                  dislikeCount: disCount + 1
                })
              }
            }
          }
        } else {
          // New vote
          transaction.set(recRef, {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || null,
            stockId: id,
            type: targetType,
            reason: '',
            createdAt: serverTimestamp()
          })

          if (stockSnapshot.exists()) {
            if (targetType === 'up') {
              transaction.update(stockRef, { recommendationCount: recCount + 1 })
            } else {
              transaction.update(stockRef, { dislikeCount: disCount + 1 })
            }
          } else {
            transaction.set(stockRef, {
              ...stock,
              recommendationCount: targetType === 'up' ? 1 : 0,
              dislikeCount: targetType === 'down' ? 1 : 0,
              createdAt: serverTimestamp()
            })
          }
        }
      })
    } catch (error) {
      console.error('Vote toggle failed:', error)
      alert(language === 'KO' ? '투표 처리 중 오류가 발생했습니다.' : 'Failed to process vote.')
    } finally {
      setVotingLoading(false)
    }
  }

  // Submit Community Discussion Post
  const handleDiscussionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setIsDetailLoginOpen(true)
      return
    }
    if (!id || !discussionContent.trim()) return
    if (discussionContent.trim().length > 500) {
      alert(language === 'KO' ? '의견은 500자 이하로 작성해 주세요.' : 'Opinion must be 500 characters or less.')
      return
    }

    setDiscussionSubmitting(true)
    try {
      await addDoc(collection(db, 'discussions'), {
        stockId: id,
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || null,
        content: discussionContent.trim(),
        createdAt: serverTimestamp()
      })
      setDiscussionContent('')

      // Increment user's commentCount
      await updateDoc(doc(db, 'users', user.uid), {
        commentCount: increment(1)
      }).catch(err => console.error("Error updating user comment stats:", err))
    } catch (error) {
      console.error('Failed to post discussion:', error)
      alert(language === 'KO' ? '의견 등록에 실패했습니다.' : 'Failed to post opinion.')
    } finally {
      setDiscussionSubmitting(false)
    }
  }

  // Delete Community Discussion Post
  const handleDiscussionDelete = async (discussionId: string) => {
    if (!confirm(language === 'KO' ? '정말로 이 의견을 삭제하시겠습니까?' : 'Are you sure you want to delete this opinion?')) return
    try {
      await deleteDoc(doc(db, 'discussions', discussionId))
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          commentCount: increment(-1)
        }).catch(err => console.error("Error updating user comment stats:", err))
      }
    } catch (error) {
      console.error('Failed to delete discussion:', error)
    }
  }

  // Format creation timestamp
  const formatTimestamp = (createdAt: any) => {
    if (!createdAt) return language === 'KO' ? '방금 전' : 'Just now'
    const seconds = createdAt.seconds || (createdAt.toMillis ? Math.floor(createdAt.toMillis() / 1000) : null)
    if (!seconds) return language === 'KO' ? '방금 전' : 'Just now'
    const date = new Date(seconds * 1000)
    return date.toLocaleDateString(
      language === 'KO' ? 'ko-KR' : language === 'VI' ? 'vi-VN' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    )
  }

  if (loading && !stock) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading stock data...</p>
      </div>
    )
  }

  if (!stock) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-slate-300">{t('stockNotFound')}</h2>
        <Link to="/" className="text-blue-400 hover:underline flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('backToDashboard')}
        </Link>
      </div>
    )
  }

  const toggleWatchlist = () => {
    const saved = localStorage.getItem('stocktemp_watchlist')
    let watchlist: string[] = saved ? JSON.parse(saved) : []

    if (watchlist.includes(stock.id)) {
      watchlist = watchlist.filter((item) => item !== stock.id)
      setIsSaved(false)
    } else {
      watchlist.push(stock.id)
      setIsSaved(true)
    }
    localStorage.setItem('stocktemp_watchlist', JSON.stringify(watchlist))
  }

  const currentPrice = prices[stock.id] || stock.currentPrice
  const targetPe = stock.defaultTargetPe
  const currentEps = eps[stock.id] || stock.eps

  // A stock is awaiting sync if isAwaitingSync is true, or if currentPrice/eps are both placeholder 1
  const isAwaitingSync = stock.isAwaitingSync || (currentPrice === 1 && currentEps === 1)
  const isDeficit = currentEps <= 0

  // Recalculate metrics based on targetPe & currentPrice state with BPS support for deficit companies
  const fairPrice = calculateFairPrice(currentEps, targetPe, stock.bps, stock.pbr, currentPrice)
  const currentPe = currentEps > 0 ? currentPrice / currentEps : 0
  const expectedReturn = calculateExpectedReturn(currentPe)
  const stockTemp = calculateStockTemperature(currentPrice, fairPrice)

  const getLocalizedTempDetails = (temp: number, t: any) => {
    if (temp <= -2.5) {
      return {
        label: t('tempFreezingLabel'),
        description: t('tempFreezingDesc'),
        colorClass: 'text-blue-400',
        badgeColorClass: 'bg-blue-950/80 text-blue-300 border-blue-900/50',
        emoji: '❄️',
        iconName: 'snowflake' as const,
        tempVal: `${temp}°C`,
      }
    } else if (temp < 12.5) {
      return {
        label: t('tempCoolLabel'),
        description: t('tempCoolDesc'),
        colorClass: 'text-cyan-400',
        badgeColorClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-900/50',
        emoji: '🔵',
        iconName: 'wind' as const,
        tempVal: `${temp}°C`,
      }
    } else if (temp <= 27.5) {
      return {
        label: t('tempNormalLabel'),
        description: t('tempNormalDesc'),
        colorClass: 'text-emerald-400',
        badgeColorClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-900/50',
        emoji: '🟢',
        iconName: 'cloud-sun' as const,
        tempVal: `${temp}°C`,
      }
    } else if (temp <= 42.5) {
      return {
        label: t('tempWarmLabel'),
        description: t('tempWarmDesc'),
        colorClass: 'text-amber-400',
        badgeColorClass: 'bg-amber-950/80 text-amber-300 border-amber-900/50',
        emoji: '🟠',
        iconName: 'sun' as const,
        tempVal: `${temp}°C`,
      }
    } else {
      return {
        label: t('tempHotLabel'),
        description: t('tempHotDesc'),
        colorClass: 'text-rose-500',
        badgeColorClass: 'bg-rose-950/80 text-rose-300 border-rose-900/50',
        emoji: '🔴',
        iconName: 'flame' as const,
        tempVal: `${temp}°C`,
      }
    }
  }

  const tempDetails = isAwaitingSync ? {
    label: language === 'KO' ? '대기 중' : language === 'VI' ? 'Đang chờ' : 'Pending',
    description: language === 'KO'
      ? '이 종목은 새로 등록되어 실시간 데이터를 수집하는 단계입니다. 최대 10분 정도 소요될 수 있습니다.'
      : language === 'VI'
      ? 'Cổ phiếu này mới được đăng ký và dữ liệu đang được phân tích. Có thể mất tới 10 phút.'
      : 'This stock is newly registered and data is being processed. This may take up to 10 minutes.',
    colorClass: 'text-amber-400',
    badgeColorClass: 'bg-amber-950/80 text-amber-300 border-amber-900/50',
    emoji: '⏳',
    iconName: 'wind' as const,
    tempVal: '-- °C',
  } : getLocalizedTempDetails(stockTemp, t)

  const displayName = language === 'KO' ? (stock.koreanName || stock.name) : stock.name
  const baseRateNum = getBaseRateNumber(stock.country)
  const baseRate = `${baseRateNum.toFixed(2)}%`
  const yieldSpread = Number((expectedReturn - baseRateNum).toFixed(2))
  const isPositiveSpread = yieldSpread >= 0

  // Load real-world synced news, on-demand AI reports, or fallback to mock news
  let newsList: any[] = []
  const activeReports = dynamicAiReports || stock
  if (language === 'KO' && activeReports.latestNews_KO && activeReports.latestNews_KO.length > 0) {
    newsList = activeReports.latestNews_KO
  } else if (language === 'VI' && activeReports.latestNews_VI && activeReports.latestNews_VI.length > 0) {
    newsList = activeReports.latestNews_VI
  } else if (activeReports.latestNews_EN && activeReports.latestNews_EN.length > 0) {
    newsList = activeReports.latestNews_EN
  } else {
    newsList = getMockNews(stock, displayName, language)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate('/')
              }
            }}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title={t('backToDashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold text-slate-550 uppercase tracking-wider block">
              {getCountryName(stock.country, language)} | {translateIndustry(stock.industry, language)}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-xl md:text-2xl font-black text-slate-100">
                {displayName}
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg">
                {stock.ticker}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={toggleWatchlist}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
            isSaved
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
          {isSaved ? t('removeWatchlist') : t('addWatchlist')}
        </button>
      </div>

      {/* Pending Sync Warning Alert */}
      {isAwaitingSync && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 shadow-md shadow-amber-500/2">
          <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 shrink-0 text-amber-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
              {language === 'KO' ? '실시간 데이터 동기화 대기 중' : language === 'VI' ? 'Đang đợi đồng bộ dữ liệu' : 'Real-time Data Sync Pending'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'KO'
                ? '이 종목은 신규 등록되어 현재 백그라운드 크롤러가 실시간 주가 및 재무 데이터를 수집 중입니다. 10분 내로 가격 정보가 정상 갱신되어 적정 주가와 온도가 업데이트됩니다.'
                : language === 'VI'
                ? 'Cổ phiếu này mới đăng ký. Dữ liệu giá hiện tại đang được thu thập trực tuyến. Giá hợp lý và nhiệt độ sẽ hoàn tất cập nhật trong 10 phút.'
                : 'This stock has been newly registered. Our background crawler is currently retrieving real-time price & financials. Data will be fully synced in 10 minutes.'}
            </p>
          </div>
        </div>
      )}

      {/* Top 2-Card Master Deck: [1. 주가 밸류에이션 (현재가 ➔ 갭 ➔ 적정가)] & [2. 금리 대비 수익률 (기준금리 ➔ 마진 ➔ 기대수익)] */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Master Card 1: 주가 밸류에이션 (스마트 벡터 플로우) */}
        {(() => {
          const priceGapPct = fairPrice > 0 ? ((fairPrice - currentPrice) / currentPrice) * 100 : 0
          const isUndervalued = priceGapPct >= 0

          return (
            <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 sm:p-5 md:p-6 shadow-xl flex flex-col justify-between">
              {/* Header: Title & Upside Badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-300 font-extrabold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <span>💎</span>
                  <span>{language === 'KO' ? '주가 밸류에이션' : language === 'VI' ? 'Định giá cổ phiếu' : 'Price Valuation'}</span>
                </span>
                {!isAwaitingSync && (
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {isDeficit && (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/25">
                        {language === 'KO' ? '순익적자 (BPS)' : 'BPS Basis'}
                      </span>
                    )}
                    {fairPrice > 0 && (
                      <span className={`text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-0.5 rounded-full border shadow-sm ${
                        isUndervalued 
                          ? 'bg-blue-500/20 border-blue-400/40 text-blue-300' 
                          : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                      }`}>
                        {language === 'KO'
                          ? `적정가와 ${isUndervalued ? '+' : ''}${priceGapPct.toFixed(1)}% 차이 (${isUndervalued ? '저평가' : '고평가'})`
                          : language === 'VI'
                          ? `Chênh lệch ${isUndervalued ? '+' : ''}${priceGapPct.toFixed(1)}% (${isUndervalued ? 'Định giá thấp' : 'Định giá cao'})`
                          : `${isUndervalued ? '+' : ''}${priceGapPct.toFixed(1)}% vs Fair Value (${isUndervalued ? 'Undervalued' : 'Overvalued'})`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Vector Flow Body: [ 현재가 ] ──▶ [ 방향 & 괴리율 ] ──▶ [ AI 적정가 ] */}
              <div className="mt-4 pt-1">
                {isAwaitingSync || fairPrice <= 0 ? (
                  <div className="flex items-center justify-between py-3 sm:py-4 px-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                    <div className="text-left flex-1 min-w-0 overflow-hidden">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">{language === 'KO' ? '현재가' : 'Current'}</span>
                      <span className="text-xs min-[360px]:text-sm sm:text-lg lg:text-2xl font-black font-mono text-slate-100 truncate block">
                        {isAwaitingSync ? '--' : `${stock.currency} ${currentPrice.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="text-slate-500 font-bold text-sm px-2 shrink-0">➔</div>
                    <div className="text-right flex-1 min-w-0 overflow-hidden">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">{language === 'KO' ? 'AI 적정가' : 'Fair Value'}</span>
                      <span className="text-xs min-[360px]:text-sm sm:text-base lg:text-xl font-bold font-mono text-slate-400 truncate block">N/A</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex items-center justify-between gap-1.5 sm:gap-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5 sm:p-4">
                    {/* Left Box: 현재 시장가 */}
                    <div className="flex-1 min-w-0 text-left overflow-hidden">
                      <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 inline-block" />
                        <span className="truncate">{language === 'KO' ? '현재 주가' : 'Current Price'}</span>
                      </div>
                      <div 
                        className="text-xs min-[360px]:text-sm sm:text-lg md:text-xl lg:text-2xl font-black font-mono text-slate-100 tracking-tight mt-0.5 truncate flex items-baseline gap-0.5 sm:gap-1"
                        title={`${stock.currency} ${currentPrice.toLocaleString()}`}
                      >
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-400 shrink-0">{stock.currency}</span>
                        <span className="truncate">{currentPrice.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Center Vector Indicator with Trending Icon & Hover Zoom */}
                    <div className="shrink-0 flex flex-col items-center px-0.5 sm:px-1">
                      <div className={`group flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border shadow-lg font-black font-mono transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl ${
                        isUndervalued 
                          ? 'bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-cyan-950/90 border-emerald-500/50 text-emerald-300 shadow-emerald-500/25' 
                          : 'bg-gradient-to-r from-rose-950/90 via-red-950/90 to-amber-950/90 border-rose-500/50 text-rose-300 shadow-rose-500/25'
                      }`}>
                        {isUndervalued ? (
                          <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-400 shrink-0 stroke-[2.8] transition-transform duration-300 group-hover:scale-125" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-rose-400 shrink-0 stroke-[2.8] transition-transform duration-300 group-hover:scale-125" />
                        )}
                        <span className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight whitespace-nowrap">
                          {isUndervalued ? `+${priceGapPct.toFixed(1)}%` : `${priceGapPct.toFixed(1)}%`}
                        </span>
                      </div>
                    </div>

                    {/* Right Box: AI 적정가 */}
                    <div className="flex-1 min-w-0 text-right overflow-hidden">
                      <div className="text-[10px] sm:text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center justify-end gap-1">
                        <span className="truncate">{language === 'KO' ? 'AI 적정가' : 'AI Fair Value'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 inline-block" />
                      </div>
                      <div 
                        className={`text-xs min-[360px]:text-sm sm:text-lg md:text-xl lg:text-2xl font-black font-mono tracking-tight mt-0.5 truncate flex items-baseline justify-end gap-0.5 sm:gap-1 ${
                          isUndervalued ? 'text-cyan-400' : 'text-blue-400'
                        }`}
                        title={`${stock.currency} ${Math.round(fairPrice).toLocaleString()}`}
                      >
                        <span className="text-[10px] sm:text-xs font-semibold opacity-75 shrink-0">{stock.currency}</span>
                        <span className="truncate">{Math.round(fairPrice).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* Master Card 2: 금리 대비 수익률 (스마트 벡터 플로우) */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 sm:p-5 md:p-6 shadow-xl flex flex-col justify-between">
          {/* Header: Title & Status Badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-300 font-extrabold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <span>⚡</span>
              <span>{language === 'KO' ? '금리 대비 수익률' : language === 'VI' ? 'Lợi suất so với Lãi suất' : 'Yield vs Base Rate'}</span>
            </span>
            {!isAwaitingSync && (
              <span className={`text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-0.5 rounded-full border shadow-sm ${
                isPositiveSpread 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              }`}>
                {language === 'KO'
                  ? `${isPositiveSpread ? '+' : ''}${yieldSpread.toFixed(2)}%p ${isPositiveSpread ? '여유' : '부족'}`
                  : language === 'VI'
                  ? `${isPositiveSpread ? '+' : ''}${yieldSpread.toFixed(2)}%p ${isPositiveSpread ? 'Dư thừa' : 'Thiếu hụt'}`
                  : `${isPositiveSpread ? '+' : ''}${yieldSpread.toFixed(2)}%p ${isPositiveSpread ? 'Surplus' : 'Deficit'}`}
              </span>
            )}
          </div>

          {/* Vector Flow Body: [ 국가 기준금리 ] ──▶ [ 마진 갭 ] ──▶ [ 기업 기대수익률 ] */}
          <div className="mt-4 pt-1">
            <div className="relative flex items-center justify-between gap-1.5 sm:gap-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5 sm:p-4">
              {/* Left Box: 기준금리 */}
              <div className="flex-1 min-w-0 text-left overflow-hidden">
                <div className="text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 inline-block" />
                  <span className="truncate">{language === 'KO' ? `기준금리(${stock.country})` : `Base Rate(${stock.country})`}</span>
                </div>
                <div className="text-xs min-[360px]:text-sm sm:text-lg md:text-xl lg:text-2xl font-black font-mono text-amber-400 tracking-tight mt-0.5 truncate">
                  {baseRate}
                </div>
              </div>

              {/* Center Vector Indicator with Trending Icon & Hover Zoom */}
              <div className="shrink-0 flex flex-col items-center px-0.5 sm:px-1">
                <div className={`group flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border shadow-lg font-black font-mono transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl ${
                  isPositiveSpread 
                    ? 'bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-cyan-950/90 border-emerald-500/50 text-emerald-300 shadow-emerald-500/25' 
                    : 'bg-gradient-to-r from-rose-950/90 via-red-950/90 to-amber-950/90 border-rose-500/50 text-rose-300 shadow-rose-500/25'
                }`}>
                  {isPositiveSpread ? (
                    <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-400 shrink-0 stroke-[2.8] transition-transform duration-300 group-hover:scale-125" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-rose-400 shrink-0 stroke-[2.8] transition-transform duration-300 group-hover:scale-125" />
                  )}
                  <span className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight whitespace-nowrap">
                    {isPositiveSpread ? `+${yieldSpread.toFixed(2)}%p` : `${yieldSpread.toFixed(2)}%p`}
                  </span>
                </div>
              </div>

              {/* Right Box: 기업 기대수익률 */}
              <div className="flex-1 min-w-0 text-right overflow-hidden">
                <div className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-end gap-1">
                  <span className="truncate">{language === 'KO' ? '기업 기대수익률' : 'Earnings Yield'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 inline-block" />
                </div>
                <div className={`text-xs min-[360px]:text-sm sm:text-lg md:text-xl lg:text-2xl font-black font-mono tracking-tight mt-0.5 truncate ${
                  isPositiveSpread ? 'text-emerald-400' : 'text-slate-100'
                }`}>
                  {isAwaitingSync ? '--' : `${expectedReturn}%`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Layout: Interactive Valuation Slider & SVG Charts Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: AI Valuation & Stock Temperature Summary Card (Lg: 4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-full">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span>{language === 'KO' ? 'StockTemp 가치 평가 요약' : language === 'VI' ? 'Tóm tắt định giá StockTemp' : 'StockTemp Valuation Summary'}</span>
                </h3>
              </div>

              {/* Grid layout for left text summary and right vertical gauge */}
              <div className="grid grid-cols-12 gap-4 items-stretch">
                {/* Left side (8/12 column): Temp Banner and Action Guide with reduced width */}
                <div className="col-span-8 flex flex-col justify-between gap-4">
                  {/* Stock Temperature Banner with WeatherIcon only */}
                  <div className="flex items-center gap-4 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-slate-950/80 border border-indigo-500/20 rounded-2xl p-4 flex-1 shadow-md">
                    <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-inner shrink-0">
                      <WeatherIcon name={tempDetails.iconName} className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        {t('currentStockTemp')}
                      </span>
                      <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 mt-0.5">
                        <span className={`text-lg font-black font-mono leading-none ${tempDetails.colorClass}`}>
                          {tempDetails.tempVal}
                        </span>
                        <span className={`text-[10px] font-bold ${tempDetails.colorClass}`}>
                          {tempDetails.emoji} {tempDetails.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Recommendation Message */}
                  <div className="bg-gradient-to-br from-slate-950/80 via-indigo-950/20 to-slate-950/80 border border-indigo-500/20 shadow-inner p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-indigo-400 block mb-1 text-[10px] uppercase tracking-wider">
                      {language === 'KO' ? '행동 가이드' : language === 'VI' ? 'Hướng dẫn hành động' : 'Action Guide'}
                    </span>
                    {tempDetails.description}
                  </div>
                </div>

                {/* Right side (4/12 column): Vertical Temperature Gauge */}
                <div className="col-span-4 bg-gradient-to-b from-slate-950/80 via-slate-900/40 to-slate-950/80 border border-indigo-500/20 rounded-2xl p-1.5 flex flex-col items-center justify-center min-h-[185px] shadow-md">
                  {isAwaitingSync ? (
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                      <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Syncing</span>
                    </div>
                  ) : (
                    renderVerticalTempGauge(stockTemp)
                  )}
                </div>
              </div>
            </div>

            {/* Core Metrics Unified Box (Option 2) */}
            <div className="mt-4 bg-gradient-to-br from-slate-950/80 via-slate-900/50 to-slate-950/80 border border-blue-500/20 rounded-2xl p-4 shadow-lg">
              <div className="grid grid-cols-3 text-center divide-x divide-slate-800/40">
                {/* 1. Target P/E Multiple (AI Target) */}
                <div className="space-y-1 min-w-0">
                  <span className="block text-slate-550 text-[10px] sm:text-[11px] font-bold uppercase tracking-tighter leading-tight whitespace-nowrap">
                    {language === 'KO' ? '적정 P/E (AI산정)' : language === 'VI' ? 'P/E hợp lý (AI chọn)' : 'Fair P/E (AI Calc)'}
                  </span>
                  <span className="block font-black text-blue-400 font-mono text-sm sm:text-base mt-0.5">
                    {targetPe}x
                  </span>
                </div>

                {/* 2. Current P/E Ratio */}
                <div className="space-y-1 min-w-0">
                  <span className="block text-slate-550 text-[10px] sm:text-[11px] font-bold uppercase tracking-tighter leading-tight whitespace-nowrap">
                    {language === 'KO' ? '현재 P/E' : language === 'VI' ? 'P/E hiện tại' : 'Current P/E'}
                  </span>
                  <span className="block font-black text-slate-200 font-mono text-sm sm:text-base mt-0.5">
                    {isAwaitingSync ? '--' : `${(currentPrice / currentEps).toFixed(1)}x`}
                  </span>
                </div>

                {/* 3. Earnings Per Share (EPS) */}
                <div className="space-y-1 min-w-0">
                  <span className="block text-slate-550 text-[10px] sm:text-[11px] font-bold uppercase tracking-tighter leading-tight whitespace-nowrap">
                    {language === 'KO' ? '현재 EPS' : language === 'VI' ? 'EPS hiện tại' : 'Current EPS'}
                  </span>
                  <span className="block font-black text-slate-200 font-mono text-xs sm:text-sm mt-0.5 truncate px-1">
                    {stock.currency} {Math.round(currentEps).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Horizontal Divider */}
              <div className="my-3.5 border-t border-slate-800/40"></div>

              <div className="grid grid-cols-3 text-center divide-x divide-slate-800/40">
                {/* 4. Return on Equity (ROE) */}
                <div className="space-y-1 min-w-0">
                  <span className="block text-slate-550 text-[10px] sm:text-[11px] font-bold uppercase tracking-tighter leading-tight whitespace-nowrap">
                    {t('roe')}
                  </span>
                  <span className="block font-black text-emerald-400 font-mono text-sm sm:text-base mt-0.5">
                    {stock.roe !== undefined && stock.roe !== null ? `${stock.roe.toFixed(1)}%` : '-'}
                  </span>
                </div>

                {/* 5. Price to Book Ratio (PBR) */}
                <div className="space-y-1 min-w-0">
                  <span className="block text-slate-550 text-[10px] sm:text-[11px] font-bold uppercase tracking-tighter leading-tight whitespace-nowrap">
                    {t('pbr')}
                  </span>
                  <span className="block font-black text-slate-200 font-mono text-sm sm:text-base mt-0.5">
                    {stock.pbr !== undefined && stock.pbr !== null ? `${stock.pbr.toFixed(2)}x` : '-'}
                  </span>
                </div>

                {/* 6. Debt to Equity Ratio (부채비율) */}
                <div className="space-y-1 min-w-0">
                  <span className="block text-slate-550 text-[10px] sm:text-[11px] font-bold uppercase tracking-tighter leading-tight whitespace-nowrap">
                    {t('debtRatio')}
                  </span>
                  <span className="block font-black text-rose-400 font-mono text-sm sm:text-base mt-0.5">
                    {stock.debtRatio !== undefined && stock.debtRatio !== null ? `${stock.debtRatio.toFixed(1)}%` : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Custom Financial Charts Dashboard (Lg: 8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Consensus vs Fair Value Comparison Section (Desktop: Top / Mobile: Below EPS & BPS) */}
          <div className="order-2 lg:order-1">
            {isAwaitingSync ? (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 bg-slate-950/10 rounded-3xl p-6 text-center space-y-2">
                <span className="text-2xl">📊</span>
                <p className="text-xs text-slate-400 font-bold">
                  {language === 'KO' ? '비교 차트 생성 대기 중' : language === 'VI' ? 'Đang tạo biểu đồ so sánh' : 'Comparison Chart Pending'}
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
                  {language === 'KO' ? '주가와 재무 데이터 동기화가 완료되면 가치산정 비교 차트가 시각화됩니다.' : 'The comparison chart will visualize fair price relative to current market price once synced.'}
                </p>
              </div>
            ) : isDeficit || fairPrice <= 0 ? (
              <div className="flex flex-col items-center justify-center h-44 bg-gradient-to-b from-slate-900/80 via-slate-950/90 to-slate-950/90 border border-slate-800/80 rounded-2xl p-6 text-center space-y-2 shadow-xl">
                <p className="text-sm text-slate-200 font-extrabold">
                  {language === 'KO' ? '적정가 산정불가 (적자기업)' : language === 'VI' ? 'Không thể tính giá hợp lý (Doanh nghiệp thua lỗ)' : 'Fair Price Not Applicable (Deficit Company)'}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm">
                  {language === 'KO' 
                    ? '당기순손실(EPS 음수) 기업은 P/E 기반의 적정주가가 산정되지 않습니다. BPS 추이를 참고해 주세요.' 
                    : 'P/E-based fair price is not applicable for companies with negative earnings. Please refer to BPS trend.'}
                </p>
              </div>
            ) : (
              <ConsensusCompareChart stock={stock} currentPrice={currentPrice} fairPrice={fairPrice} language={language} t={t} />
            )}
          </div>

          {/* Quarterly EPS & BPS Financial Trend Charts (Mobile: Top / Desktop: Below Consensus Chart) */}
          <div className="order-1 lg:order-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomRevenueEpsChart stock={stock} currentEps={currentEps} language={language} t={t} />
            <CustomBpsChart stock={stock} currentPrice={currentPrice} t={t} />
          </div>

          {/* Regulatory In-line Disclaimer (Vietnamese Securities Law & Global Compliance) */}
          <div className="order-3 lg:order-3 flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/90 text-xs sm:text-[13px] font-medium text-slate-300 leading-relaxed select-none shadow-sm">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              {language === 'KO'
                ? '💡 본 지표는 투자 권유가 아닌 참고용 가상 분석 자료이며, 모든 투자 책임은 본인에게 귀속됩니다.'
                : language === 'VI'
                ? '💡 Dữ liệu chỉ mang tính chất tham khảo học thuật, không cấu thành lời khuyên đầu tư hay mua bán chứng khoán.'
                : '💡 For informational and simulation purposes only. Does not constitute investment advice or trading solicitations.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom: Latest News Section (Max 3 articles) */}
      <div className="border-t border-slate-800/60 pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400/20" /> {t('latestNews')}
          </h3>
          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Gemini 3.6 Flash AI</span>
          </span>
        </div>

        {isGeneratingAi ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-900 border border-blue-500/20 rounded-2xl p-5 space-y-3 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-3 w-20 bg-slate-800 rounded"></div>
                  <div className="h-3 w-12 bg-slate-800 rounded"></div>
                </div>
                <div className="h-4 w-3/4 bg-blue-500/20 rounded"></div>
                <div className="space-y-1.5 pt-2">
                  <div className="h-2.5 w-full bg-slate-800 rounded"></div>
                  <div className="h-2.5 w-5/6 bg-slate-800 rounded"></div>
                  <div className="h-2.5 w-4/6 bg-slate-800 rounded"></div>
                </div>
                <div className="text-[10px] text-blue-400 font-bold pt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span>{language === 'KO' ? 'AI 심층 분석 생성 중...' : 'AI generating analysis...'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {newsList.map((news, idx) => {
            const isExpanded = expandedNewsIndex === idx
            return (
              <div 
                key={idx} 
                className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-200 shadow-md flex flex-col"
              >
                {/* Header / Click Trigger */}
                <button
                  onClick={() => setExpandedNewsIndex(isExpanded ? null : idx)}
                  className="w-full text-left p-5 flex flex-col justify-between hover:bg-slate-850/50 transition-colors h-full"
                >
                  <div className="flex justify-between items-start text-[10px] text-slate-500 font-bold mb-3 w-full">
                    <span>{news.publisher}</span>
                    <span className="truncate max-w-[100px]">{news.pubDate}</span>
                  </div>
                  <div className="flex justify-between items-end gap-2 w-full">
                    <h4 className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors leading-snug line-clamp-2 flex-1">
                      {news.title}
                    </h4>
                    <span className={`text-[10px] text-slate-500 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 text-blue-400' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Accordion Expanded Content */}
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-[300px] border-t border-slate-850' : 'max-h-0'
                  }`}
                >
                  <div className="p-5 bg-slate-950/20 text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                    {news.content || (
                      language === 'KO' 
                        ? `[금융분석요약] 본 뉴스는 '${news.title}'에 대한 보도입니다.\n\n최근 금융투자업계에서는 해당 기업의 이번 소식이 향후 영업 마진 및 밸류에이션(P/E)에 미칠 중장기 영향에 주목하고 있습니다. 전문가들은 단기 주가 흐름보다는 중장기 밸류에이션의 실질적인 변화를 꾸준히 모니터링할 것을 권장합니다.`
                        : language === 'VI'
                          ? `[Tóm tắt phân tích tài chính] Bản tin này phản ánh về '${news.title}'.\n\nGiới đầu tư đang đánh giá tác động của sự kiện này đối với triển vọng doanh thu và định giá. Khuyến nghị nhà đầu tư tiếp tục theo dõi báo cáo tài chính để kiểm chứng thực tế.`
                          : `[Financial Analysis Summary] This news article reports on '${news.title}'.\n\nMarket participants are evaluating how this development will influence the revenue growth trajectory and valuation multiples. Investors are encouraged to monitor long-term earnings statements.`
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        )}
      </div>

      {/* Social Recommendation & Community Discussion Section */}
      <div className="border-t border-slate-800/60 pt-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: One-Click Vote Widget (Lg: 5/12) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-5 select-none">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <span>
                    {language === 'KO' ? '이 종목 추천/비추천 투표' : language === 'VI' ? 'Bình chọn cổ phiếu này' : 'Stock Sentiment Vote'}
                  </span>
                </h3>
                {myVote && (
                  <span className="text-[10px] font-mono font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    {language === 'KO' ? '참여완료' : language === 'VI' ? 'Đã bình chọn' : 'Voted'}
                  </span>
                )}
              </div>

              {/* Vote Ratio Progress Gauge Bar */}
              {(() => {
                const upCount = stock.recommendationCount || 0
                const downCount = stock.dislikeCount || 0
                const totalVotes = upCount + downCount
                const upPercent = totalVotes > 0 ? Math.round((upCount / totalVotes) * 100) : 50
                const downPercent = 100 - upPercent

                return (
                  <div className="space-y-2 bg-gradient-to-r from-slate-950/80 via-blue-950/25 to-slate-950/80 p-4 rounded-2xl border border-blue-500/25 shadow-md">
                    <div className="flex justify-between items-center text-xs font-mono font-bold">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{language === 'KO' ? '추천' : 'Up'} {upCount} ({upPercent}%)</span>
                      </span>
                      <span className="text-rose-400 flex items-center gap-1">
                        <span>{downPercent}% ({downCount}) {language === 'KO' ? '비추천' : 'Down'}</span>
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Visual Bar */}
                    <div className="w-full h-3 bg-slate-850 rounded-full overflow-hidden flex shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-sm"
                        style={{ width: `${upPercent}%` }}
                      />
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500 shadow-sm"
                        style={{ width: `${downPercent}%` }}
                      />
                    </div>

                    <div className="text-right text-[10px] text-slate-500 font-medium pt-0.5">
                      {totalVotes > 0 
                        ? (language === 'KO' ? `총 ${totalVotes}명의 투자자가 참여했습니다.` : `Total ${totalVotes} votes cast.`)
                        : (language === 'KO' ? '첫 투표의 주인공이 되어보세요!' : 'Be the first to cast a vote!')}
                    </div>
                  </div>
                )
              })()}

              {/* One-Click Action Buttons */}
              <div className="flex gap-3.5">
                <button
                  type="button"
                  disabled={votingLoading}
                  onClick={() => handleVoteToggle('up')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-xs font-black uppercase transition-all cursor-pointer ${
                    myVote?.type === 'up'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${myVote?.type === 'up' ? 'text-emerald-400 animate-bounce' : ''}`} />
                  <span>{language === 'KO' ? '추천 (UP)' : language === 'VI' ? 'Tăng (UP)' : 'Up'}</span>
                </button>

                <button
                  type="button"
                  disabled={votingLoading}
                  onClick={() => handleVoteToggle('down')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-xs font-black uppercase transition-all cursor-pointer ${
                    myVote?.type === 'down'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30 shadow-lg shadow-rose-500/20 scale-[1.02]'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <ThumbsDown className={`w-4 h-4 ${myVote?.type === 'down' ? 'text-rose-400 animate-bounce' : ''}`} />
                  <span>{language === 'KO' ? '비추천 (DOWN)' : language === 'VI' ? 'Giảm (DOWN)' : 'Down'}</span>
                </button>
              </div>

              {/* Status or Login Hint */}
              {!user ? (
                <div className="bg-gradient-to-r from-slate-950/80 via-indigo-950/20 to-slate-950/80 border border-indigo-500/20 p-4 rounded-2xl space-y-3 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setIsDetailLoginOpen(!isDetailLoginOpen)}
                    className="w-full flex items-center justify-between text-left group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-350 group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                        <LogIn className="w-3.5 h-3.5 text-blue-400" />
                        {language === 'KO' ? '로그인하고 1초 만에 투표하기' : 'Sign in for 1-click voting'}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {language === 'KO' ? '로그인 후 원클릭으로 추천/비추천 투표에 참여할 수 있습니다.' : 'Sign in to vote on this stock.'}
                      </p>
                    </div>
                    {isDetailLoginOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 group-hover:translate-y-0.5 transition-transform" />
                    )}
                  </button>

                  {isDetailLoginOpen && (
                    <div className="pt-3 border-t border-slate-800/40 animate-in fade-in slide-in-from-top-2 duration-200">
                      <LoginInline />
                    </div>
                  )}
                </div>
              ) : myVote ? (
                <p className="text-[11px] text-slate-500 text-center font-medium">
                  {language === 'KO' 
                    ? '✓ 투표가 반영되었습니다. (선택된 버튼을 다시 누르면 취소됩니다)' 
                    : language === 'VI' 
                    ? '✓ Bình chọn đã được ghi nhận. (Nhấp lại để hủy)' 
                    : '✓ Your vote is recorded. (Click again to cancel)'}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 text-center font-medium">
                  {language === 'KO' 
                    ? '버튼을 1번 누르면 즉시 투표수가 반영됩니다.' 
                    : 'Click a button above to cast your sentiment vote instantly.'}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Free Community Discussion Feed (Lg: 7/12) */}
          <div className="lg:col-span-7 space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <span>
                  {language === 'KO' ? '투자자 종목 토론' : language === 'VI' ? 'Thảo luận cổ phiếu' : 'Investor Discussion'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono font-bold">
                  {discussions.length}
                </span>
              </h3>
            </div>

            {/* Discussion Input Form */}
            {user ? (
              <form onSubmit={handleDiscussionSubmit} className="space-y-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Me" 
                        className="w-5 h-5 rounded-full border border-blue-500/30" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-4 h-4 text-blue-400" />
                    )}
                    <span>{user.displayName || 'User'}</span>
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${discussionContent.length >= 500 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {discussionContent.length}/500
                  </span>
                </div>

                <textarea
                  value={discussionContent}
                  onChange={(e) => setDiscussionContent(e.target.value.slice(0, 500))}
                  placeholder={
                    language === 'KO' 
                      ? '이 종목의 실적 전망, 목표가, 매수/매도 이유 등 자유로운 투자 의견을 남겨보세요.' 
                      : language === 'VI'
                      ? 'Chia sẻ nhận định, kỳ vọng giá hoặc phân tích của bạn về cổ phiếu này.'
                      : 'Share your analysis, target price, or thoughts on this stock...'
                  }
                  className="w-full h-20 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none resize-none leading-relaxed transition-all shadow-inner"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={discussionSubmitting || !discussionContent.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-xs font-bold text-white rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {discussionSubmitting 
                        ? (language === 'KO' ? '등록 중...' : 'Posting...') 
                        : (language === 'KO' ? '의견 등록' : language === 'VI' ? 'Gửi ý kiến' : 'Post Opinion')}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-gradient-to-r from-slate-950/80 via-indigo-950/30 to-slate-950/80 border border-indigo-500/25 rounded-2xl flex items-center justify-between gap-3 shadow-md">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-300">
                    {language === 'KO' ? '로그인하고 투자자들과 자유롭게 의견을 나눠보세요!' : 'Sign in to join the discussion and share your thoughts!'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailLoginOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0"
                >
                  {language === 'KO' ? '로그인' : 'Sign In'}
                </button>
              </div>
            )}

            {/* Discussions List Feed */}
            <div className="flex-1 overflow-y-auto max-h-[450px] pr-1 space-y-3.5 min-h-[200px]">
              {discussions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center text-xs text-slate-500 space-y-2 bg-slate-900/10 border border-slate-800/40 rounded-3xl">
                  <MessageSquare className="w-8 h-8 text-slate-750" />
                  <p>
                    {language === 'KO' 
                      ? '등록된 토론 글이 아직 없습니다. 첫 의견을 남겨보세요!' 
                      : language === 'VI'
                      ? 'Chưa có thảo luận nào. Hãy là người đầu tiên để lại ý kiến!'
                      : 'No discussion posts yet. Be the first to share your thoughts!'}
                  </p>
                </div>
              ) : (
                discussions.map((item) => {
                  const isMyPost = user && item.uid === user.uid
                  return (
                    <div 
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isMyPost
                          ? 'bg-slate-900/90 border-blue-500/20 shadow-md shadow-blue-500/5'
                          : 'bg-slate-900/80 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {item.photoURL ? (
                            <img 
                              src={item.photoURL} 
                              alt="Avatar" 
                              className="w-7 h-7 rounded-full border border-slate-800 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-200 truncate">
                                {item.displayName}
                              </span>
                              {isMyPost && (
                                <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded-full uppercase shrink-0">
                                  Me
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-600" />
                              {formatTimestamp(item.createdAt)}
                            </span>
                          </div>
                        </div>

                        {isMyPost && (
                          <button
                            type="button"
                            onClick={() => handleDiscussionDelete(item.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer shrink-0"
                            title={language === 'KO' ? '삭제' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-3 leading-relaxed whitespace-pre-line">
                        {item.content}
                      </p>

                      <OpinionReplies opinionId={item.id} stockId={stock.id} parentCollection="discussions" />
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}



const renderVerticalTempGauge = (temp: number) => {
  // Clamp temp between -10 and 100
  const clampedTemp = Math.max(-10, Math.min(100, temp));
  
  // Non-linear visual height mapping:
  // Total viewBox height is 140.
  // 100C is at Y = 5
  // 0C baseline is at Y = 95
  // -10C is at Y = 135
  // Positive range (0 to 100) spans 90px
  // Negative range (0 to -10) spans 40px
  const y_0 = 95;
  const y_minus_10 = 135;
  let y_curr = y_0;
  
  if (clampedTemp >= 0) {
    y_curr = y_0 - (clampedTemp / 100) * 90;
  } else {
    y_curr = y_0 + (Math.abs(clampedTemp) / 10) * 40;
  }
  
  const isPositive = clampedTemp >= 0;
  const pointerColor = isPositive ? '#ef4444' : '#3b82f6';

  return (
    <svg viewBox="0 0 100 140" className="w-full h-full max-h-[185px] select-none">
      <defs>
        {/* Gradation definitions */}
        <linearGradient id="redGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="30%" stopColor="#fdba74" />
          <stop offset="65%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="35%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        
        {/* Clip path for the whole thermometer track */}
        <clipPath id="trackClip">
          <rect x="44" y="5" width="18" height="130" rx="9" />
        </clipPath>
      </defs>

      {/* Background Track border/shadow outline */}
      <rect x="44" y="5" width="18" height="130" rx="9" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
      
      {/* Seamless Gradient Fills inside Clip Path */}
      <g clipPath="url(#trackClip)">
        {/* Below 0C: Blue Gradient Bar (0 to -10) */}
        <rect x="44" y="95" width="18" height="40" fill="url(#blueGrad)" />
        {/* Above 0C: Red Gradient Bar (0 to 100) */}
        <rect x="44" y="5" width="18" height="90" fill="url(#redGrad)" />
      </g>
      
      {/* 0C Baseline marker inside track */}
      <line x1="40" y1={y_0} x2="66" y2={y_0} stroke="#334155" strokeWidth="2" opacity="0.8" />
      
      {/* Current Temperature White Circle Indicator centered in the bar */}
      <circle cx="53" cy={y_curr} r="5.5" fill="#ffffff" stroke={pointerColor} strokeWidth="2.5" />
      
      {/* Indicator Pointer & Value Label on the Left */}
      <line x1="32" y1={y_curr} x2="44" y2={y_curr} stroke={pointerColor} strokeWidth="1.5" strokeDasharray="1.5,1.5" />
      <polygon points={`34,${y_curr-4} 42,${y_curr} 34,${y_curr+4}`} fill={pointerColor} />
      
      {/* Left text label showing the exact temp */}
      <text 
        x="28" 
        y={y_curr + 3.5} 
        fill={pointerColor} 
        textAnchor="end"
        className="text-[9.5px] font-black font-mono"
      >
        {temp.toFixed(1)}°
      </text>
      
      {/* Grid Scale Lines & Text labels on the Right */}
      {/* 100C */}
      <line x1="62" y1="5" x2="70" y2="5" stroke="#475569" strokeWidth="1" />
      <text x="74" y="8.5" fill="#64748b" className="text-[9.5px] font-bold font-mono">100</text>
      
      {/* 0C */}
      <line x1="62" y1={y_0} x2="72" y2={y_0} stroke="#64748b" strokeWidth="1.5" />
      <text x="76" y={y_0+3.5} fill="#94a3b8" className="text-[10px] font-black font-mono">0</text>
      
      {/* -10C */}
      <line x1="62" y1={y_minus_10} x2="70" y2={y_minus_10} stroke="#475569" strokeWidth="1" />
      <text x="74" y={y_minus_10+3.5} fill="#64748b" className="text-[9.5px] font-bold font-mono">-10</text>
    </svg>
  );
};

const getBaseRateNumber = (country: string): number => {
  switch (country) {
    case 'KR': return 3.50;
    case 'US': return 5.25;
    case 'VN': return 4.50;
    case 'CN': return 3.35;
    default: return 3.50;
  }
}

function getMockNews(stock: any, stockName: string, language: string) {
  const stockId = stock?.id || "";

  if (language === 'KO') {
    if (stockId === 'VN_NVL') {
      return [
        {
          title: '1. 업종 및 시장 환경',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[시장환경] 베트남 부동산 시장은 정부의 금리 인하 및 규제 완화 기조에도 불구하고 거래 침체가 지속되며 전반적으로 위축된 상태입니다. 신규 프로젝트 승인 지연과 민간 개발사들의 사업 착수 지연이 건설 경기 동반 부진을 낳고 있어 노바랜드의 분양 매출 회복에 시간이 걸리고 있습니다.`
        },
        {
          title: '2. 재무 건전성 및 리스크',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[재무분석] 노바랜드는 높은 회사채 발행 잔액과 만기 도래에 따른 유동성 리스크가 지속되고 있습니다. 채권단과의 만기 연장 및 자산 매각을 통한 채무 구조조정을 적극 추진 중이나, 현금성 자산 부족으로 인한 단기 부도 및 디폴트 리스크 모니터링이 핵심 요인입니다.`
        },
        {
          title: '3. 성장 동력 및 가치 분석',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[가치전망] 핵심 리조트 단지(Aqua City, NovaWorld 등)의 인프라 정비 및 공사 재개가 장기 성장 모멘텀의 전제 조건입니다. 정부 차원의 특별 태스크포스(TF) 지원에 따른 법적 규제 해소 여부가 향후 기업 가치 정상화의 최대 분수령이 될 전망입니다.`
        }
      ]
    }
    if (stockId === 'KR_078600') {
      return [
        {
          title: '1. 업종 및 시장 환경',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[배터리 시장] 전기차 배터리 시장의 에너지 밀도 향상 요구로 기존 흑연 음극재에 실리콘 음극재를 섞어 쓰는 비중이 급격히 확대되고 있습니다. 대주전자재료는 독보적인 실리콘 음극재 양산 기술력을 보유하여 글로벌 이차전지 소재 공급망에서 지위를 다지고 있습니다.`
        },
        {
          title: '2. 재무 건전성 및 리스크',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[CapEx 리스크] 대규모 실리콘 음극재 생산 능력 증설을 위한 지속적인 설비 투자가 수반되면서 차입 부채 증가 및 일시적 영업 현금 흐름 둔화 부담이 발생하고 있습니다. 투자 자금 대비 전기차 수요 캐즘(일시적 수요 둔화) 장기화 시 고정비 부담이 가중될 수 있어 철저한 예산 관리가 필요합니다.`
        },
        {
          title: '3. 성장 동력 및 가치 분석',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[성장 동력] 글로벌 메이저 완성차 기업들의 실리콘 음극재 적용 확대 모델 출시가 주당순이익(EPS) 및 밸류에이션 리레이팅의 핵심 엔진입니다. 차세대 제품 라인업 다변화를 통한 장기 성장이 기대됩니다.`
        }
      ]
    }
    if (stockId === 'US_AAPL') {
      return [
        {
          title: '1. 업종 및 시장 환경',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[시장 트렌드] 글로벌 프리미엄 스마트폰 수요 정체 속에서 기기 자체에서 AI 기능을 구동하는 온디바이스 AI(애플 인텔리전스)로의 패러다임 전환이 교체 수요를 자극하고 있습니다.`
        },
        {
          title: '2. 재무 건전성 및 리스크',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[재무분석] 애플은 연간 수천억 달러에 달하는 압도적 현금 창출력과 적극적 자사주 매입으로 강력한 재무 안정성을 보여주고 있습니다. 다만, 미국 및 유럽연합(EU)의 독점 규제 소송 및 앱스토어 수수료 구조 강제 개편 리스크가 최대 재무 위협 요인입니다.`
        },
        {
          title: '3. 성장 동력 및 가치 분석',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[성장엔진] 앱스토어, 서비스 구독 등 고마진 부문의 매출 비중 지속 증가와 신규 하드웨어 폼팩터(폴더블 아이폰 등) 도입이 장기 밸류에이션 성장을 견인할 전망입니다.`
        }
      ]
    }
    if (stockId === 'US_BA') {
      return [
        {
          title: '1. 업종 및 시장 환경',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[항공 산업] 글로벌 여객 수요 증가로 여객기 신규 인도 수요는 풍부하나, 공급망 차질과 제조 결함 이슈로 부품 조달 및 생산 적체가 전 세계적으로 장기화되고 있습니다.`
        },
        {
          title: '2. 재무 건전성 및 리스크',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[유동성 위기] 안전 결함 조사 및 737 MAX 조립 속도 둔화로 현금 소모가 심화되어 재무 등급 강등 위험과 부채 상환 부담이 지속되고 있습니다. 재무 구조 개선을 위한 추가 자본 조달 가능성이 잠재적 리스크입니다.`
        },
        {
          title: '3. 성장 동력 및 가치 분석',
          publisher: 'AI 분석 엔진',
          pubDate: '실시간',
          link: 'https://aistudio.google.com',
          content: `[가치 분석] 인도량 정상화와 품질 관리 신뢰성 회복이 최우선 선결 조건이며, 인도 지연으로 누적된 백오더(주문 대기분)의 안정적인 인도가 개시될 때 가치가 정상화될 것입니다.`
        }
      ]
    }

    // Default Neutral Fallback
    return [
      {
        title: '1. 업종 및 시장 환경',
        publisher: 'AI 분석 엔진',
        pubDate: '실시간',
        link: 'https://aistudio.google.com',
        content: `[시장 동향] ${stockName}이 속한 업계 전반의 디지털 전환 및 수요 변동성에 대응하여 시장 경쟁력 강화를 꾀하고 있습니다. 거시경제 변화와 글로벌 공급망 리스크 관리가 해당 업계의 주요 당면 과제로 대두되고 있습니다.`
      },
      {
        title: '2. 재무 건전성 및 리스크',
        publisher: 'AI 분석 엔진',
        pubDate: '실시간',
        link: 'https://aistudio.google.com',
        content: `[리스크 분석] 거시경제의 금리 변동 우려 속에서 ${stockName}의 안정적인 현금 흐름 확보와 부채 비율 조절 등 재무 건전성 리스크 관리가 화두입니다. 자본 운용 효율성 강화를 위해 영업 현금 흐름 개선에 주력하고 있습니다.`
      },
      {
        title: '3. 성장 동력 및 가치 분석',
        publisher: 'AI 분석 엔진',
        pubDate: '실시간',
        link: 'https://aistudio.google.com',
        content: `[가치 평가] ${stockName}은 주력 사업의 경쟁 우위 유지 및 운영 효율성 개선을 통해 중장기 영업 마진 확보와 신성장 포트폴리오 다변화를 추진 중이며, 이는 기업의 장기 가치 상승에 긍정적인 요인입니다.`
      }
    ]
  } else if (language === 'VI') {
    if (stockId === 'VN_NVL') {
      return [
        {
          title: '1. Ngành & Môi trường thị trường',
          publisher: 'AI phân tích',
          pubDate: 'Thực tế',
          link: 'https://aistudio.google.com',
          content: `[Môi trường] Thị trường bất động sản Việt Nam vẫn trầm lắng dù Chính phủ có chính sách hạ lãi suất và tháo gỡ pháp lý. Tiến độ cấp phép dự án chậm và tâm lý e ngại của người mua đang ảnh hưởng trực tiếp đến doanh số bán hàng của Novaland.`
        },
        {
          title: '2. Sức khỏe tài chính & Rủi ro',
          publisher: 'AI phân tích',
          pubDate: 'Thực tế',
          link: 'https://aistudio.google.com',
          content: `[Tài chính] Novaland đối mặt với rủi ro thanh khoản lớn do dư nợ trái phiếu đến hạn cao. Mặc dù công ty đang tích cực đàm phán gia hạn nợ và tái cơ cấu tài sản, tình trạng thiếu hụt dòng tiền ngắn hạn vẫn là thách thức cực kỳ nghiêm trọng.`
        },
        {
          title: '3. Động lực tăng trưởng & Định giá',
          publisher: 'AI phân tích',
          pubDate: 'Thực tế',
          link: 'https://aistudio.google.com',
          content: `[Triển vọng] Việc tái khởi công các dự án trọng điểm như Aqua City, NovaWorld Phan Thiết là chìa khóa phục hồi doanh thu. Tiến độ tháo gỡ pháp lý từ các tổ chức ban ngành sẽ quyết định việc đánh giá lại giá trị cổ phiếu NVL.`
        }
      ]
    }
    if (stockId === 'KR_078600') {
      return [
        {
          title: '1. Ngành & Môi trường thị trường',
          publisher: 'AI phân tích',
          pubDate: 'Thực tế',
          link: 'https://aistudio.google.com',
          content: `[Thị trường] Xu hướng tăng hàm lượng Silicon trong cực âm pin xe điện đang mở rộng mạnh mẽ. Daejoo Electronic Materials giữ vị thế dẫn đầu trong chuỗi cung ứng vật liệu pin toàn cầu nhờ công nghệ sản xuất hàng loạt độc quyền.`
        },
        {
          title: '2. Sức khỏe tài chính & Rủi ro',
          publisher: 'AI phân tích',
          pubDate: 'Thực tế',
          link: 'https://aistudio.google.com',
          content: `[Rủi ro CapEx] Chi phí đầu tư lớn cho việc nâng công suất nhà máy dẫn đến tăng nợ vay tài chính ngắn hạn. Nếu giai đoạn chững lại của thị trường xe điện toàn cầu kéo dài, chi phí cố định tăng cao có thể ảnh hưởng biên lợi nhuận.`
        },
        {
          title: '3. Động lực tăng trưởng & Định giá',
          publisher: 'AI phân tích',
          pubDate: 'Thực tế',
          link: 'https://aistudio.google.com',
          content: `[Động lực] Việc các hãng xe điện lớn tích hợp cực âm Silicon vào các dòng xe thế hệ mới là động lực thúc đẩy tăng trưởng định giá cổ phiếu.`
        }
      ]
    }

    // Default Neutral Fallback
    return [
      {
        title: '1. Ngành & Môi trường thị trường',
        publisher: 'AI phân tích',
        pubDate: 'Thực tế',
        link: 'https://aistudio.google.com',
        content: `[Thị trường] Doanh nghiệp ${stockName} đang nỗ lực nâng cao năng lực cạnh tranh trước các biến động về nhu cầu và xu hướng chuyển đổi số. Việc quản trị rủi ro chuỗi cung ứng là ưu tiên hàng đầu của ngành.`
      },
      {
        title: '2. Sức khỏe tài chính & Rủi ro',
        publisher: 'AI phân tích',
        pubDate: 'Thực tế',
        link: 'https://aistudio.google.com',
        content: `[Rủi ro tài chính] Quản trị rủi ro thanh khoản, duy trì dòng tiền ổn định và kiểm soát tỷ lệ nợ vay là những yếu tố then chốt đối với ${stockName} trong bối cảnh vĩ mô còn nhiều biến động về lãi suất.`
      },
      {
        title: '3. Động lực tăng trưởng & Định giá',
        publisher: 'AI phân tích',
        pubDate: 'Thực tế',
        link: 'https://aistudio.google.com',
        content: `[Triển vọng] Việc cải thiện hiệu quả vận hành và mở rộng danh mục kinh doanh cốt lõi của ${stockName} sẽ giúp củng cố biên lợi nhuận trung hạn, tạo tiền đề nâng cao định giá cổ phiếu.`
      }
    ]
  } else {
    if (stockId === 'VN_NVL') {
      return [
        {
          title: '1. Sector & Market Environment',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Market Outlook] The Vietnamese real estate sector remains sluggish despite government interest rate cuts and supportive policies. Delayed project approvals and slow market absorption rates directly pressure Novaland's presales performance.`
        },
        {
          title: '2. Financial Health & Debt Risks',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Debt Analysis] Novaland faces severe liquidity risks due to high corporate debt maturities. While management is actively restructuring debt and extending bond maturities, short-term cash flow constraints remain a critical threat.`
        },
        {
          title: '3. Growth Drivers & Valuation',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Valuation] Resuming construction at flagship projects like Aqua City and NovaWorld Phan Thiet is essential for revenue recovery. Resolution of legal bottlenecks under government support will be the primary driver for NVL's valuation recovery.`
        }
      ]
    }
    if (stockId === 'KR_078600') {
      return [
        {
          title: '1. Sector & Market Environment',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Sector Outlook] The adoption of silicon anode materials is expanding rapidly in the EV battery sector to enhance energy density. Daejoo Electronic Materials leads the industry with its proprietary mass production technology.`
        },
        {
          title: '2. Financial Health & Debt Risks',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[CapEx Risks] Continuous capital expenditures for factory expansion have led to increased debt and temporary cash flow pressure. Prolonged EV market slowdowns could raise fixed-cost burdens, requiring strict budget management.`
        },
        {
          title: '3. Growth Drivers & Valuation',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Valuation] The rollout of new EV models utilizing silicon anodes by major global OEMs serves as the primary catalyst for EPS and valuation multiple rerating.`
        }
      ]
    }
    if (stockId === 'US_AAPL') {
      return [
        {
          title: '1. Sector & Market Environment',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Market Environment] While premium smartphone demand remains mature, the transition to on-device AI (Apple Intelligence) is serving as a major catalyst for device upgrade cycles.`
        },
        {
          title: '2. Financial Health & Debt Risks',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Financial Health] Apple generates dominant free cash flows, supporting massive buybacks and dividends. However, regulatory antitrust lawsuits in the US and EU regarding App Store policies present the main risk.`
        },
        {
          title: '3. Growth Drivers & Valuation',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Valuation] The growing share of high-margin services revenue and potential smart form-factor innovations (such as foldable iPhones) support long-term valuation premiums.`
        }
      ]
    }
    if (stockId === 'US_BA') {
      return [
        {
          title: '1. Sector & Market Environment',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Industry Trend] While global passenger travel demand drives strong aircraft backlogs, supply chain bottlenecks and manufacturing quality issues constrain Boeing's production capacity.`
        },
        {
          title: '2. Financial Health & Debt Risks',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Liquidity Risk] Delivery delays and regulatory audits have increased cash burn, threatening credit ratings and raising debt burdens. Potential equity dilution for debt repayment remains a key concern.`
        },
        {
          title: '3. Growth Drivers & Valuation',
          publisher: 'AI Analyst',
          pubDate: 'Real-time',
          link: 'https://aistudio.google.com',
          content: `[Valuation] Restoring quality control credibility and normalizing delivery rates are crucial for Boeing. Valuation recovery depends on successfully clearing massive delivery backlogs.`
        }
      ]
    }

    // Default Neutral Fallback
    return [
      {
        title: '1. Sector & Market Environment',
        publisher: 'AI Analyst',
        pubDate: 'Real-time',
        link: 'https://aistudio.google.com',
        content: `[Market Trends] ${stockName} is enhancing its market competitiveness in response to digital transformation and demand shifts. Supply chain management remains a key focal point for the industry.`
      },
      {
        title: '2. Financial Health & Debt Risks',
        publisher: 'AI Analyst',
        pubDate: 'Real-time',
        link: 'https://aistudio.google.com',
        content: `[Risk Assessment] Managing financial health, maintaining stable free cash flows, and controlling debt ratios are central tasks for ${stockName} under macroeconomic fluctuations.`
      },
      {
        title: '3. Growth Drivers & Valuation',
        publisher: 'AI Analyst',
        pubDate: 'Real-time',
        link: 'https://aistudio.google.com',
        content: `[Valuation] Focus on improving operational efficiency and diversifying growth portfolios will support ${stockName}'s mid-term margin stability and drive long-term corporate value compounding.`
      }
    ]
  }
}

function CustomRevenueEpsChart({ stock, currentEps, language, t }: { stock: any; currentEps: number; language: string; t: any }) {
  let quarters = ['25.Q3', '25.Q4', '26.Q1', '26.Q2']
  let epsData = [
    Number((currentEps * 0.28).toFixed(2)),
    Number((currentEps * 0.22).toFixed(2)),
    Number((currentEps * 0.24).toFixed(2)),
    Number((currentEps * 0.26).toFixed(2))
  ]
  
  const shares = getSharesOutstanding(stock.ticker, stock.country)
  const npm = getNetProfitMargin(stock.industry)
  const quarterlyRevenues = epsData.map(qEps => (qEps * shares) / npm)
  
  const estimatedMarketCap = stock.currentPrice * shares
  const { label: unitLabel, divisor } = getRevenueUnitAndScale(stock.country, estimatedMarketCap)
  
  let revenueData = quarterlyRevenues.map(rev => Math.round(rev / divisor))

  if (stock.quarterlyData && stock.quarterlyData.length >= 3) {
    quarters = stock.quarterlyData.map((q: any) => q.quarter)
    epsData = stock.quarterlyData.map((q: any) => q.eps)
    revenueData = stock.quarterlyData.map((q: any) => Math.round(q.revenue / divisor))
  }
  
  const maxRevenue = Math.max(...revenueData) * 1.15
  const maxEps = Math.max(...epsData) * 1.15

  // SVG dimensions
  const width = 360
  const height = 140
  const padding = { top: 20, right: 35, bottom: 20, left: 35 }

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  return (
    <div className="bg-gradient-to-b from-slate-900/80 via-slate-950/90 to-slate-950/90 border border-indigo-500/25 rounded-2xl p-4 space-y-3 shadow-xl">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-300">{t('quarterlyRevenueEps')}</span>
        <div className="flex gap-3 text-[9px] font-bold">
          <span className="text-indigo-400 flex items-center gap-1">
            <span className="inline-block w-2.5 h-1.5 bg-indigo-500 rounded" />
            {language === 'KO' ? '매출' : language === 'VI' ? 'Doanh thu' : 'Revenue'} ({unitLabel})
          </span>
          <span className="text-teal-400 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full border border-teal-400 bg-slate-950" />
            EPS
          </span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
            const y = padding.top + chartHeight * r
            return (
              <line
                key={i}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="2"
              />
            )
          })}

          {/* Bar Charts (Revenue) */}
          {revenueData.map((val, idx) => {
            const barWidth = 24
            const x = padding.left + (chartWidth / 4) * idx + (chartWidth / 8) - barWidth / 2
            const barHeight = maxRevenue === 0 ? 0 : (val / maxRevenue) * chartHeight
            const y = padding.top + chartHeight - barHeight

            return (
              <g key={idx} className="group/bar">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={`url(#revGrad_${idx})`}
                  rx="3"
                  className="transition-all duration-300 hover:opacity-80"
                />
                <defs>
                  <linearGradient id={`revGrad_${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                {/* Value tooltip */}
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  fill="#94a3b8"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="opacity-0 group-hover/bar:opacity-100 transition-opacity"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            )
          })}

          {/* Line Chart (EPS) */}
          {(() => {
            const points = epsData.map((val, idx) => {
              const x = padding.left + (chartWidth / 4) * idx + (chartWidth / 8)
              const y = padding.top + chartHeight - (maxEps === 0 ? 0 : (val / maxEps) * chartHeight)
              return { x, y, val }
            })

            const d = points.reduce((path, p, i) => {
              return path + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
            }, '')

            return (
              <g>
                {/* Line Path */}
                <path
                  d={d}
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Dots */}
                {points.map((p, idx) => (
                  <g key={idx} className="group/dot">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#0f172a"
                      stroke="#2dd4bf"
                      strokeWidth="2"
                      className="cursor-pointer"
                    />
                    {/* Tooltip value */}
                    <text
                      x={p.x}
                      y={p.y - 8}
                      fill="#2dd4bf"
                      fontSize="8"
                      fontWeight="black"
                      textAnchor="middle"
                      className="opacity-0 group-hover/dot:opacity-100 transition-opacity"
                    >
                      {p.val.toLocaleString()}
                    </text>
                  </g>
                ))}
              </g>
            )
          })()}

          {/* X Axis Labels */}
          {quarters.map((q, idx) => {
            const x = padding.left + (chartWidth / 4) * idx + (chartWidth / 8)
            return (
              <text
                key={idx}
                x={x}
                y={height - 4}
                fill="#64748b"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
              >
                {q}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function CustomBpsChart({ stock, currentPrice, t }: { stock: any; currentPrice: number; t: any }) {
  let quarters = ['25.Q3', '25.Q4', '26.Q1', '26.Q2']
  const pb = getPbMultiple(stock.industry)
  const baseBps = currentPrice / pb
  let bpsData = [
    Math.round(baseBps * 0.94),
    Math.round(baseBps * 0.96),
    Math.round(baseBps * 0.98),
    Math.round(baseBps * 1.0)
  ]

  if (stock.quarterlyData && stock.quarterlyData.length >= 3) {
    quarters = stock.quarterlyData.map((q: any) => q.quarter)
    bpsData = stock.quarterlyData.map((q: any) => Math.round(q.bps))
  }

  const maxBps = Math.max(...bpsData) * 1.1
  const minBps = Math.min(...bpsData) * 0.9

  // SVG dimensions
  const width = 360
  const height = 140
  const padding = { top: 20, right: 25, bottom: 20, left: 25 }

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  return (
    <div className="bg-gradient-to-b from-slate-900/80 via-slate-950/90 to-slate-950/90 border border-emerald-500/25 rounded-2xl p-4 space-y-3 shadow-xl">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-300">{t('quarterlyBps')}</span>
        <span className="text-emerald-400 text-[10px] font-bold font-mono">
          BPS: {bpsData[bpsData.length - 1].toLocaleString()} {stock.currency}
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
            const y = padding.top + chartHeight * r
            return (
              <line
                key={i}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="2"
              />
            )
          })}

          {/* Area & Line Chart */}
          {(() => {
            const points = bpsData.map((val, idx) => {
              const x = padding.left + (chartWidth / (bpsData.length - 1)) * idx
              const diff = maxBps - minBps
              const ratio = diff === 0 ? 0 : (val - minBps) / diff
              const y = padding.top + chartHeight - ratio * chartHeight
              return { x, y, val }
            })

            const lineD = points.reduce((path, p, i) => {
              return path + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
            }, '')

            const areaD = lineD + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`

            return (
              <g>
                {/* Area Gradient Path */}
                <path d={areaD} fill="url(#areaGrad)" />
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Line Path */}
                <path
                  d={lineD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Dots & Tooltips */}
                {points.map((p, idx) => (
                  <g key={idx} className="group/bpsdot">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4.5"
                      fill="#0f172a"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      className="cursor-pointer"
                    />
                    <text
                      x={p.x}
                      y={p.y - 8}
                      fill="#10b981"
                      fontSize="8"
                      fontWeight="black"
                      textAnchor="middle"
                      className="opacity-0 group-hover/bpsdot:opacity-100 transition-opacity"
                    >
                      {p.val.toLocaleString()}
                    </text>
                  </g>
                ))}
              </g>
            )
          })()}

          {/* X Axis Labels */}
          {quarters.map((q, idx) => {
            const x = padding.left + (chartWidth / (quarters.length - 1)) * idx
            return (
              <text
                key={idx}
                x={x}
                y={height - 4}
                fill="#64748b"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
              >
                {q}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function ConsensusCompareChart({ stock, currentPrice, fairPrice, language, t }: { stock: any; currentPrice: number; fairPrice: number; language: string; t: any }) {
  const hasConsensus = Boolean(stock.consensusTarget && Number(stock.consensusTarget) > 0)
  const consensusTarget = hasConsensus ? Math.round(Number(stock.consensusTarget)) : 0
  const currency = stock.currency

  const isUpside = fairPrice >= currentPrice
  const upsidePct = Math.abs(((fairPrice - currentPrice) / (currentPrice || 1)) * 100).toFixed(1)

  // SVG parameters for the clean S-curve
  const svgWidth = 500
  const svgHeight = 64
  const paddingX = 40
  const chartWidth = svgWidth - paddingX * 2

  // Dynamic S-curve coordinates based on upside / downside direction:
  const getCoords = (pct: number) => {
    const t = Math.max(0, Math.min(1, pct / 100))
    const x = paddingX + t * chartWidth
    // S-curve cosine mapping (centered around y=32):
    const y = isUpside 
      ? (32 + 14 * Math.cos(Math.PI * t)) 
      : (32 - 14 * Math.cos(Math.PI * t))
    return { x, y }
  }

  // Value-to-percentage mapping:
  const cpPct = 18
  const fpPct = 82
  
  // Place consensus target proportionally relative to Current Price and Fair Price
  let ctPct = 50
  if (hasConsensus && consensusTarget > 0) {
    if (isUpside) {
      if (consensusTarget <= currentPrice) {
        ctPct = Math.max(8, 18 - (Math.min(1, (currentPrice - consensusTarget) / (currentPrice || 1))) * 10)
      } else if (consensusTarget >= fairPrice) {
        ctPct = Math.min(92, 82 + (Math.min(1, (consensusTarget - fairPrice) / (fairPrice || 1))) * 10)
      } else {
        const ratio = (consensusTarget - currentPrice) / Math.max(1, (fairPrice - currentPrice))
        ctPct = 18 + ratio * 64
      }
    } else {
      if (consensusTarget >= currentPrice) {
        ctPct = Math.max(8, 18 - (Math.min(1, (consensusTarget - currentPrice) / (currentPrice || 1))) * 10)
      } else if (consensusTarget <= fairPrice) {
        ctPct = Math.min(92, 82 + (Math.min(1, (fairPrice - consensusTarget) / (fairPrice || 1))) * 10)
      } else {
        const ratio = (currentPrice - consensusTarget) / Math.max(1, (currentPrice - fairPrice))
        ctPct = 18 + ratio * 64
      }
    }
  }

  const pCp = getCoords(cpPct)
  const pFp = getCoords(fpPct)
  const pCt = hasConsensus ? getCoords(ctPct) : null

  // Generate smooth curve path
  const startY = isUpside ? 46 : 18
  let curvePath = `M ${paddingX},${startY}`
  for (let i = 1; i <= 100; i++) {
    const pt = getCoords(i)
    curvePath += ` L ${pt.x},${pt.y}`
  }

  // Define price items with their coordinates and styles
  const allItems: any[] = [
    {
      id: 'cp',
      label: t('currentPrice'),
      val: currentPrice,
      color: '#f1f5f9',
      borderClass: 'border-slate-700/70',
      glowColor: '#f1f5f9',
      bgGlow: 'from-slate-500/10 to-transparent',
      x: pCp.x,
      y: pCp.y
    },
    {
      id: 'fp',
      label: t('fairPrice'),
      val: fairPrice,
      color: isUpside ? '#34d399' : '#f87171',
      borderClass: isUpside ? 'border-emerald-500/40' : 'border-rose-500/40',
      glowColor: isUpside ? '#34d399' : '#f87171',
      bgGlow: isUpside ? 'from-emerald-500/10 to-transparent' : 'from-rose-500/10 to-transparent',
      x: pFp.x,
      y: pFp.y
    }
  ]

  if (hasConsensus && pCt) {
    allItems.push({
      id: 'ct',
      label: t('analystTarget'),
      val: consensusTarget,
      color: '#fbbf24',
      borderClass: 'border-amber-500/40',
      glowColor: '#fbbf24',
      bgGlow: 'from-amber-500/10 to-transparent',
      x: pCt.x,
      y: pCt.y
    })
  }

  // Sort items from left-to-right to match exactly the dots on the curve
  const sortedItems = [...allItems].sort((a, b) => a.x - b.x)

  return (
    <div className="bg-gradient-to-b from-slate-900/80 via-slate-950/90 to-slate-950/90 border border-cyan-500/25 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Header Bar */}
      <div className="flex justify-between items-center text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold text-slate-200 text-sm">{t('consensusVsFair')}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {!hasConsensus && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
              {language === 'KO' ? '증권사 목표가: 데이터 없음' : language === 'VI' ? 'Mục tiêu CTCK: Không có dữ liệu' : 'Analyst Target: No Data'}
            </span>
          )}
          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border shadow-sm ${
            isUpside 
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' 
              : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
          }`}>
            {language === 'KO'
              ? `적정가와 ${isUpside ? '+' : '-'}${upsidePct}% 차이 (${isUpside ? '저평가' : '고평가'})`
              : language === 'VI'
              ? `Chênh lệch ${isUpside ? '+' : '-'}${upsidePct}% (${isUpside ? 'Định giá thấp' : 'Định giá cao'})`
              : `${isUpside ? '+' : '-'}${upsidePct}% vs Fair Value (${isUpside ? 'Undervalued' : 'Overvalued'})`}
          </span>
        </div>
      </div>

      {/* Clean S-Curve SVG with only highlight dots */}
      <div className="relative py-1">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none overflow-visible">
          <defs>
            <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
              {isUpside ? (
                <>
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0.9" />
                </>
              )}
            </linearGradient>
          </defs>

          {/* S-curve background line for visual depth */}
          <path
            d={curvePath}
            fill="none"
            stroke="#090d16"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Colored active S-curve path */}
          <path
            d={curvePath}
            fill="none"
            stroke="url(#curveGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Render Pure Highlight Dots on the Curve */}
          {allItems.map((dot, idx) => (
            <g key={idx}>
              {/* Outer pulsing aura glow */}
              <circle
                cx={dot.x}
                cy={dot.y}
                r="10"
                fill={dot.color}
                opacity="0.25"
                className="animate-pulse"
              />
              {/* Outer stroke rim */}
              <circle
                cx={dot.x}
                cy={dot.y}
                r="6"
                fill={dot.color}
                stroke="#030712"
                strokeWidth="2.5"
              />
              {/* Center shiny core dot */}
              <circle
                cx={dot.x}
                cy={dot.y}
                r="2"
                fill="#ffffff"
                opacity="0.9"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Standardized Summary Cards (Order matches the curve dots exactly) */}
      <div className={`grid gap-1.5 sm:gap-2.5 ${hasConsensus ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {sortedItems.map((item) => (
          <div
            key={item.id}
            className={`relative overflow-hidden rounded-xl p-2 sm:p-3 bg-gradient-to-b ${item.bgGlow} bg-slate-900/60 border ${item.borderClass} shadow-md flex flex-col justify-between space-y-1 sm:space-y-1.5 transition-all hover:bg-slate-900/90`}
          >
            {/* Top Row: Color Dot & Label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 tracking-tight truncate">
                  {item.label}
                </span>
              </div>
            </div>

            {/* Middle Row: Formatted Value */}
            <div className="text-xs sm:text-base lg:text-lg font-black font-mono tracking-tight text-white whitespace-nowrap truncate">
              {currency} {Math.round(item.val).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Helpers & Custom SVG Charting Components with realistic scaling
 */

const getSharesOutstanding = (ticker: string, country: string) => {
  if (country === 'US') {
    if (['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMZN', 'META'].includes(ticker)) {
      return 6_000_000_000
    }
    return 1_500_000_000
  }
  if (country === 'KR') {
    switch (ticker) {
      case '005930': return 5_970_000_000 // Samsung
      case '000660': return 728_000_000   // SK Hynix
      case '005380': return 213_000_000   // Hyundai
      case '000270': return 400_000_000   // Kia
      case '035420': return 160_000_000   // NAVER
      case '035720': return 440_000_000   // Kakao
      case '068270': return 217_000_000   // Celltrion
      case '105560': return 400_000_000   // KB Financial
      case '055550': return 510_000_000   // Shinhan Financial
      default: return 20_000_000
    }
  }
  if (country === 'VN') {
    return 1_500_000_000
  }
  if (country === 'CN') {
    return 4_000_000_000
  }
  return 100_000_000
}

const getNetProfitMargin = (industry: string) => {
  const ind = industry.toLowerCase()
  if (ind.includes('금융') || ind.includes('은행') || ind.includes('bank') || ind.includes('finance')) {
    return 0.15
  }
  if (ind.includes('양방향') || ind.includes('미디어') || ind.includes('소프트웨어') || ind.includes('software') || ind.includes('game') || ind.includes('게임')) {
    return 0.20
  }
  if (ind.includes('반도체') || ind.includes('semiconductor') || ind.includes('it')) {
    return 0.12
  }
  return 0.08
}

const getPbMultiple = (industry: string) => {
  const ind = industry.toLowerCase()
  if (ind.includes('금융') || ind.includes('은행') || ind.includes('bank') || ind.includes('finance')) {
    return 0.8
  }
  if (ind.includes('양방향') || ind.includes('미디어') || ind.includes('소프트웨어') || ind.includes('software') || ind.includes('game') || ind.includes('게임') || ind.includes('반도체') || ind.includes('semiconductor')) {
    return 3.0
  }
  return 1.8
}

const getRevenueUnitAndScale = (country: string, estimatedMarketCap: number) => {
  switch (country) {
    case 'KR':
      if (estimatedMarketCap >= 5_000_000_000_000) {
        return { label: '조원', divisor: 1_000_000_000_000, format: (v: number) => v.toFixed(1) }
      } else {
        return { label: '억원', divisor: 100_000_000, format: (v: number) => Math.round(v).toLocaleString() }
      }
    case 'US':
      return { label: 'Billion $', divisor: 1_000_000_000, format: (v: number) => v.toFixed(1) }
    case 'VN':
      return { label: 'Tỷ ₫', divisor: 1_000_000_000, format: (v: number) => Math.round(v).toLocaleString() }
    case 'CN':
      return { label: '억 元', divisor: 100_000_000, format: (v: number) => v.toFixed(1) }
    default:
      return { label: 'Billion', divisor: 1_000_000_000, format: (v: number) => v.toFixed(1) }
  }
}
