import { useState } from 'react'
import { ShieldCheck, Info, FileText, Building2, MapPin, Phone, Mail } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import LegalModal from './LegalModal'

export default function Footer() {
  const { language } = useLanguage()
  const [legalModalOpen, setLegalModalOpen] = useState(false)
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy'>('terms')

  const texts = {
    companyName: {
      KO: 'Công ty TNHH Templock Vietnam',
      EN: 'Templock Vietnam Co., Ltd.',
      VI: 'Công ty TNHH Templock Vietnam'
    },
    representative: {
      KO: '대표자: Kim Kwankil (Giám đốc)',
      EN: 'Legal Representative: Kim Kwankil (Director)',
      VI: 'Đại diện pháp luật: Kim Kwankil (Giám đốc)'
    },
    taxCode: {
      KO: '사업자등록번호 (MST): 0319322587',
      EN: 'Tax Code (MST): 0319322587',
      VI: 'Mã số thuế (MST): 0319322587'
    },
    address: {
      KO: '본사 주소: 47 Nội Khu Hưng Gia 2, Phú Mỹ Hưng, Phường Tân Hưng, TP. Hồ Chí Minh, Việt Nam',
      EN: 'Registered Office: 47 Noi Khu Hung Gia 2, Phu My Hung, Tan Hung Ward, Ho Chi Minh City, Vietnam',
      VI: 'Địa chỉ trụ sở: 47 Nội Khu Hưng Gia 2, Phú Mỹ Hưng, Phường Tân Hưng, TP. Hồ Chí Minh, Việt Nam'
    },
    disclaimerTitle: {
      KO: '투자 책임 한계 및 면책 고지',
      EN: 'Disclaimer & Limitation of Liability',
      VI: 'Tuyên bố miễn trừ trách nhiệm đầu tư'
    },
    disclaimerDesc: {
      KO: '본 서비스는 투자자의 성공적인 의사결정과 학술적 연구를 돕기 위해 전면 무료로 제공되는 비상업적 참고용 시뮬레이션 서비스입니다. 본 서비스에서 제공하는 "주식 온도", "AI 적정가", "투자자 의견" 등 모든 밸류에이션 데이터 및 추천 투표 결과는 단순 참고용 및 수학적 알고리즘 모델에 기반한 가상 시뮬레이션입니다. 어떠한 경우에도 공식적인 금융 투자 자문이나 주식 매수/매도 권유가 아닙니다. Templock Vietnam은 베트남 국가증권위원회(SSC)의 허가를 받은 금융 투자 자문사가 아니므로, 모든 투자의 결정과 책임, 그리고 그로 인한 모든 손익은 투자자 본인에게 귀속됩니다.',
      EN: 'This service is a non-commercial simulation platform provided entirely free of charge to support the success of investors. All valuation metrics, including "Stock Temperature," "AI Fair Price," and "Investor Opinions/Votes" provided on this platform are generated via automated mathematical simulation models for reference and educational purposes only. Under no circumstances do they constitute official financial or investment advice. Templock Vietnam is not a licensed financial advisor under the State Securities Commission (SSC) of Vietnam. Users bear full responsibility for all investment actions and risks.',
      VI: 'Dịch vụ này là một nền tảng mô phỏng phi thương mại được cung cấp hoàn toàn miễn phí nhằm hỗ trợ sự thành công của các nhà đầu tư. Tất cả các chỉ số định giá bao gồm "Nhiệt độ cổ phiếu", "Giá hợp lý (AI)" và "Ý kiến nhà đầu tư" trên trang web này được tạo ra bằng thuật toán mô phỏng toán học tự động chỉ mang tính chất tham khảo và học tập. Trong mọi trường hợp, thông tin này không cấu thành lời khuyên đầu tư tài chính chính thức. Templock Vietnam không phải là đơn vị tư vấn đầu tư chứng khoán được cấp phép bởi Ủy ban Chứng khoán Nhà nước (SSC). Người dùng tự chịu trách nhiệm hoàn toàn về mọi quyết định và rủi ro đầu tư của mình.'
    },
    dataSource: {
      KO: '💡 데이터 출처: 본 서비스의 주가, 재무제표 및 지수 정보는 Yahoo Finance, 네이버 페이/증권(Naver Finance) 등 공개된 금융 정보 검색 API 및 데이터 소스를 원천으로 합니다. 제공되는 모든 금융 데이터는 실시간이 아니며 거래소 규정 및 데이터 수집 주기에 따라 지연되거나 오차가 발생할 수 있습니다.',
      EN: '💡 Data Sources: Stock prices, financial statements, and index records displayed on this platform are aggregated from open financial APIs and public sources including Yahoo Finance, Naver Finance, and Wikipedia. All financial data is NOT real-time and may be delayed or subject to synchronization latency based on exchange regulations and crawling intervals.',
      VI: '💡 Nguồn dữ liệu: Giá cổ phiếu, báo cáo tài chính và dữ liệu chỉ số hiển thị trên hệ thống được tổng hợp từ các cổng thông tin tài chính công cộng uy tín bao gồm Yahoo Finance, Naver Finance và Wikipedia. Tất cả dữ liệu tài chính KHÔNG phải là thời gian thực (non-real-time) và có thể bị trễ hoặc xảy ra sai lệch do độ trễ đồng bộ hóa và chu kỳ thu thập dữ liệu.'
    },
    privacyTitle: {
      KO: '개인정보 보호 정책 및 사이버 보안 준수',
      EN: 'Data Privacy & Cybersecurity Compliance',
      VI: 'Bảo mật thông tin & An ninh mạng'
    },
    privacyDesc: {
      KO: 'Templock Vietnam은 베트남 개인정보 보호령(Decree 13/2023/NĐ-CP)을 엄격히 준수하여 사용자의 개인 식별 정보를 안전하게 보호합니다. 당사 플랫폼 내의 의견 피드 및 토론 영역에서 사용자가 작성하는 글은 해당 작성자 본인의 독립적인 의견이며, 불법적이거나 타인의 명예를 훼손하는 등 베트남 사이버보안법을 위반하는 기재사항은 통보 없이 즉시 삭제 조치될 수 있습니다.',
      EN: 'We strictly comply with Vietnam’s Personal Data Protection Decree (Decree 13/2023/ND-CP) to secure your personal identifier records. All reviews and comments posted in our interactive boards represent the respective author’s independent opinion. Any content that defames or violates Vietnam’s Cybersecurity Law will be deleted immediately without notice.',
      VI: 'Templock Vietnam nghiêm túc tuân thủ Nghị định 13/2023/NĐ-CP của Chính phủ Việt Nam về bảo vệ dữ liệu cá nhân. Mọi ý kiến phản hồi và thảo luận của người dùng trên hệ thống đại diện cho quan điểm độc lập của cá nhân đó. Các bài viết vi phạm Luật An ninh mạng Việt Nam, xúc phạm danh dự hoặc chứa thông tin sai lệch sẽ bị xóa ngay lập tức mà không cần báo trước.'
    },
    copyright: {
      KO: '© 2026 Công ty TNHH Templock Vietnam. 모든 권리 보유.',
      EN: '© 2026 Templock Vietnam Co., Ltd. All Rights Reserved.',
      VI: '© 2026 Công ty TNHH Templock Vietnam. Bảo lưu mọi quyền.'
    }
  }

  const getTxt = (key: keyof typeof texts) => {
    return texts[key][language as 'KO' | 'EN' | 'VI'] || texts[key]['EN']
  }

  const openModal = (tab: 'terms' | 'privacy') => {
    setLegalTab(tab)
    setLegalModalOpen(true)
  }

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 mt-16 py-8 md:py-12 select-none">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Legal Grid: Disclaimer and Privacy Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-[11px] leading-relaxed text-slate-400">
          {/* Section 1: Financial Disclaimer */}
          <div className="space-y-2.5">
            <h5 className="font-extrabold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              {getTxt('disclaimerTitle')}
            </h5>
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl space-y-3">
              <p>{getTxt('disclaimerDesc')}</p>
              <div className="pt-3 border-t border-slate-800/60 space-y-2 text-slate-450 font-semibold text-[10px] leading-relaxed">
                <p>{getTxt('dataSource')}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Privacy, Cybersecurity & Official Info */}
          <div className="space-y-2.5">
            <h5 className="font-extrabold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {getTxt('privacyTitle')}
            </h5>
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl space-y-3">
              <p>{getTxt('privacyDesc')}</p>

              {/* Company Registration Details Card */}
              <div className="pt-3 border-t border-slate-800/60 space-y-1.5 text-[10px] text-slate-450 font-medium">
                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{getTxt('companyName')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-400">
                  <div>{getTxt('taxCode')}</div>
                  <div>{getTxt('representative')}</div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span className="font-mono">0901790128</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span className="font-mono text-indigo-400">support@templock.com.vn</span>
                  </div>
                </div>
                <div className="flex items-start gap-1 text-slate-400 pt-0.5">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                  <span>{getTxt('address')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Row: Copyright, Legal Links and Badges */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-900 text-[10px] text-slate-400 font-bold">
          <div>
            {getTxt('copyright')}
          </div>

          {/* Quick Legal Modals & Regulatory Compliance Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
            <button
              type="button"
              onClick={() => openModal('terms')}
              className="flex items-center gap-1 hover:text-indigo-400 transition-colors cursor-pointer underline underline-offset-4 decoration-slate-800 hover:decoration-indigo-500"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              {language === 'KO' ? '이용약관' : language === 'VI' ? 'Điều khoản dịch vụ' : 'Terms of Service'}
            </button>

            <span className="text-slate-700">|</span>

            <button
              type="button"
              onClick={() => openModal('privacy')}
              className="flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer underline underline-offset-4 decoration-slate-800 hover:decoration-emerald-500"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {language === 'KO' ? '개인정보 처리방침' : language === 'VI' ? 'Chính sách bảo mật' : 'Privacy Policy'}
            </button>

            <span className="text-slate-700">|</span>

            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Cybersecurity Law
            </span>
          </div>
        </div>
      </div>

      {/* Global Legal Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        initialTab={legalTab}
        onClose={() => setLegalModalOpen(false)}
      />
    </footer>
  )
}
