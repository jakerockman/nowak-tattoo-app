-- SIMPLE PASSWORD RESET SETUP
-- Copy and paste this entire block into Supabase SQL Editor and run it

-- Create the email check function
CREATE OR REPLACE FUNCTION check_user_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user exists and is confirmed
    RETURN EXISTS(
        SELECT 1 
        FROM auth.users 
        WHERE email = lower(trim(email_to_check))
        AND email_confirmed_at IS NOT NULL
    );
    
EXCEPTION WHEN OTHERS THEN
    -- If there's any error accessing auth.users, allow the reset
    RETURN true;
END;
$$;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION check_user_email_exists(text) TO anon, authenticated;

-- THAT'S IT! Now just configure in dashboard:
-- 1. Go to: https://supabase.com/dashboard/project/trbfaozlvwykygnrxaxy
-- 2. Authentication > Settings
-- 3. Set Site URL to: https://jakerockman.github.io/nowak-tattoo-reset/
-- 4. Save

-- Your app already has the forgot password code - it will work once Site URL is set!
