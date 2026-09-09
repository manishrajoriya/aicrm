'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

export function usePushNotification() {
  const { profile } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '56f6d17f-5d83-4ae6-8409-401c35863947';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check basic browser Notification API support
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (!supported) {
      setLoading(false);
      return;
    }

    setPermission(Notification.permission);

    // Sync with OneSignal SDK
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        const subscribed = OneSignal.User?.PushSubscription?.optedIn ?? false;
        setIsSubscribed(Boolean(subscribed));
        setPermission(Notification.permission);

        // Associate user profile with OneSignal for targeted pushes
        if (profile?.id && OneSignal?.login && OneSignal?.User) {
          try {
            await OneSignal.login(profile.id);
            if (profile.email && OneSignal.User.addEmail) {
              await OneSignal.User.addEmail(profile.email);
            }
            if (profile.name && OneSignal.User.addTag) {
              await OneSignal.User.addTag('name', profile.name);
            }
          } catch (loginErr) {
            console.debug('OneSignal login info:', loginErr);
          }
        }
      } catch (err) {
        console.debug('OneSignal sync notice:', err);
      } finally {
        setLoading(false);
      }
    });
  }, [appId, profile?.id, profile?.email, profile?.name]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    return new Promise((resolve) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          await OneSignal.Notifications.requestPermission();
          const granted = Notification.permission === 'granted';
          setPermission(Notification.permission);
          if (granted) {
            await OneSignal.User.PushSubscription?.optIn?.();
            setIsSubscribed(true);
          }
          resolve(granted);
        } catch (err) {
          console.error('Error requesting OneSignal permission:', err);
          // Fallback
          if ('Notification' in window) {
            const res = await Notification.requestPermission();
            setPermission(res);
            resolve(res === 'granted');
          } else {
            resolve(false);
          }
        }
      });
    });
  }, []);

  return {
    isConfigured: Boolean(appId),
    isSupported,
    permission,
    isSubscribed,
    loading,
    requestPermission,
  };
}
