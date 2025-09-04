-- Add image_url column to tasks for task illustration/attachments
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS image_url text;


