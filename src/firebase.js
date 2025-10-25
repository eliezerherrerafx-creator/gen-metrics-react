// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// ✅ Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCZbwu6VIxLv_hkFrb_PLKVhVHAPGkfxbc",
  authDomain: "miappdeseguimiento-98816.firebaseapp.com",
  projectId: "miappdeseguimiento-98816",
  storageBucket: "miappdeseguimiento-98816.firebasestorage.app",
  messagingSenderId: "387077383194",
  appId: "1:387077383194:web:0153d9967255a111801da3",
  measurementId: "G-N1CP7H0DFR"
};

// 🔥 Inicializa Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
