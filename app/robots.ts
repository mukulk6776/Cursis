import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const PUBLIC_ALLOW = [
  '/',
  '/pricing',
  '/faq',
  '/compare',
  '/compare/slack-and-asana',
  '/compare/clickup',
  '/compare/notion',
  '/about',
  '/creators',
  '/social',
  '/blog',
  '/changelog',
  '/contact',
  '/llms.txt',
  '/llms-full.txt',
  '/privacy',
  '/privacy/rights',
  '/terms',
  '/refund-policy',
  '/shipping-policy',
  '/cancellation-policy',
  '/cookie-policy',
  '/data-deletion',
  '/dmca',
];

const PRIVATE_DISALLOW = [
  '/api/',
  '/admin',
  '/admin/',
  '/dashboard',
  '/dashboard/',
  '/workspace',
  '/workspace/',
  '/pay',
  '/unsubscribe',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_DISALLOW,
      },
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'anthropic-ai',
          'Google-Extended',
          'Applebot-Extended',
          'CCBot',
        ],
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_DISALLOW,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
