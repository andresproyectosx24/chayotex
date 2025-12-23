// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// 1. Importamos la autenticación
import { getAuth } from "firebase/auth";

// ⬇️ ASEGÚRATE DE QUE ESTA CONFIGURACIÓN SEA LA TUYA (NO BORRES TUS LLAVES)
const firebaseConfig = {
  // ... Pega aquí tus llaves que copiaste anteriormente ...
  // Si ya las tenías, solo deja este objeto como estaba
   apiKey: "AIzaSyCftYklNL13qb5Gq6molS1AUkL4846wOII",
  authDomain: "chayotex-d1b12.firebaseapp.com",
  projectId: "chayotex-d1b12",
  storageBucket: "chayotex-d1b12.firebasestorage.app",
  messagingSenderId: "835094984626",
  appId: "1:835094984626:web:0d97e21d297806300456ab"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
// 2. Exportamos la "auth" para usarla en el Login
export const auth = getAuth(app);