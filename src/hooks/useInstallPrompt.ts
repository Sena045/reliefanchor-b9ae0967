import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallPromptState = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
};

let globalState: InstallPromptState = {
  deferredPrompt: null,
  isInstallable: false,
  isInstalled: false,
};

let listenersInitialized = false;
const subscribers = new Set<(s: InstallPromptState) => void>();

function setGlobalState(next: Partial<InstallPromptState>) {
  globalState = { ...globalState, ...next };
  subscribers.forEach((fn) => fn(globalState));
}

function detectInstalledOnce() {
  // Check if already installed (standalone mode)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    setGlobalState({ isInstalled: true, isInstallable: false, deferredPrompt: null });
    return;
  }

  // iOS standalone
  if ((navigator as any).standalone === true) {
    setGlobalState({ isInstalled: true, isInstallable: false, deferredPrompt: null });
  }
}

function ensureListeners() {
  if (listenersInitialized) return;
  listenersInitialized = true;

  detectInstalledOnce();

  const handleBeforeInstallPrompt = (e: Event) => {
    // Allow us to show our own UI
    e.preventDefault();
    setGlobalState({ deferredPrompt: e as BeforeInstallPromptEvent, isInstallable: true });
  };

  const handleAppInstalled = () => {
    setGlobalState({ isInstalled: true, isInstallable: false, deferredPrompt: null });
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
}

export function useInstallPrompt() {
  const [state, setState] = useState<InstallPromptState>(globalState);

  useEffect(() => {
    ensureListeners();

    // Keep local state in sync with the shared global state
    const sub = (s: InstallPromptState) => setState(s);
    subscribers.add(sub);

    // In case install state changed between imports/mounts
    detectInstalledOnce();

    return () => {
      subscribers.delete(sub);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!globalState.deferredPrompt) return false;

    try {
      await globalState.deferredPrompt.prompt();
      const { outcome } = await globalState.deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setGlobalState({ isInstalled: true, isInstallable: false });
      }

      // Chrome won't let us reuse the prompt; clear it either way
      setGlobalState({ deferredPrompt: null });
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt error:', error);
      return false;
    }
  }, []);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return {
    isInstallable: state.isInstallable,
    isInstalled: state.isInstalled,
    promptInstall,
    isIOS,
    isSafari,
    showIOSInstructions: isIOS && !state.isInstalled,
  };
}

