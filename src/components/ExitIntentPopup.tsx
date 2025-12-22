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
  const hasInteracted = useRef(false);

  // Detect if mobile device
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const triggerSurvey = useCallback(() => {
    // Only show survey to visitors (non-authenticated users)
    if (user) return;
    
    const shownBefore = sessionStorage.getItem('exit_popup_shown');
    if (!shownBefore && !hasTriggered) {
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

  // Track time on page
  useEffect(() => {
    const timeTracker = setInterval(() => {
      setTimeOnPage(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timeTracker);
  }, []);

  // Track user interaction
  useEffect(() => {
    const markInteraction = () => {
      hasInteracted.current = true;
    };

    window.addEventListener('touchstart', markInteraction, { passive: true, once: true });
    window.addEventListener('scroll', markInteraction, { passive: true, once: true });
    window.addEventListener('click', markInteraction, { once: true });

    return () => {
      window.removeEventListener('touchstart', markInteraction);
      window.removeEventListener('scroll', markInteraction);
      window.removeEventListener('click', markInteraction);
    };
  }, []);

  // Mobile: Auto-trigger after 15 seconds if user has interacted, or 25 seconds regardless
  useEffect(() => {
    if (!isMobile || hasTriggered) return;

    const triggerTime = hasInteracted.current ? 15 : 25;
    if (timeOnPage >= triggerTime) {
      triggerSurvey();
    }
  }, [isMobile, timeOnPage, hasTriggered, triggerSurvey]);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    // Shorter inactivity time for mobile (12s vs 45s desktop)
    const inactivityDelay = isMobile ? 12000 : 45000;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        triggerSurvey();
      }, inactivityDelay);
    };

    const handleMouseLeaveWithCheck = (e: MouseEvent) => {
      handleMouseLeave(e);
    };

    // Mobile: detect scroll up to top (user looking to leave)
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

    document.addEventListener('mouseleave', handleMouseLeaveWithCheck);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', resetTimer, { passive: true });
    window.addEventListener('touchmove', resetTimer, { passive: true });
    resetTimer();

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeaveWithCheck);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('touchmove', resetTimer);
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