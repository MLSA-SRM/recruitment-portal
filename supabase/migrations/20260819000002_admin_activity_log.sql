-- Migration: Admin activity log
-- Description: Records admin actions (status changes, deletes, task edits) for audit purposes
-- Created: 2026-08-19

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON public.admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON public.admin_activity_log(admin_id);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_activity_log_select_admin" ON public.admin_activity_log
FOR SELECT USING (is_admin_simple());

CREATE POLICY "admin_activity_log_insert_admin" ON public.admin_activity_log
FOR INSERT WITH CHECK (is_admin_simple());
