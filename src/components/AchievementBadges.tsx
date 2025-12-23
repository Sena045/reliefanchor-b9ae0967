import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock } from 'lucide-react';
import { achievementService, Achievement } from '@/services/achievementService';
import { cn } from '@/lib/utils';

export const AchievementBadges = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    setAchievements(achievementService.getAchievements());
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Achievements
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {unlockedCount}/{totalCount}
          </span>
        </CardTitle>
        <Progress value={progressPercent} className="h-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300",
                achievement.unlocked
                  ? "bg-primary/10 hover:bg-primary/20"
                  : "bg-muted/30 opacity-50"
              )}
              title={`${achievement.name}: ${achievement.description}`}
            >
              <span className="text-2xl mb-1">
                {achievement.unlocked ? achievement.icon : '🔒'}
              </span>
              <span className="text-[10px] text-center font-medium text-foreground/80 line-clamp-1">
                {achievement.name}
              </span>
              {!achievement.unlocked && (
                <Lock className="absolute top-1 right-1 h-3 w-3 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
