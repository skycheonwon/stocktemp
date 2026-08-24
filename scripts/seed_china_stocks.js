import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load credentials dynamically
const localKeyPath = path.join(__dirname, 'service-account.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
} catch (err) {
  console.error('Error reading service-account.json:', err);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const CHINA_STOCKS = [
  // ================= 1. 빅테크 및 플랫폼 (Tech & Internet) =================
  {
    ticker: '00700',
    name: 'Tencent Holdings',
    koreanName: '텐센트',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 25,
    tradingViewSymbol: 'HKEX:700',
    naverTicker: '00700.HK'
  },
  {
    ticker: '09988',
    name: 'Alibaba Group',
    koreanName: '알리바바',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 18,
    tradingViewSymbol: 'HKEX:9988',
    naverTicker: '9988.HK'
  },
  {
    ticker: '03690',
    name: 'Meituan',
    koreanName: '메이투안',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 25,
    tradingViewSymbol: 'HKEX:3690',
    naverTicker: '3690.HK'
  },
  {
    ticker: '01810',
    name: 'Xiaomi Corp',
    koreanName: '샤오미',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 20,
    tradingViewSymbol: 'HKEX:1810',
    naverTicker: '1810.HK'
  },
  {
    ticker: '09618',
    name: 'JD.com',
    koreanName: '징동닷컴',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 15,
    tradingViewSymbol: 'HKEX:9618',
    naverTicker: '9618.HK'
  },
  {
    ticker: '09888',
    name: 'Baidu Inc',
    koreanName: '바이두',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 15,
    tradingViewSymbol: 'HKEX:9888',
    naverTicker: '9888.HK'
  },
  {
    ticker: '09999',
    name: 'NetEase Inc',
    koreanName: '넷이즈',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 18,
    tradingViewSymbol: 'HKEX:9999',
    naverTicker: '9999.HK'
  },
  {
    ticker: 'PDD',
    name: 'PDD Holdings (Pinduoduo)',
    koreanName: 'PDD 홀딩스 (핀둬둬)',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: '$',
    defaultTargetPe: 18,
    tradingViewSymbol: 'NASDAQ:PDD',
    naverTicker: 'PDD.O'
  },
  {
    ticker: '01024',
    name: 'Kuaishou Technology',
    koreanName: '콰이쇼우',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 20,
    tradingViewSymbol: 'HKEX:1024',
    naverTicker: '1024.HK'
  },
  {
    ticker: '01698',
    name: 'Tencent Music',
    koreanName: '텐센트 뮤직',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 20,
    tradingViewSymbol: 'HKEX:1698',
    naverTicker: '1698.HK'
  },
  {
    ticker: '02423',
    name: 'Ke Holdings (Beike)',
    koreanName: '베이케',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 18,
    tradingViewSymbol: 'HKEX:2423',
    naverTicker: '2423.HK'
  },
  {
    ticker: '09961',
    name: 'Trip.com Group',
    koreanName: '트립닷컴',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 20,
    tradingViewSymbol: 'HKEX:9961',
    naverTicker: '9961.HK'
  },
  {
    ticker: '00241',
    name: 'Alibaba Health',
    koreanName: '알리건강',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 25,
    tradingViewSymbol: 'HKEX:241',
    naverTicker: '0241.HK'
  },
  {
    ticker: '02513',
    name: 'Zhipu AI / High-tech AI',
    koreanName: '즈방 AI',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 30,
    tradingViewSymbol: 'HKEX:2513',
    naverTicker: '2513.HK'
  },
  {
    ticker: '300059',
    name: 'East Money Information',
    koreanName: '이스트머니',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: '¥',
    defaultTargetPe: 20,
    tradingViewSymbol: 'SZSE:300059',
    naverTicker: '300059.SZ'
  },
  {
    ticker: '00762',
    name: 'China Unicom',
    koreanName: '중국유니콤',
    country: 'CN',
    industry: 'Tech & Internet',
    currency: 'HK$',
    defaultTargetPe: 10,
    tradingViewSymbol: 'HKEX:762',
    naverTicker: '0762.HK'
  },

  // ================= 2. 전기차, 배터리 및 모빌리티 (EV & New Energy) =================
  {
    ticker: '01211',
    name: 'BYD Company',
    koreanName: '비야디 (BYD)',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: 'HK$',
    defaultTargetPe: 20,
    tradingViewSymbol: 'HKEX:1211',
    naverTicker: '1211.HK'
  },
  {
    ticker: '300750',
    name: 'CATL',
    koreanName: '닝더스다이 (CATL)',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: '¥',
    defaultTargetPe: 25,
    tradingViewSymbol: 'SZSE:300750',
    naverTicker: '300750.SZ'
  },
  {
    ticker: '02015',
    name: 'Li Auto Inc',
    koreanName: '리오토',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: 'HK$',
    defaultTargetPe: 22,
    tradingViewSymbol: 'HKEX:2015',
    naverTicker: '2015.HK'
  },
  {
    ticker: '09868',
    name: 'XPeng Inc',
    koreanName: '샤오펑',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: 'HK$',
    defaultTargetPe: 25,
    tradingViewSymbol: 'HKEX:9868',
    naverTicker: '9868.HK'
  },
  {
    ticker: '00175',
    name: 'Geely Automobile',
    koreanName: '지리자동차',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: 'HK$',
    defaultTargetPe: 12,
    tradingViewSymbol: 'HKEX:175',
    naverTicker: '0175.HK'
  },
  {
    ticker: '09866',
    name: 'NIO Inc',
    koreanName: '니오 (NIO)',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: 'HK$',
    defaultTargetPe: 25,
    tradingViewSymbol: 'HKEX:9866',
    naverTicker: '9866.HK'
  },
  {
    ticker: '09863',
    name: 'Leapmotor',
    koreanName: '립모터',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: 'HK$',
    defaultTargetPe: 22,
    tradingViewSymbol: 'HKEX:9863',
    naverTicker: '9863.HK'
  },
  {
    ticker: '000625',
    name: 'Changan Automobile',
    koreanName: '중경장안자동차',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: '¥',
    defaultTargetPe: 12,
    tradingViewSymbol: 'SZSE:000625',
    naverTicker: '000625.SZ'
  },
  {
    ticker: '600104',
    name: 'SAIC Motor',
    koreanName: '상하이자동차',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: '¥',
    defaultTargetPe: 10,
    tradingViewSymbol: 'SSE:600104',
    naverTicker: '600104.SS'
  },
  {
    ticker: '02338',
    name: 'Weichai Power',
    koreanName: '위차이파워',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: 'HK$',
    defaultTargetPe: 10,
    tradingViewSymbol: 'HKEX:2338',
    naverTicker: '2338.HK'
  },
  {
    ticker: '300274',
    name: 'Sungrow Power Supply',
    koreanName: '선그로우 (성고)',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: '¥',
    defaultTargetPe: 20,
    tradingViewSymbol: 'SZSE:300274',
    naverTicker: '300274.SZ'
  },
  {
    ticker: '01766',
    name: 'CRRC Corp',
    koreanName: '중국중차',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: 'HK$',
    defaultTargetPe: 10,
    tradingViewSymbol: 'HKEX:1766',
    naverTicker: '1766.HK'
  },
  {
    ticker: '002074',
    name: 'Gotion High-tech',
    koreanName: '고션 하이테크',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: '¥',
    defaultTargetPe: 22,
    tradingViewSymbol: 'SZSE:002074',
    naverTicker: '002074.SZ'
  },
  {
    ticker: '03808',
    name: 'Sinotruk Hong Kong',
    koreanName: '시노트럭',
    country: 'CN',
    industry: 'EV & New Energy',
    currency: 'HK$',
    defaultTargetPe: 10,
    tradingViewSymbol: 'HKEX:3808',
    naverTicker: '3808.HK'
  },

  // ================= 3. 소비재 및 식음료 (Consumer Staples & Discretionary) =================
  {
    ticker: '600519',
    name: 'Kweichow Moutai',
    koreanName: '귀주모태주',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: '¥',
    defaultTargetPe: 28,
    tradingViewSymbol: 'SSE:600519',
    naverTicker: '600519.SS'
  },
  {
    ticker: '000858',
    name: 'Wuliangye Yibin',
    koreanName: '오량액',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: '¥',
    defaultTargetPe: 22,
    tradingViewSymbol: 'SZSE:000858',
    naverTicker: '000858.SZ'
  },
  {
    ticker: '09633',
    name: 'Nongfu Spring',
    koreanName: '농푸스프링',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: 'HK$',
    defaultTargetPe: 25,
    tradingViewSymbol: 'HKEX:9633',
    naverTicker: '9633.HK'
  },
  {
    ticker: '000333',
    name: 'Midea Group',
    koreanName: '메이디그룹',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: '¥',
    defaultTargetPe: 12,
    tradingViewSymbol: 'SZSE:000333',
    naverTicker: '000333.SZ'
  },
  {
    ticker: '06690',
    name: 'Haier Smart Home',
    koreanName: '하이얼스마트홈',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: 'HK$',
    defaultTargetPe: 12,
    tradingViewSymbol: 'HKEX:6690',
    naverTicker: '6690.HK'
  },
  {
    ticker: '000651',
    name: 'Gree Electric Appliances',
    koreanName: '그리전기',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: '¥',
    defaultTargetPe: 10,
    tradingViewSymbol: 'SZSE:000651',
    naverTicker: '000651.SZ'
  },
  {
    ticker: '600809',
    name: 'Shanxi Xinghuacun Fen Wine',
    koreanName: '싼시펀주',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: '¥',
    defaultTargetPe: 22,
    tradingViewSymbol: 'SSE:600809',
    naverTicker: '600809.SS'
  },
  {
    ticker: '002304',
    name: 'Yanghe Brewery',
    koreanName: '양하주업',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: '¥',
    defaultTargetPe: 15,
    tradingViewSymbol: 'SZSE:002304',
    naverTicker: '002304.SZ'
  },
  {
    ticker: '600887',
    name: 'Inner Mongolia Yili Industrial',
    koreanName: '내몽고이리실업',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: '¥',
    defaultTargetPe: 15,
    tradingViewSymbol: 'SSE:600887',
    naverTicker: '600887.SS'
  },
  {
    ticker: '00168',
    name: 'Tsingtao Brewery',
    koreanName: '칭다오맥주',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: 'HK$',
    defaultTargetPe: 18,
    tradingViewSymbol: 'HKEX:168',
    naverTicker: '0168.HK'
  },
  {
    ticker: '03606',
    name: 'Fuyao Glass Industry',
    koreanName: '푸야오글라스',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: 'HK$',
    defaultTargetPe: 18,
    tradingViewSymbol: 'HKEX:3606',
    naverTicker: '3606.HK'
  },
  {
    ticker: '603288',
    name: 'Haitian Flavouring & Fooding',
    koreanName: '포산하이톈조미식품',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: '¥',
    defaultTargetPe: 30,
    tradingViewSymbol: 'SSE:603288',
    naverTicker: '603288.SS'
  },
  {
    ticker: '02020',
    name: 'ANTA Sports Products',
    koreanName: '안타스포츠',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: 'HK$',
    defaultTargetPe: 22,
    tradingViewSymbol: 'HKEX:2020',
    naverTicker: '2020.HK'
  },
  {
    ticker: '02331',
    name: 'Li Ning Co',
    koreanName: '리닝',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: 'HK$',
    defaultTargetPe: 18,
    tradingViewSymbol: 'HKEX:2331',
    naverTicker: '2331.HK'
  },
  {
    ticker: '601888',
    name: 'China Tourism Group Duty Free',
    koreanName: '중국중면',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: '¥',
    defaultTargetPe: 20,
    tradingViewSymbol: 'SSE:601888',
    naverTicker: '601888.SS'
  },
  {
    ticker: '002714',
    name: 'Muyuan Foods',
    koreanName: '무위안식품',
    country: 'CN',
    industry: 'Consumer Goods',
    currency: '¥',
    defaultTargetPe: 12,
    tradingViewSymbol: 'SZSE:002714',
    naverTicker: '002714.SZ'
  },

  // ================= 4. 금융 및 보험 (Financials & Insurance) =================
  {
    ticker: '01398',
    name: 'Industrial and Commercial Bank of China (ICBC)',
    koreanName: '중국공상은행',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 6,
    tradingViewSymbol: 'HKEX:1398',
    naverTicker: '1398.HK'
  },
  {
    ticker: '00939',
    name: 'China Construction Bank',
    koreanName: '중국건설은행',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 6,
    tradingViewSymbol: 'HKEX:939',
    naverTicker: '0939.HK'
  },
  {
    ticker: '01288',
    name: 'Agricultural Bank of China',
    koreanName: '중국농업은행',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 6,
    tradingViewSymbol: 'HKEX:1288',
    naverTicker: '1288.HK'
  },
  {
    ticker: '03988',
    name: 'Bank of China',
    koreanName: '중국은행',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 6,
    tradingViewSymbol: 'HKEX:3988',
    naverTicker: '3988.HK'
  },
  {
    ticker: '03968',
    name: 'China Merchants Bank',
    koreanName: '초상은행',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 8,
    tradingViewSymbol: 'HKEX:3968',
    naverTicker: '3968.HK'
  },
  {
    ticker: '02318',
    name: 'Ping An Insurance',
    koreanName: '핑안보험',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 9,
    tradingViewSymbol: 'HKEX:2318',
    naverTicker: '2318.HK'
  },
  {
    ticker: '02628',
    name: 'China Life Insurance',
    koreanName: '중국인수보험',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 8,
    tradingViewSymbol: 'HKEX:2628',
    naverTicker: '2628.HK'
  },
  {
    ticker: '03328',
    name: 'Bank of Communications',
    koreanName: '교통은행',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 5,
    tradingViewSymbol: 'HKEX:3328',
    naverTicker: '3328.HK'
  },
  {
    ticker: '01658',
    name: 'Postal Savings Bank of China',
    koreanName: '중국우체국저축은행',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 6,
    tradingViewSymbol: 'HKEX:1658',
    naverTicker: '1658.HK'
  },
  {
    ticker: '06030',
    name: 'CITIC Securities',
    koreanName: '중신증권',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 12,
    tradingViewSymbol: 'HKEX:6030',
    naverTicker: '6030.HK'
  },
  {
    ticker: '601211',
    name: 'Guotai Junan Securities',
    koreanName: '국태군안증권',
    country: 'CN',
    industry: 'Financial Services',
    currency: '¥',
    defaultTargetPe: 12,
    tradingViewSymbol: 'SSE:601211',
    naverTicker: '601211.SS'
  },
  {
    ticker: '601688',
    name: 'Huatai Securities',
    koreanName: '화타이증권',
    country: 'CN',
    industry: 'Financial Services',
    currency: '¥',
    defaultTargetPe: 10,
    tradingViewSymbol: 'SSE:601688',
    naverTicker: '601688.SS'
  },
  {
    ticker: '02601',
    name: 'China Pacific Insurance (CPIC)',
    koreanName: '중국태평양보험',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 8,
    tradingViewSymbol: 'HKEX:2601',
    naverTicker: '2601.HK'
  },
  {
    ticker: '01336',
    name: 'New China Life Insurance',
    koreanName: '신화보험',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 8,
    tradingViewSymbol: 'HKEX:1336',
    naverTicker: '1336.HK'
  },
  {
    ticker: '00998',
    name: 'China CITIC Bank',
    koreanName: '중신은행',
    country: 'CN',
    industry: 'Financial Services',
    currency: 'HK$',
    defaultTargetPe: 5,
    tradingViewSymbol: 'HKEX:998',
    naverTicker: '0998.HK'
  },
  {
    ticker: '000001',
    name: 'Ping An Bank',
    koreanName: '핑안은행',
    country: 'CN',
    industry: 'Financial Services',
    currency: '¥',
    defaultTargetPe: 6,
    tradingViewSymbol: 'SZSE:000001',
    naverTicker: '000001.SZ'
  },
  {
    ticker: '600000',
    name: 'Shanghai Pudong Development Bank',
    koreanName: '상하이푸동발전은행',
    country: 'CN',
    industry: 'Financial Services',
    currency: '¥',
    defaultTargetPe: 5,
    tradingViewSymbol: 'SSE:600000',
    naverTicker: '600000.SS'
  },

  // ================= 5. 에너지, 소재 및 유틸리티 (Energy, Materials & Utilities) =================
  {
    ticker: '00857',
    name: 'PetroChina Co',
    koreanName: '페트로차이나',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: 'HK$',
    defaultTargetPe: 8,
    tradingViewSymbol: 'HKEX:857',
    naverTicker: '0857.HK'
  },
  {
    ticker: '00386',
    name: 'Sinopec (China Petroleum & Chemical)',
    koreanName: '시노펙',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: 'HK$',
    defaultTargetPe: 8,
    tradingViewSymbol: 'HKEX:386',
    naverTicker: '0386.HK'
  },
  {
    ticker: '00883',
    name: 'CNOOC Ltd',
    koreanName: 'CNOOC (중국해양석유)',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: 'HK$',
    defaultTargetPe: 8,
    tradingViewSymbol: 'HKEX:883',
    naverTicker: '0883.HK'
  },
  {
    ticker: '01088',
    name: 'China Shenhua Energy',
    koreanName: '중국선화에너지',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: 'HK$',
    defaultTargetPe: 10,
    tradingViewSymbol: 'HKEX:1088',
    naverTicker: '1088.HK'
  },
  {
    ticker: '600900',
    name: 'China Yangtze Power',
    koreanName: '장강전력',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: '¥',
    defaultTargetPe: 18,
    tradingViewSymbol: 'SSE:600900',
    naverTicker: '600900.SS'
  },
  {
    ticker: '02899',
    name: 'Zijin Mining Group',
    koreanName: '자진광업',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: 'HK$',
    defaultTargetPe: 15,
    tradingViewSymbol: 'HKEX:2899',
    naverTicker: '2899.HK'
  },
  {
    ticker: '03993',
    name: 'CMOC Group',
    koreanName: 'CMOC 그룹',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: 'HK$',
    defaultTargetPe: 15,
    tradingViewSymbol: 'HKEX:3993',
    naverTicker: '3993.HK'
  },
  {
    ticker: '600309',
    name: 'Wanhua Chemical Group',
    koreanName: '완화화학',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: '¥',
    defaultTargetPe: 15,
    tradingViewSymbol: 'SSE:600309',
    naverTicker: '600309.SS'
  },
  {
    ticker: '02600',
    name: 'Aluminum Corp of China',
    koreanName: '중국알루미늄',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: 'HK$',
    defaultTargetPe: 12,
    tradingViewSymbol: 'HKEX:2600',
    naverTicker: '2600.HK'
  },
  {
    ticker: '600019',
    name: 'Baoshan Iron & Steel',
    koreanName: '바오산철강',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: '¥',
    defaultTargetPe: 10,
    tradingViewSymbol: 'SSE:600019',
    naverTicker: '600019.SS'
  },
  {
    ticker: '600585',
    name: 'Anhui Conch Cement',
    koreanName: '안후이해상시멘트',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: '¥',
    defaultTargetPe: 10,
    tradingViewSymbol: 'SSE:600585',
    naverTicker: '600585.SS'
  },
  {
    ticker: '601985',
    name: 'China National Nuclear Power',
    koreanName: '중국국가핵전력',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: '¥',
    defaultTargetPe: 15,
    tradingViewSymbol: 'SSE:601985',
    naverTicker: '601985.SS'
  },
  {
    ticker: '600011',
    name: 'Huaneng Power International',
    koreanName: '화능력전',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: '¥',
    defaultTargetPe: 12,
    tradingViewSymbol: 'SSE:600011',
    naverTicker: '600011.SS'
  },
  {
    ticker: '01816',
    name: 'CGN Power Co',
    koreanName: 'CGN 파워',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: 'HK$',
    defaultTargetPe: 12,
    tradingViewSymbol: 'HKEX:1816',
    naverTicker: '1816.HK'
  },
  {
    ticker: '601225',
    name: 'Shaanxi Coal Industry',
    koreanName: '산시콜산업',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: '¥',
    defaultTargetPe: 10,
    tradingViewSymbol: 'SSE:601225',
    naverTicker: '601225.SS'
  },
  {
    ticker: '01898',
    name: 'China Coal Energy Co',
    koreanName: '중국석탄에너지',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: 'HK$',
    defaultTargetPe: 8,
    tradingViewSymbol: 'HKEX:1898',
    naverTicker: '1898.HK'
  },
  {
    ticker: '601800',
    name: 'China Communications Construction',
    koreanName: '중국교건',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: '¥',
    defaultTargetPe: 8,
    tradingViewSymbol: 'SSE:601800',
    naverTicker: '601800.SS'
  },
  {
    ticker: '601186',
    name: 'China Railway Construction',
    koreanName: '중국철도건설',
    country: 'CN',
    industry: 'Energy & Materials',
    currency: '¥',
    defaultTargetPe: 8,
    tradingViewSymbol: 'SSE:601186',
    naverTicker: '601186.SS'
  },

  // ================= 6. 반도체, 바이오 및 하이테크 제조 (Semiconductor, Healthcare & High-Tech) =================
  {
    ticker: '00981',
    name: 'SMIC (Semiconductor Manufacturing International Corp)',
    koreanName: 'SMIC (중신국제)',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: 'HK$',
    defaultTargetPe: 30,
    tradingViewSymbol: 'HKEX:981',
    naverTicker: '0981.HK'
  },
  {
    ticker: '01347',
    name: 'Hua Hong Semiconductor',
    koreanName: '화홍반도체',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: 'HK$',
    defaultTargetPe: 25,
    tradingViewSymbol: 'HKEX:1347',
    naverTicker: '1347.HK'
  },
  {
    ticker: '02359',
    name: 'WuXi AppTec Co',
    koreanName: '우시앱텍',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: 'HK$',
    defaultTargetPe: 22,
    tradingViewSymbol: 'HKEX:2359',
    naverTicker: '2359.HK'
  },
  {
    ticker: '600276',
    name: 'Jiangsu Hengrui Pharmaceuticals',
    koreanName: '장쑤헝루이의약',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: '¥',
    defaultTargetPe: 32,
    tradingViewSymbol: 'SSE:600276',
    naverTicker: '600276.SS'
  },
  {
    ticker: '002371',
    name: 'NAURA Technology Group',
    koreanName: '북방화창 (NAURA)',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: '¥',
    defaultTargetPe: 30,
    tradingViewSymbol: 'SZSE:002371',
    naverTicker: '002371.SZ'
  },
  {
    ticker: '688012',
    name: 'Advanced Micro-Fabrication Equipment (AMEC)',
    koreanName: '중미반도체 (AMEC)',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: '¥',
    defaultTargetPe: 35,
    tradingViewSymbol: 'SSE:688012',
    naverTicker: '688012.SS'
  },
  {
    ticker: '688256',
    name: 'Cambricon Technologies',
    koreanName: '캠브리콘',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: '¥',
    defaultTargetPe: 40,
    tradingViewSymbol: 'SSE:688256',
    naverTicker: '688256.SS'
  },
  {
    ticker: '601138',
    name: 'Foxconn Industrial Internet (FII)',
    koreanName: '폭스콘 인더스트리얼 인터넷',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: '¥',
    defaultTargetPe: 18,
    tradingViewSymbol: 'SSE:601138',
    naverTicker: '601138.SS'
  },
  {
    ticker: '002415',
    name: 'Hangzhou Hikvision Digital Technology',
    koreanName: '하이크비전',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: '¥',
    defaultTargetPe: 15,
    tradingViewSymbol: 'SZSE:002415',
    naverTicker: '002415.SZ'
  },
  {
    ticker: '002475',
    name: 'Luxshare Precision Industry',
    koreanName: '럭스셰어 프리시전',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: '¥',
    defaultTargetPe: 20,
    tradingViewSymbol: 'SZSE:002475',
    naverTicker: '002475.SZ'
  },
  {
    ticker: '000725',
    name: 'BOE Technology Group',
    koreanName: 'BOE 테크놀로지',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: '¥',
    defaultTargetPe: 15,
    tradingViewSymbol: 'SZSE:000725',
    naverTicker: '000725.SZ'
  },
  {
    ticker: '000063',
    name: 'ZTE Corp',
    koreanName: 'ZTE (중싱통신)',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: '¥',
    defaultTargetPe: 14,
    tradingViewSymbol: 'SZSE:000063',
    naverTicker: '000063.SZ'
  },
  {
    ticker: '06160',
    name: 'BeiGene Ltd',
    koreanName: '베이진허치',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: 'HK$',
    defaultTargetPe: 35,
    tradingViewSymbol: 'HKEX:6160',
    naverTicker: '6160.HK'
  },
  {
    ticker: '01801',
    name: 'Innovent Biologics',
    koreanName: '이노반트',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: 'HK$',
    defaultTargetPe: 35,
    tradingViewSymbol: 'HKEX:1801',
    naverTicker: '1801.HK'
  },
  {
    ticker: '300308',
    name: 'Zhongji InnoLight Co',
    koreanName: '중제의광',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: '¥',
    defaultTargetPe: 25,
    tradingViewSymbol: 'SZSE:300308',
    naverTicker: '300308.SZ'
  },
  {
    ticker: '301095',
    name: 'Guangliwei (센서 및 테스트 장비)',
    koreanName: '광리웨이',
    country: 'CN',
    industry: 'Semiconductors & Healthcare',
    currency: '¥',
    defaultTargetPe: 25,
    tradingViewSymbol: 'SZSE:301095',
    naverTicker: '301095.SZ'
  }
];

async function seedChina() {
  console.log(`Starting seeding of ${CHINA_STOCKS.length} China stocks...`);
  
  for (const stock of CHINA_STOCKS) {
    const docId = `CN_${stock.ticker}`;
    const docRef = db.collection('stocks').doc(docId); // Fixed .document() to .doc()
    
    const newStockData = {
      ...stock,
      eps: 1, // Placeholder
      currentPrice: 1, // Placeholder
      lastUpdated: new Date().toISOString()
    };
    
    await docRef.set(newStockData);
    console.log(`--> Seeded ${docId}: ${stock.name}`);
  }
  
  console.log('Seeding completed successfully!');
}

seedChina();
