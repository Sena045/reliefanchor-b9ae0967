import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Promo Banner */}
      <div className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-emerald-500 py-3 px-4 text-center">
        <p className="text-white text-lg md:text-2xl font-bold tracking-wide">
          🎉 7 DAYS FREE PREMIUM
        </p>
      </div>
      
      <main className="pb-20 min-h-screen">
        {children}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
