'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signUpWithEmail, signInWithGoogle, handleGoogleRedirectResult } from '@/lib/auth/firebase';
import '@/styles/landing.css';
import '@/styles/auth.css';
import { BRAND_NAME, TEAM_USER_LIMIT } from '@/lib/site';

export default function SignupPage() {
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [googleLoading, setGoogleLoading] = useState(false);
 const [ageConfirmed, setAgeConfirmed] = useState(false);
 const [privacyConsent, setPrivacyConsent] = useState(false);
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
 .catch((err) => {
 if (isMounted) setErrorMsg(err?.message || 'Google sign-in could not be restored. Please try again.');
 });

 return () => {
 isMounted = false;
 };
 }, []);

  const getRedirectDestination = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        if (redirect.includes('\\') || /[\x00-\x1F\x7F]/.test(redirect) || redirect.startsWith('//')) {
          return '/dashboard?setup=true';
        }
        try {
          const parsed = new URL(redirect, window.location.origin);
          if (parsed.origin === window.location.origin && parsed.pathname.startsWith('/')) {
            return parsed.pathname + parsed.search + parsed.hash;
          }
        } catch {}
      }
    }
    return '/dashboard?setup=true';
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
          sessionStorage.setItem('cursis_show_workspace_setup', 'true');
          localStorage.setItem('cursis_show_workspace_setup', 'true');
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
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          idToken: authResult.idToken,
          email: authResult.email,
          displayName: authResult.displayName,
          uid: authResult.uid,
          photoURL: authResult.photoURL,
          ageConfirmed,
          privacyConsent,
          noticeVersion: '2026-10-18',
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
        sessionStorage.setItem('cursis_show_workspace_setup', 'true');
        localStorage.setItem('cursis_show_workspace_setup', 'true');
      } catch {}

      await new Promise((r) => setTimeout(r, 120));
      window.location.href = getRedirectDestination();
    } catch (err: any) {
      console.error('Session exchange error:', err);
      setErrorMsg(err?.name === 'TimeoutError' ? 'Creating your session took too long. Please try signing in again.' : (err?.message || 'Failed to initialize workspace session. Please try logging in directly.'));
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      setErrorMsg('Please complete all fields.');
      return;
    }

    if (!ageConfirmed || !privacyConsent) {
      setErrorMsg('Confirm that you are at least 18 and consent to account processing in the privacy notice.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Use a password with at least 8 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const authResult = await signUpWithEmail(cleanEmail, password, cleanName, ageConfirmed, privacyConsent);
      if (authResult?.email) {
        await exchangeTokenAndRedirect(authResult);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not create your workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!ageConfirmed || !privacyConsent) {
      setErrorMsg('Confirm that you are at least 18 and consent to account processing before Google sign-up.');
      return;
    }

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
    <main id="main-content" className="auth-page">
      <section className="auth-card" aria-labelledby="signup-title">
        <Link href="/" className="auth-close" aria-label="Back to Cursis">×</Link>
        <Link href="/" className="auth-brand">{BRAND_NAME}</Link>
        <h1 id="signup-title">Create your free workspace</h1>
        <p className="auth-intro">Free for up to {TEAM_USER_LIMIT} people. No credit card.</p>
        <ul className="auth-benefits"><li>Free for up to {TEAM_USER_LIMIT} people</li><li>No credit card</li><li><Link href="/privacy/rights">Export or delete your data anytime</Link></li></ul>
        {errorMsg && <p className="auth-message auth-error" role="alert">{errorMsg}</p>}
        <button type="button" className="auth-google" onClick={handleGoogleSignup} disabled={googleLoading || loading}>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</button>
        <p className="auth-reset-help">Confirm your age and privacy consent below before continuing with Google.</p>
        <div className="auth-divider"><span>or continue with email</span></div>
        <form onSubmit={handleEmailSignup} className="auth-form">
          <label htmlFor="signup-name">Name</label>
          <input id="signup-name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} required />
          <label htmlFor="signup-email">Work email</label>
          <input id="signup-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@gmail.com" required />
          <p className="auth-reset-help">Gmail and Microsoft email accounts are currently supported.</p>
          <label htmlFor="signup-password">Password</label>
          <div className="auth-password"><input id="signup-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} maxLength={128} aria-describedby="signup-password-help" /><button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div>
          <p id="signup-password-help" className="auth-reset-help">Use 8–128 characters with uppercase, lowercase, a number and a symbol.</p>
          <label className="auth-consent"><input id="signup-age-gate" type="checkbox" required checked={ageConfirmed} onChange={event => setAgeConfirmed(event.target.checked)} /><span>I confirm that I am at least 18. {BRAND_NAME} does not offer accounts for children.</span></label>
          <label className="auth-consent"><input type="checkbox" required checked={privacyConsent} onChange={event => setPrivacyConsent(event.target.checked)} /><span>I consent to {BRAND_NAME} using my account and authentication details to provide and secure my workspace, as described in the standalone <Link href="/privacy" target="_blank">Privacy Notice</Link>. This does not include marketing or optional analytics. I can withdraw through the privacy centre and close my account.</span></label>
          <button type="submit" className="auth-submit" disabled={loading || googleLoading}>{loading ? 'Creating your workspace…' : 'Create my free workspace'}</button>
          <p className="auth-legal">By creating an account, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
        </form>
        <p className="auth-signup">Already have an account? <Link href="/login">Sign in</Link></p>
      </section>
      <Link href="/" className="auth-back">← Back to {BRAND_NAME}</Link>
    </main>
  );
}
