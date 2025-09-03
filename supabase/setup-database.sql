
-- Complete Database Setup Script
-- Run this in your Supabase SQL Editor to set up the database from scratch

-- Drop existing tables if they exist (WARNING: This will delete all data!)
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table with is_admin column
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  ra_number text UNIQUE,
  phone_number bigint,
  department text,
  branch text,
  year int,
  is_admin boolean DEFAULT false NOT NULL
);

-- Create tasks table
CREATE TABLE public.tasks (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text,
  domain text NOT NULL,
  subdomain text,
  target_year int NOT NULL
);

-- Create submissions table
CREATE TABLE public.submissions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  applicant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id bigint REFERENCES public.tasks(id) ON DELETE CASCADE,
  submission_url text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  ai_score int,
  ai_review text
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles: users can read/update their own profile; admins can read all
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_profiles_select_all" ON public.profiles
FOR SELECT USING (true);

-- Tasks: readable by all authenticated users
CREATE POLICY "tasks_read_all" ON public.tasks
FOR SELECT USING (true);

CREATE POLICY "admin_tasks_select_all" ON public.tasks
FOR SELECT USING (true);

-- Submissions: users can read their own; insert their own; update only by admins
CREATE POLICY "submissions_select_own" ON public.submissions
FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "submissions_insert_own" ON public.submissions
FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "admin_submissions_select_all" ON public.submissions
FOR SELECT USING (true);

CREATE POLICY "admin_submissions_update_all" ON public.submissions
FOR UPDATE USING (true);

-- Insert sample tasks
INSERT INTO public.tasks (title, description, domain, subdomain, target_year) VALUES
('Frontend Developer', 'Build a responsive web application using React and Tailwind CSS', 'Technical', 'Web Development', 2),
('UI/UX Designer', 'Design user interfaces and user experience for mobile applications', 'Technical', 'Design', 1),
('Content Writer', 'Create engaging blog posts and social media content', 'Corporate', 'Marketing', 1),
('Data Analyst', 'Analyze recruitment data and create insightful reports', 'Corporate', 'Analytics', 2),
('Backend Developer', 'Develop RESTful APIs using Node.js and Express', 'Technical', 'Backend Development', 3);

-- Verify the setup
SELECT 'Profiles table:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

SELECT 'Tasks table:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

SELECT 'Submissions table:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

SELECT 'Sample tasks:' as info;
SELECT * FROM public.tasks;
