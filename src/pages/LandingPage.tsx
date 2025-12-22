import { useState, useEffect, forwardRef } from 'react';
import { Heart, MessageCircle, Brain, Gamepad2, Shield, Globe, ArrowRight, Check, Download, Share, Bookmark, Smartphone, Camera } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BreathingDemo } from '@/components/BreathingDemo';
import { PromoBanner } from '@/components/PromoBanner';

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

      {/* Hero Section */}
      <section className="px-4 pt-12 pb-16 text-center max-w-4xl mx-auto">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          ReliefAnchor
        </h1>
        
        <p className="text-xl text-muted-foreground mb-2">
          Calm your mind in 60 seconds.
        </p>
        
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Find calm, track your moods, and chat with an empathetic AI companion. Available in 8 languages, change from settings.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-3">
          <Button size="lg" onClick={onGetStarted} className="text-lg px-8">
            Sign Up Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          {installPrompt && (
            <Button size="lg" variant="outline" onClick={handleInstall}>
              <Download className="mr-2 h-5 w-5" />
              Install App
            </Button>
          )}

          <Button size="lg" variant="outline" onClick={handleBookmark}>
            <Bookmark className="mr-2 h-5 w-5" />
            Bookmark
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6 flex items-center justify-center gap-1">
          <Shield className="h-4 w-4" />
          Your data is encrypted and securely protected.
        </p>

        {!installPrompt && !browserInfo.isStandalone && (() => {
          const instructions = getInstallInstructions();
          const IconComponent = instructions.icon;
          return (
            <p className="text-sm text-muted-foreground">
              <IconComponent className="inline h-4 w-4 mx-1" /> {instructions.shortText}
            </p>
          );
        })()}

        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span>8 Languages</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>Private & Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="h-4 w-4" />
            <span>Works Offline</span>
          </div>
        </div>
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
    </div>
  );
});
