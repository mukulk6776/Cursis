import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';
import MarketingEngagement from '@/components/landing/MarketingEngagement';
import { THEME_BOOTSTRAP } from '@/lib/dashboard/theme';
import { SOCIAL_IMAGE } from '@/lib/seo/marketing';
import { BRAND_NAME, SITE_URL, TWITTER_HANDLE } from '@/lib/site';

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: BRAND_NAME,
    template: '%s | Cursis',
  },
  description:
    'Keep tasks, projects, chat, and video meetings together. Ordis AI spots delayed tasks and helps share work so your team can stay on track.',
  keywords: [
    BRAND_NAME,
    'Ordis AI',
    'Team Workspace',
    'Agency Workspace',
    'shared team workspace',
    'AI workspace management',
    'project management software',
    'team collaboration platform',
    'workflow automation',
    'team workspace privacy',
    'AI project management',
    'AI assistant',
    'workload balancing',
    'sprint management',
    'document management system',
  ],
  authors: [{ name: BRAND_NAME, url: SITE_URL }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
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
    url: SITE_URL,
    siteName: BRAND_NAME,
    title: BRAND_NAME,
    description:
      'Keep tasks, projects, chat, and video meetings together. Ordis AI spots delayed tasks and helps share work so your team can stay on track.',
    images: [SOCIAL_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cursis — Your Team’s Work in One Place',
    description: 'Keep work together. Catch delayed tasks and share the workload with help from Ordis AI.',
    images: [{ url: SOCIAL_IMAGE.url, alt: SOCIAL_IMAGE.alt }],
    creator: TWITTER_HANDLE,
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
    canonical: SITE_URL,
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
        {/* Fonts are fully self-hosted locally via next/font with zero external requests to Google */}
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
