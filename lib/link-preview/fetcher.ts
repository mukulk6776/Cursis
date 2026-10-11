import ogs from 'ogs';
import { URL } from 'url';
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

export interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string | null;
  siteName: string;
  favicon: string | null;
}

// SSRF Protection: Block private/internal IP ranges
const BLOCKED_IP_PATTERNS = [
  /^127\./,           // Loopback
  /^10\./,            // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B
  /^192\.168\./,      // Private Class C
  /^169\.254\./,      // Link-local
  /^::1$/,            // IPv6 loopback
  /^fe80:/,           // IPv6 link-local
  /^fc00:/,           // IPv6 private
  /^fd00:/,           // IPv6 private
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  '0.0.0.0',
  'metadata.google.internal',  // GCP metadata
  '169.254.169.254',            // AWS/Azure metadata
];

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Block localhost and private hostnames
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function isBlockedIP(hostname: string): Promise<boolean> {
  try {
    const { address } = await dnsLookup(hostname);

    // Check if IP matches any blocked pattern
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(address)) {
        return true;
      }
    }

    return false;
  } catch {
    // If DNS lookup fails, block the request
    return true;
  }
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slashes, fragments, and normalize
    parsed.hash = '';
    let normalized = parsed.toString();
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return url;
  }
}

function resolveRelativeUrl(base: string, relative: string | undefined): string | null {
  if (!relative) return null;
  try {
    const resolved = new URL(relative, base);
    // Only allow https images
    if (resolved.protocol !== 'https:') {
      return null;
    }
    return resolved.toString();
  } catch {
    return null;
  }
}

export async function getLinkPreview(url: string): Promise<LinkPreviewData> {
  const parsed = new URL(url);

  // SSRF Protection: Check if hostname resolves to blocked IP
  if (await isBlockedIP(parsed.hostname)) {
    throw new Error('SSRF: Access to this IP address is blocked');
  }

  try {
    const result = await ogs({
      url,
      timeout: 5000,              // 5 second timeout
      followRedirect: true,
      maxRedirects: 3,            // Limit redirects
      retry: 0,
      headers: {
        'User-Agent': 'Cursis-LinkPreview/1.0 (+https://cursis.in)',
      },
      // Size limit handled by ogs internally
      fetchOptions: {
        size: 2 * 1024 * 1024,    // 2 MB limit
      },
    });

    // After redirect, check if final URL is safe
    if (result.response?.url) {
      const finalUrl = new URL(result.response.url);
      if (await isBlockedIP(finalUrl.hostname)) {
        throw new Error('SSRF: Redirect to blocked IP address detected');
      }
    }

    const ogData = result.result;
    const siteName = ogData.ogSiteName || parsed.hostname;

    // Extract title (priority: og:title > twitter:title > <title>)
    const title = ogData.ogTitle ||
                  ogData.twitterTitle ||
                  (ogData as any).dcTitle ||
                  siteName;

    // Extract description
    const description = ogData.ogDescription ||
                       ogData.twitterDescription ||
                       (ogData as any).dcDescription ||
                       '';

    // Extract image (priority: og:image > twitter:image)
    let image: string | null = null;
    const ogImage = ogData.ogImage?.[0]?.url || ogData.ogImage;
    const twitterImage = ogData.twitterImage?.[0]?.url || ogData.twitterImage;
    const rawImage = ogImage || twitterImage;

    if (rawImage) {
      image = resolveRelativeUrl(url, rawImage as string);
    }

    // Extract favicon
    let favicon: string | null = null;
    const faviconUrl = ogData.favicon;
    if (faviconUrl) {
      favicon = resolveRelativeUrl(url, faviconUrl as string);
    } else {
      // Fallback to /favicon.ico
      favicon = `${parsed.protocol}//${parsed.hostname}/favicon.ico`;
    }

    return {
      url,
      title: title?.substring(0, 200) || siteName,
      description: description?.substring(0, 300) || '',
      image,
      siteName,
      favicon,
    };

  } catch (error: any) {
    // If fetch fails, return minimal preview
    console.error('Link preview fetch error:', error);

    return {
      url,
      title: parsed.hostname,
      description: '',
      image: null,
      siteName: parsed.hostname,
      favicon: `${parsed.protocol}//${parsed.hostname}/favicon.ico`,
    };
  }
}
