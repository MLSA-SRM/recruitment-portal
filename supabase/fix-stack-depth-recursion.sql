-- Comprehensive Fix for Stack Depth Recursion Issue
-- This script resolves the "stack depth limit exceeded" error by cleaning up
-- conflicting triggers and RLS policies that cause infinite recursion

-- 1. Drop ALL existing triggers that might cause recursion
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS submission_fields_updated_at ON public.submission_fields;

-- 2. Drop ALL existing admin policies that might cause recursion
DROP POLICY IF EXISTS "admin_profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "admin_profiles_update_all" ON public.profiles;
DROP POLICY IF EXISTS "admin_tasks_select_all" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_delete" ON public.tasks;
DROP POLICY IF EXISTS "admin_submissions_select_all" ON public.submissions;
DROP POLICY IF EXISTS "admin_submissions_update_all" ON public.submissions;
DROP POLICY IF EXISTS "admin_submission_fields_all" ON public.submission_fields;
DROP POLICY IF EXISTS "admin_submission_fields_manage" ON public.submission_fields;
DROP POLICY IF EXISTS "admin_submission_field_values_select_all" ON public.submission_field_values;

-- 3. Drop existing functions that might cause recursion
DROP FUNCTION IF EXISTS is_admin(uuid);
DROP FUNCTION IF EXISTS is_admin_user(uuid);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_submission_fields_updated_at();

-- 4. Create a clean, non-recursive admin check function
CREATE OR REPLACE FUNCTION is_admin_check(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Use a simple, direct query without any function calls
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Create a safe trigger function for tasks
CREATE OR REPLACE FUNCTION safe_update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if this is not already an updated_at change
  IF TG_OP = 'UPDATE' AND OLD.updated_at IS DISTINCT FROM NEW.updated_at THEN
    RETURN NEW;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a safe trigger function for submission_fields
CREATE OR REPLACE FUNCTION safe_update_submission_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if this is not already an updated_at change
  IF TG_OP = 'UPDATE' AND OLD.updated_at IS DISTINCT FROM NEW.updated_at THEN
    RETURN NEW;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Recreate triggers with safe functions
CREATE TRIGGER safe_update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION safe_update_tasks_updated_at();

CREATE TRIGGER safe_update_submission_fields_updated_at
    BEFORE UPDATE ON public.submission_fields
    FOR EACH ROW
    EXECUTE FUNCTION safe_update_submission_fields_updated_at();

-- 8. Recreate clean RLS policies using the safe function
-- Profiles policies
CREATE POLICY "admin_profiles_select_all" ON public.profiles
FOR SELECT USING (is_admin_check(auth.uid()));

CREATE POLICY "admin_profiles_update_all" ON public.profiles
FOR UPDATE USING (is_admin_check(auth.uid()));

-- Tasks policies
CREATE POLICY "admin_tasks_select_all" ON public.tasks
FOR SELECT USING (is_admin_check(auth.uid()));

CREATE POLICY "admin_tasks_insert" ON public.tasks
FOR INSERT WITH CHECK (is_admin_check(auth.uid()));

CREATE POLICY "admin_tasks_update" ON public.tasks
FOR UPDATE USING (is_admin_check(auth.uid()));

CREATE POLICY "admin_tasks_delete" ON public.tasks
FOR DELETE USING (is_admin_check(auth.uid()));

-- Submissions policies
CREATE POLICY "admin_submissions_select_all" ON public.submissions
FOR SELECT USING (is_admin_check(auth.uid()));

CREATE POLICY "admin_submissions_update_all" ON public.submissions
FOR UPDATE USING (is_admin_check(auth.uid()));

-- Submission fields policies
CREATE POLICY "admin_submission_fields_all" ON public.submission_fields
FOR ALL USING (is_admin_check(auth.uid()));

-- 9. Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin_check(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION safe_update_tasks_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION safe_update_submission_fields_updated_at() TO authenticated;

-- 10. Verify the fix by checking for any remaining problematic triggers
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('tasks', 'submission_fields')
ORDER BY event_object_table, trigger_name;

-- 11. Verify RLS policies are clean
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('tasks', 'submission_fields', 'profiles', 'submissions')
ORDER BY tablename, policyname;
