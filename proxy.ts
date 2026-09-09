import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isSessionTokenValid } from '@/lib/auth/token';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get('cursis_session')?.value;
  const hasValidSession = isSessionTokenValid(sessionCookie);

  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname === '/dashboard';
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  // 1. Guard Protected Routes (/dashboard and all sub-routes)
  if (isProtectedRoute) {
    if (!hasValidSession) {
      const loginUrl = new URL('/login', request.url);
      const targetRedirect = pathname + request.nextUrl.search;
      loginUrl.searchParams.set('redirect', targetRedirect);

      const response = NextResponse.redirect(loginUrl);
      // Clean up invalid or stale session cookie
      if (sessionCookie) {
        response.cookies.delete('cursis_session');
        response.cookies.set('cursis_session', '', { maxAge: 0, path: '/', expires: new Date(0) });
      }
      return response;
    }

    return NextResponse.next();
  }

  // 2. Auth Routes (/login, /signup)
  if (isAuthRoute) {
    const isExplicitLogout = request.nextUrl.searchParams.get('logout') === 'true';
    const isExplicitReset = request.nextUrl.searchParams.has('reset');

    if (isExplicitLogout || isExplicitReset) {
      const response = NextResponse.next();
      response.cookies.delete('cursis_session');
      response.cookies.set('cursis_session', '', { maxAge: 0, path: '/', expires: new Date(0) });
      return response;
    }

    // If already authenticated with a valid session, redirect to requested page or dashboard
    if (hasValidSession) {
      const redirectParam = request.nextUrl.searchParams.get('redirect');
      const targetDestination = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard';
      return NextResponse.redirect(new URL(targetDestination, request.url));
    }

    // If cookie is present but invalid/forged, clean it up
    if (sessionCookie) {
      const response = NextResponse.next();
      response.cookies.delete('cursis_session');
      response.cookies.set('cursis_session', '', { maxAge: 0, path: '/', expires: new Date(0) });
      return response;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
