import { Home, MessageCircle, Smile, Sparkles, Settings } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', icon: Home, labelKey: 'home' as const },
  { id: 'chat', icon: MessageCircle, labelKey: 'chat' as const },
  { id: 'mood', icon: Smile, labelKey: 'mood' as const },
  { id: 'tools', icon: Sparkles, labelKey: 'tools' as const },
  { id: 'settings', icon: Settings, labelKey: 'settings' as const },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { settings } = useApp();
  const { t } = useTranslation(settings.language);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ id, icon: Icon, labelKey }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 tap-highlight-none transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon 
                className={cn(
                  'h-5 w-5 transition-transform',
                  isActive && 'scale-110'
                )} 
              />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
