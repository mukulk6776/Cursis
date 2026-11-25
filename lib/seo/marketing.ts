import type { Metadata } from 'next';
import { BRAND_NAME, SITE_URL, TWITTER_HANDLE } from '@/lib/site';
export { SITE_URL, SOCIAL_PROFILES as socialProfiles } from '@/lib/site';

export const SOCIAL_IMAGE = {
  url: `${SITE_URL}/cursis-og.png`,
  secureUrl: `${SITE_URL}/cursis-og.png`,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'CURSIS — Less chasing. More getting done. Daily priorities, team workload and meeting follow-ups.',
};

export function marketingMetadata(path: string, title: string, description: string): Metadata {
  const url = new URL(path || '/', SITE_URL).href;
  const pageTitle = title.toUpperCase().includes(BRAND_NAME.toUpperCase()) ? title : `${title} | ${BRAND_NAME}`;

  return {
    title: { absolute: pageTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: BRAND_NAME,
      locale: 'en_US',
      type: 'website',
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      creator: TWITTER_HANDLE,
      images: [{ url: SOCIAL_IMAGE.url, alt: SOCIAL_IMAGE.alt }],
    },
  };
}

export const marketingFaqs = [
  { question: 'What is included in Starter, Pro, and Business plans?', answer: 'Starter ($9/mo launch price, regular $19) includes 6 members, 10 projects, and 5 tasks per project without Ordis AI or My Day. Pro ($20/mo launch price, regular $39) unlocks 10 members, unlimited projects and tasks, Ordis AI, and My Day. Business offers custom solutions via Contact Us.' },
  { question: 'How do cancellations and refunds work?', answer: 'You can cancel anytime without lock-in fees. To request a refund, simply email official@cursis.in from your billing email and we will process it via Razorpay within 5–7 business days.' },
  { question: 'Can I sign in with an existing account?', answer: 'Yes. Choose Sign In in the navigation rather than creating another account.' },
  { question: 'Can I type my own question on the homepage?', answer: 'The homepage offers fixed examples. On Pro workspaces, you can ask Ordis about your own work.' },
  { question: 'Where do I change privacy choices or close my account?', answer: 'Open Privacy Centre from the footer. You can manage consent and submit a data request there.' },
];
