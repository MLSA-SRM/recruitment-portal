-- Performance optimization migration for 1000+ users
-- This migration adds critical indexes and optimizations

-- 1. Add missing indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_submissions_status_created_at ON public.submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_applicant_status ON public.submissions(applicant_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_task_status ON public.submissions(task_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_ra_number ON public.profiles(ra_number);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_domain_target_year ON public.tasks(domain, target_year);

-- 2. Composite indexes for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_submissions_admin_dashboard ON public.submissions(status, ai_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_ai_score_status ON public.submissions(ai_score DESC, status) WHERE ai_score IS NOT NULL;

-- 3. Optimize submission_fields queries
CREATE INDEX IF NOT EXISTS idx_submission_fields_task_display ON public.submission_fields(task_id, display_order);

-- 4. Add indexes for filtering operations
CREATE INDEX IF NOT EXISTS idx_profiles_year ON public.profiles(year);
CREATE INDEX IF NOT EXISTS idx_profiles_domain ON public.profiles(domain);
CREATE INDEX IF NOT EXISTS idx_profiles_subdomain ON public.profiles(subdomain);

-- 5. Add partial indexes for active data
CREATE INDEX IF NOT EXISTS idx_submissions_active ON public.submissions(created_at DESC) WHERE status IN ('pending', 'shortlisted');
-- The following index is invalid because NOW() is not IMMUTABLE. 
-- Instead, create an index only for rows where deadline IS NULL, which is allowed.
CREATE INDEX IF NOT EXISTS idx_tasks_active_deadline_null ON public.tasks(created_at DESC) WHERE deadline IS NULL;
-- For queries involving "deadline > NOW()", rely on a regular index on deadline for performance:
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);

-- 6. Optimize text search (if using full-text search in future)
-- CREATE INDEX IF NOT EXISTS idx_profiles_name_gin ON public.profiles USING gin(to_tsvector('english', name));
-- CREATE INDEX IF NOT EXISTS idx_tasks_title_gin ON public.tasks USING gin(to_tsvector('english', title));

-- 7. Add statistics for query planner
ANALYZE public.profiles;
ANALYZE public.tasks;
ANALYZE public.submissions;
ANALYZE public.submission_fields;
