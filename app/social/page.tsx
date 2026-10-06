import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Connect with Cursis on Social Media',
  description: 'Follow Cursis on Instagram, X (Twitter), Discord, LinkedIn, Facebook, YouTube, and GitHub. Stay updated with the latest features, tips, and community discussions.',
  openGraph: {
    title: 'Connect with Cursis on Social Media',
    description: 'Follow us on all major platforms to stay connected with the Cursis community.',
    type: 'website',
  },
};

const socialProfiles = [
  {
    name: 'Instagram',
    handle: '@cursis.in',
    url: 'https://instagram.com/cursis.in',
    description: 'Follow us for product updates, tips, and behind-the-scenes content',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
  {
    name: 'X (Twitter)',
    handle: '@cursis_',
    url: 'https://x.com/cursis_',
    description: 'Get real-time updates, announcements, and join conversations',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
];

const profilePageSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: {
    '@type': 'Organization',
    name: 'Cursis Inc.',
    alternateName: 'Cursis',
    url: 'https://cursis.in',
    logo: 'https://cursis.in/icon.png',
    description: 'Autonomous AI workplace and agency operating system powered by Ordis AI',
    sameAs: socialProfiles.map(p => p.url),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'cursis.in@gmail.com',
    },
  },
};

export default function SocialPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageSchema) }}
      />
      <div style={{ minHeight: '100vh', background: 'var(--c-bg-primary)', padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--c-text-primary)' }}>
              Connect with Cursis
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--c-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Follow us on your favorite platforms to stay updated with the latest features, tips, and community discussions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {socialProfiles.map((profile) => (
              <a
                key={profile.name}
                href={profile.url}
                target="_blank"
                rel="noopener noreferrer me"
                style={{
                  display: 'block',
                  padding: '2rem',
                  background: 'var(--c-bg-secondary)',
                  border: '2px solid var(--c-border-primary)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  color: 'inherit',
                }}
                className="social-profile-card"
              >
                <div style={{ marginBottom: '1rem', color: 'var(--c-accent-primary)' }}>
                  {profile.icon}
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--c-text-primary)' }}>
                  {profile.name}
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--c-text-tertiary)', marginBottom: '0.75rem' }}>
                  {profile.handle}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>
                  {profile.description}
                </p>
              </a>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                padding: '0.75rem 2rem',
                background: 'var(--c-accent-primary)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>

        <style jsx>{`
          .social-profile-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            border-color: var(--c-accent-primary);
          }
        `}</style>
      </div>
    </>
  );
}
