-- Migration: Add is_admin column to profiles table
-- Run this in your Supabase SQL Editor if you already have a profiles table

-- Add the is_admin column to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Update existing profiles to have is_admin = false by default
UPDATE public.profiles 
SET is_admin = false 
WHERE is_admin IS NULL;

-- Make sure the column is not nullable
ALTER TABLE public.profiles 
ALTER COLUMN is_admin SET NOT NULL;

-- Set default value for future inserts
ALTER TABLE public.profiles 
ALTER COLUMN is_admin SET DEFAULT false;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'is_admin';
