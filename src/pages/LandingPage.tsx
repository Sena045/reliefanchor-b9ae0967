import { useState, useEffect, forwardRef } from 'react';
import { Heart, MessageCircle, Brain, Gamepad2, Shield, Globe, ArrowRight, Check, Download, Share, Bookmark, Smartphone, Camera, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BreathingDemo } from '@/components/BreathingDemo';
import { PromoBanner } from '@/components/PromoBanner';
import { StickySignupBar } from '@/components/StickySignupBar';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';
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
    title: 'AI Companion',
    description: 'Chat with Anya, your empathetic AI friend available 24/7 for emotional support.',
  },
  {
    icon: Brain,
    title: 'Mood Tracking',
    description: 'Track your emotional patterns and get AI-powered weekly insights.',
  },
  {
    icon: Gamepad2,
    title: 'Wellness Games',
    description: 'Relaxing activities including breathing exercises, grounding, and mindfulness games.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your data is encrypted and never shared. Your mental health journey stays private.',
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

      {/* Hero Section - ULTRA COMPACT for mobile */}
      <section className="px-4 pt-4 pb-6 text-center max-w-4xl mx-auto">
        {/* One-tap Google Sign-in - THE FASTEST PATH */}
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
          Continue with Google — It's Free
        </Button>
        
        <p className="text-xs text-muted-foreground mb-4">
          <span className="text-green-600 font-medium">✓ 2,847 signed up today</span> • No credit card
        </p>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">or try first</span>
          </div>
        </div>
        
        <h1 className="text-2xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Feeling Anxious Right Now?
        </h1>
        
        <p className="text-base md:text-lg text-muted-foreground mb-2">
          👇 Tap the circle below — calm down in 30 seconds
        </p>
      </section>

      {/* Interactive Demo - Immediately After Hero */}
      <BreathingDemo onGetStarted={onGetStarted} />

      {/* Features Section */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Simple tools to calm your mind.
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

      {/* QR Code Section */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Camera className="w-6 h-6 text-primary" />
            <h2 className="text-xl md:text-2xl font-bold">
              Open camera → scan → instant calm
            </h2>
          </div>
          <p className="text-muted-foreground mb-6 text-sm">
            (no typing needed)
          </p>
          
          {/* QR Code Container */}
          <div className="inline-block p-4 bg-white rounded-2xl border-4 border-primary shadow-lg shadow-primary/20">
            <QRCodeSVG 
              value="https://reliefanchor.lovable.app"
              size={200}
              level="H"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#1a1a2e"
            />
          </div>
          
          <p className="text-xs text-muted-foreground mt-6 max-w-xs mx-auto">
            Works with Google Lens, phone camera, WhatsApp, Instagram
          </p>
        </div>
      </section>

      {/* Email Capture Section */}
      <section className="px-4 py-16 bg-primary/5">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-6">
            Get tips on mental wellness and be the first to know about new features.
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

      {/* Install App Section */}
      <section className="px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Tap & Install
          </h2>
          <p className="text-muted-foreground mb-6">
            Add to your home screen for instant access. Works offline!
          </p>

          {installPrompt ? (
            <Button size="lg" onClick={handleInstall} className="text-lg px-8">
              <Download className="mr-2 h-5 w-5" />
              Install Now
            </Button>
          ) : (() => {
            const instructions = getInstallInstructions();
            const IconComponent = instructions.icon;
            return (
              <div className="bg-muted/50 rounded-lg p-4 inline-flex items-center gap-3">
                <IconComponent className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm text-left">
                  <span>{instructions.text}</span>
                </p>
              </div>
            );
          })()}
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
      <ExitIntentPopup onSignUp={onGetStarted} />
    </div>
  );
});
