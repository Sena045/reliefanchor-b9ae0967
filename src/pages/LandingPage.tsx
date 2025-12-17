import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Brain, Gamepad2, Shield, Globe, ArrowRight, Check, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface LandingPageProps {
  onGetStarted: () => void;
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


export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      const { error } = await supabase
        .from('email_subscribers')
        .insert({ email: email.trim().toLowerCase() });
      
      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Already subscribed!', description: "You're already on our list." });
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="px-4 pt-12 pb-16 text-center max-w-4xl mx-auto">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          ReliefAnchor
        </h1>
        
        <p className="text-xl text-muted-foreground mb-2">
          Your AI Mental Wellness Companion
        </p>
        
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Find calm, track your moods, and chat with an empathetic AI companion. Available in 8 languages.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Button size="lg" onClick={onGetStarted} className="text-lg px-8">
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          {installPrompt && (
            <Button size="lg" variant="outline" onClick={handleInstall}>
              <Download className="mr-2 h-5 w-5" />
              Install App
            </Button>
          )}
        </div>

        {isIOS && (
          <p className="text-sm text-muted-foreground">
            <Share className="inline h-4 w-4 mx-1" /> Tap Share → Add to Home Screen to install
          </p>
        )}

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

      {/* Features Section */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Everything You Need for Mental Wellness
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
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ReliefAnchor. All rights reserved.</p>
        <p className="mt-2">
          Made with ❤️ for your mental wellness
        </p>
      </footer>
    </div>
  );
}
