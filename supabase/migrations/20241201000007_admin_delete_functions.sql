-- Migration: Admin delete functions
-- Description: Creates admin-only delete functions that bypass RLS
-- Created: 2024-12-01

-- Create admin delete function for tasks
CREATE OR REPLACE FUNCTION public.delete_task_admin(task_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_task json;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Delete the task and return the deleted data
    DELETE FROM public.tasks 
    WHERE id = task_id
    RETURNING to_json(tasks.*) INTO deleted_task;

    -- Return success with deleted task data
    RETURN json_build_object(
        'success', true,
        'deleted_task', deleted_task,
        'message', 'Task deleted successfully'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_task_admin(bigint) TO authenticated;
