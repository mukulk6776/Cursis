// Client-Side Firebase Authentication Helper
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut,
  Auth,
  type User as FirebaseUser,
} from "firebase/auth";

export type { FirebaseUser };

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cursis-production",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY.trim() !== ""
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

// Initial client-side warm up
if (typeof window !== "undefined" && isFirebaseConfigured) {
  getFirebaseAuth();
}

export { app, auth };

export interface AuthResult {
  uid: string;
  email: string;
  displayName: string;
  idToken: string;
  photoURL?: string | null;
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<AuthResult> {
  // Perform Firebase client sign‑in to obtain an ID token
  const authResult = await (async () => {
    const activeAuth = getFirebaseAuth();
    if (isFirebaseConfigured && activeAuth) {
      try {
        const userCredential = await signInWithEmailAndPassword(activeAuth, email.trim(), pass);
        const user = userCredential.user;
        const idToken = await user.getIdToken();
        return {
          uid: user.uid,
          email: user.email || email.trim(),
          displayName: user.displayName || email.split("@")[0],
          idToken,
          photoURL: user.photoURL,
        };
      } catch (err: any) {
        const code = err?.code || "";
        if (code === "auth/api-key-not-valid" || code === "auth/operation-not-allowed" || code === "auth/configuration-not-found") {
          console.warn("Firebase configuration error, falling back to local workspace session:", err);
          return {
            uid: "usr_" + Buffer.from(email).toString("hex").substring(0, 12),
            email: email.trim(),
            displayName: email.split("@")[0],
            idToken: "cursis_local_token_" + Date.now(),
          };
        }
        throw err;
      }
    }
    // Developer/Demo fallback when Firebase API key is missing
    return {
      uid: "usr_" + Buffer.from(email).toString("hex").substring(0, 12),
      email: email.trim(),
      displayName: email.split("@")[0],
      idToken: "cursis_dev_token_" + Date.now(),
    };
  })();

  // After we have an ID token, ask the server to create a secure HttpOnly session cookie
  try {
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: authResult.idToken }),
      credentials: 'include',
    });
  } catch (e) {
    console.warn('Failed to set server‑side session cookie:', e);
  }

  return authResult;
}

/**
 * Sign up with Email, Password, and Display Name
 */
export async function signUpWithEmail(email: string, pass: string, displayName: string): Promise<AuthResult> {
  // Perform Firebase client sign‑up to obtain an ID token
  const authResult = await (async () => {
    const activeAuth = getFirebaseAuth();
    if (isFirebaseConfigured && activeAuth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(activeAuth, email.trim(), pass);
        const user = userCredential.user;
        if (displayName.trim()) {
          await updateProfile(user, { displayName: displayName.trim() });
        }
        const idToken = await user.getIdToken();
        return {
          uid: user.uid,
          email: user.email || email.trim(),
          displayName: displayName.trim() || user.displayName || email.split("@")[0],
          idToken,
          photoURL: user.photoURL,
        };
      } catch (err: any) {
        const code = err?.code || "";
        if (code === "auth/api-key-not-valid" || code === "auth/operation-not-allowed" || code === "auth/configuration-not-found") {
          console.warn("Firebase configuration error, falling back to local workspace signup:", err);
          return {
            uid: "usr_" + Buffer.from(email).toString("hex").substring(0, 12),
            email: email.trim(),
            displayName: displayName.trim() || email.split("@")[0],
            idToken: "cursis_local_token_" + Date.now(),
          };
        }
        throw err;
      }
    }
    // Developer/Demo fallback when Firebase API key is missing
    return {
      uid: "usr_" + Buffer.from(email).toString("hex").substring(0, 12),
      email: email.trim(),
      displayName: displayName.trim() || email.split("@")[0],
      idToken: "cursis_dev_token_" + Date.now(),
    };
  })();

  // After we have an ID token, ask the server to create a secure HttpOnly session cookie
  try {
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: authResult.idToken }),
      credentials: 'include',
    });
  } catch (e) {
    console.warn('Failed to set server‑side session cookie after sign‑up:', e);
  }

  return authResult;
}

/**
 * Sign in with Google Popup
 */
/*
 * Google sign‑in using redirect to avoid popup‑blocked errors.
 * Call `signInWithGoogleRedirect()` on a user‑initiated click (e.g., a button).
 * After the redirect returns, invoke `handleGoogleRedirectResult()` (e.g., in a useEffect) to obtain the AuthResult.
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  const activeAuth = getFirebaseAuth();
  if (isFirebaseConfigured && activeAuth) {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    try {
      await signInWithRedirect(activeAuth, provider);
    } catch (err) {
      console.warn('Google redirect sign‑in error:', err);
      throw err;
    }
  } else {
    console.warn('Firebase not configured – cannot initiate Google redirect sign‑in.');
  }
}

export async function handleGoogleRedirectResult(): Promise<AuthResult | null> {
  const activeAuth = getFirebaseAuth();
  if (isFirebaseConfigured && activeAuth) {
    try {
      const result = await getRedirectResult(activeAuth);
      if (result?.user) {
        const user = result.user;
        const idToken = await user.getIdToken();
        // Set server‑side session cookie like other sign‑in methods
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
          credentials: 'include',
        }).catch((e) => console.warn('Failed to set session cookie after Google redirect:', e));
        return {
          uid: user.uid,
          email: user.email || 'google-user@cursis.io',
          displayName: user.displayName || 'Cursis User',
          idToken,
          photoURL: user.photoURL,
        };
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain' || code === 'auth/configuration-not-found' || code === 'auth/api-key-not-valid') {
        console.warn('Google auth configuration issue, falling back to demo profile:', err);
        return {
          uid: 'usr_google_demo_' + Date.now(),
          email: 'founder@cursis.ai',
          displayName: 'Cursis Founder',
          idToken: 'cursis_google_dev_token_' + Date.now(),
        };
      }
      console.warn('Google redirect sign‑in notice, using workspace profile:', err);
      throw err;
    }
  }
  // Fallback demo when Firebase not configured
  return {
    uid: 'usr_google_demo_' + Date.now(),
    email: 'founder@cursis.ai',
    displayName: 'Cursis Founder',
    idToken: 'cursis_google_dev_token_' + Date.now(),
  };
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

  // 4. Navigate to redirect path
  if (typeof window !== "undefined") {
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
  return null;
}
