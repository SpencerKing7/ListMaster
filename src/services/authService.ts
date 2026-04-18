// src/services/authService.ts
import {
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirebaseInstances } from "./firebaseConfig";

// MARK: - Auth

/**
 * Signs in anonymously if no user is currently authenticated.
 * Returns a promise that resolves to the authenticated User.
 */
export function ensureAnonymousAuth(): Promise<User> {
  const { auth } = getFirebaseInstances();
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        signInAnonymously(auth)
          .then((credential) => resolve(credential.user))
          .catch(reject);
      }
    });
  });
}
