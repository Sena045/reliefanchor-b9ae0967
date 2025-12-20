import { useState, useEffect } from 'react';

const BANNER_FIRST_SEEN_KEY = 'promo_banner_first_seen';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const firstSeen = localStorage.getItem(BANNER_FIRST_SEEN_KEY);
    const now = Date.now();

    if (!firstSeen) {
      // First time seeing the banner
      localStorage.setItem(BANNER_FIRST_SEEN_KEY, now.toString());
      setIsVisible(true);
    } else {
      // Check if 7 days have passed
      const elapsed = now - parseInt(firstSeen, 10);
      if (elapsed < SEVEN_DAYS_MS) {
        setIsVisible(true);
      }
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-emerald-500 py-3 px-4 text-center">
      <p className="text-white text-lg md:text-2xl font-bold tracking-wide">
        🎉 7 DAYS FREE PREMIUM
      </p>
    </div>
  );
}
