export type Language = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja';

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

// Premium Features:
// - Unlimited AI chat messages (Free: 5/day)
// - Weekly mood insights & analytics
// - Priority AI responses
// - All wellness games unlocked
// - Export journal entries

export const FREE_MESSAGES_PER_DAY = 10;

export const LANGUAGES: { code: Language; name: string; native: string }[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
];
