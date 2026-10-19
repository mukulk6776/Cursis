import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';
import MarketingEngagement from '@/components/landing/MarketingEngagement';
import { THEME_BOOTSTRAP } from '@/lib/dashboard/theme';

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
    default: 'Cursis',
    template: '%s | Cursis',
  },
  description:
    'Keep tasks, projects, chat, and video meetings together. Ordis AI spots delayed tasks and helps share work so your team can stay on track.',
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
    'team workspace privacy',
    'AI project management',
    'AI assistant',
    'workload balancing',
    'sprint management',
    'document management system',
  ],
  authors: [{ name: 'Cursis', url: 'https://cursis.in' }],
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
    url: 'https://cursis.in',
    siteName: 'Cursis',
    title: 'Cursis',
    description:
      'Keep tasks, projects, chat, and video meetings together. Ordis AI spots delayed tasks and helps share work so your team can stay on track.',
    images: [
      {
        url: '/marketing-og.png',
        width: 1200,
        height: 630,
        alt: 'Cursis — Your Team’s Work in One Place',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cursis — Your Team’s Work in One Place',
    description: 'Keep work together. Catch delayed tasks and share the workload with help from Ordis AI.',
    images: ['/marketing-og.png'],
    creator: '@cursis_',
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
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  } : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="author" href="/humans.txt" />
        {/* Fonts are fully self-hosted locally via next/font with zero external requests to Google (Munich Court GDPR compliant) */}
        {/* Firebase domains - only preconnect, don't prefetch (loaded on-demand) */}
        <link rel="dns-prefetch" href="https://firebaseapp.com" />
        <link rel="dns-prefetch" href="https://googleapis.com" />



        <script
          dangerouslySetInnerHTML={{
            __html: THEME_BOOTSTRAP,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased min-h-screen`}>
        {children}
        <ClientProviders /><MarketingEngagement />
      </body>
    </html>
  );
}
