import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { parseSubscriptionFromDescription } from '@/lib/paymongo-sync';
import { fulfillSubscriptionFromPayment } from '@/lib/subscription-fulfillment';
import { getExpectedAmountCents, isSubscriptionPlanId } from '@/lib/subscription-plans';

/**
 * PayMongo webhook handler for payment events
 * Handles payment.paid, payment.failed, etc.
 * 
 * Webhook URL: https://www.l9tools.online/api/webhooks/paymongo
 */
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('[PayMongo Webhook] PAYMONGO_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const rawBody = await request.text();
    const signatureHeader = request.headers.get('paymongo-signature') || request.headers.get('x-paymongo-signature');

    if (!signatureHeader) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const signatureParts: Record<string, string> = {};
    signatureHeader.split(',').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        signatureParts[key] = value;
      }
    });

    const timestamp = signatureParts.t;
    const testSignature = signatureParts.te;
    const liveSignature = signatureParts.li;

    if (!timestamp) {
      return NextResponse.json(
        { error: 'Invalid signature format' },
        { status: 400 }
      );
    }

    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const receivedSignature = liveSignature || testSignature;
    
    if (!receivedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature format' },
        { status: 400 }
      );
    }

    const signatureMatches = crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    );

    if (!signatureMatches) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const signatureTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - signatureTime);
    
    if (timeDiff > 300) {
      return NextResponse.json(
        { error: 'Signature expired' },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const { type, data } = event;

    if (type === 'payment.paid') {
      const payment = data;
      const paymentIntentId = payment.relationships?.payment_intent?.data?.id;
      
      if (!paymentIntentId) {
        console.error('[PayMongo Webhook] No payment_intent_id in payment data');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const secretKey = process.env.PAYMONGO_SECRET_KEY;
      if (!secretKey) {
        throw new Error('PAYMONGO_SECRET_KEY not configured');
      }

      const paymentIntentResponse = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!paymentIntentResponse.ok) {
        console.error('[PayMongo Webhook] Failed to fetch payment intent');
        return NextResponse.json({ error: 'Failed to fetch payment intent' }, { status: 502 });
      }

      const paymentIntentData = await paymentIntentResponse.json();
      const paymentIntent = paymentIntentData.data;
      const metadata = paymentIntent.attributes.metadata || {};
      
      const userId = metadata.user_id as string | undefined;
      const parsedDescription = parseSubscriptionFromDescription(paymentIntent.attributes?.description);
      const plan = metadata.plan || parsedDescription?.plan;
      const months = parseInt(metadata.months || String(parsedDescription?.months ?? '1'), 10) || 1;

      if (!plan || !isSubscriptionPlanId(plan)) {
        console.error('[PayMongo Webhook] Invalid or missing plan');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const amountCents =
        payment.attributes?.amount ?? paymentIntent.attributes?.amount ?? 0;

      const expectedAmount = getExpectedAmountCents(plan, months);
      if (expectedAmount != null && amountCents !== expectedAmount) {
        console.error('[PayMongo Webhook] Amount mismatch', { amountCents, expectedAmount, plan, months });
        return NextResponse.json({ received: true, error: 'Amount mismatch' }, { status: 200 });
      }

      if (!userId) {
        console.error('[PayMongo Webhook] No user_id in metadata');
        return NextResponse.json({ received: true, message: 'Payment logged without user_id' }, { status: 200 });
      }

      const supabaseAdmin = getSupabaseAdmin();
      if (!supabaseAdmin || amountCents <= 0) {
        return NextResponse.json({ error: 'Could not process payment' }, { status: 500 });
      }

      const fulfillment = await fulfillSubscriptionFromPayment(supabaseAdmin, {
        userId,
        plan,
        months,
        paymongoPaymentId: payment.id,
        paymongoPaymentIntentId: paymentIntentId,
        amountCents,
        userEmail: metadata.email as string | undefined,
        paidAt:
          payment.attributes?.paid_at != null
            ? new Date(payment.attributes.paid_at * 1000).toISOString()
            : undefined,
      });

      if (!fulfillment.ok) {
        console.error('[PayMongo Webhook] Fulfillment failed:', fulfillment.error);
        return NextResponse.json(
          { error: 'Subscription activation failed', message: fulfillment.error },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        received: true,
        message: fulfillment.alreadyFulfilled ? 'Already fulfilled' : 'Payment processed successfully',
      }, { status: 200 });
    }

    return NextResponse.json({ 
      received: true,
      event_type: type 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[PayMongo Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
