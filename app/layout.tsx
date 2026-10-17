import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';
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
    'SOC 2 certified workspace',
    'AI project management',
    'AI assistant',
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
    title: 'Cursis',
    description:
      'Keep tasks, projects, chat, and video meetings together. Ordis AI spots delayed tasks and helps share work so your team can stay on track.',
    images: [
      {
        url: '/og-image.png',
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
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  } : undefined,
};

const softwareSchema = {
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

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Cursis',
  alternateName: ['Cursis AI', 'Cursis Workplace', 'Cursis Agency OS'],
  url: 'https://cursis.in',
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cursis Inc.',
  alternateName: 'Cursis',
  url: 'https://cursis.in',
  logo: 'https://cursis.in/icon.png',
  description: 'A team workspace for tasks, projects, chat, and meetings, with help from Ordis AI',
  foundingDate: '2026-01',
  foundingLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Delhi',
      addressRegion: 'Delhi',
      addressCountry: 'IN',
    },
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    email: 'support@cursis.in',
    availableLanguage: ['English'],
  },
  sameAs: [
    'https://instagram.com/cursis.in',
    'https://x.com/cursis_',
  ],
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
        {/* DNS prefetch and preconnect for critical external resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Firebase domains - only preconnect, don't prefetch (loaded on-demand) */}
        <link rel="dns-prefetch" href="https://firebaseapp.com" />
        <link rel="dns-prefetch" href="https://googleapis.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_BOOTSTRAP,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased min-h-screen`}>
        {children}
        <ClientProviders />
      </body>
    </html>
  );
}
