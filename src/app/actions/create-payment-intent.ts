'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Create a PayMongo payment intent for subscription
 * This is a server action wrapper for the API route
 */
export async function createPaymentIntent(
  amount: number,
  plan: string,
  months: number = 1
): Promise<{ 
  success: boolean; 
  payment_intent_id?: string;
  client_key?: string;
  next_action?: any;
  error?: string;
}> {
  console.log('[Create Payment Intent Action] Called with:', {
    amount,
    plan,
    months,
  });

  try {
    // Verify user is authenticated
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[Create Payment Intent Action] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error('[Create Payment Intent Action] Authentication failed');
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payments/create-intent`;
    console.log('[Create Payment Intent Action] Calling API:', apiUrl);

    // Call the API route
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        plan,
        months,
      }),
    });

    const data = await response.json();

    console.log('[Create Payment Intent Action] API response:', {
      status: response.status,
      success: data.success,
      hasPaymentIntentId: !!data.payment_intent_id,
      hasClientKey: !!data.client_key,
      error: data.error,
    });

    if (!response.ok) {
      console.error('[Create Payment Intent Action] API error:', data.error);
      return {
        success: false,
        error: data.error || 'Failed to create payment intent'
      };
    }

    console.log('[Create Payment Intent Action] ✅ Success');
    return {
      success: true,
      payment_intent_id: data.payment_intent_id,
      client_key: data.client_key,
      next_action: data.next_action,
    };

  } catch (error: any) {
    console.error('[Create Payment Intent Action] Exception:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payment intent'
    };
  }
}
