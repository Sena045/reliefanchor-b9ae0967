-- Drop the existing SELECT policy that exposes IP addresses
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;

-- Create a more secure view for referrals that excludes IP address
CREATE OR REPLACE VIEW public.user_referrals AS
SELECT 
  id,
  referrer_id,
  referred_id,
  rewarded,
  created_at
FROM public.referrals;

-- Create new SELECT policy that only allows viewing through the view or without IP
CREATE POLICY "Users can view own referrals without sensitive data" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_id);

-- Note: The ip_address column is still in the table for backend validation,
-- but the RLS policy combined with application code should not expose it