import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getCurrentUser, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";

import { isAllowedEmailDomain, EMAIL_RESTRICTION_MESSAGE } from "@/lib/auth/email-validation";

type SessionRequest = {
  email?: string;
  name?: string;
  mode?: "login" | "signup";
};

export async function GET() {
  return NextResponse.json({ user: await getCurrentUser() });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SessionRequest | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const name = body?.name?.trim() || email.split("@")[0] || "Cursis user";

  if (!isAllowedEmailDomain(email)) {
    return NextResponse.json({ error: EMAIL_RESTRICTION_MESSAGE }, { status: 400 });
  }

  // This project has no identity provider or user database configured yet. Passwords
  // are intentionally never stored by this session adapter; replace this endpoint's
  // credential validation with a provider implementation when one is connected.
  const user = { name, email, onboardingCompleted: body?.mode !== "signup" };
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user), sessionCookieOptions);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
