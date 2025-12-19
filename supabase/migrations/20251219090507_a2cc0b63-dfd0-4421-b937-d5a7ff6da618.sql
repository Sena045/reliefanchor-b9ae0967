-- Drop the security definer view as it's flagged as a security issue
DROP VIEW IF EXISTS public.user_referrals;

-- The RLS policy is already in place and the ip_address column
-- should simply not be selected in the application code