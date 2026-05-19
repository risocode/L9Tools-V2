-- =================================================================
-- L9 Tools Admin Panel Migrations
-- Run in Supabase SQL Editor (production/staging as needed)
-- =================================================================

-- Effective subscription tier (mirrors src/lib/subscription-utils.ts)
CREATE OR REPLACE FUNCTION public.effective_subscription_tier(
  tier text,
  expires_at timestamptz,
  is_admin boolean
) RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN is_admin OR tier = 'lifetime' THEN COALESCE(tier, 'free')
    WHEN tier IS NULL OR tier = 'free' THEN 'free'
    WHEN tier = 'pro' AND expires_at IS NOT NULL AND expires_at < now() THEN 'free'
    WHEN tier = 'pro' THEN 'pro'
    ELSE 'free'
  END;
$$;

-- Admin audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_id_idx ON public.admin_audit_log (admin_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- No public policies: service role only via server actions

-- Paginated admin profiles with filters
CREATE OR REPLACE FUNCTION public.get_admin_profiles(
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 20,
  p_search text DEFAULT NULL,
  p_tier_filter text DEFAULT 'all',
  p_extra_filter text DEFAULT NULL
)
RETURNS TABLE (
  profiles jsonb,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset int;
  v_search text;
BEGIN
  v_offset := GREATEST((p_page - 1) * p_page_size, 0);
  v_search := NULLIF(trim(p_search), '');

  RETURN QUERY
  WITH filtered AS (
    SELECT p.*
    FROM public.profiles p
    WHERE
      (
        v_search IS NULL
        OR p.email ILIKE '%' || v_search || '%'
        OR p.display_name ILIKE '%' || v_search || '%'
        OR p.short_id ILIKE '%' || v_search || '%'
        OR (v_search ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND p.id::text = v_search)
      )
      AND (
        p_tier_filter = 'all'
        OR effective_subscription_tier(p.subscription_tier, p.subscription_expires_at, p.is_admin) = p_tier_filter
      )
      AND (
        p_extra_filter IS NULL
        OR p_extra_filter = 'none'
        OR (p_extra_filter = 'admins' AND p.is_admin = true)
        OR (p_extra_filter = 'never_signed_in' AND p.last_sign_in_at IS NULL)
        OR (
          p_extra_filter = 'expired_pro'
          AND p.subscription_tier = 'pro'
          AND effective_subscription_tier(p.subscription_tier, p.subscription_expires_at, p.is_admin) = 'free'
        )
        OR (
          p_extra_filter = 'trial'
          AND p.subscription_tier = 'pro'
          AND p.subscription_expires_at IS NOT NULL
          AND p.created_at IS NOT NULL
          AND EXTRACT(EPOCH FROM (p.subscription_expires_at - p.created_at)) / 86400 BETWEEN 2.5 AND 3.5
        )
      )
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS cnt FROM filtered
  ),
  paged AS (
    SELECT f.*
    FROM filtered f
    ORDER BY f.last_sign_in_at DESC NULLS LAST, f.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset
  )
  SELECT
    COALESCE((SELECT jsonb_agg(to_jsonb(p.*) ORDER BY p.last_sign_in_at DESC NULLS LAST, p.created_at DESC) FROM paged p), '[]'::jsonb),
    (SELECT cnt FROM counted);
END;
$$;

-- Analytics for admin overview
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS TABLE (
  signups_last_7_days bigint,
  pro_expiring_next_7_days bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= now() - interval '7 days')::bigint,
    (
      SELECT COUNT(*) FROM public.profiles
      WHERE subscription_tier = 'pro'
        AND subscription_expires_at IS NOT NULL
        AND subscription_expires_at > now()
        AND subscription_expires_at <= now() + interval '7 days'
        AND is_admin = false
    )::bigint;
$$;

-- Recent audit entries
CREATE OR REPLACE FUNCTION public.get_admin_audit_log(
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 50
)
RETURNS TABLE (
  entries jsonb,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset int;
BEGIN
  v_offset := GREATEST((p_page - 1) * p_page_size, 0);

  RETURN QUERY
  WITH counted AS (
    SELECT COUNT(*)::bigint AS cnt FROM public.admin_audit_log
  ),
  paged AS (
    SELECT l.*, p.display_name AS admin_display_name, p.email AS admin_email
    FROM public.admin_audit_log l
    LEFT JOIN public.profiles p ON p.id = l.admin_id
    ORDER BY l.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset
  )
  SELECT
    COALESCE((SELECT jsonb_agg(to_jsonb(x.*)) FROM paged x), '[]'::jsonb),
    (SELECT cnt FROM counted);
END;
$$;

-- Optional: force logout all users (invalidates refresh tokens)
CREATE OR REPLACE FUNCTION public.force_logout_all_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM auth.refresh_tokens;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_profiles TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_audit_log TO service_role;
GRANT EXECUTE ON FUNCTION public.force_logout_all_users TO service_role;
GRANT EXECUTE ON FUNCTION public.effective_subscription_tier TO service_role;
