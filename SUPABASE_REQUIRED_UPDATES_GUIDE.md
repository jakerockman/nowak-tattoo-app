# 🔧 Required Supabase Updates - Step by Step Guide

## **Step 1: Verify Email Confirmation Settings**

### **Dashboard Path**: 
Supabase Dashboard → Authentication → Settings → General

### **Required Settings:**
1. **Enable email confirmations**: ✅ **MUST BE ENABLED**
2. **Enable email change confirmations**: ✅ **MUST BE ENABLED** 
3. **Enable double email confirmation**: ✅ **RECOMMENDED**

### **Why This is Critical:**
Your `UserLoginScreen.tsx` expects users to verify their email before login. Without this setting:
- Users can't complete registration
- Login attempts will fail
- App will show confusing error messages

---

## **Step 2: Configure Site URL and Redirect URLs**

### **Dashboard Path**: 
Supabase Dashboard → Authentication → Settings → General → Site URL

### **Required Configuration:**

#### **For Development:**
```
Site URL: exp://192.168.1.XXX:8081
```
*Replace XXX with your actual IP address from Expo*

#### **For Production:**
```
Site URL: https://your-app-domain.com
```

### **Redirect URLs to Add:**
```
exp://192.168.1.XXX:8081/**
https://your-app-domain.com/**
```

### **How to Find Your Development URL:**
Run this command in your project terminal:
```powershell
npx expo start
```
Look for the Metro URL (usually shows your IP address)

---

## **Step 3: Verify Rate Limiting Settings**

### **Dashboard Path**: 
Supabase Dashboard → Authentication → Settings → Rate Limiting

### **Why This Matters:**
Your new `checkEmailExists()` function makes additional API calls. Verify these limits:

#### **Recommended Settings:**
- **Login attempts per hour**: `60` (default is usually fine)
- **Password reset requests per hour**: `10` (default is usually fine)
- **Email sending per hour**: `30` (increase if needed)

### **If You Need to Increase Limits:**
- Go to each rate limiting section
- Increase the "Per Hour" values
- Click "Save"

---

## **Step 4: Test Current Configuration**

### **SQL Commands to Run in Supabase SQL Editor:**

```sql
-- Check current authentication configuration
SELECT 
  site_url,
  email_confirm_change_enabled,
  email_double_confirm_changes_enabled,
  email_change_confirm_enabled
FROM auth.config;
```

**Expected Results:**
- `site_url`: Should show your app URL
- `email_confirm_change_enabled`: Should be `true`
- `email_double_confirm_changes_enabled`: Should be `true` (recommended)
- `email_change_confirm_enabled`: Should be `true`

### **Check Recent Authentication Activity:**
```sql
-- View recent auth events
SELECT 
  created_at,
  msg,
  level,
  (metadata->>'email') as email
FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND msg LIKE '%signup%'
ORDER BY created_at DESC
LIMIT 10;
```

---

## **Step 5: Update Authentication Configuration (If Needed)**

### **If Settings Are Not Correct, Run These SQL Commands:**

#### **Enable Email Confirmation:**
```sql
-- Enable email confirmation (CRITICAL)
UPDATE auth.config 
SET email_confirm_change_enabled = true,
    email_change_confirm_enabled = true,
    email_double_confirm_changes_enabled = true;
```

#### **Update Site URL (Replace with your actual URL):**
```sql
-- For Development
UPDATE auth.config 
SET site_url = 'exp://192.168.1.XXX:8081';

-- For Production (when ready)
UPDATE auth.config 
SET site_url = 'https://your-app-domain.com';
```

---

## **Step 6: Verify Email Templates Work**

### **Test Email Template (Optional but Recommended):**

```sql
-- Check current email templates
SELECT 
  email_confirmation_template,
  email_recovery_template
FROM auth.config;
```

### **Update Email Templates for Better Branding:**

```sql
-- Update confirmation email template
UPDATE auth.config 
SET email_confirmation_template = '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Confirm Your Email - Nowak Tattoo</h2>
  <p>Hi there,</p>
  <p>Welcome to Nowak Tattoo! Please confirm your email address to complete your account setup:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" 
       style="background-color: #000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
      Confirm Email Address
    </a>
  </div>
  <p>If you didn''t create an account with us, please ignore this email.</p>
  <p>Best regards,<br>The Nowak Tattoo Team</p>
</div>';

-- Update password recovery email template  
UPDATE auth.config
SET email_recovery_template = '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Reset Your Password - Nowak Tattoo</h2>
  <p>You requested to reset your password for your Nowak Tattoo account.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" 
       style="background-color: #000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
      Reset Password
    </a>
  </div>
  <p>If you didn''t request this password reset, please ignore this email.</p>
  <p>Best regards,<br>The Nowak Tattoo Team</p>
</div>';
```

---

## **Step 7: Test the Complete Flow**

### **Testing Commands to Run in Your App Terminal:**

```powershell
# Start your Expo app
npx expo start

# In another terminal, run a simple test
npx expo install @expo/cli
```

### **Manual Testing Steps:**

#### **Test 1: New User Registration**
1. Open your app
2. Go to registration screen
3. Fill in all fields:
   - First Name: "Test"
   - Surname: "User"
   - Email: "test@example.com"
   - Password: "TestPass123!"
4. Submit form
5. **Expected**: Should show "Please check your email to verify your account"
6. Check email for verification link
7. Click verification link
8. **Expected**: Should redirect back to app and allow login

#### **Test 2: Duplicate Email Prevention**
1. Try to register with same email again
2. **Expected**: Should immediately show "Email already in use"
3. Should offer "Try Different Email" or "Go to Login" options

### **Verification SQL Query:**
```sql
-- Check if your test user was created
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'test@example.com';
```

---

## **Step 8: Monitor and Debug**

### **If Registration Fails, Check These:**

#### **Check Supabase Logs:**
```sql
-- Check for auth errors
SELECT 
  created_at,
  msg,
  level,
  metadata
FROM auth.audit_log_entries 
WHERE level = 'error'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

#### **Check App Logs in Terminal:**
Look for these error patterns in your Expo terminal:
- `Invalid email or password`
- `Email not confirmed`
- `Rate limit exceeded`

### **Common Issues and Fixes:**

#### **Issue 1: "Invalid email or password" immediately**
**Fix**: Email confirmation is disabled
```sql
UPDATE auth.config SET email_confirm_change_enabled = true;
```

#### **Issue 2: Email verification link doesn't work**
**Fix**: Wrong Site URL
```sql
UPDATE auth.config SET site_url = 'your-correct-app-url';
```

#### **Issue 3: "Too many requests"**
**Fix**: Increase rate limits in Supabase Dashboard

---

## **✅ Success Checklist**

After completing all steps, verify:

- [ ] Email confirmation is enabled in Supabase Dashboard
- [ ] Site URL is correctly set for your environment
- [ ] Rate limits are adequate for your app usage
- [ ] New user can register and receive verification email
- [ ] Email verification link works and redirects properly
- [ ] Duplicate email registration is prevented
- [ ] Login works after email verification
- [ ] Error messages are user-friendly

## **🚨 Critical Notes**

1. **Always test in development first** before updating production settings
2. **Keep your Site URL updated** when switching between development and production
3. **Monitor the auth.audit_log_entries** table for any issues
4. **Your existing users won't be affected** by these changes
5. **Email templates are optional** but improve user experience

---

## **Need Help?**

If you encounter issues:

1. Check Supabase Dashboard → Authentication → Logs
2. Run the verification SQL queries above
3. Check your Expo terminal for detailed error messages
4. Verify your internet connection and Supabase project status

Your enhanced authentication system should now work perfectly with comprehensive duplicate email prevention and improved user experience!
