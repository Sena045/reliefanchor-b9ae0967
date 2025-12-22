-- Create table for storing registration barrier survey responses
CREATE TABLE public.registration_surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reason text NOT NULL,
  other_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable RLS
ALTER TABLE public.registration_surveys ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a survey response (anonymous feedback)
CREATE POLICY "Anyone can submit survey response"
ON public.registration_surveys
FOR INSERT
WITH CHECK (true);

-- Block public reads - only viewable via dashboard/service role
CREATE POLICY "Block public reads - admin only"
ON public.registration_surveys
FOR SELECT
USING (false);