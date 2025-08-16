-- Email Configuration for Nowak Tattoo App
-- Run this SQL in your Supabase SQL Editor

-- 1. Update auth configuration for custom email settings
UPDATE auth.config 
SET 
  site_url = 'nowaktattooapp:///',
  email_from = 'Nowak Tattoo <noreply@nowaktattoo.com>',
  email_from_name = 'Nowak Tattoo'
WHERE id = 1;

-- 2. Insert/Update email templates
INSERT INTO auth.email_templates (template_type, subject, body, created_at, updated_at)
VALUES 
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
        <h2 style="color: #181818; margin-top: 0;">Reset Your Password</h2>
        
        <p>Hi there,</p>
        
        <p>You requested to reset your password for your Nowak Tattoo account. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background: #181818; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset My Password
            </a>
        </div>
        
        <p>This link will expire in 24 hours for security reasons.</p>
        
        <p>If you did not request this password reset, please ignore this email. Your account will remain secure.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>Nowak Tattoo Team</strong><br>
            Professional Tattoo Studio
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
        <h2 style="color: #181818; margin-top: 0;">Welcome to Nowak Tattoo!</h2>
        
        <p>Hi {{ .Email }},</p>
        
        <p>Thank you for creating an account with Nowak Tattoo. To complete your registration, please confirm your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background: #181818; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Confirm My Email
            </a>
        </div>
        
        <p>Once confirmed, you will be able to:</p>
        <ul style="color: #555;">
            <li>Book tattoo appointments</li>
            <li>Chat with our artists</li>
            <li>View our latest work and promotions</li>
            <li>Manage your account settings</li>
        </ul>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>Nowak Tattoo Team</strong><br>
            Professional Tattoo Studio
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
    'magic_link',
    'Your Sign In Link - Nowak Tattoo',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Sign In Link - Nowak Tattoo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #181818 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Nowak Tattoo</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Professional Tattoo Studio</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #181818; margin-top: 0;">Sign In to Your Account</h2>
        
        <p>Hi there,</p>
        
        <p>Click the button below to securely sign in to your Nowak Tattoo account:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background: #181818; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Sign In Now
            </a>
        </div>
        
        <p>This link will expire in 1 hour for security reasons.</p>
        
        <p>If you did not request this sign-in link, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>Nowak Tattoo Team</strong><br>
            Professional Tattoo Studio
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

-- 3. Update auth settings for better email configuration
UPDATE auth.config 
SET 
  jwt_exp = 3600,
  refresh_token_rotation_enabled = true,
  external_email_enabled = true,
  external_phone_enabled = false
WHERE id = 1;

-- Verify the changes
SELECT 
  site_url,
  email_from,
  email_from_name,
  external_email_enabled
FROM auth.config 
WHERE id = 1;

-- Verify email templates
SELECT 
  template_type,
  subject,
  LENGTH(body) as body_length,
  created_at,
  updated_at
FROM auth.email_templates 
ORDER BY template_type;
