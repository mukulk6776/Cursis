import { getDb } from '@/lib/mongodb';
import type { PlanKey } from '@/lib/plans';

export interface PaymentRecord {
  id: string;
  orderId: string;
  paymentId?: string;
  amount: number; // in order currency (INR or USD)
  amountInCents: number; // smallest currency unit (paise for INR, cents for USD)
  currency: 'INR' | 'USD';
  status: 'created' | 'paid' | 'failed';
  planId: PlanKey;
  planName: string;
  workspaceId?: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  workspaceName?: string;
  receiptNumber: string;
  signature?: string;
  isDemo?: boolean;
  notes?: Record<string, string>;
  createdAt: string;
  paidAt?: string;
  updatedAt: string;
}

const COLLECTION_NAME = 'payments';

/**
 * Persists an initiated payment order record.
 */
export async function createPaymentOrderRecord(record: PaymentRecord): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return true;
    await db.collection(COLLECTION_NAME).updateOne(
      { orderId: record.orderId },
      { $set: record },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error('[Payments] Failed to record order creation:', error);
    return false;
  }
}

/**
 * Updates a payment order upon successful Razorpay signature verification.
 */
export async function verifyAndRecordPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  extra?: { receiptNumber?: string; paidAt?: string }
): Promise<PaymentRecord | null> {
  const paidAt = extra?.paidAt || new Date().toISOString();
  const receiptNumber = extra?.receiptNumber || `CURSIS-REC-${Date.now().toString(36).toUpperCase()}`;

  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db.collection<PaymentRecord>(COLLECTION_NAME).findOneAndUpdate(
      { orderId },
      {
        $set: {
          paymentId,
          signature,
          status: 'paid',
          receiptNumber,
          paidAt,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: 'after' }
    );

    return result || null;
  } catch (error) {
    console.error('[Payments] Failed to update payment status:', error);
    return null;
  }
}

/**
 * Retrieves payment record by orderId, paymentId, or internal id.
 */
export async function getPaymentRecord(identifier: string): Promise<PaymentRecord | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const record = await db.collection<PaymentRecord>(COLLECTION_NAME).findOne({
      $or: [{ orderId: identifier }, { paymentId: identifier }, { id: identifier }],
    });

    return record || null;
  } catch (error) {
    console.error('[Payments] Failed to fetch payment record:', error);
    return null;
  }
}
