
-- Update handle_new_user to grant 7-day free trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, is_premium, premium_until)
  VALUES (NEW.id, TRUE, NOW() + INTERVAL '7 days');
  RETURN NEW;
END;
$$;
