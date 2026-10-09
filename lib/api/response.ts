import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthenticatedUser } from '@/lib/auth/session';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  correlationId?: string;
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
 * Automatically sanitizes 500-level error messages, attaches a correlation ID for tracing,
 * and redacts sensitive internal data (connection strings, credentials, query internals).
 */
export function apiError(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  let sanitizedMessage = message;
  let correlationId: string | undefined;

  if (status >= 500) {
    correlationId = crypto.randomUUID();
    console.error(`[apiError:${correlationId}] Internal error:`, message);

    // Check for sensitive substrings or production environment
    const isSensitive =
      /mongodb(\+srv)?:\/\/|password|secret|bearer|token|private|key|unhandledrejection|enotfound|econnrefused|failed to fetch/i.test(message) ||
      message.length > 150;

    if (process.env.NODE_ENV === 'production' || isSensitive) {
      sanitizedMessage = 'An unexpected internal error occurred. Please try again later.';
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: sanitizedMessage,
      ...(correlationId ? { correlationId } : {}),
      ...(details && (status < 500 || process.env.NODE_ENV !== 'production') ? { details } : {}),
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
    console.error('Authentication guard error:', err);
    return {
      user: null,
      errorResponse: apiError('Authentication failed. Invalid or expired session credentials.', 401),
    };
  }
}
