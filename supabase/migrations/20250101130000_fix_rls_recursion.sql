-- Fix RLS infinite recursion by removing circular dependencies
-- The issue was admin policies checking profiles table while profiles table also has RLS

-- Drop problematic admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage problem statements" ON public.problem_statements;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can update all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can manage all feedback" ON public.feedback;

-- Create simplified admin policies using auth.jwt() directly
-- This avoids circular dependency with profiles table

-- Admin policy for problem_statements
CREATE POLICY "admin_manage_problem_statements" ON public.problem_statements
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'hello@MSAsrm.in',
      'admin@MSAsrm.in',
      'lk7565@srmist.edu.in'
    ) OR 
    auth.jwt() ->> 'email' LIKE '%@admin.srm.edu.in'
  );

-- Admin policies for submissions
CREATE POLICY "admin_view_all_submissions" ON public.submissions
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      'hello@MSAsrm.in',
      'admin@MSAsrm.in',
      'lk7565@srmist.edu.in'
    ) OR 
    auth.jwt() ->> 'email' LIKE '%@admin.srm.edu.in'
  );

CREATE POLICY "admin_update_all_submissions" ON public.submissions
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      'hello@MSAsrm.in',
      'admin@MSAsrm.in',
      'lk7565@srmist.edu.in'
    ) OR 
    auth.jwt() ->> 'email' LIKE '%@admin.srm.edu.in'
  );

-- Admin policy for feedback
CREATE POLICY "admin_manage_feedback" ON public.feedback
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'hello@MSAsrm.in',
      'admin@MSAsrm.in',
      'lk7565@srmist.edu.in'
    ) OR 
    auth.jwt() ->> 'email' LIKE '%@admin.srm.edu.in'
  );

-- Admin policy for profiles (to view all users in admin dashboard)
CREATE POLICY "admin_view_all_profiles" ON public.profiles
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      'hello@MSAsrm.in',
      'admin@MSAsrm.in',
      'lk7565@srmist.edu.in'
    ) OR 
    auth.jwt() ->> 'email' LIKE '%@admin.srm.edu.in'
  );
