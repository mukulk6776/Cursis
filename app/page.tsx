import React from 'react';
import LandingPage from '@/components/landing/LandingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Cursis' },
  description:
    'Keep tasks, projects, chat, and video meetings in one place. Ordis AI helps catch delayed tasks and share the workload.',
  keywords: [
    'Cursis',
    'Ordis AI',
    'Team Workspace',
    'Agency Workspace',
    'shared team workspace',
    'AI workspace management',
    'project management software',
    'team collaboration platform',
    'workflow automation',
    'enterprise workspace',
    'AI project management',
    'workload balancing',
    'sprint management tool',
  ],
  openGraph: {
    siteName: 'Cursis',
    title: 'Cursis',
    description: 'Cursis brings your team’s work together, with Ordis AI to help keep it on track.',
    type: 'website',
    url: 'https://cursis.in',
  },
  alternates: {
    canonical: 'https://cursis.in',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cursis',
  operatingSystem: 'Web',
  applicationCategory: 'BusinessApplication',
  url: 'https://cursis.in',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Organization',
    name: 'Cursis Inc.',
    location: 'Delhi, India',
  },
};

export default function MainPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
