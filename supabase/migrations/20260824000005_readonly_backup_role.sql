-- Migration: Dedicated read-only role for automated database backups.
--
-- The scheduled backup routine needs a database credential, but should never
-- hold write access, and should never be able to read auth.users.encrypted_password
-- (password hashes). This role can SELECT from every public table plus a view
-- exposing only non-sensitive auth.users columns. It cannot INSERT, UPDATE,
-- DELETE, or read the real auth.users table (or its password column) at all.
--
-- Created: 2026-08-24

CREATE ROLE backup_reader LOGIN PASSWORD 'ZAsX6jNBjVeXFXh9ZLIM65pfnTf7Gboy';

-- Without BYPASSRLS, the RLS policies on profiles/auth_check (which check
-- auth.uid() = id) would silently filter out every row for a plain role
-- connecting directly over Postgres with no JWT context, making the backup
-- look empty. BYPASSRLS only removes that row-visibility filtering — it
-- grants no write capability, which this role still has none of.
ALTER ROLE backup_reader BYPASSRLS;

GRANT CONNECT ON DATABASE postgres TO backup_reader;
GRANT USAGE ON SCHEMA public TO backup_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_reader;

-- Auto-grant SELECT on any future public tables too, so backups don't
-- silently miss new tables added later.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO backup_reader;

-- Safe view of auth.users: no password hash, no other sensitive auth internals.
-- Deliberately NOT security_invoker: this view must run with its OWNER's
-- rights (who can read auth.users) so that backup_reader — who is granted
-- SELECT on this view only, never on auth.users directly — can use it
-- without needing any privilege on the underlying table itself.
CREATE OR REPLACE VIEW public.backup_auth_users_safe
AS
SELECT
  id,
  email,
  email_confirmed_at,
  phone,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_anonymous
FROM auth.users;

GRANT SELECT ON public.backup_auth_users_safe TO backup_reader;
