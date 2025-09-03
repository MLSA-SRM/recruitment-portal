-- Quick Fix: Add missing columns only
-- This script only adds columns and won't touch existing policies

-- Add domain and subdomain columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS domain text,
ADD COLUMN IF NOT EXISTS subdomain text;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('domain', 'subdomain')
ORDER BY column_name;
