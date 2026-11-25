import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { findUserByEmail } from '@/lib/db/users';
import { getPaymentRecord, verifyAndRecordPayment } from '@/lib/db/payments';
import { upgradeWorkspacePlan } from '@/lib/plans-server';
import type { PlanKey } from '@/lib/plans';

export const dynamic = 'force-dynamic';

interface VerifyRequestBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  planId?: string;
  workspaceId?: string;
  isDemo?: boolean;
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const body: VerifyRequestBody = await req.json().catch(() => ({}));
    const {
      razorpay_order_id = '',
      razorpay_payment_id = '',
      razorpay_signature = '',
      isDemo = false,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing Razorpay order ID or payment ID.' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isSimulatedOrder = isDemo || razorpay_order_id.startsWith('order_demo_');

    if (!isSimulatedOrder) {
      if (!keySecret) {
        return NextResponse.json({ error: 'Payment gateway secret is not configured.' }, { status: 500 });
      }
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const sigBuf = Buffer.from(razorpay_signature);
      const genBuf = Buffer.from(generatedSignature);
      if (sigBuf.length !== genBuf.length || !crypto.timingSafeEqual(genBuf, sigBuf)) {
        return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 });
      }
    }

    const receiptNumber = `CURSIS-REC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const paidAt = new Date().toISOString();

    const updatedRecord = await verifyAndRecordPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature || 'simulated_test_signature',
      { receiptNumber, paidAt }
    );
    const finalRecord = updatedRecord || (await getPaymentRecord(razorpay_order_id));

    // Upgrade the customer's workspace immediately upon confirmed payment (skip real upgrade for unsigned demo orders unless authenticated)
    let upgradedWorkspaceId: string | undefined;
    const planToApply: PlanKey | undefined =
      finalRecord?.planId === 'starter' || finalRecord?.planId === 'pro'
        ? finalRecord.planId
        : body.planId === 'starter' || body.planId === 'pro'
        ? body.planId
        : undefined;

    if (planToApply && (!isSimulatedOrder || authUser)) {
      let targetWsId = finalRecord?.workspaceId || body.workspaceId || authUser?.workspaceId;
      if (!targetWsId && finalRecord?.customerEmail) {
        const userDoc = await findUserByEmail(finalRecord.customerEmail).catch(() => null);
        targetWsId = userDoc?.activeWorkspaceId || userDoc?.workspaceIds?.[0] || (userDoc?.uid ? `ws_${userDoc.uid}` : undefined);
      }
      if (targetWsId && targetWsId !== 'ws_default' && targetWsId !== 'ws_public') {
        await upgradeWorkspacePlan(targetWsId, planToApply);
        upgradedWorkspaceId = targetWsId;
      }
    }

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      receiptNumber: finalRecord?.receiptNumber || receiptNumber,
      paidAt,
      upgradedWorkspaceId,
      record: finalRecord,
    });
  } catch (error) {
    console.error('[Verify Payment Route Exception]:', error);
    return NextResponse.json({ error: 'Internal error during payment verification.' }, { status: 500 });
  }
}
