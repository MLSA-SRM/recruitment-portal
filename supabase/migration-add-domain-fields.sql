-- Migration: Add domain and subdomain fields to profiles table
-- Run this in your Supabase SQL Editor if you already have a profiles table

-- Add the domain and subdomain columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS domain text,
ADD COLUMN IF NOT EXISTS subdomain text;

-- Update existing profiles to have default domain values if needed
-- (This is optional - you can leave them as NULL for existing users)

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('domain', 'subdomain')
ORDER BY column_name;
