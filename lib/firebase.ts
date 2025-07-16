// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGHPUJ9yKBQGOzjC49GihgETFRFHwaTgg",
  authDomain: "rune-point-system.firebaseapp.com",
  projectId: "rune-point-system",
  storageBucket: "rune-point-system.firebasestorage.app",
  messagingSenderId: "633599422615",
  appId: "1:633599422615:web:a0af491d5cf378ad8039d2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
