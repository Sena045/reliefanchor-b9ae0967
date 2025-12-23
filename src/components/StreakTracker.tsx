import { useEffect, useState } from 'react';
import { Flame, Calendar, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';

const STREAK_STORAGE_KEY = 'relief_anchor_streak';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string; // ISO date string (YYYY-MM-DD)
}

export function StreakTracker() {
  const { profile } = useApp();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastLoginDate: '',
  });
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Load streak data from localStorage
    const stored = localStorage.getItem(STREAK_STORAGE_KEY);
    let data: StreakData;

    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch {
        data = { currentStreak: 1, longestStreak: 1, lastLoginDate: today };
      }
    } else {
      // First time user
      data = { currentStreak: 1, longestStreak: 1, lastLoginDate: today };
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
      setStreakData(data);
      return;
    }

    // Check if we need to update the streak
    if (data.lastLoginDate === today) {
      // Already logged in today
      setStreakData(data);
      return;
    }

    const lastDate = new Date(data.lastLoginDate);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day - increment streak
      const newStreak = data.currentStreak + 1;
      const newLongest = Math.max(newStreak, data.longestStreak);
      const newData: StreakData = {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastLoginDate: today,
      };
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(newData));
      setStreakData(newData);
      
      // Show celebration for milestones
      if (newStreak === 3 || newStreak === 7 || newStreak % 10 === 0) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } else if (diffDays > 1) {
      // Streak broken - reset to 1
      const newData: StreakData = {
        currentStreak: 1,
        longestStreak: data.longestStreak,
        lastLoginDate: today,
      };
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(newData));
      setStreakData(newData);
    } else {
      // Same day or invalid date, keep current data
      setStreakData(data);
    }
  }, []);

  const getStreakColor = () => {
    if (streakData.currentStreak >= 7) return 'text-orange-500';
    if (streakData.currentStreak >= 3) return 'text-amber-500';
    return 'text-primary';
  };

  const getStreakMessage = () => {
    if (streakData.currentStreak >= 30) return "You're on fire! 🔥";
    if (streakData.currentStreak >= 14) return "Amazing dedication! 🌟";
    if (streakData.currentStreak >= 7) return "One week strong! 💪";
    if (streakData.currentStreak >= 3) return "Keep it going! 🎯";
    return "Start your journey! ✨";
  };

  return (
    <Card className="relative overflow-hidden">
      {showCelebration && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 animate-pulse z-10 pointer-events-none" />
      )}
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center ${showCelebration ? 'animate-bounce' : ''}`}>
              <Flame className={`h-6 w-6 ${getStreakColor()}`} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${getStreakColor()}`}>
                  {streakData.currentStreak}
                </span>
                <span className="text-sm text-muted-foreground">day streak</span>
              </div>
              <p className="text-xs text-muted-foreground">{getStreakMessage()}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="h-3 w-3" />
              <span>Best: {streakData.longestStreak}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Today</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
