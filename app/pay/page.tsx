'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { BRAND_NAME, SITE_URL, SUPPORT_EMAIL } from '@/lib/site';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface PlanOption {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number; // in INR
  yearlyPrice: number; // in INR (approx 20% discount)
  popular?: boolean;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    id: 'pro',
    name: 'Pro Workspace',
    description: 'Autonomous AI power for high-velocity teams and fast-growing agencies.',
    monthlyPrice: 1499,
    yearlyPrice: 14390,
    popular: true,
    features: [
      'Up to 10 Team Members',
      'Unlimited Projects & Sprints',
      'Ordis AI Engine & Ambient Scanner',
      'Real-time Sprint Kanban & Timeline',
      'Google Meet & Calendar Integration',
      'Activity Alerts & Leader Email Notifications',
    ],
  },
  {
    id: 'business',
    name: 'Business Team',
    description: 'Enterprise workflows, custom modules, and priority SLA execution.',
    monthlyPrice: 4999,
    yearlyPrice: 47990,
    features: [
      'Up to 25 Team Members',
      'Dedicated Custom Client Portals',
      'Full Audit Trail & Webhook Sync',
      'Unlimited Automated Actions & Triggers',
      'Advanced Security & DPDP Compliance',
      'Priority 24/7 Dedicated Support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Suite',
    description: 'Sovereign private cloud, dedicated AI fine-tuning, and bespoke solutions.',
    monthlyPrice: 19999,
    yearlyPrice: 191990,
    features: [
      'Unlimited Workspace Seats',
      'Custom Fine-Tuned AI Agents',
      'Sovereign Data Isolation & VPC Peering',
      'Custom ERP, CRM & QuickBooks Integrations',
      '99.99% Uptime SLA & Dedicated Lead',
      'Custom Legal Billing & Invoice Terms',
    ],
  },
];

function PaymentPageContent() {
  const searchParams = useSearchParams();

  // Selected Plan & Billing Cycle
  const initialPlanParam = searchParams.get('plan') || 'pro';
  const initialAmountParam = Number(searchParams.get('amount')) || 0;
  const initialCycleParam = (searchParams.get('billing') as 'monthly' | 'yearly') || 'monthly';

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    initialAmountParam > 0 ? 'custom' : ['pro', 'business', 'enterprise'].includes(initialPlanParam) ? initialPlanParam : 'pro'
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(initialCycleParam);
  const [customAmount, setCustomAmount] = useState<number>(initialAmountParam > 0 ? initialAmountParam : 2500);
  const [customDescription, setCustomDescription] = useState<string>('Custom Engineering & Workspace Retainer');

  // Customer Details Form
  const [customerName, setCustomerName] = useState<string>(searchParams.get('name') || '');
  const [customerEmail, setCustomerEmail] = useState<string>(searchParams.get('email') || '');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');

  // Processing & Verification States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);

  // Success Confirmation State
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    paymentId: string;
    orderId: string;
    invoiceNumber: string;
    amount: number;
    planName: string;
    customerEmail: string;
    customerName: string;
    paidAt: string;
    isDemo?: boolean;
  } | null>(null);

  // Selected Plan Object
  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId);

  // Calculate Subtotal & Tax
  const basePrice = selectedPlanId === 'custom'
    ? Number(customAmount) || 0
    : billingCycle === 'yearly'
    ? (selectedPlan?.yearlyPrice || 0)
    : (selectedPlan?.monthlyPrice || 0);

  const gstAmount = Math.round(basePrice * 0.18);
  const totalAmount = basePrice + gstAmount;

  // Set script loaded if already in window
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      setIsScriptLoaded(true);
    }
  }, []);

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }
    if (totalAmount <= 0) {
      setErrorMessage('Please specify a valid payment amount.');
      return;
    }

    setIsLoading(true);

    try {
      const planNameDisplay = selectedPlanId === 'custom'
        ? (customDescription || 'Custom Payment')
        : `${selectedPlan?.name} (${billingCycle === 'yearly' ? 'Annual Plan' : 'Monthly Plan'})`;

      // 1. Create order on Cursis Server
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          planId: selectedPlanId,
          planName: planNameDisplay,
          billingCycle: selectedPlanId === 'custom' ? 'custom' : billingCycle,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
          customerPhone: customerPhone.trim(),
          workspaceName: workspaceName.trim(),
          gstin: gstin.trim(),
          notes: {
            workspace: workspaceName.trim() || 'Primary Workspace',
            cursisUrl: SITE_URL,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment gateway.');
      }

      const { orderId, amount: amountInPaise, keyId, isDemo } = orderData;

      // 2. If Razorpay client is available and active
      if (typeof window !== 'undefined' && window.Razorpay && !isDemo) {
        const options = {
          key: keyId,
          amount: amountInPaise,
          currency: 'INR',
          name: BRAND_NAME,
          description: planNameDisplay,
          image: '/icon.png',
          order_id: orderId,
          handler: async function (response: any) {
            await verifyPaymentSignature(response, isDemo);
          },
          prefill: {
            name: customerName.trim(),
            email: customerEmail.trim(),
            contact: customerPhone.trim(),
          },
          notes: {
            planId: selectedPlanId,
            billingCycle,
            workspace: workspaceName.trim(),
          },
          theme: {
            color: '#FF5500', // Cursis Electric Orange
          },
          modal: {
            ondismiss: function () {
              setIsLoading(false);
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', function (response: any) {
          console.error('[Razorpay Payment Failed]', response.error);
          setErrorMessage(response.error?.description || 'Payment was declined or cancelled. Please try again.');
          setIsLoading(false);
        });
        razorpayInstance.open();
      } else {
        // Fallback / Demonstration simulation when Razorpay client keys are in demo test mode
        console.log('[Cursis Payment Demo Mode Activated]');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await verifyPaymentSignature(
          {
            razorpay_order_id: orderId,
            razorpay_payment_id: `pay_demo_${Date.now().toString(36)}`,
            razorpay_signature: 'simulated_test_sig',
          },
          true
        );
      }
    } catch (err: any) {
      console.error('[Payment Flow Error]:', err);
      setErrorMessage(err.message || 'An error occurred while initiating checkout. Please try again.');
      setIsLoading(false);
    }
  };

  const verifyPaymentSignature = async (rzpPayload: any, isDemo = false) => {
    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rzpPayload,
          isDemo,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment signature verification failed.');
      }

      const planNameDisplay = selectedPlanId === 'custom'
        ? (customDescription || 'Custom Payment')
        : `${selectedPlan?.name} (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`;

      setPaymentDetails({
        paymentId: verifyData.paymentId,
        orderId: verifyData.orderId,
        invoiceNumber: verifyData.invoiceNumber,
        amount: totalAmount,
        planName: planNameDisplay,
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        paidAt: verifyData.paidAt || new Date().toISOString(),
        isDemo,
      });

      setPaymentSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error('[Payment Verification Error]:', err);
      setErrorMessage(err.message || 'Payment verification encountered an issue. Please contact support.');
      setIsLoading(false);
    }
  };

  // SUCCESS RECEIPT VIEW
  if (paymentSuccess && paymentDetails) {
    return (
      <div className="pay-container" style={{ maxWidth: '720px', margin: '40px auto', padding: '0 20px' }}>
        <div
          className="card"
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color, #E5E7EB)',
            borderRadius: '16px',
            padding: '36px 32px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          }}
        >
          {/* Success Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                margin: '0 auto 16px',
                border: '2px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ✓
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                padding: '4px 10px',
                borderRadius: '20px',
              }}
            >
              Payment Verified & Active
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '12px 0 6px', color: 'var(--text-primary)' }}>
              Thank You for Upgrading!
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              Your workspace plan is confirmed and provisioned. A formal tax invoice has been sent to{' '}
              <strong>{paymentDetails.customerEmail}</strong>.
            </p>
          </div>

          {/* Receipt Breakdown Box */}
          <div
            style={{
              background: 'var(--surface-secondary, #F9FAFB)',
              border: '1px solid var(--border-color, #E5E7EB)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color, #E5E7EB)',
                paddingBottom: '14px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Invoice Reference
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {paymentDetails.invoiceNumber}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Date & Time
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {new Date(paymentDetails.paidAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Payment ID (Razorpay):</span>
                <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {paymentDetails.paymentId}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Order ID:</span>
                <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {paymentDetails.orderId}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Billed To:</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {paymentDetails.customerName}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Subscribed Tier:</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#FF5500' }}>
                  {paymentDetails.planName}
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-color, #E5E7EB)',
                paddingTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Total Paid (incl. 18% GST):
              </span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#FF5500', letterSpacing: '-0.02em' }}>
                ₹{paymentDetails.amount.toLocaleString('en-IN')}
              </span>
            </div>

            {paymentDetails.isDemo && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  fontSize: '12px',
                  color: '#92400E',
                }}
              >
                ⚠️ <strong>Demonstration Mode:</strong> Payment simulated successfully for testing. In production, real UPI/Cards/Netbanking transactions verify against active Razorpay credentials.
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Tax Invoice
            </button>
            <Link
              href="/dashboard"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontWeight: 700 }}
            >
              Open Workspace Dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // MAIN PAYMENT CHECKOUT VIEW
  return (
    <>
      {/* Razorpay Client Checkout Script */}
      <Script
        id="razorpay-checkout-script"
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setIsScriptLoaded(true)}
        onError={() => console.warn('[Razorpay Script Error] Using native fallback mode')}
      />

      <div style={{ minHeight: '100vh', background: 'var(--c-bg, #FAF6EE)', padding: '32px 16px 80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-color, #E5E7EB)',
            }}
          >
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#0A0A0A',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '14px',
                }}
              >
                C
              </span>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0A0A0A' }}>
                {BRAND_NAME}
              </span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#059669',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                🔒 Razorpay 256-bit Encrypted
              </span>
              <Link href="/dashboard" className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
                Workspace
              </Link>
            </div>
          </div>

          {/* Page Headline */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary, #0A0A0A)',
                margin: '0 0 8px',
              }}
            >
              Upgrade Your Workspace
            </h1>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-secondary, #4B5563)',
                maxWidth: '580px',
                margin: '0 auto',
                lineHeight: 1.5,
              }}
            >
              Deploy full autonomous AI execution, unlock unlimited team collaboration, and scale your operations with zero friction.
            </p>

            {/* Billing Toggle (Monthly / Yearly) */}
            {selectedPlanId !== 'custom' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  padding: '4px',
                  borderRadius: '30px',
                  border: '1px solid var(--border-color, #E5E7EB)',
                  marginTop: '20px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '24px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: billingCycle === 'monthly' ? 700 : 500,
                    background: billingCycle === 'monthly' ? '#FF5500' : 'transparent',
                    color: billingCycle === 'monthly' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '24px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: billingCycle === 'yearly' ? 700 : 500,
                    background: billingCycle === 'yearly' ? '#FF5500' : 'transparent',
                    color: billingCycle === 'yearly' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>Annual Billing</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      background: billingCycle === 'yearly' ? '#FFFFFF' : '#10B981',
                      color: billingCycle === 'yearly' ? '#FF5500' : '#FFFFFF',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Save 20%
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Plan Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '36px',
            }}
          >
            {PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const displayPrice = billingCycle === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className="card"
                  style={{
                    background: '#FFFFFF',
                    border: isSelected ? '2px solid #FF5500' : '1px solid var(--border-color, #E5E7EB)',
                    borderRadius: '14px',
                    padding: '24px 20px',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: isSelected
                      ? '0 8px 20px -4px rgba(255, 85, 0, 0.15)'
                      : '0 1px 3px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {plan.popular && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '16px',
                        background: '#FF5500',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Most Popular
                    </span>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {plan.name}
                    </h3>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: isSelected ? '5px solid #FF5500' : '2px solid #D1D5DB',
                        background: '#FFFFFF',
                      }}
                    />
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', minHeight: '36px', margin: '0 0 16px', lineHeight: 1.4 }}>
                    {plan.description}
                  </p>

                  <div style={{ marginBottom: '18px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      ₹{displayPrice.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                      / month
                    </span>
                    {billingCycle === 'yearly' && (
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                        Billed annually (₹{plan.yearlyPrice.toLocaleString('en-IN')} / year)
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color, #E5E7EB)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                      Included Features:
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {plan.features.map((feat, idx) => (
                        <li key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#FF5500', fontWeight: 800 }}>✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}

            {/* Custom Retainer / Specific Amount Option */}
            <div
              onClick={() => setSelectedPlanId('custom')}
              className="card"
              style={{
                background: '#FFFFFF',
                border: selectedPlanId === 'custom' ? '2px solid #FF5500' : '1px solid var(--border-color, #E5E7EB)',
                borderRadius: '14px',
                padding: '24px 20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: selectedPlanId === 'custom' ? '0 8px 20px -4px rgba(255, 85, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Custom Retainer
                  </h3>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: selectedPlanId === 'custom' ? '5px solid #FF5500' : '2px solid #D1D5DB',
                      background: '#FFFFFF',
                    }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.4 }}>
                  Pay a designated invoice amount, agency engineering retainer, or custom migration engagement.
                </p>

                {selectedPlanId === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                        Amount in INR (₹) *
                      </label>
                      <input
                        type="number"
                        min="100"
                        className="input"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(Math.max(100, Number(e.target.value)))}
                        style={{ height: '36px', fontSize: '14px', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                        Description / Purpose
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Enterprise Onboarding Retainer"
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        style={{ height: '36px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedPlanId !== 'custom' && (
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#FF5500', marginTop: '16px' }}>
                  Specify custom invoice amount →
                </div>
              )}
            </div>
          </div>

          {/* Checkout & Customer Details Form */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* Left: Customer Info Form */}
            <div
              className="card"
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color, #E5E7EB)',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                Billing & Customer Details
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                We'll issue your official tax invoice and unlock your workspace immediately.
              </p>

              {errorMessage && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleInitiatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                    Full Name <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Mukul Kumar"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                    Work Email <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="input"
                    placeholder="name@company.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                      Mobile / WhatsApp
                    </label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Acme Studio"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                    GSTIN / Corporate Tax ID <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(Optional for B2B input credit)</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  />
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '15px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                        <span>Connecting to Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay ₹{totalAmount.toLocaleString('en-IN')} via Razorpay</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security Indicators */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  marginTop: '18px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color, #E5E7EB)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>💳</span>
                  <span>UPI, Cards, NetBanking, Wallets</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>🛡️</span>
                  <span>PCI-DSS Level 1 Compliant</span>
                </div>
              </div>
            </div>

            {/* Right: Order Summary Breakdown */}
            <div
              className="card"
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color, #E5E7EB)',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {selectedPlanId === 'custom'
                      ? (customDescription || 'Custom Service')
                      : `${selectedPlan?.name} (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    ₹{basePrice.toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Goods & Services Tax (18% GST)
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    ₹{gstAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {billingCycle === 'yearly' && selectedPlanId !== 'custom' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#059669' }}>
                    <span>Annual discount applied</span>
                    <span>-20% SAVED</span>
                  </div>
                )}

                <div
                  style={{
                    borderTop: '2px dashed var(--border-color, #E5E7EB)',
                    paddingTop: '16px',
                    marginTop: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Total Amount
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      Inclusive of all taxes
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#FF5500', letterSpacing: '-0.02em' }}>
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guarantees Box */}
              <div
                style={{
                  background: 'var(--surface-secondary, #F9FAFB)',
                  border: '1px solid var(--border-color, #E5E7EB)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginTop: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>⚡</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Instant Workspace Activation
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Your features and seats are provisioned the moment payment clears.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>🤝</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      7-Day Money Back Guarantee
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      If Cursis doesn't streamline your agency operations, get a full refund with no questions asked.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>💬</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Need help or custom invoice?
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Reach our team at{' '}
                      <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#FF5500', textDecoration: 'none', fontWeight: 600 }}>
                        {SUPPORT_EMAIL}
                      </a>
                    </div>
                  </div>
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
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Loading Cursis Secure Checkout...</div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
