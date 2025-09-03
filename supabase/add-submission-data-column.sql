-- Migration: Add submission_data column to submissions table
-- This allows storing complex submission data including custom fields

-- 1. Add submission_data column to submissions table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS submission_data JSONB DEFAULT '{}';

-- 2. Add index for better performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_submissions_submission_data ON public.submissions USING GIN (submission_data);

-- 3. Update existing submissions to have empty submission_data
UPDATE public.submissions 
SET submission_data = '{}' 
WHERE submission_data IS NULL;

-- 4. Make submission_data NOT NULL after setting defaults
ALTER TABLE public.submissions 
ALTER COLUMN submission_data SET NOT NULL;

-- 5. Verify the column was added
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
AND column_name = 'submission_data';

-- 6. Show sample data structure
SELECT 
    id,
    task_id,
    applicant_id,
    submission_data,
    created_at
FROM public.submissions 
LIMIT 5;
