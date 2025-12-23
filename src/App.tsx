import { useState, lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AppProvider } from '@/context/AppContext';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthPage } from '@/pages/AuthPage';
import { LandingPage } from '@/pages/LandingPage';
import { Toaster } from '@/components/ui/toaster';
import { UpdatePrompt } from '@/components/UpdatePrompt';
import { SplashLoader } from '@/components/SplashLoader';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';

// Lazy load pages for better initial load performance
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const ChatPage = lazy(() => import('@/pages/ChatPage').then(m => ({ default: m.ChatPage })));
const MoodPage = lazy(() => import('@/pages/MoodPage').then(m => ({ default: m.MoodPage })));
const ToolsPage = lazy(() => import('@/pages/ToolsPage').then(m => ({ default: m.ToolsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PremiumPage = lazy(() => import('@/pages/PremiumPage').then(m => ({ default: m.PremiumPage })));
const PressKitPage = lazy(() => import('@/pages/PressKitPage').then(m => ({ default: m.PressKitPage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then(m => ({ default: m.AboutPage })));
const MarketingOnePager = lazy(() => import('@/pages/MarketingOnePager').then(m => ({ default: m.MarketingOnePager })));

function AppContent() {
  const { user, loading: authLoading, isPasswordRecovery } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showPremium, setShowPremium] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPressKit, setShowPressKit] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showMarketing, setShowMarketing] = useState(false);

  const isRecoveryUrl =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('recovery') === '1' ||
      new URLSearchParams(window.location.hash.substring(1)).get('type') === 'recovery');

  // Check for referral code in URL (should show auth page)
  const hasReferralCode = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('ref');

  if (authLoading) {
    return <SplashLoader />;
  }

  // Show AuthPage for password recovery even if user is logged in
  if (isPasswordRecovery || isRecoveryUrl) {
    return <AuthPage />;
  }

  // Not logged in
  if (!user) {
    // Show marketing one-pager
    if (showMarketing) {
      return (
        <Suspense fallback={<SplashLoader />}>
          <MarketingOnePager onClose={() => setShowMarketing(false)} />
        </Suspense>
      );
    }
    // Show about page
    if (showAbout) {
      return (
        <Suspense fallback={<SplashLoader />}>
          <AboutPage onClose={() => setShowAbout(false)} />
        </Suspense>
      );
    }
    // Show press kit page
    if (showPressKit) {
      return (
        <Suspense fallback={<SplashLoader />}>
          <PressKitPage onClose={() => setShowPressKit(false)} />
        </Suspense>
      );
    }
    // Show auth page if explicitly requested or has referral code
    if (showAuth || hasReferralCode) {
      return <AuthPage />;
    }
    // Show landing page by default
    return (
      <>
        <LandingPage 
          onGetStarted={() => setShowAuth(true)} 
          onShowPressKit={() => setShowPressKit(true)}
          onShowAbout={() => setShowAbout(true)}
          onShowMarketing={() => setShowMarketing(true)}
        />
        <ExitIntentPopup onSignUp={() => setShowAuth(true)} />
      </>
    );
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AuthenticatedApp />
        <Toaster />
        <UpdatePrompt />
      </AuthProvider>
    </ThemeProvider>
  );
}
