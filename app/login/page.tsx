'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import '@/styles/landing.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('/dashboard');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect && redirect.startsWith('/')) {
        setRedirectUrl(redirect);
      }
      if (params.get('logout') === 'true') {
        setSuccessMsg('You have been signed out successfully.');
      }
    }
  }, []);

  const saveTokenAndRedirect = (token: string, targetUrl: string) => {
    if (token) {
      try {
        localStorage.setItem('cursis_token', token);
        document.cookie = `cursis_session=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
      } catch (e) {
        console.warn('Local storage write warning:', e);
      }
    }
    window.location.href = targetUrl;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both your work email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const message =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || data.message || 'Incorrect email or password. Please verify your credentials.';
        throw new Error(message);
      }

      const token = data.data?.token || data.token || '';
      saveTokenAndRedirect(token, redirectUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isDemo: true }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const message =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || data.message || 'Failed to start demo session.';
        throw new Error(message);
      }

      const token = data.data?.token || data.token || '';
      saveTokenAndRedirect(token, redirectUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo workspace session could not be established.');
      setDemoLoading(false);
    }
  };

  return (
    <main
      id="main-content"
      style={{
        minHeight: '100vh',
        background: 'var(--c-bg, #fcfbf9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-4, 16px)',
      }}
    >
      <div style={{ marginBottom: 'var(--sp-6, 24px)', textAlign: 'center' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none" width="40" height="40">
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
          <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--c-near-black, #18181b)', letterSpacing: '-0.5px' }}>
            Cursis
          </span>
        </Link>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', marginTop: '6px' }}>
          Sign in to your autonomous AI execution workspace
        </p>
      </div>

      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '28px 24px',
          background: 'var(--c-white, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        }}
      >
        {successMsg && (
          <div
            style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '10px 14px',
              fontSize: '12px',
              marginBottom: '16px',
              borderRadius: '8px',
              fontWeight: 600,
            }}
          >
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              fontSize: '12px',
              marginBottom: '16px',
              borderRadius: '8px',
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* 1-Click Instant Demo Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={demoLoading || loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: '18px',
            background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: demoLoading || loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(24, 24, 27, 0.15)',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '15px' }}>⚡</span>
          <span>{demoLoading ? 'Starting Workspace Session...' : 'Instant Demo: Continue as Founder'}</span>
        </button>

        <div style={{ textAlign: 'center', margin: '14px 0', position: 'relative' }}>
          <div style={{ borderTop: '1px solid #e2e8f0', position: 'absolute', top: '50%', width: '100%' }} />
          <span
            style={{
              background: '#ffffff',
              padding: '0 12px',
              fontSize: '11px',
              color: '#94a3b8',
              textTransform: 'uppercase',
              fontWeight: 800,
              letterSpacing: '0.5px',
              position: 'relative',
            }}
          >
            or sign in with email
          </span>
        </div>

        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              htmlFor="login-email"
              style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}
            >
              Work Email
            </label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              placeholder="name@company.com"
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="login-password"
                style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px' }}
              >
                Password
              </label>
            </div>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? (
                  // Eye slash icon
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-brand btn-lg"
            style={{
              width: '100%',
              marginTop: '4px',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              background: '#ff5710',
              color: '#ffffff',
              border: 'none',
              cursor: loading || demoLoading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading || demoLoading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: '#ff5710', fontWeight: 700, textDecoration: 'none' }}>
            Create one free
          </Link>
        </div>
      </div>
    </main>
  );
}
