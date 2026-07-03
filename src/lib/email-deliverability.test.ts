import { describe, expect, it } from 'vitest';
import { validateMarketingSubject } from './email-deliverability';

describe('validateMarketingSubject', () => {
  it('accepts neutral subjects', () => {
    expect(validateMarketingSubject('L9 Tools: July event update').ok).toBe(true);
  });

  it('rejects FREE', () => {
    expect(validateMarketingSubject('FREE PRO ACCESS').ok).toBe(false);
  });

  it('rejects excessive emojis', () => {
    expect(validateMarketingSubject('🎉🔥💎🚀 Update').ok).toBe(false);
  });

  it('rejects ALL CAPS subjects', () => {
    expect(validateMarketingSubject('IMPORTANT WEBSITE UPDATE NOW').ok).toBe(false);
  });
});
