import { AppState, MoodEntry, ChatMessage, JournalEntry, UserSettings } from '@/types';

const STORAGE_KEY = 'reliefanchor_data';

const defaultSettings: UserSettings = {
  language: 'en',
  isPremium: false,
  premiumUntil: null,
  messagesUsedToday: 0,
  lastMessageDate: new Date().toDateString(),
};

const defaultState: AppState = {
  settings: defaultSettings,
  moods: [],
  chats: [],
  journals: [],
};

export const storageService = {
  getState(): AppState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return defaultState;
      
      const parsed = JSON.parse(stored) as AppState;
      
      // Reset daily message count if new day
      const today = new Date().toDateString();
      if (parsed.settings.lastMessageDate !== today) {
        parsed.settings.messagesUsedToday = 0;
        parsed.settings.lastMessageDate = today;
        this.saveState(parsed);
      }
      
      // Check if premium expired
      if (parsed.settings.isPremium && parsed.settings.premiumUntil) {
        if (Date.now() > parsed.settings.premiumUntil) {
          parsed.settings.isPremium = false;
          parsed.settings.premiumUntil = null;
          this.saveState(parsed);
        }
      }
      
      return parsed;
    } catch {
      return defaultState;
    }
  },

  saveState(state: AppState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  },

  updateSettings(updates: Partial<UserSettings>): UserSettings {
    const state = this.getState();
    state.settings = { ...state.settings, ...updates };
    this.saveState(state);
    return state.settings;
  },

  addMood(entry: Omit<MoodEntry, 'id'>): MoodEntry {
    const state = this.getState();
    const newEntry: MoodEntry = { ...entry, id: crypto.randomUUID() };
    state.moods.unshift(newEntry);
    this.saveState(state);
    return newEntry;
  },

  getMoods(days: number = 30): MoodEntry[] {
    const state = this.getState();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return state.moods.filter(m => m.timestamp >= cutoff);
  },

  addChat(message: Omit<ChatMessage, 'id'>): ChatMessage {
    const state = this.getState();
    const newMessage: ChatMessage = { ...message, id: crypto.randomUUID() };
    state.chats.push(newMessage);
    this.saveState(state);
    return newMessage;
  },

  getChats(): ChatMessage[] {
    return this.getState().chats;
  },

  clearChats(): void {
    const state = this.getState();
    state.chats = [];
    this.saveState(state);
  },

  incrementMessageCount(): number {
    const state = this.getState();
    state.settings.messagesUsedToday += 1;
    this.saveState(state);
    return state.settings.messagesUsedToday;
  },

  addJournal(entry: Omit<JournalEntry, 'id'>): JournalEntry {
    const state = this.getState();
    const newEntry: JournalEntry = { ...entry, id: crypto.randomUUID() };
    state.journals.unshift(newEntry);
    this.saveState(state);
    return newEntry;
  },

  getJournals(): JournalEntry[] {
    return this.getState().journals;
  },

  setPremium(durationDays: number = 365): void {
    const state = this.getState();
    state.settings.isPremium = true;
    state.settings.premiumUntil = Date.now() + durationDays * 24 * 60 * 60 * 1000;
    this.saveState(state);
  },

  canSendMessage(): boolean {
    const state = this.getState();
    if (state.settings.isPremium) return true;
    return state.settings.messagesUsedToday < 5;
  },

  getRemainingMessages(): number {
    const state = this.getState();
    if (state.settings.isPremium) return Infinity;
    return Math.max(0, 5 - state.settings.messagesUsedToday);
  },
};
