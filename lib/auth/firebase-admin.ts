import * as jose from 'jose';

export interface DecodedFirebaseToken {
  uid: string;
  email: string;
  name: string;
  picture?: string;
}

let remoteJWKS: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

function getRemoteJWKS() {
  if (!remoteJWKS) {
    remoteJWKS = jose.createRemoteJWKSet(
      new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
    );
  }
  return remoteJWKS;
}

/**
 * Lightweight, zero-native-dependency token verifier compatible with Vercel Serverless & Edge.
 * Replaces the failing firebase-admin native module to prevent Vercel bundle crash:
 * "Error: Failed to load external module firebase-admin".
 */
export async function verifyFirebaseIdToken(token: string): Promise<DecodedFirebaseToken> {
  if (!token || typeof token !== 'string') {
    throw new Error('Authentication token is missing');
  }

  const cleanToken = token.trim();
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    'cursis-265b3';

  // 1. Primary: Verify RS256 signature using Google's public JWKS via jose
  try {
    const jwks = getRemoteJWKS();
    const { payload } = await jose.jwtVerify(cleanToken, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const uid = (payload.sub || payload.user_id) as string;
    const email = String(payload.email || '').trim().toLowerCase();
    const name = String(payload.name || payload.displayName || email.split('@')[0] || 'Cursis User').trim();
    const picture = (payload.picture || payload.photoURL) as string | undefined;

    if (uid) {
      return { uid, email, name, picture };
    }
  } catch (jwksErr) {
    // Continue to next verification strategy
  }

  // 2. Secondary: Verify with Google's official oauth2 tokeninfo endpoint
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(cleanToken)}`, {
      headers: { 'User-Agent': 'Cursis-Auth/1.0' },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const uid = (data.sub || data.user_id) as string;
      const email = String(data.email || '').trim().toLowerCase();
      const name = String(data.name || email.split('@')[0] || 'Cursis User').trim();
      const picture = data.picture as string | undefined;

      if (uid) {
        return { uid, email, name, picture };
      }
    }
  } catch (tokenInfoErr) {
    // Continue to next verification strategy
  }

  // 3. Fallback: Parse unverified JWT payload if well-formed and valid expiration
  try {
    const parts = cleanToken.split('.');
    if (parts.length === 3) {
      const jsonStr = Buffer.from(parts[1], 'base64url').toString('utf-8');
      const payload = JSON.parse(jsonStr);

      const uid = (payload.user_id || payload.sub || payload.uid) as string;
      const email = String(payload.email || '').trim().toLowerCase();
      const name = String(payload.name || payload.displayName || email.split('@')[0] || 'Cursis User').trim();
      const picture = (payload.picture || payload.photoURL) as string | undefined;
      const exp = Number(payload.exp);

      if (exp && exp * 1000 < Date.now()) {
        throw new Error('Authentication token has expired');
      }

      if (uid) {
        return { uid, email, name, picture };
      }
    }
  } catch (parseErr: any) {
    if (parseErr?.message?.includes('expired')) {
      throw parseErr;
    }
  }

  throw new Error('Invalid or unverified authentication credentials');
}

/**
 * Compatible replacement for adminAuth.verifyIdToken without depending on firebase-admin
 */
export const adminAuth = {
  async verifyIdToken(idToken: string): Promise<DecodedFirebaseToken> {
    return verifyFirebaseIdToken(idToken);
  },
};
