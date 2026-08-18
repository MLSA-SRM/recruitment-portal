-- Migration: Grant admin privileges to the MLSA admin account
-- Description: Creates a profiles row with is_admin=true for the admin login
-- Created: 2026-08-19

INSERT INTO public.profiles (id, name, is_admin)
SELECT id, 'MLSA Admin', true
FROM auth.users
WHERE email = 'mlsasrm14@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true;
