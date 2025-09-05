-- Migration: Fix deadline times to end of day
-- Description: Updates existing tasks with date-only deadlines to have 23:59 time
-- Created: 2024-12-01

-- Update existing tasks that have deadlines at 00:00 to 23:59
-- This ensures that deadlines are set to end of day instead of start of day
UPDATE public.tasks 
SET deadline = deadline + INTERVAL '23 hours 59 minutes'
WHERE deadline IS NOT NULL 
  AND EXTRACT(hour FROM deadline) = 0 
  AND EXTRACT(minute FROM deadline) = 0
  AND EXTRACT(second FROM deadline) = 0;

-- Verify the update
SELECT 
    id,
    title,
    deadline,
    EXTRACT(hour FROM deadline) as hour,
    EXTRACT(minute FROM deadline) as minute
FROM public.tasks 
WHERE deadline IS NOT NULL
ORDER BY deadline DESC
LIMIT 10;
