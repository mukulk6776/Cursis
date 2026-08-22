import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function app() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function getFirestoreDb() {
  const firebaseApp = app();
  if (!firebaseApp) return null;
  return getFirestore(firebaseApp);
}
export const serverTimestamp = FieldValue.serverTimestamp;
export const withId = <T extends Record<string, unknown>>(id: string, data: T) => ({ id, ...data });
