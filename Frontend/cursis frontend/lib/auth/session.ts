import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "dataora_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  onboardingCompleted: boolean;
};

type SessionPayload = SessionUser & {
  version: 1;
  issuedAt: number;
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SESSION_SECRET must be set in production.");
  }
  return "dataora-local-development-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safelyCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(user: Omit<SessionUser, "id"> & { id?: string }) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    version: 1,
    id: user.id ?? randomUUID(),
    name: user.name,
    email: user.email.toLowerCase(),
    onboardingCompleted: user.onboardingCompleted,
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readSessionToken(token?: string | null): SessionUser | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safelyCompare(sign(encodedPayload), signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if (payload.version !== 1 || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    if (!payload.id || !payload.name || !payload.email) return null;
    return { id: payload.id, name: payload.name, email: payload.email, onboardingCompleted: payload.onboardingCompleted };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};
