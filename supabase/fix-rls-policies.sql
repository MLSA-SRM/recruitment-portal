-- Fix RLS Policies for Tasks Table
-- This script ensures that admin users can properly create, read, update, and delete tasks

-- 1. First, let's check if the user is an admin
-- We'll create a function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "tasks_read_all" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_select_all" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_delete" ON public.tasks;

-- 3. Create comprehensive policies for tasks table

-- Policy for reading tasks (all authenticated users can read)
CREATE POLICY "tasks_read_all" ON public.tasks
FOR SELECT USING (true);

-- Policy for inserting tasks (only admins can insert)
CREATE POLICY "admin_tasks_insert" ON public.tasks
FOR INSERT WITH CHECK (
  is_admin(auth.uid())
);

-- Policy for updating tasks (only admins can update)
CREATE POLICY "admin_tasks_update" ON public.tasks
FOR UPDATE USING (
  is_admin(auth.uid())
);

-- Policy for deleting tasks (only admins can delete)
CREATE POLICY "admin_tasks_delete" ON public.tasks
FOR DELETE USING (
  is_admin(auth.uid())
);

-- 4. Also ensure profiles table has proper admin policies
DROP POLICY IF EXISTS "admin_profiles_select_all" ON public.profiles;
CREATE POLICY "admin_profiles_select_all" ON public.profiles
FOR SELECT USING (true);

-- 5. Verify the policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tasks'
ORDER BY policyname;

-- 6. Test if the current user can insert (run this to verify)
-- This will show if the current user is an admin
SELECT 
    auth.uid() as current_user_id,
    p.name,
    p.is_admin,
    is_admin(auth.uid()) as can_create_tasks
FROM public.profiles p
WHERE p.id = auth.uid();
