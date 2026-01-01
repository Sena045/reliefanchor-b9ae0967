import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async init(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof Notification === 'undefined') {
      console.log('Notification API not available');
      return 'denied';
    }
    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.registration || !VAPID_PUBLIC_KEY) {
      console.log('Push not configured - VAPID key missing');
      return null;
    }

    try {
      const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscriptionJson.endpoint!,
        keys: {
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
        },
      };

      // Save subscription to database
      await this.saveSubscriptionToDatabase(subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  private async saveSubscriptionToDatabase(subscription: PushSubscriptionData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, skipping subscription save');
        return;
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) {
        console.error('Error saving push subscription:', error);
      } else {
        console.log('Push subscription saved to database');
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }
        
        await subscription.unsubscribe();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Push unsubscribe failed:', error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  }

  async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.registration) return;

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      await this.registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options,
      });
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pushNotificationService = new PushNotificationService();
