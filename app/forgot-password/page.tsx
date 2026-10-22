'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, X } from 'lucide-react';
import '@/styles/landing.css';
import '@/styles/auth.css';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    if (step === 'reset') codeRef.current?.focus();
    if (step === 'done') headingRef.current?.focus();
  }, [step]);

  async function submit(action: 'request' | 'reset') {
    if (loading) return;
    setError('');
    if (action === 'reset' && password !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ action, email: email.trim().toLowerCase(), ...(action === 'reset' ? { code, password } : {}) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) setCooldown(Number(response.headers.get('Retry-After')) || 60);
        throw new Error(data.error || 'Please try again later.');
      }
      setMessage(data.message);
      if (action === 'request') {
        setStep('reset');
        setCode('');
        setCooldown(60);
      } else {
        setPassword('');
        setConfirmPassword('');
        setCode('');
        try { localStorage.removeItem('cursis_token'); } catch {}
        setStep('done');
      }
    } catch (err) {
      setError(err instanceof Error && err.name !== 'TimeoutError' ? err.message : 'The request took too long. Please try again.');
    } finally { setLoading(false); }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(step === 'email' ? 'request' : 'reset');
  }

  return (
    <main id="main-content" className="auth-page">
      <section className="auth-card" aria-labelledby="reset-title">
        <Link href="/login" className="auth-close" aria-label="Back to sign in"><X size={18} /></Link>
        <Link href="/" className="auth-brand" aria-label="Cursis home">
          <svg viewBox="0 0 1024 1024" fill="none" width="36" height="36" aria-hidden="true"><path d="M545 240 A282 282 0 1 0 782 566" stroke="currentColor" strokeWidth="142" strokeLinecap="round" /><rect x="625" y="196" width="156" height="156" rx="42" transform="rotate(-10 703 274)" fill="#FF5500" /></svg>
          Cursis
        </Link>
        <h1 id="reset-title" ref={headingRef} tabIndex={-1}>{step === 'done' ? 'You’re back in control.' : step === 'reset' ? 'Set a new password.' : 'Forgot your password?'}</h1>
        <p className="auth-intro">{step === 'done' ? 'Your password has been updated.' : step === 'reset' ? `Enter the code for ${email.trim().toLowerCase()}.` : 'We’ll email you a code to reset it.'}</p>
        {error && <p className="auth-message auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message auth-reset-notice" role="status">{message}</p>}
        {step === 'done' ? <Link href="/login" className="auth-submit auth-reset-login">Back to sign in <ArrowRight size={18} aria-hidden="true" /></Link> : (
          <form className="auth-form" onSubmit={handleSubmit} aria-busy={loading}>
            <label htmlFor="reset-email">Email address</label>
            <input id="reset-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} readOnly={step === 'reset'} required maxLength={254} />
            {step === 'reset' && <>
              <label htmlFor="reset-code">Six-digit code</label>
              <input ref={codeRef} id="reset-code" className="auth-reset-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" aria-describedby="reset-code-help" required />
              <p id="reset-code-help" className="auth-reset-help">Codes expire after 10 minutes. A new code replaces the previous one.</p>
              <label htmlFor="reset-password">New password</label>
              <div className="auth-password">
                <input id="reset-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} maxLength={128} aria-describedby="reset-password-help" required />
                <button type="button" className="auth-eye" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              <p id="reset-password-help" className="auth-reset-help">Use 8–128 characters with uppercase, lowercase, a number, and a symbol.</p>
              <label htmlFor="reset-confirm">Confirm new password</label>
              <input id="reset-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={8} maxLength={128} required />
            </>}
            <button type="submit" className="auth-submit" disabled={loading || (step === 'email' && cooldown > 0)}>{loading ? 'Please wait…' : step === 'email' ? cooldown > 0 ? `Try again in ${cooldown}s` : 'Send reset code' : 'Reset password'}<ArrowRight size={18} aria-hidden="true" /></button>
            {step === 'reset' && <div className="auth-reset-actions">
              <button type="button" className="auth-text-button" disabled={loading || cooldown > 0} onClick={() => void submit('request')}>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}</button>
              <button type="button" className="auth-text-button" disabled={loading} onClick={() => { setStep('email'); setCode(''); setMessage(''); setError(''); }}>Use another email</button>
            </div>}
          </form>
        )}
        {step !== 'done' && <p className="auth-signup">Remember your password? <Link href="/login">Sign in</Link></p>}
        <p className="auth-legal">Use <Link href="/login">Continue with Google</Link> if you signed up with Google.</p>
      </section>
      <Link href="/" className="auth-back">← Back to Cursis</Link>
    </main>
  );
}
