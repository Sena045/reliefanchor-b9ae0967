import { useState, useEffect, useCallback, useRef } from 'react';
import { RegistrationSurvey } from '@/components/RegistrationSurvey';
import { useAuth } from '@/hooks/useAuth';

interface ExitIntentPopupProps {
  onSignUp: () => void;
}

export function ExitIntentPopup({ onSignUp }: ExitIntentPopupProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [timeOnPage, setTimeOnPage] = useState(0);
  const lastScrollY = useRef(0);
  const scrollUpCount = useRef(0);

  // Detect if mobile device
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const triggerSurvey = useCallback(() => {
    // Only show survey to visitors (non-authenticated users)
    if (user) return;
    
    const shownBefore = sessionStorage.getItem('exit_popup_shown');
    const breathingPopupShown = sessionStorage.getItem('breathing_popup_shown');
    if (!shownBefore && !hasTriggered && !breathingPopupShown) {
      setIsOpen(true);
      setHasTriggered(true);
      sessionStorage.setItem('exit_popup_shown', 'true');
    }
  }, [hasTriggered, user]);

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

  // Mobile: Auto-trigger after 20 seconds on page (more aggressive for mobile)
  useEffect(() => {
    if (isMobile && timeOnPage >= 20 && !hasTriggered) {
      triggerSurvey();
    }
  }, [isMobile, timeOnPage, hasTriggered, triggerSurvey]);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    // Shorter inactivity time for mobile (15s vs 45s desktop)
    const inactivityDelay = isMobile ? 15000 : 45000;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        triggerSurvey();
      }, inactivityDelay);
    };

    const handleMouseLeaveWithCheck = (e: MouseEvent) => {
      const breathingPopupShown = sessionStorage.getItem('breathing_popup_shown');
      if (!breathingPopupShown) {
        handleMouseLeave(e);
      }
    };

    // Mobile: trigger when user switches tabs/apps
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && timeOnPage >= 2) {
        triggerSurvey();
      }
    };

    // Mobile: detect scroll up (user looking to leave)
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (isMobile && currentScrollY < lastScrollY.current && currentScrollY < 100) {
        scrollUpCount.current += 1;
        // If user scrolls up to top 3 times, likely looking to exit
        if (scrollUpCount.current >= 3 && timeOnPage >= 5) {
          triggerSurvey();
        }
      }
      
      lastScrollY.current = currentScrollY;
      resetTimer();
    };

    // Mobile: trigger on back button / page unload attempt
    const handleBeforeUnload = () => {
      if (timeOnPage >= 2) {
        triggerSurvey();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeaveWithCheck);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', resetTimer, { passive: true });
    resetTimer();

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeaveWithCheck);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', resetTimer);
      clearTimeout(inactivityTimer);
    };
  }, [handleMouseLeave, triggerSurvey, timeOnPage, isMobile]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <RegistrationSurvey isOpen={isOpen} onClose={handleClose} />
  );
}