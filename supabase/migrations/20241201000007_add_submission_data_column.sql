-- Migration: 20241201000007_add_submission_data_column.sql
-- Description: Add submission_data column to store custom submission field values
-- Author: System
-- Date: 2024-12-01

-- Add submission_data column to store custom submission field values as JSON
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS submission_data jsonb DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.submissions.submission_data IS 'JSON object containing custom submission field values and metadata';

-- Create index for better query performance on submission_data
CREATE INDEX IF NOT EXISTS idx_submissions_submission_data ON public.submissions USING GIN (submission_data);
