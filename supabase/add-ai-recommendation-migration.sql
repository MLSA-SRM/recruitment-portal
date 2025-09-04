-- Migration: Add ai_recommendation column to submissions table
-- This script adds the ai_recommendation field to store AI's recommendation (shortlist/reject/neutral)

-- Add ai_recommendation column to submissions table if it doesn't exist
DO $$ 
BEGIN
    -- Add ai_recommendation column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'ai_recommendation') THEN
        ALTER TABLE public.submissions ADD COLUMN ai_recommendation text CHECK (ai_recommendation IN ('shortlist', 'reject', 'neutral'));
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    check_clause
FROM information_schema.columns 
WHERE table_name = 'submissions' AND column_name = 'ai_recommendation';
