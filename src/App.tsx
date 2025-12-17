import { useState } from 'react';
import { AppProvider } from '@/context/AppContext';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HomePage } from '@/pages/HomePage';
import { ChatPage } from '@/pages/ChatPage';
import { MoodPage } from '@/pages/MoodPage';
import { ToolsPage } from '@/pages/ToolsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PremiumPage } from '@/pages/PremiumPage';
import { Toaster } from '@/components/ui/toaster';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [showPremium, setShowPremium] = useState(false);

  if (showPremium) {
    return <PremiumPage onClose={() => setShowPremium(false)} />;
  }

  const handleNavigate = (tab: string) => {
    if (tab === 'premium') {
      setShowPremium(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      <ErrorBoundary>
        {activeTab === 'home' && <HomePage onNavigate={handleNavigate} />}
        {activeTab === 'chat' && <ChatPage onShowPremium={() => setShowPremium(true)} />}
        {activeTab === 'mood' && <MoodPage />}
        {activeTab === 'tools' && <ToolsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </ErrorBoundary>
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster />
    </AppProvider>
  );
}
