import { supabase } from '@/integrations/supabase/client';

// Get user's IP address from a public API
async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

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
      .eq('referrer_id', userId)
      .eq('rewarded', true);
    return count || 0;
  },

  async getRemainingReferrals(userId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_remaining_referrals', {
      p_user_id: userId,
    });
    if (error) {
      console.error('Error getting remaining referrals:', error);
      return 5;
    }
    return data ?? 5;
  },

  async getPendingReferralsCount(userId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_pending_referrals_count', {
      p_user_id: userId,
    });
    if (error) {
      console.error('Error getting pending referrals:', error);
      return 0;
    }
    return data ?? 0;
  },

  async applyReferralCode(referralCode: string, newUserId: string): Promise<boolean> {
    // Get client IP for abuse prevention
    const ipAddress = await getClientIP();
    
    // Use the secure database function to apply the referral
    const { data, error } = await supabase.rpc('apply_referral_reward', {
      p_referral_code: referralCode.toUpperCase(),
      p_new_user_id: newUserId,
      p_ip_address: ipAddress,
    });

    if (error) {
      console.error('Error applying referral:', error);
      return false;
    }

    return data === true;
  },

  async completeReferralAfterExercise(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('complete_referral_after_exercise', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error completing referral:', error);
      return false;
    }

    return data === true;
  },

  async hasCompletedFirstExercise(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('first_exercise_at')
      .eq('id', userId)
      .single();
    return data?.first_exercise_at != null;
  },

  getShareUrl(referralCode: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?ref=${referralCode}`;
  },

  getShareText(referralCode: string): string {
    return `Try ReliefAnchor - your AI mental wellness companion. Use my referral code ${referralCode} to sign up! ${referralService.getShareUrl(referralCode)}`;
  },
};
