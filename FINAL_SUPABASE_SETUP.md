# 🔧 Supabase Configuration for Production + Development

## **Current Setup Analysis:**
- ✅ **Production Site URL**: `https://jakerockman.github.io/nowak-tattoo-reset/`
- ✅ **Development URL Needed**: `exp://192.168.0.193:8081`
- ✅ **Supabase Client**: Already configured for both environments

## **🎯 Required Supabase Dashboard Updates**

### **Step 1: Keep Production Site URL (Don't Change)**
**Leave this as is:** `https://jakerockman.github.io/nowak-tattoo-reset/`

### **Step 2: Add Development Redirect URL**
1. Go to **Supabase Dashboard** → **Authentication** → **Settings** → **General**
2. Scroll to **Redirect URLs** section
3. **Add** (don't replace) these URLs:
   ```
   exp://192.168.0.193:8081/**
   exp://192.168.0.193:8081/
   https://jakerockman.github.io/nowak-tattoo-reset/**
   ```

### **Step 3: Verify Email Confirmation Settings**
In the same **Authentication** → **Settings** → **General** page:
- ✅ **Enable email confirmations**
- ✅ **Enable email change confirmations** 
- ✅ **Enable double email confirmation** (optional but recommended)

## **📱 Your Updated App Configuration**

### **Environment Detection**
Your app will now automatically handle:
- **Production**: Uses `https://jakerockman.github.io/nowak-tattoo-reset/`
- **Development**: Uses `exp://192.168.0.193:8081`

### **How It Works**
1. **Email verification links** will redirect to the correct environment
2. **Authentication flow** works in both development and production
3. **Your enhanced registration** with duplicate email prevention works everywhere

## **✅ Final Supabase Settings Should Look Like:**

### **Site URL:**
```
https://jakerockman.github.io/nowak-tattoo-reset/
```

### **Redirect URLs:**
```
exp://192.168.0.193:8081/**
exp://192.168.0.193:8081/
https://jakerockman.github.io/nowak-tattoo-reset/**
```

### **Email Confirmations:**
- ✅ Email confirmations: **ENABLED**
- ✅ Email change confirmations: **ENABLED**

## **🧪 Testing Your Setup**

### **Development Testing:**
1. Start Expo: `npx expo start`
2. Register a new user
3. Check email verification works
4. Test duplicate email prevention

### **Production Testing:**
1. Deploy your app
2. Test the same flow on production
3. Verify both environments work independently

## **🚨 Important Notes**

1. **IP Address Changes**: When your development IP changes, update the redirect URLs
2. **Both Environments**: Your app now works in both development and production
3. **Email Verification**: Works correctly in both environments
4. **No Code Changes Needed**: Your enhanced `UserLoginScreen.tsx` is ready to go

## **📋 Quick Verification SQL**
Run in Supabase SQL Editor to test:
```sql
-- Check recent user registrations
SELECT 
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Pending'
  END as status
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

Your authentication system is now fully configured for both development and production! 🎉
