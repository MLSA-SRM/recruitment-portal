-- Complete Migration Script for Recruitment Portal
-- This script adds all missing fields and updates the schema

-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS domain text,
ADD COLUMN IF NOT EXISTS subdomain text;

-- 2. Add missing columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS deadline timestamptz,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- 3. Add missing columns to submissions table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS admin_review text,
ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now();

-- 4. Add missing RLS policies (only if they don't exist)
DO $$
BEGIN
    -- Check and create profiles_insert_own policy only if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'profiles_insert_own'
    ) THEN
        CREATE POLICY "profiles_insert_own" ON public.profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    -- Check and create admin task policies only if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tasks' 
        AND policyname = 'admin_tasks_insert'
    ) THEN
        CREATE POLICY "admin_tasks_insert" ON public.tasks
        FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tasks' 
        AND policyname = 'admin_tasks_update'
    ) THEN
        CREATE POLICY "admin_tasks_update" ON public.tasks
        FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tasks' 
        AND policyname = 'admin_tasks_delete'
    ) THEN
        CREATE POLICY "admin_tasks_delete" ON public.tasks
        FOR DELETE USING (true);
    END IF;
END $$;

-- 5. Verify the current state
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

SELECT 
    'tasks' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('deadline', 'created_by')
ORDER BY column_name;

SELECT 
    'submissions' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
AND column_name IN ('admin_review', 'submitted_at')
ORDER BY column_name;

-- 6. Show existing policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'tasks', 'submissions')
ORDER BY tablename, policyname;
