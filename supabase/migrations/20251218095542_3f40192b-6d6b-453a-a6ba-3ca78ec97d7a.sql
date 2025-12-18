-- Fix email_subscribers: Add explicit comment and clearer policy naming
DROP POLICY IF EXISTS "Service role can read subscribers" ON public.email_subscribers;

-- Create a clearer policy that explicitly blocks public reads
CREATE POLICY "Block public reads - service role only via dashboard"
ON public.email_subscribers
FOR SELECT
USING (false);

-- Fix referrals table: Add UPDATE and DELETE policies
-- Allow referrers to update their own referral records (e.g., mark as rewarded)
CREATE POLICY "Users can update own referrals as referrer"
ON public.referrals
FOR UPDATE
USING (auth.uid() = referrer_id);

-- Allow users to delete referral records they created
CREATE POLICY "Users can delete referrals they created"
ON public.referrals
FOR DELETE
USING (auth.uid() = referrer_id);