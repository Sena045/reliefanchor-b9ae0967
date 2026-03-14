import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Activity } from 'lucide-react';

function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  
  return count;
}

export function LiveCounter() {
  const users = useAnimatedCounter(1247);
  const sessions = useAnimatedCounter(8420);
  const moods = useAnimatedCounter(3150);

  return (
    <div className="w-full max-w-md mx-auto grid grid-cols-3 gap-2 mt-4">
      <div className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-primary/5 border border-primary/10">
        <Heart className="h-4 w-4 text-primary" />
        <span className="text-base font-bold text-foreground">{users.toLocaleString()}+</span>
        <span className="text-[10px] text-muted-foreground">Users helped</span>
      </div>
      <div className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-primary/5 border border-primary/10">
        <MessageCircle className="h-4 w-4 text-primary" />
        <span className="text-base font-bold text-foreground">{sessions.toLocaleString()}+</span>
        <span className="text-[10px] text-muted-foreground">Chat sessions</span>
      </div>
      <div className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-primary/5 border border-primary/10">
        <Activity className="h-4 w-4 text-primary" />
        <span className="text-base font-bold text-foreground">{moods.toLocaleString()}+</span>
        <span className="text-[10px] text-muted-foreground">Moods tracked</span>
      </div>
    </div>
  );
}
