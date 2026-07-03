import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { parseSubscriptionFromDescription } from '@/lib/paymongo-sync';
import { fulfillSubscriptionFromPayment } from '@/lib/subscription-fulfillment';
import { getExpectedAmountCents, isSubscriptionPlanId } from '@/lib/subscription-plans';

/**
 * Verify and manually activate subscription for a payment intent
 * POST /api/payments/verify-payment
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { payment_intent_id, paymentIntentId } = body;
    const intentId = payment_intent_id || paymentIntentId;

    if (!intentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      throw new Error('PAYMONGO_SECRET_KEY not configured');
    }

    const paymentIntentResponse = await fetch(`https://api.paymongo.com/v1/payment_intents/${intentId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paymentIntentResponse.ok) {
      const error = await paymentIntentResponse.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to fetch payment intent');
    }

    const paymentIntentData = await paymentIntentResponse.json();
    const paymentIntent = paymentIntentData.data;
    const metadata = paymentIntent.attributes.metadata || {};

    const userId = metadata.user_id;
    const parsedDescription = parseSubscriptionFromDescription(paymentIntent.attributes?.description);
    const plan = metadata.plan || parsedDescription?.plan;
    const months = parseInt(metadata.months || String(parsedDescription?.months ?? '1'), 10) || 1;

    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Payment intent does not belong to current user' },
        { status: 403 }
      );
    }

    if (!plan || !isSubscriptionPlanId(plan)) {
      return NextResponse.json(
        { error: 'Invalid subscription plan on payment intent' },
        { status: 400 }
      );
    }

    const paymentStatus = paymentIntent.attributes.status;

    const paymentsResponse = await fetch(`https://api.paymongo.com/v1/payments?payment_intent=${intentId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    let isPaid = false;
    let paidPayment: any = null;
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      const payments = paymentsData.data || [];
      paidPayment = payments.find((p: any) => p.attributes.status === 'paid');
      isPaid = !!paidPayment;
    }

    if (paymentStatus !== 'succeeded' && !isPaid) {
      return NextResponse.json({
        success: false,
        message: `Payment has not been completed yet. Status: ${paymentStatus}`,
        paymentStatus,
        isPaid,
        canActivate: false,
      });
    }

    if (!paidPayment?.id) {
      return NextResponse.json(
        { error: 'Paid payment record not found' },
        { status: 400 }
      );
    }

    const amountCents =
      paidPayment.attributes?.amount ?? paymentIntent.attributes?.amount ?? 0;

    const expectedAmount = getExpectedAmountCents(plan, months);
    if (expectedAmount != null && amountCents !== expectedAmount) {
      return NextResponse.json(
        { error: 'Payment amount does not match selected plan' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      throw new Error('Could not create admin database client');
    }

    const fulfillment = await fulfillSubscriptionFromPayment(supabaseAdmin, {
      userId,
      plan,
      months,
      paymongoPaymentId: paidPayment.id,
      paymongoPaymentIntentId: intentId,
      amountCents,
      userEmail: (metadata.email as string) || user.email || null,
      paidAt:
        paidPayment.attributes?.paid_at != null
          ? new Date(paidPayment.attributes.paid_at * 1000).toISOString()
          : undefined,
    });

    if (!fulfillment.ok) {
      throw new Error(fulfillment.error);
    }

    const { data: updatedProfile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      success: true,
      message: fulfillment.alreadyFulfilled
        ? 'Payment already fulfilled'
        : 'Subscription activated successfully',
      subscription: {
        tier: updatedProfile?.subscription_tier,
        expiresAt: updatedProfile?.subscription_expires_at,
      },
    });

  } catch (error: any) {
    console.error('[Verify Payment] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
