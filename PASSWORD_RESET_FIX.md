# URGENT: Fix Password Reset Links

## The Problem
Password reset links don't work because the Site URL in Supabase is configured incorrectly.

## The Solution - Dashboard Fix (5 minutes)

### Step 1: Go to Supabase Dashboard
1. Open: https://app.supabase.com/project/trbfaozlvwykygnrxaxy
2. Go to **Authentication** → **URL Configuration**

### Step 2: Fix Site URL
**Current (broken):** Something like `http://localhost:3000` or `nowaktattooapp:///`
**Fix to:** `https://trbfaozlvwykygnrxaxy.supabase.co`

### Step 3: Clear Additional Redirect URLs
Remove any localhost or app:// URLs from the redirect URLs list.

## Alternative: Quick SQL Fix
If you can't find the URL settings, run this in SQL Editor:

```sql
UPDATE auth.config 
SET site_url = 'https://trbfaozlvwykygnrxaxy.supabase.co'
WHERE id = 1;
```

## Why This Fixes It
- Supabase needs a valid HTTPS URL for password reset redirects
- Your project URL is: `https://trbfaozlvwykygnrxaxy.supabase.co`
- This opens Supabase's built-in password reset page
- Users can reset password there, then return to app

## Test Steps
1. Fix the Site URL
2. Try forgot password again
3. Click the email link
4. Should open working password reset page

The issue is NOT with the app code - it's purely a Supabase configuration problem.
