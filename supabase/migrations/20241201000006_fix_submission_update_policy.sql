-- Migration: Fix submission update policy for regular users
-- Description: Add RLS policy to allow users to update their own submissions
-- Created: 2024-12-01

-- Add RLS policy for users to update their own submissions
CREATE POLICY "submissions_update_own" ON public.submissions
FOR UPDATE USING ((auth.uid() = applicant_id) OR is_admin_simple());
