# 🚀 Push Notifications Upgrade Guide

## Current Status
Your app currently has:
- ✅ In-app notifications working
- ✅ Custom styled notification component
- ✅ Navigation integration
- ✅ Enhanced logging system
- ❌ No background notifications (app must be active)

## Upgrade to Full Push Notifications

### Step 1: Install Required Dependencies
```bash
npm install expo-notifications expo-device expo-constants
```

### Step 2: Configure app.json
Add to your `app.json`:
```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#000000"
    },
    "android": {
      "useNextNotificationsApi": true
    },
    "ios": {
      "bundleIdentifier": "com.nowaktattoo.app"
    }
  }
}
```

### Step 3: Update NotificationService.ts
Replace the `showNotification` method with:
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// In the showNotification method:
private async showNotification(notification: {
  title: string;
  body: string;
  data: any;
}, notificationId?: number) {
  const id = notificationId || 0;
  
  try {
    // Check notification preferences
    const prefsStr = await AsyncStorage.getItem(`notification_prefs_${this.currentUser?.id}`);
    const prefs = prefsStr ? JSON.parse(prefsStr) : { enabled: true };
    
    if (!prefs.enabled) {
      NotificationLogger.log(`NOTIFICATION #${id}: Skipping - notifications disabled`);
      return;
    }

    NotificationLogger.log(`NOTIFICATION #${id}: Showing push notification: ${notification.title}`);
    
    if (Device.isDevice) {
      // Use native push notifications
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } else {
      // Fallback for simulator - use current system
      // ... existing custom notification code
    }
    
  } catch (error) {
    NotificationLogger.error(`NOTIFICATION #${id}: Error showing push notification:`, error);
  }
}
```

### Step 4: Request Permissions
Add to the initialization in App.tsx:
```typescript
import * as Notifications from 'expo-notifications';

// In your App component
useEffect(() => {
  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Push notification permissions not granted');
    } else {
      console.log('Push notification permissions granted');
    }
  };
  
  requestNotificationPermissions();
}, []);
```

### Step 5: Handle Notification Responses
Add notification tap handling:
```typescript
// Listen for notification responses
useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { conversationId } = response.notification.request.content.data;
    if (conversationId && navigationRef.current?.isReady()) {
      navigationRef.current.navigate('Chat', { conversationId });
    }
  });

  return () => subscription.remove();
}, []);
```

## Benefits of Upgrade
- 📱 Background notifications when app is closed
- 🔔 Native notification sounds and vibrations
- 📋 Notification badges on app icon
- 🎯 Better user engagement
- 🔄 System-level notification management

## Testing Checklist
After upgrade, test:
- [ ] Notifications appear when app is active
- [ ] Notifications appear when app is in background
- [ ] Notifications appear when app is closed
- [ ] Tapping notification opens correct chat
- [ ] Notification permissions work
- [ ] Sounds and vibrations work
- [ ] Multiple notifications stack properly

## Rollback Plan
If issues occur, you can revert by:
1. Removing the expo-notifications dependency
2. Restoring the original showNotification method
3. Removing push notification config from app.json

The current enhanced system will continue working as before.
