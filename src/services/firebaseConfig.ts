// src/services/firebaseConfig.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

interface FirebaseInstances {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

let instances: FirebaseInstances | null = null;

/**
 * Returns the singleton Firebase app, Firestore, and Auth instances.
 * Instances are created lazily on first call to avoid loading Firebase
 * for users who never enable sync.
 */
export function getFirebaseInstances(): FirebaseInstances {
  if (instances) return instances;

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app);
  const auth = getAuth(app);

  instances = { app, db, auth };
  return instances;
}
