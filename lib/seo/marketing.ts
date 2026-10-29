import type { Metadata } from 'next';
import { BRAND_NAME, SITE_URL, TEAM_USER_LIMIT, TWITTER_HANDLE } from '@/lib/site';
export { SITE_URL, SOCIAL_PROFILES as socialProfiles } from '@/lib/site';

export const SOCIAL_IMAGE = {
  url: `${SITE_URL}/cursis-og.png`,
  secureUrl: `${SITE_URL}/cursis-og.png`,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'Cursis — Less chasing. More getting done. Daily priorities, team workload and meeting follow-ups.',
};

export function marketingMetadata(path: string, title: string, description: string): Metadata {
  const url = new URL(path || '/', SITE_URL).href;
  const pageTitle = title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;

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
  { question: 'Do I have to choose a paid plan?', answer: 'There is no paid plan to choose. The Plans page explains the workspace limit and what is included.' },
  { question: 'What if we have a larger team?', answer: `A workspace holds up to ${TEAM_USER_LIMIT} people. If your team is larger, ask us about your needs before inviting everyone.` },
  { question: 'Can I sign in with an existing account?', answer: 'Yes. Choose Sign In in the navigation rather than creating another account.' },
  { question: 'Can I type my own question on the homepage?', answer: 'The homepage offers fixed examples. In your workspace, you can ask Ordis about your own work.' },
  { question: 'Where do I change privacy choices or close my account?', answer: 'Open Privacy Centre from the footer. You can manage consent and submit a data request there.' },
];
