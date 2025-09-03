-- Comprehensive RLS Policy Fix for Recruitment Portal
-- This script ensures that admin users can properly manage all aspects of the system

-- 1. First, let's create a function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop all existing policies to recreate them properly
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "admin_profiles_select_all" ON public.profiles;

DROP POLICY IF EXISTS "tasks_read_all" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_select_all" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_delete" ON public.tasks;

DROP POLICY IF EXISTS "submissions_select_own" ON public.submissions;
DROP POLICY IF EXISTS "submissions_insert_own" ON public.submissions;
DROP POLICY IF EXISTS "admin_submissions_select_all" ON public.submissions;
DROP POLICY IF EXISTS "admin_submissions_update_all" ON public.submissions;

-- 3. Create comprehensive policies for profiles table

-- Users can read/update their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "admin_profiles_select_all" ON public.profiles
FOR SELECT USING (is_admin(auth.uid()));

-- 4. Create comprehensive policies for tasks table

-- All authenticated users can read tasks
CREATE POLICY "tasks_read_all" ON public.tasks
FOR SELECT USING (true);

-- Only admins can insert tasks
CREATE POLICY "admin_tasks_insert" ON public.tasks
FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Only admins can update tasks
CREATE POLICY "admin_tasks_update" ON public.tasks
FOR UPDATE USING (is_admin(auth.uid()));

-- Only admins can delete tasks
CREATE POLICY "admin_tasks_delete" ON public.tasks
FOR DELETE USING (is_admin(auth.uid()));

-- 5. Create comprehensive policies for submissions table

-- Users can read their own submissions
CREATE POLICY "submissions_select_own" ON public.submissions
FOR SELECT USING (auth.uid() = applicant_id);

-- Users can insert their own submissions
CREATE POLICY "submissions_insert_own" ON public.submissions
FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- Admins can read all submissions
CREATE POLICY "admin_submissions_select_all" ON public.submissions
FOR SELECT USING (is_admin(auth.uid()));

-- Admins can update all submissions
CREATE POLICY "admin_submissions_update_all" ON public.submissions
FOR UPDATE USING (is_admin(auth.uid()));

-- 6. Verify all policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. Test if the current user is an admin
SELECT 
    auth.uid() as current_user_id,
    p.name,
    p.is_admin,
    is_admin(auth.uid()) as can_manage_tasks
FROM public.profiles p
WHERE p.id = auth.uid();

-- 8. Show current table permissions
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'tasks', 'submissions')
ORDER BY table_name, privilege_type;
