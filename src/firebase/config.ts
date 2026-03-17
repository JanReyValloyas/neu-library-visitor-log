
'use client';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAhhbrwi6LTrZi6IPhOswO-J1hcGeJCCQw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "neu-library-visitor-log-46c47.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "neu-library-visitor-log-46c47",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "neu-library-visitor-log-46c47.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "538975536299",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:538975536299:web:7ad7e7734433ef5a2963ee",
};
