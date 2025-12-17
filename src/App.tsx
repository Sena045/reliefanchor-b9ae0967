import { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AppProvider } from '@/context/AppContext';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthPage } from '@/pages/AuthPage';
import { Toaster } from '@/components/ui/toaster';
import { UpdatePrompt } from '@/components/UpdatePrompt';
import { SplashLoader } from '@/components/SplashLoader';

// Lazy load pages for better initial load performance
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const ChatPage = lazy(() => import('@/pages/ChatPage').then(m => ({ default: m.ChatPage })));
const MoodPage = lazy(() => import('@/pages/MoodPage').then(m => ({ default: m.MoodPage })));
const ToolsPage = lazy(() => import('@/pages/ToolsPage').then(m => ({ default: m.ToolsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PremiumPage = lazy(() => import('@/pages/PremiumPage').then(m => ({ default: m.PremiumPage })));

function AppContent() {
  const { user, loading: authLoading, isPasswordRecovery } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showPremium, setShowPremium] = useState(false);

  const isRecoveryUrl =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('recovery') === '1' ||
      new URLSearchParams(window.location.hash.substring(1)).get('type') === 'recovery');

  if (authLoading) {
    return <SplashLoader />;
  }

  // Show AuthPage for password recovery even if user is logged in
  if (!user || isPasswordRecovery || isRecoveryUrl) {
    return <AuthPage />;
  }

  if (showPremium) {
    return (
      <Suspense fallback={<SplashLoader />}>
        <PremiumPage onClose={() => setShowPremium(false)} />
      </Suspense>
    );
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
        <Suspense fallback={<SplashLoader />}>
          {activeTab === 'home' && <HomePage onNavigate={handleNavigate} />}
          {activeTab === 'chat' && <ChatPage onShowPremium={() => setShowPremium(true)} />}
          {activeTab === 'mood' && <MoodPage />}
          {activeTab === 'tools' && <ToolsPage onShowPremium={() => setShowPremium(true)} />}
          {activeTab === 'settings' && <SettingsPage />}
        </Suspense>
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
      <UpdatePrompt />
    </AuthProvider>
  );
}
