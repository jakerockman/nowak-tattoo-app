-- 🔍 Supabase Configuration Verification Script
-- Run this in your Supabase SQL Editor to check current settings

-- ===============================================
-- STEP 1: Check Authentication Configuration
-- ===============================================
SELECT 
  'Authentication Settings' as check_type,
  site_url,
  email_confirm_change_enabled as email_confirmation_enabled,
  email_change_confirm_enabled as email_change_confirmation_enabled,
  email_double_confirm_changes_enabled as double_confirmation_enabled
FROM auth.config;

-- ===============================================
-- STEP 2: Check Recent Authentication Activity
-- ===============================================
SELECT 
  'Recent Auth Activity' as check_type,
  created_at,
  msg,
  level,
  (metadata->>'email') as email_address
FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND (msg LIKE '%signup%' OR msg LIKE '%confirm%' OR msg LIKE '%error%')
ORDER BY created_at DESC
LIMIT 10;

-- ===============================================
-- STEP 3: Check User Registration Status
-- ===============================================
SELECT 
  'User Registration Stats' as check_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- ===============================================
-- STEP 4: Check for Recent Registration Attempts
-- ===============================================
SELECT 
  'Recent Registrations' as check_type,
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Pending Confirmation'
  END as status
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 5;

-- ===============================================
-- STEP 5: Check Email Templates
-- ===============================================
SELECT 
  'Email Templates' as check_type,
  CASE 
    WHEN email_confirmation_template LIKE '%Nowak Tattoo%' THEN 'Custom Template'
    ELSE 'Default Template'
  END as confirmation_template_status,
  CASE 
    WHEN email_recovery_template LIKE '%Nowak Tattoo%' THEN 'Custom Template'
    ELSE 'Default Template'
  END as recovery_template_status;

-- ===============================================
-- RESULTS INTERPRETATION:
-- ===============================================
-- 
-- 1. Authentication Settings:
--    - site_url: Should match your app URL (exp:// for dev, https:// for prod)
--    - email_confirmation_enabled: MUST be 'true'
--    - email_change_confirmation_enabled: SHOULD be 'true'
--    - double_confirmation_enabled: RECOMMENDED to be 'true'
--
-- 2. Recent Auth Activity:
--    - Look for any 'error' level messages
--    - 'signup' messages should show successful registrations
--    - Check if emails are being sent for confirmations
--
-- 3. User Registration Stats:
--    - Shows how many users have confirmed vs pending
--    - If many unconfirmed users, check email delivery
--
-- 4. Recent Registrations:
--    - Shows if new users are successfully registering
--    - Check confirmation status of recent users
--
-- 5. Email Templates:
--    - Shows if you're using custom Nowak Tattoo branding
--    - Default templates work fine, custom ones look more professional
--
-- ===============================================

-- 🚨 IF YOU NEED TO FIX SETTINGS, RUN THESE:
-- ===============================================

-- Fix authentication settings (uncomment if needed):
-- UPDATE auth.config 
-- SET email_confirm_change_enabled = true,
--     email_change_confirm_enabled = true,
--     email_double_confirm_changes_enabled = true;

-- Update site URL for development (replace with your actual Expo URL):
-- UPDATE auth.config 
-- SET site_url = 'exp://192.168.1.XXX:8081';

-- Update site URL for production (replace with your actual domain):
-- UPDATE auth.config 
-- SET site_url = 'https://your-app-domain.com';
