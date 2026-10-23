import { useEffect, useState, useCallback, useRef } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWAInstallResult {
  success: boolean;
  outcome?:
    | 'accepted'
    | 'dismissed'
    | 'unsupported'
    | 'already_installed'
    | 'ios_manual_needed'
    | 'in_app_browser'
    | 'iframe_blocked';
  error?: string;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined') {
      return (window as any)?.__pwaInstallPrompt || null;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any)?.standalone === true;
    const isAndroidApp = document.referrer?.includes('android-app://') || false;
    const isAppGlobal = (window as any)?.__pwaIsInstalled === true;
    return Boolean(isStandaloneMedia || isIOSStandalone || isAndroidApp || isAppGlobal);
  });

  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSamsungBrowser, setIsSamsungBrowser] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(deferredPrompt);
  deferredPromptRef.current = deferredPrompt;

  useEffect(() => {
    const checkStandalone = () => {
      if (typeof window === 'undefined') return false;
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any)?.standalone === true;
      const isAndroidApp = document.referrer?.includes('android-app://') || false;
      const isAppGlobal = (window as any)?.__pwaIsInstalled === true;
      return Boolean(isStandaloneMedia || isIOSStandalone || isAndroidApp || isAppGlobal);
    };

    setIsInstalled(checkStandalone());

    if (typeof window !== 'undefined') {
      const inIframe = window.self !== window.top;
      setIsInIframe(inIframe);

      if ((window as any)?.__pwaInstallPrompt) {
        setDeferredPrompt((window as any).__pwaInstallPrompt);
      }

      const ua = window.navigator.userAgent.toLowerCase();
      // iOS detection including iPads on iOS 13+ reporting MacIntel
      const iosDevice =
        /iphone|ipad|ipod/.test(ua) ||
        (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
      const androidDevice = /android/.test(ua);
      const samsungBrowser = /samsungbrowser/.test(ua);
      const chromeBrowser = /chrome/.test(ua) && !/edg/.test(ua) && !samsungBrowser;
      const inApp = /kakaotalk|naver|instagram|fb_iab|fbav|line|daumapps|whale/i.test(ua);
      const mobileDevice = androidDevice || iosDevice || /mobile/.test(ua);

      setIsIOS(iosDevice);
      setIsAndroid(androidDevice);
      setIsSamsungBrowser(samsungBrowser);
      setIsChrome(chromeBrowser);
      setIsInAppBrowser(inApp);
      setIsMobile(mobileDevice);

      // Listen for standalone mode changes
      const matchMediaStandalone = window.matchMedia('(display-mode: standalone)');
      const handleDisplayModeChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          setIsInstalled(true);
          (window as any).__pwaIsInstalled = true;
          setDeferredPrompt(null);
        }
      };
      if (matchMediaStandalone.addEventListener) {
        matchMediaStandalone.addEventListener('change', handleDisplayModeChange);
      }

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        const pEvent = e as BeforeInstallPromptEvent;
        (window as any).__pwaInstallPrompt = pEvent;
        setDeferredPrompt(pEvent);
      };

      const handlePromptReady = (e: any) => {
        if (e?.detail) {
          setDeferredPrompt(e.detail as BeforeInstallPromptEvent);
        } else if ((window as any).__pwaInstallPrompt) {
          setDeferredPrompt((window as any).__pwaInstallPrompt);
        }
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        (window as any).__pwaInstallPrompt = null;
        (window as any).__pwaIsInstalled = true;
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('pwa-prompt-ready', handlePromptReady);
      window.addEventListener('appinstalled', handleAppInstalled);
      window.addEventListener('pwa-app-installed', handleAppInstalled);

      return () => {
        if (matchMediaStandalone.removeEventListener) {
          matchMediaStandalone.removeEventListener('change', handleDisplayModeChange);
        }
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('pwa-prompt-ready', handlePromptReady);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('pwa-app-installed', handleAppInstalled);
      };
    }
  }, []);

  const install = useCallback(async (): Promise<PWAInstallResult> => {
    if (isInstalled) {
      return { success: false, outcome: 'already_installed' };
    }

    // 1. iOS Safari requires manual "Share -> Add to Home Screen"
    if (isIOS) {
      return { success: false, outcome: 'ios_manual_needed' };
    }

    // 2. In-App browser (Kakao, Naver) cannot trigger native PWA install
    if (isInAppBrowser) {
      return { success: false, outcome: 'in_app_browser' };
    }

    // 3. Iframe preview environment (AI Studio dev panel) blocks native PWA prompt
    if (isInIframe) {
      return { success: false, outcome: 'iframe_blocked' };
    }

    let promptEvent =
      deferredPromptRef.current ||
      (typeof window !== 'undefined' ? (window as any)?.__pwaInstallPrompt : null);

    // 4. If promptEvent is not ready immediately, wait up to 1200ms in case the event is just dispatching
    if (!promptEvent && typeof window !== 'undefined') {
      promptEvent = await new Promise<BeforeInstallPromptEvent | null>((resolve) => {
        let timer: any = null;
        const onPrompt = (e: Event) => {
          cleanup();
          resolve(e as BeforeInstallPromptEvent);
        };
        const onCustomReady = (e: any) => {
          cleanup();
          resolve(e.detail || (window as any)?.__pwaInstallPrompt || null);
        };
        const cleanup = () => {
          if (timer) clearTimeout(timer);
          window.removeEventListener('beforeinstallprompt', onPrompt);
          window.removeEventListener('pwa-prompt-ready', onCustomReady);
        };

        window.addEventListener('beforeinstallprompt', onPrompt, { once: true });
        window.addEventListener('pwa-prompt-ready', onCustomReady, { once: true });

        timer = setTimeout(() => {
          cleanup();
          resolve((window as any)?.__pwaInstallPrompt || null);
        }, 1200);
      });
    }

    // 5. If still no prompt event available on Android/Chrome
    if (!promptEvent) {
      return { success: false, outcome: 'unsupported' };
    }

    // 6. Direct execution of Android Chrome native prompt
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice && choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          (window as any).__pwaInstallPrompt = null;
          (window as any).__pwaIsInstalled = true;
        }
        return { success: true, outcome: 'accepted' };
      }

      // User closed the native Chrome prompt dialog
      return { success: false, outcome: 'dismissed' };
    } catch (err: any) {
      console.warn('[PWA] Native prompt execution error:', err);
      return { success: false, outcome: 'unsupported', error: err?.message };
    }
  }, [isInstalled, isIOS, isInAppBrowser, isInIframe]);

  return {
    isInstallable: !!(deferredPrompt || (typeof window !== 'undefined' && (window as any)?.__pwaInstallPrompt)),
    isInstalled,
    isIOS,
    isAndroid,
    isSamsungBrowser,
    isChrome,
    isInAppBrowser,
    isInIframe,
    isMobile,
    install,
  };
}
