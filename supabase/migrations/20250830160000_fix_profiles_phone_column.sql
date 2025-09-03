-- Fix profiles table phone column
-- This migration ensures the phone column exists and is properly configured

-- Add phone column if it doesn't exist (will be ignored if it already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Ensure the profiles table has all required columns
DO $$ 
BEGIN
  -- Check and add missing columns one by one
  
  -- full_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT UNIQUE NOT NULL DEFAULT '';
  END IF;
  
  -- registration_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'registration_number'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN registration_number TEXT UNIQUE NOT NULL DEFAULT '';
  END IF;
  
  -- department column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'department'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN department TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- domains column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'domains'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN domains TEXT[] DEFAULT '{}';
  END IF;
  
  -- sub_domains column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'sub_domains'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN sub_domains TEXT[] DEFAULT '{}';
  END IF;
  
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
