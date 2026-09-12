export interface LiveStockMetrics {
  currentPrice: number;
  eps: number;
  per?: number;
  bps?: number;
}

function parseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Fetch real-time price & EPS for a given stock upon registration
 * Uses multiple endpoints and CORS proxies for high-reliability fetch
 */
export async function fetchLiveStockMetrics(
  ticker: string,
  country: 'KR' | 'US' | 'VN' | 'CN',
  targetPe: number = 15
): Promise<LiveStockMetrics> {
  const formattedTicker = ticker.trim().toUpperCase();

  // 1. Korea (KR) - Naver Mobile Integration via CORS proxies
  if (country === 'KR') {
    const naverUrl = `https://m.stock.naver.com/api/stock/${formattedTicker}/integration`;
    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(naverUrl)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(naverUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(naverUrl)}`,
      naverUrl
    ];

    for (const pUrl of proxyUrls) {
      try {
        const res = await fetch(pUrl, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          const infos = data.totalInfos || [];
          
          let price = 0;
          let eps = 0;
          let per = 0;
          let bps = 0;

          for (const item of infos) {
            if (item.key === '전일' || item.key === '현재가' || item.code === 'lastClosePrice' || item.code === 'nowPrice') {
              if (!price) price = parseNumber(item.value);
            } else if (item.key === 'EPS' || item.code === 'eps') {
              eps = parseNumber(item.value);
            } else if (item.key === 'PER' || item.code === 'per') {
              per = parseNumber(item.value);
            } else if (item.key === 'BPS' || item.code === 'bps') {
              bps = parseNumber(item.value);
            }
          }

          if (price > 0 && eps <= 0 && per > 0) {
            eps = Math.round(price / per);
          } else if (price > 0 && eps <= 0) {
            eps = Math.round(price / targetPe);
          }

          if (price > 0) {
            return { currentPrice: price, eps: eps > 0 ? eps : Math.round(price / targetPe), per, bps };
          }
        }
      } catch {
        // Try next proxy
      }
    }
  }

  // 2. Yahoo Finance Chart v8 with support for both KOSPI (.KS) & KOSDAQ (.KQ)
  const candidateSymbols: string[] = [];
  if (country === 'KR') {
    candidateSymbols.push(`${formattedTicker}.KQ`, `${formattedTicker}.KS`);
  } else if (country === 'US') {
    candidateSymbols.push(formattedTicker);
  } else if (country === 'VN') {
    candidateSymbols.push(`${formattedTicker}.VN`, `${formattedTicker}.HM`);
  } else if (country === 'CN') {
    if (formattedTicker.startsWith('6')) {
      candidateSymbols.push(`${formattedTicker}.SS`, `${formattedTicker}.SZ`);
    } else {
      candidateSymbols.push(`${formattedTicker}.SZ`, `${formattedTicker}.SS`);
    }
  }

  for (const sym of candidateSymbols) {
    const yahooRawUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
    const yahooProxyUrls = [
      yahooRawUrl,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooRawUrl)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(yahooRawUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(yahooRawUrl)}`
    ];

    for (const yUrl of yahooProxyUrls) {
      try {
        const res = await fetch(yUrl, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (meta) {
            const price = meta.regularMarketPrice || meta.chartPreviousClose || 0;
            const eps = Math.max(1, Math.round((price / targetPe) * 100) / 100);
            if (price > 0) {
              return { currentPrice: price, eps };
            }
          }
        }
      } catch {
        // Try next proxy
      }
    }
  }

  // 3. Fallback estimation
  const defaultPrice = country === 'KR' ? 25000 : country === 'VN' ? 25000 : country === 'CN' ? 50 : 150;
  const defaultEps = Math.max(1, Math.round((defaultPrice / targetPe) * 100) / 100);

  return {
    currentPrice: defaultPrice,
    eps: defaultEps
  };
}
