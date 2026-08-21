/**
 * Email validation rules:
 * Only Gmail and Microsoft email addresses are allowed.
 */

const ALLOWED_GMAIL_DOMAINS = ["gmail.com", "googlemail.com"];

const ALLOWED_MICROSOFT_DOMAINS = [
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "microsoft.com",
  "passport.com",
  "windowslive.com",
];

export const EMAIL_RESTRICTION_MESSAGE =
  "Only Gmail (@gmail.com) and Microsoft (@outlook.com, @hotmail.com, @live.com, @msn.com, @microsoft.com) email addresses are permitted.";

/**
 * Checks if the email format is valid and belongs to an allowed Gmail or Microsoft domain.
 */
export function isAllowedEmailDomain(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const cleanEmail = email.trim().toLowerCase();
  
  // Basic email pattern check
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(cleanEmail)) return false;

  const parts = cleanEmail.split("@");
  if (parts.length !== 2) return false;
  
  const domain = parts[1];

  // Check Gmail domains
  if (ALLOWED_GMAIL_DOMAINS.includes(domain)) {
    return true;
  }

  // Check Microsoft domains (standard domains and enterprise onmicrosoft / microsoft subdomains)
  if (
    ALLOWED_MICROSOFT_DOMAINS.includes(domain) ||
    domain.endsWith(".onmicrosoft.com") ||
    domain.endsWith(".microsoft.com")
  ) {
    return true;
  }

  return false;
}
