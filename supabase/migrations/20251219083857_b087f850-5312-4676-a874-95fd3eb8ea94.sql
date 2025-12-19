-- Remove the overly permissive policy that exposes profile data
DROP POLICY IF EXISTS "Anyone can lookup profiles by referral code" ON public.profiles;