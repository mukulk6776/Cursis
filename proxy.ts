import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('cursis_session')?.value;
  
  // Define auth routes (should not be accessible if already logged in)
  const isAuthRoute = request.nextUrl.pathname === '/login' || 
                      request.nextUrl.pathname === '/signup';

  // If user visits auth routes with an active session cookie, redirect to dashboard UNLESS explicit param is passed
  if (session && isAuthRoute) {
    const hasExplicitParam = request.nextUrl.searchParams.has('redirect') || 
                             request.nextUrl.searchParams.has('reset') ||
                             request.nextUrl.searchParams.has('logout');
    if (!hasExplicitParam) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
