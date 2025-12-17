-- Add UPDATE policy to mood_entries for security
CREATE POLICY "Users can update own moods" 
ON public.mood_entries 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy to journal_entries for consistency
CREATE POLICY "Users can update own journals" 
ON public.journal_entries 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);