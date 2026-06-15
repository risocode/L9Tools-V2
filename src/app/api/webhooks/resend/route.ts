import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { extractRecipientEmails, suppressEmailRecipient } from '@/lib/email-suppression';

/**
 * Resend webhook handler for email events (inbound, bounces, complaints, suppression).
 * Webhook URL: https://www.l9tools.online/api/webhooks/resend
 */
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Webhook] RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const rawBody = await request.text();
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing required headers' }, { status: 400 });
    }

    const wh = new Webhook(webhookSecret);
    let event: { type: string; data?: Record<string, unknown> };

    try {
      event = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as { type: string; data?: Record<string, unknown> };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid signature';
      console.error('[Webhook] Signature verification failed:', message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { type, data } = event;

    if (type === 'email.bounced') {
      const bounce = data?.bounce as { type?: string } | undefined;
      const isPermanent = bounce?.type === 'Permanent';
      const recipients = extractRecipientEmails(data?.to);

      for (const email of recipients) {
        if (isPermanent) {
          await suppressEmailRecipient(email, 'bounce');
        }
      }

      return NextResponse.json({ received: true, type, suppressed: recipients.length }, { status: 200 });
    }

    if (type === 'email.complained' || type === 'email.suppressed') {
      const recipients = extractRecipientEmails(data?.to);
      const reason = type === 'email.complained' ? 'complaint' : 'suppressed';

      for (const email of recipients) {
        await suppressEmailRecipient(email, reason);
      }

      return NextResponse.json({ received: true, type, suppressed: recipients.length }, { status: 200 });
    }

    if (type === 'email.received') {
      const recipientEmail = extractRecipientEmails(data?.to)[0];
      const receivingEmail = process.env.RESEND_RECEIVING_EMAIL || 'team@l9tools.online';

      if (recipientEmail?.toLowerCase() === receivingEmail.toLowerCase()) {
        console.log(`[Webhook] Email received at ${receivingEmail}`, {
          email_id: data?.email_id,
          from: data?.from,
          subject: data?.subject,
        });
      }

      return NextResponse.json({ received: true, type, recipient: recipientEmail }, { status: 200 });
    }

    console.log('[Webhook] Event received:', type);
    return NextResponse.json({ received: true, type }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Webhook] Error processing webhook:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
