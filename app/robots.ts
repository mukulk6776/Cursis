import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/signup'],
      disallow: ['/api/', '/dashboard/'],
    },
    sitemap: 'https://cursis.in/sitemap.xml',
  };
}
