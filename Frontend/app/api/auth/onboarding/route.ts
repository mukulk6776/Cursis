import { NextResponse } from "next/server";
import { createSessionToken, getCurrentUser, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";

export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const completedUser = { ...user, onboardingCompleted: true };
  const response = NextResponse.json({ user: completedUser });
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(completedUser), sessionCookieOptions);
  return response;
}
