import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { getResend } from '@/lib/resend';

/**
 * Resend webhook handler for email.received events
 * Verifies webhook signature using Svix
 * 
 * Webhook URL: https://www.l9tools.online/api/webhooks/resend
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('[Webhook] RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Get signature from headers (Resend uses svix-signature)
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('[Webhook] Missing svix headers');
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // Verify webhook signature using Svix
    const wh = new Webhook(webhookSecret);
    let event: any;

    try {
      event = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as any;
    } catch (err: any) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Handle email.received event
    if (event.type === 'email.received') {
      const { from, to, subject, email_id, date } = event.data;
      
      // Parse the recipient email address
      const recipientEmail = Array.isArray(to) ? to[0] : to;
      
      console.log('[Webhook] ✅ Email received:', {
        email_id,
        from,
        to: recipientEmail,
        subject,
        date,
      });

      // Filter for specific receiving address (e.g., risocadev@l9tools.online)
      const receivingEmail = process.env.RESEND_RECEIVING_EMAIL || 'risocadev@l9tools.online';
      
      if (recipientEmail.toLowerCase() === receivingEmail.toLowerCase()) {
        console.log(`[Webhook] 📧 Email received at ${receivingEmail}`);
        
        // Add custom processing logic for this specific address here
        // Examples:
        // - Store email in database
        // - Send auto-reply
        // - Forward to support system
        // - Parse and extract information
        // - Handle unsubscribe requests
        
        // If you need full email content (body, attachments):
        // const emailContent = await fetchEmailContent(email_id);
      }
      
      return NextResponse.json({ 
        received: true,
        email_id,
        recipient: recipientEmail,
        message: 'Email received and processed'
      }, { status: 200 });
    }

    // Handle other event types if needed
    console.log('[Webhook] Unhandled event type:', event.type);
    return NextResponse.json({ 
      received: true,
      event_type: event.type 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Optional: Fetch full email content and attachments
 * The webhook only provides metadata - use this to get full content
 * 
 * Note: Check Resend API docs for the exact endpoint format
 */
async function fetchEmailContent(emailId: string) {
  try {
    const resend = getResend();
    
    // Note: Check Resend docs for the exact API endpoint
    // This is an example - verify the correct method in Resend SDK
    const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch email: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error: any) {
    console.error('[Webhook] Error fetching email content:', error);
    throw error;
  }
}
