import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { PromoBanner } from '../PromoBanner';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <PromoBanner />
      
      <main className="pb-20 min-h-screen">
        {children}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
