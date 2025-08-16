# 🧪 Notification Testing Guide

## How to Test Current Notifications

### Prerequisites
1. Start the app with `expo start`
2. Open on device or simulator
3. Login as a user or artist
4. Open developer console to see notification logs

### Test 1: Check Notification Setup
```javascript
// In the app console/debugger, run:
NotificationTestUtils.getNotificationStatus()
```
Expected output:
- ✅ hasNavigationCallback: true
- ✅ hasCustomNotificationCallback: true
- ✅ currentUser: "User Name"
- ✅ globalSubscriptions: > 0

### Test 2: Test Custom Notification Display
```javascript
// In the app console/debugger, run:
NotificationTestUtils.testCustomNotification()
```
Expected result:
- Custom notification should appear at top of screen
- Should have "View" and "Dismiss" buttons
- Should log button clicks in console

### Test 3: Test Navigation
```javascript
// In the app console/debugger, run:
NotificationTestUtils.testNavigationCallback()
```
Expected result:
- Should attempt to navigate to chat screen
- Should log navigation attempt in console

### Test 4: Simulate Real Message
```javascript
// In the app console/debugger, run:
NotificationTestUtils.simulateTestMessage()
```
Expected result:
- Should show notification with test message
- Should trigger vibration
- Should add to notification queue

### Test 5: Real Message Test
1. Login as an artist on one device/browser
2. Login as a user on another device/browser
3. Send a message from artist to user
4. Check if user receives notification

Expected logs:
```
📱 [timestamp] NOTIFICATION #1: handleIncomingMessage called
📱 [timestamp] NOTIFICATION #1: PROCEEDING - Will show notification for message
📱 [timestamp] NOTIFICATION #1: New message from Nowak Tattoo
📱 [timestamp] NOTIFICATION #1: Showing notification: New message from Nowak Tattoo
```

### Test 6: Chat Screen Status
1. Open chat screen
2. Check console for: "Chat screen status changed: ENTERED"
3. Send message from other user
4. Should see: "SKIPPING - User is currently in this chat screen"
5. Exit chat screen
6. Send another message
7. Should see notification appear

### Debug Issues

#### No Notifications Appearing
Check:
- [ ] User is logged in
- [ ] Navigation callback is set (Test 1)
- [ ] Custom notification callback is set (Test 1)
- [ ] Notification preferences enabled
- [ ] Not in the same chat where message is being sent

#### Notifications Not Navigating
Check:
- [ ] Navigation callback is set
- [ ] Navigation container is ready
- [ ] Chat screen exists and is accessible

#### Multiple Notifications
Check:
- [ ] Only one NotificationService instance
- [ ] Cleanup is called on logout
- [ ] No duplicate subscriptions

### Enhanced Logging
The enhanced logging system now provides:
- Unique notification IDs for tracking
- Detailed message information
- User context and status
- Step-by-step processing logs
- Error tracking with context

Look for logs with format:
```
📱 [timestamp] NOTIFICATION #X: [message]
```

### Performance Monitoring
Monitor for:
- Memory leaks from uncleaned subscriptions
- Rapid notification creation
- Failed navigation attempts
- AsyncStorage errors
