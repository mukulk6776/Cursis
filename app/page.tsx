import React from 'react';
import LandingPage from '@/components/landing/LandingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cursis — Autonomous AI Workplace & Agency OS',
  description:
    'Transform your team productivity with Cursis autonomous AI workplace and agency operating system. Ordis AI proactively detects bottlenecks, rebalances workloads, and takes real actions. SOC 2 certified. 99.99% SLA uptime. Join 1,250+ teams.',
  keywords: [
    'Cursis',
    'Ordis AI',
    'Autonomous Workplace',
    'Agency Operating System',
    'Somba Neo-Brutalist UI',
    'autonomous workspace',
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
    title: 'Cursis — Autonomous AI Workplace & Agency OS',
    description: 'Cursis — Autonomous AI Workplace & Agency OS powered by Ordis AI.',
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
    location: 'Bengaluru, Karnataka, India',
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
