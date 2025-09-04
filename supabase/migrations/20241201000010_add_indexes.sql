-- Indexes for common queries
create index if not exists idx_submissions_applicant on public.submissions(applicant_id);
create index if not exists idx_submissions_task on public.submissions(task_id);
create index if not exists idx_tasks_domain_subdomain on public.tasks(domain, subdomain);
create index if not exists idx_tasks_deadline on public.tasks(deadline);

-- Partial index for frequent status filter
create index if not exists idx_submissions_status_pending on public.submissions(status) where status = 'pending';

