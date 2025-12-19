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
    // Use the secure database function to apply the referral
    const { data, error } = await supabase.rpc('apply_referral_reward', {
      p_referral_code: referralCode.toUpperCase(),
      p_new_user_id: newUserId,
    });

    if (error) {
      console.error('Error applying referral:', error);
      return false;
    }

    return data === true;
  },

  getShareUrl(referralCode: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?ref=${referralCode}`;
  },

  getShareText(referralCode: string): string {
    return `Try ReliefAnchor - your AI mental wellness companion. Use my referral code ${referralCode} to sign up! ${referralService.getShareUrl(referralCode)}`;
  },
};
