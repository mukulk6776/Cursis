/**
 * ==============================================================================
 * CURSIS WORKSPACE GOVERNANCE & SOVEREIGN FOUNDER IDENTITY
 * ==============================================================================
 * Strictly designates mukulk3962364@gmail.com as the exclusive Founder & CEO
 * of Cursis. All other accounts registered or authenticated are regular Users.
 */

export const SOVEREIGN_FOUNDER_EMAIL = 'mukulk3962364@gmail.com';

/**
 * Validates if an email belongs to the sovereign Founder & CEO.
 */
export function isFounderEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SOVEREIGN_FOUNDER_EMAIL.toLowerCase();
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
 * Returns 'owner' strictly for mukulk3962364@gmail.com, otherwise 'member'.
 */
export function getAuthorizedRole(email?: string | null): 'owner' | 'member' {
  return isFounderEmail(email) ? 'owner' : 'member';
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
