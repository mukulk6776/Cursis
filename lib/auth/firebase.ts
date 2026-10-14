// Client-Side Firebase Authentication Helper
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  Auth,
  type User as FirebaseUser,
} from "firebase/auth";

import { withAuthTimeout } from "./timeout";

export type { FirebaseUser };

const cleanStr = (val?: string) => (val ? val.trim().replace(/^["']|["']$/g, '') : '');

const firebaseConfig = {
  apiKey: cleanStr(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanStr(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanStr(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "cursis-production",
  storageBucket: cleanStr(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanStr(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanStr(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

export const isFirebaseConfigured = Boolean(
  cleanStr(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) !== ""
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined" && !isFirebaseConfigured) return null;
  try {
    if (getApps().length > 0) {
      app = getApp();
    } else if (isFirebaseConfigured) {
      app = initializeApp(firebaseConfig);
    }
    return app || null;
  } catch (err) {
    console.warn("Firebase App initialization notice:", err);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  try {
    const fApp = getFirebaseApp();
    if (fApp) {
      if (!auth) auth = getAuth(fApp);
      return auth;
    }
  } catch (err) {
    console.warn("Firebase Auth retrieval notice:", err);
  }
  return null;
}

// Lazy initialization - only initialize when actually needed
// Removed automatic initialization to prevent blocking the critical rendering path

export { app, auth };

function generateSafeUid(seed?: string): string {
  const cleanSeed = seed ? seed.toLowerCase().replace(/[^a-z0-9]/g, '') : 'user';
  const prefix = cleanSeed.substring(0, 10) || 'user';
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `usr_${prefix}_${time}_${rand}`;
}

export interface AuthResult {
  uid: string;
  email: string;
  displayName: string;
  idToken: string;
  photoURL?: string | null;
}

/**
 * Sign in with Email and Password using native Cursis Auth API
 */
export async function signInWithEmail(email: string, pass: string): Promise<AuthResult> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email: email.trim(), password: pass }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = typeof data.error === 'string'
      ? data.error
      : data.error?.message || data.message || 'Authentication failed. Please verify your credentials.';
    throw new Error(errorMsg);
  }

  const user = data.user || data.data?.user || {};
  const token = data.token || data.data?.token || '';

  if (typeof window !== 'undefined' && token) {
    try {
      localStorage.setItem('cursis_token', token);
      // SECURITY: Do NOT set cursis_session via document.cookie here.
      // The server sets it with httpOnly+Secure flags. Client-side writes
      // would overwrite the httpOnly cookie, exposing it to XSS attacks.
    } catch {}
  }

  return {
    uid: user.uid || generateSafeUid(email),
    email: user.email || email.trim(),
    displayName: user.displayName || email.split('@')[0],
    idToken: token,
    photoURL: user.photoURL || null,
  };
}

/**
 * Sign up with Name, Email, and Password using native Cursis Auth API
 */
export async function signUpWithEmail(email: string, pass: string, displayName: string): Promise<AuthResult> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: displayName.trim(),
      email: email.trim(),
      password: pass,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = typeof data.error === 'string'
      ? data.error
      : data.error?.message || data.message || 'Failed to create workspace account. Please try again.';
    throw new Error(errorMsg);
  }

  const user = data.user || data.data?.user || {};
  const token = data.token || data.data?.token || '';

  if (typeof window !== 'undefined' && token) {
    try {
      localStorage.setItem('cursis_token', token);
      // SECURITY: Do NOT set cursis_session via document.cookie here.
      // The server sets it with httpOnly+Secure flags. Client-side writes
      // would overwrite the httpOnly cookie, exposing it to XSS attacks.
    } catch {}
  }

  return {
    uid: user.uid || generateSafeUid(email),
    email: user.email || email.trim(),
    displayName: user.displayName || displayName.trim() || email.split('@')[0],
    idToken: token,
    photoURL: user.photoURL || null,
  };
}

/**
 * Sign in with Google. Blocked popups must be retried from a user gesture.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const activeAuth = getFirebaseAuth();

  if (isFirebaseConfigured && activeAuth) {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");
      provider.setCustomParameters({ prompt: 'select_account' });

      const userCredential = await withAuthTimeout(signInWithPopup(activeAuth, provider), 120_000, "Google sign-in timed out. Close the Google window and try again. If it keeps loading, allow popups and cookies for this site.");
      const user = userCredential.user;
      const idToken = await withAuthTimeout(user.getIdToken(), 30_000, "Google could not finish verifying your account. Please try again.");
      return {
        uid: user.uid,
        email: user.email || "google-user@cursis.ai",
        displayName: user.displayName || "Google Workspace User",
        idToken,
        photoURL: user.photoURL,
      };
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        throw err;
      }
      if (code === "auth/popup-blocked") {
        throw Object.assign(new Error("Your browser blocked the Google sign-in popup. Allow popups for this site, then click Continue with Google again."), { code });
      }
      throw err;
    }
  }

  throw new Error("Google Workspace authentication is currently not configured for this environment. Please sign in with your work email and password.");
}

/**
 * Check and resolve any pending Google redirect result on page mount
 */
export async function handleGoogleRedirectResult(): Promise<AuthResult | null> {
  const activeAuth = getFirebaseAuth();
  if (!isFirebaseConfigured || !activeAuth) return null;

  // Only consume an actual redirect result. A persisted Firebase user can be
  // stale and must not start a second session exchange alongside popup login.
  const result = await withAuthTimeout(getRedirectResult(activeAuth), 15_000,
    "Google sign-in could not be restored. Please click Continue with Google to try again.");
  if (!result?.user) return null;
  const user = result.user;
  const idToken = await withAuthTimeout(user.getIdToken(), 30_000,
    "Google could not finish verifying your account. Please try again.");
  return {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "Google User",
    idToken,
    photoURL: user.photoURL,
  };
}

/**
 * Explicit Google Redirect Sign-In
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  const activeAuth = getFirebaseAuth();
  if (isFirebaseConfigured && activeAuth) {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithRedirect(activeAuth, provider);
  }
}

/**
 * Sign out user from Firebase, backend session, cookies, and local state
 */
export async function signOutUser(redirectPath: string = "/login?logout=true"): Promise<void> {
  // 1. Firebase client sign out
  try {
    const activeAuth = getFirebaseAuth();
    if (activeAuth) {
      await signOut(activeAuth);
    }
  } catch (err) {
    console.warn("Firebase signout error:", err);
  }

  // 2. Clear backend session cookie via API
  try {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
    });
  } catch (err) {
    console.warn("Backend session delete error:", err);
  }

  // 3. Clear client-accessible cookies
  if (typeof document !== "undefined") {
    document.cookie = "cursis_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;";
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem('cursis_token');
    } catch {}
    window.location.href = redirectPath;
  }
}

/**
 * Retrieve current user ID token
 */
export async function getCurrentIdToken(): Promise<string | null> {
  const activeAuth = getFirebaseAuth();
  if (activeAuth && activeAuth.currentUser) {
    return activeAuth.currentUser.getIdToken();
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cursis_token');
  }
  return null;
}
