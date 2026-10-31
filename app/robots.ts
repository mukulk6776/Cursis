import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup', '/about', '/social', '/privacy', '/terms', '/cookie-policy', '/cancellation-policy', '/cancellation', '/data-deletion'],
        disallow: ['/api/', '/dashboard', '/dashboard/', '/workspace', '/workspace/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot'],
        disallow: ['/'],
      },
    ],
    sitemap: SITE_URL + '/sitemap.xml',
  };
}
