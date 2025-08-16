# Email Configuration Setup for Nowak Tattoo App

## Issue
Password reset emails and other authentication emails are coming from Supabase's default sender instead of "Nowak Tattoo".

## Solution: Configure Custom Email Settings in Supabase

### Step 1: Access Supabase Dashboard Email Settings

1. Go to your Supabase project dashboard: https://app.supabase.com/project/trbfaozlvwykygnrxaxy
2. Navigate to **Authentication** → **Settings** → **Email Templates**

### Step 2: Configure Email Settings

#### A. SMTP Settings (Recommended for Professional Branding)
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Enable custom SMTP
3. Configure your email provider (Gmail, SendGrid, etc.):
   ```
   SMTP Host: smtp.gmail.com (for Gmail)
   SMTP Port: 587
   SMTP Username: your-business-email@nowaktattoo.com
   SMTP Password: your-app-password
   SMTP Sender Name: Nowak Tattoo
   SMTP Sender Email: noreply@nowakattoo.com
   ```

#### B. Email Templates Configuration
1. Go to **Authentication** → **Settings** → **Email Templates**
2. Customize the following templates:

##### Password Reset Template:
```html
<h2>Reset Your Password - Nowak Tattoo</h2>
<p>Hi there,</p>
<p>You requested to reset your password for your Nowak Tattoo account.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, please ignore this email.</p>
<p>Best regards,<br>Nowak Tattoo Team</p>
```

##### Email Confirmation Template:
```html
<h2>Confirm Your Email - Nowak Tattoo</h2>
<p>Hi {{ .Email }},</p>
<p>Welcome to Nowak Tattoo! Please confirm your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>Best regards,<br>Nowak Tattoo Team</p>
```

##### Magic Link Template:
```html
<h2>Your Magic Link - Nowak Tattoo</h2>
<p>Hi there,</p>
<p>Click the link below to sign in to your Nowak Tattoo account:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
<p>Best regards,<br>Nowak Tattoo Team</p>
```

### Step 3: Update Email Subject Lines

#### In the Supabase Dashboard:
- **Password Reset Subject**: "Reset Your Password - Nowak Tattoo"
- **Email Confirmation Subject**: "Confirm Your Email - Nowak Tattoo"  
- **Magic Link Subject**: "Your Sign In Link - Nowak Tattoo"

### Step 4: Configure Sender Information

#### Update the following settings:
- **Sender Name**: "Nowak Tattoo"
- **Sender Email**: Use your business domain (e.g., noreply@nowakattoo.com)
- **Reply-To Email**: support@nowakattoo.com (optional)

### Step 5: Test the Configuration

1. After saving the settings, test the password reset functionality in your app
2. Check that emails now show "From: Nowak Tattoo <noreply@nowakattoo.com>"
3. Verify the email content uses your custom templates

### Alternative: Quick Fix with Display Name Only

If you can't set up custom SMTP immediately:

1. Go to **Authentication** → **Settings** → **General**
2. Find **Site URL** and **Additional URLs** settings
3. Update the **Email Settings** section:
   - **From Email**: Update to show "Nowak Tattoo" in the sender name field
   - **From Name**: Set to "Nowak Tattoo"

### Notes:
- Custom SMTP configuration may require a paid Supabase plan
- For production use, consider using a dedicated email service like SendGrid, Mailgun, or AWS SES
- Always test email delivery in a staging environment first
- Make sure your domain has proper SPF/DKIM records configured for better deliverability

### Fallback Option:
If custom email configuration isn't available, you can modify the reset password function to include a note about the sender:

```javascript
Alert.alert(
  'Password Reset Sent',
  'A password reset link has been sent to your email from Nowak Tattoo (via Supabase). Please check your inbox and spam folder.',
  [{ text: 'OK' }]
);
```
