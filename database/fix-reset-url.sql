-- Fix Password Reset for Mobile App
-- The issue is that Supabase password reset is designed for web, not mobile
-- Let's configure it to work properly

-- Method 1: Use Supabase's hosted auth UI
DO $$
BEGIN
  UPDATE auth.config SET 
    site_url = 'https://trbfaozlvwykygnrxaxy.supabase.co/auth/v1/verify',
    additional_redirect_urls = 'https://trbfaozlvwykygnrxaxy.supabase.co/auth/v1/callback'
  WHERE id = 1;
  
  RAISE NOTICE 'Auth URLs updated to use Supabase hosted auth';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SQL update failed - use dashboard method';
END $$;

-- Method 2: Alternative - disable email redirect entirely
DO $$
BEGIN
  UPDATE auth.config SET 
    site_url = NULL
  WHERE id = 1;
  
  RAISE NOTICE 'Site URL cleared - will use Supabase default behavior';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not clear site URL';
END $$;

-- Check current configuration
SELECT 
  site_url,
  additional_redirect_urls,
  email_from,
  email_from_name
FROM auth.config 
WHERE id = 1;
