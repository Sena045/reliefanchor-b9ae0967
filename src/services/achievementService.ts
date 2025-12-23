export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENTS_KEY = 'reliefanchor_achievements';

const achievementDefinitions = [
  { id: 'first_mood', name: 'Mood Tracker', description: 'Log your first mood', icon: '😊', threshold: 1 },
  { id: 'mood_10', name: 'Mood Master', description: 'Log 10 moods', icon: '🎯', threshold: 10 },
  { id: 'mood_50', name: 'Mood Champion', description: 'Log 50 moods', icon: '🏆', threshold: 50 },
  { id: 'first_journal', name: 'Journaler', description: 'Write your first journal entry', icon: '📝', threshold: 1 },
  { id: 'journal_10', name: 'Storyteller', description: 'Write 10 journal entries', icon: '📖', threshold: 10 },
  { id: 'streak_3', name: 'Getting Started', description: 'Maintain a 3-day streak', icon: '🔥', threshold: 3 },
  { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⭐', threshold: 7 },
  { id: 'streak_30', name: 'Monthly Champion', description: 'Maintain a 30-day streak', icon: '👑', threshold: 30 },
  { id: 'first_chat', name: 'Conversation Starter', description: 'Have your first chat', icon: '💬', threshold: 1 },
  { id: 'chat_20', name: 'Deep Talker', description: 'Send 20 chat messages', icon: '🗣️', threshold: 20 },
];

export const achievementService = {
  getAchievements(): Achievement[] {
    try {
      const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
      const unlockedMap: Record<string, number> = stored ? JSON.parse(stored) : {};
      
      return achievementDefinitions.map(def => ({
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        unlocked: !!unlockedMap[def.id],
        unlockedAt: unlockedMap[def.id],
      }));
    } catch {
      return achievementDefinitions.map(def => ({
        ...def,
        unlocked: false,
      }));
    }
  },

  unlockAchievement(id: string): boolean {
    try {
      const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
      const unlockedMap: Record<string, number> = stored ? JSON.parse(stored) : {};
      
      if (unlockedMap[id]) return false; // Already unlocked
      
      unlockedMap[id] = Date.now();
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlockedMap));
      return true;
    } catch {
      return false;
    }
  },

  checkMoodAchievements(moodCount: number): string[] {
    const newlyUnlocked: string[] = [];
    
    if (moodCount >= 1 && this.unlockAchievement('first_mood')) {
      newlyUnlocked.push('Mood Tracker');
    }
    if (moodCount >= 10 && this.unlockAchievement('mood_10')) {
      newlyUnlocked.push('Mood Master');
    }
    if (moodCount >= 50 && this.unlockAchievement('mood_50')) {
      newlyUnlocked.push('Mood Champion');
    }
    
    return newlyUnlocked;
  },

  checkJournalAchievements(journalCount: number): string[] {
    const newlyUnlocked: string[] = [];
    
    if (journalCount >= 1 && this.unlockAchievement('first_journal')) {
      newlyUnlocked.push('Journaler');
    }
    if (journalCount >= 10 && this.unlockAchievement('journal_10')) {
      newlyUnlocked.push('Storyteller');
    }
    
    return newlyUnlocked;
  },

  checkStreakAchievements(streak: number): string[] {
    const newlyUnlocked: string[] = [];
    
    if (streak >= 3 && this.unlockAchievement('streak_3')) {
      newlyUnlocked.push('Getting Started');
    }
    if (streak >= 7 && this.unlockAchievement('streak_7')) {
      newlyUnlocked.push('Week Warrior');
    }
    if (streak >= 30 && this.unlockAchievement('streak_30')) {
      newlyUnlocked.push('Monthly Champion');
    }
    
    return newlyUnlocked;
  },

  checkChatAchievements(chatCount: number): string[] {
    const newlyUnlocked: string[] = [];
    
    if (chatCount >= 1 && this.unlockAchievement('first_chat')) {
      newlyUnlocked.push('Conversation Starter');
    }
    if (chatCount >= 20 && this.unlockAchievement('chat_20')) {
      newlyUnlocked.push('Deep Talker');
    }
    
    return newlyUnlocked;
  },

  getUnlockedCount(): number {
    return this.getAchievements().filter(a => a.unlocked).length;
  },

  getTotalCount(): number {
    return achievementDefinitions.length;
  },
};
