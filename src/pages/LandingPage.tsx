import { useState, useEffect, forwardRef } from 'react';
import { Heart, MessageCircle, Brain, Gamepad2, Shield, Globe, ArrowRight, Check, Download, Share, Bookmark, Smartphone, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { PromoBanner } from '@/components/PromoBanner';
import { StickySignupBar } from '@/components/StickySignupBar';

import { SocialProof } from '@/components/SocialProof';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface LandingPageProps {
  onGetStarted: () => void;
  onShowPressKit?: () => void;
}

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'A Calm Space to Talk',
    description: 'Write out what you are feeling. Anya listens without judgment, anytime you need.',
  },
  {
    icon: Brain,
    title: 'See Your Patterns Over Time',
    description: 'Track how you feel day to day. Small insights can make a big difference.',
  },
  {
    icon: Gamepad2,
    title: 'Gentle Tools for Tough Moments',
    description: 'Simple exercises to help you slow down when things feel overwhelming.',
  },
  {
    icon: Shield,
    title: 'Private by Design',
    description: 'Your reflections stay yours. Encrypted, never shared, never sold.',
  },
];


export const LandingPage = forwardRef<HTMLDivElement, LandingPageProps>(function LandingPage({ onGetStarted, onShowPressKit }, ref) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to sign in with Google', variant: 'destructive' });
    }
  };
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [browserInfo, setBrowserInfo] = useState({
    isIOS: false,
    isAndroid: false,
    isChrome: false,
    isSafari: false,
    isFirefox: false,
    isEdge: false,
    isSamsung: false,
    isOpera: false,
    isMobile: false,
    isStandalone: false
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isAndroidDevice = /Android/.test(ua);
    const isMobileDevice = isIOSDevice || isAndroidDevice || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    // Check if already installed as PWA
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    
    // Browser detection
    const isChromeBrowser = /Chrome/.test(ua) && !/Edge|Edg|OPR|Samsung/.test(ua);
    const isEdgeBrowser = /Edg/.test(ua);
    const isSafariBrowser = /Safari/.test(ua) && !/Chrome|Chromium|Android/.test(ua);
    const isFirefoxBrowser = /Firefox/.test(ua);
    const isSamsungBrowser = /SamsungBrowser/.test(ua);
    const isOperaBrowser = /OPR|Opera/.test(ua);
    
    setBrowserInfo({
      isIOS: isIOSDevice,
      isAndroid: isAndroidDevice,
      isChrome: isChromeBrowser,
      isSafari: isSafariBrowser,
      isFirefox: isFirefoxBrowser,
      isEdge: isEdgeBrowser,
      isSamsung: isSamsungBrowser,
      isOpera: isOperaBrowser,
      isMobile: isMobileDevice,
      isStandalone: isStandaloneMode
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const getInstallInstructions = () => {
    const { isIOS, isAndroid, isSafari, isFirefox, isChrome, isEdge, isSamsung, isOpera, isMobile } = browserInfo;
    
    // iOS devices (all browsers on iOS use Safari engine)
    if (isIOS) {
      return {
        icon: Share,
        text: 'Tap Share → Add to Home Screen',
        shortText: 'Share → Add to Home Screen'
      };
    }
    
    // Android with Samsung Internet
    if (isAndroid && isSamsung) {
      return {
        icon: Download,
        text: 'Tap Menu (☰) → Add page to → Home screen',
        shortText: 'Menu → Add to Home screen'
      };
    }
    
    // Android with Firefox
    if (isAndroid && isFirefox) {
      return {
        icon: Download,
        text: 'Tap Menu (⋮) → Install',
        shortText: 'Menu → Install'
      };
    }
    
    // Android with Opera
    if (isAndroid && isOpera) {
      return {
        icon: Download,
        text: 'Tap Menu (⋮) → Home screen',
        shortText: 'Menu → Home screen'
      };
    }
    
    // Android Chrome/Edge (supports beforeinstallprompt)
    if (isAndroid && (isChrome || isEdge)) {
      return {
        icon: Download,
        text: 'Tap Menu (⋮) → Install app',
        shortText: 'Menu → Install app'
      };
    }
    
    // Desktop Safari
    if (isSafari && !isMobile) {
      return {
        icon: Share,
        text: 'Click Share → Add to Dock',
        shortText: 'Share → Add to Dock'
      };
    }
    
    // Desktop Firefox
    if (isFirefox && !isMobile) {
      return {
        icon: Bookmark,
        text: 'Press Ctrl+D to bookmark, or use Chrome/Edge for install',
        shortText: 'Bookmark (Ctrl+D) or use Chrome/Edge'
      };
    }
    
    // Desktop Chrome/Edge (supports beforeinstallprompt)
    if ((isChrome || isEdge) && !isMobile) {
      return {
        icon: Download,
        text: 'Click the install icon in address bar, or Menu → Install',
        shortText: 'Install from address bar'
      };
    }
    
    // Fallback for other browsers
    return {
      icon: Download,
      text: 'Look for "Add to Home Screen" or "Install" in your browser menu',
      shortText: 'Check browser menu to install'
    };
  };

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({ title: 'App installed!', description: 'ReliefAnchor has been added to your home screen.' });
        setInstallPrompt(null);
      }
    }
  };

  const handleBookmark = () => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const shortcut = isMac ? '⌘+D' : 'Ctrl+D';
    toast({ 
      title: 'Bookmark this page', 
      description: `Press ${shortcut} to add ReliefAnchor to your bookmarks.` 
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      // Get client IP for rate limiting
      let ipAddress: string | null = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip || null;
      } catch {
        // Continue without IP if fetch fails
      }

      const { error } = await supabase
        .from('email_subscribers')
        .insert({ 
          email: email.trim().toLowerCase(),
          ip_address: ipAddress
        });
      
      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Already subscribed!', description: "You're already on our list." });
        } else if (error.code === '23514' || error.message?.includes('rate limit')) {
          toast({ title: 'Too many requests', description: 'Please try again later.', variant: 'destructive' });
        } else {
          throw error;
        }
      } else {
        toast({ title: 'Thanks!', description: "We'll keep you updated on new features." });
      }
      setEmail('');
    } catch (err) {
      toast({ title: 'Oops!', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div ref={ref} className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <PromoBanner />

      {/* Hero Section */}
      <section className="px-4 pt-8 pb-8 text-center max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          When your mind feels full, this is your quiet corner
        </h1>
        
        <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
          Create a free account to save your reflections, return when you need to, and notice what helps over time.
        </p>

        {/* Value bullets */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 text-sm">
          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
            <Check className="h-4 w-4 text-primary" />
            <span>Your progress saved privately</span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
            <Check className="h-4 w-4 text-primary" />
            <span>Return whenever you need</span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
            <Check className="h-4 w-4 text-primary" />
            <span>See patterns in how you feel</span>
          </div>
        </div>

        {/* Primary CTA */}
        <Button 
          size="lg" 
          onClick={handleGoogleSignIn} 
          className="w-full max-w-sm mb-4 text-base bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-md"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Create Your Free Account
        </Button>
        
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Shield className="h-3 w-3 text-green-600" />
          <span>Free to use. No credit card needed. Your data stays private.</span>
        </p>

        {/* Premium transparency */}
        <p className="text-xs text-muted-foreground mt-4">
          Premium is optional and adds deeper insights and extended tools.
        </p>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-12 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-xl font-bold text-primary">
                1
              </div>
              <h3 className="font-semibold mb-2">Create Your Space</h3>
              <p className="text-sm text-muted-foreground">
                Sign up with Google. It takes a few seconds. Nothing to install.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-xl font-bold text-primary">
                2
              </div>
              <h3 className="font-semibold mb-2">Use It Your Way</h3>
              <p className="text-sm text-muted-foreground">
                Write, reflect, or try a calming exercise. Whatever feels right today.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-xl font-bold text-primary">
                3
              </div>
              <h3 className="font-semibold mb-2">Come Back Anytime</h3>
              <p className="text-sm text-muted-foreground">
                Your reflections are saved. Over time, you may start to notice what helps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            What you will find here
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="border-primary/10">
                <CardContent className="p-6 flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Email Capture Section */}
      <section className="px-4 py-16 bg-primary/5">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Stay in the loop</h2>
          <p className="text-muted-foreground mb-6">
            Occasional updates on new features and gentle reminders to check in with yourself.
          </p>
          
          <form onSubmit={handleEmailSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Subscribe</Button>
          </form>
          
          <p className="text-xs text-muted-foreground mt-3">
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </section>


      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Start Your Wellness Journey Today
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands finding peace with ReliefAnchor. Free to start, always private.
          </p>
          
          <Button size="lg" onClick={onGetStarted} className="text-lg px-8">
            Sign Up Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ReliefAnchor. All rights reserved.</p>
        <div className="mt-3 flex items-center justify-center gap-4">
          {onShowPressKit && (
            <button 
              onClick={onShowPressKit}
              className="hover:text-primary transition-colors"
            >
              Press Kit
            </button>
          )}
          <span>•</span>
          <span>Made with ❤️ for your mental wellness</span>
        </div>
      </footer>

      {/* Conversion Components */}
      <StickySignupBar onSignUp={onGetStarted} />
      
    </div>
  );
});
