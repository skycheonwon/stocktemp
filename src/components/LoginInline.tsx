import { useState } from 'react'
import { LogIn, Mail, Lock, User, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LegalModal from './LegalModal'

interface LoginInlineProps {
  onSuccess?: () => void;
  className?: string;
  defaultEmailExpanded?: boolean;
}

type ModalMode = 'signin' | 'signup' | 'forgot'

export default function LoginInline({ onSuccess, className = '', defaultEmailExpanded = false }: LoginInlineProps) {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword } = useAuth()
  const { language } = useLanguage()

  // UI Modes & Forms States
  const [mode, setMode] = useState<ModalMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Accordion toggle for Email Login (sub-login)
  const [isEmailExpanded, setIsEmailExpanded] = useState(defaultEmailExpanded)

  // Legal Modal State
  const [legalOpen, setLegalOpen] = useState(false)
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy'>('terms')

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return language === 'KO' ? '유효하지 않은 이메일 형식입니다.' : 'Invalid email format.'
      case 'auth/user-disabled':
        return language === 'KO' ? '비활성화된 계정입니다.' : 'This account is disabled.'
      case 'auth/user-not-found':
        return language === 'KO' ? '등록되지 않은 이메일입니다.' : 'Email not found.'
      case 'auth/wrong-password':
        return language === 'KO' ? '비밀번호가 올바르지 않습니다.' : 'Incorrect password.'
      case 'auth/email-already-in-use':
        return language === 'KO' ? '이미 가입된 이메일 주소입니다.' : 'Email is already in use.'
      case 'auth/weak-password':
        return language === 'KO' ? '비밀번호는 최소 6자 이상이어야 합니다.' : 'Password must be at least 6 characters.'
      default:
        return language === 'KO' ? '요청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.' : 'An error occurred. Please try again.'
    }
  }

  const resetFormStates = () => {
    setError(null)
    setInfoMessage(null)
    setEmail('')
    setPassword('')
    setDisplayName('')
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setInfoMessage(null)
    setLoading(true)
    try {
      await loginWithGoogle()
      resetFormStates()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error(err)
      setError(
        language === 'KO' 
          ? '구글 로그인 중 오류가 발생했습니다.' 
          : 'Failed to sign in with Google.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)
    setLoading(true)

    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password)
        resetFormStates()
        if (onSuccess) onSuccess()
      } else if (mode === 'signup') {
        if (!displayName.trim()) {
          setError(language === 'KO' ? '닉네임을 입력해 주세요.' : 'Please enter a nickname.')
          setLoading(false)
          return
        }
        await registerWithEmail(email, password, displayName.trim())
        resetFormStates()
        if (onSuccess) onSuccess()
      } else if (mode === 'forgot') {
        await resetPassword(email)
        setInfoMessage(
          language === 'KO' 
            ? '비밀번호 재설정 링크가 이메일로 발송되었습니다!' 
            : 'Password reset link has been sent to your email!'
        )
        setMode('signin')
        setPassword('')
      }
    } catch (err: any) {
      console.error(err)
      setError(getFirebaseErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Google Login (Main) */}
      {mode !== 'forgot' && (
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 text-slate-900 text-sm font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>
            {language === 'KO' ? 'Google 계정으로 계속하기' : 'Continue with Google'}
          </span>
        </button>
      )}

      {/* Info & Error Banner */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-semibold text-center animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}
      {infoMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-semibold text-center animate-in fade-in slide-in-from-top-1">
          {infoMessage}
        </div>
      )}

      {/* Sub Login Option: Email Accordion Header */}
      {mode === 'signin' && (
        <div className="border-t border-slate-800/80 pt-2.5">
          <button
            type="button"
            onClick={() => setIsEmailExpanded(!isEmailExpanded)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-400 py-1 transition-colors uppercase tracking-wider"
          >
            <span>{language === 'KO' ? '또는 이메일 로그인' : 'or login with email'}</span>
            {isEmailExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Email Login/Signup Form Accordion Panel */}
      {(isEmailExpanded || mode !== 'signin') && (
        <form onSubmit={handleEmailAction} className="space-y-4 pt-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Display Name Input (Signup only) */}
          {mode === 'signup' && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'KO' ? '닉네임 *' : 'Nickname *'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder={language === 'KO' ? '닉네임 입력' : 'Nickname'}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-655 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              {language === 'KO' ? '이메일 주소 *' : 'Email Address *'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-855 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-655 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password Input */}
          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {language === 'KO' ? '비밀번호 *' : 'Password *'}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot')
                      setError(null)
                      setInfoMessage(null)
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                  >
                    {language === 'KO' ? '비밀번호 분실?' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder={mode === 'signup' ? (language === 'KO' ? '최소 6자 이상' : 'Min 6 characters') : '••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-855 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-655 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span>{language === 'KO' ? '처리 중...' : 'Processing...'}</span>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>
                  {mode === 'signin' 
                    ? (language === 'KO' ? '이메일 로그인' : 'Sign In') 
                    : mode === 'signup' 
                    ? (language === 'KO' ? '가입 완료' : 'Complete Sign Up') 
                    : (language === 'KO' ? '재설정 이메일 전송' : 'Send Reset Link')}
                </span>
              </>
            )}
          </button>

          {/* Mode Switch Footers */}
          <div className="text-center pt-2 border-t border-slate-850/50">
            {mode === 'signin' ? (
              <p className="text-xs text-slate-500">
                {language === 'KO' ? '계정이 없으신가요?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    resetFormStates()
                  }}
                  className="text-blue-400 hover:text-blue-300 font-bold hover:underline"
                >
                  {language === 'KO' ? '회원가입 하기' : 'Sign Up'}
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  resetFormStates()
                  setIsEmailExpanded(true)
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === 'KO' ? '로그인 화면으로 돌아가기' : 'Back to Login'}</span>
              </button>
            )}
          </div>

        </form>
      )}

      {/* Legal Consent Notice under Decree 13 */}
      <div className="pt-3 text-center text-[10px] text-slate-500 leading-relaxed border-t border-slate-850/40 select-none">
        <span>
          {language === 'KO' 
            ? '계속 진행 시 ' 
            : language === 'VI' 
            ? 'Bằng việc tiếp tục, bạn đồng ý với ' 
            : 'By continuing, you agree to our '}
        </span>
        <button
          type="button"
          onClick={() => { setLegalTab('terms'); setLegalOpen(true); }}
          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer font-semibold"
        >
          {language === 'KO' ? '이용약관' : language === 'VI' ? 'Điều khoản dịch vụ' : 'Terms of Service'}
        </button>
        <span>
          {language === 'KO' ? ' 및 ' : language === 'VI' ? ' và ' : ' & '}
        </span>
        <button
          type="button"
          onClick={() => { setLegalTab('privacy'); setLegalOpen(true); }}
          className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer font-semibold"
        >
          {language === 'KO' ? '개인정보 처리방침' : language === 'VI' ? 'Chính sách bảo mật' : 'Privacy Policy'}
        </button>
        <span>
          {language === 'KO' ? '에 동의하는 것으로 간주됩니다.' : language === 'VI' ? '.' : '.'}
        </span>
      </div>

      <LegalModal
        isOpen={legalOpen}
        initialTab={legalTab}
        onClose={() => setLegalOpen(false)}
      />
    </div>
  )
}
