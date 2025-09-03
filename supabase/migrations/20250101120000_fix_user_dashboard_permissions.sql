-- Fix RLS policies for user dashboard access
-- Ensure regular users can view active problem statements without admin check

-- Drop and recreate the problem statements policy for regular users
DROP POLICY IF EXISTS "Anyone can view active problem statements" ON public.problem_statements;
CREATE POLICY "Anyone can view active problem statements" ON public.problem_statements
  FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

-- Ensure users can view their own submissions (this should already exist but let's be sure)
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
CREATE POLICY "Users can view own submissions" ON public.submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Add a policy for authenticated users to view problem statements in submissions join
-- This is needed for the submissions -> problem_statements join to work
DROP POLICY IF EXISTS "Authenticated users can view problem statements for submissions" ON public.problem_statements;
CREATE POLICY "Authenticated users can view problem statements for submissions" ON public.problem_statements
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Ensure feedback can be viewed by submission owners
DROP POLICY IF EXISTS "Users can view shared feedback on their submissions" ON public.feedback;
CREATE POLICY "Users can view shared feedback on their submissions" ON public.feedback
  FOR SELECT USING (
    is_shared = true AND 
    EXISTS (
      SELECT 1 FROM public.submissions 
      WHERE id = feedback.submission_id 
      AND user_id = auth.uid()
    )
  );
