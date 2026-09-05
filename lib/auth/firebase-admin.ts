import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

try {
  if (!getApps().length) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    }
  } else {
    app = getApps()[0];
  }

  if (app) {
    try {
      adminAuth = getAuth(app);
    } catch {
      adminAuth = undefined;
    }
    try {
      adminDb = getFirestore(app);
    } catch {
      adminDb = undefined;
    }
  }
} catch (error) {
  console.warn('Firebase Admin SDK initialization skipped or encountered error:', error);
}

export { adminAuth, adminDb };

