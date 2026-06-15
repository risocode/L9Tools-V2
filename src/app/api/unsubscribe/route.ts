import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeFromEmails } from '@/app/actions/unsubscribe';

/**
 * RFC 8058 one-click unsubscribe (List-Unsubscribe-Post).
 * Gmail/Outlook POST here with body: List-Unsubscribe=One-Click
 */
export async function POST(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const token = request.nextUrl.searchParams.get('token');

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  const rawBody = await request.text();
  const isOneClick =
    rawBody.includes('List-Unsubscribe=One-Click') ||
    request.headers.get('List-Unsubscribe') === 'One-Click';

  if (!isOneClick && rawBody.length > 0) {
    return NextResponse.json({ error: 'Invalid one-click payload' }, { status: 400 });
  }

  const result = await unsubscribeFromEmails(email, token);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 403 });
  }

  return new NextResponse(null, { status: 200 });
}
