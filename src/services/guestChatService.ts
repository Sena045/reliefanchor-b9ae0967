const GUEST_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guest-chat`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const guestChatService = {
  async sendMessage(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(GUEST_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error === 'GUEST_LIMIT_REACHED') {
        throw new Error('GUEST_LIMIT_REACHED');
      }
      throw new Error(data.error || 'Failed to get response');
    }

    return data.content || 'I apologize, but I could not generate a response.';
  },
};
