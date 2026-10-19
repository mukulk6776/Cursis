import type { Metadata } from 'next';

export function marketingMetadata(path: string, title: string, description: string): Metadata {
  const url = `https://cursis.in${path}`;
  const images = [{ url: '/marketing-og.png', width: 1200, height: 630, alt: 'Cursis — Free team workspace for up to 10 users' }];
  return { title: { absolute: `${title}${title.startsWith('Cursis') ? '' : ' | Cursis'}` }, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Cursis', type: 'website', images },
    twitter: { card: 'summary_large_image', title, description, images } };
}

export const socialProfiles = [
  { name: 'Instagram', url: 'https://instagram.com/cursis.in' },
  { name: 'X', url: 'https://x.com/cursis_' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/cursis/' },
  { name: 'Discord', url: 'https://discord.gg/AnwFKSsA5e' },
];
export const pendingAnswer = 'TODO_CONFIRM_WITH_FOUNDER: This answer is awaiting confirmation. Contact us for details.';
export const marketingFaqs = [
  { question: 'Is Cursis really free?', answer: 'Yes. Cursis is completely free, with no paid plans and no credit card required. Each team workspace supports up to 10 users.' },
  { question: 'What happens when I reach 10 users?', answer: pendingAnswer },
  { question: 'Will Cursis stay free?', answer: pendingAnswer },
  { question: 'How is my workspace secured?', answer: 'Cursis uses authenticated sessions and workspace access controls. See our Privacy Notice for current data flows and verification limits. TODO_CONFIRM_WITH_FOUNDER: Confirm production security controls and any independent certifications.' },
  { question: 'Where can I manage data privacy?', answer: 'Read the Privacy Notice and use the Privacy Centre to manage consent and submit data requests.' },
  { question: 'How does Ordis use customer data?', answer: 'Ordis processes workspace context to respond to requests. Review the AI processing details in the Privacy Notice. TODO_CONFIRM_WITH_FOUNDER: Confirm provider retention and whether any customer data is used for training.' },
  { question: 'Can I migrate from Trello, Asana, Notion or ClickUp?', answer: 'TODO_CONFIRM_WITH_FOUNDER: Confirm supported import formats and migration workflows. Contact us before planning a migration; we do not promise automatic imports.' },
  { question: 'Does Cursis include video meetings?', answer: 'Yes. Video meetings are included alongside tasks, projects and the calendar.' },
  { question: 'What is included in a workspace?', answer: 'Ordis AI, tasks, projects, calendar, meetings, automatic actions and progress reports are included.' },
  { question: 'How do I delete my account?', answer: 'Use the Privacy Centre at /privacy/rights to submit a deletion request. Read /data-deletion for the published deletion process.' },
  { question: 'How can I contact the team?', answer: 'Use the Contact page to send a question or feedback, or email cursis.in@gmail.com.' },
  { question: 'Are the demo names and numbers real customer results?', answer: 'No. Names, tasks and statistics in the interactive demos are sample data, not customer results or performance guarantees.' },
];
