'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signUpWithEmail, signInWithGoogle, handleGoogleRedirectResult } from '@/lib/auth/firebase';
import '@/styles/landing.css';

export default function SignupPage() {
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [googleLoading, setGoogleLoading] = useState(false);
 const [errorMsg, setErrorMsg] = useState('');

 useEffect(() => {
 let isMounted = true;
 handleGoogleRedirectResult()
 .then((result) => {
 if (isMounted && result) {
 setGoogleLoading(true);
 exchangeTokenAndRedirect(result).finally(() => {
 if (isMounted) setGoogleLoading(false);
 });
 }
 })
 .catch((err) => console.warn('Google redirect notice:', err));

 return () => {
 isMounted = false;
 };
 }, []);

 const getRedirectDestination = () => {
 if (typeof window !== 'undefined') {
 const params = new URLSearchParams(window.location.search);
 const redirect = params.get('redirect');
 if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
 return redirect;
 }
 }
 return '/dashboard';
 };

  const exchangeTokenAndRedirect = async (authResult: {
    email: string;
    displayName: string;
    idToken: string;
    uid?: string;
    photoURL?: string | null;
  }) => {
    try {
      // If authResult already has a verified signed session token (e.g. from email signup)
      if (authResult.idToken && authResult.idToken.startsWith('cursis_usr_')) {
        try {
          localStorage.setItem('cursis_token', authResult.idToken);
          document.cookie = `cursis_session=${encodeURIComponent(authResult.idToken)}; path=/; max-age=604800; SameSite=Lax`;
        } catch {}
        await new Promise((r) => setTimeout(r, 120));
        window.location.href = getRedirectDestination();
        return;
      }

      // Exchange identity token (e.g. Firebase OAuth token) with session API
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          idToken: authResult.idToken,
          email: authResult.email,
          displayName: authResult.displayName,
          uid: authResult.uid,
          photoURL: authResult.photoURL,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Authentication session could not be established.');
      }

      const token = data.token || (data.data && data.data.token) || '';
      if (!token) {
        throw new Error('No valid session token was returned by the authentication server.');
      }

      try {
        localStorage.setItem('cursis_token', token);
        document.cookie = `cursis_session=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
      } catch {}

      await new Promise((r) => setTimeout(r, 120));
      window.location.href = getRedirectDestination();
    } catch (err: any) {
      console.error('Session exchange error:', err);
      setErrorMsg(err?.message || 'Failed to initialize workspace session. Please try logging in directly.');
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
 e.preventDefault();
 const cleanName = name.trim();
 const cleanEmail = email.trim();

 if (!cleanName || !cleanEmail || !password) {
 setErrorMsg('Please complete all fields.');
 return;
 }

 if (password.length < 6) {
 setErrorMsg('Enterprise security requires passwords to be at least 6 characters.');
 return;
 }

 setLoading(true);
 setErrorMsg('');

 try {
 const authResult = await signUpWithEmail(cleanEmail, password, cleanName);
 if (authResult?.email) {
 await exchangeTokenAndRedirect(authResult);
 }
 } catch (err: any) {
 setErrorMsg(err?.message || 'Failed to provision enterprise workspace. Please try again.');
 } finally {
 setLoading(false);
 }
 };

 const handleGoogleSignup = async () => {
 setGoogleLoading(true);
 setErrorMsg('');

 try {
 const authResult = await signInWithGoogle();
 if (authResult?.email || authResult?.idToken) {
 await exchangeTokenAndRedirect(authResult);
 }
 } catch (err: any) {
 const code = err?.code || '';
 if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
 setErrorMsg('Google sign-up popup was closed before completing.');
 } else {
 setErrorMsg(err?.message || 'Failed to authenticate with Google. Please try again.');
 }
 } finally {
 setGoogleLoading(false);
 }
 };

  return (
    <main
      id="main-content"
      style={{
        minHeight: '100vh',
        background: '#F6F4F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
      }}
    >
      {/* Background Ambience */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '350px',
          background: 'radial-gradient(ellipse at center, rgba(255, 85, 0, 0.08) 0%, rgba(246, 244, 240, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ marginBottom: '28px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none" width="38" height="38">
            <path
              d="M 545 240 A 282 282 0 1 0 782 566"
              stroke="#1A1612"
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
              fill="#FF5500"
            />
          </svg>
          <span style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1612' }}>Cursis</span>
        </Link>
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#1A1612',
              background: '#EFEBE4',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            Provision Workspace
          </span>
          <span style={{ fontSize: '12px', color: '#B8B2AA' }}>•</span>
          <span style={{ fontSize: '12px', color: '#6B655F', fontWeight: 500 }}>
            Standard Enterprise Architecture
          </span>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '36px 32px',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #E8E4DE',
          boxShadow: '0 20px 40px -10px rgba(26, 22, 18, 0.08), 0 1px 3px rgba(26, 22, 18, 0.04)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1612', margin: 0, letterSpacing: '-0.02em' }}>
            Deploy Your Workspace
          </h1>
          <p style={{ fontSize: '13px', color: '#6B655F', marginTop: '6px', margin: '6px 0 0 0', lineHeight: 1.5 }}>
            Set up an enterprise-grade collaborative environment with unified tasks, projects, and Ordis AI.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              fontSize: '12px',
              marginBottom: '16px',
              borderRadius: '10px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <span style={{ color: '#ef4444', fontWeight: 900 }}>!</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Enterprise Single Sign-On */}
        <button
          type="button"
          style={{
            width: '100%',
            height: '46px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontWeight: 700,
            fontSize: '13px',
            color: '#0A0A0A',
            background: '#ffffff',
            border: '2px solid #0A0A0A',
            borderRadius: '9999px',
            boxShadow: '3px 3px 0 0 #0A0A0A',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translate(-1.5px, -1.5px)';
            e.currentTarget.style.boxShadow = '4.5px 4.5px 0 0 #0A0A0A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translate(0, 0)';
            e.currentTarget.style.boxShadow = '3px 3px 0 0 #0A0A0A';
          }}
          onClick={handleGoogleSignup}
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
          {googleLoading ? 'Connecting to Google...' : 'Sign up with Google Workspace'}
        </button>

        <div style={{ textAlign: 'center', margin: '14px 0 16px', position: 'relative' }}>
          <div style={{ borderTop: '1px solid #E8E4DE', position: 'absolute', top: '50%', width: '100%' }} />
          <span
            style={{
              background: '#ffffff',
              padding: '0 12px',
              fontSize: '11px',
              color: '#968F87',
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: '0.05em',
              position: 'relative',
            }}
          >
            or register with email
          </span>
        </div>

        <form onSubmit={handleEmailSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1A1612', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              placeholder="Alex Vance"
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px',
                fontSize: '13px',
                color: '#1A1612',
                background: '#ffffff',
                border: '1px solid #E8E4DE',
                borderRadius: '12px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1A1612', marginBottom: '6px' }}>
              Work Email
            </label>
            <input
              type="email"
              value={email}
              placeholder="alex@company.com"
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px',
                fontSize: '13px',
                color: '#1A1612',
                background: '#ffffff',
                border: '1px solid #E8E4DE',
                borderRadius: '12px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1A1612', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="At least 6 characters"
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 40px 0 14px',
                  fontSize: '13px',
                  color: '#1A1612',
                  background: '#ffffff',
                  border: '1px solid #E8E4DE',
                  borderRadius: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#968F87',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              height: '46px',
              marginTop: '6px',
              background: '#0A0A0A',
              color: '#ffffff',
              border: '2px solid #0A0A0A',
              borderRadius: '9999px',
              boxShadow: '3px 3px 0 0 #0A0A0A',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            disabled={loading || googleLoading}
          >
            {loading ? 'Provisioning Workspace...' : 'Create Enterprise Workspace →'}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid #E8E4DE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#6B655F',
          }}
        >
          <span>Already have an account?</span>
          <Link href="/login" style={{ color: '#FF5500', fontWeight: 700, textDecoration: 'none' }}>
            Sign in →
          </Link>
        </div>
      </div>

      {/* Enterprise Trust & Compliance Footer */}
      <div style={{ marginTop: '24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', fontSize: '11px', color: '#968F87' }}>
          <span>256-Bit TLS Encryption</span>
          <span>•</span>
          <span>SOC-2 Type II Certified</span>
          <span>•</span>
          <span>99.99% Guaranteed SLA Uptime</span>
        </div>
        <p style={{ fontSize: '11px', color: '#B8B2AA', marginTop: '8px' }}>
          By creating an account, you agree to Cursis{' '}
          <Link href="/" style={{ color: '#6B655F', textDecoration: 'underline' }}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/" style={{ color: '#6B655F', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
 );
}
