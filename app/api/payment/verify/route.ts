import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { verifyAndRecordPayment, getPaymentRecord } from '@/lib/db/payments';

export const dynamic = 'force-dynamic';

interface VerifyRequestBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  isDemo?: boolean;
}

export async function POST(req: Request) {
  try {
    const body: VerifyRequestBody = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature = '', isDemo = false } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing Razorpay order ID or payment ID' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify signature if live credentials exist and not in demo mode
    if (!isDemo && razorpay_order_id.startsWith('order_') && !razorpay_order_id.startsWith('order_demo_')) {
      if (!keySecret) {
        console.error('[Payment Verify] Missing RAZORPAY_KEY_SECRET in environment');
        return NextResponse.json({ error: 'Server payment configuration secret is missing' }, { status: 500 });
      }

      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(razorpay_signature)
      );

      if (!isSignatureValid) {
        console.error('[Payment Verify] Signature verification mismatch');
        return NextResponse.json({ error: 'Invalid payment signature verification failed' }, { status: 400 });
      }
    }

    // Generate compliant tax invoice number
    const invoiceNumber = `CURSIS-INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const paidAt = new Date().toISOString();

    // Update payment record in database
    const updatedRecord = await verifyAndRecordPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature || 'simulated_signature_ok',
      { invoiceNumber, paidAt }
    );

    // Retrieve full record if updated
    const finalRecord = updatedRecord || (await getPaymentRecord(razorpay_order_id));

    return NextResponse.json({
      success: true,
      message: 'Payment verified and recorded successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      invoiceNumber,
      paidAt,
      record: finalRecord,
    });
  } catch (error: any) {
    console.error('[Verify Payment Route Exception]:', error);
    return NextResponse.json({ error: error.message || 'Internal error during payment verification' }, { status: 500 });
  }
}
