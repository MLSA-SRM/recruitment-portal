-- Quick Fix: Allow authenticated users to manage tasks
-- Run this in your Supabase SQL Editor to fix delete and edit issues

-- 1. Temporarily disable RLS on tasks table for testing
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- 2. Or create simple policies that allow authenticated users to manage tasks
-- (Uncomment the lines below if you prefer policies over disabling RLS)

/*
-- Drop existing policies
DROP POLICY IF EXISTS "admin_tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "admin_tasks_delete" ON public.tasks;

-- Create simple policies for authenticated users
CREATE POLICY "tasks_insert_auth" ON public.tasks
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tasks_update_auth" ON public.tasks
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "tasks_delete_auth" ON public.tasks
FOR DELETE USING (auth.uid() IS NOT NULL);
*/

-- 3. Verify the current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'tasks';

-- 4. Test if you can now insert/update/delete
-- Try creating a test task to verify permissions
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline)
VALUES ('Test Task', 'Test Description', 'Technical', 'Web Development: Frontend', 1, '2024-12-31')
ON CONFLICT DO NOTHING;

-- 5. Check if the test task was created
SELECT * FROM public.tasks WHERE title = 'Test Task';

-- 6. Clean up test task
DELETE FROM public.tasks WHERE title = 'Test Task';
