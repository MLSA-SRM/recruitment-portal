-- Safe Migration Script - Only adds missing elements
-- This script is safe to run multiple times

-- 1. Add missing columns to profiles table (if they don't exist)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS domain text,
ADD COLUMN IF NOT EXISTS subdomain text;

-- 2. Add missing RLS policies (only if they don't exist)
-- Check and create profiles_insert_own policy only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'profiles_insert_own'
    ) THEN
        CREATE POLICY "profiles_insert_own" ON public.profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 3. Verify the current state
SELECT 
    'profiles' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('domain', 'subdomain', 'is_admin')
ORDER BY column_name;

-- 4. Show existing policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
