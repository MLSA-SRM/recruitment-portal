-- Fix trigger recursion issue that causes stack depth limit exceeded
-- This script fixes the problematic trigger that might be causing infinite recursion

-- 1. Drop the problematic trigger
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;

-- 2. Create a safer trigger function that prevents recursion
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the updated_at field is actually being changed
    -- This prevents infinite recursion
    IF TG_OP = 'UPDATE' AND OLD.updated_at IS DISTINCT FROM NEW.updated_at THEN
        -- If updated_at is being explicitly set, don't override it
        RETURN NEW;
    END IF;
    
    -- Set updated_at to current timestamp
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Recreate the trigger with the safer function
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Also fix any potential RLS policy issues that might cause recursion
-- Drop and recreate admin task update policy to ensure it's clean
DROP POLICY IF EXISTS "admin_tasks_update" ON public.tasks;

CREATE POLICY "admin_tasks_update" ON public.tasks
FOR UPDATE USING (
    -- Allow admins to update tasks
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- 5. Verify the trigger is working correctly
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tasks' 
AND trigger_name = 'update_tasks_updated_at';
