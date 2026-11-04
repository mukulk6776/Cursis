/**
 * ==============================================================================
 * CURSIS WORKSPACE GOVERNANCE & SOVEREIGN FOUNDER IDENTITY
 * ==============================================================================
 * Configures the sovereign Founder & CEO identity of Cursis via environment
 * variable SOVEREIGN_FOUNDER_EMAIL with fallback to mukulk3962364@gmail.com.
 */

export const DEFAULT_SOVEREIGN_FOUNDER_EMAIL = 'mukulk3962364@gmail.com';

/**
 * Dynamically retrieves the sovereign founder email from the environment.
 */
export function getSovereignFounderEmail(): string {
  const envEmail =
    typeof process !== 'undefined'
      ? (process.env?.SOVEREIGN_FOUNDER_EMAIL || process.env?.NEXT_PUBLIC_SOVEREIGN_FOUNDER_EMAIL)
      : undefined;

  if (envEmail && typeof envEmail === 'string' && envEmail.trim().length > 0) {
    return envEmail.trim().toLowerCase();
  }
  return DEFAULT_SOVEREIGN_FOUNDER_EMAIL.toLowerCase();
}

export const SOVEREIGN_FOUNDER_EMAIL = getSovereignFounderEmail();

/**
 * Validates if an email belongs to the sovereign Founder & CEO.
 */
export function isFounderEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === getSovereignFounderEmail();
}

/**
 * Returns 'Founder & CEO' strictly for mukulk3962364@gmail.com, otherwise 'User'
 * (or a custom non-executive fallback title).
 */
export function getAuthorizedTitle(email?: string | null, customFallback: string = 'User'): string {
  if (isFounderEmail(email)) {
    return 'Founder & CEO';
  }
  // Sanitize any executive usurpation attempts
  if (
    customFallback.toLowerCase().includes('founder') ||
    customFallback.toLowerCase().includes('ceo') ||
    customFallback.toLowerCase().includes('owner')
  ) {
    return 'User';
  }
  return customFallback || 'User';
}

/**
 * Returns 'owner' for sovereign founder, or preserves user's workspace/profile role.
 */
export function getAuthorizedRole(email?: string | null, fallbackRole: 'owner' | 'admin' | 'manager' | 'member' = 'member'): 'owner' | 'admin' | 'manager' | 'member' {
  if (isFounderEmail(email)) return 'owner';
  return fallbackRole;
}

/**
 * Returns 'Leadership' strictly for mukulk3962364@gmail.com, otherwise 'Operations'.
 */
export function getAuthorizedDepartment(email?: string | null, fallbackDept: string = 'Operations'): string {
  if (isFounderEmail(email)) {
    return 'Leadership';
  }
  return fallbackDept === 'Leadership' ? 'Operations' : fallbackDept;
}
