import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { createPaymentOrderRecord, type PaymentRecord } from '@/lib/db/payments';
import { PLAN_CATALOG, type PlanKey } from '@/lib/plans';

export const dynamic = 'force-dynamic';

interface CreateOrderRequestBody {
  planId?: string;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  workspaceName?: string;
  workspaceId?: string;
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const body: CreateOrderRequestBody = await req.json().catch(() => ({}));

    const requestedPlan = String(body.planId || '').trim().toLowerCase() as PlanKey;
    if (requestedPlan !== 'starter' && requestedPlan !== 'pro') {
      return NextResponse.json(
        { error: 'Please select either Starter or Pro plan. For Business, please contact us.' },
        { status: 400 }
      );
    }

    const requestedCurrency: 'INR' | 'USD' =
      String(body.currency || 'INR').trim().toUpperCase() === 'USD' ? 'USD' : 'INR';

    const plan = PLAN_CATALOG[requestedPlan];
    const displayAmount = requestedCurrency === 'INR' ? plan.priceInr : plan.priceUsd;
    if (!displayAmount || displayAmount <= 0) {
      return NextResponse.json({ error: 'Selected plan is not available for online checkout.' }, { status: 400 });
    }

    const customerName = String(body.customerName || authUser?.displayName || '').trim();
    const customerEmail = String(body.customerEmail || authUser?.email || '').trim().toLowerCase();
    const customerPhone = String(body.customerPhone || '').trim();
    const workspaceName = String(body.workspaceName || '').trim();
    const rawWsId = String(body.workspaceId || authUser?.workspaceId || '').trim();
    const workspaceId =
      rawWsId && rawWsId !== 'ws_default' && rawWsId !== 'ws_public' ? rawWsId : undefined;

    if (!customerName) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const amountInSmallestUnit = Math.round(displayAmount * 100);
    const receiptNumber = `CURSIS-REC-${Date.now().toString(36).toUpperCase()}`;

    const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

    let orderId = '';
    let isDemo = false;

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
            amount: amountInSmallestUnit,
            currency: requestedCurrency,
            receipt: receiptNumber,
            notes: {
              planId: requestedPlan,
              planName: plan.name,
              currency: requestedCurrency,
              customerEmail,
              customerName,
              workspaceId: workspaceId || '',
              workspaceName,
            },
          }),
        });

        if (!rzpResponse.ok) {
          const rzpErr = await rzpResponse.json().catch(() => ({}));
          console.error('[Razorpay Order Error]:', rzpErr?.error?.description || rzpResponse.status);
          return NextResponse.json(
            { error: rzpErr?.error?.description || 'Failed to create order with Razorpay.' },
            { status: 502 }
          );
        }

        const rzpData = await rzpResponse.json();
        orderId = rzpData.id;
      } catch (err) {
        console.error('[Razorpay Order Network Exception]:', err);
        return NextResponse.json({ error: 'Unable to connect to Razorpay right now. Please try again.' }, { status: 502 });
      }
    } else {
      // Development preview fallback when Razorpay credentials are not yet set
      orderId = `order_demo_${Date.now()}`;
      isDemo = true;
    }

    const paymentRecord: PaymentRecord = {
      id: `pay_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId,
      amount: displayAmount,
      amountInCents: amountInSmallestUnit,
      currency: requestedCurrency,
      status: 'created',
      planId: requestedPlan,
      planName: plan.name,
      workspaceId,
      userId: authUser?.uid,
      customerName,
      customerEmail,
      customerPhone,
      workspaceName,
      receiptNumber,
      isDemo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createPaymentOrderRecord(paymentRecord);

    return NextResponse.json({
      success: true,
      orderId,
      amount: amountInSmallestUnit,
      amountDisplay: displayAmount,
      amountUsd: requestedCurrency === 'USD' ? displayAmount : undefined,
      currency: requestedCurrency,
      keyId: keyId || 'rzp_test_demo',
      isDemo,
      receiptNumber,
      planName: plan.name,
    });
  } catch (error) {
    console.error('[Create Order Route Exception]:', error);
    return NextResponse.json({ error: 'Unable to initialize checkout order.' }, { status: 500 });
  }
}
