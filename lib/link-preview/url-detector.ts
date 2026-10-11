/**
 * Detect URLs in text, excluding code blocks
 * Returns the first valid http/https URL found
 */
export function detectFirstUrl(text: string): string | null {
  // Remove code blocks (inline and multi-line)
  const withoutCodeBlocks = text
    .replace(/```[\s\S]*?```/g, '') // Remove multi-line code blocks
    .replace(/`[^`]+`/g, ''); // Remove inline code

  // Match http/https URLs
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const matches = withoutCodeBlocks.match(urlRegex);

  if (!matches || matches.length === 0) {
    return null;
  }

  // Return the first URL
  return matches[0];
}

/**
 * Check if a URL is valid and safe for preview
 */
export function isUrlSafeForPreview(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Block localhost and private networks (client-side check)
    const hostname = parsed.hostname.toLowerCase();
    const blockedHosts = ['localhost', '0.0.0.0', '127.0.0.1', '::1'];

    if (blockedHosts.includes(hostname)) {
      return false;
    }

    // Block private IP ranges (basic check)
    if (hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
