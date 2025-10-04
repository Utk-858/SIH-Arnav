'use client';

import { useState, useEffect } from 'react';
import { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export function useFCM() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();
  const { toast } = useToast();

  // Request notification permission and get FCM token
  const requestPermission = async () => {
    try {
      if (!messaging) {
        console.warn('Firebase messaging is not available');
        return false;
      }

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (token) {
          setFcmToken(token);
          await registerTokenWithBackend(token);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Register FCM token with backend
  const registerTokenWithBackend = async (token: string) => {
    if (!user?.uid) return;

    try {
      await fetch(`${BACKEND_URL}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.uid,
        },
        body: JSON.stringify({ fcmToken: token }),
      });
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  };

  // Unregister FCM token from backend
  const unregisterTokenFromBackend = async (token: string) => {
    if (!user?.uid) return;

    try {
      await fetch(`${BACKEND_URL}/api/notifications/unregister-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.uid,
        },
        body: JSON.stringify({ fcmToken: token }),
      });
    } catch (error) {
      console.error('Error unregistering FCM token:', error);
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);

      // Show toast notification
      toast({
        title: payload.notification?.title || 'Notification',
        description: payload.notification?.body || 'You have a new notification',
        duration: 5000,
      });
    });

    return unsubscribe;
  }, [toast]);

  // Initialize FCM when user is authenticated
  useEffect(() => {
    if (user?.uid && typeof window !== 'undefined') {
      // Check if permission is already granted
      if (Notification.permission === 'granted') {
        requestPermission();
      }
    }
  }, [user?.uid]);

  return {
    fcmToken,
    permission,
    requestPermission,
    unregisterTokenFromBackend,
  };
}