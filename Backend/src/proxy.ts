import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


const publicRoutes = ['/login'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.includes(pathname);

  // We can't use getSession directly here because jose doesn't like some edge runtimes unless configured
  // Wait, jose works perfectly in Edge. Let's use standard cookie check for speed in middleware.
  // We'll just check if the session cookie exists. The actual validation happens in getInitialData.
  const hasSession = request.cookies.has('session');

  if (!isPublicRoute && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicRoute && hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
