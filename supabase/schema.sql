-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  ra_number text unique,
  phone_number bigint,
  department text,
  branch text,
  year int,
  domain text,
  subdomain text,
  is_admin boolean default false
);

create table if not exists public.tasks (
  id bigint primary key generated always as identity,
  created_at timestamptz default now(),
  title text not null,
  description text,
  domain text not null, -- 'Technical', 'Creatives', 'Corporate'
  subdomain text not null, -- Structured subdomain from predefined list
  target_year int not null, -- 1, 2, or 3 for both
  deadline timestamptz,
  created_by uuid references public.profiles(id)
);

create table if not exists public.submissions (
  id bigint primary key generated always as identity,
  created_at timestamptz default now(),
  applicant_id uuid references public.profiles(id) on delete cascade,
  task_id bigint references public.tasks(id) on delete cascade,
  submission_url text not null,
  status text default 'pending' not null, -- 'pending', 'shortlisted', 'rejected'
  ai_score int, -- 0-1000
  ai_review text,
  admin_review text,
  submitted_at timestamptz default now()
);

-- Enable RLS and add basic policies (adjust as needed)
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;

-- Drop policies if they already exist to avoid duplication errors
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "tasks_read_all" on public.tasks;
drop policy if exists "submissions_select_own" on public.submissions;
drop policy if exists "submissions_insert_own" on public.submissions;
drop policy if exists "admin_submissions_select_all" on public.submissions;
drop policy if exists "admin_submissions_update_all" on public.submissions;
drop policy if exists "admin_profiles_select_all" on public.profiles;
drop policy if exists "admin_tasks_select_all" on public.tasks;

-- Profiles: users can read/update their own profile; admins can manage via separate role
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

-- Tasks: readable by all authenticated users
create policy "tasks_read_all" on public.tasks
for select using (true);

-- Submissions: users can read their own; insert their own; update only by admins (adjust later)
create policy "submissions_select_own" on public.submissions
for select using (auth.uid() = applicant_id);
create policy "submissions_insert_own" on public.submissions
for insert with check (auth.uid() = applicant_id);

-- Admin policies for reading all submissions and updating statuses
create policy "admin_submissions_select_all" on public.submissions
for select using (true);
create policy "admin_submissions_update_all" on public.submissions
for update using (true);

-- Admin policies for reading all profiles and tasks
create policy "admin_profiles_select_all" on public.profiles
for select using (true);
create policy "admin_tasks_select_all" on public.tasks
for select using (true);

-- Admin policies for task management
create policy "admin_tasks_insert" on public.tasks
for insert with check (true);
create policy "admin_tasks_update" on public.tasks
for update using (true);
create policy "admin_tasks_delete" on public.tasks
for delete using (true);
