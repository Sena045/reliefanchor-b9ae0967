import { Crown, Check, Loader2, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  initiatePayment, 
  PRICING, 
  PlanType,
  isNativeAndroid,
  initializeBilling,
  getGooglePlayPrice
} from '@/services/billingService';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';

interface PremiumPageProps { onClose: () => void; }

const FEATURES = [
  'Unlimited AI chat messages',
  'Weekly mood insights & analytics', 
  'All wellness games unlocked',
  'Export journal entries',
  'Priority AI responses'
];

export function PremiumPage({ onClose }: PremiumPageProps) {
  const { profile, activatePremium, isPremium, premiumUntil } = useApp();
  const { user } = useAuth();
  const { t } = useTranslation(profile.language);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isIndia, setIsIndia] = useState<boolean | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [plan, setPlan] = useState<PlanType>('yearly');
  
  // Initialize billing and detect country on mount
  useEffect(() => {
    // Initialize Google Play Billing if on Android
    if (isNativeAndroid()) {
      initializeBilling();
    }
    
    // Detect user's country using ipapi.co
    fetch('https://ipapi.co/country/')
      .then(res => res.text())
      .then(countryCode => {
        const inIndia = countryCode.trim() === 'IN';
        setIsIndia(inIndia);
        setCurrency(inIndia ? 'INR' : 'USD');
      })
      .catch(() => {
        setIsIndia(false);
        setCurrency('USD');
      });
  }, []);
  
  const monthlyPricing = PRICING.monthly[currency];
  const yearlyPricing = PRICING.yearly[currency];
  const selectedPricing = PRICING[plan][currency];
  
  // Calculate savings
  const yearlySavings = currency === 'USD' 
    ? `Save $${(4.99 * 12 - 49.99).toFixed(0)}` 
    : `Save ₹${(149 * 12 - 1499)}`;

  // Get display prices - use Google Play prices on Android if available
  const getDisplayPrice = (planType: PlanType): string => {
    if (isNativeAndroid()) {
      const googlePrice = getGooglePlayPrice(planType);
      if (googlePrice) return googlePrice;
    }
    const pricing = PRICING[planType][currency];
    return `${pricing.symbol}${pricing.display}`;
  };

  // Open Google Play subscription management
  const openSubscriptionManagement = () => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      window.open('https://play.google.com/store/account/subscriptions', '_system');
    } else {
      window.open('https://play.google.com/store/account/subscriptions', '_blank');
    }
  };

  const handlePayment = async (selectedPlan: PlanType) => {
    if (!user) {
      toast({ title: 'Error', description: 'Please sign in first', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    await initiatePayment(
      selectedPlan,
      currency,
      user.id,
      user.email || '',
      () => {
        // Optimistic update - backend will confirm
        activatePremium(selectedPlan);
        toast({ 
          title: 'Payment Successful!', 
          description: `Your ${selectedPlan} subscription is being activated.`
        });
        setLoading(false);
        onClose();
      },
      () => {
        setLoading(false);
        toast({ title: 'Cancelled', description: 'Payment was cancelled.' });
      },
      (error) => {
        setLoading(false);
        toast({ title: 'Error', description: error, variant: 'destructive' });
      }
    );
  };

  // Calculate trial countdown
  const getTrialCountdown = () => {
    if (!premiumUntil) return null;
    const now = new Date();
    const diff = premiumUntil.getTime() - now.getTime();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours, isTrial: days <= 7 };
  };

  const trialInfo = getTrialCountdown();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isPremium && !showUpgrade) {
    return (
      <div className="p-4 max-w-lg mx-auto safe-top">
        <Card className="text-center p-8">
          <Crown className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">You're Premium!</h2>
          <p className="text-muted-foreground mb-2">Enjoy all features.</p>
          
          {/* Trial Countdown Banner */}
          {trialInfo?.isTrial && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
              <p className="text-amber-600 dark:text-amber-400 font-semibold text-lg">
                Free Trial Ending Soon
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {trialInfo.days > 0 ? `${trialInfo.days} day${trialInfo.days !== 1 ? 's' : ''}` : ''} 
                {trialInfo.days > 0 && trialInfo.hours > 0 ? ', ' : ''}
                {trialInfo.hours > 0 ? `${trialInfo.hours} hour${trialInfo.hours !== 1 ? 's' : ''}` : ''}
                {trialInfo.days === 0 && trialInfo.hours === 0 ? 'Less than an hour' : ''} left
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Subscribe now to keep your premium features
              </p>
            </div>
          )}
          
          {premiumUntil && !trialInfo?.isTrial && (
            <p className="text-sm text-muted-foreground mb-4">
              Expires: {premiumUntil.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
          
          {trialInfo?.isTrial && (
            <Button className="w-full mb-3" onClick={() => setShowUpgrade(true)}>
              Upgrade Now
            </Button>
          )}
          
          {/* Manage Subscription Link - Android only */}
          {isNativeAndroid() && (
            <Button 
              variant="outline" 
              className="w-full mb-3 gap-2" 
              onClick={openSubscriptionManagement}
            >
              <ExternalLink className="h-4 w-4" />
              Manage Subscription
            </Button>
          )}
          
          <Button variant="ghost" onClick={onClose}>Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto safe-top">
      <div className="pt-4 text-center mb-6">
        <Crown className="h-12 w-12 text-primary mx-auto mb-2" />
        <h1 className="text-2xl font-bold">{t('getPremium')}</h1>
        <p className="text-muted-foreground">{t('unlockFeatures')}</p>
      </div>
      
      {/* Currency Toggle - Only show if in India and not on Android */}
      {isIndia && !isNativeAndroid() && (
        <div className="flex justify-center gap-2 mb-6">
          <Button 
            variant={currency === 'USD' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setCurrency('USD')}
          >
            $ USD
          </Button>
          <Button 
            variant={currency === 'INR' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setCurrency('INR')}
          >
            ₹ INR
          </Button>
        </div>
      )}
      
      {/* Plan Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Monthly Plan */}
        <Card 
          className={cn(
            'cursor-pointer transition-all',
            plan === 'monthly' 
              ? 'ring-2 ring-primary border-primary' 
              : 'hover:border-primary/50'
          )}
          onClick={() => setPlan('monthly')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Monthly</p>
            <p className="text-2xl font-bold text-foreground">
              {monthlyPricing.symbol}{monthlyPricing.display}
            </p>
            <p className="text-xs text-muted-foreground">/month</p>
          </CardContent>
        </Card>
        
        {/* Yearly Plan */}
        <Card 
          className={cn(
            'cursor-pointer transition-all relative',
            plan === 'yearly' 
              ? 'ring-2 ring-primary border-primary' 
              : 'hover:border-primary/50'
          )}
          onClick={() => setPlan('yearly')}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
            Best Value
          </div>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Yearly</p>
            <p className="text-2xl font-bold text-foreground">
              {yearlyPricing.symbol}{yearlyPricing.display}
            </p>
            <p className="text-xs text-muted-foreground">/year</p>
            <p className="text-xs text-green-600 font-medium mt-1">{yearlySavings}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Features */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <ul className="space-y-2.5">
            {FEATURES.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Button 
        className="w-full h-12 text-lg" 
        onClick={() => handlePayment(plan)} 
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Subscribe {plan === 'monthly' ? 'Monthly' : 'Yearly'} - {getDisplayPrice(plan)}
          </>
        )}
      </Button>
      
      {/* Subscription Terms - Google Play Policy Compliance */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          {plan === 'monthly' 
            ? `Subscription automatically renews monthly at ${getDisplayPrice('monthly')} unless cancelled.`
            : `Subscription automatically renews yearly at ${getDisplayPrice('yearly')} unless cancelled.`
          }
          {' '}You can cancel anytime through{' '}
          {isNativeAndroid() ? (
            <button 
              className="text-primary underline"
              onClick={(e) => {
                e.preventDefault();
                window.open('https://play.google.com/store/account/subscriptions', '_system');
              }}
            >
              Google Play settings
            </button>
          ) : (
            'your account settings'
          )}
          . By subscribing, you agree to our{' '}
          <a href="/legal?tab=terms" className="text-primary underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/legal?tab=privacy" className="text-primary underline">Privacy Policy</a>.
        </p>
      </div>
      
      {/* Mental Health Disclaimer */}
      <div className="mt-3 p-3 border border-amber-500/30 bg-amber-500/5 rounded-lg">
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center leading-relaxed">
          <strong>Important:</strong> ReliefAnchor is a wellness tool and is not a substitute for professional 
          mental health care, diagnosis, or treatment. If you are in crisis, please contact emergency services 
          or a mental health professional immediately.
        </p>
      </div>
      
      <Button variant="ghost" className="w-full mt-3" onClick={onClose}>Maybe later</Button>
    </div>
  );
}
