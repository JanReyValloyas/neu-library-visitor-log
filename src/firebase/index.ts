import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAhhbrwi6LTrZi6IPhOswO-J1hcGeJCCQw",
  authDomain: "neu-library-visitor-log-46c47.firebaseapp.com",
  projectId: "neu-library-visitor-log-46c47",
  storageBucket: "neu-library-visitor-log-46c47.firebasestorage.app",
  messagingSenderId: "538975536299",
  appId: "1:538975536299:web:7ad7e7734433ef5a2963ee"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
setPersistence(auth, browserLocalPersistence);

export { app, auth, db };
