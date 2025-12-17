import { Crown, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { razorpayService, PRICING } from '@/services/razorpayService';

interface PremiumPageProps { onClose: () => void; }

const FEATURES = [
  'Unlimited AI chat messages',
  'Weekly mood insights & analytics', 
  'All wellness games unlocked',
  'Export journal entries',
  'Priority AI responses'
];

export function PremiumPage({ onClose }: PremiumPageProps) {
  const { settings, activatePremium, isPremium } = useApp();
  const { t } = useTranslation(settings.language);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  
  const pricing = PRICING[currency];

  const handlePayment = async () => {
    setLoading(true);
    await razorpayService.initiatePayment(
      currency,
      () => {
        activatePremium();
        toast({ 
          title: 'Premium Activated!', 
          description: 'Your premium account is now active.' 
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
          <p className="text-muted-foreground mb-4">Enjoy all features.</p>
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
      
      {/* Currency Toggle */}
      <div className="flex justify-center gap-2 mb-4">
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
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <span className="text-4xl font-bold text-primary">
              {pricing.symbol}{pricing.display}
            </span>
            <span className="text-muted-foreground">/year</span>
          </div>
          <ul className="space-y-3">
            {FEATURES.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Button className="w-full h-12 text-lg" onClick={handlePayment} disabled={loading}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('upgradeNow')}
      </Button>
      <Button variant="ghost" className="w-full mt-2" onClick={onClose}>Maybe later</Button>
    </div>
  );
}
