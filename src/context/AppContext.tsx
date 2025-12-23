import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Language, MoodEntry, ChatMessage, JournalEntry, FREE_MESSAGES_PER_DAY } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/hooks/useAuth';
import { referralService } from '@/services/referralService';
import { useToast } from '@/hooks/use-toast';
import { achievementService } from '@/services/achievementService';

interface UserProfile {
  language: Language;
  isPremium: boolean;
  premiumUntil: string | null;
  messagesUsedToday: number;
  lastMessageDate: string | null;
}

interface AppContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setLanguage: (language: Language) => void;
  
  isPremium: boolean;
  premiumUntil: Date | null;
  activatePremium: (plan?: 'monthly' | 'yearly') => Promise<void>;
  
  canSendMessage: boolean;
  remainingMessages: number;
  sendMessage: (content: string) => Promise<string>;
  chatHistory: ChatMessage[];
  clearChat: () => Promise<void>;
  
  addMood: (mood: MoodEntry['mood'], note: string) => Promise<void>;
  getMoods: (days?: number) => MoodEntry[];
  moods: MoodEntry[];
  
  addJournal: (prompt: string, content: string) => Promise<void>;
  journals: JournalEntry[];
  
  loading: boolean;
}

const defaultProfile: UserProfile = {
  language: 'en',
  isPremium: false,
  premiumUntil: null,
  messagesUsedToday: 0,
  lastMessageDate: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user data from Supabase
  useEffect(() => {
    if (!user) {
      setProfile(defaultProfile);
      setChatHistory([]);
      setMoods([]);
      setJournals([]);
      setLoading(false);
      return;
    }

    // Store sign-in method for future reference (helps with forgot password UX)
    const storeSignInMethod = () => {
      if (user.email && user.app_metadata?.provider === 'google') {
        localStorage.setItem(`signInMethod_${user.email}`, 'google');
      } else if (user.email && user.app_metadata?.provider === 'email') {
        localStorage.setItem(`signInMethod_${user.email}`, 'email');
      }
    };
    storeSignInMethod();

    const loadUserData = async () => {
      setLoading(true);
      try {
        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileData) {
          const today = new Date().toISOString().split('T')[0];
          const isNewDay = profileData.last_message_date !== today;
          
          // Check if premium has expired
          const premiumExpired = profileData.premium_until && new Date(profileData.premium_until) < new Date();
          const computedIsPremium = profileData.is_premium && !premiumExpired;
          
          if (import.meta.env.DEV) {
            console.log('[Profile] Loaded:', {
              is_premium_db: profileData.is_premium,
              premium_until: profileData.premium_until,
              premiumExpired,
              computedIsPremium,
            });
          }

          
          setProfile({
            language: (profileData.language as Language) || 'en',
            isPremium: computedIsPremium,
            premiumUntil: profileData.premium_until,
            messagesUsedToday: isNewDay ? 0 : profileData.messages_used_today,
            lastMessageDate: profileData.last_message_date,
          });

          // Reset message count if it's a new day and update last_active_at
          if (isNewDay) {
            await supabase.from('profiles').update({
              messages_used_today: 0,
              last_message_date: today,
              last_active_at: new Date().toISOString(),
            }).eq('id', user.id);
          } else {
            // Just update last_active_at to track user activity
            await supabase.from('profiles').update({
              last_active_at: new Date().toISOString(),
            }).eq('id', user.id);
          }

          // Check for pending referral code
          const pendingReferral = localStorage.getItem('pendingReferralCode');
          if (pendingReferral) {
            const ok = await referralService.applyReferralCode(pendingReferral, user.id);

            if (ok) {
              toast({
                title: 'Referral applied!',
                description: 'Complete your first breathing exercise to reward your friend with 7 days Premium.',
              });
            } else {
              toast({
                title: 'Referral not applied',
                description: 'Invalid code, already used, or blocked by our anti-abuse checks (same network/IP).',
                variant: 'destructive',
              });
            }

            localStorage.removeItem('pendingReferralCode');
          }
        }

        // Load chat history
        const { data: chats } = await supabase
          .from('chat_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (chats) {
          setChatHistory(chats.map(c => ({
            id: c.id,
            role: c.role as 'user' | 'assistant',
            content: c.content,
            timestamp: new Date(c.created_at).getTime(),
          })));
        }

        // Load moods
        const { data: moodData } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (moodData) {
          setMoods(moodData.map(m => ({
            id: m.id,
            mood: m.mood as MoodEntry['mood'],
            note: m.note || '',
            timestamp: new Date(m.created_at).getTime(),
          })));
        }

        // Load journals
        const { data: journalData } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (journalData) {
          setJournals(journalData.map(j => ({
            id: j.id,
            prompt: j.prompt,
            content: j.content,
            timestamp: new Date(j.created_at).getTime(),
          })));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    const dbUpdates: Record<string, unknown> = {};
    if (updates.language !== undefined) dbUpdates.language = updates.language;
    if (updates.isPremium !== undefined) dbUpdates.is_premium = updates.isPremium;
    if (updates.premiumUntil !== undefined) dbUpdates.premium_until = updates.premiumUntil;
    if (updates.messagesUsedToday !== undefined) dbUpdates.messages_used_today = updates.messagesUsedToday;
    if (updates.lastMessageDate !== undefined) dbUpdates.last_message_date = updates.lastMessageDate;

    await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
    setProfile(prev => ({ ...prev, ...updates }));
  }, [user]);

  const setLanguage = useCallback((language: Language) => {
    updateProfile({ language });
  }, [updateProfile]);

  const activatePremium = useCallback(async (plan: 'monthly' | 'yearly' = 'yearly') => {
    const premiumUntil = new Date();
    if (plan === 'monthly') {
      premiumUntil.setMonth(premiumUntil.getMonth() + 1);
    } else {
      premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
    }
    await updateProfile({ 
      isPremium: true, 
      premiumUntil: premiumUntil.toISOString() 
    });
  }, [updateProfile]);

  const isPremium = profile.isPremium;
  const premiumUntil = profile.premiumUntil ? new Date(profile.premiumUntil) : null;

  const canSendMessage = isPremium || profile.messagesUsedToday < FREE_MESSAGES_PER_DAY;
  const remainingMessages = isPremium ? Infinity : Math.max(0, FREE_MESSAGES_PER_DAY - profile.messagesUsedToday);

  const sendMessage = useCallback(async (content: string): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    if (!canSendMessage) throw new Error('PAYWALL');

    // Add user message
    const { data: userMsg } = await supabase
      .from('chat_history')
      .insert({ user_id: user.id, role: 'user', content })
      .select()
      .single();

    if (userMsg) {
      const newUserMessage: ChatMessage = {
        id: userMsg.id,
        role: 'user',
        content,
        timestamp: new Date(userMsg.created_at).getTime(),
      };
      setChatHistory(prev => [...prev, newUserMessage]);
    }

    // Update message count
    const today = new Date().toISOString().split('T')[0];
    const newCount = profile.messagesUsedToday + 1;
    await updateProfile({ messagesUsedToday: newCount, lastMessageDate: today });

    // Get AI response
    const allMessages = [...chatHistory, { id: '', role: 'user' as const, content, timestamp: Date.now() }]
      .map(m => ({ role: m.role, content: m.content }));
    const response = await chatService.sendMessage(allMessages, profile.language);

    // Add assistant message
    const { data: assistantMsg } = await supabase
      .from('chat_history')
      .insert({ user_id: user.id, role: 'assistant', content: response })
      .select()
      .single();

    if (assistantMsg) {
      const newAssistantMessage: ChatMessage = {
        id: assistantMsg.id,
        role: 'assistant',
        content: response,
        timestamp: new Date(assistantMsg.created_at).getTime(),
      };
      setChatHistory(prev => {
        const updated = [...prev, newAssistantMessage];
        // Check chat achievements (count user messages only)
        const userMsgCount = updated.filter(m => m.role === 'user').length;
        const unlocked = achievementService.checkChatAchievements(userMsgCount);
        unlocked.forEach(name => {
          toast({ title: '🏆 Achievement Unlocked!', description: name });
        });
        return updated;
      });
    }

    return response;
  }, [user, canSendMessage, chatHistory, profile.language, profile.messagesUsedToday, updateProfile, toast]);

  const clearChat = useCallback(async () => {
    if (!user) return;
    await supabase.from('chat_history').delete().eq('user_id', user.id);
    setChatHistory([]);
  }, [user]);

  const addMood = useCallback(async (mood: MoodEntry['mood'], note: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('mood_entries')
      .insert({ user_id: user.id, mood, note })
      .select()
      .single();

    if (data) {
      const newMood: MoodEntry = {
        id: data.id,
        mood: data.mood as MoodEntry['mood'],
        note: data.note || '',
        timestamp: new Date(data.created_at).getTime(),
      };
      setMoods(prev => {
        const updated = [newMood, ...prev];
        // Check mood achievements
        const unlocked = achievementService.checkMoodAchievements(updated.length);
        unlocked.forEach(name => {
          toast({ title: '🏆 Achievement Unlocked!', description: name });
        });
        return updated;
      });
    }
  }, [user, toast]);

  const getMoods = useCallback((days?: number) => {
    if (!days) return moods;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return moods.filter(m => m.timestamp >= cutoff);
  }, [moods]);

  const addJournal = useCallback(async (prompt: string, content: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('journal_entries')
      .insert({ user_id: user.id, prompt, content })
      .select()
      .single();

    if (data) {
      const newJournal: JournalEntry = {
        id: data.id,
        prompt: data.prompt,
        content: data.content,
        timestamp: new Date(data.created_at).getTime(),
      };
      setJournals(prev => {
        const updated = [newJournal, ...prev];
        // Check journal achievements
        const unlocked = achievementService.checkJournalAchievements(updated.length);
        unlocked.forEach(name => {
          toast({ title: '🏆 Achievement Unlocked!', description: name });
        });
        return updated;
      });
    }
  }, [user, toast]);

  const value: AppContextType = {
    profile,
    updateProfile,
    setLanguage,
    isPremium,
    premiumUntil,
    activatePremium,
    canSendMessage,
    remainingMessages,
    sendMessage,
    chatHistory,
    clearChat,
    addMood,
    getMoods,
    moods,
    addJournal,
    journals,
    loading,
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
