import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Heart, Loader2, Mail, Lock, ArrowRight, Download, Share, ArrowLeft, Gift } from 'lucide-react';
import { referralService } from '@/services/referralService';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AuthPage() {
  const { signIn, signUp, resetPassword, signOut, isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const isRecoveryUrl =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('recovery') === '1' ||
      new URLSearchParams(window.location.hash.substring(1)).get('type') === 'recovery');

  const showReset = isPasswordRecovery || isRecoveryUrl;

  useEffect(() => {
    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      setIsLogin(false); // Switch to signup mode when there's a referral
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);
    
    // Check if already installed as PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isInStandaloneMode);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({ title: 'App installed!', description: 'ReliefAnchor has been added to your home screen.' });
      setInstallPrompt(null);
    }
  };

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        err.errors.forEach((e) => {
          if (e.path[0] === 'email') fieldErrors.email = e.message;
          if (e.path[0] === 'password') fieldErrors.password = e.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const validateEmail = () => {
    try {
      emailSchema.parse({ email });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors({ email: err.errors[0]?.message });
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Store referral code before signup so AppContext can apply it
      if (!isLogin && referralCode) {
        localStorage.setItem('pendingReferralCode', referralCode);
      }

      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        let message = error.message;
        if (error.message.includes('User already registered')) {
          message = 'An account with this email already exists. Please sign in.';
        } else if (error.message.includes('Invalid login credentials')) {
          message = 'Invalid email or password. Please try again.';
        }
        toast({ title: 'Error', description: message, variant: 'destructive' });
        // Clear pending referral on error
        localStorage.removeItem('pendingReferralCode');
      } else if (!isLogin) {
        toast({ title: 'Account created!', description: 'You are now signed in.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ 
          title: 'Check your email', 
          description: 'We sent you a password reset link.' 
        });
        setIsForgotPassword(false);
        setEmail('');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateNewPassword = () => {
    const errs: { password?: string; confirmPassword?: string } = {};
    
    try {
      passwordSchema.parse({ password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        errs.password = err.errors[0]?.message;
      }
    }
    
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateNewPassword()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Your password has been updated! Please sign in again.' });
        // Sign out first to avoid a brief "home" flash while recovery mode is cleared
        await signOut();
        clearPasswordRecovery();
        setPassword('');
        setConfirmPassword('');
        setIsLogin(true);
        setIsForgotPassword(false);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">ReliefAnchor</CardTitle>
            <CardDescription className="mt-2">
              {showReset
                ? 'Enter your new password below.'
                : isForgotPassword 
                  ? 'Enter your email to reset your password.'
                  : isLogin 
                    ? 'Welcome back! Sign in to continue.' 
                    : 'Create an account to get started.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {showReset ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Update Password
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  clearPasswordRecovery();
                  // Clear recovery URL parameter
                  const url = new URL(window.location.href);
                  url.searchParams.delete('recovery');
                  window.history.replaceState({}, '', url.toString());
                  setPassword('');
                  setConfirmPassword('');
                  setErrors({});
                }}
                className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                disabled={loading}
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Sign In
              </button>
            </form>
          ) : isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrors({});
                }}
                className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                disabled={loading}
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Sign In
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErrors({});
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {!isLogin && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Referral Code (optional)"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="pl-10 uppercase"
                        disabled={loading}
                        maxLength={8}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Have a friend's code? Enter it to give them free Premium days!
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  disabled={loading}
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </>
          )}

          <p className="mt-6 text-xs text-center text-muted-foreground">
            Your data is securely stored and never shared. Your mental health journey stays private.
          </p>

          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-center text-muted-foreground">
              <span className="font-medium text-foreground">🌐 8 Languages Supported</span>
              <br />
              English, Hindi, Spanish, French, German, Portuguese, Chinese & Japanese. Change anytime in Settings.
            </p>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-center text-muted-foreground">
              <span className="font-medium text-foreground">📌 Bookmark it now!</span>
              <br />
              Press <kbd className="px-1.5 py-0.5 mx-1 rounded bg-muted text-[10px] font-mono">Ctrl+D</kbd> (or <kbd className="px-1.5 py-0.5 mx-1 rounded bg-muted text-[10px] font-mono">⌘+D</kbd> on Mac) to save ReliefAnchor for quick access.
            </p>
          </div>

          {installPrompt && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={handleInstallClick}
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
          )}

          {isIOS && !isStandalone && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-center text-muted-foreground">
                <span className="font-medium text-foreground flex items-center justify-center gap-1">
                  <Download className="w-3 h-3" /> Install App
                </span>
                <span className="mt-1 block">
                  Tap <Share className="w-3 h-3 inline mx-0.5" /> Share → <span className="font-medium">Add to Home Screen</span>
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
