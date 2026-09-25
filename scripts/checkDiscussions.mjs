import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBpFoUhCT4osPDTpyFi9hEIhZhQuG8hBNo",
  authDomain: "stocktemp-c7d77.firebaseapp.com",
  projectId: "stocktemp-c7d77",
  storageBucket: "stocktemp-c7d77.firebasestorage.app",
  messagingSenderId: "323883173569",
  appId: "1:323883173569:web:07b9b579763033a752f640",
  measurementId: "G-W6LNW3PTZ5"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkDiscussions() {
  console.log('🔍 Fetching discussions from Firestore...')
  try {
    const q = query(collection(db, 'discussions'), limit(50))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      console.log('ℹ️ 현재 등록된 댓글(discussions)이 없습니다.')
      return
    }

    console.log(`\n총 ${snapshot.size}개의 댓글이 발견되었습니다:\n`)
    
    // Group by stockId
    const grouped = {}
    snapshot.forEach((doc) => {
      const data = doc.data()
      const stockId = data.stockId || '알수없음'
      if (!grouped[stockId]) grouped[stockId] = []
      grouped[stockId].push({
        id: doc.id,
        author: data.displayName || '익명',
        uid: data.uid,
        content: data.content,
        temp: data.tempAtPost,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString('ko-KR') : '시간미상'
      })
    })

    for (const [stockId, items] of Object.entries(grouped)) {
      console.log(`📌 [종목 ID: ${stockId}] - 댓글 ${items.length}개`)
      items.forEach((item, idx) => {
        console.log(`   ${idx + 1}. [${item.author}] (${item.createdAt}) [${item.temp ? item.temp + '°C' : ''}]`)
        console.log(`      💬 "${item.content}"\n`)
      })
    }
  } catch (error) {
    console.error('Error fetching discussions:', error)
  }
}

checkDiscussions().then(() => process.exit(0))
