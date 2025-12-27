import { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { pushNotificationService } from '@/services/pushNotificationService';

const NOTIFICATION_PREFS_KEY = 'relief_anchor_notification_prefs';

interface NotificationPrefs {
  enabled: boolean;
  reminderTime: string; // 24h format: "09:00"
  lastScheduled: string | null;
}

const TIME_OPTIONS = [
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
];

export function NotificationSettings() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    enabled: false,
    reminderTime: '09:00',
    lastScheduled: null,
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if notifications are supported but don't block UI
    const notificationsSupported = 'Notification' in window && 'serviceWorker' in navigator;
    
    if (!notificationsSupported) {
      // Still allow the UI to render, just won't actually send notifications
      console.log('Push notifications not fully supported, but UI remains enabled');
    }

    setPermissionStatus(Notification.permission);

    // Load saved preferences
    const saved = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPrefs(parsed);
        
        // Re-schedule if enabled
        if (parsed.enabled) {
          scheduleReminder(parsed.reminderTime);
        }
      } catch {
        // ignore
      }
    }

    // Check if already subscribed
    pushNotificationService.isSubscribed().then((subscribed) => {
      if (subscribed && !prefs.enabled) {
        setPrefs(prev => ({ ...prev, enabled: true }));
      }
    });
  }, []);

  const savePrefs = (newPrefs: NotificationPrefs) => {
    setPrefs(newPrefs);
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(newPrefs));
  };

  const scheduleReminder = (time: string) => {
    // Clear any existing scheduled notification
    if ('scheduledNotifications' in localStorage) {
      localStorage.removeItem('scheduledNotifications');
    }

    // Calculate next notification time
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // Store the scheduled time for the service worker to check
    const scheduleData = {
      time,
      nextTrigger: scheduledTime.getTime(),
    };
    localStorage.setItem('scheduledNotifications', JSON.stringify(scheduleData));

    // Set up a check interval (runs when app is open)
    checkAndTriggerNotification();
  };

  const checkAndTriggerNotification = () => {
    const check = () => {
      const savedPrefs = localStorage.getItem(NOTIFICATION_PREFS_KEY);
      const schedule = localStorage.getItem('scheduledNotifications');
      
      if (!savedPrefs || !schedule) return;
      
      const prefsData = JSON.parse(savedPrefs);
      const scheduleData = JSON.parse(schedule);
      
      if (!prefsData.enabled) return;
      
      const now = Date.now();
      if (now >= scheduleData.nextTrigger) {
        // Time to show notification
        pushNotificationService.showLocalNotification(
          '🌟 Time for your daily check-in!',
          {
            body: 'Take a moment to log your mood and reflect on your day.',
            tag: 'daily-reminder',
            requireInteraction: false,
          }
        );

        // Schedule for tomorrow
        const tomorrow = new Date();
        const [hours, minutes] = scheduleData.time.split(':').map(Number);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(hours, minutes, 0, 0);
        
        localStorage.setItem('scheduledNotifications', JSON.stringify({
          time: scheduleData.time,
          nextTrigger: tomorrow.getTime(),
        }));
      }
    };

    // Check every minute when app is open
    const intervalId = setInterval(check, 60000);
    check(); // Initial check

    // Store interval ID for cleanup
    (window as any).__notificationInterval = intervalId;
  };

  const toggleNotifications = async () => {
    if (prefs.enabled) {
      // Disable notifications
      await pushNotificationService.unsubscribe();
      const newPrefs = { ...prefs, enabled: false };
      savePrefs(newPrefs);
      localStorage.removeItem('scheduledNotifications');
      toast({ title: 'Daily reminders disabled' });
    } else {
      // Enable notifications
      const permission = await pushNotificationService.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        await pushNotificationService.init();
        const subscription = await pushNotificationService.subscribe();
        
        if (subscription || permission === 'granted') {
          const newPrefs = { ...prefs, enabled: true };
          savePrefs(newPrefs);
          scheduleReminder(prefs.reminderTime);
          toast({ 
            title: 'Daily reminders enabled!',
            description: `You'll be reminded at ${TIME_OPTIONS.find(t => t.value === prefs.reminderTime)?.label || prefs.reminderTime}`,
          });
        }
      } else if (permission === 'denied') {
        toast({ 
          title: 'Notifications blocked',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    }
  };

  const updateReminderTime = (time: string) => {
    const newPrefs = { ...prefs, reminderTime: time };
    savePrefs(newPrefs);
    
    if (prefs.enabled) {
      scheduleReminder(time);
      toast({ 
        title: 'Reminder time updated',
        description: `You'll be reminded at ${TIME_OPTIONS.find(t => t.value === time)?.label || time}`,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Daily Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Enable Reminders</p>
            <p className="text-xs text-muted-foreground">
              Get a daily nudge to check in
            </p>
          </div>
          <Switch 
            checked={prefs.enabled} 
            onCheckedChange={toggleNotifications}
          />
        </div>

        {/* Time Selector */}
        {prefs.enabled && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Reminder Time</span>
            </div>
            <Select value={prefs.reminderTime} onValueChange={updateReminderTime}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Status */}
        {prefs.enabled && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>
              Reminders active at {TIME_OPTIONS.find(t => t.value === prefs.reminderTime)?.label}
            </span>
          </div>
        )}

        {/* Permission denied message */}
        {permissionStatus === 'denied' && (
          <p className="text-xs text-destructive">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
