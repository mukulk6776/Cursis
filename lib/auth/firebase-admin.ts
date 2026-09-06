import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let adminAuth: Auth | null = null;

function cleanEnv(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

function cleanPrivateKey(key?: string): string {
  if (!key) return '';
  let cleaned = key.trim().replace(/^["']|["']$/g, '');
  cleaned = cleaned.replace(/\\n/g, '\n');
  return cleaned;
}

try {
  const projectId = cleanEnv(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = cleanEnv(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = cleanPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    const app = !getApps().length
      ? initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        })
      : getApps()[0];

    try {
      adminAuth = getAuth(app);
    } catch (e) {
      console.warn('Firebase Admin getAuth warning:', e);
    }
  }
} catch (error) {
  console.warn('Firebase Admin SDK initialization notice:', error);
}

export { adminAuth };




