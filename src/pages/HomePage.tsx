import { useState, useEffect, useMemo } from 'react';
import { Anchor, MessageCircle, Smile, Sparkles, Crown, Sun, Moon, CloudSun } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StreakTracker } from '@/components/StreakTracker';
import { AchievementBadges } from '@/components/AchievementBadges';
import { OnboardingFlow } from '@/components/OnboardingFlow';

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

const dailyTips = [
  "Take 3 deep breaths before reacting to stress.",
  "Name one thing you're grateful for right now.",
  "It's okay to not be okay. You're doing your best.",
  "A 5-minute walk can shift your entire mood.",
  "You don't have to have it all figured out today.",
  "Feelings are visitors — let them come and go.",
  "Progress isn't always visible. Trust the process.",
  "Being kind to yourself is not selfish — it's essential.",
  "Small steps still move you forward.",
  "Your mental health matters as much as your physical health.",
];

const moodEmojis: Record<string, string> = {
  happy: '😊',
  calm: '😌',
  sad: '😢',
  anxious: '😰',
  angry: '😤',
  tired: '😴',
  grateful: '🙏',
  excited: '🎉',
};

function getTimeGreeting(): { greeting: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { greeting: 'Good morning', icon: Sun };
  if (hour < 17) return { greeting: 'Good afternoon', icon: CloudSun };
  return { greeting: 'Good evening', icon: Moon };
}

function getDailyTip(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return dailyTips[dayOfYear % dailyTips.length];
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { profile, isPremium, premiumUntil, remainingMessages, moods, chatHistory } = useApp();
  const { t } = useTranslation(profile.language);
  const [isIndia, setIsIndia] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user is brand new (no moods, no chats, first time)
  useEffect(() => {
    const onboardingDone = localStorage.getItem('onboarding_complete');
    if (!onboardingDone && moods.length === 0 && chatHistory.length === 0) {
      setShowOnboarding(true);
    }
  }, [moods.length, chatHistory.length]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  // Detect user's country on mount
  useEffect(() => {
    fetch('https://ipapi.co/country/')
      .then(res => res.text())
      .then(countryCode => setIsIndia(countryCode.trim() === 'IN'))
      .catch(() => setIsIndia(false));
  }, []);

  const priceDisplay = isIndia ? '₹249/month' : '$7.99/month';
  const { greeting, icon: TimeIcon } = getTimeGreeting();
  const dailyTip = useMemo(() => getDailyTip(), []);

  // Last mood for personalized suggestion
  const lastMood = moods.length > 0 ? moods[0] : null;
  const lastMoodAge = lastMood ? Math.floor((Date.now() - lastMood.timestamp) / (1000 * 60 * 60)) : null;

  // Suggest action based on last mood
  const getSuggestedAction = () => {
    if (!lastMood) return null;
    const emoji = moodEmojis[lastMood.mood] || '🫶';
    if (lastMoodAge && lastMoodAge < 24) {
      if (['sad', 'anxious', 'angry'].includes(lastMood.mood)) {
        return { text: `You felt ${lastMood.mood} ${emoji} earlier — want to talk to Anya?`, action: 'chat' };
      }
      if (['tired'].includes(lastMood.mood)) {
        return { text: `Feeling tired ${emoji}? Try a quick breathing exercise`, action: 'tools' };
      }
      return null;
    }
    if (lastMoodAge && lastMoodAge >= 24) {
      return { text: `It's been a while since you checked in — how are you today?`, action: 'mood' };
    }
    return null;
  };

  const suggestion = getSuggestedAction();

  // Trial days
  const trialDaysLeft = (() => {
    if (!premiumUntil) return 0;
    const diffDays = Math.ceil((premiumUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return diffDays > 0 && diffDays <= 7 ? diffDays : 0;
  })();

  // Show onboarding for new users
  if (showOnboarding) {
    return <OnboardingFlow onNavigate={onNavigate} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto safe-top">
      {/* Trial Banner */}
      {isPremium && premiumUntil && trialDaysLeft > 0 && (
        <div className="text-center pt-4">
          <p className="text-base font-medium text-primary">
            🎁 You have {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} of full access
          </p>
          <p className="text-xs text-muted-foreground">Explore everything, no payment required</p>
        </div>
      )}

      {/* Personalized Greeting */}
      <div className="pt-6 pb-2 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
          <TimeIcon className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">{greeting} 👋</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('welcomeSubtitle')}</p>
      </div>

      {/* Contextual Suggestion */}
      {suggestion && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-primary/20 bg-primary/5"
          onClick={() => onNavigate(suggestion.action)}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{suggestion.text}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Tip */}
      <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
        <p className="text-xs text-muted-foreground text-center">
          💡 <span className="font-medium text-foreground/80">Tip of the day:</span> {dailyTip}
        </p>
      </div>

      {/* Streak Tracker */}
      <StreakTracker />

      {/* Achievement Badges */}
      <AchievementBadges />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none"
          onClick={() => onNavigate('chat')}
        >
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">{t('talkToAnya')}</h3>
            {!isPremium && (
              <p className="text-xs text-muted-foreground mt-1">
                {remainingMessages} {t('messagesRemaining')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none"
          onClick={() => onNavigate('mood')}
        >
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-mood-calm/20 flex items-center justify-center mb-3">
              <Smile className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">{t('trackMood')}</h3>
            {lastMood && (
              <p className="text-xs text-muted-foreground mt-1">
                Last: {moodEmojis[lastMood.mood] || '🫶'} {lastMoodAge && lastMoodAge < 24 ? 'today' : `${Math.floor((lastMoodAge || 0) / 24)}d ago`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wellness Tools Preview */}
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow tap-highlight-none"
        onClick={() => onNavigate('tools')}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{t('wellnessTools')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('breathing')} • {t('grounding')} • {t('sounds')} • {t('journal')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Status or CTA */}
      {isPremium ? (
        <Card className="bg-gradient-to-r from-amber-500/10 to-primary/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-amber-600">👑 Premium access active</h3>
                {premiumUntil && (
                  <p className="text-sm text-muted-foreground">
                    Enjoy all features until {premiumUntil.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70 mt-1">
                  You won't be charged automatically. You're always in control.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{t('getPremium')}</h3>
                <p className="text-sm text-muted-foreground">{t('unlockFeatures')}</p>
                <p className="text-lg font-bold text-primary mt-1">{priceDisplay}</p>
              </div>
            </div>
            <Button
              className="w-full mt-3"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('premium');
              }}
            >
              {t('upgradeNow')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="p-3 border border-muted rounded-lg bg-muted/30">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          ReliefAnchor is a wellness tool and is not a substitute for professional mental health care.
          If you are in crisis, please contact emergency services or a mental health professional.
        </p>
      </div>
    </div>
  );
}
