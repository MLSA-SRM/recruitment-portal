-- Migration: Initial schema for recruitment portal
-- Description: Creates the core tables (profiles, tasks, submissions) with proper structure
-- Created: 2024-12-01

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  ra_number text UNIQUE,
  phone_number bigint,
  department text,
  branch text,
  year integer,
  is_admin boolean NOT NULL DEFAULT false,
  domain text,
  subdomain text,
  domains text[] DEFAULT '{}',
  subdomains text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text,
  domain text NOT NULL,
  subdomain text,
  target_year integer NOT NULL,
  deadline timestamptz,
  requirements text,
  deliverables text,
  estimated_duration text,
  image_url text,
  created_by uuid REFERENCES public.profiles(id)
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  applicant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id bigint REFERENCES public.tasks(id) ON DELETE CASCADE,
  submission_url text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'rejected')),
  ai_score integer,
  ai_review text,
  ai_recommendation text CHECK (ai_recommendation IS NULL OR ai_recommendation IN ('shortlist', 'reject', 'neutral')),
  admin_review text,
  submitted_at timestamptz DEFAULT now(),
  submission_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Create submission_fields table for custom form fields
CREATE TABLE IF NOT EXISTS public.submission_fields (
  id serial PRIMARY KEY,
  task_id integer NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  field_name varchar(255) NOT NULL,
  field_type varchar(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'file', 'checkbox', 'select', 'number', 'url', 'email')),
  field_label varchar(255) NOT NULL,
  field_description text,
  is_required boolean DEFAULT false,
  field_options jsonb,
  validation_rules jsonb,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_ra_number ON public.profiles(ra_number);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_year ON public.profiles(year);
CREATE INDEX IF NOT EXISTS idx_profiles_domain ON public.profiles(domain);
CREATE INDEX IF NOT EXISTS idx_profiles_subdomain ON public.profiles(subdomain);
CREATE INDEX IF NOT EXISTS idx_profiles_domains ON public.profiles USING gin(domains);
CREATE INDEX IF NOT EXISTS idx_profiles_subdomains ON public.profiles USING gin(subdomains);

CREATE INDEX IF NOT EXISTS idx_tasks_domain_subdomain ON public.tasks(domain, subdomain);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_domain_subdomain_year ON public.tasks(domain, subdomain, target_year);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_domain_target_year ON public.tasks(domain, target_year);

CREATE INDEX IF NOT EXISTS idx_submissions_applicant ON public.submissions(applicant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task ON public.submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_ai_recommendation ON public.submissions(ai_recommendation);
CREATE INDEX IF NOT EXISTS idx_submissions_submission_data_gin ON public.submissions USING gin(submission_data);
CREATE INDEX IF NOT EXISTS idx_submissions_status_created_at ON public.submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status_pending ON public.submissions(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_submissions_applicant_status ON public.submissions(applicant_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_task_status ON public.submissions(task_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_admin_dashboard ON public.submissions(status, ai_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_ai_score_status ON public.submissions(ai_score DESC, status) WHERE ai_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_active ON public.submissions(created_at DESC) WHERE status IN ('pending', 'shortlisted');

CREATE INDEX IF NOT EXISTS idx_submission_fields_task_id ON public.submission_fields(task_id);
CREATE INDEX IF NOT EXISTS idx_submission_fields_display_order ON public.submission_fields(display_order);
CREATE INDEX IF NOT EXISTS idx_submission_fields_task_display ON public.submission_fields(task_id, display_order);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_fields ENABLE ROW LEVEL SECURITY;
