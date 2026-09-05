import { NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthenticatedUser } from '@/lib/auth/session';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  message?: string;
  [key: string]: any;
}

/**
 * Creates a standardized JSON success response.
 */
export function apiSuccess<T extends Record<string, any>>(
  data: T,
  status: number = 200,
  headers?: HeadersInit
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status, headers }
  );
}

/**
 * Creates a standardized JSON error response.
 */
export function apiError(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export type AuthResult =
  | { user: AuthenticatedUser; errorResponse: null }
  | { user: null; errorResponse: NextResponse };

/**
 * Guard utility to authenticate the request and return the authenticated user or an unauthorized error response.
 */
export async function getAuthOrError(request: Request): Promise<AuthResult> {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return {
        user: null,
        errorResponse: apiError('Unauthorized access. Valid session or bearer token required.', 401),
      };
    }
    return { user, errorResponse: null };
  } catch (err: any) {
    return {
      user: null,
      errorResponse: apiError(err.message || 'Authentication error', 401),
    };
  }
}
