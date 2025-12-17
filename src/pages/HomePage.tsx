import { Anchor, MessageCircle, Smile, Sparkles, Crown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PRICING } from '@/types';

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { settings, isPremium, remainingMessages } = useApp();
  const { t } = useTranslation(settings.language);
  const pricing = PRICING[settings.region];

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto safe-top">
      {/* Header */}
      <div className="pt-8 pb-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Anchor className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t('welcome')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('welcomeSubtitle')}</p>
      </div>

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

      {/* Premium CTA */}
      {!isPremium && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{t('getPremium')}</h3>
                <p className="text-sm text-muted-foreground">{t('unlockFeatures')}</p>
                <p className="text-lg font-bold text-primary mt-1">
                  {pricing.symbol}{pricing.amount}/{settings.region === 'india' ? 'year' : 'year'}
                </p>
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
    </div>
  );
}
