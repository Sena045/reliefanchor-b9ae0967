import { useState, useEffect } from 'react';
import { Copy, Share2, Users, Gift, Check, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { referralService } from '@/services/referralService';

const MAX_REFERRALS = 10;

export function ReferralCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [remainingReferrals, setRemainingReferrals] = useState(MAX_REFERRALS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadReferralData = async () => {
      const [code, count, remaining] = await Promise.all([
        referralService.getReferralCode(user.id),
        referralService.getReferralCount(user.id),
        referralService.getRemainingReferrals(user.id),
      ]);
      setReferralCode(code);
      setReferralCount(count);
      setRemainingReferrals(remaining);
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

  const hasReferralsLeft = remainingReferrals > 0;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          Invite Friends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasReferralsLeft ? (
          <>
            <p className="text-sm text-muted-foreground">
              Share your code and get <span className="font-semibold text-primary">7 days free Premium</span> when a friend joins and completes their first breathing exercise!
            </p>

            {/* Remaining referrals counter */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
              <Info className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                You have <span className="font-semibold text-primary">{remainingReferrals}</span> referral{remainingReferrals !== 1 ? 's' : ''} left out of {MAX_REFERRALS}
              </span>
            </div>

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
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              You've reached the maximum of <span className="font-semibold">{MAX_REFERRALS}</span> referrals. Thank you for spreading the word!
            </p>
          </div>
        )}

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
