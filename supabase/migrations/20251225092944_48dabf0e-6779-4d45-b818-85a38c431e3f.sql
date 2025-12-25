-- Create table to track guest trial usage
CREATE TABLE public.guest_trials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  messages_sent INTEGER NOT NULL DEFAULT 1,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public inserts/updates (no auth required for guests)
ALTER TABLE public.guest_trials ENABLE ROW LEVEL SECURITY;

-- Policy for edge function to insert/update (using service role)
CREATE POLICY "Allow service role full access" 
ON public.guest_trials 
FOR ALL 
USING (true)
WITH CHECK (true);