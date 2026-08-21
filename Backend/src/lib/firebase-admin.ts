import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";

function getFirebaseAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function getFirestoreDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export const firestore: Firestore = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    const db = getFirestoreDb();
    const val = Reflect.get(db, prop, receiver);
    if (typeof val === "function") {
      return val.bind(db);
    }
    return val;
  },
});

export const serverTimestamp = FieldValue.serverTimestamp;

export function documentData<T extends Record<string, unknown>>(id: string, data: T) {
  return { id, ...data };
}

