-- Migration: Add Enhanced Task Fields
-- This script adds the new fields we introduced for better task management

-- 1. Add missing columns to tasks table if they don't exist
DO $$ 
BEGIN
    -- Add deadline column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'deadline') THEN
        ALTER TABLE public.tasks ADD COLUMN deadline timestamptz;
    END IF;

    -- Add requirements column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'requirements') THEN
        ALTER TABLE public.tasks ADD COLUMN requirements text;
    END IF;

    -- Add deliverables column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'deliverables') THEN
        ALTER TABLE public.tasks ADD COLUMN deliverables text;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'updated_at') THEN
        ALTER TABLE public.tasks ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 2. Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists to avoid duplication
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;

-- Create trigger for tasks table
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Verify the current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- 4. Show sample data to verify structure
SELECT 
    id,
    title,
    domain,
    subdomain,
    target_year,
    deadline,
    requirements,
    deliverables,
    created_at,
    updated_at
FROM public.tasks 
LIMIT 5;
