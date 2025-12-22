import { useState, useEffect, useCallback } from 'react';
import { Gift, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 10 && !hasTriggered) {
      const shownBefore = sessionStorage.getItem('exit_popup_shown');
      if (!shownBefore) {
        setIsOpen(true);
        setHasTriggered(true);
        sessionStorage.setItem('exit_popup_shown', 'true');
      }
    }
  }, [hasTriggered]);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        const shownBefore = sessionStorage.getItem('exit_popup_shown');
        const breathingPopupShown = sessionStorage.getItem('breathing_popup_shown');
        if (!shownBefore && !hasTriggered && !breathingPopupShown) {
          setIsOpen(true);
          setHasTriggered(true);
          sessionStorage.setItem('exit_popup_shown', 'true');
        }
      }, 45000); // Increased to 45 seconds to avoid conflict with breathing exercise
    };

    const handleMouseLeaveWithCheck = (e: MouseEvent) => {
      const breathingPopupShown = sessionStorage.getItem('breathing_popup_shown');
      if (!breathingPopupShown) {
        handleMouseLeave(e);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeaveWithCheck);
    window.addEventListener('scroll', resetTimer, { passive: true });
    window.addEventListener('touchstart', resetTimer, { passive: true });
    resetTimer();

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeaveWithCheck);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      clearTimeout(inactivityTimer);
    };
  }, [handleMouseLeave, hasTriggered]);

  const handleGoogleSignIn = async () => {
    setIsOpen(false);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to sign in with Google', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Wait! Get calm in 30 seconds 🎁
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4 py-2">
          <p className="text-muted-foreground">
            Try our <span className="font-semibold text-foreground">free breathing exercise</span> — it only takes 30 seconds.
          </p>
          
          <Button 
            onClick={handleGoogleSignIn} 
            size="lg" 
            className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-md"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google — Free
          </Button>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>✓ 24/7 AI companion • ✓ Breathing exercises • ✓ Mood tracking</p>
            <p className="flex items-center justify-center gap-1">
              <Shield className="h-3 w-3 text-green-600" />
              100% Free • Your data stays private
            </p>
          </div>
          
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}