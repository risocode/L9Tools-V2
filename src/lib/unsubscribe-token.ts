import crypto from 'crypto';

const TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getUnsubscribeSecret(): string | null {
  return (
    process.env.UNSUBSCRIBE_TOKEN_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    null
  );
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createUnsubscribeToken(email: string, nowMs: number = Date.now()): string | null {
  const secret = getUnsubscribeSecret();
  if (!secret || !email.includes('@')) {
    return null;
  }

  const expiry = nowMs + TOKEN_TTL_MS;
  const payload = `${normalizeEmail(email)}:${expiry}`;
  const signature = signPayload(payload, secret);
  return `${expiry}.${signature}`;
}

export function verifyUnsubscribeToken(
  email: string,
  token: string | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!token || !email.includes('@')) {
    return false;
  }

  const secret = getUnsubscribeSecret();
  if (!secret) {
    return false;
  }

  const [expiryRaw, signature] = token.split('.');
  const expiry = Number(expiryRaw);
  if (!expiryRaw || !signature || !Number.isFinite(expiry) || expiry < nowMs) {
    return false;
  }

  const payload = `${normalizeEmail(email)}:${expiry}`;
  const expected = signPayload(payload, secret);

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function buildUnsubscribeParams(email: string): URLSearchParams {
  const token = createUnsubscribeToken(email);
  const params = new URLSearchParams({ email });
  if (token) {
    params.set('token', token);
  }
  return params;
}

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.l9tools.online').replace(/\/$/, '');
}

/** Human-facing unsubscribe page (GET). */
export function buildUnsubscribePageUrl(email: string): string {
  return `${getSiteUrl()}/unsubscribe?${buildUnsubscribeParams(email).toString()}`;
}

/** RFC 8058 one-click POST endpoint (List-Unsubscribe header). */
export function buildUnsubscribeOneClickUrl(email: string): string {
  return `${getSiteUrl()}/api/unsubscribe?${buildUnsubscribeParams(email).toString()}`;
}

/** @deprecated Use buildUnsubscribePageUrl or buildUnsubscribeOneClickUrl */
export function buildUnsubscribeUrl(email: string): string {
  return buildUnsubscribePageUrl(email);
}
