import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import '@/styles/landing.css';

export const metadata: Metadata = {
  title: 'About Us — Cursis',
  description:
    'Meet the team behind Cursis, the autonomous AI workplace revolutionizing how teams work together.',
  openGraph: {
    title: 'About Us — Cursis',
    description: 'Meet the team behind Cursis, the autonomous AI workplace.',
    type: 'website',
    url: 'https://cursis.in/about',
  },
};

const teamMembers = [
  {
    name: 'Saransh Vashistha',
    role: 'CEO',
    description:
      'Visionary leader driving Cursis strategic direction and growth. Saransh brings deep expertise in enterprise software and AI innovation, steering the company toward building the future of autonomous workplaces. His leadership focuses on creating technology that genuinely transforms how teams collaborate and succeed.',
  },
  {
    name: 'Mukul Kumar',
    role: 'CTO',
    description:
      'Technical architect behind Cursis cutting-edge AI infrastructure. Mukul leads the engineering team in developing Ordis AI and the sophisticated systems that power autonomous workplace operations. His expertise spans distributed systems, machine learning, and scalable architecture design.',
  },
  {
    name: 'Lakhan',
    role: 'CGO',
    description:
      'Growth strategist orchestrating Cursis market expansion and customer success initiatives. Lakhan champions product-market fit through data-driven strategies, building meaningful relationships with enterprise clients and scaling adoption across teams worldwide.',
  },
];

export default function AboutPage() {
  return (
    <div className="lp-body">
      <style>{`
        .team-member-card {
          padding: 40px;
          background: var(--lp-card-bg);
          border: 2px solid var(--lp-border);
          border-radius: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .team-member-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
      `}</style>
      <nav className="lp-nav">
        <div className="lp-nav-container">
          <Link href="/" className="lp-nav-logo">
            Cursis
          </Link>
          <Link href="/login" className="lp-nav-login">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="lp-section" style={{ paddingTop: '120px' }}>
        <div className="lp-container">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h1
              className="lp-hero-title"
              style={{ fontSize: '4rem', marginBottom: '24px' }}
            >
              About Cursis
            </h1>
            <p
              className="lp-hero-subtitle"
              style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.25rem' }}
            >
              We're building the future of work with autonomous AI that doesn't just
              assist—it takes action, optimizes workflows, and empowers teams to achieve
              more.
            </p>
          </div>

          {/* Team Section */}
          <div style={{ marginBottom: '80px' }}>
            <h2
              className="lp-section-title"
              style={{ textAlign: 'center', marginBottom: '60px' }}
            >
              Meet Our Leadership Team
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '40px',
                maxWidth: '1200px',
                margin: '0 auto',
              }}
            >
              {teamMembers.map((member) => (
                <div
                  key={member.name}
                  className="lp-feature-card team-member-card"
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '24px',
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <h3
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      marginBottom: '8px',
                      color: 'var(--lp-text-primary)',
                    }}
                  >
                    {member.name}
                  </h3>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#667eea',
                      marginBottom: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {member.role}
                  </div>
                  <p
                    style={{
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      color: 'var(--lp-text-secondary)',
                    }}
                  >
                    {member.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Mission Statement */}
          <div
            style={{
              textAlign: 'center',
              padding: '60px 40px',
              background: 'var(--lp-card-bg)',
              border: '2px solid var(--lp-border)',
              borderRadius: '12px',
              maxWidth: '900px',
              margin: '0 auto',
            }}
          >
            <h2
              className="lp-section-title"
              style={{ marginBottom: '24px', fontSize: '2rem' }}
            >
              Our Mission
            </h2>
            <p
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.8',
                color: 'var(--lp-text-secondary)',
              }}
            >
              At Cursis, we believe work should be intelligent, not just digital. Our
              mission is to create an autonomous AI workplace where Ordis AI proactively
              identifies bottlenecks, rebalances workloads, and takes meaningful actions—
              freeing teams to focus on innovation and impact rather than operational
              overhead.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="lp-footer" style={{ marginTop: '120px' }}>
        <div className="lp-container">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: 'var(--lp-text-secondary)' }}>
              © 2026 Cursis Inc. All rights reserved.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Link
                href="/privacy"
                style={{ color: 'var(--lp-text-secondary)', margin: '0 16px' }}
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                style={{ color: 'var(--lp-text-secondary)', margin: '0 16px' }}
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
