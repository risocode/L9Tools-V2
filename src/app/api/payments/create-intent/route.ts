import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getPaymentDescription, resolveCheckoutRequest } from '@/lib/subscription-plans';

/**
 * Create a PayMongo payment intent for GCash payment
 * POST /api/payments/create-intent
 */
export async function POST(request: NextRequest) {
  console.log('[Payment Intent] Request received');
  
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
    const { plan, months: clientMonths } = body;

    const checkout = resolveCheckoutRequest(plan, clientMonths);
    if (!checkout) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    const { planId, months, amountPhp } = checkout;
    const amountInCents = Math.round(amountPhp * 100);

    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      throw new Error('PAYMONGO_SECRET_KEY not configured');
    }

    const response = await fetch('https://api.paymongo.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountInCents,
            currency: 'PHP',
            payment_method_allowed: ['qrph'],
            description: getPaymentDescription(planId),
            metadata: {
              user_id: user.id,
              plan: planId,
              months: months.toString(),
              email: user.email || '',
              merchant_name: 'L9 Tools',
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment intent');
    }

    const paymentIntentData = await response.json();
    const paymentIntent = paymentIntentData.data;

    return NextResponse.json({
      success: true,
      payment_intent_id: paymentIntent.id,
      client_key: paymentIntent.attributes.client_key,
      amount: amountInCents,
      currency: 'PHP',
      status: paymentIntent.attributes.status,
      next_action: paymentIntent.attributes.next_action,
    });

  } catch (error: any) {
    console.error('[Payment Intent] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
