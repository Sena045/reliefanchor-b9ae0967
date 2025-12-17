import { supabase } from '@/integrations/supabase/client';

export const referralService = {
  async getReferralCode(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();
    return data?.referral_code || null;
  },

  async getReferralCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', userId);
    return count || 0;
  },

  async applyReferralCode(referralCode: string, newUserId: string): Promise<boolean> {
    // Find the referrer by code
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (!referrer || referrer.id === newUserId) {
      return false;
    }

    // Create referral record
    const { error: refError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: newUserId,
      });

    if (refError) {
      console.error('Error creating referral:', refError);
      return false;
    }

    // Update referred user's profile
    await supabase
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', newUserId);

    // Award 7 days premium to referrer
    const { data: referrerProfile } = await supabase
      .from('profiles')
      .select('is_premium, premium_until')
      .eq('id', referrer.id)
      .single();

    const now = new Date();
    let newPremiumUntil: Date;

    if (referrerProfile?.is_premium && referrerProfile.premium_until) {
      // Extend existing premium
      newPremiumUntil = new Date(referrerProfile.premium_until);
      newPremiumUntil.setDate(newPremiumUntil.getDate() + 7);
    } else {
      // Start new premium period
      newPremiumUntil = new Date(now);
      newPremiumUntil.setDate(newPremiumUntil.getDate() + 7);
    }

    await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_until: newPremiumUntil.toISOString(),
      })
      .eq('id', referrer.id);

    // Mark referral as rewarded
    await supabase
      .from('referrals')
      .update({ rewarded: true })
      .eq('referred_id', newUserId);

    return true;
  },

  getShareUrl(referralCode: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?ref=${referralCode}`;
  },

  getShareText(referralCode: string): string {
    return `Try ReliefAnchor - your AI mental wellness companion. Use my referral code ${referralCode} to sign up! ${referralService.getShareUrl(referralCode)}`;
  },
};
