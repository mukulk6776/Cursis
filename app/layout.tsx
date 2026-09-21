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
  metadataBase: new URL('https://www.cursis.in'),
  title: {
    default: 'Cursis — Autonomous Workspace Platform with AI-Powered Ordis Intelligence',
    template: '%s | Cursis',
  },
  description:
    'Cursis is an autonomous workspace platform powered by Ordis AI. Manage teams, projects, tasks, documents, and workflows with proactive AI that takes real actions. SOC 2 certified, 99.99% SLA uptime. Join 1,250+ teams.',
  keywords: [
    'autonomous workspace',
    'AI workspace management',
    'Ordis AI',
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
  authors: [{ name: 'Cursis Team', url: 'https://www.cursis.in' }],
  creator: 'Cursis',
  publisher: 'Cursis',
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
    url: 'https://www.cursis.in',
    siteName: 'Cursis',
    title: 'Cursis — Autonomous Workspace Platform with AI-Powered Ordis Intelligence',
    description:
      'Autonomous workspace management with Ordis AI. Proactive workload balancing, risk detection, and autonomous actions. SOC 2 certified. 99.99% SLA uptime.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cursis Autonomous Workspace Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cursis — Autonomous Workspace Platform',
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
    canonical: 'https://www.cursis.in',
  },
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} antialiased min-h-screen`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
