'use client';

import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';

export function useSessionTimeout() {
  const { addNotification } = useNotificationStore();

  const checkTokenExpiry = useCallback(() => {
    const token = localStorage.getItem('oradent_token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      const timeLeft = expiresAt - now;

      if (timeLeft < 5 * 60 * 1000 && timeLeft > 0) {
        addNotification({
          type: 'warning',
          title: 'Session Expiring',
          message: 'Your session will expire soon. Save your work to avoid losing changes.',
        });
      }
    } catch {
      // Invalid token format, ignore
    }
  }, [addNotification]);

  useEffect(() => {
    const interval = setInterval(checkTokenExpiry, 60 * 1000);
    return () => clearInterval(interval);
  }, [checkTokenExpiry]);
}
