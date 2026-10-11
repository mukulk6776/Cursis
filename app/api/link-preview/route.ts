import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { getLinkPreview, isValidUrl, normalizeUrl } from '@/lib/link-preview/fetcher';
import { getCachedLinkPreview, cacheLinkPreview } from '@/lib/link-preview/cache';
import { checkLinkPreviewRateLimit } from '@/lib/auth/rateLimit';
import { z } from 'zod';

const querySchema = z.object({
  url: z.string().url().min(1).max(2048),
});

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate limiting - 20 requests per minute per user
    const rateLimitResult = await checkLinkPreviewRateLimit(user.uid);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
          }
        }
      );
    }

    // 3. Validate URL parameter
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get('url');

    if (!urlParam) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const validation = querySchema.safeParse({ url: urlParam });
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const url = validation.data.url;

    // 4. Security validation
    if (!isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid or unsafe URL' }, { status: 400 });
    }

    const normalizedUrl = normalizeUrl(url);

    // 5. Check cache first
    const cached = await getCachedLinkPreview(normalizedUrl);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // 6. Fetch preview
    const preview = await getLinkPreview(normalizedUrl);

    // 7. Cache the result
    await cacheLinkPreview(normalizedUrl, preview);

    return NextResponse.json({
      success: true,
      data: preview,
      cached: false,
    });

  } catch (error: any) {
    console.error('Link preview error:', error);

    // Return appropriate error messages
    if (error.message?.includes('SSRF')) {
      return NextResponse.json({ error: 'Access to this URL is not allowed' }, { status: 403 });
    }

    if (error.message?.includes('timeout')) {
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
    }

    return NextResponse.json({ error: 'Failed to fetch link preview' }, { status: 500 });
  }
}
