-- Migration: Give admins visibility into applicant emails and onboarding
-- status, and a safe way to reset a stuck registration themselves.
--
-- Background: the admin users page has never shown email addresses (only
-- name/RA number, both self-reported at signup). When an RA-number conflict
-- happens, there has been no way for an admin to look up who actually holds
-- a given number without a direct database query. This adds a
-- SECURITY DEFINER function (admin-gated, mirrors the existing
-- is_admin_simple() pattern already used by profiles/tasks RLS) that exposes
-- id/email/onboarding-status from auth.users to admins only, plus a reset
-- function that lets an admin clear one person's incomplete/incorrect
-- registration without touching their login credentials.
--
-- Created: 2026-08-24

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  is_onboarding_complete boolean,
  has_profile boolean,
  auth_created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.email,
    COALESCE(a.is_onboarding_complete, false) AS is_onboarding_complete,
    (p.id IS NOT NULL) AS has_profile,
    u.created_at AS auth_created_at
  FROM auth.users u
  LEFT JOIN public.auth_check a ON a.user_id = u.id
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE public.is_admin_simple()
  ORDER BY u.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- Deletes one user's profile row and resets their onboarding flag, so they
-- land back on /profile/setup on next load and can re-register cleanly.
-- Does NOT touch auth.users: their login (email/password) is untouched, only
-- their previously-entered profile data and completion status are cleared.
CREATE OR REPLACE FUNCTION public.admin_reset_registration(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_simple() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM public.profiles WHERE id = target_user_id;

  UPDATE public.auth_check
  SET is_onboarding_complete = false, updated_at = now()
  WHERE user_id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reset_registration(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_reset_registration(uuid) TO authenticated;
