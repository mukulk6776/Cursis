import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup', '/about', '/social', '/privacy', '/terms', '/cookie-policy', '/refund-policy', '/data-deletion'],
        disallow: ['/api/', '/dashboard', '/dashboard/', '/workspace', '/workspace/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot'],
        disallow: ['/'],
      },
    ],
    sitemap: 'https://cursis.in/sitemap.xml',
  };
}
