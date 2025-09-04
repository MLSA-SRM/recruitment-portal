-- Migration: Enhance submission data storage for multiple fields
-- This script adds proper storage for all submission field data

-- 1. Add submission_data JSONB column if it doesn't exist
DO $$ 
BEGIN
    -- Add submission_data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'submission_data') THEN
        ALTER TABLE public.submissions ADD COLUMN submission_data JSONB DEFAULT '{}';
    END IF;
END $$;

-- 2. Create index for submission_data for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_submission_data ON public.submissions USING GIN (submission_data);

-- 3. Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' AND column_name = 'submission_data';

-- 4. Show current submissions table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;
