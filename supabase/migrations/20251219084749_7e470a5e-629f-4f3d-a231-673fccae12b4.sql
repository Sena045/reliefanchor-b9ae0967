-- Add IP tracking to referrals table
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add first exercise completion tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_exercise_at TIMESTAMP WITH TIME ZONE;

-- Update apply_referral_reward to check limits and NOT reward immediately
CREATE OR REPLACE FUNCTION public.apply_referral_reward(p_referral_code text, p_new_user_id uuid, p_ip_address text DEFAULT NULL)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id UUID;
  v_referral_count INTEGER;
BEGIN
  -- Find the referrer by code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = UPPER(p_referral_code);

  -- Validate referrer exists and isn't self-referral
  IF v_referrer_id IS NULL OR v_referrer_id = p_new_user_id THEN
    RETURN FALSE;
  END IF;

  -- Check if user already has a referral
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = p_new_user_id) THEN
    RETURN FALSE;
  END IF;

  -- Check if referrer has reached max 10 referrals
  SELECT COUNT(*) INTO v_referral_count
  FROM public.referrals
  WHERE referrer_id = v_referrer_id AND rewarded = TRUE;

  IF v_referral_count >= 10 THEN
    RETURN FALSE;
  END IF;

  -- Check IP restriction: block same IP within 24 hours
  IF p_ip_address IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.referrals
      WHERE ip_address = p_ip_address
        AND created_at > NOW() - INTERVAL '24 hours'
    ) THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Create referral record (NOT rewarded yet - only after first exercise)
  INSERT INTO public.referrals (referrer_id, referred_id, ip_address, rewarded)
  VALUES (v_referrer_id, p_new_user_id, p_ip_address, FALSE);

  -- Update referred user's profile
  UPDATE public.profiles
  SET referred_by = v_referrer_id
  WHERE id = p_new_user_id;

  RETURN TRUE;
END;
$function$;

-- Create function to complete referral after first exercise
CREATE OR REPLACE FUNCTION public.complete_referral_after_exercise(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_id UUID;
  v_referrer_premium_until TIMESTAMPTZ;
  v_referrer_is_premium BOOLEAN;
  v_new_premium_until TIMESTAMPTZ;
  v_referral_count INTEGER;
BEGIN
  -- Check if user already completed first exercise
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND first_exercise_at IS NOT NULL) THEN
    RETURN FALSE;
  END IF;

  -- Mark first exercise as completed
  UPDATE public.profiles
  SET first_exercise_at = NOW()
  WHERE id = p_user_id;

  -- Find pending referral for this user
  SELECT referrer_id INTO v_referrer_id
  FROM public.referrals
  WHERE referred_id = p_user_id AND rewarded = FALSE;

  -- No pending referral
  IF v_referrer_id IS NULL THEN
    RETURN TRUE; -- Exercise completed, no referral to process
  END IF;

  -- Check if referrer still has room (might have hit 10 between signup and exercise)
  SELECT COUNT(*) INTO v_referral_count
  FROM public.referrals
  WHERE referrer_id = v_referrer_id AND rewarded = TRUE;

  IF v_referral_count >= 10 THEN
    -- Mark referral as processed but can't reward
    UPDATE public.referrals SET rewarded = FALSE WHERE referred_id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Get referrer's premium status
  SELECT is_premium, premium_until INTO v_referrer_is_premium, v_referrer_premium_until
  FROM public.profiles
  WHERE id = v_referrer_id;

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

  -- Mark referral as rewarded
  UPDATE public.referrals
  SET rewarded = TRUE
  WHERE referred_id = p_user_id;

  RETURN TRUE;
END;
$function$;

-- Function to get remaining referrals for a user
CREATE OR REPLACE FUNCTION public.get_remaining_referrals(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 10 - COALESCE(COUNT(*)::integer, 0)
  FROM public.referrals
  WHERE referrer_id = p_user_id AND rewarded = TRUE;
$function$;