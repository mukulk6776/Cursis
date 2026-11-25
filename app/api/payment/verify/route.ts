import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { findUserByEmail } from '@/lib/db/users';
import { getPaymentRecord, verifyAndRecordPayment } from '@/lib/db/payments';
import { syncUserOwnedWorkspacesPlan, upgradeWorkspacePlan } from '@/lib/plans-server';
import { PLAN_CATALOG, type PlanKey } from '@/lib/plans';
import { getCollection } from '@/lib/mongodb';
import { inMemoryStore } from '@/lib/db/store';
import type { UserPlanSubscription, UserProfile } from '@/lib/db/types';
import { eventBus } from '@/lib/realtime/event-bus';

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
      const customerEmail = (authUser?.email || finalRecord?.customerEmail || '').trim().toLowerCase();
      const targetUserDoc = customerEmail ? await findUserByEmail(customerEmail).catch(() => null) : null;
      const targetUserId = authUser?.uid || finalRecord?.userId || targetUserDoc?.uid;

      if (!targetWsId && targetUserDoc) {
        targetWsId = targetUserDoc.activeWorkspaceId || targetUserDoc.workspaceIds?.[0] || (targetUserDoc.uid ? `ws_${targetUserDoc.uid}` : undefined);
      }

      const subscription: UserPlanSubscription = {
        plan: planToApply === 'starter' ? 'starter' : 'pro',
        planName: PLAN_CATALOG[planToApply].name,
        status: 'active',
        source: 'purchased',
        startedAt: paidAt,
        expiresAt: null,
        assignedBy: 'razorpay',
        paymentId: razorpay_payment_id,
        updatedAt: new Date().toISOString(),
      };

      if (targetUserId || customerEmail) {
        try {
          const usersCol = await getCollection<UserProfile>('users');
          if (usersCol) {
            await usersCol.updateOne(
              targetUserId ? { $or: [{ uid: targetUserId }, { id: targetUserId }, ...(customerEmail ? [{ email: customerEmail }] : [])] } : { email: customerEmail },
              { $set: { subscription, updatedAt: subscription.updatedAt } }
            );
          }
          if (targetUserId && inMemoryStore.users.has(targetUserId)) {
            const memUser = inMemoryStore.users.get(targetUserId)!;
            memUser.subscription = subscription;
            inMemoryStore.users.set(targetUserId, memUser);
          }
        } catch (err) {
          console.warn('[Verify Payment] Failed to persist user subscription:', err);
        }
      }

      if (targetUserId) {
        const syncedWsIds = await syncUserOwnedWorkspacesPlan(targetUserId, planToApply, {
          source: 'purchased',
          startedAt: paidAt,
          expiresAt: null,
        });
        syncedWsIds.forEach((wsId) => eventBus.emit('workspace.updated', wsId, { userId: targetUserId, reason: 'plan_purchased', plan: planToApply }));
      }

      if (targetWsId && targetWsId !== 'ws_default' && targetWsId !== 'ws_public') {
        await upgradeWorkspacePlan(targetWsId, planToApply, {
          source: 'purchased',
          startedAt: paidAt,
          expiresAt: null,
        });
        eventBus.emit('workspace.updated', targetWsId, { userId: targetUserId, reason: 'plan_purchased', plan: planToApply });
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
