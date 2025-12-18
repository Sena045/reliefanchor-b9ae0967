import { forwardRef } from 'react';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const UpdatePrompt = forwardRef<HTMLDivElement>(function UpdatePrompt(_, ref) {
  const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();

  if (!updateAvailable) return null;

  return (
    <div ref={ref} className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-card p-3 shadow-lg">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <RefreshCw className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Update available</p>
          <p className="text-xs text-muted-foreground truncate">Tap to get the latest version</p>
        </div>
        <Button size="sm" onClick={applyUpdate} className="shrink-0">
          Update
        </Button>
      </div>
    </div>
  );
});
