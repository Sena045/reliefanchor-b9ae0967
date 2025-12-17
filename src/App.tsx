import { useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AppProvider } from '@/context/AppContext';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HomePage } from '@/pages/HomePage';
import { ChatPage } from '@/pages/ChatPage';
import { MoodPage } from '@/pages/MoodPage';
import { ToolsPage } from '@/pages/ToolsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PremiumPage } from '@/pages/PremiumPage';
import { AuthPage } from '@/pages/AuthPage';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton } from '@/components/Skeleton';

function AppContent() {
  const { user, loading: authLoading, isPasswordRecovery } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showPremium, setShowPremium] = useState(false);

  const isRecoveryUrl =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('recovery') === '1' ||
      new URLSearchParams(window.location.hash.substring(1)).get('type') === 'recovery');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  // Show AuthPage for password recovery even if user is logged in
  if (!user || isPasswordRecovery || isRecoveryUrl) {
    return <AuthPage />;
  }

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

function AuthenticatedApp() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
      <Toaster />
    </AuthProvider>
  );
}
