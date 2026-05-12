// src/services/firebaseConfig.ts — Firebase app initialisation and singleton accessor for db/auth.
// persistentMultipleTabManager (IndexedDB/web-only) is removed.
// AsyncStorage (via persistenceService) is the persistence layer on mobile.
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  type Auth,
  type Persistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// tsc resolves firebase/auth to the browser .d.ts which omits getReactNativePersistence.
// Metro resolves the RN bundle at runtime which does export it. We declare the module
// augmentation so tsc accepts the import without casting or require().
declare module "firebase/auth" {
  export function getReactNativePersistence(storage: unknown): Persistence;
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
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

  // initializeFirestore with default memory cache (no IndexedDB/multi-tab).
  // Offline persistence is handled by AsyncStorage via PersistenceService.
  let db: Firestore;
  try {
    db = initializeFirestore(app, {});
  } catch {
    // Already initialized for this app instance.
    db = getFirestore(app);
  }

  let auth: Auth;
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    // Already initialized.
    auth = getAuth(app);
  }

  instances = { app, db, auth };
  return instances;
}
