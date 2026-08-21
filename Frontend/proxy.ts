import { NextRequest, NextResponse } from "next/server";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

// All internal operations and tools REQUIRE authentication
// Notice: /dashboard and marketing pages are public so /dashboard can be seen without login!
const protectedPrefixes = [
  "/tasks",
  "/workspace-setup",
  "/products",
  "/inventory",
  "/orders",
  "/customers",
  "/pos",
  "/payments",
  "/expenses",
  "/transactions",
  "/analytics",
  "/reports",
  "/crm",
  "/employees",
  "/udhar",
  "/data-management",
  "/spreadsheet",
  "/web-builder",
  "/settings",
  "/help",
  "/onboarding",
];

const authPaths = ["/login", "/signup", "/forgot-password", "/auth/login", "/auth/signup"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Normalize legacy auth paths
  if (pathname === "/auth/login" || pathname === "/forgot-password") {
    return NextResponse.redirect(new URL(`/login${search}`, request.url));
  }
  if (pathname === "/auth/signup") {
    return NextResponse.redirect(new URL(`/signup${search}`, request.url));
  }

  const user = readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  // 1. If guest user tries to access any protected internal page, redirect to /login
  // Only /dashboard and public pages can be seen without login/sign-up!
  if (isProtectedPath(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If already logged-in user visits /login or /signup, redirect to /dashboard
  if (user && authPaths.includes(pathname)) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const target = redirectParam?.startsWith("/") ? redirectParam : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const middleware = proxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|.*\\..*).*)"],
};
