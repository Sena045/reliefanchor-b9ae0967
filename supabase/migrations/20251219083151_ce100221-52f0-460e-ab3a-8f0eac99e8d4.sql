-- Allow users to look up a profile by referral code (for applying referrals)
CREATE POLICY "Anyone can lookup profiles by referral code"
ON public.profiles
FOR SELECT
USING (referral_code IS NOT NULL);