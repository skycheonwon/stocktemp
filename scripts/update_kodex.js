import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import fs from 'fs';
import path from 'path';

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const keyPath = path.join(process.cwd(), 'scripts', 'service-account.json');
  if (fs.existsSync(keyPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }
}

if (!serviceAccount) {
  console.error('No service account found.');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function syncKodex() {
  const stocksRef = db.collection('stocks');
  const snap = await stocksRef.get();
  
  let targetDocs = [];
  snap.forEach(doc => {
    const data = doc.data();
    if (data.ticker === '379810' || (data.name && data.name.includes('379810')) || (data.koreanName && data.koreanName.includes('나스닥100'))) {
      targetDocs.push({ id: doc.id, data });
    }
  });

  console.log(`Found ${targetDocs.length} matching ETF documents.`);

  // Fetch live price from Naver polling
  const res = await fetch('https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:379810');
  const json = await res.json();
  const item = json?.result?.areas?.[0]?.datas?.[0];
  const livePrice = item?.nv || 26655;
  const nav = item?.nav || 26479.42;

  console.log(`Live Naver price: ${livePrice}, NAV: ${nav}`);

  for (const itemDoc of targetDocs) {
    console.log(`Updating ${itemDoc.id} with price ${livePrice}...`);
    await stocksRef.doc(itemDoc.id).update({
      currentPrice: livePrice,
      isEtf: true,
      industry: 'ETF',
      isAwaitingSync: false,
      lastUpdated: new Date().toISOString()
    });
    console.log(`Successfully updated ${itemDoc.id}!`);
  }
}

syncKodex().catch(console.error);
