import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getPaymentDescription, isSubscriptionPlanId } from '@/lib/subscription-plans';

/**
 * Create a PayMongo payment intent for GCash payment
 * POST /api/payments/create-intent
 */
export async function POST(request: NextRequest) {
  console.log('[Payment Intent] Request received');
  
  try {
    // Verify user is authenticated
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[Payment Intent] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error('[Payment Intent] Authentication failed:', {
        authError: authError?.message,
        hasUser: !!user,
      });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('[Payment Intent] ✅ User authenticated:', {
      userId: user.id,
      userEmail: user.email,
    });

    const body = await request.json();
    const { amount, plan, months = 1 } = body;

    console.log('[Payment Intent] Request body:', {
      amount,
      plan,
      months,
      userId: user.id,
    });

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      );
    }

    // Convert PHP amount to cents (PayMongo uses cents)
    const amountInCents = Math.round(amount * 100);
    
    console.log('[Payment Intent] Amount calculation:', {
      originalAmount: amount,
      amountInCents,
    });

    console.log('[Payment Intent] Creating payment intent:', {
      amountInCents,
      currency: 'PHP',
      plan,
      months,
    });

    // Create payment intent using PayMongo API directly
    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      console.error('[Payment Intent] PAYMONGO_SECRET_KEY not configured');
      throw new Error('PAYMONGO_SECRET_KEY not configured');
    }

    console.log('[Payment Intent] Calling PayMongo API...');
    
    // Create payment intent via PayMongo API
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
            payment_method_allowed: ['qrph'], // QRPh payment method
            description: isSubscriptionPlanId(plan)
              ? getPaymentDescription(plan)
              : `L9 Tools ${plan} subscription - ${months} month(s)`,
            metadata: {
              user_id: user.id,
              plan: plan,
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
      console.error('[Payment Intent] PayMongo API error:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
      });
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment intent');
    }

    const paymentIntentData = await response.json();
    const paymentIntent = paymentIntentData.data;

    console.log('[Payment Intent] ✅ Payment intent created:', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.attributes.status,
      hasClientKey: !!paymentIntent.attributes.client_key,
    });

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
