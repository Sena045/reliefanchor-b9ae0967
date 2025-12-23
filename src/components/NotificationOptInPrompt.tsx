import { useState, useEffect } from 'react';
import { Bell, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useToast } from '@/hooks/use-toast';

const OPT_IN_DISMISSED_KEY = 'relief_anchor_notification_optin_dismissed';
const OPT_IN_SHOWN_COUNT_KEY = 'relief_anchor_notification_optin_count';
const NOTIFICATION_PREFS_KEY = 'relief_anchor_notification_prefs';

interface NotificationOptInPromptProps {
  trigger?: 'mood_logged' | 'journal_saved' | 'session_count';
}

export function NotificationOptInPrompt({ trigger }: NotificationOptInPromptProps) {
  const { toast } = useToast();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkShouldShow();
  }, [trigger]);

  const checkShouldShow = async () => {
    // Don't show if not supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    // Don't show if already granted or denied
    if (Notification.permission !== 'default') {
      return;
    }

    // Don't show if dismissed
    const dismissed = localStorage.getItem(OPT_IN_DISMISSED_KEY);
    if (dismissed === 'true') {
      return;
    }

    // Don't show if already enabled
    const prefs = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (prefs) {
      const parsed = JSON.parse(prefs);
      if (parsed.enabled) return;
    }

    // Check if already subscribed
    const isSubscribed = await pushNotificationService.isSubscribed();
    if (isSubscribed) return;

    // Show after specific triggers or after 3 sessions
    const showCount = parseInt(localStorage.getItem(OPT_IN_SHOWN_COUNT_KEY) || '0', 10);
    
    if (trigger === 'mood_logged' || trigger === 'journal_saved') {
      // Show on these triggers after first session
      if (showCount >= 1) {
        setShowPrompt(true);
      }
    } else {
      // Increment session count
      const newCount = showCount + 1;
      localStorage.setItem(OPT_IN_SHOWN_COUNT_KEY, newCount.toString());
      
      // Show after 3 sessions
      if (newCount >= 3) {
        setShowPrompt(true);
      }
    }
  };

  const handleEnable = async () => {
    setIsLoading(true);
    
    try {
      const permission = await pushNotificationService.requestPermission();
      
      if (permission === 'granted') {
        await pushNotificationService.init();
        await pushNotificationService.subscribe();
        
        // Save preferences
        const prefs = {
          enabled: true,
          reminderTime: '09:00',
          lastScheduled: null,
        };
        localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
        
        toast({
          title: '🔔 Reminders enabled!',
          description: 'You\'ll get a daily reminder at 9:00 AM. Change this in Settings.',
        });
        
        setShowPrompt(false);
      } else {
        toast({
          title: 'Notifications blocked',
          description: 'You can enable them later in Settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
    
    setIsLoading(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(OPT_IN_DISMISSED_KEY, 'true');
    setShowPrompt(false);
  };

  const handleMaybeLater = () => {
    // Reset the shown count so it shows again after more sessions
    localStorage.setItem(OPT_IN_SHOWN_COUNT_KEY, '0');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 px-4 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="max-w-md mx-auto shadow-lg border-primary/20 bg-card/95 backdrop-blur">
        <CardContent className="p-4">
          <button
            onClick={handleMaybeLater}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Stay on track with reminders
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Get a gentle daily nudge to check in with yourself. You can customize the time.
              </p>
              
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  onClick={handleEnable}
                  disabled={isLoading}
                  className="text-xs h-8"
                >
                  {isLoading ? 'Enabling...' : 'Enable Reminders'}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDismiss}
                  className="text-xs h-8"
                >
                  No thanks
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
