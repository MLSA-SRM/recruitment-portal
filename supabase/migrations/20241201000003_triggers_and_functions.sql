-- Migration: Triggers and utility functions
-- Description: Creates safe updated_at triggers and utility functions
-- Created: 2024-12-01

-- Create safe trigger functions that prevent recursion
CREATE OR REPLACE FUNCTION public.safe_update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update updated_at if it's not being explicitly set
  IF TG_OP = 'UPDATE' AND NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.safe_update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update updated_at if it's not being explicitly set
  IF TG_OP = 'UPDATE' AND NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.safe_update_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update updated_at if it's not being explicitly set
  IF TG_OP = 'UPDATE' AND NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.safe_update_submission_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update updated_at if it's not being explicitly set
  IF TG_OP = 'UPDATE' AND NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create safe BEFORE UPDATE triggers
CREATE TRIGGER safe_update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.safe_update_profiles_updated_at();

CREATE TRIGGER safe_update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.safe_update_tasks_updated_at();

CREATE TRIGGER safe_update_submissions_updated_at
    BEFORE UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.safe_update_submissions_updated_at();

CREATE TRIGGER safe_update_submission_fields_updated_at
    BEFORE UPDATE ON public.submission_fields
    FOR EACH ROW
    EXECUTE FUNCTION public.safe_update_submission_fields_updated_at();
