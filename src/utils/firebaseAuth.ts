/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable Firestore offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not supported in this browser');
  }
});

const provider = new GoogleAuthProvider();
// Request Workspace scopes for Google Calendar
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');

// Cache the access token in memory / local storage
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('_cached_google_token') : null;
let signInPromise: Promise<{ user: User; accessToken: string } | null> | null = null;

// Initialize auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Allow remaining logged in as Firebase user even without cachedAccessToken (or using the cached token if it exists)
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('_cached_google_token');
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Start Google sign-in
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (signInPromise) {
    return signInPromise;
  }

  signInPromise = (async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Não foi possível obter o token de acesso do Google.');
      }

      cachedAccessToken = credential.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('_cached_google_token', credential.accessToken);
        sessionStorage.setItem('_g_connected', 'true');
      }
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      console.error('Erro de login no Google:', error);
      throw error;
    } finally {
      signInPromise = null;
    }
  })();
  
  return signInPromise;
};

// Retrieve in-memory token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Logout
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('_cached_google_token');
    sessionStorage.removeItem('_g_connected');
  }
};

// Manual Sign In (Email & Password)
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Erro de login manual:', error);
    throw error;
  }
};

// Manual Sign Up (Email, Password & Display Name)
export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName.trim()) {
      await updateProfile(result.user, { displayName: displayName.trim() });
    }
    return result.user;
  } catch (error: any) {
    console.error('Erro de cadastro manual:', error);
    throw error;
  }
};
