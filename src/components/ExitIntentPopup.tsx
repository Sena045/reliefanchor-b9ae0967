import { useState, useEffect, useCallback } from 'react';
import { RegistrationSurvey } from '@/components/RegistrationSurvey';

interface ExitIntentPopupProps {
  onSignUp: () => void;
}

export function ExitIntentPopup({ onSignUp }: ExitIntentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [timeOnPage, setTimeOnPage] = useState(0);

  const triggerSurvey = useCallback(() => {
    const shownBefore = sessionStorage.getItem('exit_popup_shown');
    const breathingPopupShown = sessionStorage.getItem('breathing_popup_shown');
    if (!shownBefore && !hasTriggered && !breathingPopupShown) {
      setIsOpen(true);
      setHasTriggered(true);
      sessionStorage.setItem('exit_popup_shown', 'true');
    }
  }, [hasTriggered]);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 10) {
      triggerSurvey();
    }
  }, [triggerSurvey]);

  useEffect(() => {
    // Track time on page
    const timeTracker = setInterval(() => {
      setTimeOnPage(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timeTracker);
  }, []);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        triggerSurvey();
      }, 5000); // 5 seconds for testing (change to 45000 for production)
    };

    const handleMouseLeaveWithCheck = (e: MouseEvent) => {
      const breathingPopupShown = sessionStorage.getItem('breathing_popup_shown');
      if (!breathingPopupShown) {
        handleMouseLeave(e);
      }
    };

    // Mobile: trigger when user switches tabs/apps (after spending some time on page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && timeOnPage >= 3) {
        triggerSurvey();
      }
    };

    // Mobile: trigger on back button / page unload attempt
    const handleBeforeUnload = () => {
      if (timeOnPage >= 3) {
        triggerSurvey();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeaveWithCheck);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('scroll', resetTimer, { passive: true });
    window.addEventListener('touchstart', resetTimer, { passive: true });
    resetTimer();

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeaveWithCheck);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      clearTimeout(inactivityTimer);
    };
  }, [handleMouseLeave, triggerSurvey, timeOnPage]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <RegistrationSurvey isOpen={isOpen} onClose={handleClose} />
  );
}