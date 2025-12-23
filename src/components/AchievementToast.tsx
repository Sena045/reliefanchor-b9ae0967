import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementToastProps {
  achievementName: string;
  onClose: () => void;
}

export const AchievementToast = ({ achievementName, onClose }: AchievementToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto dismiss
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20 animate-pulse">
          <Trophy className="h-5 w-5 text-yellow-500" />
        </div>
        <div>
          <p className="text-xs text-yellow-500 font-medium">Achievement Unlocked!</p>
          <p className="text-sm font-semibold text-foreground">{achievementName}</p>
        </div>
      </div>
    </div>
  );
};
