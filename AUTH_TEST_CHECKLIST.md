# 🔐 AUTHENTICATION SYSTEM TEST

## **USER REGISTRATION TEST:**
1. **Navigate to User Login Screen**
2. **Switch to Sign Up mode**
3. **Test Email Validation:**
   - Try existing email: `test@example.com`
   - Should show "Email already exists" error
   - Try new email: `newuser@example.com`
   - Should proceed to next step

## **ARTIST LOGIN TEST:**
1. **Access Artist Login**
2. **Test Credentials:**
   - Email: `jacobrockman.digital@gmail.com`
   - Password: [Your artist password]
   - Should redirect to Artist Dashboard

## **EXPECTED BEHAVIORS:**
✅ Email validation prevents duplicates
✅ Artist login redirects to dashboard
✅ User sessions persist between app restarts
✅ Logout clears stored credentials

## **SECURITY FEATURES:**
✅ Password requirements enforced
✅ Email format validation
✅ Session token management
✅ Automatic token refresh
