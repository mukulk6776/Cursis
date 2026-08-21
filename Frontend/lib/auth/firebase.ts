import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from "firebase/auth";
import { getFirestore, Firestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { isAllowedEmailDomain, EMAIL_RESTRICTION_MESSAGE } from "./email-validation";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAJfOF0cn3u7E5wkwgw6nPa6q2p_GMkiKU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dataora-6e1ae.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dataora-6e1ae",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dataora-6e1ae.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "193314932674",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:193314932674:web:bad5389228a3c6f84cf85b",
};

// Singleton initialization for Next.js SSR & client
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const microsoftProvider = new OAuthProvider("microsoft.com");
microsoftProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Sign in with email and password (enforces Gmail and Microsoft domains)
 */
export async function loginWithEmail(email: string, password: string) {
  if (!isAllowedEmailDomain(email)) {
    throw new Error(EMAIL_RESTRICTION_MESSAGE);
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign up with email, password, and display name (enforces Gmail and Microsoft domains)
 */
export async function signupWithEmail(email: string, password: string, displayName?: string) {
  if (!isAllowedEmailDomain(email)) {
    throw new Error(EMAIL_RESTRICTION_MESSAGE);
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && userCredential.user) {
    try {
      await updateProfile(userCredential.user, { displayName });
    } catch {
      // Non-critical profile update
    }
  }

  // Gracefully attempt user profile creation in Firestore
  if (userCredential.user) {
    try {
      await setDoc(
        doc(db, "users", userCredential.user.uid),
        {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName || userCredential.user.email?.split("@")[0] || "Cursis User",
          provider: "password",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (firestoreError) {
      console.warn("Firestore user sync skipped (insufficient cloud permissions):", firestoreError);
    }
  }

  return userCredential.user;
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle() {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const user = userCredential.user;
  if (user && user.email) {
    if (!isAllowedEmailDomain(user.email)) {
      await signOut(auth);
      throw new Error(EMAIL_RESTRICTION_MESSAGE);
    }

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0] || "Cursis User",
          photoURL: user.photoURL,
          provider: "google.com",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (firestoreError) {
      console.warn("Firestore user sync skipped (insufficient cloud permissions):", firestoreError);
    }
  }
  return user;
}

/**
 * Sign in with Microsoft Popup
 */
export async function loginWithMicrosoft() {
  const userCredential = await signInWithPopup(auth, microsoftProvider);
  const user = userCredential.user;
  if (user && user.email) {
    if (!isAllowedEmailDomain(user.email)) {
      await signOut(auth);
      throw new Error(EMAIL_RESTRICTION_MESSAGE);
    }

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0] || "Cursis User",
          photoURL: user.photoURL,
          provider: "microsoft.com",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (firestoreError) {
      console.warn("Firestore user sync skipped (insufficient cloud permissions):", firestoreError);
    }
  }
  return user;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  if (!isAllowedEmailDomain(email)) {
    throw new Error(EMAIL_RESTRICTION_MESSAGE);
  }
  await sendPasswordResetEmail(auth, email);
}

/**
 * Sign out from Firebase
 */
export async function logoutFirebase() {
  await signOut(auth);
}

/**
 * Save workspace setup data into Firestore
 */
export async function saveWorkspaceSetupToFirestore(userId: string, data: Record<string, unknown>) {
  try {
    await setDoc(
      doc(db, "workspaces", userId),
      {
        ...data,
        userId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn("Firestore workspace sync skipped (insufficient cloud permissions):", error);
    return false;
  }
}

/**
 * Auth state listener
 */
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export default app;