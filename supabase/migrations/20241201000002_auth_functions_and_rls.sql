-- Migration: Authentication functions and RLS policies
-- Description: Creates secure admin functions and non-recursive RLS policies
-- Created: 2024-12-01

-- Create secure admin check functions (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin_simple()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Direct query that bypasses RLS to prevent recursion
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Direct query without RLS interference
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = COALESCE(user_id, auth.uid()) AND is_admin = true
  );
END;
$$;

-- Create RLS policies for profiles table
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT USING ((auth.uid() = id) OR is_admin_simple());

CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING ((auth.uid() = id) OR is_admin_simple());

CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT WITH CHECK ((auth.uid() = id) OR is_admin_simple());

CREATE POLICY "admin_profiles_select_all" ON public.profiles
FOR SELECT USING (is_admin_simple());

-- Create RLS policies for tasks table
CREATE POLICY "tasks_read_all" ON public.tasks
FOR SELECT USING (true);

CREATE POLICY "admin_tasks_insert" ON public.tasks
FOR INSERT WITH CHECK (is_admin_simple());

CREATE POLICY "admin_tasks_update" ON public.tasks
FOR UPDATE USING (is_admin_simple());

CREATE POLICY "admin_tasks_delete" ON public.tasks
FOR DELETE USING (is_admin_simple());

-- Create RLS policies for submissions table
CREATE POLICY "submissions_select_own" ON public.submissions
FOR SELECT USING ((auth.uid() = applicant_id) OR is_admin_simple());

CREATE POLICY "submissions_insert_own" ON public.submissions
FOR INSERT WITH CHECK ((auth.uid() = applicant_id) OR is_admin_simple());

CREATE POLICY "admin_submissions_select_all" ON public.submissions
FOR SELECT USING (is_admin_simple());

CREATE POLICY "admin_submissions_update_all" ON public.submissions
FOR UPDATE USING (is_admin_simple());

-- Create RLS policies for submission_fields table
CREATE POLICY "applicants_read_submission_fields" ON public.submission_fields
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = submission_fields.task_id
    )
);

CREATE POLICY "admin_submission_fields_all" ON public.submission_fields
FOR ALL USING (is_admin_simple());
