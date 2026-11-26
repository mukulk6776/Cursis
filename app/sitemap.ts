import { getPosts } from '@/lib/seo/blog';
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const HIGH_PRIORITY_ROUTES = new Set([
  '',
  'pricing',
  'faq',
  'compare',
  'compare/slack-and-asana',
  'compare/clickup',
  'compare/notion',
  'about',
  'creators',
]);

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    '',
    'pricing',
    'faq',
    'compare',
    'compare/slack-and-asana',
    'compare/clickup',
    'compare/notion',
    'about',
    'creators',
    'social',
    'blog',
    'changelog',
    'contact',
    'signup',
    'login',
    'privacy',
    'privacy/rights',
    'terms',
    'refund-policy',
    'shipping-policy',
    'cancellation-policy',
    'cookie-policy',
    'data-deletion',
    'dmca',
  ];

  const blogEntries = getPosts()
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated || post.date || '2026-11-26'),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  const staticEntries = staticPaths.map((p) => ({
    url: p ? `${SITE_URL}/${p}` : `${SITE_URL}/`,
    lastModified: new Date('2026-11-26'),
    changeFrequency: HIGH_PRIORITY_ROUTES.has(p) ? ('weekly' as const) : ('monthly' as const),
    priority: p === '' ? 1 : HIGH_PRIORITY_ROUTES.has(p) ? 0.8 : 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
