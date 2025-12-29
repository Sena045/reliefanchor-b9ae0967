import { useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallAppPrompt() {
  const [dismissed, setDismissed] = useState(() => {
    // Reset dismissed state after 7 days to re-show prompt
    const dismissedAt = localStorage.getItem('install-prompt-dismissed-at');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed > 7) {
        localStorage.removeItem('install-prompt-dismissed');
        localStorage.removeItem('install-prompt-dismissed-at');
        return false;
      }
    }
    return localStorage.getItem('install-prompt-dismissed') === 'true';
  });
  
  const { isInstallable, isInstalled, promptInstall, showIOSInstructions } = useInstallPrompt();

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('install-prompt-dismissed', 'true');
    localStorage.setItem('install-prompt-dismissed-at', Date.now().toString());
  };

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      handleDismiss();
    }
  };

  // Don't show if already installed, dismissed, or not on mobile
  if (isInstalled || dismissed) return null;
  
  // Show nothing if not installable and not iOS
  if (!isInstallable && !showIOSInstructions) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Download className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              Install ReliefAnchor
            </h3>
            
            {showIOSInstructions ? (
              <div className="mt-1">
                <p className="text-xs text-muted-foreground mb-2">
                  Add to your home screen for the best experience:
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Share className="h-3 w-3" /> Tap Share
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add to Home Screen
                  </span>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get quick access from your home screen
                </p>
                <Button 
                  onClick={handleInstall}
                  size="sm"
                  className="mt-2 h-8 text-xs"
                >
                  Install App
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
