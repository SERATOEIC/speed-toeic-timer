import { useState, useEffect, useCallback, useRef } from 'react';

export const CURRENT_CLIENT_VERSION = '2.1.0';

export interface AppUpdateState {
  isUpdateAvailable: boolean;
  serverVersion: string;
  isUpdating: boolean;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  checkForUpdateNow: () => Promise<boolean>;
}

export function useAppUpdate(): AppUpdateState {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [serverVersion, setServerVersion] = useState<string>(CURRENT_CLIENT_VERSION);
  const [isUpdating, setIsUpdating] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const isDismissedRef = useRef(false);

  // Poll server /api/version
  const checkServerVersion = useCallback(async (): Promise<boolean> => {
    if (isDismissedRef.current) return false;
    try {
      const res = await fetch(`/api/version?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.version) {
          setServerVersion(json.version);
          if (json.version !== CURRENT_CLIENT_VERSION) {
            setIsUpdateAvailable(true);
            return true;
          }
        }
      }
    } catch (err) {
      console.warn('[AppUpdate] Failed to fetch server version:', err);
    }
    return false;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Initial version check
    checkServerVersion();

    // 2. Service Worker Update Listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        // If a service worker is already waiting to activate
        if (reg.waiting) {
          waitingWorkerRef.current = reg.waiting;
          if (!isDismissedRef.current) {
            setIsUpdateAvailable(true);
          }
        }

        // When a new service worker is found installing
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              waitingWorkerRef.current = installingWorker;
              if (!isDismissedRef.current) {
                setIsUpdateAvailable(true);
              }
            }
          };
        };

        // Proactively ask browser to check for sw.js changes
        try {
          reg.update().catch(() => {});
        } catch {}
      });

      // Reload when controller changes
      let refreshing = false;
      const handleControllerChange = () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    // 3. Periodic polling every 45s
    const interval = setInterval(() => {
      checkServerVersion();
    }, 45000);

    // 4. Check on tab visibility resume (e.g. smartphone wakes from sleep)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkServerVersion();
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            reg?.update().catch(() => {});
          });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkServerVersion]);

  // Apply update: skip waiting and reload cleanly
  const applyUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      if (waitingWorkerRef.current) {
        waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
      }

      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      // Also clean up any lingering old caches
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(
            keys.map((k) => {
              if (k !== 'speed-toeic-pwa-v3') {
                return caches.delete(k);
              }
            })
          );
        } catch {}
      }

      // Short delay to allow SW to activate, then reload
      setTimeout(() => {
        window.location.reload();
      }, 350);
    } catch {
      window.location.reload();
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    isDismissedRef.current = true;
    setIsUpdateAvailable(false);
  }, []);

  return {
    isUpdateAvailable,
    serverVersion,
    isUpdating,
    applyUpdate,
    dismissUpdate,
    checkForUpdateNow: checkServerVersion,
  };
}
