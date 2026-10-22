'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/site';
import { useSearchParams } from 'next/navigation';
import LandingNav from '@/components/landing/LandingNav';
import Footer from '@/components/landing/Footer';
import '@/styles/landing.css';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process unsubscribe request.');
      }

      setStatus('success');
      setMessage(`You have been successfully unsubscribed from Cursis marketing and progress emails (${cleanEmail}).`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Something went wrong. Please email ' + SUPPORT_EMAIL + ' directly.');
    }
  };

  return (
    <div
      style={{
        maxWidth: '520px',
        width: '100%',
        margin: '0 auto',
        padding: '36px 32px',
        backgroundColor: '#FFFFFF',
        border: '2px solid #0A0A0A',
        borderRadius: '16px',
        boxShadow: '6px 6px 0 0 #0A0A0A',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            backgroundColor: '#FF5500',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            border: '1px solid #0A0A0A',
            borderRadius: '4px',
            boxShadow: '2px 2px 0 0 #0A0A0A',
            marginBottom: '12px',
          }}
        >
          CAN-SPAM Opt-Out Desk
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0A0A0A', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Unsubscribe from Updates
        </h1>
        <p style={{ fontSize: '13px', color: '#555555', lineHeight: 1.5, margin: 0 }}>
          We respect your inbox. Enter your email below to instantly opt out from marketing announcements, product releases, and non-transactional communications.
        </p>
      </div>

      {status === 'success' ? (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#F0FDF4',
            border: '1.5px solid #16A34A',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#166534', marginBottom: '6px' }}>
            Unsubscribe Confirmed
          </div>
          <p style={{ fontSize: '13px', color: '#15803D', lineHeight: 1.4, margin: '0 0 16px 0' }}>
            {message}
          </p>
          <p style={{ fontSize: '11.5px', color: '#4B5563', margin: '0 0 16px 0' }}>
            Please note that you may still receive essential transactional emails (password resets, security alerts, or workspace team invites).
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#0A0A0A',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              borderRadius: '8px',
            }}
          >
            Return to Homepage
          </Link>
        </div>
      ) : (
        <form onSubmit={handleUnsubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {status === 'error' && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#991B1B',
                fontWeight: 600,
              }}
            >
              {message}
            </div>
          )}

          <div>
            <label
              htmlFor="unsub-email"
              style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0A0A0A', marginBottom: '6px' }}
            >
              Email Address
            </label>
            <input
              id="unsub-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              style={{
                width: '100%',
                height: '44px',
                padding: '0 14px',
                fontSize: '14px',
                border: '1.5px solid #0A0A0A',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              width: '100%',
              height: '46px',
              backgroundColor: '#FF5500',
              color: '#FFFFFF',
              border: '2px solid #0A0A0A',
              borderRadius: '8px',
              boxShadow: '3px 3px 0 0 #0A0A0A',
              fontWeight: 800,
              fontSize: '14px',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {status === 'loading' ? 'Processing...' : 'Unsubscribe from Marketing'}
          </button>
        </form>
      )}

      {/* CAN-SPAM Sender Disclosures */}
      <div
        style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px dashed #E5E0D8',
          fontSize: '11px',
          color: '#737373',
          lineHeight: 1.5,
          textAlign: 'center',
        }}
      >
        <strong>Sender Information:</strong><br />
        Cursis<br />
        Business contact address awaiting confirmation<br />
        U.S. Compliance: Agent appointment not confirmed<br />
        Support Desk: <a href={'mailto:' + SUPPORT_EMAIL} style={{ color: '#0F4CFF' }}>{SUPPORT_EMAIL}</a>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF6EE' }}>
      <LandingNav />
      <main style={{ flex: '1 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 20px 80px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>Loading unsubscribe preferences...</div>}>
          <UnsubscribeContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
