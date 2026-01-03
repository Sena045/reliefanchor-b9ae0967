import { useState, lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AppProvider } from '@/context/AppContext';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { UpdatePrompt } from '@/components/UpdatePrompt';
import { SplashLoader } from '@/components/SplashLoader';
import { NotificationOptInPrompt } from '@/components/NotificationOptInPrompt';
import { Capacitor } from '@capacitor/core';


// Lazy load ALL pages for faster initial load
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('@/pages/AuthPage').then(m => ({ default: m.AuthPage })));
const GuestChatPage = lazy(() => import('@/pages/GuestChatPage').then(m => ({ default: m.GuestChatPage })));
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const ChatPage = lazy(() => import('@/pages/ChatPage').then(m => ({ default: m.ChatPage })));
const MoodPage = lazy(() => import('@/pages/MoodPage').then(m => ({ default: m.MoodPage })));
const ToolsPage = lazy(() => import('@/pages/ToolsPage').then(m => ({ default: m.ToolsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PremiumPage = lazy(() => import('@/pages/PremiumPage').then(m => ({ default: m.PremiumPage })));
const PressKitPage = lazy(() => import('@/pages/PressKitPage').then(m => ({ default: m.PressKitPage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then(m => ({ default: m.AboutPage })));
const LegalPage = lazy(() => import('@/pages/LegalPage').then(m => ({ default: m.LegalPage })));
const DeleteAccountPage = lazy(() => import('@/pages/DeleteAccountPage').then(m => ({ default: m.DeleteAccountPage })));

function AppContent() {
  const { user, loading: authLoading, isPasswordRecovery } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showPremium, setShowPremium] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPressKit, setShowPressKit] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showGuestChat, setShowGuestChat] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);

  const isRecoveryUrl =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('recovery') === '1' ||
      new URLSearchParams(window.location.hash.substring(1)).get('type') === 'recovery');

  // Check for referral code in URL (should show auth page)
  const hasReferralCode = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('ref');

  // Check for try-chat URL path
  const isTryChatUrl = typeof window !== 'undefined' && 
    (window.location.pathname === '/try' || window.location.pathname === '/try-chat');

  // Check for legal page URLs
  const isPrivacyUrl = typeof window !== 'undefined' && window.location.pathname === '/privacy';
  const isTermsUrl = typeof window !== 'undefined' && window.location.pathname === '/terms';
  const isDeleteAccountUrl = typeof window !== 'undefined' && window.location.pathname === '/delete-account';

  if (authLoading) {
    return <SplashLoader />;
  }

  // Show AuthPage for password recovery even if user is logged in
  if (isPasswordRecovery || isRecoveryUrl) {
    return (
      <Suspense fallback={<SplashLoader />}>
        <AuthPage />
      </Suspense>
    );
  }

  // Show delete account page (accessible with or without login)
  if (isDeleteAccountUrl) {
    return (
      <Suspense fallback={<SplashLoader />}>
        <DeleteAccountPage 
          onClose={() => {
            window.history.pushState({}, '', '/');
            window.location.reload();
          }} 
        />
      </Suspense>
    );
  }

  // Show legal pages (accessible with or without login)
  if (showLegal || isPrivacyUrl || isTermsUrl) {
    const tab = showLegal || (isPrivacyUrl ? 'privacy' : 'terms');
    return (
      <Suspense fallback={<SplashLoader />}>
        <LegalPage 
          initialTab={tab} 
          onClose={() => {
            setShowLegal(null);
            if (isPrivacyUrl || isTermsUrl) {
              window.history.pushState({}, '', '/');
            }
          }} 
        />
      </Suspense>
    );
  }

  // Not logged in
  if (!user) {
    // Show guest chat trial (via state or URL)
    if (showGuestChat || isTryChatUrl) {
      return (
        <Suspense fallback={<SplashLoader />}>
          <GuestChatPage onSignUp={() => { setShowGuestChat(false); setShowAuth(true); }} />
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
    // Show auth page if explicitly requested, has referral code, or on native app (skip landing page)
    if (showAuth || hasReferralCode || Capacitor.isNativePlatform()) {
      return (
        <Suspense fallback={<SplashLoader />}>
          <AuthPage />
        </Suspense>
      );
    }
    // Show landing page by default (web only)
    return (
      <Suspense fallback={<SplashLoader />}>
        <LandingPage 
          onGetStarted={() => setShowAuth(true)} 
          onTryChat={() => setShowGuestChat(true)}
          onShowPressKit={() => setShowPressKit(true)}
          onShowAbout={() => setShowAbout(true)}
        />
      </Suspense>
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
      
      {/* Push notification opt-in prompt */}
      <NotificationOptInPrompt trigger="session_count" />
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
