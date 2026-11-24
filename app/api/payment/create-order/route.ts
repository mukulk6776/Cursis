import { NextResponse } from 'next/server';
import { createPaymentOrderRecord, PaymentRecord } from '@/lib/db/payments';

export const dynamic = 'force-dynamic';

interface CreateOrderRequestBody {
  amount: number; // in INR
  planId: string;
  planName: string;
  billingCycle?: 'monthly' | 'yearly' | 'custom';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  workspaceName?: string;
  gstin?: string;
  notes?: Record<string, string>;
}

export async function POST(req: Request) {
  try {
    const body: CreateOrderRequestBody = await req.json();

    const {
      amount,
      planId = 'pro',
      planName = 'CURSIS Pro Workspace',
      billingCycle = 'monthly',
      customerName,
      customerEmail,
      customerPhone = '',
      workspaceName = '',
      gstin = '',
      notes = {},
    } = body;

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount in INR is required' }, { status: 400 });
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid customer email is required' }, { status: 400 });
    }
    if (!customerName || customerName.trim().length === 0) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const amountInPaise = Math.round(amount * 100);
    const receiptNumber = `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let orderId = '';
    let isDemo = false;

    // Check if live/test Razorpay API credentials are provided
    if (keyId && keySecret && !keyId.includes('your_razorpay') && !keySecret.includes('your_razorpay')) {
      try {
        const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: receiptNumber,
            notes: {
              planId,
              planName,
              customerEmail: customerEmail.trim().toLowerCase(),
              customerName: customerName.trim(),
              workspaceName: workspaceName.trim(),
              billingCycle,
              ...notes,
            },
          }),
        });

        if (!rzpResponse.ok) {
          const rzpErr = await rzpResponse.json().catch(() => ({}));
          console.error('[Razorpay API Error]:', rzpErr);
          throw new Error(rzpErr.error?.description || 'Failed to initialize order with Razorpay');
        }

        const rzpData = await rzpResponse.json();
        orderId = rzpData.id;
      } catch (err: any) {
        console.warn('[Razorpay API Fallback to Test Order]:', err.message);
        // Fallback to simulated order if network or credentials mismatch in dev
        orderId = `order_demo_${Date.now()}`;
        isDemo = true;
      }
    } else {
      // Demo / simulation order when environment keys are pending
      orderId = `order_demo_${Date.now()}`;
      isDemo = true;
    }

    // Persist to MongoDB payments record
    const paymentRecord: PaymentRecord = {
      id: `pay_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId,
      amount,
      amountInPaise,
      currency: 'INR',
      status: 'created',
      planId,
      planName,
      billingCycle,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      workspaceName: workspaceName.trim(),
      gstin: gstin.trim(),
      receiptNumber,
      isDemo,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createPaymentOrderRecord(paymentRecord);

    return NextResponse.json({
      success: true,
      orderId,
      amount: amountInPaise,
      amountInRupees: amount,
      currency: 'INR',
      keyId: keyId || 'rzp_test_demo',
      isDemo,
      receiptNumber,
    });
  } catch (error: any) {
    console.error('[Create Order Route Exception]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error while creating order' }, { status: 500 });
  }
}
