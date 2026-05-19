import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { recordPayment } from '@/lib/payment-records';

/**
 * PayMongo webhook handler for payment events
 * Handles payment.paid, payment.failed, etc.
 * 
 * Webhook URL: https://www.l9tools.online/api/webhooks/paymongo
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('[PayMongo Webhook] PAYMONGO_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // PayMongo sends signature in 'paymongo-signature' header (not x-paymongo-signature)
    // Format: t=timestamp,te=test_signature,li=live_signature
    const signatureHeader = request.headers.get('paymongo-signature') || request.headers.get('x-paymongo-signature');

    if (!signatureHeader) {
      console.error('[PayMongo Webhook] Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Parse PayMongo signature format: t=timestamp,te=test_signature,li=live_signature
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
      console.error('[PayMongo Webhook] Missing timestamp in signature');
      return NextResponse.json(
        { error: 'Invalid signature format' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    // PayMongo uses: HMAC SHA256(timestamp + "." + rawBody)
    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    // Use live signature if available, otherwise test signature
    const receivedSignature = liveSignature || testSignature;
    
    if (!receivedSignature) {
      console.error('[PayMongo Webhook] No signature found in header');
      return NextResponse.json(
        { error: 'Invalid signature format' },
        { status: 400 }
      );
    }

    // Compare signatures using timing-safe comparison
    const signatureMatches = crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    );

    if (!signatureMatches) {
      console.error('[PayMongo Webhook] Invalid signature', {
        received: receivedSignature.substring(0, 20) + '...',
        expected: expectedSignature.substring(0, 20) + '...',
        timestamp,
        mode: liveSignature ? 'live' : 'test',
      });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Optional: Check timestamp freshness (prevent replay attacks)
    const signatureTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - signatureTime);
    
    // Reject if signature is older than 5 minutes
    if (timeDiff > 300) {
      console.error('[PayMongo Webhook] Signature timestamp too old', {
        signatureTime,
        currentTime,
        timeDiff,
      });
      return NextResponse.json(
        { error: 'Signature expired' },
        { status: 401 }
      );
    }

    // Parse webhook event
    const event = JSON.parse(rawBody);
    const { type, data } = event;

    console.log('[PayMongo Webhook] Event received:', {
      type,
      eventId: event.id || 'unknown',
      hasData: !!data,
    });

    // Handle payment.paid event
    if (type === 'payment.paid') {
      console.log('[PayMongo Webhook] Processing payment.paid event');
      
      // PayMongo webhook data structure: { type: 'payment.paid', data: { id, type, attributes, relationships } }
      const payment = data;
      
      console.log('[PayMongo Webhook] Payment data:', {
        paymentId: payment.id,
        paymentStatus: payment.attributes?.status,
        hasRelationships: !!payment.relationships,
        relationships: payment.relationships ? Object.keys(payment.relationships) : [],
      });
      
      // Get payment intent ID from relationships
      const paymentIntentId = payment.relationships?.payment_intent?.data?.id;
      
      if (!paymentIntentId) {
        console.error('[PayMongo Webhook] ❌ No payment_intent_id in payment data', {
          paymentId: payment.id,
          relationships: payment.relationships,
          fullPaymentData: JSON.stringify(payment, null, 2),
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      console.log('[PayMongo Webhook] Payment intent ID found:', paymentIntentId);
      
      // Get payment intent to access metadata
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
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const paymentIntentData = await paymentIntentResponse.json();
      const paymentIntent = paymentIntentData.data;
      const metadata = paymentIntent.attributes.metadata || {};
      
      console.log('[PayMongo Webhook] Payment intent metadata:', {
        metadata,
        hasUserId: !!metadata.user_id,
        plan: metadata.plan,
        months: metadata.months,
      });
      
      const userId = metadata.user_id;
      const plan = metadata.plan;
      const months = parseInt(metadata.months || '1');

      if (!userId) {
        console.error('[PayMongo Webhook] ❌ No user_id in metadata', {
          metadata,
          paymentIntentId,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      if (!plan) {
        console.error('[PayMongo Webhook] ❌ No plan in metadata', {
          metadata,
          userId,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const amountCents =
        payment.attributes?.amount ?? paymentIntent.attributes?.amount ?? 0;

      const supabaseAdmin = getSupabaseAdmin();
      if (supabaseAdmin && amountCents > 0) {
        await recordPayment(supabaseAdmin, {
          userId,
          paymongoPaymentId: payment.id,
          paymongoPaymentIntentId: paymentIntentId,
          amountCents,
          plan,
          months,
          userEmail: metadata.email as string | undefined,
          paidAt:
            payment.attributes?.paid_at != null
              ? new Date(payment.attributes.paid_at * 1000).toISOString()
              : undefined,
        });
      }

      console.log('[PayMongo Webhook] Activating subscription:', {
        userId,
        plan,
        months,
        paymentIntentId,
      });

      // Activate subscription
      try {
        await activateSubscription(userId, plan, months);
        
        console.log('[PayMongo Webhook] ✅ Payment processed and subscription activated:', {
          userId,
          plan,
          months,
          paymentId: payment.id,
          paymentIntentId,
        });
      } catch (activationError: any) {
        console.error('[PayMongo Webhook] ❌ Failed to activate subscription:', {
          error: activationError.message,
          userId,
          plan,
          months,
          stack: activationError.stack,
        });
        // Still return 200 to prevent webhook retries, but log the error
        return NextResponse.json({ 
          received: true,
          error: 'Subscription activation failed',
          message: activationError.message
        }, { status: 200 });
      }

      return NextResponse.json({ 
        received: true,
        message: 'Payment processed successfully'
      }, { status: 200 });
    }

    // Handle other event types
    console.log('[PayMongo Webhook] Unhandled event type:', type);
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

/**
 * Activate user subscription after successful payment
 */
async function activateSubscription(userId: string, plan: string, months: number) {
  console.log('[Activate Subscription] Starting activation:', {
    userId,
    plan,
    months,
  });

  const supabaseAdmin = getSupabaseAdmin();
  
  if (!supabaseAdmin) {
    console.error('[Activate Subscription] ❌ Could not create admin database client');
    throw new Error('Could not create admin database client');
  }

  // Normalize plan value (handle 'monthly' -> 'pro')
  const subscriptionTier = plan === 'lifetime' ? 'lifetime' : 'pro';
  
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  console.log('[Activate Subscription] Updating profile:', {
    userId,
    subscriptionTier,
    expiresAt: plan === 'lifetime' ? null : expiresAt.toISOString(),
    months,
  });

  // First, check if user exists
  const { data: existingProfile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, subscription_tier, subscription_expires_at')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('[Activate Subscription] ❌ Error fetching user profile:', {
      error: fetchError,
      userId,
    });
    throw new Error(`User profile not found: ${fetchError.message}`);
  }

  if (!existingProfile) {
    console.error('[Activate Subscription] ❌ User profile does not exist:', userId);
    throw new Error(`User profile does not exist for user ID: ${userId}`);
  }

  console.log('[Activate Subscription] Current profile state:', {
    currentTier: existingProfile.subscription_tier,
    currentExpiresAt: existingProfile.subscription_expires_at,
  });

  // For admins testing: If they already have lifetime, preserve it unless they're explicitly buying lifetime again
  // This prevents downgrading from lifetime to pro during testing
  const currentTier = existingProfile.subscription_tier;
  if (currentTier === 'lifetime' && subscriptionTier === 'pro') {
    console.log('[Activate Subscription] ⚠️ User already has lifetime subscription. Preserving lifetime tier during test payment.');
    // Don't downgrade from lifetime to pro - keep lifetime
    return;
  }

  // Update user subscription
  const { data: updatedProfile, error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: subscriptionTier,
      subscription_expires_at: plan === 'lifetime' ? null : expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[Activate Subscription] ❌ Error updating subscription:', {
      error: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      userId,
    });
    throw error;
  }

  if (!updatedProfile) {
    console.error('[Activate Subscription] ❌ No profile returned after update:', userId);
    throw new Error('Profile update returned no data');
  }

  console.log('[Activate Subscription] ✅ Subscription activated successfully:', {
    userId,
    plan,
    subscriptionTier,
    expiresAt: plan === 'lifetime' ? 'Never' : expiresAt.toISOString(),
    updatedTier: updatedProfile.subscription_tier,
    updatedExpiresAt: updatedProfile.subscription_expires_at,
  });
}
