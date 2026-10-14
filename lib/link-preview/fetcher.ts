import * as cheerio from 'cheerio';
import { URL } from 'url';
import dns from 'dns';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve);

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
  /^127\./,                          // Loopback
  /^10\./,                           // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B
  /^192\.168\./,                     // Private Class C
  /^169\.254\./,                     // Link-local
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // Carrier-grade NAT
  /^192\.0\.2\./,                    // TEST-NET-1
  /^198\.51\.100\./,                 // TEST-NET-2
  /^203\.0\.113\./,                  // TEST-NET-3
  /^224\./,                          // Multicast
  /^240\./,                          // Reserved
  /^255\.255\.255\.255$/,            // Broadcast
  /^::1$/i,                          // IPv6 loopback
  /^::$/i,                           // IPv6 unspecified
  /^fe80:/i,                         // IPv6 link-local
  /^fc00:/i,                         // IPv6 private (ULA)
  /^fd00:/i,                         // IPv6 private (ULA)
  /^::ffff:127\./i,                  // IPv4-mapped IPv6 loopback
  /^::ffff:10\./i,                   // IPv4-mapped IPv6 private
  /^::ffff:172\./i,
  /^::ffff:192\.168\./i,
  /^::ffff:169\.254\./i,
  /^::ffff:0\./i,
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  '0.0.0.0',
  'metadata.google.internal',  // GCP metadata
  '169.254.169.254',           // AWS/Azure/GCP metadata
  'instance-data',
];

export function isIpBlocked(ip: string): boolean {
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(ip)) {
      return true;
    }
  }
  return false;
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Reject userinfo/credentials in URL
    if (parsed.username || parsed.password) {
      return false;
    }

    // Block localhost and private hostnames
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return false;
    }

    // Direct IP check if hostname is an IP address
    if (isIpBlocked(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function validateHostnameIPs(hostname: string): Promise<void> {
  // Check if hostname itself matches blocked hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname.toLowerCase())) {
    throw new Error('SSRF: Hostname is blocked');
  }

  // Direct IP check
  if (isIpBlocked(hostname)) {
    throw new Error('SSRF: Access to private IP is blocked');
  }

  try {
    // Resolve both IPv4 and IPv6 addresses
    const addresses: string[] = [];
    try {
      const aRecords = await dnsResolve(hostname, 'A');
      addresses.push(...aRecords);
    } catch {
      // Ignore if no A record
    }

    try {
      const aaaaRecords = await dnsResolve(hostname, 'AAAA');
      addresses.push(...aaaaRecords);
    } catch {
      // Ignore if no AAAA record
    }

    if (addresses.length === 0) {
      // If direct DNS resolution had no records, try lookup
      const lookup = promisify(dns.lookup);
      const res = await lookup(hostname);
      addresses.push(res.address);
    }

    for (const address of addresses) {
      if (isIpBlocked(address)) {
        throw new Error(`SSRF: Resolved IP address ${address} is blocked`);
      }
    }
  } catch (error: any) {
    if (error.message?.includes('SSRF:')) {
      throw error;
    }
    throw new Error(`SSRF: DNS resolution failed for hostname ${hostname}`);
  }
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
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
  if (!relative || typeof relative !== 'string') return null;
  try {
    const resolved = new URL(relative.trim(), base);
    if (!['http:', 'https:'].includes(resolved.protocol)) {
      return null;
    }
    return resolved.toString();
  } catch {
    return null;
  }
}

export async function getLinkPreview(url: string): Promise<LinkPreviewData> {
  let currentUrl = url;
  let redirects = 0;
  const maxRedirects = 3;
  let responseText = '';
  let finalUrlObj = new URL(currentUrl);

  try {
    while (redirects <= maxRedirects) {
      finalUrlObj = new URL(currentUrl);
      if (!isValidUrl(currentUrl)) {
        throw new Error('SSRF: Invalid or blocked URL target');
      }

      await validateHostnameIPs(finalUrlObj.hostname);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const res = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Cursis-LinkPreview/1.0 (+https://cursis.in)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        // Handle redirect
        if ([301, 302, 303, 307, 308].includes(res.status)) {
          const location = res.headers.get('location');
          if (!location) {
            throw new Error('Redirect missing Location header');
          }
          currentUrl = new URL(location, currentUrl).toString();
          redirects++;
          continue;
        }

        if (!res.ok) {
          throw new Error(`HTTP fetch failed with status ${res.status}`);
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
          // Not HTML, return minimal preview
          return {
            url: currentUrl,
            title: finalUrlObj.hostname,
            description: '',
            image: null,
            siteName: finalUrlObj.hostname,
            favicon: `${finalUrlObj.protocol}//${finalUrlObj.hostname}/favicon.ico`,
          };
        }

        // Read max 2MB safely
        const reader = res.body?.getReader();
        if (!reader) {
          responseText = await res.text();
        } else {
          const chunks: Uint8Array[] = [];
          let totalSize = 0;
          const maxSize = 2 * 1024 * 1024; // 2MB

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              totalSize += value.byteLength;
              if (totalSize >= maxSize) {
                await reader.cancel();
                break;
              }
            }
          }
          const totalBuffer = new Uint8Array(totalSize);
          let offset = 0;
          for (const chunk of chunks) {
            totalBuffer.set(chunk, offset);
            offset += chunk.byteLength;
          }
          responseText = new TextDecoder('utf-8').decode(totalBuffer);
        }
        break;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (redirects > maxRedirects) {
      throw new Error('Too many redirects');
    }

    // Parse HTML using cheerio
    const $ = cheerio.load(responseText);
    const siteName = $('meta[property="og:site_name"]').attr('content')?.trim() || finalUrlObj.hostname;

    const title =
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('meta[name="twitter:title"]').attr('content')?.trim() ||
      $('title').text().trim() ||
      siteName;

    const description =
      $('meta[property="og:description"]').attr('content')?.trim() ||
      $('meta[name="twitter:description"]').attr('content')?.trim() ||
      $('meta[name="description"]').attr('content')?.trim() ||
      '';

    const rawImage =
      $('meta[property="og:image"]').attr('content')?.trim() ||
      $('meta[name="twitter:image"]').attr('content')?.trim() ||
      $('meta[name="twitter:image:src"]').attr('content')?.trim();

    const image = rawImage ? resolveRelativeUrl(currentUrl, rawImage) : null;

    const rawFavicon =
      $('link[rel="icon"]').attr('href')?.trim() ||
      $('link[rel="shortcut icon"]').attr('href')?.trim() ||
      $('link[rel="apple-touch-icon"]').attr('href')?.trim();

    const favicon = rawFavicon
      ? resolveRelativeUrl(currentUrl, rawFavicon)
      : `${finalUrlObj.protocol}//${finalUrlObj.hostname}/favicon.ico`;

    return {
      url,
      title: title.substring(0, 200),
      description: description.substring(0, 300),
      image,
      siteName,
      favicon,
    };
  } catch (error: any) {
    // If it's an SSRF violation, rethrow so API returns 403
    if (error.message?.includes('SSRF:')) {
      throw error;
    }

    // Fallback minimal preview for unreachable or parsing errors
    return {
      url,
      title: finalUrlObj.hostname || url,
      description: '',
      image: null,
      siteName: finalUrlObj.hostname || url,
      favicon: `${finalUrlObj.protocol}//${finalUrlObj.hostname}/favicon.ico`,
    };
  }
}
