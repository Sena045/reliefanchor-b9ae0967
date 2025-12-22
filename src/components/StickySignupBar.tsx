import { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StickySignupBarProps {
  onSignUp: () => void;
}

export function StickySignupBar({ onSignUp }: StickySignupBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      if (window.scrollY > 300 && !isDismissed) {
        setIsVisible(true);
      } else if (window.scrollY <= 300) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground p-3 shadow-2xl shadow-primary/30 animate-fade-in md:hidden">
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">Start your wellness journey</p>
          <p className="text-xs opacity-90">Free • No credit card</p>
        </div>
        <Button 
          onClick={onSignUp}
          variant="secondary"
          size="sm"
          className="shrink-0 font-semibold"
        >
          Sign Up
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
        <button 
          onClick={() => setIsDismissed(true)}
          className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}