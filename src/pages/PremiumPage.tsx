import { Crown, Check, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { razorpayService, PRICING, PlanType } from '@/services/razorpayService';
import { cn } from '@/lib/utils';

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
  const { t } = useTranslation(profile.language);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isIndia, setIsIndia] = useState<boolean | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [plan, setPlan] = useState<PlanType>('yearly');
  
  // Detect user's country on mount
  useEffect(() => {
    fetch('https://ip-api.com/json/?fields=countryCode')
      .then(res => res.json())
      .then(data => {
        const inIndia = data.countryCode === 'IN';
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

  const handlePayment = async (selectedPlan: PlanType) => {
    setLoading(true);
    await razorpayService.initiatePayment(
      selectedPlan,
      currency,
      () => {
        activatePremium(selectedPlan);
        toast({ 
          title: 'Premium Activated!', 
          description: `Your ${selectedPlan} subscription is now active.`
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

  if (isPremium) {
    return (
      <div className="p-4 max-w-lg mx-auto safe-top">
        <Card className="text-center p-8">
          <Crown className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">You're Premium!</h2>
          <p className="text-muted-foreground mb-2">Enjoy all features.</p>
          {premiumUntil && (
            <p className="text-sm text-muted-foreground mb-4">
              Expires: {premiumUntil.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
          <Button variant="outline" onClick={onClose}>Back</Button>
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
      
      {/* Currency Toggle - Only show if in India */}
      {isIndia && (
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
            Subscribe {plan === 'monthly' ? 'Monthly' : 'Yearly'} - {selectedPricing.symbol}{selectedPricing.display}
          </>
        )}
      </Button>
      <Button variant="ghost" className="w-full mt-2" onClick={onClose}>Maybe later</Button>
    </div>
  );
}
