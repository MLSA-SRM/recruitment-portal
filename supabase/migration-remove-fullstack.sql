-- Migration: Remove "Web Development: Full Stack" subdomain
-- This migration updates existing data to replace Full Stack with Frontend and Backend

-- Update tasks table
UPDATE public.tasks 
SET subdomain = 'Web Development: Frontend'
WHERE subdomain = 'Web Development: Full Stack';

-- Update profiles table (legacy single subdomain field)
UPDATE public.profiles 
SET subdomain = 'Web Development: Frontend'
WHERE subdomain = 'Web Development: Full Stack';

-- Update profiles table (new array subdomain field)
-- Replace Full Stack with both Frontend and Backend in the array
UPDATE public.profiles 
SET subdomains = array_replace(subdomains, 'Web Development: Full Stack', 'Web Development: Frontend')
WHERE 'Web Development: Full Stack' = ANY(subdomains);

-- Add Backend to profiles that had Full Stack
UPDATE public.profiles 
SET subdomains = array_append(subdomains, 'Web Development: Backend')
WHERE 'Web Development: Frontend' = ANY(subdomains) 
  AND 'Web Development: Backend' != ALL(subdomains)
  AND 'Web Development: Full Stack' = ANY(subdomains);

-- Verify the migration
SELECT 
  'tasks' as table_name,
  subdomain,
  COUNT(*) as count
FROM public.tasks 
WHERE subdomain LIKE '%Web Development%'
GROUP BY subdomain

UNION ALL

SELECT 
  'profiles (legacy)' as table_name,
  subdomain,
  COUNT(*) as count
FROM public.profiles 
WHERE subdomain LIKE '%Web Development%'
GROUP BY subdomain

UNION ALL

SELECT 
  'profiles (array)' as table_name,
  unnest(subdomains) as subdomain,
  COUNT(*) as count
FROM public.profiles 
WHERE subdomains IS NOT NULL 
  AND 'Web Development: Frontend' = ANY(subdomains) 
  OR 'Web Development: Backend' = ANY(subdomains)
GROUP BY unnest(subdomains)
ORDER BY table_name, subdomain;
