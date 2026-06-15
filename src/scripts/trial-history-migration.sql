-- =================================================================
-- Trial history + profile RLS hardening
-- Run in Supabase SQL Editor (production/staging as needed)
-- =================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Permanent trial ledger (survives profile + auth.users deletion)
CREATE TABLE IF NOT EXISTS public.trial_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  email_hash text NOT NULL,
  provider text NOT NULL DEFAULT 'google',
  first_trial_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trial_history_auth_user_id_unique UNIQUE (auth_user_id),
  CONSTRAINT trial_history_email_hash_unique UNIQUE (email_hash)
);

CREATE INDEX IF NOT EXISTS trial_history_email_hash_idx ON public.trial_history (email_hash);
CREATE INDEX IF NOT EXISTS trial_history_auth_user_id_idx ON public.trial_history (auth_user_id);

ALTER TABLE public.trial_history ENABLE ROW LEVEL SECURITY;

-- No client access to trial_history
REVOKE ALL ON public.trial_history FROM anon, authenticated;
GRANT ALL ON public.trial_history TO service_role;

-- Backfill users who already received the signup trial
INSERT INTO public.trial_history (auth_user_id, email_hash, provider, first_trial_at)
SELECT
  p.id,
  encode(digest(lower(trim(p.email)), 'sha256'), 'hex'),
  'google',
  p.created_at
FROM public.profiles p
WHERE p.email IS NOT NULL
  AND trim(p.email) <> ''
  AND p.subscription_tier = 'pro'
  AND p.subscription_expires_at IS NOT NULL
  AND p.created_at IS NOT NULL
  AND EXTRACT(EPOCH FROM (p.subscription_expires_at - p.created_at)) / 86400 BETWEEN 2.5 AND 3.5
ON CONFLICT DO NOTHING;

-- Also backfill paid / lifetime users so re-signup cannot receive a signup trial
INSERT INTO public.trial_history (auth_user_id, email_hash, provider, first_trial_at)
SELECT
  p.id,
  encode(digest(lower(trim(p.email)), 'sha256'), 'hex'),
  'google',
  COALESCE(p.created_at, now())
FROM public.profiles p
WHERE p.email IS NOT NULL
  AND trim(p.email) <> ''
  AND (
    p.subscription_tier = 'lifetime'
    OR (
      p.subscription_tier = 'pro'
      AND NOT (
        p.subscription_expires_at IS NOT NULL
        AND p.created_at IS NOT NULL
        AND EXTRACT(EPOCH FROM (p.subscription_expires_at - p.created_at)) / 86400 BETWEEN 2.5 AND 3.5
      )
    )
  )
ON CONFLICT DO NOTHING;

-- Server-side trial claim (service role only)
CREATE OR REPLACE FUNCTION public.claim_trial_if_eligible(
  p_auth_user_id uuid,
  p_email text,
  p_provider text DEFAULT 'google'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email_hash text;
  v_eligible boolean;
BEGIN
  IF p_auth_user_id IS NULL OR p_email IS NULL OR trim(p_email) = '' THEN
    RETURN false;
  END IF;

  v_email_hash := encode(digest(lower(trim(p_email)), 'sha256'), 'hex');

  SELECT NOT EXISTS (
    SELECT 1
    FROM public.trial_history th
    WHERE th.auth_user_id = p_auth_user_id
       OR th.email_hash = v_email_hash
  ) INTO v_eligible;

  IF NOT v_eligible THEN
    RETURN false;
  END IF;

  INSERT INTO public.trial_history (auth_user_id, email_hash, provider)
  VALUES (p_auth_user_id, v_email_hash, COALESCE(NULLIF(trim(p_provider), ''), 'google'));

  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    RETURN false;
END;
$$;

-- Preserve trial consumption before account deletion
CREATE OR REPLACE FUNCTION public.preserve_trial_history_on_deletion(
  p_auth_user_id uuid,
  p_email text,
  p_provider text DEFAULT 'google'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email_hash text;
  v_profile public.profiles%ROWTYPE;
  v_should_preserve boolean := false;
BEGIN
  IF p_auth_user_id IS NULL OR p_email IS NULL OR trim(p_email) = '' THEN
    RETURN;
  END IF;

  v_email_hash := encode(digest(lower(trim(p_email)), 'sha256'), 'hex');

  IF EXISTS (
    SELECT 1
    FROM public.trial_history th
    WHERE th.auth_user_id = p_auth_user_id
       OR th.email_hash = v_email_hash
  ) THEN
    RETURN;
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles p
  WHERE p.id = p_auth_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_should_preserve :=
    v_profile.subscription_tier = 'lifetime'
    OR v_profile.subscription_tier = 'pro'
    OR EXISTS (
      SELECT 1
      FROM public.payment_records pr
      WHERE pr.user_email IS NOT NULL
        AND lower(trim(pr.user_email)) = lower(trim(p_email))
        AND pr.status = 'paid'
    );

  IF v_should_preserve THEN
    INSERT INTO public.trial_history (auth_user_id, email_hash, provider, first_trial_at)
    VALUES (
      p_auth_user_id,
      v_email_hash,
      COALESCE(NULLIF(trim(p_provider), ''), 'google'),
      COALESCE(v_profile.created_at, now())
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_trial_if_eligible(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.preserve_trial_history_on_deletion(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_trial_if_eligible(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.preserve_trial_history_on_deletion(uuid, text, text) TO service_role;

-- =================================================================
-- profiles RLS hardening
-- =================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_delete_denied ON public.profiles;
CREATE POLICY profiles_delete_denied
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (false);

CREATE OR REPLACE FUNCTION public.protect_profiles_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND auth.role() = 'authenticated' THEN
    IF COALESCE(NEW.is_admin, false) = true
       OR COALESCE(NEW.subscription_tier, 'free') <> 'free'
       OR NEW.subscription_expires_at IS NOT NULL
    THEN
      RAISE EXCEPTION 'permission denied: cannot set subscription or admin fields on profile insert';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND auth.role() = 'authenticated' THEN
    IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
       OR NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at
       OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'permission denied: cannot modify protected profile fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profiles_sensitive_columns_trigger ON public.profiles;
CREATE TRIGGER protect_profiles_sensitive_columns_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_sensitive_columns();
