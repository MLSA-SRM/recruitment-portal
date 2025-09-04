-- Migration: 20241201000006_fix_submission_fields_schema.sql
-- Description: Fix column mismatches in submission_fields table to match TypeScript types
-- Author: System
-- Date: 2024-12-01

-- Rename existing columns to match TypeScript interface
ALTER TABLE public.submission_fields 
RENAME COLUMN field_order TO display_order;

ALTER TABLE public.submission_fields 
RENAME COLUMN required TO is_required;

-- Add missing columns
ALTER TABLE public.submission_fields 
ADD COLUMN IF NOT EXISTS field_description text,
ADD COLUMN IF NOT EXISTS validation_rules jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add comments for documentation
COMMENT ON COLUMN public.submission_fields.display_order IS 'Order in which fields should be displayed in the form';
COMMENT ON COLUMN public.submission_fields.is_required IS 'Whether this field is required for submission';
COMMENT ON COLUMN public.submission_fields.field_description IS 'Help text to guide applicants';
COMMENT ON COLUMN public.submission_fields.validation_rules IS 'JSON object containing validation rules for the field';
COMMENT ON COLUMN public.submission_fields.updated_at IS 'Timestamp when the field was last updated';

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for submission_fields table
DROP TRIGGER IF EXISTS update_submission_fields_updated_at ON public.submission_fields;
CREATE TRIGGER update_submission_fields_updated_at
    BEFORE UPDATE ON public.submission_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
