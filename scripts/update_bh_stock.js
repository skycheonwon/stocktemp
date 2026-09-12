import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
  "type": "service_account",
  "project_id": "stocktemp-c7d77",
  "private_key_id": "deaebf7a50fe051e7194bc48cbc3e5ad9390f3e2",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDCerLs7EpmRBTy\nCIjCqTGsLBez8HHSWiRcHFC7r5Zk2Nzv6QuAvVMa7CBKNMp0fymykF1z5Hyk9YVI\nIeL/9SOomhDa09yPqgcvcfzxR9RaQZIjYhbrjBi7IYGiMvrBQELvzdcbAqP40DoU\nZ+CG+7dYEGDFiZfj38mqivKu0BnpHjBQURD/NA9D+zbZ+UN6Gt4PYdPmEKVA0e6B\nvXdT1H1/LXlieUKOYyFnKx4Yn0qTlOUq2zpZ8Bkusnvx9EUOxqoS7Uix+SP/G+Uy\n+TI3avFH+SFKMn3XF+7RTengcQkPDR5MtiuA0IYx4X9ssgk+vRWfQEU72mHdrU/G\nIymM1AzJAgMBAAECggEAMkuzPGy7rQkMda/ZVqaVLxbUJngXp7QiVSQJiRCXD4u6\nT91wWSIdfQf2LdrLRSeh7AlD8fX0emD40DfbUiDe0PrPQxipoQnzA8UyCmBuPc1Z\ncwcqME6yEqtOsFkI2rO42/XbHKQpLe8EJkTbH2238/GAZXX5LziwGggHTUiKeuwc\n0n1XF61Em/bmr7fpUURC+G0gSY8p4hxuUOGaGqgGTqZxiUvaX18t73WNIfphRK1Q\nTtRasBazMnqCyl0DrfSq9M1NhHyy9I3/4NDRXAKI7u3fZ8qLNbfwvV4B+4Q5C3ic\n9tZFvbOIusE9y235XoJpljPf5uu46pNBXo+qAIWspQKBgQD1/Sr+fsxzu+1YYx0K\nzMPyWIm4qH3hI7B7icTzb1T4fRJryBkQ0L2/flzFYKxVdehxp4kKJCeL/iLvujy+\n7KQMoAQTHxbzoRGJsP+4aYcrLOmhG1Lnm6R/b6E8ThYjv7fZ+HU2aR71Zl0Xjhgo\nPqlHSr157p5sP9pG1JvAnBUHHwKBgQDKZODm0fYr0VjKcSRQGdbCMpsipXPm0aaK\UJ5Ay80I14+jnwl8iHib8egPWYpbjSIkk5vAtGVAq2B6qyVI+iY5664C5w49s1Gw\nED615B/nfnLdozDsL5eG7JsuoO1tdpQrR5fIR2skxA5jiiRqxd6MHpEr9MZkLJ3D\nc72/AD93FwKBgAM1jVUKpHIyFnObv2o/p6LGwu00zYedZpUGBBrE7g/b2dysHJ+a\niY8w/9bXXwgyZJju/ZuzQwzRgPUtsdMv1SgRAlyZgDwncsogFAX84nWOvXGLoLZC\n0o+TDkByKFnJC4X9dtIB5xR+hGJlSS1lO+IhOH2ZvlldL+TSq0GFB8UzAoGALDSA\nUqnFJKjixcSUc9JQ77Vx4M1WVTGxOECHcAuTSr0aKFiSD9sWzKi3ULLz3y8iJ+79\nc8dy3f8QYXqD+D56nuf057ljiOJjkxrZN40N0tfxaqs8Ajoa1GNVOYf4k5H0psdK\nRXoj0rHnmqIPdiqlguEiQAGEW1jLVGcxKEh7lB0CgYAxeyz+VQeRaTbkSShOx2GT\nIgihg0pvRMCtSbSQfvOC0mEWInhQVxOdKtuED5FgHUoeD8kEj9OlIbiwhwfjRYN2\nMjjwxAND3EXUdtBwYyfl+va7S96qyFa9Yv0jvFl/gOnWc7Xn//CML1nWlQTL2JRY\nks6nZMacuB/tXy0rSVIThw==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@stocktemp-c7d77.iam.gserviceaccount.com",
  "client_id": "103148109688850996587",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40stocktemp-c7d77.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function updateBHStock() {
  const stockRef = db.collection('stocks').doc('KR_090460');
  const snap = await stockRef.get();
  
  if (snap.exists) {
    console.log('Found KR_090460, updating current price and EPS...');
    await stockRef.update({
      currentPrice: 20450,
      eps: 3250,
      per: 6.29,
      bps: 19800,
      defaultTargetPe: 15
    });
    console.log('Successfully updated KR_090460!');
  } else {
    console.log('Creating KR_090460...');
    await stockRef.set({
      ticker: '090460',
      name: 'BH',
      koreanName: '비에이치',
      country: 'KR',
      industry: 'IT부품/전자',
      currentPrice: 20450,
      eps: 3250,
      per: 6.29,
      bps: 19800,
      currency: '₩',
      defaultTargetPe: 15,
      tradingViewSymbol: 'KRX:090460',
      naverTicker: '090460',
      recommendationReason: 'Registered via Web',
      recommendationCount: 0,
      dislikeCount: 0
    });
    console.log('Successfully created KR_090460!');
  }
}

updateBHStock().catch(console.error);
