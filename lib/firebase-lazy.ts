/**
 * Lazy Firebase initialization
 * Only loads Firebase Auth when actually needed (login/signup pages)
 */

let firebasePromise: Promise<any> | null = null;

export async function loadFirebase() {
  if (firebasePromise) return firebasePromise;

  firebasePromise = import('./firebase').then(module => ({
    app: module.app,
    auth: module.auth,
  }));

  return firebasePromise;
}

export function isFirebaseLoaded() {
  return firebasePromise !== null;
}
