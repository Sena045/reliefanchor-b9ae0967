import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { HomePremiumBanner } from '../HomePremiumBanner';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <HomePremiumBanner />
      
      <main className="pb-20 min-h-screen">
        {children}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
