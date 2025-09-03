-- Update feedback_type check constraint to include 'comprehensive'
-- This allows the AI feedback system to use the 'comprehensive' type
-- for feedback that includes both evaluation and plagiarism checking

-- Drop the existing check constraint
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_feedback_type_check;

-- Add the new check constraint with 'comprehensive' included
ALTER TABLE public.feedback ADD CONSTRAINT feedback_feedback_type_check 
  CHECK (feedback_type IN ('evaluation', 'plagiarism_check', 'comprehensive'));
