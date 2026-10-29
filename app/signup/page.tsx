'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, X } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle, handleGoogleRedirectResult } from '@/lib/auth/firebase';
import '@/styles/landing.css';
import '@/styles/auth.css';
import { BRAND_NAME, TEAM_USER_LIMIT } from '@/lib/site';
import CaptureSignupSource from '@/components/landing/CaptureSignupSource';

export default function SignupPage() {
 const [method, setMethod] = useState<'email' | 'google' | null>(null);
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
 if (window.location.hash === '#signup-age-gate') setMethod('google');
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
      setErrorMsg('Confirm that you are at least 13 and consent to account processing in the privacy notice.');
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
      setErrorMsg('Confirm that you are at least 13 and consent to account processing before Google sign-up.');
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
    <main id="main-content" className="auth-page auth-signup-page">
      <CaptureSignupSource />
      <section className="auth-card auth-signup-card" aria-labelledby="signup-title">
        <Link href="/" className="auth-close" aria-label="Back to Cursis"><X size={18} /></Link>
        <Link href="/" className="auth-brand" aria-label="Cursis home"><svg viewBox="0 0 1024 1024" fill="none" width="36" height="36" aria-hidden="true"><path d="M545 240 A282 282 0 1 0 782 566" stroke="currentColor" strokeWidth="142" strokeLinecap="round" /><rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#FF5500" /></svg>{BRAND_NAME}</Link><p className="auth-start-badge">✳ A little less busywork.</p>
        <h1 id="signup-title">{method ? 'Make it your workspace.' : 'Great work starts here.'}</h1>
        <p className="auth-intro">{method ? 'One last step. Then make room for what matters.' : 'Your team, your tasks, and Ordis. All in one place.'}</p>

        {errorMsg && <p className="auth-message auth-error" role="alert">{errorMsg}</p>}
        {!method ? <>
          <button type="button" className="auth-google" onClick={() => { setErrorMsg(''); setMethod('google'); }}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.23-2.51c-.9.6-2.04.97-3.38.97-2.6 0-4.8-1.76-5.59-4.13H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5L18.7 4.6A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.71 9.4 5.95 12 5.95Z"/></svg>Continue with Google</button>
          <div className="auth-divider"><span>or continue with email</span></div>
          <form className="auth-form" onSubmit={event => { event.preventDefault(); setEmail(email.trim().toLowerCase()); setErrorMsg(''); setMethod('email'); }}>
            <label htmlFor="signup-email">Work email</label>
            <input id="signup-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@gmail.com" required />
            <button type="submit" className="auth-submit">Continue <ArrowRight size={18} aria-hidden="true" /></button>
          </form>
          <ul className="auth-signup-perks"><li>Up to {TEAM_USER_LIMIT} people, free</li><li>No credit card</li></ul>
        </> : <form onSubmit={method === 'email' ? handleEmailSignup : event => { event.preventDefault(); void handleGoogleSignup(); }} className="auth-form">
          <button type="button" className="auth-change-method" disabled={loading || googleLoading} onClick={() => { setMethod(null); setErrorMsg(''); }}>← {method === 'email' ? email : 'Continue with Google'} · Change</button>
          {method === 'email' && <>
          <label htmlFor="signup-name">Name</label>
          <input id="signup-name" autoComplete="name" autoFocus value={name} onChange={event => setName(event.target.value)} required />
          <p className="auth-reset-help">Gmail and Microsoft email accounts are currently supported.</p>
          <label htmlFor="signup-password">Password</label>
          <div className="auth-password"><input id="signup-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} maxLength={128} aria-describedby="signup-password-help" /><button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
          <p id="signup-password-help" className="auth-reset-help">Use 8–128 characters with uppercase, lowercase, a number and a symbol.</p>
          </>}
          <label className="auth-consent"><input id="signup-age-gate" type="checkbox" required checked={ageConfirmed} onChange={event => setAgeConfirmed(event.target.checked)} /><span>I confirm that I am at least 13. {BRAND_NAME} does not offer accounts for anyone under 13.</span></label>
          <label className="auth-consent"><input type="checkbox" required checked={privacyConsent} onChange={event => setPrivacyConsent(event.target.checked)} /><span>I consent to {BRAND_NAME} using my account and authentication details to provide and secure my workspace, as described in the standalone <Link href="/privacy" target="_blank">Privacy Notice</Link>. This does not include marketing or optional analytics. I can withdraw through the privacy centre and close my account.</span></label>
          <button type="submit" className="auth-submit" disabled={loading || googleLoading}>{method === 'google' ? (googleLoading ? 'Connecting to Google…' : 'Continue with Google') : (loading ? 'Creating your workspace…' : 'Create my free workspace')} <ArrowRight size={18} aria-hidden="true" /></button>
        </form>}
        <p className="auth-legal">By creating an account, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
        <p className="auth-signup">Already have an account? <Link href="/login">Sign in</Link></p>
      </section>
      <Link href="/" className="auth-back">← Back to {BRAND_NAME}</Link>
    </main>
  );
}
