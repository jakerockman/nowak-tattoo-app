-- Alternative Email Configuration (if auth tables are restricted)
-- Run this in Supabase SQL Editor

-- Method 1: Try to update auth config directly
DO $$
BEGIN
  -- Update site configuration with correct Supabase URL
  UPDATE auth.config SET 
    site_url = 'https://trbfaozlvwykygnrxaxy.supabase.co',
    email_from = 'Nowak Tattoo <noreply@nowaktattoo.com>',
    email_from_name = 'Nowak Tattoo'
  WHERE id = 1;
  
  RAISE NOTICE 'Auth config updated successfully';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update auth.config directly. Use Supabase Dashboard instead.';
END $$;

-- Method 2: Create a function to configure emails (if direct access fails)
CREATE OR REPLACE FUNCTION configure_nowak_emails()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be called to set up email configuration
  -- when direct auth table access isn't available
  
  RETURN 'Email configuration function created. Use Supabase Dashboard to complete setup with these settings:
  
  Sender Name: Nowak Tattoo
  Sender Email: noreply@nowaktattoo.com
  Site URL: https://trbfaozlvwykygnrxaxy.supabase.co
  
  Password Reset Subject: Reset Your Password - Nowak Tattoo
  Confirmation Subject: Confirm Your Email - Nowak Tattoo
  Magic Link Subject: Your Sign In Link - Nowak Tattoo';
END;
$$;

-- Call the function to see instructions
SELECT configure_nowak_emails();

-- Check current auth configuration (if accessible)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'config') 
    THEN 'Auth tables accessible'
    ELSE 'Auth tables restricted - use Dashboard method'
  END as auth_access_status;
