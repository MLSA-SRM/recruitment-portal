-- Migration: HTTPS-callable backup export function.
--
-- The scheduled backup routine runs in a cloud sandbox whose outbound
-- network is restricted to HTTPS (port 443) only — confirmed by direct
-- testing: raw Postgres connections on both 6543 (pooler) and 5432
-- (direct) hard-timeout, while HTTPS to the same hosts succeeds instantly.
-- The earlier backup_reader Postgres role therefore cannot be used by the
-- routine at all; it stays in place as a harmless, still-safely-read-only
-- credential for manual/local use, but the routine now goes through
-- PostgREST (Supabase's HTTPS REST API) instead.
--
-- This function is callable via POST /rest/v1/rpc/admin_backup_export using
-- only the public anon key (which the routine already has, and which is not
-- sensitive by design), gated by a shared secret parameter instead of a user
-- session — the routine has no authenticated session to check auth.uid()
-- against, unlike admin_list_users(). The secret is the actual gate: anyone
-- can technically reach this RPC with the public anon key, but the call
-- fails without the correct secret.
--
-- Created: 2026-08-24

CREATE OR REPLACE FUNCTION public.admin_backup_export(secret text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF secret IS DISTINCT FROM '05cSeG3xLLn85wAgV82h2vwCuVJppKwPooZ1TEsc6v4' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'admin_activity_log', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.admin_activity_log t),
    'auth_check',          (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.auth_check t),
    'profiles',            (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.profiles t),
    'submission_fields',   (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.submission_fields t),
    'submissions',         (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.submissions t),
    'tasks',               (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.tasks t),
    'auth_users_safe',     (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.backup_auth_users_safe t)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_backup_export(text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_backup_export(text) TO anon;
