-- Fix admin email case sensitivity in RLS policies
-- Replace MSAsrm.in with mlsasrm.in in all policies

-- Update problem_statements admin policy
DROP POLICY IF EXISTS "Admins can manage problem statements" ON public.problem_statements;
CREATE POLICY "Admins can manage problem statements" ON public.problem_statements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'hello@mlsasrm.in' OR 
        email = 'admin@mlsasrm.in' OR 
        email LIKE '%@admin.srm.edu.in'
      )
    )
  );

-- Update submissions admin view policy
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.submissions;
CREATE POLICY "Admins can view all submissions" ON public.submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'hello@mlsasrm.in' OR 
        email = 'admin@mlsasrm.in' OR 
        email LIKE '%@admin.srm.edu.in'
      )
    )
  );

-- Update submissions admin update policy
DROP POLICY IF EXISTS "Admins can update all submissions" ON public.submissions;
CREATE POLICY "Admins can update all submissions" ON public.submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'hello@mlsasrm.in' OR 
        email = 'admin@mlsasrm.in' OR 
        email LIKE '%@admin.srm.edu.in'
      )
    )
  );

-- Update feedback admin policy
DROP POLICY IF EXISTS "Admins can manage all feedback" ON public.feedback;
CREATE POLICY "Admins can manage all feedback" ON public.feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'hello@mlsasrm.in' OR 
        email = 'admin@mlsasrm.in' OR 
        email LIKE '%@admin.srm.edu.in'
      )
    )
  );

-- Add admin policy for profiles table so admin can see all users
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR -- Users can see their own profile
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'hello@mlsasrm.in' OR 
        email = 'admin@mlsasrm.in' OR 
        email LIKE '%@admin.srm.edu.in'
      )
    )
  );
