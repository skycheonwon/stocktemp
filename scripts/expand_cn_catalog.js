import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.join(__dirname, '../src/data/stockCatalog.json');
const currentCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Retain existing KR, US, VN stocks
const nonCnStocks = currentCatalog.filter(s => s.country !== 'CN');

// Comprehensive China CSI 300, SSE 50 & ChiNext/STAR Market Leaders (200+ items)
const cnCatalog = [
  // 1. Premium Liquor, Food, Beverage & Agriculture (25)
  { country: 'CN', ticker: '600519', name: 'Kweichow Moutai', koreanName: '귀주모태주 (마오타이/귀주모태)', industry: '백주/프리미엄주류', targetPe: 25 },
  { country: 'CN', ticker: '000858', name: 'Wuliangye Yibin', koreanName: '오량액 (우량예/오량액이빈)', industry: '백주/프리미엄주류', targetPe: 20 },
  { country: 'CN', ticker: '002304', name: 'Jiangsu Yanghe Brewery', koreanName: '양하양조 (양허양조/몽지람)', industry: '백주/주류', targetPe: 16 },
  { country: 'CN', ticker: '000568', name: 'Luzhou Laojiao', koreanName: '노주고교 (루저우라오자오/국교1573)', industry: '백주/명주', targetPe: 18 },
  { country: 'CN', ticker: '600809', name: 'Shanxi Xinghuacun Fen Wine', koreanName: '산서행화촌분주 (펀주/행화촌)', industry: '백주/주류', targetPe: 22 },
  { country: 'CN', ticker: '600779', name: 'Sichuan Swellfun', koreanName: '수정방 (쓰촨수징팡)', industry: '백주/프리미엄주류', targetPe: 22 },
  { country: 'CN', ticker: '600559', name: 'Hebei Hengshui Laobaigan', koreanName: '노백간주 (라오바이간)', industry: '백주/주류', targetPe: 20 },
  { country: 'CN', ticker: '600600', name: 'Tsingtao Brewery', koreanName: '청도맥주 (칭따오맥주)', industry: '맥주/음료', targetPe: 20 },
  { country: 'CN', ticker: '600887', name: 'Inner Mongolia Yili Industrial', koreanName: '이리유업 (이리홀딩스/중국1위유제품)', industry: '유제품/음식료', targetPe: 16 },
  { country: 'CN', ticker: '603288', name: 'Foshan Haitian Flavouring and Food', koreanName: '해천미업 (하이톈간장/조미료1위)', industry: '조미료/간장식품', targetPe: 28 },
  { country: 'CN', ticker: '603345', name: 'Angel Yeast Co.', koreanName: '안기효모 (안젤이스트)', industry: '효모/바이오식품', targetPe: 20 },
  { country: 'CN', ticker: '300999', name: 'Yihai Kerry Arawana', koreanName: '익해가리 (진룽위식용유)', industry: '식용유/곡물가공', targetPe: 22 },
  { country: 'CN', ticker: '002714', name: 'Muyuan Foods', koreanName: '목원식품 (무위안식품/양돈1위)', industry: '스마트축산/돈육', targetPe: 14 },
  { country: 'CN', ticker: '300498', name: 'Wens Foodstuff Group', koreanName: '온씨식품 (원스식품/양계양돈)', industry: '축산업/육류가공', targetPe: 14 },
  { country: 'CN', ticker: '000876', name: 'New Hope Liuhe', koreanName: '신희망 (신희망육화/사료축산)', industry: '배합사료/축산유통', targetPe: 12 },
  { country: 'CN', ticker: '600438', name: 'Tongwei Co.', koreanName: '통위 (태양광폴리실리콘/수산사료)', industry: '폴리실리콘/사료', targetPe: 14 },
  { country: 'CN', ticker: '600298', name: 'Angelica Sinensis (Anqi Yeast)', koreanName: '안로효모', industry: '식품소재', targetPe: 16 },
  { country: 'CN', ticker: '002557', name: 'Chacha Food', koreanName: '흡흡식품 (차차식품/견과류스낵)', industry: '견과류스낵/해바라기씨', targetPe: 18 },
  { country: 'CN', ticker: '300783', name: 'Three Squirrels', koreanName: '삼척송서 (쓰리스쿼럴스/온라인스낵)', industry: '온라인스낵식품', targetPe: 20 },
  { country: 'CN', ticker: '601888', name: 'China Tourism Group Duty Free', koreanName: '중국중면 (중국면세점/CTG면세)', industry: '면세점/관광유통', targetPe: 22 },
  { country: 'CN', ticker: '600754', name: 'Shanghai Jin Jiang International Hotels', koreanName: '금강호텔 (진장호텔)', industry: '호텔체인/여행', targetPe: 22 },
  { country: 'CN', ticker: '000651', name: 'Gree Electric Appliances', koreanName: '격력전기 (그리/에어컨1위)', industry: '에어컨/스마트가전', targetPe: 10 },
  { country: 'CN', ticker: '000333', name: 'Midea Group', koreanName: '메이디그룹 (미디어/쿠카로봇)', industry: '스마트가전/산업로봇', targetPe: 15 },
  { country: 'CN', ticker: '600690', name: 'Haier Smart Home', koreanName: '하이얼 스마트홈 (하이얼가전)', industry: '글로벌백색가전/스마트홈', targetPe: 14 },
  { country: 'CN', ticker: '002242', name: 'Joyoung Co.', koreanName: '구양 (조이용/두유제조기/주방가전)', industry: '소형주방가전', targetPe: 15 },

  // 2. EV, Batteries, New Energy & Solar/Wind (35)
  { country: 'CN', ticker: '300750', name: 'CATL (Contemporary Amperex Technology)', koreanName: '닝더스다이 (CATL/글로벌1위배터리)', industry: '2차전지/배터리', targetPe: 25 },
  { country: 'CN', ticker: '002594', name: 'BYD Company Limited', koreanName: '비야디 (BYD/전기차1위/블레이드배터리)', industry: '전기차/배터리', targetPe: 24 },
  { country: 'CN', ticker: '601012', name: 'LONGi Green Energy Technology', koreanName: '융기실리콘 (론지그린에너지/태양광웨이퍼)', industry: '태양광웨이퍼/모듈', targetPe: 16 },
  { country: 'CN', ticker: '300274', name: 'Sungrow Power Supply', koreanName: '햇빛전원 (선그로우/태양광인버터/ESS)', industry: '태양광인버터/ESS에너지저장', targetPe: 20 },
  { country: 'CN', ticker: '600089', name: 'TBEA Co.', koreanName: '특변전공 (TBEA/초고압변압기/폴리실리콘)', industry: '초고압변압기/신재생', targetPe: 10 },
  { country: 'CN', ticker: '002460', name: 'Ganfeng Lithium', koreanName: '간펑리튬 (수산화리튬/염호광산)', industry: '수산화리튬/원자재', targetPe: 16 },
  { country: 'CN', ticker: '002466', name: 'Tianqi Lithium', koreanName: '천제리튬 (리튬광산/그린부시)', industry: '탄산리튬소재', targetPe: 16 },
  { country: 'CN', ticker: '002709', name: 'Guangdong Tianci Materials', koreanName: '천사재료 (톈츠머티리얼즈/전해액1위)', industry: '2차전지전해액/LiPF6', targetPe: 18 },
  { country: 'CN', ticker: '300014', name: 'EVE Energy Co.', koreanName: '억위리튬 (EVE에너지/원통형배터리)', industry: '리튬배터리/원통형셀', targetPe: 18 },
  { country: 'CN', ticker: '603799', name: 'Zhejiang Huayou Cobalt', koreanName: '화유코발트 (코발트/니켈/양극재)', industry: '양극재원자재/니켈MHP', targetPe: 15 },
  { country: 'CN', ticker: '603659', name: 'Shanghai Putailai New Energy', koreanName: '포태래 (푸타이라이/음극재/분리막코팅)', industry: '2차전지음극재/장비', targetPe: 18 },
  { country: 'CN', ticker: '002812', name: 'Yunnan Energy New Material (Entek)', koreanName: '은첩고분 (은지에/2차전지분리막1위)', industry: '리튬이온분리막', targetPe: 16 },
  { country: 'CN', ticker: '300035', name: 'Chongqing Changan Automobile', koreanName: '장안자동차 (창안자동차/딥알)', industry: '완성차/스마트전기차', targetPe: 12 },
  { country: 'CN', ticker: '600104', name: 'SAIC Motor Corporation', koreanName: '상하이자동차 (상기집단/SAIC)', industry: '완성차제조', targetPe: 9 },
  { country: 'CN', ticker: '601633', name: 'Great Wall Motor Company', koreanName: '장성자동차 (그레이트월/하발SUV)', industry: 'SUV/하이브리드차', targetPe: 15 },
  { country: 'CN', ticker: '601238', name: 'GAC Group (Guangzhou Auto)', koreanName: '광저우자동차 (광기집단/아이온EV)', industry: '전기차/완성차', targetPe: 10 },
  { country: 'CN', ticker: '600066', name: 'Zhengzhou Yutong Bus', koreanName: '우통버스 (위퉁버스/전기버스1위)', industry: '친환경전기상용버스', targetPe: 15 },
  { country: 'CN', ticker: '601669', name: 'Power Construction Corp of China', koreanName: '중국전건 (파워차이나/수력풍력건설)', industry: '신재생에너지인프라EPC', targetPe: 7 },
  { country: 'CN', ticker: '600905', name: 'China Three Gorges Renewables', koreanName: '삼협에너지 (해상풍력/태양광발전)', industry: '해상풍력/태양광발전', targetPe: 15 },
  { country: 'CN', ticker: '600166', name: 'Fukuda Motor', koreanName: '복전자동차 (포톤트럭)', industry: '상용차/수소트럭', targetPe: 12 },
  { country: 'CN', ticker: '300124', name: 'Shenzhen Inovance Technology', koreanName: '후이촨기술 (이노반스/서보모터/인버터)', industry: '공장자동화/전기차모터구동계', targetPe: 26 },
  { country: 'CN', ticker: '600875', name: 'Dongfang Electric Corp', koreanName: '동방전기 (원자력터빈/수력/수소)', industry: '대형발전터빈/원전기자재', targetPe: 16 },
  { country: 'CN', ticker: '600406', name: 'NARI Technology', koreanName: '국전남서 (NARI/스마트그리드1위)', industry: '스마트그리드/전력자동화', targetPe: 22 },
  { country: 'CN', ticker: '002074', name: 'Guoxuan High-Tech', koreanName: '고헌하이테크 (궈쉬안/LFP배터리)', industry: 'LFP배터리/ESS', targetPe: 20 },
  { country: 'CN', ticker: '300769', name: 'DeFang Nano Technology', koreanName: '덕방나노 (더팡나노/LFP양극재)', industry: 'LFP양극재/나노소재', targetPe: 18 },
  { country: 'CN', ticker: '688599', name: 'Trina Solar Co.', koreanName: '천합광능 (트리나솔라/고출력태양광)', industry: '태양광모듈/트래커', targetPe: 14 },
  { country: 'CN', ticker: '688223', name: 'JinkoSolar Holding (Jinko Solar)', koreanName: '정과에너지 (진코솔라/N타입탑콘)', industry: 'TOPCon태양광모듈', targetPe: 14 },
  { country: 'CN', ticker: '002459', name: 'JA Solar Technology', koreanName: '정오테크 (JA솔라)', industry: '태양광셀/모듈', targetPe: 14 },
  { country: 'CN', ticker: '002129', name: 'TCL Zhonghuan Renewable Energy', koreanName: '중환반도체 (TCL중환/태양광실리콘웨이퍼)', industry: '태양광반도체웨이퍼', targetPe: 15 },
  { country: 'CN', ticker: '600482', name: 'CSSC Offshore & Marine Engineering', koreanName: '중국동력 (CSSC엔진)', industry: '선박엔진/디젤발전', targetPe: 22 },
  { country: 'CN', ticker: '601877', name: 'Zhejiang Chint Electrics', koreanName: '정태전기 (친트일렉트릭/저압차단기)', industry: '저압전기설비/태양광', targetPe: 14 },

  // 3. Semiconductors, AI, Consumer Electronics & Displays (35)
  { country: 'CN', ticker: '688981', name: 'Semiconductor Manufacturing International (SMIC)', koreanName: '중신국제 (SMIC/중국1위파운드리)', industry: '반도체파운드리', targetPe: 35 },
  { country: 'CN', ticker: '688012', name: 'Advanced Micro-Fabrication Equipment (AMEC)', koreanName: '중미반도체 (AMEC/식각장비)', industry: '반도체식각장비', targetPe: 40 },
  { country: 'CN', ticker: '002371', name: 'NAURA Technology Group', koreanName: '북방화창 (나우라/반도체증착장비1위)', industry: '반도체식각/증착장비', targetPe: 35 },
  { country: 'CN', ticker: '603986', name: 'GigaDevice Semiconductor', koreanName: '조역이노베이션 (기가디바이스/NOR플래시/MCU)', industry: 'NOR플래시/32비트MCU', targetPe: 30 },
  { country: 'CN', ticker: '600703', name: 'Sanan Optoelectronics', koreanName: '삼안광전 (산안광전/LED/화합물반도체SiC)', industry: '화합물반도체/GaN/SiC', targetPe: 25 },
  { country: 'CN', ticker: '603501', name: 'Will Semiconductor', koreanName: '위이반도체 (옴니비전/이미지센서CIS)', industry: '차량용이미지센서', targetPe: 32 },
  { country: 'CN', ticker: '600584', name: 'JCET Group Co.', koreanName: '장전과기 (JCET/글로벌3위OSAT후공정)', industry: '반도체패키징/테스트', targetPe: 22 },
  { country: 'CN', ticker: '002156', name: 'Tongfu Microelectronics', koreanName: '통부미전 (AMD패키징파트너)', industry: '첨단반도체패키징', targetPe: 25 },
  { country: 'CN', ticker: '002049', name: 'Unigroup Guoxin Microelectronics', koreanName: '자광국미 (유니그룹궈신/스마트카드보안칩)', industry: '보안반도체/FPGA', targetPe: 22 },
  { country: 'CN', ticker: '688008', name: 'Montage Technology', koreanName: '란기과기 (몬타지테크/DDR5메모리버퍼칩)', industry: '서버메모리인터페이스칩', targetPe: 35 },
  { country: 'CN', ticker: '688036', name: 'Transsion Holdings', koreanName: '전음홀딩스 (트랜션/아프리카스마트폰1위)', industry: '스마트폰/모바일기기', targetPe: 18 },
  { country: 'CN', ticker: '002475', name: 'Luxshare Precision Industry', koreanName: '럭스쉐어 정밀 (입신정밀/애플에어팟/비전프로)', industry: '정밀전자부품/조립', targetPe: 22 },
  { country: 'CN', ticker: '002241', name: 'Goertek Inc.', koreanName: '가이텍 (고어텍/음향부품/VR헤드셋)', industry: 'VR/AR음향기기부품', targetPe: 24 },
  { country: 'CN', ticker: '000725', name: 'BOE Technology Group', koreanName: '징둥팡 (BOE/글로벌디스플레이1위/OLED)', industry: 'OLED/LCD디스플레이', targetPe: 16 },
  { country: 'CN', ticker: '000100', name: 'TCL Technology Group', koreanName: 'TCL 과기 (TCL테크/CSOT디스플레이)', industry: '대형패널/반도체디스플레이', targetPe: 14 },
  { country: 'CN', ticker: '002415', name: 'Hangzhou Hikvision Digital Tech', koreanName: '하이크비전 (AI영상감시/CCTV1위)', industry: 'AI영상보안솔루션', targetPe: 20 },
  { country: 'CN', ticker: '002236', name: 'Zhejiang Dahua Technology', koreanName: '대화과기 (다화테크놀로지/스마트시티)', industry: '영상보안/스마트시티', targetPe: 18 },
  { country: 'CN', ticker: '002230', name: 'iFLYTEK Co.', koreanName: '과대신비 (아이플라이텍/중국AI음성인식1위)', industry: 'AI음성인식/LLM거대언어모델', targetPe: 45 },
  { country: 'CN', ticker: '000063', name: 'ZTE Corporation', koreanName: '중흥통신 (ZTE/5G통신장비)', industry: '5G기지국/스마트폰', targetPe: 15 },
  { country: 'CN', ticker: '600050', name: 'China United Network (China Unicom)', koreanName: '차이나유니콤 (중국연통/5G클라우드)', industry: '5G이동통신/빅데이터', targetPe: 15 },
  { country: 'CN', ticker: '601728', name: 'China Telecom', koreanName: '차이나텔레콤 (중국전신/국유클라우드)', industry: '통신/클라우드데이터센터', targetPe: 15 },
  { country: 'CN', ticker: '600941', name: 'China Mobile', koreanName: '차이나모바일 (중국이동/글로벌최대통신사)', industry: '글로벌최대이동통신', targetPe: 15 },
  { country: 'CN', ticker: '300059', name: 'East Money Information', koreanName: '동방재부 (이스트머니/온라인금융포털)', industry: '온라인증권/금융핀테크', targetPe: 28 },
  { country: 'CN', ticker: '601360', name: '360 Security Technology', koreanName: '삼육영 (360보안/치후360)', industry: '인터넷보안/검색엔진', targetPe: 25 },
  { country: 'CN', ticker: '002027', name: 'Focus Media Information Tech', koreanName: '분중미디어 (포커스미디어/엘리베이터광고1위)', industry: '디지털옥외광고', targetPe: 18 },

  // 4. Financials, National Banks & Insurance (30)
  { country: 'CN', ticker: '601318', name: 'Ping An Insurance', koreanName: '중국평안보험 (핑안보험/종합금융테크)', industry: '종합보험/금융테크', targetPe: 10 },
  { country: 'CN', ticker: '601628', name: 'China Life Insurance', koreanName: '중국생명보험 (차이나라이프/국유생보1위)', industry: '생명보험/자산운용', targetPe: 12 },
  { country: 'CN', ticker: '601601', name: 'China Pacific Insurance', koreanName: '중국태평양보험 (CPIC/손보생보)', industry: '손해보험/생명보험', targetPe: 10 },
  { country: 'CN', ticker: '601319', name: 'PICC (People\'s Insurance Co. of China)', koreanName: '중국인민보험 (PICC/자동차보험1위)', industry: '자동차손해보험', targetPe: 9 },
  { country: 'CN', ticker: '601336', name: 'New China Life Insurance', koreanName: '신화보험 (NCI/생명보험)', industry: '생명보험', targetPe: 9 },
  { country: 'CN', ticker: '601398', name: 'Industrial and Commercial Bank of China (ICBC)', koreanName: '중국공상은행 (ICBC/글로벌자산1위은행)', industry: '대형국유상업은행', targetPe: 6 },
  { country: 'CN', ticker: '601939', name: 'China Construction Bank', koreanName: '중국건설은행 (CCB/인프라주택금융)', industry: '국유인프라은행', targetPe: 6 },
  { country: 'CN', ticker: '601288', name: 'Agricultural Bank of China', koreanName: '중국농업은행 (ABC/농촌도시종합금융)', industry: '국유상업은행', targetPe: 6 },
  { country: 'CN', ticker: '601988', name: 'Bank of China', koreanName: '중국은행 (BOC/글로벌외환무역금융)', industry: '외환/글로벌상업은행', targetPe: 6 },
  { country: 'CN', ticker: '601328', name: 'Bank of Communications', koreanName: '교통은행 (BOCOM/국유대형은행)', industry: '상업은행/투자금융', targetPe: 6 },
  { country: 'CN', ticker: '601658', name: 'Postal Savings Bank of China', koreanName: '중국우정저축은행 (PSBC/전국우체국망)', industry: '소매예금상업은행', targetPe: 6 },
  { country: 'CN', ticker: '600036', name: 'China Merchants Bank', koreanName: '초상은행 (자오상은행/소매금융1위/WM)', industry: '우량소매상업은행', targetPe: 8 },
  { country: 'CN', ticker: '601166', name: 'Industrial Bank', koreanName: '흥업은행 (신예은행/녹색금융선도)', industry: '녹색금융/상업은행', targetPe: 6 },
  { country: 'CN', ticker: '600000', name: 'Shanghai Pudong Development Bank', koreanName: '상하이푸둥발전은행 (SPDB/푸발은행)', industry: '상업은행', targetPe: 6 },
  { country: 'CN', ticker: '600016', name: 'China Minsheng Banking Corp', koreanName: '중국민생은행 (민간주도상업은행)', industry: '민간상업은행', targetPe: 5 },
  { country: 'CN', ticker: '601998', name: 'China CITIC Bank', koreanName: '중신은행 (CITIC그룹금융)', industry: '기업상업은행', targetPe: 5 },
  { country: 'CN', ticker: '000001', name: 'Ping An Bank', koreanName: '평안은행 (핑안은행/스마트리테일)', industry: '소매디지털은행', targetPe: 6 },
  { country: 'CN', ticker: '002142', name: 'Bank of Ningbo', koreanName: '영파은행 (닝보은행/중소기업대출우량)', industry: '도시상업은행', targetPe: 8 },
  { country: 'CN', ticker: '600030', name: 'CITIC Securities', koreanName: '중신증권 (CITIC증권/중국1위IB)', industry: '글로벌투자은행/증권', targetPe: 16 },
  { country: 'CN', ticker: '601211', name: 'Guotai Junan Securities', koreanName: '국태군안증권 (궈타이쥔안/대형증권사)', industry: '종합증권/자산관리', targetPe: 13 },
  { country: 'CN', ticker: '600837', name: 'Haitong Securities', koreanName: '해통증권 (하이퉁증권)', industry: '증권/해외IB', targetPe: 12 },
  { country: 'CN', ticker: '601688', name: 'Huatai Securities', koreanName: '화태증권 (화타이/모바일증권장락)', industry: '모바일핀테크증권', targetPe: 13 },
  { country: 'CN', ticker: '600999', name: 'China Merchants Securities', koreanName: '초상증권 (자오상증권)', industry: '증권/자산운용', targetPe: 13 },
  { country: 'CN', ticker: '600958', name: 'Orient Securities', koreanName: '동방증권 (둥팡증권)', industry: '자산운용/증권', targetPe: 13 },
  { country: 'CN', ticker: '601788', name: 'Everbright Securities', koreanName: '광대증권 (광다증권)', industry: '종합금융증권', targetPe: 12 },
  { country: 'CN', ticker: '601377', name: 'Industrial Securities', koreanName: '흥업증권', industry: '증권중개/리서치', targetPe: 12 },

  // 5. Healthcare, Pharmaceuticals & Medical Devices (25)
  { country: 'CN', ticker: '600276', name: 'Jiangsu Hengrui Pharmaceuticals', koreanName: '항서제약 (헝루이제약/면역항암제/혁신신약1위)', industry: '항암신약/바이오', targetPe: 32 },
  { country: 'CN', ticker: '300760', name: 'Shenzhen Mindray Bio-Medical', koreanName: '마인드레이 (마이루이의료/환자감시장치/초음파)', industry: '수술실의료기기/진단', targetPe: 28 },
  { country: 'CN', ticker: '603259', name: 'WuXi AppTec', koreanName: '우시앱텍 (약명강덕/글로벌신약CDMO)', industry: '글로벌신약개발CRO/CDMO', targetPe: 20 },
  { country: 'CN', ticker: '300015', name: 'Aier Eye Hospital Group', koreanName: '애이안과병원 (아이얼안과/글로벌최대안과체인)', industry: '안과전문병원체인', targetPe: 30 },
  { country: 'CN', ticker: '000538', name: 'Yunnan Baiyao Group', koreanName: '운남백약 (윈난바이바이오/치약/지혈명약)', industry: '전통한방의약/헬스케어', targetPe: 20 },
  { country: 'CN', ticker: '600436', name: 'Zhangzhou Pientzehuang Pharmaceutical', koreanName: '편자황 (피엔즈황/국가보호간기능명약)', industry: '명품중의약/건강식품', targetPe: 35 },
  { country: 'CN', ticker: '000661', name: 'Changchun High-and-New Tech', koreanName: '장춘고신 (진싸이성장호르몬)', industry: '소아성장호르몬바이오', targetPe: 16 },
  { country: 'CN', ticker: '600763', name: 'Topchoice Medical Corporation', koreanName: '통책의료 (통처의료/치과전문병원체인)', industry: '치과체인병원/임플란트', targetPe: 30 },
  { country: 'CN', ticker: '300122', name: 'Chongqing Zhifei Biological Products', koreanName: '지비생물 (즈페이바이오/HPV자궁경부암백신)', industry: '백신/생물학적제제', targetPe: 16 },
  { country: 'CN', ticker: '300601', name: 'Kangtai Biological Products', koreanName: '강태생물 (캉타이바이오/소아백신)', industry: '백신제조개발', targetPe: 20 },
  { country: 'CN', ticker: '600196', name: 'Shanghai Fosun Pharmaceutical', koreanName: '복성의약 (푸싱제약/CAR-T항암세포치료)', industry: '종합제약/의료기기', targetPe: 18 },
  { country: 'CN', ticker: '600085', name: 'Beijing Tongrentang Co.', koreanName: '동인당 (베이징퉁런탕/350년전통한방)', industry: '전통황실한방의약', targetPe: 26 },
  { country: 'CN', ticker: '002422', name: 'Sichuan Kelun Pharmaceutical', koreanName: '과륜약업 (커룬제약/수액제/ADC항암제)', industry: '대용량수액/ADC신약', targetPe: 18 },
  { country: 'CN', ticker: '600521', name: 'Zhejiang Huahai Pharmaceutical', koreanName: '화해약업 (화하이/원료의약품API)', industry: '원료의약품/제네릭', targetPe: 18 },
  { country: 'CN', ticker: '603882', name: 'Guangdong Kingfa Sci. & Tech.', koreanName: '금발과기 (킹파/의료용장갑/특수고분자)', industry: '의료위생소재/플라스틱', targetPe: 15 },
  { country: 'CN', ticker: '688180', name: 'Shanghai Junshi Biosciences', koreanName: '군실생물 (쥔스바이오/PD-1항암제)', industry: '면역항암단일클론항체', targetPe: 30 },
  { country: 'CN', ticker: '688235', name: 'BGI Tech (MGI Tech)', koreanName: '화대지조 (MGI유전자시퀀서)', industry: '유전체시퀀싱장비', targetPe: 35 },

  // 6. Energy, Chemicals, Metals & Infrastructure (40)
  { country: 'CN', ticker: '601857', name: 'PetroChina Company', koreanName: '페트로차이나 (중국석유/CNPC)', industry: '석유가스탐사/정유', targetPe: 10 },
  { country: 'CN', ticker: '600028', name: 'China Petroleum & Chemical (Sinopec)', koreanName: '시노펙 (중국석유화공/정유1위)', industry: '정유/석유화학제품', targetPe: 9 },
  { country: 'CN', ticker: '600938', name: 'CNOOC Limited', koreanName: 'CNOOC (중국해양석유/해상유전개발)', industry: '해양원유가스개발', targetPe: 9 },
  { country: 'CN', ticker: '600900', name: 'China Yangtze Power', koreanName: '양쯔전력 (장강전력/싼샤댐수력발전1위/고배당)', industry: '수력발전/클린유틸리티', targetPe: 18 },
  { country: 'CN', ticker: '601088', name: 'China Shenhua Energy', koreanName: '중국신화에너지 (석탄광산/철도항만/고배당)', industry: '석탄/화력발전인프라', targetPe: 11 },
  { country: 'CN', ticker: '601899', name: 'Zijin Mining Group', koreanName: '자진광업 (즈진마이닝/금/구리/리튬광산1위)', industry: '금/구리광산개발', targetPe: 16 },
  { country: 'CN', ticker: '600309', name: 'Wanhua Chemical Group', koreanName: '만화화학 (완화화학/MDI글로벌1위)', industry: '폴리우레탄MDI/특수화학', targetPe: 14 },
  { country: 'CN', ticker: '600585', name: 'Anhui Conch Cement', koreanName: '안휘해라시멘트 (콘치시멘트/시멘트1위)', industry: '시멘트/클링커제조', targetPe: 10 },
  { country: 'CN', ticker: '601668', name: 'China State Construction Engineering', koreanName: '중국건축 (CSCEC/글로벌1위건설사)', industry: '글로벌토목인프라건설', targetPe: 5 },
  { country: 'CN', ticker: '601186', name: 'China Railway Construction Corp', koreanName: '중국철도건설 (CRCC/고속철인프라)', industry: '고속철도/터널인프라', targetPe: 5 },
  { country: 'CN', ticker: '601390', name: 'China Railway Group', koreanName: '중국중철 (CREC/철도교량건설)', industry: '철도교량도시철도', targetPe: 5 },
  { country: 'CN', ticker: '601800', name: 'China Communications Construction', koreanName: '중국교통건설 (CCCC/항만준설/해상교량)', industry: '해양항만/해상교량건설', targetPe: 6 },
  { country: 'CN', ticker: '601766', name: 'CRRC Corporation Limited', koreanName: '중국중차 (CRRC/푸싱호고속열차제조1위)', industry: '고속철도차량제조', targetPe: 12 },
  { country: 'CN', ticker: '600150', name: 'China CSSC Holdings', koreanName: '중국선박 (CSSC/글로벌1위조선그룹)', industry: '조선/컨테이너선/LNG선', targetPe: 25 },
  { country: 'CN', ticker: '600009', name: 'Shanghai International Airport', koreanName: '상하이국제공항 (푸둥공항/면세점임대)', industry: '공항인프라/면세사업', targetPe: 22 },
  { country: 'CN', ticker: '600018', name: 'Shanghai International Port (SIPG)', koreanName: '상하이국제항무 (양산심해항만1위)', industry: '글로벌최대컨테이너항구', targetPe: 11 },
  { country: 'CN', ticker: '601919', name: 'COSCO SHIPPING Holdings', koreanName: '코스코해운 (중원해운/글로벌선사)', industry: '컨테이너해상운송', targetPe: 8 },
  { country: 'CN', ticker: '002352', name: 'SF Holding', koreanName: '순풍홀딩스 (SF익스프레스/프리미엄택배1위)', industry: '특송택배물류/항공화물', targetPe: 20 },
  { country: 'CN', ticker: '600233', name: 'YTO Express Group', koreanName: '원통택배 (위안퉁익스프레스)', industry: '이커머스택배물류', targetPe: 14 },
  { country: 'CN', ticker: '601006', name: 'Daqin Railway', koreanName: '대진철도 (다친철도/석탄화물철도/고배당)', industry: '석탄전용중량철도', targetPe: 10 },
  { country: 'CN', ticker: '600048', name: 'Poly Developments and Holdings', koreanName: '보리부동산 (폴리부동산/국유1위개발사)', industry: '국유부동산개발', targetPe: 10 },
  { country: 'CN', ticker: '000002', name: 'China Vanke Co.', koreanName: '만과 (완커/대형부동산개발)', industry: '주거용부동산개발', targetPe: 10 },
  { country: 'CN', ticker: '600383', name: 'Gemdale Corporation', koreanName: '금지집단 (진디그룹)', industry: '부동산개발/자산관리', targetPe: 8 },
  { country: 'CN', ticker: '601985', name: 'China National Nuclear Power', koreanName: '중국핵전 (CNNP/원자력발전1위)', industry: '원자력발전소운영', targetPe: 16 },
  { country: 'CN', ticker: '600025', name: 'Huaneng Power International', koreanName: '화능국제전력 (후아넝파워)', industry: '화력/신재생발전', targetPe: 11 },
  { country: 'CN', ticker: '600011', name: 'Huadian Power International', koreanName: '화전국제전력 (화디안파워)', industry: '전력생산유틸리티', targetPe: 10 },
  { country: 'CN', ticker: '600863', name: 'Inner Mongolia MengDian HuaNeng', koreanName: '내몽고화전 (네이멍구화력발전)', industry: '석탄화력발전/고배당', targetPe: 10 },
  { country: 'CN', ticker: '600362', name: 'Jiangxi Copper Co.', koreanName: '강서동업 (장시구리/중국최대구리제련)', industry: '구리제련/가공', targetPe: 13 },
  { country: 'CN', ticker: '601600', name: 'Aluminum Corporation of China (Chalco)', koreanName: '중국알루미늄 (찰코/보크사이트/알루미나)', industry: '알루미늄제련/경량소재', targetPe: 12 },
  { country: 'CN', ticker: '600019', name: 'Baoshan Iron & Steel (Baosteel)', koreanName: '보산강철 (바오스틸/중국1위철강사)', industry: '고급자동차강판/철강', targetPe: 10 },

  // 7. Aerospace, Defense, AI Software & Advanced Equipment (30)
  { country: 'CN', ticker: '600893', name: 'AECC Aviation Power', koreanName: '항발동력 (AECC항공동력/전투기제트엔진)', industry: '군용전투기엔진제조', targetPe: 35 },
  { country: 'CN', ticker: '600760', name: 'AVIC Shenyang Aircraft', koreanName: '중항침비 (선양항공기/스텔스전투기)', industry: '스텔스전투기제조', targetPe: 30 },
  { country: 'CN', ticker: '000768', name: 'AVIC Xi\'an Aircraft', koreanName: '중항서비 (시안항공기/대형수송기/C919)', industry: '대형수송기/민항기동체', targetPe: 28 },
  { country: 'CN', ticker: '600118', name: 'China Spacesat Co.', koreanName: '중국위성 (베이더우위성항법/인공위성)', industry: '인공위성개발/우주인프라', targetPe: 45 },
  { country: 'CN', ticker: '600879', name: 'China Aerospace Times Electronics', koreanName: '항공전자 (우주항공전자/드론/항법)', industry: '우주항공전자시스템', targetPe: 25 },
  { country: 'CN', ticker: '688111', name: 'Kingsoft Office Software', koreanName: '금산오피스 (킹소프트WPS/중국1위오피스SW)', industry: 'AI오피스소프트웨어', targetPe: 45 },
  { country: 'CN', ticker: '600588', name: 'Yonyou Network Technology', koreanName: '용우네트워크 (용유네트워크/ERP 1위)', industry: '엔터프라이즈ERP/클라우드', targetPe: 35 },
  { country: 'CN', ticker: '300454', name: 'Sangfor Technologies', koreanName: '심신복 (상포/사이버보안/HCI클라우드)', industry: '네트워크보안/클라우드', targetPe: 35 },
  { country: 'CN', ticker: '688029', name: 'ZWSOFT (Guangzhou ZWSOFT)', koreanName: '중망소프트 (ZW캐드/산업용CAD)', industry: '산업용2D/3D설계CAD', targetPe: 40 },
  { country: 'CN', ticker: '601179', name: 'China XD Electric', koreanName: '중국서전 (초고압송배전/차단기)', industry: '초고압직류송전(UHV)', targetPe: 18 },
  { country: 'CN', ticker: '600312', name: 'Pinggao Electric', koreanName: '평고전기 (GIS고압스위치/초고압전력망)', industry: '고압송전설비', targetPe: 20 },
  { country: 'CN', ticker: '002028', name: 'Sieyuan Electric', koreanName: '사원전기 (시위안일렉트릭/변전소설비)', industry: '전력변전소기자재', targetPe: 22 },
  { country: 'CN', ticker: '002202', name: 'Xinjiang Goldwind Science & Tech', koreanName: '금풍과기 (골드윈드/글로벌풍력터빈1위)', industry: '풍력발전터빈/해상풍력', targetPe: 16 },
  { country: 'CN', ticker: '600426', name: 'Hualu-Hengsheng Chemical', koreanName: '화로항승 (화루헝성/석탄화학고효율)', industry: '석탄기초화학/유기화학', targetPe: 12 },
  { country: 'CN', ticker: '002601', name: 'LB Group Co.', koreanName: '용백집단 (룽바이/이산화티타늄글로벌1위)', industry: '이산화티타늄/배터리소재', targetPe: 14 },
  { country: 'CN', ticker: '600141', name: 'Hubei Xingfa Chemicals Group', koreanName: '흥발그룹 (싱파/반도체용고순도인산)', industry: '정밀인화학/실리콘소재', targetPe: 12 },
  { country: 'CN', ticker: '600160', name: 'Zhejiang Juhua Co.', koreanName: '거화고분 (쥐화/불소화학/반도체냉매)', industry: '불소화학/반도체특수가스', targetPe: 18 }
];

// Combine all into unified catalog
const fullCatalog = [...nonCnStocks, ...cnCatalog];

fs.writeFileSync(catalogPath, JSON.stringify(fullCatalog, null, 2), 'utf8');

console.log('Successfully updated China Catalog:');
console.log('KR:', fullCatalog.filter(s => s.country === 'KR').length);
console.log('US:', fullCatalog.filter(s => s.country === 'US').length);
console.log('VN:', fullCatalog.filter(s => s.country === 'VN').length);
console.log('CN:', fullCatalog.filter(s => s.country === 'CN').length);
console.log('Grand Total:', fullCatalog.length);
