import { useEffect, useState, useCallback } from 'react';

export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, [waitingWorker]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      // New SW activated, reload to use it
      window.location.reload();
    };

    const registerAndListen = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Check if there's already a waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        // Listen for new waiting workers
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
            }
          });
        });

        // Periodically check for updates (every 60 seconds)
        const intervalId = setInterval(() => {
          registration.update();
        }, 60000);

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        return () => {
          clearInterval(intervalId);
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    };

    registerAndListen();
  }, []);

  return { updateAvailable, applyUpdate };
}
