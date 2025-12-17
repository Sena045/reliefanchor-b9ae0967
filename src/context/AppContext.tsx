import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UserSettings, Language, MoodEntry, ChatMessage, JournalEntry } from '@/types';
import { storageService } from '@/services/storageService';
import { chatService } from '@/services/chatService';

interface AppContextType {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  setLanguage: (language: Language) => void;
  
  isPremium: boolean;
  activatePremium: () => void;
  
  canSendMessage: boolean;
  remainingMessages: number;
  sendMessage: (content: string) => Promise<string>;
  chatHistory: ChatMessage[];
  clearChat: () => void;
  
  addMood: (mood: MoodEntry['mood'], note: string) => void;
  getMoods: (days?: number) => MoodEntry[];
  
  addJournal: (prompt: string, content: string) => void;
  journals: JournalEntry[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getState().settings);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => storageService.getChats());
  const [journals, setJournals] = useState<JournalEntry[]>(() => storageService.getJournals());
  
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    const newSettings = storageService.updateSettings(updates);
    setSettings(newSettings);
  }, []);
  
  const setLanguage = useCallback((language: Language) => {
    updateSettings({ language });
  }, [updateSettings]);
  
  const activatePremium = useCallback(() => {
    storageService.setPremium(365);
    setSettings(prev => ({ ...prev, isPremium: true, premiumUntil: Date.now() + 365 * 24 * 60 * 60 * 1000 }));
  }, []);
  
  const sendMessage = useCallback(async (content: string): Promise<string> => {
    if (!storageService.canSendMessage()) {
      throw new Error('PAYWALL');
    }
    
    const userMessage = storageService.addChat({ role: 'user', content, timestamp: Date.now() });
    setChatHistory(prev => [...prev, userMessage]);
    
    storageService.incrementMessageCount();
    const currentSettings = storageService.getState().settings;
    setSettings(currentSettings);
    
    const allMessages = [...chatHistory, userMessage].map(m => ({ role: m.role, content: m.content }));
    const response = await chatService.sendMessage(allMessages, currentSettings.language);
    
    const assistantMessage = storageService.addChat({ role: 'assistant', content: response, timestamp: Date.now() });
    setChatHistory(prev => [...prev, assistantMessage]);
    
    return response;
  }, [chatHistory]);
  
  const clearChat = useCallback(() => {
    storageService.clearChats();
    setChatHistory([]);
  }, []);
  
  const addMood = useCallback((mood: MoodEntry['mood'], note: string) => {
    storageService.addMood({ mood, note, timestamp: Date.now() });
  }, []);
  
  const getMoods = useCallback((days?: number) => {
    return storageService.getMoods(days);
  }, []);
  
  const addJournal = useCallback((prompt: string, content: string) => {
    const entry = storageService.addJournal({ prompt, content, timestamp: Date.now() });
    setJournals(prev => [entry, ...prev]);
  }, []);
  
  const value: AppContextType = {
    settings,
    updateSettings,
    setLanguage,
    isPremium: settings.isPremium,
    activatePremium,
    canSendMessage: storageService.canSendMessage(),
    remainingMessages: storageService.getRemainingMessages(),
    sendMessage,
    chatHistory,
    clearChat,
    addMood,
    getMoods,
    addJournal,
    journals,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
