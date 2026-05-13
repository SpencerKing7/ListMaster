// src/services/authService.ts
// Manages Firebase anonymous authentication for cloud sync.
import {
  signInAnonymously,
  onAuthStateChanged,
  deleteUser,
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

/**
 * Deletes the current anonymous Firebase auth user, cleaning up the credential
 * from Firebase Auth. Called during full account reset so the anonymous user
 * does not accumulate in the Firebase project.
 */
export async function deleteAnonymousUser(): Promise<void> {
  const { auth } = getFirebaseInstances();
  const user = auth.currentUser;
  if (user) {
    await deleteUser(user);
  }
}
