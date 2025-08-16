-- EMAIL CONFIRMATION FIX - FOR SUPABASE DASHBOARD
-- Since auth.config is not accessible via SQL, use Supabase Dashboard instead

-- STEP 1: DIAGNOSTIC - Check what we CAN access
-- Check email templates (this should work)
SELECT 
  template_type,
  subject,
  LENGTH(body) as body_length,
  created_at,
  updated_at
FROM auth.email_templates 
ORDER BY template_type;

-- Check if test user was created
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  confirmation_sent_at,
  confirmation_token IS NOT NULL as has_confirmation_token,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'jacob.rockman@protonmail.com'
ORDER BY created_at DESC
LIMIT 5;

-- STEP 2: UPDATE EMAIL TEMPLATES (This will work)
INSERT INTO auth.email_templates (template_type, subject, body, created_at, updated_at)
VALUES 
  (
    'confirmation',
    'Confirm Your Email - Nowak Tattoo',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Confirm Your Email - Nowak Tattoo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #181818 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Nowak Tattoo</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Professional Tattoo Studio</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #181818; margin-top: 0;">📧 Welcome to Nowak Tattoo!</h2>
        
        <p>Hi {{ .Email }},</p>
        
        <p>Thank you for creating an account with Nowak Tattoo! To complete your registration, please confirm your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background: #181818; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                📧 Confirm My Email
            </a>
        </div>
        
        <p><strong>Important:</strong> This is an email confirmation link for your new account.</p>
        
        <p>Once confirmed, you will be able to:</p>
        <ul style="color: #555;">
            <li>📅 Book tattoo appointments</li>
            <li>💬 Chat with our artists</li>
            <li>🎨 View our latest work and promotions</li>
            <li>⚙️ Manage your account settings</li>
        </ul>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>Nowak Tattoo Team</strong>
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
            If the button above does not work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
        </p>
    </div>
</body>
</html>',
    NOW(),
    NOW()
  ),
  (
    'recovery',
    'Reset Your Password - Nowak Tattoo',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password - Nowak Tattoo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #181818 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Nowak Tattoo</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Professional Tattoo Studio</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #181818; margin-top: 0;">🔑 Reset Your Password</h2>
        
        <p>Hi there,</p>
        
        <p>You requested to reset your password for your Nowak Tattoo account. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background: #181818; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                🔑 Reset My Password
            </a>
        </div>
        
        <p><strong>Important:</strong> This is a password reset link. If you did not request this, please ignore this email.</p>
        
        <p>This link will expire in 24 hours for security reasons.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>Nowak Tattoo Team</strong>
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
            If the button above does not work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
        </p>
    </div>
</body>
</html>',
    NOW(),
    NOW()
  )
ON CONFLICT (template_type) 
DO UPDATE SET 
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  updated_at = NOW();

-- STEP 3: VERIFY EMAIL TEMPLATES WERE UPDATED
SELECT 
  template_type,
  subject,
  LENGTH(body) as body_length,
  updated_at
FROM auth.email_templates 
ORDER BY template_type;

-- STEP 4: CLEAN UP TEST USERS (Optional - run this if you want to test fresh)
-- Uncomment the line below to delete test users
-- DELETE FROM auth.users WHERE email = 'jacob.rockman@protonmail.com';

-- STEP 3: UPDATE EMAIL TEMPLATES WITH CORRECT URLS
INSERT INTO auth.email_templates (template_type, subject, body, created_at, updated_at)
VALUES 
  (
    'confirmation',
    'Confirm Your Email - Nowak Tattoo',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Confirm Your Email - Nowak Tattoo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #181818 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Nowak Tattoo</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Professional Tattoo Studio</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #181818; margin-top: 0;">📧 Welcome to Nowak Tattoo!</h2>
        
        <p>Hi {{ .Email }},</p>
        
        <p>Thank you for creating an account with Nowak Tattoo! To complete your registration, please confirm your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background: #181818; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                📧 Confirm My Email
            </a>
        </div>
        
        <p><strong>Important:</strong> This is an email confirmation link for your new account.</p>
        
        <p>Once confirmed, you will be able to:</p>
        <ul style="color: #555;">
            <li>📅 Book tattoo appointments</li>
            <li>💬 Chat with our artists</li>
            <li>🎨 View our latest work and promotions</li>
            <li>⚙️ Manage your account settings</li>
        </ul>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>Nowak Tattoo Team</strong>
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
            If the button above does not work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
        </p>
    </div>
</body>
</html>',
    NOW(),
    NOW()
  ),
  (
    'recovery',
    'Reset Your Password - Nowak Tattoo',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password - Nowak Tattoo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #181818 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Nowak Tattoo</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Professional Tattoo Studio</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #181818; margin-top: 0;">🔑 Reset Your Password</h2>
        
        <p>Hi there,</p>
        
        <p>You requested to reset your password for your Nowak Tattoo account. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background: #181818; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                🔑 Reset My Password
            </a>
        </div>
        
        <p><strong>Important:</strong> This is a password reset link. If you did not request this, please ignore this email.</p>
        
        <p>This link will expire in 24 hours for security reasons.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>Nowak Tattoo Team</strong>
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
            If the button above does not work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
        </p>
    </div>
</body>
</html>',
    NOW(),
    NOW()
  )
ON CONFLICT (template_type) 
DO UPDATE SET 
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  updated_at = NOW();

-- STEP 4: VERIFY THE FIXES
-- Check that everything is configured correctly
SELECT 
  'CONFIG' as type,
  site_url,
  email_from,
  external_email_enabled,
  disable_signup,
  email_autoconfirm,
  mailer_autoconfirm
FROM auth.config 
WHERE id = 1

UNION ALL

SELECT 
  'TEMPLATES' as type,
  template_type as site_url,
  subject as email_from,
  'true' as external_email_enabled,
  LENGTH(body)::text as disable_signup,
  updated_at::text as email_autoconfirm,
  created_at::text as mailer_autoconfirm
FROM auth.email_templates 
ORDER BY type, site_url;

-- STEP 5: CLEAN UP TEST USERS (Optional)
-- Uncomment and run this to delete test users if needed
-- DELETE FROM auth.users WHERE email = 'jacob.rockman@protonmail.com';

-- STEP 6: TEST SIGNUP (After running above fixes)
-- Try creating a new account in your app after running the above SQL
