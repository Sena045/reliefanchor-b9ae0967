-- Add last_active_at column to track user activity
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now();

-- Add email column to profiles for sending emails (from auth.users)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;