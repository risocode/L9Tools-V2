-- Idempotent subscription fulfillment tracking (H3)
-- Run in Supabase SQL Editor after payment_records exists

ALTER TABLE public.payment_records
  ADD COLUMN IF NOT EXISTS subscription_fulfilled_at timestamptz;

UPDATE public.payment_records
SET subscription_fulfilled_at = COALESCE(paid_at, created_at)
WHERE subscription_fulfilled_at IS NULL;

CREATE INDEX IF NOT EXISTS payment_records_fulfilled_idx
  ON public.payment_records (subscription_fulfilled_at)
  WHERE subscription_fulfilled_at IS NOT NULL;
