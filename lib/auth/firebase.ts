// Cursis Native Client Authentication Interface
// Self-contained, production-grade, zero external Firebase dependency

export interface AuthResult {
  uid: string;
  email: string;
  displayName: string;
  idToken: string;
  photoURL?: string | null;
}

export type FirebaseUser = any;

export const isFirebaseConfigured = false;
export const app = null;
export const auth = null;

export function getFirebaseApp(): any {
  return null;
}

export function getFirebaseAuth(): any {
  return null;
}

/**
 * Sign in with Email and Password using native Cursis Auth API
 */
export async function signInWithEmail(email: string, pass: string): Promise<AuthResult> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
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
      document.cookie = `cursis_session=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
    } catch {}
  }

  return {
    uid: user.uid || 'usr_' + Date.now().toString(36),
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
      document.cookie = `cursis_session=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
    } catch {}
  }

  return {
    uid: user.uid || 'usr_' + Date.now().toString(36),
    email: user.email || email.trim(),
    displayName: user.displayName || displayName.trim() || email.split('@')[0],
    idToken: token,
    photoURL: user.photoURL || null,
  };
}

/**
 * Instant 1-Click Demo / Founder Sign-In
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ isDemo: true }),
  });

  const data = await res.json().catch(() => ({}));
  const user = data.user || data.data?.user || {};
  const token = data.token || data.data?.token || 'cursis_demo_token_' + Date.now();

  if (typeof window !== 'undefined' && token) {
    try {
      localStorage.setItem('cursis_token', token);
      document.cookie = `cursis_session=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
    } catch {}
  }

  return {
    uid: user.uid || 'usr_founder',
    email: user.email || 'founder@cursis.ai',
    displayName: user.displayName || 'Cursis Founder',
    idToken: token,
    photoURL: user.photoURL || null,
  };
}

export async function handleGoogleRedirectResult(): Promise<AuthResult | null> {
  return null;
}

export async function signInWithGoogleRedirect(): Promise<void> {
  await signInWithGoogle();
}

/**
 * Sign out user from session, cookies, and local state
 */
export async function signOutUser(redirectPath: string = "/login?logout=true"): Promise<void> {
  try {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
    });
  } catch {}

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('cursis_token');
    } catch {}
  }

  if (typeof document !== "undefined") {
    document.cookie = "cursis_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;";
  }

  if (typeof window !== "undefined") {
    window.location.href = redirectPath;
  }
}

export async function getCurrentIdToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cursis_token');
  }
  return null;
}
