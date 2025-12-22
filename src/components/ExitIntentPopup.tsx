import { useState, useEffect, useCallback } from 'react';
import { RegistrationSurvey } from '@/components/RegistrationSurvey';

interface ExitIntentPopupProps {
  onSignUp: () => void;
}

export function ExitIntentPopup({ onSignUp }: ExitIntentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

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
      }, 5000); // 5 seconds for testing (change to 45000 for production)
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

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <RegistrationSurvey isOpen={isOpen} onClose={handleClose} />
  );
}