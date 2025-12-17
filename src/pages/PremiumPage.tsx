import { Crown, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PRICING } from '@/types';
import { razorpayService } from '@/services/razorpayService';
import { useToast } from '@/hooks/use-toast';

interface PremiumPageProps { onClose: () => void; }

const FEATURES = { en: ['Unlimited AI chat messages', 'Weekly mood insights', 'All wellness tools', 'Priority support'], hi: ['असीमित AI चैट संदेश', 'साप्ताहिक मूड अंतर्दृष्टि', 'सभी वेलनेस टूल्स', 'प्राथमिकता सहायता'] };

export function PremiumPage({ onClose }: PremiumPageProps) {
  const { settings, activatePremium, isPremium } = useApp();
  const { t } = useTranslation(settings.language);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const pricing = PRICING[settings.region];

  const handlePayment = async () => {
    setLoading(true);
    await razorpayService.initiatePayment(
      settings.region,
      () => { activatePremium(); toast({ title: settings.language === 'hi' ? 'प्रीमियम सक्रिय!' : 'Premium Activated!', description: settings.language === 'hi' ? 'आपका प्रीमियम खाता अब सक्रिय है।' : 'Your premium account is now active.' }); onClose(); },
      () => { setLoading(false); toast({ title: 'Cancelled', description: 'Payment was cancelled.' }); },
      (error) => { setLoading(false); toast({ title: 'Error', description: error, variant: 'destructive' }); }
    );
  };

  if (isPremium) {
    return (
      <div className="p-4 max-w-lg mx-auto safe-top">
        <Card className="text-center p-8"><Crown className="h-16 w-16 text-primary mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">{settings.language === 'hi' ? 'आप प्रीमियम सदस्य हैं!' : "You're Premium!"}</h2><p className="text-muted-foreground mb-4">{settings.language === 'hi' ? 'सभी सुविधाओं का आनंद लें।' : 'Enjoy all features.'}</p><Button variant="outline" onClick={onClose}>Back</Button></Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto safe-top">
      <div className="pt-4 text-center mb-6"><Crown className="h-12 w-12 text-primary mx-auto mb-2" /><h1 className="text-2xl font-bold">{t('getPremium')}</h1><p className="text-muted-foreground">{t('unlockFeatures')}</p></div>
      <Card className="mb-6"><CardContent className="p-6">
        <div className="text-center mb-6"><span className="text-4xl font-bold text-primary">{pricing.symbol}{pricing.amount}</span><span className="text-muted-foreground">/year</span></div>
        <ul className="space-y-3">
          {FEATURES[settings.language].map((f, i) => (<li key={i} className="flex items-center gap-2"><Check className="h-5 w-5 text-success" /><span>{f}</span></li>))}
        </ul>
      </CardContent></Card>
      <Button className="w-full h-12 text-lg" onClick={handlePayment} disabled={loading}>{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('upgradeNow')}</Button>
      <Button variant="ghost" className="w-full mt-2" onClick={onClose}>Maybe later</Button>
    </div>
  );
}
