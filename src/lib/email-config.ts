/** Canonical L9 Tools outbound sender (Resend From header). */
export const DEFAULT_FROM_EMAIL = 'L9 Tools <team@l9tools.online>';

/** Default Reply-To — same monitored team inbox. */
export const DEFAULT_REPLY_TO = 'team@l9tools.online';

export const DEFAULT_SENDER_DISPLAY_NAME = 'L9 Tools';

export const DEFAULT_SENDER_ADDRESS = 'team@l9tools.online';

/**
 * Resolves the formatted From header for Resend.
 * Env override: RESEND_FROM_EMAIL (address or full "Name <addr>" format).
 */
export function getFormattedFromEmail(): string {
  const raw = process.env.RESEND_FROM_EMAIL?.trim();
  if (!raw) {
    return DEFAULT_FROM_EMAIL;
  }
  if (raw.includes('<')) {
    return raw;
  }
  return `${DEFAULT_SENDER_DISPLAY_NAME} <${raw}>`;
}

/**
 * Resolves Reply-To for Resend.
 * Env override: RESEND_REPLY_TO
 */
export function getReplyToEmail(): string {
  return process.env.RESEND_REPLY_TO?.trim() || DEFAULT_REPLY_TO;
}
