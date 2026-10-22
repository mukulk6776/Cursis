import type { Metadata } from 'next';
import { BRAND_NAME, SITE_URL, SUPPORT_EMAIL, FREE_WORKSPACE_TEXT, TEAM_USER_LIMIT, INCLUDED_TOOLS, TWITTER_HANDLE } from '@/lib/site';
export { SITE_URL, SOCIAL_PROFILES as socialProfiles } from '@/lib/site';

export const SOCIAL_IMAGE = {
  url: `${SITE_URL}/marketing-og.png`,
  secureUrl: `${SITE_URL}/marketing-og.png`,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'Cursis — Your team’s work. Together at last. Tasks, projects, meetings and Ordis AI. Built for teamwork.',
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
  { question: `Is ${BRAND_NAME} really free?`, answer: `Yes. ${BRAND_NAME} is completely free. ${FREE_WORKSPACE_TEXT}. There are no paid plans, no trials and no credit card required.` },
  { question: `What happens if my team is bigger than ${TEAM_USER_LIMIT}?`, answer: `Each team workspace supports up to ${TEAM_USER_LIMIT} people. You can create separate workspaces or contact us at ${SUPPORT_EMAIL} to discuss your needs.` },
  { question: 'Where can I manage data privacy?', answer: 'Read the Privacy Notice and use the Privacy Centre to manage consent and submit data requests.' },
  { question: 'Does Cursis include video meetings?', answer: 'Yes. Video meetings are included alongside tasks, projects and the calendar.' },
  { question: 'What is included in a workspace?', answer: `${INCLUDED_TOOLS.join(', ')} are included.` },
  { question: 'How do I delete my account?', answer: 'Use the Privacy Centre at /privacy/rights to submit a deletion request. Read /data-deletion for the published deletion process.' },
  { question: 'How can I contact the team?', answer: `Use the Contact page to send a question or feedback, or email ${SUPPORT_EMAIL}.` },
  { question: 'Are the demo names and numbers real customer results?', answer: 'No. Names, tasks and statistics in the interactive demos are sample data, not customer results or promises about performance.' },
];
