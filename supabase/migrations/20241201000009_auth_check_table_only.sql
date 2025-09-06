-- Create auth_check table to track user onboarding status
CREATE TABLE IF NOT EXISTS public.auth_check (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_check_user_id ON public.auth_check(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_check_onboarding ON public.auth_check(is_onboarding_complete);

-- Enable RLS
ALTER TABLE public.auth_check ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own auth_check" ON public.auth_check
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own auth_check" ON public.auth_check
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own auth_check" ON public.auth_check
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create auth_check entry when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_auth_check()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.auth_check (user_id, is_onboarding_complete)
  VALUES (NEW.id, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create auth_check entry
DROP TRIGGER IF EXISTS on_auth_user_created_auth_check ON auth.users;
CREATE TRIGGER on_auth_user_created_auth_check
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_auth_check();

-- Create function to mark onboarding as complete
CREATE OR REPLACE FUNCTION public.mark_onboarding_complete(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user exists and is authenticated
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Unauthorized: Can only update your own onboarding status';
  END IF;

  -- Update the auth_check table
  UPDATE public.auth_check 
  SET is_onboarding_complete = true, updated_at = now()
  WHERE user_id = user_uuid;

  -- Return true if update was successful
  RETURN FOUND;
END;
$$;

-- Create function to check if user has completed onboarding
CREATE OR REPLACE FUNCTION public.is_onboarding_complete(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  onboarding_status boolean;
BEGIN
  -- Get onboarding status from auth_check table
  SELECT is_onboarding_complete INTO onboarding_status
  FROM public.auth_check
  WHERE user_id = user_uuid;

  -- Return false if no record found, otherwise return the status
  RETURN COALESCE(onboarding_status, false);
END;
$$;
