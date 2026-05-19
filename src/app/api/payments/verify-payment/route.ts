import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { recordPayment } from '@/lib/payment-records';
import { parseSubscriptionFromDescription } from '@/lib/paymongo-sync';

/**
 * Verify and manually activate subscription for a payment intent
 * This is a fallback/verification endpoint
 * POST /api/payments/verify-payment
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
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
    
    // Support both naming conventions
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

    // Fetch payment intent from PayMongo
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

    // Verify this payment intent belongs to the current user
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Payment intent does not belong to current user' },
        { status: 403 }
      );
    }

    // Check payment status
    const paymentStatus = paymentIntent.attributes.status;
    
    console.log('[Verify Payment] Payment Intent Status:', {
      paymentStatus,
      paymentIntentId: intentId,
      userId,
    });

    // Check if payment is actually paid
    // Fetch payments for this intent
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
      
      console.log('[Verify Payment] Payments check:', {
        totalPayments: payments.length,
        payments: payments.map((p: any) => ({
          id: p.id,
          status: p.attributes.status,
          amount: p.attributes.amount,
        })),
        isPaid,
      });
    }

    // Payment is considered successful if:
    // 1. Payment intent status is 'succeeded', OR
    // 2. There's a payment with status 'paid'
    if (paymentStatus !== 'succeeded' && !isPaid) {
      return NextResponse.json({
        success: false,
        message: `Payment has not been completed yet. Status: ${paymentStatus}`,
        paymentStatus,
        isPaid,
        canActivate: false,
      });
    }

    console.log('[Verify Payment] ✅ Payment confirmed:', {
      paymentStatus,
      isPaid,
      paidPaymentId: paidPayment?.id,
    });

    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin && paidPayment?.id && plan) {
      const amountCents =
        paidPayment.attributes?.amount ?? paymentIntent.attributes?.amount ?? 0;
      if (amountCents > 0) {
        await recordPayment(supabaseAdmin, {
          userId,
          paymongoPaymentId: paidPayment.id,
          paymongoPaymentIntentId: intentId,
          amountCents,
          plan,
          months,
          userEmail: (metadata.email as string) || user.email || null,
          paidAt:
            paidPayment.attributes?.paid_at != null
              ? new Date(paidPayment.attributes.paid_at * 1000).toISOString()
              : undefined,
        });
      }
    }

    // Activate subscription
    if (!supabaseAdmin) {
      throw new Error('Could not create admin database client');
    }

    // Check existing subscription first
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    const subscriptionTier = plan === 'lifetime' ? 'lifetime' : 'pro';
    
    // For admins testing: If they already have lifetime, preserve it unless they're explicitly buying lifetime again
    if (existingProfile?.subscription_tier === 'lifetime' && subscriptionTier === 'pro') {
      console.log('[Verify Payment] ⚠️ User already has lifetime subscription. Preserving lifetime tier during test payment.');
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified. Lifetime subscription preserved (no downgrade from lifetime to pro).' 
      });
    }
    
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: subscriptionTier,
        subscription_expires_at: plan === 'lifetime' ? null : expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('[Verify Payment] Error updating subscription:', updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
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
