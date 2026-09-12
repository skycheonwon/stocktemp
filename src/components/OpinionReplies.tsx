import React, { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, increment } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { MessageSquare, CornerDownRight, Trash2, Send, User } from 'lucide-react'

interface Reply {
  id: string
  uid: string
  displayName: string
  photoURL: string | null
  content: string
  createdAt: any
}

interface OpinionRepliesProps {
  opinionId: string
  stockId: string
  parentCollection?: 'recommendations' | 'discussions'
}

export default function OpinionReplies({ opinionId, stockId, parentCollection = 'discussions' }: OpinionRepliesProps) {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [replies, setReplies] = useState<Reply[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRepliesOpen, setIsRepliesOpen] = useState(false)

  // Subscribes to real-time replies for this opinion
  useEffect(() => {
    const q = query(
      collection(db, parentCollection, opinionId, 'replies'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Reply[] = []
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Reply)
      })
      setReplies(list)
    }, (error) => {
      console.error('Error listening to replies:', error)
    })

    return () => unsubscribe()
  }, [opinionId, parentCollection])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim()) return

    if (content.trim().length > 200) {
      alert(
        language === 'KO'
          ? '답글은 200자 이하로 작성해 주세요.'
          : language === 'VI'
          ? 'Phản hồi phải từ 200 ký tự trở xuống.'
          : 'Reply must be 200 characters or less.'
      )
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, parentCollection, opinionId, 'replies'), {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || null,
        content: content.trim(),
        createdAt: serverTimestamp(),
        stockId // For potential analytics or collectionGroup query index
      })
      setContent('')
      
      // Increment user's commentCount
      await updateDoc(doc(db, 'users', user.uid), {
        commentCount: increment(1)
      }).catch(err => console.error("Error updating user comment stats:", err))
    } catch (error) {
      console.error('Error adding reply:', error)
      alert(
        language === 'KO'
          ? '답글 등록에 실패했습니다.'
          : language === 'VI'
          ? 'Lỗi đăng phản hồi.'
          : 'Failed to post reply.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (replyId: string) => {
    const confirmMessage =
      language === 'KO'
        ? '정말 이 답글을 삭제하시겠습니까?'
        : language === 'VI'
        ? 'Bạn có chắc chắn muốn xóa phản hồi này?'
        : 'Are you sure you want to delete this reply?'

    if (!confirm(confirmMessage)) return

    try {
      await deleteDoc(doc(db, parentCollection, opinionId, 'replies', replyId))
      
      // Decrement user's commentCount
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          commentCount: increment(-1)
        }).catch(err => console.error("Error updating user comment stats:", err))
      }
    } catch (error) {
      console.error('Error deleting reply:', error)
      alert(
        language === 'KO'
          ? '답글 삭제에 실패했습니다.'
          : language === 'VI'
          ? 'Lỗi xóa phản hồi.'
          : 'Failed to delete reply.'
      )
    }
  }

  const formatReplyTimestamp = (createdAt: any) => {
    if (!createdAt) return ''
    const date = new Date(createdAt.seconds * 1000)
    return date.toLocaleDateString(
      language === 'KO' ? 'ko-KR' : language === 'VI' ? 'vi-VN' : 'en-US',
      { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    )
  }

  // Translates text label
  const tLabel = (key: 'replies' | 'writeReply' | 'loginToReply' | 'submit' | 'noReplies') => {
    const translations = {
      KO: {
        replies: `답글 ${replies.length}개`,
        writeReply: '답글을 입력하세요 (200자 이하)...',
        loginToReply: '로그인 후 답글을 달 수 있습니다.',
        submit: '등록',
        noReplies: '아직 등록된 답글이 없습니다.'
      },
      EN: {
        replies: `${replies.length} ${replies.length === 1 ? 'Reply' : 'Replies'}`,
        writeReply: 'Write a reply (200 chars or less)...',
        loginToReply: 'Please log in to leave a reply.',
        submit: 'Post',
        noReplies: 'No replies yet.'
      },
      VI: {
        replies: `${replies.length} Phản hồi`,
        writeReply: 'Viết phản hồi (tối đa 200 ký tự)...',
        loginToReply: 'Vui lòng đăng nhập để phản hồi.',
        submit: 'Gửi',
        noReplies: 'Chưa có phản hồi nào.'
      }
    }
    const lang = (language === 'KO' || language === 'VI') ? language : 'EN'
    return translations[lang][key]
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-800/40">
      {/* Replies header trigger button */}
      <button
        onClick={() => setIsRepliesOpen(!isRepliesOpen)}
        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-indigo-400 transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>{tLabel('replies')}</span>
        <span className="text-[10px] text-slate-500 font-normal">
          {isRepliesOpen ? '▴' : '▾'}
        </span>
      </button>

      {/* Expanded replies container */}
      {isRepliesOpen && (
        <div className="mt-3 pl-3 sm:pl-4 space-y-3 relative border-l border-slate-800/80 ml-1">
          {/* Loop through replies */}
          {replies.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic py-1 pl-2">
              {tLabel('noReplies')}
            </p>
          ) : (
            replies.map((reply) => {
              const isMyReply = user && reply.uid === user.uid
              return (
                <div 
                  key={reply.id} 
                  className="flex gap-2.5 items-start group"
                >
                  {/* Nesting connector curve indication */}
                  <CornerDownRight className="w-3.5 h-3.5 text-slate-700 mt-1 shrink-0" />

                  <div className="flex-1 bg-slate-950/40 border border-slate-900/60 rounded-2xl p-2.5 hover:border-slate-800/60 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        {reply.photoURL ? (
                          <img 
                            src={reply.photoURL} 
                            alt="Avatar" 
                            className="w-5 h-5 rounded-full border border-slate-850"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">
                            <User className="w-2.5 h-2.5 text-slate-500" />
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-300">
                          {reply.displayName}
                        </span>
                        {isMyReply && (
                          <span className="text-[8px] font-bold text-blue-400 bg-blue-500/10 px-1 py-0.2 rounded uppercase">
                            Me
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-500 font-mono flex items-center gap-0.5 font-bold">
                          {formatReplyTimestamp(reply.createdAt)}
                        </span>
                        {isMyReply && (
                          <button
                            onClick={() => handleDelete(reply.id)}
                            className="text-slate-650 hover:text-rose-450 p-0.5 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-350 leading-relaxed font-normal pl-5">
                      {reply.content}
                    </p>
                  </div>
                </div>
              )
            })
          )}

          {/* Reply Form */}
          <div className="flex gap-2.5 items-start mt-4 pt-1">
            <CornerDownRight className="w-3.5 h-3.5 text-slate-700 mt-2.5 shrink-0" />
            
            {user ? (
              <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={tLabel('writeReply')}
                  disabled={loading}
                  className="flex-1 bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="px-3 py-1.5 bg-indigo-650/90 hover:bg-indigo-600 active:scale-95 disabled:opacity-40 text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                >
                  <Send className="w-3 h-3" />
                  <span>{tLabel('submit')}</span>
                </button>
              </form>
            ) : (
              <div className="flex-1 bg-slate-950/10 border border-slate-900 border-dashed rounded-xl px-3 py-2 text-center">
                <span className="text-[10px] text-slate-500">
                  {tLabel('loginToReply')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
