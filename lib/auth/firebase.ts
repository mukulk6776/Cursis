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
  User as FirebaseUser,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

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
let db: Firestore | undefined;

if (isFirebaseConfigured) {
  try {
    if (getApps().length > 0) {
      app = getApp();
      auth = getAuth(app);
      db = getFirestore(app);
    } else {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (err) {
    console.warn("Firebase initialization error:", err);
  }
}

export { app, auth, db };

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
  if (isFirebaseConfigured && auth) {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    return {
      uid: user.uid,
      email: user.email || email.trim(),
      displayName: user.displayName || email.split("@")[0],
      idToken,
      photoURL: user.photoURL,
    };
  }

  // Developer/Demo fallback when Firebase API key is unpopulated
  return {
    uid: "usr_" + Buffer.from(email).toString("hex").substring(0, 12),
    email: email.trim(),
    displayName: email.split("@")[0],
    idToken: "cursis_dev_token_" + Date.now(),
  };
}

/**
 * Sign up with Email, Password, and Display Name
 */
export async function signUpWithEmail(email: string, pass: string, displayName: string): Promise<AuthResult> {
  if (isFirebaseConfigured && auth) {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
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
  }

  return {
    uid: "usr_" + Buffer.from(email).toString("hex").substring(0, 12),
    email: email.trim(),
    displayName: displayName.trim() || email.split("@")[0],
    idToken: "cursis_dev_token_" + Date.now(),
  };
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  if (isFirebaseConfigured && auth) {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    return {
      uid: user.uid,
      email: user.email || "google-user@cursis.io",
      displayName: user.displayName || "Cursis User",
      idToken,
      photoURL: user.photoURL,
    };
  }

  return {
    uid: "usr_google_demo_" + Date.now(),
    email: "founder@cursis.ai",
    displayName: "Cursis Founder",
    idToken: "cursis_google_dev_token_" + Date.now(),
  };
}

/**
 * Sign out user from Firebase and backend session
 */
export async function signOutUser(): Promise<void> {
  try {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
  } catch (err) {
    console.warn("Firebase signout error:", err);
  }

  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch (err) {
    console.warn("Backend session delete error:", err);
  }

  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/**
 * Retrieve current user ID token
 */
export async function getCurrentIdToken(): Promise<string | null> {
  if (isFirebaseConfigured && auth && auth.currentUser) {
    return auth.currentUser.getIdToken();
  }
  return null;
}
