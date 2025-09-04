-- Migration: 20241201000005_add_task_fields.sql
-- Description: Add missing columns to tasks table
-- Author: System
-- Date: 2024-12-01

-- Add missing columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS estimated_duration text,
ADD COLUMN IF NOT EXISTS requirements text,
ADD COLUMN IF NOT EXISTS deliverables text;

-- Add comments for documentation
COMMENT ON COLUMN public.tasks.estimated_duration IS 'Estimated time duration for task completion';
COMMENT ON COLUMN public.tasks.requirements IS 'Specific skills, tools, or knowledge required';
COMMENT ON COLUMN public.tasks.deliverables IS 'Expected deliverables and submission requirements';
