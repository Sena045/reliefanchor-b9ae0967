-- Add UPDATE policy to chat_history for security
CREATE POLICY "Users can update own chats" 
ON public.chat_history 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);