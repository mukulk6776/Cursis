'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { BRAND_NAME, SUPPORT_EMAIL } from '@/lib/site';
import { PLAN_CATALOG, type PlanKey } from '@/lib/plans';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function PaymentCheckoutContent() {
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan')?.toLowerCase();
  const initialCurrency = searchParams.get('currency')?.toUpperCase() === 'USD' ? 'USD' : 'INR';

  const [selectedPlanId, setSelectedPlanId] = useState<'starter' | 'pro'>(
    initialPlan === 'starter' ? 'starter' : 'pro'
  );
  const [billingCurrency, setBillingCurrency] = useState<'INR' | 'USD'>(initialCurrency);
  const [customerName, setCustomerName] = useState(searchParams.get('name') || '');
  const [customerEmail, setCustomerEmail] = useState(searchParams.get('email') || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    paymentId: string;
    orderId: string;
    receiptNumber: string;
    amountDisplay: number;
    currency: 'INR' | 'USD';
    planName: string;
    customerEmail: string;
    customerName: string;
    paidAt: string;
    isDemo?: boolean;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      setIsScriptLoaded(true);
    }
    // Prefill authenticated user info if already signed in
    fetch('/api/auth/session', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const u = data?.data?.user || data?.user;
        if (u) {
          setCustomerName((prev) => prev || u.displayName || u.name || '');
          setCustomerEmail((prev) => prev || u.email || '');
          if (u.workspaceId && u.workspaceId !== 'ws_default' && u.workspaceId !== 'ws_public') {
            setWorkspaceId(u.workspaceId);
          }
        }
      })
      .catch(() => {});
  }, []);

  const starter = PLAN_CATALOG.starter;
  const pro = PLAN_CATALOG.pro;
  const business = PLAN_CATALOG.business;
  const activePlan = selectedPlanId === 'starter' ? starter : pro;
  const isInr = billingCurrency === 'INR';
  const currencySymbol = isInr ? '₹' : '$';
  const planPrice = (p: typeof starter) => (isInr ? (p.priceInr || 749) : (p.priceUsd || 9));
  const planOriginalPrice = (p: typeof starter) =>
    isInr ? (p.originalPriceInr || planPrice(p)) : (p.originalPriceUsd || planPrice(p));
  const totalAmount = planPrice(activePlan);
  const originalAmount = planOriginalPrice(activePlan);
  const savingsAmount = Math.max(0, originalAmount - totalAmount);
  const formatMoney = (value: number, cur: 'INR' | 'USD' = billingCurrency) =>
    `${cur === 'INR' ? '₹' : '$'}${value.toLocaleString(cur === 'INR' ? 'en-IN' : 'en-US')}`;

  const verifyPaymentSignature = async (
    rzpPayload: any,
    planId: PlanKey,
    isDemo = false,
    paidCurrency: 'INR' | 'USD' = billingCurrency,
    paidAmount: number = totalAmount
  ) => {
    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...rzpPayload,
          planId,
          workspaceId: workspaceId || undefined,
          isDemo,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed.');
      }

      setPaymentDetails({
        paymentId: verifyData.paymentId,
        orderId: verifyData.orderId,
        receiptNumber: verifyData.receiptNumber,
        amountDisplay: paidAmount,
        currency: paidCurrency,
        planName: activePlan.name,
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        paidAt: verifyData.paidAt || new Date().toISOString(),
        isDemo: typeof verifyData.isDemo === 'boolean' ? verifyData.isDemo : isDemo,
      });
      setPaymentSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment verification encountered an issue. Please contact support.');
      setIsLoading(false);
    }
  };

  const ensureRazorpayScript = async (): Promise<any> => {
    if (typeof window === 'undefined') return null;
    if (window.Razorpay) {
      setIsScriptLoaded(true);
      return window.Razorpay;
    }

    return new Promise((resolve) => {
      const finish = () => {
        if (window.Razorpay) {
          setIsScriptLoaded(true);
          resolve(window.Razorpay);
        } else {
          resolve(null);
        }
      };

      const existing = document.getElementById('razorpay-checkout-script') as HTMLScriptElement | null;
      if (existing) {
        const timer = window.setTimeout(finish, 8000);
        existing.addEventListener('load', () => {
          window.clearTimeout(timer);
          finish();
        }, { once: true });
        existing.addEventListener('error', () => {
          window.clearTimeout(timer);
          resolve(null);
        }, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      const timer = window.setTimeout(finish, 8000);
      script.onload = () => {
        window.clearTimeout(timer);
        finish();
      };
      script.onerror = () => {
        window.clearTimeout(timer);
        resolve(null);
      };
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planId: selectedPlanId,
          currency: billingCurrency,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
          customerPhone: customerPhone.trim(),
          workspaceName: workspaceName.trim(),
          workspaceId: workspaceId || undefined,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize Razorpay checkout.');
      }

      const { orderId, amount, amountDisplay, currency, keyId, isDemo } = orderData;
      const resolvedCurrency: 'INR' | 'USD' = currency === 'USD' ? 'USD' : 'INR';
      const resolvedAmount = Number(amountDisplay || totalAmount);

      if (!isDemo) {
        const RazorpayCtor = (isScriptLoaded && typeof window !== 'undefined' && window.Razorpay)
          ? window.Razorpay
          : await ensureRazorpayScript();

        if (!RazorpayCtor) {
          setErrorMessage(
            'Unable to load Razorpay Checkout. Please disable any script or ad blocker and try again.'
          );
          setIsLoading(false);
          return;
        }

        const prefill: Record<string, string> = {
          name: customerName.trim(),
          email: customerEmail.trim(),
        };
        if (customerPhone.trim()) {
          prefill.contact = customerPhone.trim();
        }

        const options = {
          key: keyId,
          amount,
          currency: resolvedCurrency,
          name: BRAND_NAME,
          description: `${activePlan.name} — ${formatMoney(resolvedAmount, resolvedCurrency)} ${resolvedCurrency}/month`,
          image: '/icon.png',
          order_id: orderId,
          handler: async function (response: any) {
            await verifyPaymentSignature(response, selectedPlanId, false, resolvedCurrency, resolvedAmount);
          },
          prefill,
          notes: {
            planId: selectedPlanId,
            currency: resolvedCurrency,
            workspaceId: workspaceId || '',
            workspaceName: workspaceName.trim(),
          },
          theme: {
            color: '#FF5500',
          },
          modal: {
            ondismiss: function () {
              setIsLoading(false);
            },
          },
        };

        const razorpay = new RazorpayCtor(options);
        razorpay.on('payment.failed', function (response: any) {
          setErrorMessage(response?.error?.description || 'Payment failed or was cancelled. Please try again.');
          setIsLoading(false);
        });
        razorpay.open();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        await verifyPaymentSignature(
          {
            razorpay_order_id: orderId,
            razorpay_payment_id: `pay_demo_${Date.now().toString(36)}`,
            razorpay_signature: 'simulated_test_sig',
          },
          selectedPlanId,
          true,
          resolvedCurrency,
          resolvedAmount
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  if (paymentSuccess && paymentDetails) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--c-bg, #FAF6EE)', padding: '48px 16px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div
            className="card"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-color, #E5E7EB)',
              borderRadius: '16px',
              padding: '36px 28px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '26px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  margin: '0 auto 14px',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                ✓
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  padding: '4px 10px',
                  borderRadius: '20px',
                }}
              >
                Payment Confirmed
              </span>
              <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '12px 0 6px', color: 'var(--text-primary)' }}>
                Welcome to {paymentDetails.planName}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Your workspace plan has been activated for <strong>{paymentDetails.customerEmail}</strong>.
              </p>
            </div>

            <div
              style={{
                background: 'var(--surface-secondary, #F9FAFB)',
                border: '1px solid var(--border-color, #E5E7EB)',
                borderRadius: '12px',
                padding: '22px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingBottom: '12px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Receipt Reference</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}>{paymentDetails.receiptNumber}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Date</div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{new Date(paymentDetails.paidAt).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Razorpay Payment ID:</span>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{paymentDetails.paymentId}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Order ID:</span>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{paymentDetails.orderId}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                  <div style={{ fontWeight: 600 }}>{paymentDetails.customerName}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Plan:</span>
                  <div style={{ fontWeight: 700, color: '#FF5500' }}>{paymentDetails.planName}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '15px', fontWeight: 700 }}>Total Paid:</span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#FF5500' }}>
                  {formatMoney(paymentDetails.amountDisplay, paymentDetails.currency)} {paymentDetails.currency}
                </span>
              </div>

              {paymentDetails.isDemo && (
                <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '6px', background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: '12px', color: '#92400E' }}>
                  <strong>Preview Mode:</strong> Live Razorpay keys are not configured in this environment, so this transaction was simulated for preview testing.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => window.print()} style={{ fontWeight: 600 }}>
                Print Receipt
              </button>
              <Link href="/dashboard" className="btn btn-primary" style={{ fontWeight: 700 }}>
                Open Workspace Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        id="razorpay-checkout-script"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setIsScriptLoaded(true)}
        onReady={() => setIsScriptLoaded(true)}
      />

      <div style={{ minHeight: '100vh', background: 'var(--c-bg, #FAF6EE)', padding: '28px 16px 72px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          {/* Top Brand Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color, #E5E7EB)', flexWrap: 'wrap', gap: '12px' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0A0A0A', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px' }}>
                C
              </span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0A0A0A' }}>{BRAND_NAME}</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                Razorpay Encrypted Checkout
              </span>
              <Link href="/pricing" className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
                All Plans
              </Link>
              <Link href="/dashboard" className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
                Dashboard
              </Link>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 8px' }}>
              Choose Your {BRAND_NAME} Plan
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              {isInr
                ? 'Pay via UPI, Wallets, NetBanking, or Cards in INR. Instant digital activation.'
                : 'Pay via International Cards in USD. Switch to INR for UPI, Wallets, and NetBanking.'}
            </p>
            <div
              role="group"
              aria-label="Checkout currency"
              style={{
                display: 'inline-flex',
                padding: '4px',
                borderRadius: '10px',
                background: '#EFECE4',
                border: '1px solid var(--border-color, #E5E7EB)',
                gap: '4px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => setBillingCurrency('INR')}
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: isInr ? '#FF5500' : 'transparent',
                  color: isInr ? '#FFFFFF' : '#44403C',
                }}
              >
                ₹ INR (UPI · Wallets · NetBanking · Cards)
              </button>
              <button
                type="button"
                onClick={() => setBillingCurrency('USD')}
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: !isInr ? '#FF5500' : 'transparent',
                  color: !isInr ? '#FFFFFF' : '#44403C',
                }}
              >
                $ USD (International Cards)
              </button>
            </div>
          </div>

          {/* 3-Plan Selection Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {/* Starter Plan */}
            <div
              onClick={() => setSelectedPlanId('starter')}
              className="card"
              style={{
                background: '#FFFFFF',
                border: selectedPlanId === 'starter' ? '2px solid #FF5500' : '1px solid var(--border-color, #E5E7EB)',
                borderRadius: '14px',
                padding: '24px 20px',
                cursor: 'pointer',
                boxShadow: selectedPlanId === 'starter' ? '0 8px 20px -4px rgba(255, 85, 0, 0.14)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{starter.name}</h2>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: selectedPlanId === 'starter' ? '5px solid #FF5500' : '2px solid #D1D5DB', background: '#FFFFFF' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px' }}>{starter.subtitle}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '36px', lineHeight: 1, color: 'var(--text-tertiary)', textDecoration: 'line-through', fontWeight: 800 }}>
                  {formatMoney(planOriginalPrice(starter))}
                </span>
                <span style={{ fontSize: '24px', lineHeight: 1, fontWeight: 900 }}>{formatMoney(planPrice(starter))}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{billingCurrency} / mo</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                <li>✓ <strong>6 team members</strong></li>
                <li>✓ <strong>5 tasks per project</strong></li>
                <li>✓ <strong>10 projects</strong></li>
                <li style={{ color: 'var(--text-tertiary)' }}>✕ No Ordis AI access</li>
                <li style={{ color: 'var(--text-tertiary)' }}>✕ No My Day feature</li>
                <li>✓ All other workspace features</li>
              </ul>
            </div>

            {/* Pro Plan (RECOMMENDED) */}
            <div
              onClick={() => setSelectedPlanId('pro')}
              className="card"
              style={{
                background: '#FFFFFF',
                border: selectedPlanId === 'pro' ? '2px solid #FF5500' : '1px solid var(--border-color, #E5E7EB)',
                borderRadius: '14px',
                padding: '24px 20px',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: selectedPlanId === 'pro' ? '0 8px 20px -4px rgba(255, 85, 0, 0.18)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <span style={{ position: 'absolute', top: '-10px', right: '16px', background: '#FF5500', color: '#FFFFFF', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recommended
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{pro.name}</h2>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: selectedPlanId === 'pro' ? '5px solid #FF5500' : '2px solid #D1D5DB', background: '#FFFFFF' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px' }}>{pro.subtitle}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '36px', lineHeight: 1, color: 'var(--text-tertiary)', textDecoration: 'line-through', fontWeight: 800 }}>
                  {formatMoney(planOriginalPrice(pro))}
                </span>
                <span style={{ fontSize: '24px', lineHeight: 1, fontWeight: 900, color: '#FF5500' }}>{formatMoney(planPrice(pro))}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{billingCurrency} / mo</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                <li>✓ <strong>10 team members</strong></li>
                <li>✓ <strong>Unlimited tasks</strong></li>
                <li>✓ <strong>Unlimited projects</strong></li>
                <li>✓ <strong>Full access to Ordis AI</strong></li>
                <li>✓ <strong>Full access to My Day feature</strong> &amp; rest</li>
              </ul>
            </div>

            {/* Business Plan */}
            <div
              className="card"
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color, #E5E7EB)',
                borderRadius: '14px',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px' }}>{business.name}</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>{business.subtitle}</p>
                <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>Custom Solutions</div>
                <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 8px' }}>Everything in Pro, plus:</p>
                <ul style={{ paddingLeft: '16px', margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {business.features.map((feat) => (
                    <li key={feat}>{feat}</li>
                  ))}
                </ul>
              </div>
              <Link href="/contact?plan=business" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', fontWeight: 700, textDecoration: 'none' }}>
                Contact Us →
              </Link>
            </div>
          </div>

          {/* Checkout Details + Order Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
            <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--border-color, #E5E7EB)', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 4px' }}>Billing Details</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 18px' }}>
                Enter the account email for the workspace you are upgrading.
              </p>

              {errorMessage && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="input-group">
                  <label className="input-label">Full Name *</label>
                  <input type="text" className="input" placeholder="Your full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                </div>

                <div className="input-group">
                  <label className="input-label">Account Email *</label>
                  <input type="email" className="input" placeholder="you@company.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Phone (Optional)</label>
                    <input type="tel" className="input" placeholder="+91 / +1 ..." value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Workspace Name</label>
                    <input type="text" className="input" placeholder="e.g. Core Team" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
                  </div>
                </div>

                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  By completing payment, you agree to our{' '}
                  <Link href="/terms" style={{ color: '#FF5500', textDecoration: 'underline', fontWeight: 600 }}>Terms of Service</Link>,{' '}
                  <Link href="/privacy" style={{ color: '#FF5500', textDecoration: 'underline', fontWeight: 600 }}>Privacy Notice</Link>,{' '}
                  <Link href="/refund-policy" style={{ color: '#FF5500', textDecoration: 'underline', fontWeight: 600 }}>Cancellation &amp; Refund Policy</Link>, and{' '}
                  <Link href="/shipping-policy" style={{ color: '#FF5500', textDecoration: 'underline', fontWeight: 600 }}>Digital Delivery Policy</Link>.
                </p>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700, borderRadius: '8px', marginTop: '4px' }}
                >
                  {isLoading
                    ? 'Opening Razorpay Checkout...'
                    : `Pay ${formatMoney(totalAmount)} ${billingCurrency} via Razorpay →`}
                </button>
              </form>
            </div>

            <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--border-color, #E5E7EB)', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px' }}>Order Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{activePlan.name} (Monthly)</span>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)' }}>
                    {formatMoney(originalAmount)} {billingCurrency}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                  <span>Launch Offer Discount</span>
                  <span>-{currencySymbol}{savingsAmount.toLocaleString(isInr ? 'en-IN' : 'en-US')} {billingCurrency}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 800, fontSize: '15px' }}>Total Due Today</span>
                  <span style={{ fontWeight: 900, fontSize: '26px', color: '#FF5500' }}>
                    {formatMoney(totalAmount)} {billingCurrency}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', background: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.5 }}>
                <div><strong>Instant Digital Activation:</strong> Features unlock on your workspace right after payment verification.</div>
                <div>
                  <strong>Simple Refunds:</strong> Need a refund? Just email{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#FF5500', fontWeight: 600 }}>{SUPPORT_EMAIL}</a> or{' '}
                  <a href="mailto:official@cursis.in" style={{ color: '#FF5500', fontWeight: 600 }}>official@cursis.in</a> and we&apos;ll process it via Razorpay.
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  Operated by Saransh Vashistha and Mukul Kumar, operating as {BRAND_NAME}.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Loading Cursis Checkout...</div>}>
      <PaymentCheckoutContent />
    </Suspense>
  );
}
