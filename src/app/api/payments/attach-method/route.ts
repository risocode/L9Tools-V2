import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Attach payment method to payment intent and get redirect URL
 * POST /api/payments/attach-method
 */
export async function POST(request: NextRequest) {
  console.log('[Attach Payment Method] Request received');
  
  try {
    // Verify user is authenticated
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[Attach Payment Method] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error('[Attach Payment Method] Authentication failed:', {
        authError: authError?.message,
        hasUser: !!user,
      });
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('[Attach Payment Method] ✅ User authenticated:', {
      userId: user.id,
      userEmail: user.email,
    });

    const body = await request.json();
    const { payment_intent_id, return_url } = body;

    console.log('[Attach Payment Method] Request body:', {
      payment_intent_id,
      return_url,
      userId: user.id,
    });

    if (!payment_intent_id) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      console.error('[Attach Payment Method] PAYMONGO_SECRET_KEY not configured');
      throw new Error('PAYMONGO_SECRET_KEY not configured');
    }

    console.log('[Attach Payment Method] Creating payment method (QRPh)...');
    
    // Create payment method for QRPh with billing information
    // QRPh requires billing details (name, email are minimum required)
    const paymentMethodResponse = await fetch('https://api.paymongo.com/v1/payment_methods', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'qrph', // QRPh payment method type
            billing: {
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
              email: user.email || '',
              phone: user.phone || '',
            },
            metadata: {
              merchant_name: 'L9 Tools',
            },
          },
        },
      }),
    });

    if (!paymentMethodResponse.ok) {
      const error = await paymentMethodResponse.json();
      console.error('[Attach Payment Method] Failed to create payment method:', {
        status: paymentMethodResponse.status,
        error: error,
      });
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment method');
    }

    const paymentMethodData = await paymentMethodResponse.json();
    const paymentMethodId = paymentMethodData.data.id;

    console.log('[Attach Payment Method] Payment method created:', {
      paymentMethodId,
    });

    console.log('[Attach Payment Method] Attaching payment method to payment intent...');
    
    // Attach payment method to payment intent
    const attachResponse = await fetch(`https://api.paymongo.com/v1/payment_intents/${payment_intent_id}/attach`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
                  return_url: return_url || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.l9tools.online'}/subscribe/qrph?status=success`,
          },
        },
      }),
    });

    if (!attachResponse.ok) {
      const error = await attachResponse.json();
      console.error('[Attach Payment Method] Failed to attach payment method:', {
        status: attachResponse.status,
        error: error,
      });
      throw new Error(error.errors?.[0]?.detail || 'Failed to attach payment method');
    }

    const attachData = await attachResponse.json();
    const paymentIntent = attachData.data;

    // QRPh returns a QR code image in next_action, not a redirect URL
    // Structure: next_action.type = "consume_qr", next_action.code.image_url = base64 PNG
    const nextAction = paymentIntent.attributes.next_action;
    
    console.log('[Attach Payment Method] ✅ Payment method attached:', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.attributes.status,
      hasNextAction: !!nextAction,
      nextActionType: nextAction?.type,
      hasQrCode: !!nextAction?.code?.image_url,
      qrCodeId: nextAction?.code?.id,
      qrCodeAmount: nextAction?.code?.amount,
    });

    // Extract payment URL if available (for mobile deep linking)
    const paymentUrl = nextAction?.redirect?.url || paymentIntent.attributes.payment_url || null;

    return NextResponse.json({
      success: true,
      next_action: nextAction,
      status: paymentIntent.attributes.status,
      // QRPh specific: QR code image URL (base64 PNG) and ID
      // Dynamic QRPh uses next_action.type = "consume_qr" and next_action.code.image_url
      qr_code: nextAction?.code?.image_url,
      qr_code_id: nextAction?.code?.id,
      qr_code_amount: nextAction?.code?.amount,
      // Payment URL for mobile deep linking
      payment_url: paymentUrl,
    });

  } catch (error: any) {
    console.error('[Attach Payment Method] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to attach payment method' },
      { status: 500 }
    );
  }
}
