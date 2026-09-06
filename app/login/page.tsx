'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signInWithGoogle, isFirebaseConfigured } from '@/lib/auth/firebase';
import '@/styles/landing.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatFirebaseError = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'Incorrect email or password. Please verify your credentials.';
    }
    if (code === 'auth/user-not-found') {
      return 'No account found with this email. Please sign up first.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Access temporarily disabled due to many failed login attempts. Please try again later.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in popup was closed before completing.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Current domain is not authorized in Firebase Console.';
    }
    return err?.message || 'Authentication failed. Please try again.';
  };

  const exchangeTokenAndRedirect = async (authResult: { email: string; displayName: string; idToken: string; uid?: string; photoURL?: string | null }) => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: authResult.email,
          displayName: authResult.displayName,
          idToken: authResult.idToken,
          uid: authResult.uid,
          photoURL: authResult.photoURL,
        }),
      });

      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Failed to establish workspace session.');
      }
    } catch (err: any) {
      console.error('Session exchange error:', err);
      setErrorMsg(err.message || 'Failed to establish workspace session.');
    }
  };


  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const authResult = await signInWithEmail(email, password);
      await exchangeTokenAndRedirect(authResult);
    } catch (err: any) {
      setErrorMsg(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg('');

    try {
      const authResult = await signInWithGoogle();
      await exchangeTokenAndRedirect(authResult);
    } catch (err: any) {
      setErrorMsg(formatFirebaseError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await exchangeTokenAndRedirect({
        email: 'alex@cursis.io',
        displayName: 'Alex Morgan',
        idToken: 'demo_session_authenticated',
        uid: 'u1',
      });
    } catch {
      window.location.href = '/dashboard';
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      id="main-content"
      style={{
        minHeight: '100vh',
        background: 'var(--c-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-4)',
      }}
    >
      <div style={{ marginBottom: 'var(--sp-6)', textAlign: 'center' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none" width="36" height="36">
            <path
              d="M 545 240 A 282 282 0 1 0 782 566"
              stroke="#18181b"
              strokeWidth="142"
              strokeLinecap="round"
              fill="none"
            />
            <rect
              x="625"
              y="196"
              width="156"
              height="156"
              rx="42"
              transform="rotate(-10 703 274)"
              fill="#ff5710"
            />
          </svg>
          <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--c-near-black)' }}>Cursis</span>
        </Link>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Sign in to your free AI-powered workspace
        </p>
      </div>

      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: 'var(--sp-6)',
          background: 'var(--c-white)',
          border: 'var(--border-width) solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {errorMsg && (
          <div
            style={{
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #f87171',
              padding: 'var(--sp-2) var(--sp-3)',
              fontSize: 'var(--fs-xs)',
              marginBottom: 'var(--sp-3)',
              borderRadius: 'var(--border-radius-sm)',
              fontWeight: 'bold',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          className="btn btn-secondary btn-lg"
          style={{
            width: '100%',
            marginBottom: 'var(--sp-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontWeight: 700,
          }}
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
        </button>

        <div style={{ textAlign: 'center', margin: '12px 0', position: 'relative' }}>
          <div style={{ borderTop: '1px solid var(--c-gray-200)', position: 'absolute', top: '50%', width: '100%' }} />
          <span
            style={{
              background: 'var(--c-white)',
              padding: '0 10px',
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              fontWeight: 800,
              position: 'relative',
            }}
          >
            or sign in with email
          </span>
        </div>

        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <div>
            <label className="input-label" style={{ fontSize: '11px', fontWeight: 800 }}>
              Work Email
            </label>
            <input
              type="email"
              className="input"
              value={email}
              placeholder="name@company.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label" style={{ fontSize: '11px', fontWeight: 800 }}>
              Password
            </label>
            <input
              type="password"
              className="input"
              value={password}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-brand btn-lg"
            style={{ width: '100%', marginTop: 'var(--sp-2)' }}
            disabled={loading || googleLoading}
          >
            {loading ? 'Authenticating...' : 'Sign In with Email'}
          </button>

          <div style={{ textAlign: 'center', margin: '6px 0' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800 }}>
              — Developer Access —
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleDemoAccess}
            disabled={loading}
          >
            Enter Workspace as Alex Morgan →
          </button>
        </form>

        <div style={{ marginTop: 'var(--sp-5)', textAlign: 'center', fontSize: '12px' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--c-brand)', fontWeight: 800 }}>
            Create one free
          </Link>
        </div>
      </div>
    </main>
  );
}
