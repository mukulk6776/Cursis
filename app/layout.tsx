import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import CookieConsent from '@/components/CookieConsent';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://cursis.in'),
  title: {
    default: 'Cursis — Autonomous AI Workplace & Agency OS',
    template: '%s | Cursis',
  },
  description:
    'Cursis is an autonomous AI workplace and agency operating system powered by Ordis AI. Manage teams, projects, tasks, documents, and workflows with proactive AI that takes real actions. SOC 2 certified, 99.99% SLA uptime.',
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
    'SOC 2 certified workspace',
    'AI project management',
    'autonomous AI agent',
    'workload balancing',
    'sprint management',
    'document management system',
  ],
  authors: [{ name: 'Cursis Inc.', url: 'https://cursis.in' }],
  creator: 'Cursis Inc.',
  publisher: 'Cursis Inc.',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cursis.in',
    siteName: 'Cursis',
    title: 'Cursis — Autonomous AI Workplace & Agency OS',
    description:
      'Cursis is an autonomous AI workplace and agency operating system powered by Ordis AI. Manage teams, projects, tasks, documents, and workflows with proactive AI that takes real actions. SOC 2 certified. 99.99% SLA uptime.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cursis — Autonomous AI Workplace & Agency OS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cursis — Autonomous AI Workplace & Agency OS',
    description: 'AI-powered workspace with Ordis autonomous intelligence. Real actions, not just chat.',
    images: ['/og-image.png'],
    creator: '@cursis',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://cursis.in',
  },
  verification: {
    google: 'your-google-verification-code',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased min-h-screen`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
