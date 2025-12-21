import { useState, useEffect } from 'react';

const BANNER_FIRST_SEEN_KEY = 'promo_banner_first_seen';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function HomePremiumBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const now = Date.now();
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
    <div className="w-full bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 dark:from-amber-900/30 dark:via-yellow-900/20 dark:to-orange-900/30 py-3 px-4 text-center">
      <p className="text-amber-800 dark:text-amber-200 text-base md:text-xl font-semibold tracking-wide">
        🎁 You're on Free Premium access
      </p>
      <p className="text-amber-600 dark:text-amber-300/80 text-xs md:text-sm mt-1">
        Enjoy all features — {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
      </p>
    </div>
  );
}
