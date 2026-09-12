import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBpFoUhCT4osPDTpyFi9hEIhZhQuG8hBNo",
  authDomain: "stocktemp-c7d77.firebaseapp.com",
  projectId: "stocktemp-c7d77",
  storageBucket: "stocktemp-c7d77.firebasestorage.app",
  messagingSenderId: "323883173569",
  appId: "1:323883173569:web:07b9b579763033a752f640",
  measurementId: "G-W6LNW3PTZ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
