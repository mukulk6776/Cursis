import type { Metadata } from 'next';

export const SITE_URL = 'https://cursis.in';
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
  const pageTitle = /\bCursis\b/.test(title) ? title : `${title} | Cursis`;

  return {
    title: { absolute: pageTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: 'Cursis',
      locale: 'en_US',
      type: 'website',
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      creator: '@cursis_',
      images: [{ url: SOCIAL_IMAGE.url, alt: SOCIAL_IMAGE.alt }],
    },
  };
}

export const socialProfiles = [
  { name: 'Instagram', url: 'https://instagram.com/cursis.in' },
  { name: 'X', url: 'https://x.com/cursis_' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/cursis/' },
  { name: 'Discord', url: 'https://discord.gg/AnwFKSsA5e' },
];
export const marketingFaqs = [
  { question: 'Is Cursis really free?', answer: 'Yes. Cursis is completely free, with no paid plans and no credit card required.' },
  { question: 'Where can I manage data privacy?', answer: 'Read the Privacy Notice and use the Privacy Centre to manage consent and submit data requests.' },
  { question: 'Does Cursis include video meetings?', answer: 'Yes. Video meetings are included alongside tasks, projects and the calendar.' },
  { question: 'What is included in a workspace?', answer: 'Ordis AI, tasks, projects, calendar, meetings, automatic actions and progress reports are included.' },
  { question: 'How do I delete my account?', answer: 'Use the Privacy Centre at /privacy/rights to submit a deletion request. Read /data-deletion for the published deletion process.' },
  { question: 'How can I contact the team?', answer: 'Use the Contact page to send a question or feedback, or email cursis.in@gmail.com.' },
  { question: 'Are the demo names and numbers real customer results?', answer: 'No. Names, tasks and statistics in the interactive demos are sample data, not customer results or performance guarantees.' },
];
