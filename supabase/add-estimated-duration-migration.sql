-- Migration: Add estimated_duration column to tasks table
-- This script adds the estimated_duration field for auto-calculated duration based on deadline

-- Add estimated_duration column to tasks table if it doesn't exist
DO $$ 
BEGIN
    -- Add estimated_duration column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'estimated_duration') THEN
        ALTER TABLE public.tasks ADD COLUMN estimated_duration text;
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'estimated_duration';
