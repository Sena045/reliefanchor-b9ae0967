-- Add IP address column to email_subscribers for rate limiting
ALTER TABLE public.email_subscribers 
ADD COLUMN IF NOT EXISTS ip_address text;

-- Create rate limiting function for email subscriptions
CREATE OR REPLACE FUNCTION public.check_email_subscription_rate_limit(p_ip_address text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) < 3
  FROM public.email_subscribers
  WHERE ip_address = p_ip_address
    AND created_at > NOW() - INTERVAL '1 hour';
$$;

-- Drop the old permissive insert policy
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.email_subscribers;

-- Create new insert policy with rate limiting
-- Note: IP address must be passed from the client and validated in the application
CREATE POLICY "Anyone can subscribe with rate limit" 
ON public.email_subscribers 
FOR INSERT 
WITH CHECK (
  -- Allow insert if rate limit check passes or if no IP provided (will be handled in app)
  (ip_address IS NULL OR public.check_email_subscription_rate_limit(ip_address))
);