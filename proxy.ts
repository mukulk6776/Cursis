import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isSessionTokenValid } from '@/lib/auth/token';

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return res;
}

/**
 * Validate that a redirect target is strictly an internal, relative path.
 * Blocks protocol-relative URLs (//evil.com), backslash escapes (/\\evil.com),
 * CRLF/null bytes, and parses against a reference origin to prevent open-redirect vulnerabilities.
 */
function getSafeRelativeRedirect(target: string | null | undefined, fallback: string = '/dashboard'): string {
  if (!target || typeof target !== 'string') return fallback;
  const trimmed = target.trim();
  // Must start with exactly one '/' and not contain backslashes or protocol-relative '//'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.includes('\\')) {
    return fallback;
  }
  // Disallow CRLF or null bytes
  if (/[\r\n\0]/.test(trimmed)) {
    return fallback;
  }
  // Confirm target parses strictly within the local application origin
  try {
    const dummyOrigin = 'http://localhost';
    const parsed = new URL(trimmed, dummyOrigin);
    if (parsed.origin !== dummyOrigin || !parsed.pathname.startsWith('/') || parsed.pathname.startsWith('//')) {
      return fallback;
    }
  } catch {
    return fallback;
  }
  return trimmed;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Lightweight Edge WAF: Mitigate directory traversal, null-byte injection, XSS, and attack probes
  const rawUrl = request.nextUrl.pathname + request.nextUrl.search;
  let decodedUrl = rawUrl;
  let doubleDecodedUrl = rawUrl;
  try {
    decodedUrl = decodeURIComponent(rawUrl);
    try {
      doubleDecodedUrl = decodeURIComponent(decodedUrl);
    } catch {
      doubleDecodedUrl = decodedUrl;
    }
  } catch {
    // Malformed URI encoding is treated as suspicious
    decodedUrl = rawUrl;
    doubleDecodedUrl = rawUrl;
  }

  const lowerRaw = rawUrl.toLowerCase();
  const lowerDecoded = decodedUrl.toLowerCase();
  const lowerDoubleDecoded = doubleDecodedUrl.toLowerCase();

  const isMalicious =
    // Directory traversal (raw, decoded, and double-decoded)
    lowerRaw.includes('..') ||
    lowerDecoded.includes('..') ||
    lowerDoubleDecoded.includes('..') ||
    lowerRaw.includes('%2e%2e') ||
    lowerRaw.includes('%252e') ||
    lowerDoubleDecoded.includes('%2e%2e') ||
    // Null byte injection
    lowerRaw.includes('%00') ||
    lowerDecoded.includes('\0') ||
    lowerDoubleDecoded.includes('\0') ||
    // CRLF injection
    lowerRaw.includes('%0d') ||
    lowerRaw.includes('%0a') ||
    lowerDecoded.includes('%0d') ||
    lowerDecoded.includes('%0a') ||
    lowerDoubleDecoded.includes('%0d') ||
    lowerDoubleDecoded.includes('%0a') ||
    // Cross-site scripting (XSS) / dangerous URI schemes
    lowerRaw.includes('<script') ||
    lowerDecoded.includes('<script') ||
    lowerDoubleDecoded.includes('<script') ||
    lowerDecoded.includes('<iframe') ||
    lowerDoubleDecoded.includes('<iframe') ||
    lowerDecoded.includes('<object') ||
    lowerDoubleDecoded.includes('<object') ||
    lowerDecoded.includes('javascript:') ||
    lowerDoubleDecoded.includes('javascript:') ||
    lowerDecoded.includes('vbscript:') ||
    lowerDoubleDecoded.includes('vbscript:') ||
    lowerDecoded.includes('data:text/html') ||
    lowerDoubleDecoded.includes('data:text/html') ||
    lowerDecoded.includes('onerror=') ||
    lowerDoubleDecoded.includes('onerror=') ||
    lowerDecoded.includes('onload=') ||
    lowerDoubleDecoded.includes('onload=') ||
    // Sensitive file exposure probes
    lowerDoubleDecoded.includes('etc/passwd') ||
    lowerDoubleDecoded.includes('etc/shadow') ||
    lowerDoubleDecoded.includes('win.ini') ||
    lowerDoubleDecoded.includes('boot.ini');

  if (isMalicious) {
    const blockedResponse = new NextResponse('Forbidden: Security Policy Violation', { status: 403 });
    return applySecurityHeaders(blockedResponse);
  }

  const sessionCookie = request.cookies.get('cursis_session')?.value;
  const hasValidSession = isSessionTokenValid(sessionCookie);

  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname === '/dashboard';
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  // 1. Guard Protected Routes (/dashboard and all sub-routes)
  if (isProtectedRoute) {
    if (!hasValidSession) {
      const loginUrl = new URL('/login', request.url);
      const safeRedirect = getSafeRelativeRedirect(pathname + request.nextUrl.search, '/dashboard');
      loginUrl.searchParams.set('redirect', safeRedirect);

      const response = NextResponse.redirect(loginUrl);
      // Clean up invalid or stale session cookie
      if (sessionCookie) {
        response.cookies.delete('cursis_session');
        response.cookies.set('cursis_session', '', { maxAge: 0, path: '/', expires: new Date(0) });
      }
      return applySecurityHeaders(response);
    }

    return applySecurityHeaders(NextResponse.next());
  }

  // 2. Auth Routes (/login, /signup)
  if (isAuthRoute) {
    const isExplicitLogout = request.nextUrl.searchParams.get('logout') === 'true';
    const isExplicitReset = request.nextUrl.searchParams.has('reset');

    if (isExplicitLogout || isExplicitReset) {
      const response = NextResponse.next();
      response.cookies.delete('cursis_session');
      response.cookies.set('cursis_session', '', { maxAge: 0, path: '/', expires: new Date(0) });
      return applySecurityHeaders(response);
    }

    // If already authenticated with a valid session, redirect to requested page or dashboard
    if (hasValidSession) {
      const redirectParam = request.nextUrl.searchParams.get('redirect');
      const targetDestination = getSafeRelativeRedirect(redirectParam, '/dashboard');
      return applySecurityHeaders(NextResponse.redirect(new URL(targetDestination, request.url)));
    }

    // If cookie is present but invalid/forged, clean it up
    if (sessionCookie) {
      const response = NextResponse.next();
      response.cookies.delete('cursis_session');
      response.cookies.set('cursis_session', '', { maxAge: 0, path: '/', expires: new Date(0) });
      return applySecurityHeaders(response);
    }

    return applySecurityHeaders(NextResponse.next());
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths including root / except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, public assets
     */
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
