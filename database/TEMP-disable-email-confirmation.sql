-- TEMPORARY: Disable email confirmation for testing
-- Run this in Supabase SQL Editor to test signup without email confirmation

UPDATE auth.config 
SET 
  email_autoconfirm = true,
  disable_signup = false
WHERE id = 1;

-- Check the setting
SELECT 
  email_autoconfirm,
  disable_signup,
  external_email_enabled
FROM auth.config 
WHERE id = 1;
