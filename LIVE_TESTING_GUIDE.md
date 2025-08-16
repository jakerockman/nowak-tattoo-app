# 🧪 Live Testing Guide - Enhanced Notifications

## 🚀 **Step-by-Step Testing Process**

### **Phase 1: Setup & Access Test Panel**

1. **Open your app** on device/simulator (scan QR code when it appears)
2. **Login as an ARTIST** (this is key for testing the new flow)
3. **Access the test panel:**
   - Look for the top-right corner of the screen
   - **Tap 5 times rapidly** in that corner area
   - Test panel should slide up from bottom

### **Phase 2: Test Artist Notification Flow** 

4. **In the test panel, click "Check Status"**
   - Should show: ✅ hasNavigationCallback: true
   - Should show: ✅ hasCustomNotificationCallback: true
   - Should show: Current user: "Artist Name"

5. **Click "Simulate Message"**
   - Watch for notification at top of screen
   - **Expected:** "New Message - You have new messages from customers"
   - **NOT:** "New message from Test User" (old behavior)

6. **Click "View" on the notification**
   - **Expected:** Should navigate to ArtistBookingsScreen (dashboard)
   - **NOT:** Should go directly to chat (old behavior)
   - Look for MESSAGES button showing unread count

7. **Click the MESSAGES button**
   - Should open ChatScreen with conversation list
   - Look for orange-bordered conversation (unread indicator)

### **Phase 3: Test User Flow (Should Be Unchanged)**

8. **Logout and login as a USER**
9. **Access test panel again** (5 taps in corner)
10. **Click "Simulate Message"**
    - **Expected:** "New message from Nowak Tattoo" (specific sender)
    - **Expected:** Clicking "View" goes directly to chat

### **Phase 4: Real Message Testing**

11. **Two-device test:**
    - Device A: Login as artist
    - Device B: Login as user  
    - Send message from user to artist
    - Check artist gets generic notification → routes to dashboard

## 🔍 **What to Look For**

### **✅ Success Indicators:**
- **Artist notifications:** Generic "New Message" title
- **Artist navigation:** Goes to ArtistBookingsScreen first
- **Unread indicators:** Orange borders in chat list
- **User experience:** Unchanged (direct to chat)

### **❌ Issues to Report:**
- Artist getting specific message content in notification
- Artist going directly to chat instead of dashboard
- No orange borders on unread conversations
- User experience changed unexpectedly

## 📝 **Test Results Log**

**Test 1 - Artist Status Check:**
- [ ] Navigation callback set: ___
- [ ] Custom notification set: ___
- [ ] Current user shows: ___

**Test 2 - Artist Notification:**
- [ ] Notification title: ___
- [ ] Notification body: ___
- [ ] Navigation destination: ___

**Test 3 - Artist Dashboard:**
- [ ] MESSAGES button shows count: ___
- [ ] Chat list shows unread indicators: ___

**Test 4 - User Notification:**
- [ ] Notification title: ___
- [ ] Navigation goes to: ___

## 🐛 **Troubleshooting**

**Can't access test panel?**
- Make sure you're tapping precisely in top-right corner
- Try tapping 5 times more rapidly
- Ensure app is fully loaded first

**Notifications not showing?**
- Check "Check Status" first
- Ensure you're logged in
- Try "Test Custom Notification" button

**Wrong navigation behavior?**
- Check console logs in Metro terminal
- Look for "Navigation navigation request: dashboard" vs "chat"
- Verify user type in status check

## 📱 **Expected Console Logs**

In your Metro terminal, you should see logs like:

```
📱 [timestamp] NOTIFICATION #1: Artist notification - routing to dashboard
📱 [timestamp] Notification navigation request: dashboard
📱 [timestamp] Navigating to artist dashboard...
```

VS the old behavior:
```
📱 [timestamp] Navigating to Chat screen with conversation: [id]
```

Let me know what you see and I'll help debug any issues!
