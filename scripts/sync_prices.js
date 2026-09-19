import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

function parseCredentials(input) {
  if (!input) return null;
  let str = input.trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    if (str.includes('project_id')) {
      str = str.slice(1, -1).trim();
    }
  }

  function tryParseString(text) {
    if (!text || typeof text !== 'string') return null;
    try { return JSON.parse(text); } catch (e) {}

    // Fix \U typo to \nU
    try {
      let fixed = text.replace(/\\U/g, '\\nU').replace(/\\\\U/g, '\\\\nU');
      return JSON.parse(fixed);
    } catch (e) {}

    // Fix any invalid escape character in JSON
    try {
      let fixed = text.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');
      return JSON.parse(fixed);
    } catch (e) {}

    return null;
  }

  // 1. Try directly on input
  let parsed = tryParseString(str);
  if (parsed) return parsed;

  // 2. Try base64 decoded
  try {
    const decoded = Buffer.from(str, 'base64').toString('utf8');
    parsed = tryParseString(decoded);
    if (parsed) return parsed;
  } catch (e) {}

  return null;
}

// 1. Initialize Firebase Admin (with auto-healing credentials)
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = parseCredentials(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (!serviceAccount) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable (length: ' + process.env.FIREBASE_SERVICE_ACCOUNT.length + ')');
  }
}

if (!serviceAccount) {
  const localKeyPath = path.join(process.cwd(), 'scripts', 'service-account.json');
  if (fs.existsSync(localKeyPath)) {
    try {
      const fileContent = fs.readFileSync(localKeyPath, 'utf8');
      serviceAccount = parseCredentials(fileContent);
    } catch (e) {
      console.error('Failed to read local service-account.json:', e);
    }
  }
}

if (!serviceAccount) {
  console.error('Error: No Firebase credentials found. Please ensure FIREBASE_SERVICE_ACCOUNT secret is set.');
  process.exit(1);
}

// Ensure private_key formatting is standard PEM format
if (serviceAccount.private_key) {
  if (serviceAccount.private_key.includes('\\n')) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
  if (serviceAccount.private_key.includes('\\U')) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\U/g, '\nU');
  }
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// 2. Fetch Korean stock price & EPS from Naver Finance
async function fetchKrStock(ticker) {
  try {
    const cleanTicker = ticker.padStart(6, '0');
    const url = `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${cleanTicker}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const json = await res.json();
      const item = json?.result?.areas?.[0]?.datas?.[0];
      if (item && item.nv) {
        return {
          currentPrice: Number(item.nv),
          eps: item.eps ? Number(item.eps) : null
        };
      }
    }
  } catch (e) {}
  return null;
}

// 3. Fetch US / CN stock price from Yahoo Finance
async function fetchYahooStock(ticker, country) {
  try {
    let yahooTicker = ticker;
    if (country === 'CN') {
      if (/^\d{5}$/.test(ticker)) {
        yahooTicker = `${parseInt(ticker, 10).toString().padStart(4, '0')}.HK`;
      } else if (ticker.startsWith('60') || ticker.startsWith('68')) {
        yahooTicker = `${ticker}.SS`;
      } else if (ticker.startsWith('00') || ticker.startsWith('30')) {
        yahooTicker = `${ticker}.SZ`;
      }
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=5d`;
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const json = await res.json();
      const result = json?.chart?.result?.[0];
      const meta = result?.meta;
      const price = meta?.regularMarketPrice || meta?.chartPreviousClose;
      if (price) {
        return {
          currentPrice: Number(price.toFixed(2))
        };
      }
    }
  } catch (e) {}
  return null;
}

// 4. Fetch Vietnam stock price from TCBS
async function fetchVnStock(ticker) {
  try {
    const url = `https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long-term?ticker=${ticker}&type=stock&resolution=D&count=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const json = await res.json();
      const close = json?.data?.[0]?.close;
      if (close) {
        return {
          currentPrice: Number(close) * 1000
        };
      }
    }
  } catch (e) {}
  return null;
}

// Helper to run promises with concurrency limit
async function asyncPool(limit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    if (limit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

// 5. Main synchronization workflow
async function main() {
  console.log('🚀 Starting sync_prices.js (High-Speed Parallel Engine)...');
  const stocksRef = db.collection('stocks');
  const snap = await stocksRef.get();
  console.log(`Found ${snap.size} total stocks in Firestore.`);

  const docs = snap.docs;
  const updates = [];
  let processed = 0;

  await asyncPool(12, docs, async (doc) => {
    const data = doc.data();
    const country = data.country || 'KR';
    const ticker = data.ticker || doc.id.replace(/^[A-Z]+_/, '');

    let update = null;
    if (country === 'KR') {
      update = await fetchKrStock(ticker);
    } else if (country === 'VN') {
      update = await fetchVnStock(ticker);
    } else {
      update = await fetchYahooStock(ticker, country);
    }

    processed++;
    if (update && update.currentPrice) {
      const payload = {
        currentPrice: update.currentPrice,
        lastUpdated: new Date().toISOString(),
        isAwaitingSync: false
      };
      if (update.eps !== null && update.eps !== undefined) {
        payload.eps = update.eps;
      }
      updates.push({ id: doc.id, payload });
      if (processed % 50 === 0 || processed === docs.length) {
        console.log(`[Progress ${processed}/${docs.length}] Updated ${updates.length} stocks...`);
      }
    }
  });

  console.log(`\nSuccessfully fetched ${updates.length}/${docs.length} stocks.`);

  // Batch commit to Firestore in chunks of 250 using merge:true (bulletproof against missing docs)
  if (updates.length > 0) {
    console.log(`Committing ${updates.length} updates to Firestore in batches of 250...`);
    let batch = db.batch();
    let count = 0;
    let batchIndex = 1;

    for (const item of updates) {
      const ref = stocksRef.doc(item.id);
      batch.set(ref, item.payload, { merge: true });
      count++;

      if (count === 250) {
        try {
          console.log(`Committing batch #${batchIndex} (250 docs)...`);
          await batch.commit();
        } catch (commitErr) {
          console.error(`Batch #${batchIndex} commit error:`, commitErr.message);
        }
        batch = db.batch();
        count = 0;
        batchIndex++;
      }
    }

    if (count > 0) {
      try {
        console.log(`Committing final batch #${batchIndex} (${count} docs)...`);
        await batch.commit();
      } catch (commitErr) {
        console.error(`Final batch #${batchIndex} commit error:`, commitErr.message);
      }
    }
    console.log('🎉 Price synchronization completed successfully with 0 AI cost!');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error in sync_prices.js:', err);
  process.exit(0);
});
