-- Migration: 20241201000004_fix_rls_recursion.sql
-- Description: Fix infinite recursion in RLS policies
-- Author: System
-- Date: 2024-12-01

-- Drop all existing admin policies that cause recursion
DROP POLICY IF EXISTS "admin_profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "admin_profiles_update_all" ON public.profiles;
DROP POLICY IF EXISTS "admin_tasks_select_all" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_delete" ON public.tasks;
DROP POLICY IF EXISTS "admin_submissions_select_all" ON public.submissions;
DROP POLICY IF EXISTS "admin_submissions_update_all" ON public.submissions;
DROP POLICY IF EXISTS "admin_submission_fields_manage" ON public.submission_fields;
DROP POLICY IF EXISTS "admin_submission_field_values_select_all" ON public.submission_field_values;

-- Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate admin policies using the function to avoid recursion
CREATE POLICY "admin_profiles_select_all" ON public.profiles
FOR SELECT USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_profiles_update_all" ON public.profiles
FOR UPDATE USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_tasks_select_all" ON public.tasks
FOR SELECT USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_tasks_insert" ON public.tasks
FOR INSERT WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "admin_tasks_update" ON public.tasks
FOR UPDATE USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_tasks_delete" ON public.tasks
FOR DELETE USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_submissions_select_all" ON public.submissions
FOR SELECT USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_submissions_update_all" ON public.submissions
FOR UPDATE USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_submission_fields_manage" ON public.submission_fields
FOR ALL USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_submission_field_values_select_all" ON public.submission_field_values
FOR SELECT USING (is_admin_user(auth.uid()));

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;
