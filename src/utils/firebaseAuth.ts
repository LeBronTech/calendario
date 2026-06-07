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
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const provider = new GoogleAuthProvider();
// Request Workspace scopes for Google Calendar
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');

// Cache the access token in memory
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If we don't have the token in memory, need to trigger a pop-up sign in
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Start Google sign-in
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google.');
    }

    cachedAccessToken = credential.accessToken;
    // Keep reference in case user refreshed but we are in-memory (it persists per page session)
    sessionStorage.setItem('_g_connected', 'true');
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erro de login no Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retrieve in-memory token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Logout
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  sessionStorage.removeItem('_g_connected');
};
