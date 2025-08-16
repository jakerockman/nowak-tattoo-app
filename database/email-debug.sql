-- Email Testing and Debugging
-- Run this in Supabase SQL Editor to check email configuration

-- Check if there are any email logs or errors
SELECT 
  created_at,
  level,
  msg,
  metadata
FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND (msg ILIKE '%email%' OR msg ILIKE '%password%' OR msg ILIKE '%reset%')
ORDER BY created_at DESC
LIMIT 10;

-- Check current auth configuration (if accessible)
SELECT 
  site_url,
  email_confirm_change_enabled,
  email_double_confirm_changes_enabled,
  email_change_confirm_enabled
FROM auth.config 
WHERE id = 1;

-- Check for recent password reset attempts
SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  recovery_sent_at
FROM auth.users 
WHERE recovery_sent_at > NOW() - INTERVAL '1 hour'
ORDER BY recovery_sent_at DESC;

-- Alternative: Check if the function exists and works
SELECT configure_nowak_emails() as email_settings;
