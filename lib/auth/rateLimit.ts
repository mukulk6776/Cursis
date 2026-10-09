import { getCollection } from '@/lib/mongodb';

/**
 * Rate limiting collection for tracking login/signup attempts by IP
 * Limits: 5 attempts per 30 minutes per IP address
 */

interface RateLimitEntry {
  ip: string;
  attempts: number;
  firstAttemptAt: Date;
  lastAttemptAt: Date;
  blockedUntil?: Date;
}

const RATE_LIMIT_WINDOW = 30 * 60 * 1000; // 30 minutes in milliseconds
const MAX_ATTEMPTS = 5;

/**
 * In-memory fallback rate limiter — activated when MongoDB is unavailable.
 * Prevents fail-open vulnerability during DB outages.
 */
const inMemoryRateLimits = new Map<string, { attempts: number; firstAttemptAt: number; blockedUntil?: number }>();

function checkInMemoryRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; resetAt?: Date; message?: string } {
  const now = Date.now();
  const entry = inMemoryRateLimits.get(ip);

  if (!entry) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Check if blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetAt: new Date(entry.blockedUntil),
      message: `Too many attempts. Please try again after ${new Date(entry.blockedUntil).toLocaleTimeString()}.`,
    };
  }

  // Outside window — reset
  if (now - entry.firstAttemptAt > RATE_LIMIT_WINDOW) {
    inMemoryRateLimits.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    const blockedUntil = entry.firstAttemptAt + RATE_LIMIT_WINDOW;
    entry.blockedUntil = blockedUntil;
    return {
      allowed: false,
      remainingAttempts: 0,
      resetAt: new Date(blockedUntil),
      message: `Too many attempts. Please try again after ${new Date(blockedUntil).toLocaleTimeString()}.`,
    };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - entry.attempts - 1 };
}

function recordInMemoryAttempt(ip: string): void {
  const now = Date.now();
  const entry = inMemoryRateLimits.get(ip);

  if (!entry || now - entry.firstAttemptAt > RATE_LIMIT_WINDOW) {
    inMemoryRateLimits.set(ip, { attempts: 1, firstAttemptAt: now });
  } else {
    entry.attempts++;
  }

  // Periodic cleanup: purge expired entries every 100 calls
  if (inMemoryRateLimits.size > 100) {
    for (const [key, val] of inMemoryRateLimits) {
      if (now - val.firstAttemptAt > RATE_LIMIT_WINDOW) {
        inMemoryRateLimits.delete(key);
      }
    }
  }
}

/**
 * Check if an IP address is rate limited
 * Returns: { allowed: boolean, remainingAttempts: number, resetAt?: Date }
 */
export async function checkRateLimit(ip: string): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  resetAt?: Date;
  message?: string;
}> {
  try {
    const rateLimits = await getCollection<RateLimitEntry>('rate_limits');
    if (!rateLimits) {
      // SECURITY FIX: Fall back to in-memory rate limiter instead of failing open
      return checkInMemoryRateLimit(ip);
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

    // Find existing rate limit entry for this IP
    const entry = await rateLimits.findOne({ ip });

    // No previous attempts
    if (!entry) {
      return {
        allowed: true,
        remainingAttempts: MAX_ATTEMPTS - 1,
      };
    }

    // Check if currently blocked
    if (entry.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetAt: entry.blockedUntil,
        message: `Too many attempts. Please try again after ${entry.blockedUntil.toLocaleTimeString()}.`,
      };
    }

    // Check if outside the rate limit window (reset)
    if (entry.firstAttemptAt < windowStart) {
      // Reset the counter
      await rateLimits.updateOne(
        { ip },
        {
          $set: {
            attempts: 0,
            firstAttemptAt: now,
            lastAttemptAt: now,
            blockedUntil: undefined,
          },
        }
      );
      return {
        allowed: true,
        remainingAttempts: MAX_ATTEMPTS - 1,
      };
    }

    // Within window, check attempt count
    if (entry.attempts >= MAX_ATTEMPTS) {
      const blockedUntil = new Date(entry.firstAttemptAt.getTime() + RATE_LIMIT_WINDOW);
      await rateLimits.updateOne(
        { ip },
        { $set: { blockedUntil } }
      );
      return {
        allowed: false,
        remainingAttempts: 0,
        resetAt: blockedUntil,
        message: `Too many attempts. Please try again after ${blockedUntil.toLocaleTimeString()}.`,
      };
    }

    // Still within limit
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - entry.attempts - 1,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // SECURITY FIX: Fall back to in-memory rate limiter instead of failing open
    return checkInMemoryRateLimit(ip);
  }
}

/**
 * Record an attempt (login or signup) from an IP address
 */
export async function recordAttempt(ip: string): Promise<void> {
  try {
    const rateLimits = await getCollection<RateLimitEntry>('rate_limits');
    if (!rateLimits) {
      recordInMemoryAttempt(ip); // SECURITY FIX: Fall back to in-memory
      return;
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

    const entry = await rateLimits.findOne({ ip });

    if (!entry) {
      // First attempt
      await rateLimits.insertOne({
        ip,
        attempts: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
      });
    } else if (entry.firstAttemptAt < windowStart) {
      // Outside window, reset
      await rateLimits.updateOne(
        { ip },
        {
          $set: {
            attempts: 1,
            firstAttemptAt: now,
            lastAttemptAt: now,
            blockedUntil: undefined,
          },
        }
      );
    } else {
      // Within window, increment
      await rateLimits.updateOne(
        { ip },
        {
          $inc: { attempts: 1 },
          $set: { lastAttemptAt: now },
        }
      );
    }
  } catch (error) {
    console.error('Record attempt error:', error);
    // SECURITY FIX: Fall back to in-memory instead of silently failing
    recordInMemoryAttempt(ip);
  }
}

/**
 * Clear rate limit for an IP (e.g., after successful login)
 */
export async function clearRateLimit(ip: string): Promise<void> {
  // Always clear in-memory fallback
  inMemoryRateLimits.delete(ip);
  try {
    const rateLimits = await getCollection<RateLimitEntry>('rate_limits');
    if (!rateLimits) return;

    await rateLimits.deleteOne({ ip });
  } catch (error) {
    console.error('Clear rate limit error:', error);
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;

  return 'unknown';
}

/**
 * Cleanup old rate limit entries (run periodically)
 */
export async function cleanupOldRateLimits(): Promise<void> {
  try {
    const rateLimits = await getCollection<RateLimitEntry>('rate_limits');
    if (!rateLimits) return; // Silently fail if database unavailable

    const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW);

    await rateLimits.deleteMany({
      firstAttemptAt: { $lt: cutoff },
    });
  } catch (error) {
    console.error('Cleanup rate limits error:', error);
  }
}
