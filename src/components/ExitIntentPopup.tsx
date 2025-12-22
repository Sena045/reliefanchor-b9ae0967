import { useState, useEffect, useCallback } from 'react';
import { Heart, ArrowRight, X, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExitIntentPopupProps {
  onSignUp: () => void;
}

export function ExitIntentPopup({ onSignUp }: ExitIntentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    // Only trigger when mouse leaves from the top of the page
    if (e.clientY <= 10 && !hasTriggered) {
      // Check if already shown in this session
      const shownBefore = sessionStorage.getItem('exit_popup_shown');
      if (!shownBefore) {
        setIsOpen(true);
        setHasTriggered(true);
        sessionStorage.setItem('exit_popup_shown', 'true');
      }
    }
  }, [hasTriggered]);

  // Mobile: trigger on back button or after 30 seconds of inactivity
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        const shownBefore = sessionStorage.getItem('exit_popup_shown');
        if (!shownBefore && !hasTriggered) {
          setIsOpen(true);
          setHasTriggered(true);
          sessionStorage.setItem('exit_popup_shown', 'true');
        }
      }, 45000); // 45 seconds of inactivity
    };

    // Desktop: mouse leave detection
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // Mobile: inactivity timer
    window.addEventListener('scroll', resetTimer, { passive: true });
    window.addEventListener('touchstart', resetTimer, { passive: true });
    resetTimer();

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      clearTimeout(inactivityTimer);
    };
  }, [handleMouseLeave, hasTriggered]);

  const handleSignUp = () => {
    setIsOpen(false);
    onSignUp();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Wait! Don't leave stressed
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4 py-4">
          <p className="text-muted-foreground">
            Take 60 seconds to try our <span className="font-semibold text-foreground">free breathing exercise</span> before you go.
          </p>
          
          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-primary">Join 1,000+ people finding calm</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ 24/7 AI companion support</li>
              <li>✓ Mood tracking & insights</li>
              <li>✓ Breathing exercises & games</li>
              <li>✓ 100% free to start</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleSignUp} size="lg" className="w-full">
              Sign Up Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              No thanks, I'll stay stressed
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}