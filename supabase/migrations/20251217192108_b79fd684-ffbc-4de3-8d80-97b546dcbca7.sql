-- Create email subscribers table for marketing
CREATE TABLE public.email_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'landing_page'
);

-- Enable RLS
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup)
CREATE POLICY "Anyone can subscribe" 
ON public.email_subscribers 
FOR INSERT 
WITH CHECK (true);

-- Only service role can read (for admin/export)
CREATE POLICY "Service role can read subscribers" 
ON public.email_subscribers 
FOR SELECT 
USING (false);