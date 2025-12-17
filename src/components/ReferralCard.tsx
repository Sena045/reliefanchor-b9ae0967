import { useState, useEffect } from 'react';
import { Copy, Share2, Users, Gift, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { referralService } from '@/services/referralService';

export function ReferralCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadReferralData = async () => {
      const code = await referralService.getReferralCode(user.id);
      const count = await referralService.getReferralCount(user.id);
      setReferralCode(code);
      setReferralCount(count);
    };

    loadReferralData();
  }, [user]);

  const copyCode = async () => {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({ title: 'Referral code copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!referralCode) return;

    const shareData = {
      title: 'ReliefAnchor - AI Mental Wellness',
      text: referralService.getShareText(referralCode),
      url: referralService.getShareUrl(referralCode),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed, copy to clipboard instead
        copyCode();
      }
    } else {
      copyCode();
    }
  };

  if (!referralCode) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          Invite Friends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your code and get <span className="font-semibold text-primary">7 days free Premium</span> for each friend who joins!
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted/50 rounded-lg px-4 py-3 font-mono text-lg tracking-widest text-center">
            {referralCode}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={copyCode}
            className="shrink-0"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <Button onClick={shareReferral} className="w-full">
          <Share2 className="h-4 w-4 mr-2" />
          Share Invite Link
        </Button>

        {referralCount > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Users className="h-4 w-4" />
            <span>
              <span className="font-semibold text-foreground">{referralCount}</span> friend{referralCount !== 1 ? 's' : ''} joined
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
