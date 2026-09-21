import React from 'react';
import LandingPage from '@/components/landing/LandingPage';
import { generateOrganizationSchema } from '@/lib/seo/schema';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cursis — Autonomous Workspace Platform with AI-Powered Ordis Intelligence',
  description:
    'Transform your team productivity with Cursis autonomous workspace. Ordis AI proactively detects bottlenecks, rebalances workloads, and takes real actions. SOC 2 certified. 99.99% SLA uptime. Join 1,250+ teams.',
  keywords: [
    'autonomous workspace',
    'AI workspace management',
    'Ordis AI',
    'project management software',
    'team collaboration platform',
    'workflow automation',
    'enterprise workspace',
    'AI project management',
    'workload balancing',
    'sprint management tool',
  ],
  openGraph: {
    title: 'Cursis — Autonomous Workspace Platform',
    description: 'AI-powered workspace with Ordis autonomous intelligence. Real actions, not just chat.',
    type: 'website',
    url: 'https://www.cursis.in',
  },
  alternates: {
    canonical: 'https://www.cursis.in',
  },
};

export default function MainPage() {
  const organizationSchema = generateOrganizationSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <LandingPage />
    </>
  );
}

