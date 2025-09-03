-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  phone TEXT, -- Renamed from phone_number to phone
  domains TEXT[] DEFAULT '{}',
  sub_domains TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create problem_statements table
CREATE TABLE IF NOT EXISTS public.problem_statements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('Technical', 'Corporate', 'Creatives')),
  sub_domain TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE CASCADE NOT NULL,
  github_link TEXT,
  deployed_link TEXT,
  video_url TEXT,
  document_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one submission per user per problem statement
  UNIQUE(user_id, problem_statement_id)
);

-- Create feedback table (for AI-generated feedback)
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  feedback_text TEXT NOT NULL,
  feedback_type TEXT DEFAULT 'evaluation' CHECK (feedback_type IN ('evaluation', 'plagiarism_check')),
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER DEFAULT 0,
  domain TEXT,
  sub_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one entry per user per domain
  UNIQUE(user_id, domain, sub_domain)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_registration_number ON public.profiles(registration_number);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_statement_id ON public.submissions(problem_statement_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_submission_id ON public.feedback(submission_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON public.leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_domain ON public.leaderboard(domain);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);
    $policy$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);
    $policy$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can insert own profile" ON public.profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    $policy$;
  END IF;
END
$$;

-- RLS Policies for problem_statements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'problem_statements' AND policyname = 'Anyone can view active problem statements'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Anyone can view active problem statements" ON public.problem_statements
        FOR SELECT USING (is_active = true);
    $policy$;
  END IF;
END
$$;

-- Admin policy for problem_statements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'problem_statements' AND policyname = 'Admins can manage problem statements'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can manage problem statements" ON public.problem_statements
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (
              email = 'hello@MSAsrm.in' OR 
              email = 'admin@MSAsrm.in' OR 
              email LIKE '%@admin.srm.edu.in'
            )
          )
        );
    $policy$;
  END IF;
END
$$;

-- RLS Policies for submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'Users can view own submissions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view own submissions" ON public.submissions
        FOR SELECT USING (auth.uid() = user_id);
    $policy$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'Users can insert own submissions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can insert own submissions" ON public.submissions
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    $policy$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'Users can update own submissions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update own submissions" ON public.submissions
        FOR UPDATE USING (auth.uid() = user_id);
    $policy$;
  END IF;
END
$$;

-- Admin policy for submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'Admins can view all submissions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can view all submissions" ON public.submissions
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (
              email = 'hello@MSAsrm.in' OR 
              email = 'admin@MSAsrm.in' OR 
              email LIKE '%@admin.srm.edu.in'
            )
          )
        );
    $policy$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'Admins can update all submissions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can update all submissions" ON public.submissions
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (
              email = 'hello@MSAsrm.in' OR 
              email = 'admin@MSAsrm.in' OR 
              email LIKE '%@admin.srm.edu.in'
            )
          )
        );
    $policy$;
  END IF;
END
$$;

-- RLS Policies for feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'Users can view shared feedback on their submissions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view shared feedback on their submissions" ON public.feedback
        FOR SELECT USING (
          is_shared = true AND 
          EXISTS (
            SELECT 1 FROM public.submissions 
            WHERE id = feedback.submission_id 
            AND user_id = auth.uid()
          )
        );
    $policy$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback' AND policyname = 'Admins can manage all feedback'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can manage all feedback" ON public.feedback
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (
              email = 'hello@MSAsrm.in' OR 
              email = 'admin@MSAsrm.in' OR 
              email LIKE '%@admin.srm.edu.in'
            )
          )
        );
    $policy$;
  END IF;
END
$$;

-- RLS Policies for leaderboard
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboard' AND policyname = 'Anyone can view leaderboard'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard
        FOR SELECT USING (true);
    $policy$;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboard' AND policyname = 'System can update leaderboard'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "System can update leaderboard" ON public.leaderboard
        FOR ALL USING (true); -- This will be handled by server-side logic
    $policy$;
  END IF;
END
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'handle_profiles_updated_at'
  ) THEN
    CREATE TRIGGER handle_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'handle_problem_statements_updated_at'
  ) THEN
    CREATE TRIGGER handle_problem_statements_updated_at
      BEFORE UPDATE ON public.problem_statements
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'handle_submissions_updated_at'
  ) THEN
    CREATE TRIGGER handle_submissions_updated_at
      BEFORE UPDATE ON public.submissions
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'handle_feedback_updated_at'
  ) THEN
    CREATE TRIGGER handle_feedback_updated_at
      BEFORE UPDATE ON public.feedback
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'handle_leaderboard_updated_at'
  ) THEN
    CREATE TRIGGER handle_leaderboard_updated_at
      BEFORE UPDATE ON public.leaderboard
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;

-- Insert some sample problem statements
INSERT INTO public.problem_statements (title, description, domain, sub_domain, requirements) VALUES
(
  'AI-Powered Chatbot Development',
  'Create an intelligent chatbot using modern AI technologies that can assist students with academic queries and provide personalized recommendations.',
  'Technical',
  'AI/ML',
  ARRAY[
    'Implement natural language processing capabilities',
    'Create a user-friendly chat interface',
    'Deploy the solution with proper documentation',
    'Include conversation history and context awareness'
  ]
),
(
  'Modern Web Application',
  'Build a responsive web application that solves a real-world problem using modern frontend and backend technologies.',
  'Technical',
  'Web Development',
  ARRAY[
    'Use modern framework (React, Vue, or Angular)',
    'Implement responsive design',
    'Include user authentication',
    'Deploy with proper CI/CD pipeline'
  ]
),
(
  'Brand Campaign Strategy',
  'Design a comprehensive marketing campaign for a tech startup, including social media strategy, content calendar, and engagement metrics.',
  'Corporate',
  'PR & Outreach',
  ARRAY[
    'Create detailed campaign strategy document',
    'Design social media content calendar',
    'Include target audience analysis',
    'Provide measurable KPIs and success metrics'
  ]
),
(
  'Event Management System',
  'Plan and execute a virtual tech conference, including logistics, speaker coordination, and attendee engagement strategies.',
  'Corporate',
  'Event Management & Logistics',
  ARRAY[
    'Create comprehensive event timeline',
    'Design speaker and attendee management system',
    'Include budget planning and resource allocation',
    'Provide post-event analysis framework'
  ]
),
(
  'UI/UX Design Portfolio',
  'Create a comprehensive design system and portfolio showcasing your UI/UX skills through real-world project redesigns.',
  'Creatives',
  'UI/UX Design',
  ARRAY[
    'Design system with consistent components',
    'Include user research and persona development',
    'Create interactive prototypes',
    'Document design decisions and user testing results'
  ]
),
(
  'Motion Graphics Showcase',
  'Produce a series of motion graphics videos that explain complex technical concepts in an engaging and accessible way.',
  'Creatives',
  'Video Editing & Motion Graphics',
  ARRAY[
    'Create 3-5 educational motion graphics videos',
    'Include smooth transitions and professional animations',
    'Provide source files and project breakdown',
    'Demonstrate storytelling through visual design'
  ]
);
