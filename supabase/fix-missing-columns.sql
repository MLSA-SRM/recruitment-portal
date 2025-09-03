-- Comprehensive Migration: Fix all missing columns for the recruitment portal
-- This script adds all columns that the application code expects

-- 1. Fix profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS domain text,
ADD COLUMN IF NOT EXISTS subdomain text,
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Fix tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS deadline timestamptz,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS requirements text,
ADD COLUMN IF NOT EXISTS deliverables text;

-- 3. Fix submissions table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS admin_review text,
ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS submission_data JSONB DEFAULT '{}';

-- 4. Create submission_fields table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.submission_fields (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    field_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'file', 'checkbox', 'select', 'number', 'url', 'email')),
    field_label VARCHAR(255) NOT NULL,
    field_description TEXT,
    is_required BOOLEAN DEFAULT false,
    field_options JSONB,
    validation_rules JSONB,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_submission_data ON public.submissions USING GIN (submission_data);
CREATE INDEX IF NOT EXISTS idx_submission_fields_task_id ON public.submission_fields(task_id);
CREATE INDEX IF NOT EXISTS idx_submission_fields_display_order ON public.submission_fields(display_order);

-- 6. Enable RLS on submission_fields
ALTER TABLE public.submission_fields ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS policies for submission_fields
DROP POLICY IF EXISTS "admin_submission_fields_all" ON public.submission_fields;
CREATE POLICY "admin_submission_fields_all" ON public.submission_fields
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = true
    )
);

DROP POLICY IF EXISTS "applicants_read_submission_fields" ON public.submission_fields;
CREATE POLICY "applicants_read_submission_fields" ON public.submission_fields
FOR SELECT USING (true);

-- 8. Update existing submissions to have empty submission_data
UPDATE public.submissions 
SET submission_data = '{}' 
WHERE submission_data IS NULL;

-- 9. Make submission_data NOT NULL after setting defaults
ALTER TABLE public.submissions 
ALTER COLUMN submission_data SET NOT NULL;

-- 10. Verify all columns were added
SELECT 'profiles' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('domain', 'subdomain', 'is_admin')
ORDER BY column_name;

SELECT 'tasks' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('deadline', 'created_by', 'requirements', 'deliverables')
ORDER BY column_name;

SELECT 'submissions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'submissions' 
AND column_name IN ('admin_review', 'submitted_at', 'submission_data')
ORDER BY column_name;

SELECT 'submission_fields' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'submission_fields'
ORDER BY ordinal_position;
