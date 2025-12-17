import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const chatService = {
  async sendMessage(messages: ChatMessage[]): Promise<string> {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { messages },
    });

    if (error) {
      console.error('Chat service error:', error);
      throw new Error(error.message || 'Failed to get response');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data?.content || 'I apologize, but I could not generate a response.';
  },
};
