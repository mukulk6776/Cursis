'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signInWithEmail, signInWithGoogle, handleGoogleRedirectResult } from '@/lib/auth/firebase';
import '@/styles/landing.css';
import '@/styles/auth.css';
import { ArrowRight, Eye, EyeOff, X } from 'lucide-react';

export default function LoginPage() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [googleLoading, setGoogleLoading] = useState(false);
 const [errorMsg, setErrorMsg] = useState('');
 const [successMsg, setSuccessMsg] = useState('');

 useEffect(() => {
 let isMounted = true;
 if (typeof window !== 'undefined') {
 const params = new URLSearchParams(window.location.search);
 if (params.get('logout') === 'true') {
 setSuccessMsg('You have been signed out successfully.');
 }
 }

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
      // If authResult already has a verified signed session token (e.g. from password login)
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
      setErrorMsg(err?.name === 'TimeoutError' ? 'Creating your session took too long. Please try signing in again.' : (err?.message || 'Authentication failed. Please verify your credentials and try again.'));
    }
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
      const authResult = await signInWithEmail(cleanEmail, password);
      if (authResult?.email) {
        await exchangeTokenAndRedirect(authResult);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const authResult = await signInWithGoogle();
      if (authResult?.email || authResult?.idToken) {
        await exchangeTokenAndRedirect(authResult);
      }
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMsg('Google sign-in popup was closed before completing.');
      } else if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized domain') || msg.includes('not configured')) {
        setErrorMsg('Google sign-in is not configured for this domain. Please use email login below.');
      } else {
        setErrorMsg(err?.message || 'Failed to authenticate with Google. Please try again or use email login.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

 return (
    <main id="main-content" className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <Link href="/" className="auth-close" aria-label="Back to Cursis"><X size={18} /></Link>
        <Link href="/" className="auth-brand" aria-label="Cursis home">
          <svg viewBox="0 0 1024 1024" fill="none" width="36" height="36" aria-hidden="true"><path d="M545 240 A282 282 0 1 0 782 566" stroke="currentColor" strokeWidth="142" strokeLinecap="round" /><rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#FF5500" /></svg>
          Cursis
        </Link>
        <h1 id="login-title">Welcome back.</h1>
        <p className="auth-intro">Your team. Your work. One place.</p>
        {successMsg && <p className="auth-message auth-success" role="status">{successMsg}</p>}
        {errorMsg && <p className="auth-message auth-error" role="alert">{errorMsg}</p>}
        <button type="button" className="auth-google" onClick={handleGoogleSignIn} disabled={googleLoading || loading}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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
          {googleLoading ? 'Connecting…' : 'Continue with Google'}
        </button>
        <div className="auth-divider"><span>or continue with email</span></div>
        <form onSubmit={handleEmailLogin} className="auth-form">
          <label htmlFor="login-email">Email address</label>
          <input id="login-email" type="email" autoComplete="email" value={email} placeholder="you@example.com" onChange={e => setEmail(e.target.value)} required />
          <div className="auth-password-label"><label htmlFor="login-password">Password</label><button type="button" className="auth-text-button" onClick={() => { setErrorMsg(''); setSuccessMsg('To reset your password, contact your workspace owner or email security@cursis.in.'); }}>Forgot password?</button></div>
          <div className="auth-password">
            <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} placeholder="Enter your password" onChange={e => setPassword(e.target.value)} required />
            <button type="button" className="auth-eye" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <button type="submit" className="auth-submit" disabled={loading || googleLoading}>{loading ? 'Signing in…' : 'Continue'}<ArrowRight size={18} aria-hidden="true" /></button>
        </form>
        <p className="auth-signup">New to Cursis? <Link href="/signup">Make my workspace</Link></p>
        <p className="auth-legal">By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
      </section>
      <Link href="/" className="auth-back">← Back to Cursis</Link>
    </main>
 );
}
