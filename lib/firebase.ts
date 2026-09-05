import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if there are no existing initialized apps and config is present
let app;
let auth: any;
let db: any;

if (typeof window !== 'undefined' && !firebaseConfig.apiKey) {
  console.warn("Firebase API Key is missing. Please add it to .env.local to enable backend features.");
}

if (firebaseConfig.apiKey) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Dummy objects to prevent crash when env variables are missing
  app = {} as any;
  auth = { onAuthStateChanged: () => () => {}, currentUser: null } as any;
  db = {} as any;
}

export { app, auth, db };
