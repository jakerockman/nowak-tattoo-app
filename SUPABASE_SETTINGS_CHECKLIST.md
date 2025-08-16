# Supabase Settings Checklist for Enhanced User Registration

## 🔍 **Critical Settings to Verify After Code Changes**

### **1. Authentication Settings**
Go to: Supabase Dashboard → Authentication → Settings → General

**Required Settings:**
- [ ] **Enable Email Confirmations**: ✅ ENABLED
  - Users must verify email before login (app expects this)
- [ ] **Enable Email Change Confirmations**: ✅ ENABLED  
  - Security for email changes
- [ ] **Enable Double Email Confirmation**: ✅ ENABLED
  - Extra security layer

**Site URL Settings:**
- [ ] **Site URL**: Should be set to your app's domain
- [ ] **Redirect URLs**: Should include your app's callback URLs

### **2. Rate Limiting (Important for New Email Check)**
Go to: Authentication → Settings → Rate Limiting

**Our code change impact**: `checkEmailExists()` function makes additional auth calls

**Verify Settings:**
- [ ] **Login Attempts**: Default (60 per hour) should be sufficient
- [ ] **Password Reset**: Check if limit is reasonable for email verification
- [ ] **Email Sending**: Ensure adequate limits for signup verification

### **3. Email Configuration (Recommended)**
Go to: Authentication → Settings → Email Templates

**Current Issue**: Emails come from "Supabase" instead of "Nowak Tattoo"

**Recommended Updates:**
- [ ] **Email Confirmation Subject**: "Confirm Your Email - Nowak Tattoo"
- [ ] **Password Recovery Subject**: "Reset Your Password - Nowak Tattoo"
- [ ] **Sender Name**: "Nowak Tattoo"
- [ ] **Sender Email**: Use business domain if available

### **4. Security Policies (Verify Existing)**
Go to: Database → Authentication → Policies

**Our changes don't require policy updates, but verify:**
- [ ] **User registration** policies are working
- [ ] **Profile creation** triggers are functioning
- [ ] **Email uniqueness** is enforced at database level

## 🧪 **Test Scenarios After Settings Update**

### **Test 1: New User Registration**
1. Use new email address
2. Fill all required fields (First Name, Surname, Email, Password)
3. Submit form
4. Should receive email verification
5. Click verification link
6. Should be able to login

### **Test 2: Duplicate Email Prevention**
1. Try to register with existing email
2. Should get immediate feedback: "Email already in use"
3. Should offer options: "Try Different Email" or "Go to Login"

### **Test 3: Email Verification Flow**
1. Register new account
2. Check email for verification message
3. Verify sender shows "Nowak Tattoo" (if email templates updated)
4. Click verification link
5. Should redirect properly

## ⚡ **Quick Setup Commands (Optional)**

If you want to update email templates via SQL (instead of dashboard):

```sql
-- Update email confirmation template
UPDATE auth.config 
SET email_confirmation_template = '
<h2>Confirm Your Email - Nowak Tattoo</h2>
<p>Hi {{ .Email }},</p>
<p>Welcome to Nowak Tattoo! Please confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>Best regards,<br>Nowak Tattoo Team</p>
';

-- Update password reset template  
UPDATE auth.config
SET email_recovery_template = '
<h2>Reset Your Password - Nowak Tattoo</h2>
<p>You requested to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn\'t request this, please ignore.</p>
<p>Best regards,<br>Nowak Tattoo Team</p>
';
```

## 🔧 **Required vs Optional Updates**

### **Required (App Won't Work Properly Without These):**
1. ✅ Email Confirmation ENABLED
2. ✅ Proper rate limiting for auth calls
3. ✅ Site URL configured correctly

### **Optional (Improves User Experience):**
1. Custom email templates with Nowak Tattoo branding
2. Custom SMTP settings with business domain
3. Enhanced email subjects and sender names

## 📋 **Verification Commands**

Run these in Supabase SQL Editor to verify settings:

```sql
-- Check current auth configuration
SELECT 
  site_url,
  email_confirm_change_enabled,
  email_double_confirm_changes_enabled 
FROM auth.config;

-- Check recent auth activity
SELECT 
  created_at,
  msg,
  level
FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
```

## ✅ **After Completing Checklist**

Once settings are verified/updated:
1. Test new user registration flow
2. Test duplicate email prevention
3. Verify email verification works
4. Check that login works after verification
5. Test the enhanced error messages

The app should now have robust protection against duplicate emails and improved user experience!
