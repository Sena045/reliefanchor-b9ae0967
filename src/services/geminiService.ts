import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

const SYSTEM_PROMPT = `You are Anya, a compassionate and supportive mental health companion. Your role is to:

1. Listen with empathy and validate feelings
2. Provide evidence-based coping strategies
3. Offer gentle guidance without being preachy
4. Recognize signs of crisis and suggest professional help when needed
5. Maintain a warm, conversational tone
6. Avoid giving medical diagnoses or prescribing treatments

IMPORTANT CRISIS DETECTION:
If someone mentions:
- Suicide, self-harm, or wanting to die
- Harming others
- Severe panic or psychosis symptoms
- Domestic violence or abuse

Respond with immediate compassion and STRONGLY recommend contacting crisis helplines. Include [CRISIS_DETECTED] at the start of your response.

Keep responses concise (2-3 paragraphs max) unless the user asks for more detail.
Use a warm, supportive tone. Avoid clinical language.
Remember: You're a supportive companion, not a therapist.`;

export const geminiService = {
  async initialize(apiKey: string): Promise<void> {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });
  },

  async chat(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
    if (!model) {
      throw new Error('Gemini not initialized. Please set your API key in settings.');
    }

    try {
      const chat = model.startChat({
        history: messages.slice(0, -1).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
      });

      const lastMessage = messages[messages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;
      
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to get response. Please try again.');
    }
  },

  isInitialized(): boolean {
    return model !== null;
  },
};
