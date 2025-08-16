// NotificationTestUtils.ts - Testing utilities for notifications
import { notificationService } from './NotificationService';

export class NotificationTestUtils {
  
  // Test notification display without requiring actual messages
  static async testCustomNotification() {
    console.log('🧪 Testing custom notification display...');
    
    // Simulate a test notification
    const testNotification = {
      title: 'Test Notification',
      message: 'This is a test message to verify notifications are working properly.',
      onView: () => {
        console.log('✅ Test notification view button works!');
      },
      onDismiss: () => {
        console.log('✅ Test notification dismiss button works!');
      }
    };

    // Check if custom notification callback is set
    if ((notificationService as any).customNotificationCallback) {
      console.log('✅ Custom notification callback is available');
      (notificationService as any).customNotificationCallback(
        testNotification.title,
        testNotification.message,
        testNotification.onView,
        testNotification.onDismiss
      );
    } else {
      console.log('❌ Custom notification callback not set');
    }
  }

  // Test navigation callback
  static testNavigationCallback() {
    console.log('🧪 Testing navigation callback...');
    
    if ((notificationService as any).navigationCallback) {
      console.log('✅ Navigation callback is available');
      // Test with a dummy conversation ID
      (notificationService as any).navigationCallback('test-conversation-123');
    } else {
      console.log('❌ Navigation callback not set');
    }
  }

  // Get current notification service status
  static getNotificationStatus() {
    const service = notificationService as any;
    
    const status = {
      hasNavigationCallback: !!service.navigationCallback,
      hasCustomNotificationCallback: !!service.customNotificationCallback,
      currentUser: service.currentUser?.displayName || 'None',
      isInChatScreen: service.isInChatScreen,
      currentConversationId: service.currentConversationId,
      globalSubscriptions: service.globalSubscriptions?.length || 0,
      notificationQueue: service.notificationQueue?.length || 0,
      isInitializing: service.isInitializing,
      notificationCount: service.notificationCount || 0
    };

    console.log('📊 Notification Service Status:', status);
    return status;
  }

  // Simulate a test message (for development only)
  static async simulateTestMessage() {
    console.log('🧪 Simulating test message...');
    
    const service = notificationService as any;
    
    if (!service.currentUser) {
      console.log('❌ No current user - cannot simulate message');
      return;
    }

    // Create different test scenarios based on user type
    const userType = service.currentUser.userType;
    console.log(`🧪 Simulating message for ${userType}`);

    // Create a fake message object
    const testMessage = {
      id: 'test-message-' + Date.now(),
      sender_id: 'test-sender-123', // Different from current user
      conversation_id: 'test-conversation-123',
      content: userType === 'artist' ? 
        'This is a test message from a customer!' : 
        'This is a test message from the artist!',
      sender_type: userType === 'artist' ? 'user' : 'artist',
      created_at: new Date().toISOString()
    };

    // Create a fake conversation object
    const testConversation = {
      id: 'test-conversation-123',
      user_display_name: 'Test Customer',
      artist_display_name: 'Nowak Tattoo'
    };

    console.log('🧪 Expected notification behavior:');
    if (userType === 'artist') {
      console.log('  - Title: "New Message"');
      console.log('  - Body: "You have new messages from customers"');
      console.log('  - Navigation: Should go to ArtistBookings (dashboard)');
    } else {
      console.log('  - Title: "New message from Nowak Tattoo"');
      console.log('  - Body: Message content preview');
      console.log('  - Navigation: Should go to Chat with conversation ID');
    }

    console.log('🧪 Calling handleIncomingMessage with test data...');
    
    try {
      // Call the private method for testing
      await service.handleIncomingMessage(testMessage, testConversation);
      console.log('✅ Test message simulation completed');
    } catch (error) {
      console.error('❌ Error simulating test message:', error);
    }
  }
}

// Export for console testing
(global as any).NotificationTestUtils = NotificationTestUtils;
