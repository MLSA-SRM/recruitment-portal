-- Migration: Admin delete function for submissions
-- Description: Creates admin-only delete function for submissions that bypasses RLS
-- Created: 2024-12-01

-- Create admin delete function for submissions
CREATE OR REPLACE FUNCTION public.delete_submission_admin(submission_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_submission json;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Delete the submission and return the deleted data
    DELETE FROM public.submissions 
    WHERE id = submission_id
    RETURNING to_json(submissions.*) INTO deleted_submission;

    -- Return success with deleted submission data
    RETURN json_build_object(
        'success', true,
        'deleted_submission', deleted_submission,
        'message', 'Submission deleted successfully'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_submission_admin(bigint) TO authenticated;
