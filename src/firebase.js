// File: src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Helper to safely access process.env
const getEnv = (key, fallback) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

// Configuration prioritizes Environment Variables (Vercel/CRA),
// falls back to the hardcoded values provided.
// CHANGED: Added 'export' keyword so we can use this config in UserManagement
export const firebaseConfig = {
  apiKey: getEnv("REACT_APP_FIREBASE_API_KEY", "AIzaSyAmtishEOmSpuxzogrNYxlsQlHYkbz0opo"),
  authDomain: getEnv("REACT_APP_FIREBASE_AUTH_DOMAIN", "logitrack-f8334.firebaseapp.com"),
  projectId: getEnv("REACT_APP_FIREBASE_PROJECT_ID", "logitrack-f8334"),
  storageBucket: getEnv("REACT_APP_FIREBASE_STORAGE_BUCKET", "logitrack-f8334.firebasestorage.app"),
  messagingSenderId: getEnv("REACT_APP_FIREBASE_MESSAGING_SENDER_ID", "118498014046"),
  appId: getEnv("REACT_APP_FIREBASE_APP_ID", "1:118498014046:web:a4455c2b5f419941cb15cf"),
  measurementId: getEnv("REACT_APP_FIREBASE_MEASUREMENT_ID", "G-0B37P3XPR5")
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Use a fixed app ID for your production app
export const appId = "logitrack-production";