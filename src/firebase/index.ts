
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase services safely.
 * Returns nulls if on server-side or if config is missing to prevent build-time crashes.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
} {
  // Guard: Only initialize in the browser
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  // Guard: Ensure we have at least an API key to avoid "invalid-api-key" error from SDK
  if (!firebaseConfig?.apiKey) {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);

    return { firebaseApp, firestore, auth };
  } catch (error) {
    // Fail gracefully to prevent hard crashes during build/hydration
    return { firebaseApp: null, firestore: null, auth: null };
  }
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
