-- Create a secure function to apply referral rewards
-- This runs with elevated privileges to update the referrer's profile
CREATE OR REPLACE FUNCTION public.apply_referral_reward(
  p_referral_code TEXT,
  p_new_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_premium_until TIMESTAMPTZ;
  v_referrer_is_premium BOOLEAN;
  v_new_premium_until TIMESTAMPTZ;
BEGIN
  -- Find the referrer by code
  SELECT id, is_premium, premium_until 
  INTO v_referrer_id, v_referrer_is_premium, v_referrer_premium_until
  FROM public.profiles
  WHERE referral_code = UPPER(p_referral_code);

  -- Validate
  IF v_referrer_id IS NULL OR v_referrer_id = p_new_user_id THEN
    RETURN FALSE;
  END IF;

  -- Check if referral already exists
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = p_new_user_id) THEN
    RETURN FALSE;
  END IF;

  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, rewarded)
  VALUES (v_referrer_id, p_new_user_id, TRUE);

  -- Update referred user's profile
  UPDATE public.profiles
  SET referred_by = v_referrer_id
  WHERE id = p_new_user_id;

  -- Calculate new premium date for referrer
  IF v_referrer_is_premium AND v_referrer_premium_until IS NOT NULL AND v_referrer_premium_until > NOW() THEN
    v_new_premium_until := v_referrer_premium_until + INTERVAL '7 days';
  ELSE
    v_new_premium_until := NOW() + INTERVAL '7 days';
  END IF;

  -- Award 7 days premium to referrer
  UPDATE public.profiles
  SET is_premium = TRUE, premium_until = v_new_premium_until
  WHERE id = v_referrer_id;

  RETURN TRUE;
END;
$$;