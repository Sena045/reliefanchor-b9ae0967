import { useState, useEffect } from 'react';

const BANNER_FIRST_SEEN_KEY = 'promo_banner_first_seen';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const PROMO_END_DATE = new Date('2025-12-28T23:59:59').getTime();

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const now = Date.now();
    
    // Stop showing banner after Dec 28, 2024
    if (now > PROMO_END_DATE) {
      setIsVisible(false);
      return;
    }

    const firstSeen = localStorage.getItem(BANNER_FIRST_SEEN_KEY);

    if (!firstSeen) {
      localStorage.setItem(BANNER_FIRST_SEEN_KEY, now.toString());
      setDaysRemaining(7);
      setIsVisible(true);
    } else {
      const elapsed = now - parseInt(firstSeen, 10);
      if (elapsed < SEVEN_DAYS_MS) {
        const remaining = Math.ceil((SEVEN_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000));
        setDaysRemaining(remaining);
        setIsVisible(true);
      }
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-emerald-500 py-3 px-4 text-center">
      <p className="text-white text-lg md:text-2xl font-bold tracking-wide">
        🎉 FREE PREMIUM — {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left!
      </p>
    </div>
  );
}
