-- Migration: Support multiple domains and subdomains for profiles
-- This migration changes the domain and subdomain fields to support arrays

-- First, let's add new columns for storing arrays
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS domains text[],
ADD COLUMN IF NOT EXISTS subdomains text[];

-- Migrate existing single domain/subdomain data to arrays
UPDATE public.profiles 
SET 
  domains = CASE 
    WHEN domain IS NOT NULL AND domain != '' THEN ARRAY[domain]
    ELSE NULL
  END,
  subdomains = CASE 
    WHEN subdomain IS NOT NULL AND subdomain != '' THEN ARRAY[subdomain]
    ELSE NULL
  END
WHERE domain IS NOT NULL OR subdomain IS NOT NULL;

-- Create indexes for better performance with array operations
CREATE INDEX IF NOT EXISTS idx_profiles_domains ON public.profiles USING GIN (domains);
CREATE INDEX IF NOT EXISTS idx_profiles_subdomains ON public.profiles USING GIN (subdomains);

-- Add constraints to ensure domains and subdomains are valid
-- Note: We'll handle validation in the application layer for better flexibility

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('domain', 'subdomain', 'domains', 'subdomains')
ORDER BY column_name;

-- Show sample of migrated data
SELECT id, name, domain, subdomain, domains, subdomains 
FROM public.profiles 
WHERE domains IS NOT NULL OR subdomains IS NOT NULL
LIMIT 5;
