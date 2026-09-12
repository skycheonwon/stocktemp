import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate('scripts/service-account.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Query stocks containing 005380
stocks_ref = db.collection('stocks')
query = stocks_ref.where('ticker', '>=', '005380').where('ticker', '<=', '005380\uf8ff')
docs = query.get()

print(f"Found {len(docs)} documents:")
for doc in docs:
    data = doc.to_dict()
    print(f"ID: {doc.id} | Ticker: {data.get('ticker')} | Name: {data.get('name')} | KoreanName: {data.get('koreanName')} | isAwaitingSync: {data.get('isAwaitingSync')}")
