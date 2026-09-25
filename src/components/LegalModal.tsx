import { useState } from 'react'
import { X, ShieldCheck, FileText, Building2, Mail, Phone, MapPin } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

interface LegalModalProps {
  isOpen: boolean
  initialTab?: 'terms' | 'privacy'
  onClose: () => void
}

export default function LegalModal({ isOpen, initialTab = 'terms', onClose }: LegalModalProps) {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2">
            {activeTab === 'terms' ? (
              <FileText className="w-5 h-5 text-indigo-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            )}
            <h3 className="text-base font-extrabold text-slate-100">
              {activeTab === 'terms' 
                ? (language === 'KO' ? '서비스 이용약관' : language === 'VI' ? 'Điều khoản dịch vụ' : 'Terms of Service')
                : (language === 'KO' ? '개인정보 처리방침' : language === 'VI' ? 'Chính sách bảo mật' : 'Privacy Policy')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-6 pt-3 pb-1 border-b border-slate-800/50 bg-slate-950/20 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'KO' ? '이용약관' : language === 'VI' ? 'Điều khoản dịch vụ' : 'Terms of Service'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'KO' ? '개인정보 처리방침' : language === 'VI' ? 'Chính sách bảo mật' : 'Privacy Policy'}
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed select-text">
          {activeTab === 'terms' ? (
            /* TERMS OF SERVICE CONTENT */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold leading-relaxed">
                {language === 'KO'
                  ? '💡 StockTemp는 투자자의 자율적인 의사결정과 학술적 시뮬레이션을 위해 전면 무료로 제공되는 비상업적 분석 플랫폼입니다.'
                  : language === 'VI'
                  ? '💡 StockTemp là nền tảng mô phỏng và phân tích dữ liệu tài chính phi thương mại, được cung cấp hoàn toàn miễn phí nhằm hỗ trợ học tập và nghiên cứu của các nhà đầu tư.'
                  : '💡 StockTemp is a 100% non-commercial financial simulation and analytics platform provided free of charge for investor education and research.'}
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-100 text-sm">
                  {language === 'KO' ? '제1조 (목적 및 서비스의 성격)' : language === 'VI' ? 'Điều 1 (Mục đích và Bản chất dịch vụ)' : 'Article 1 (Purpose & Nature of Service)'}
                </h4>
                <p>
                  {language === 'KO'
                    ? '본 약관은 Công ty TNHH Templock Vietnam (이하 "회사")이 제공하는 StockTemp(stocktemp.com) 웹 플랫폼의 이용 조건 및 절차, 이용자와 회사의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다. 본 서비스는 공개된 금융 API 및 알고리즘을 바탕으로 한 시뮬레이션 및 데이터 시각화 툴이며, 플랫폼 내 일부 토론 및 투표 데이터는 서비스 시연 및 시뮬레이션 알고리즘에 의해 생성된 정보가 포함될 수 있습니다.'
                    : language === 'VI'
                    ? 'Điều khoản này quy định các điều kiện, quyền và trách nhiệm giữa Công ty TNHH Templock Vietnam (sau đây gọi là "Công ty") và người dùng khi truy cập nền tảng StockTemp (stocktemp.com). Dịch vụ hoạt động như một công cụ trực quan hóa dữ liệu và mô phỏng toán học dựa trên các cổng API tài chính công khai. Một số nội dung thảo luận và dữ liệu bình chọn có thể bao gồm dữ liệu mô phỏng nhằm phục vụ mục đích minh họa và trải nghiệm người dùng.'
                    : 'These terms govern the use of the StockTemp platform operated by Templock Vietnam Co., Ltd. StockTemp functions solely as an educational financial data visualization and mathematical simulation tool. Certain discussion feeds and sentiment metrics may include automated simulation data for demonstration and visualization purposes.'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-100 text-sm">
                  {language === 'KO' ? '제2조 (금융투자 자문 배제 및 투자책임 한계)' : language === 'VI' ? 'Điều 2 (Tuyên bố miễn trừ tư vấn đầu tư)' : 'Article 2 (Investment Advice Disclaimer & Risk)'}
                </h4>
                <p>
                  {language === 'KO'
                    ? '1. 회사는 베트남 국가증권위원회(SSC - Ủy ban Chứng khoán Nhà nước) 또는 기타 규제 당국의 인가를 받은 공인 금융투자 자문사가 아닙니다. 본 플랫폼의 "주식 온도", "AI 적정가", "투표 지표" 등 일체의 데이터는 특정 주식의 매수 또는 매도를 권유하거나 수익을 보장하는 것이 아닙니다.'
                    : language === 'VI'
                    ? '1. Công ty không phải là tổ chức tư vấn đầu tư tài chính được cấp phép bởi Ủy ban Chứng khoán Nhà nước (SSC). Mọi dữ liệu bao gồm "Nhiệt độ cổ phiếu", "Giá hợp lý (AI)", và "Ý kiến nhà đầu tư" tuyệt đối không cấu thành lời khuyên đầu tư hay chào mời mua/bán chứng khoán dưới bất kỳ hình thức nào.'
                    : '1. The Company is not a licensed financial advisory firm under the State Securities Commission (SSC) of Vietnam. All metrics (Stock Temperature, AI Fair Price, Sentiment) do not constitute trading advice or buy/sell solicitations.'}
                </p>
                <p>
                  {language === 'KO'
                    ? '2. 모든 주식 거래와 금융 투자의 최종 결정 및 그로 인해 발생하는 손익의 모든 책임은 전적으로 투자자 본인에게 귀속됩니다.'
                    : language === 'VI'
                    ? '2. Mọi quyết định giao dịch và kết quả đầu tư (lãi hoặc lỗ) hoàn toàn thuộc về trách nhiệm của chính người dùng.'
                    : '2. Users bear 100% full responsibility for their independent investment decisions and market outcomes.'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-100 text-sm">
                  {language === 'KO' ? '제3조 (데이터의 출처 및 비실시간성)' : language === 'VI' ? 'Điều 3 (Nguồn dữ liệu & Tính trễ)' : 'Article 3 (Data Sources & Latency)'}
                </h4>
                <p>
                  {language === 'KO'
                    ? '본 서비스에 표시되는 주가 및 재무제표 정보는 Yahoo Finance, Naver Finance 등 공개 데이터 소스를 수집·가공한 것입니다. 데이터는 실시간(Real-time)이 아니며 거래소 통신 사정이나 수집 주기에 따라 지연 또는 일시적 오류가 발생할 수 있습니다.'
                    : language === 'VI'
                    ? 'Dữ liệu giá và báo cáo tài chính hiển thị trên hệ thống được tổng hợp từ các nguồn công cộng (Yahoo Finance, Naver Finance). Dữ liệu này không phải thời gian thực và có thể xảy ra độ trễ do chu kỳ đồng bộ hóa.'
                    : 'All market data is aggregated from third-party public financial APIs and is not guaranteed to be real-time. Latency and discrepancies may occur.'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-100 text-sm">
                  {language === 'KO' ? '제4조 (커뮤니티 및 사이버보안 준수)' : language === 'VI' ? 'Điều 4 (Tuân thủ Luật An ninh mạng)' : 'Article 4 (Community Rules & Cybersecurity Compliance)'}
                </h4>
                <p>
                  {language === 'KO'
                    ? '이용자는 종목 토론 및 댓글 작성 시 베트남 사이버보안법(Luật An ninh mạng 2018)을 준수해야 합니다. 타인 비방, 허위사실 유포, 시세조종성 선동 행위는 엄격히 금지되며, 위반 시 사전 통보 없이 삭제 및 계정 이용이 제한될 수 있습니다.'
                    : language === 'VI'
                    ? 'Người dùng khi bình luận và thảo luận cam kết tuân thủ Luật An ninh mạng Việt Nam 2018. Nghiêm cấm các hành vi lan truyền tin đồn thất thiệt, thao túng giá chứng khoán, hoặc xúc phạm danh dự cá nhân/tổ chức.'
                    : 'Users agree to adhere to Vietnam’s Cybersecurity Law. Defamatory speech, market manipulation rumors, and unlawful content will be permanently removed without prior notice.'}
                </p>
              </div>
            </div>
          ) : (
            /* PRIVACY POLICY CONTENT (Decree 13 Compliant) */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold leading-relaxed">
                {language === 'KO'
                  ? '🔒 Templock Vietnam은 베트남 정부의 개인정보보호령(Nghị định 13/2023/NĐ-CP)을 엄격히 준수하여 이용자의 개인정보를 안전하게 보호합니다.'
                  : language === 'VI'
                  ? '🔒 Công ty TNHH Templock Vietnam nghiêm túc tuân thủ Nghị định 13/2023/NĐ-CP của Chính phủ về bảo vệ dữ liệu cá nhân của mọi người dùng.'
                  : '🔒 Templock Vietnam Co., Ltd. strictly adheres to Vietnam’s Personal Data Protection Decree (Decree 13/2023/ND-CP).'}
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-100 text-sm">
                  {language === 'KO' ? '1. 수집하는 개인정보 항목 및 수집 방법' : language === 'VI' ? '1. Loại dữ liệu cá nhân thu thập' : '1. Personal Data Collected'}
                </h4>
                <p>
                  {language === 'KO'
                    ? '회사는 서비스 제공을 위해 최소한의 식별 정보를 수집합니다: 이메일 주소(구글 로그인 및 이메일 계정 연동), 닉네임(사용자 지정 프로필명), 서비스 이용 기록(관심종목, 접속 일시, IP 주소).'
                    : language === 'VI'
                    ? 'Hệ thống thu thập dữ liệu tối thiểu cần thiết để xác thực tài khoản: Địa chỉ email (thông qua Google OAuth hoặc đăng ký trực tiếp), tên hiển thị/biệt danh, danh mục theo dõi (Watchlist) và nhật ký truy cập (IP, thời gian đăng nhập).'
                    : 'We collect minimal information necessary for service authentication: Email address, chosen display name/nickname, watchlist preferences, and basic access logs (IP address, login timestamps).'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-100 text-sm">
                  {language === 'KO' ? '2. 개인정보 처리 목적' : language === 'VI' ? '2. Mục đích xử lý dữ liệu' : '2. Purpose of Data Processing'}
                </h4>
                <p>
                  {language === 'KO'
                    ? '수집된 정보는 회원 식별, 관심 종목(Watchlist) 동기화, 커뮤니티 투표 기능 지원 및 부정 이용 방지를 위해서만 사용되며, 영리 목적의 제3자 판매나 마케팅 광고 대행에 일절 제공되지 않습니다.'
                    : language === 'VI'
                    ? 'Dữ liệu cá nhân chỉ được sử dụng cho việc xác thực người dùng, lưu trữ danh mục cổ phiếu quan tâm, ghi nhận bình chọn ý kiến và bảo mật hệ thống. Tuyệt đối không chia sẻ hoặc bán dữ liệu cho bên thứ ba vì mục đích tiếp thị.'
                    : 'Data is strictly utilized for user authentication, watchlist synchronization, community engagement, and security enforcement. We never sell personal data to advertisers.'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-100 text-sm">
                  {language === 'KO' ? '3. 국외 데이터 이전 (Cross-Border Data Transfer)' : language === 'VI' ? '3. Chuyển dữ liệu cá nhân ra nước ngoài' : '3. Cross-Border Data Transfer'}
                </h4>
                <p>
                  {language === 'KO'
                    ? '안정적인 글로벌 클라우드 인프라 제공을 위해, 사용자의 계정 데이터는 Google LLC의 Firebase 및 Google Cloud Platform(보안 암호화 데이터센터)에 안전하게 위탁 저장됩니다.'
                    : language === 'VI'
                    ? 'Nhằm đảm bảo an toàn kỹ thuật, dữ liệu người dùng được lưu trữ và xử lý mã hóa trên hạ tầng đám mây Google Cloud / Firebase của Google LLC đạt tiêu chuẩn bảo mật quốc tế.'
                    : 'To ensure high availability and security, user data is securely stored and encrypted on Google Cloud Platform / Firebase infrastructure.'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-100 text-sm">
                  {language === 'KO' ? '4. 정보주체의 권리 및 행사 방법' : language === 'VI' ? '4. Quyền của chủ thể dữ liệu' : '4. Data Subject Rights'}
                </h4>
                <p>
                  {language === 'KO'
                    ? '이용자는 언제든지 본인의 개인정보에 대한 열람, 수정, 동의 철회 및 계정 삭제(회원 탈퇴)를 요구할 수 있습니다. 권리 행사는 계정 설정 또는 공식 지원 이메일(support@templock.com.vn)을 통해 신청할 수 있으며, 회사는 지체 없이 처리합니다.'
                    : language === 'VI'
                    ? 'Người dùng có quyền yêu cầu xem, chỉnh sửa, rút lại sự đồng ý hoặc xóa hoàn toàn dữ liệu tài khoản bất kỳ lúc nào bằng cách gửi yêu cầu tới email hỗ trợ: support@templock.com.vn.'
                    : 'Users possess the right to access, rectify, or request complete deletion of their account records at any time by contacting support@templock.com.vn.'}
                </p>
              </div>
            </div>
          )}

          {/* Company Information Card */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2 bg-slate-950/60 p-4 rounded-2xl text-[11px] text-slate-400">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>CÔNG TY TNHH TEMPLOCK VIETNAM</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1 text-slate-450">
              <div>
                <span className="text-slate-400 font-semibold">Mã số thuế (MST): </span>
                <span className="font-mono text-slate-300">0319322587</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Đại diện pháp luật: </span>
                <span className="text-slate-300">KIM KWANKIL (Giám đốc)</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span className="font-mono text-slate-300">0901790128</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="font-mono text-slate-300">support@templock.com.vn</span>
              </div>
              <div className="sm:col-span-2 flex items-start gap-1 pt-1 border-t border-slate-900">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>47 Nội Khu Hưng Gia 2, Phú Mỹ Hưng, Phường Tân Hưng, TP. Hồ Chí Minh, Việt Nam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            {language === 'KO' ? '닫기' : language === 'VI' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
