import { X, AlertTriangle, Snowflake, Wind, CloudSun, Sun, Flame } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import StockTempLogo from './StockTempLogo'

interface TemperatureGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TemperatureGuideModal({ isOpen, onClose }: TemperatureGuideModalProps) {
  const { language } = useLanguage()

  if (!isOpen) return null

  const content = {
    KO: {
      title: '주식 체감온도 산정 가이드',
      subtitle: '인간의 주관적 의견을 배제하고, 객관적 AI 수학 모델로 산출되는 밸류에이션 지표입니다.',
      section1Title: 'AI 적정가 및 체감온도 산출 원리',
      section1Desc: 'StockTemp의 체감온도는 인간 애널리스트나 운영자의 주관적인 의견 개입 없이, 100% AI 알고리즘과 수학적 재무 시뮬레이션 모델에 의해 객관적으로 자동 산출됩니다. 기업의 실적 펀더멘털, 역사적 PER·PBR 밸류에이션 밴드, 시장 컨센서스 괴리율, 기술적 모멘텀 지표를 종합 분석하여 -30°C부터 +50°C 이상의 체감온도로 수치화합니다.',
      rangesTitle: '체감온도 5단계 구간 정의',
      ranges: [
        {
          temp: '🥶 0°C 미만',
          status: '극저평가 (겨울)',
          color: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
          icon: Snowflake,
          desc: '기업의 재무 펀더멘털 및 역사적 밸류에이션 밴드 대비 주가가 영하권의 극심한 저평가 영역에 머물러 있는 상태입니다.'
        },
        {
          temp: '🌱 0°C ~ 16°C',
          status: '저평가 (봄)',
          color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60',
          icon: Wind,
          desc: '초봄의 쌀쌀한 기온처럼 과거 밸류에이션 평균치 대비 상대적 저평가 영역에 위치한 상태입니다.'
        },
        {
          temp: '🍂 17°C ~ 26°C',
          status: '가을 (적정가)',
          color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
          icon: CloudSun,
          desc: '가을철의 쾌적한 평년 기온처럼 기업의 실적, 자산가치 및 시장 멀티플에 부합하는 균형 가치 구간(기준점: 21°C)입니다.'
        },
        {
          temp: '☀️ 27°C ~ 32°C',
          status: '고평가 (여름)',
          color: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
          icon: Sun,
          desc: '본격적인 여름 더위처럼 밸류에이션 지표가 역사적 평균 상단에 진입하여 과열 조짐을 보이는 상태입니다.'
        },
        {
          temp: '🔥 33°C 이상',
          status: '극고평가 (한여름)',
          color: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
          icon: Flame,
          desc: '기상청 폭염특보 기준(33°C 이상)에 도달하여 역사적 밸류에이션 밴드 상단을 초과한 통계적 최상단 상태입니다.'
        }
      ],
      notice: '⚠️ 본 체감온도는 AI 알고리즘에 의한 수학적 시뮬레이션 지표이며, 특정 종목의 매수·매도 권유나 투자 자문이 아닙니다. 최종 투자 판단과 책임은 투자자 본인에게 있습니다.',
      closeBtn: '확인 및 닫기'
    },
    EN: {
      title: 'Stock Temperature Guide',
      subtitle: 'An objective valuation metric computed 100% via AI mathematical algorithms without human bias.',
      section1Title: 'AI Fair Value & Temperature Calculation Principle',
      section1Desc: 'StockTemp temperature is calculated 100% automatically by AI algorithms and mathematical simulation models without any human subjective opinions or manual intervention. It synthesizes corporate earnings fundamentals, historic PER/PBR valuation bands, consensus target divergence, and technical indicators into an objective temperature scale.',
      rangesTitle: '5-Stage Temperature Classification',
      ranges: [
        {
          temp: '🥶 Below 0°C',
          status: 'Deep Undervalued (Winter)',
          color: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
          icon: Snowflake,
          desc: 'Stock price is positioned at freezing temperatures (<0°C), deeply undervalued relative to financial fundamentals.'
        },
        {
          temp: '🌱 0°C ~ 16°C',
          status: 'Undervalued (Spring)',
          color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60',
          icon: Wind,
          desc: 'Cool spring temperatures where the stock is trading with a substantial discount relative to historic averages.'
        },
        {
          temp: '⛅ 17°C ~ 26°C',
          status: 'Fair Value (Autumn)',
          color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
          icon: CloudSun,
          desc: 'Comfortable temperate climate zone where market price aligns with corporate fundamentals (Benchmark: 21°C).'
        },
        {
          temp: '☀️ 27°C ~ 32°C',
          status: 'Overvalued (Summer)',
          color: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
          icon: Sun,
          desc: 'Warm summer temperatures where valuation multiples enter upper statistical bands.'
        },
        {
          temp: '🔥 33°C & Above',
          status: 'Deep Overvalued (Hot Summer)',
          color: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
          icon: Flame,
          desc: 'Extreme heatwave threshold (≥33°C) where stock price trades significantly beyond historical models.'
        }
      ],
      notice: '⚠️ Stock temperature is an automated mathematical simulation and does not constitute investment advice or recommendation to buy/sell securities. All investment decisions remain solely the responsibility of the investor.',
      closeBtn: 'Got it, Close'
    },
    VI: {
      title: 'Hướng dẫn Nhiệt độ Cổ phiếu',
      subtitle: 'Chỉ số định giá khách quan được tính toán 100% bằng thuật toán AI và mô hình toán học.',
      section1Title: 'Nguyên lý tính toán giá trị hợp lý & Nhiệt độ AI',
      section1Desc: 'Nhiệt độ StockTemp được tính toán hoàn toàn tự động 100% bởi các thuật toán AI và mô hình mô phỏng tài chính mà không có bất kỳ sự can thiệp hay ý kiến chủ quan nào từ con người. Hệ thống tổng hợp các chỉ số tài chính cơ bản, biên độ định giá PER/PBR lịch sử, độ lệch đồng thuận thị trường để lượng hóa thành thang nhiệt độ khách quan.',
      rangesTitle: 'Phân loại 5 cấp độ nhiệt độ',
      ranges: [
        {
          temp: '🥶 Dưới 0°C',
          status: 'Định giá cực thấp (Mùa đông)',
          color: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
          icon: Snowflake,
          desc: 'Giá cổ phiếu đang ở vùng băng giá (dưới 0°C), định giá cực thấp so với các chỉ số tài chính cơ bản.'
        },
        {
          temp: '🌱 0°C ~ 16°C',
          status: 'Định giá thấp (Mùa xuân)',
          color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60',
          icon: Wind,
          desc: 'Thời tiết mát mẻ mùa xuân, cổ phiếu đang giao dịch ở mức chiết khấu hấp dẫn.'
        },
        {
          temp: '⛅ 17°C ~ 26°C',
          status: 'Giá hợp lý (Giao mùa)',
          color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
          icon: CloudSun,
          desc: 'Vùng nhiệt độ lý tưởng, cân bằng hoàn hảo giữa thị giá và giá trị thực (Chuẩn: 21°C).'
        },
        {
          temp: '☀️ 27°C ~ 32°C',
          status: 'Định giá cao (Mùa hè)',
          color: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
          icon: Sun,
          desc: 'Nhiệt độ mùa hè oi bức, các chỉ số định giá đang tiến vào vùng quá nhiệt.'
        },
        {
          temp: '🔥 Từ 33°C trở lên',
          status: 'Định giá cực cao (Giữa hè)',
          color: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
          icon: Flame,
          desc: 'Mức nhiệt sóng nhiệt khắc nghiệt (≥33°C), định giá vượt xa các mô hình lịch sử.'
        }
      ],

      notice: '⚠️ Nhiệt độ cổ phiếu là mô phỏng toán học của thuật toán AI và không cấu thành lời khuyên đầu tư hoặc khuyến nghị mua/bán. Mọi quyết định đầu tư hoàn toàn thuộc trách nhiệm của người dùng.',
      closeBtn: 'Đã hiểu, Đóng'
    }
  }

  const currentText = content[language as 'KO' | 'EN' | 'VI'] || content.EN

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-none my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <StockTempLogo size="xs" />
              <h3 className="text-lg md:text-xl font-bold text-slate-100">{currentText.title}</h3>
            </div>
            <p className="text-xs text-slate-400">{currentText.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Principle */}
        <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-2xl space-y-2 text-xs">
          <h4 className="font-bold text-slate-200">{currentText.section1Title}</h4>
          <p className="text-slate-400 leading-relaxed">{currentText.section1Desc}</p>
        </div>

        {/* Section 2: 5 Ranges */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{currentText.rangesTitle}</h4>
          <div className="grid grid-cols-1 gap-2.5">
            {currentText.ranges.map((item, idx) => {
              const IconComp = item.icon
              return (
                <div key={idx} className={`p-3.5 rounded-2xl border ${item.color} space-y-1 transition-all`}>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm">{item.temp}</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <IconComp className="w-4 h-4" />
                      <span>{item.status}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed pt-1">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-2 text-[11px] text-amber-300/80 bg-amber-950/20 border border-amber-900/40 p-3 rounded-xl leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{currentText.notice}</span>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500 hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99]"
        >
          {currentText.closeBtn}
        </button>
      </div>
    </div>
  )
}
