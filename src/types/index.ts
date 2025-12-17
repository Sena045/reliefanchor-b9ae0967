export type Region = 'india' | 'global';
export type Language = 'en' | 'hi';

export type MoodType = 'happy' | 'calm' | 'sad' | 'anxious' | 'angry';

export interface MoodEntry {
  id: string;
  mood: MoodType;
  note: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  prompt: string;
  content: string;
  timestamp: number;
}

export interface UserSettings {
  region: Region;
  language: Language;
  isPremium: boolean;
  premiumUntil: number | null;
  messagesUsedToday: number;
  lastMessageDate: string;
}

export interface AppState {
  settings: UserSettings;
  moods: MoodEntry[];
  chats: ChatMessage[];
  journals: JournalEntry[];
}

export const CRISIS_HELPLINES = {
  india: [
    { name: 'iCall', phone: '9152987821', description: 'Professional counseling' },
    { name: 'Vandrevala Foundation', phone: '18602662345', description: '24/7 helpline' },
    { name: 'NIMHANS', phone: '08046110007', description: 'Mental health support' },
  ],
  global: [
    { name: 'National Suicide Prevention (US)', phone: '988', description: '24/7 crisis support' },
    { name: 'Crisis Text Line', phone: 'Text HOME to 741741', description: 'Text-based support' },
    { name: 'Samaritans (UK)', phone: '116123', description: '24/7 emotional support' },
  ],
};

export const PRICING = {
  india: { amount: 499, currency: 'INR', symbol: '₹' },
  global: { amount: 999, currency: 'USD', symbol: '$' },
};

export const FREE_MESSAGES_PER_DAY = 5;
