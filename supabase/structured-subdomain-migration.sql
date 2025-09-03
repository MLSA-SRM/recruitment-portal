-- Migration: Add Structured Subdomain Support
-- This script updates the database to support the new structured subdomain system

-- 1. Update tasks table to make subdomain required
ALTER TABLE public.tasks 
ALTER COLUMN subdomain SET NOT NULL;

-- 2. Add check constraint to ensure subdomain values are valid
-- Note: This will fail if existing tasks have invalid subdomain values
-- You may need to update existing data first

-- 3. Create a function to validate subdomain values
CREATE OR REPLACE FUNCTION validate_subdomain(domain_val text, subdomain_val text)
RETURNS boolean AS $$
BEGIN
  CASE domain_val
    WHEN 'Technical' THEN
      RETURN subdomain_val IN (
        'Web Development: Frontend',
        'Web Development: Backend',
        'Web Development: Full Stack',
        'AI/ML'
      );
    WHEN 'Corporate' THEN
      RETURN subdomain_val IN (
        'Sponsorships & Partnerships',
        'Event Management & Logistics',
        'PR & Outreach',
        'Team Operations',
        'Content Writing'
      );
    WHEN 'Creatives' THEN
      RETURN subdomain_val IN (
        'Graphic Design',
        'Video Editing & Motion Graphics',
        'UI/UX Design'
      );
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 4. Add check constraint using the validation function
-- Uncomment this after ensuring all existing data is valid
-- ALTER TABLE public.tasks 
-- ADD CONSTRAINT check_valid_subdomain 
-- CHECK (validate_subdomain(domain, subdomain));

-- 5. Verify the current state
SELECT 
    'tasks' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('domain', 'subdomain')
ORDER BY column_name;

-- 6. Show current domain/subdomain combinations
SELECT 
    domain, 
    subdomain, 
    COUNT(*) as task_count
FROM public.tasks 
GROUP BY domain, subdomain 
ORDER BY domain, subdomain;

-- 7. Show profiles with domain/subdomain
SELECT 
    domain, 
    subdomain, 
    COUNT(*) as user_count
FROM public.profiles 
WHERE domain IS NOT NULL 
GROUP BY domain, subdomain 
ORDER BY domain, subdomain;
