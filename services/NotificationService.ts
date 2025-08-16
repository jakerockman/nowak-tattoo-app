// NotificationService.ts - Enhanced with background notifications and improved logging
import { supabase, chatService, Message } from '../lib/supabase';
import { Alert, Vibration, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enhanced logging utility for notifications
const NotificationLogger = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`📱 [${timestamp}] ${message}`, data ? data : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.error(`❌ [${timestamp}] ${message}`, error ? error : '');
  },
  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.warn(`⚠️ [${timestamp}] ${message}`, data ? data : '');
  },
  success: (message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`✅ [${timestamp}] ${message}`, data ? data : '');
  }
};

interface ChatUser {
  id: string;
  email: string;
  displayName: string;
  userType: 'user' | 'artist';
}

interface GlobalSubscription {
  conversationId: string;
  subscription: any;
}

class NotificationService {
  private currentUser: ChatUser | null = null;
  private globalSubscriptions: GlobalSubscription[] = [];
  private isInChatScreen: boolean = false;
  private currentConversationId: string | null = null;
  private notificationQueue: Message[] = [];
  private isInitializing: boolean = false;
  private isSetupInProgress: boolean = false;
  private statusChangeTimeout: NodeJS.Timeout | null = null;
  private navigationCallback: ((conversationId: string) => void) | null = null;
  private customNotificationCallback: ((title: string, message: string, onView: () => void, onDismiss: () => void) => void) | null = null;
  private notificationCount: number = 0; // Track notification attempts

  // Set navigation callback for handling notification taps
  setNavigationCallback(callback: (conversationId: string) => void) {
    this.navigationCallback = callback;
    NotificationLogger.success('Navigation callback set for notifications');
  }

  // Set custom notification callback for styled notifications
  setCustomNotificationCallback(callback: (title: string, message: string, onView: () => void, onDismiss: () => void) => void) {
    this.customNotificationCallback = callback;
    NotificationLogger.success('Custom notification callback set');
  }

  // Initialize the service with current user
  async initialize(user: ChatUser) {
    if (this.isInitializing) {
      NotificationLogger.warn('Notification service already initializing, skipping...');
      return;
    }

    if (this.currentUser?.id === user.id) {
      NotificationLogger.log('Notification service already initialized for this user');
      return;
    }

    this.isInitializing = true;
    try {
      NotificationLogger.log(`Initializing notification service for ${user.displayName}`, {
        userId: user.id,
        userType: user.userType,
        platform: Platform.OS
      });
      
      // Clean up any existing state
      this.cleanup();
      
      this.currentUser = user;
      await this.loadNotificationPreferences();
      await this.setupGlobalMessageListener();
      
      NotificationLogger.success(`Notification service initialized successfully for ${user.displayName}`, {
        subscriptionsCount: this.globalSubscriptions.length
      });
    } catch (error) {
      NotificationLogger.error('Error initializing notification service:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  // Load user notification preferences
  async loadNotificationPreferences() {
    try {
      const prefs = await AsyncStorage.getItem(`notification_prefs_${this.currentUser?.id}`);
      if (!prefs) {
        // Set default preferences
        const defaultPrefs = {
          enabled: true,
          sound: true,
          vibration: true,
          showPreview: true
        };
        await AsyncStorage.setItem(
          `notification_prefs_${this.currentUser?.id}`, 
          JSON.stringify(defaultPrefs)
        );
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }

  // Set up global message listening for all conversations
  async setupGlobalMessageListener() {
    if (!this.currentUser) {
      console.log('⚠️ No current user, skipping global message listener setup');
      return;
    }

    if (this.isSetupInProgress) {
      console.log('📱 Global message listener setup already in progress, skipping...');
      return;
    }

    this.isSetupInProgress = true;
    try {
      // Clean up existing subscriptions first
      this.cleanup();
      
      // Get all user's conversations
      let conversations;
      try {
        conversations = await chatService.getUserConversations(this.currentUser.id);
      } catch (error) {
        console.error('❌ Error fetching conversations for global listener:', error);
        return;
      }
      
      if (!Array.isArray(conversations) || conversations.length === 0) {
        console.log('📱 No valid conversations found for global message listener');
        return;
      }
      
      // Filter out null/undefined conversations and validate structure
      const validConversations = conversations.filter(conversation => {
        if (!conversation || typeof conversation !== 'object') {
          console.warn('⚠️ Invalid conversation object:', conversation);
          return false;
        }
        
        if (!conversation.id || typeof conversation.id !== 'string') {
          console.warn('⚠️ Conversation missing valid ID:', conversation);
          return false;
        }
        
        // Skip placeholder conversations for real-time subscriptions
        if (conversation.id.includes('placeholder') || 
            conversation.id.includes('fallback') || 
            conversation.id.includes('error')) {
          console.log(`⏭️ Skipping placeholder conversation: ${conversation.id}`);
          return false;
        }
        
        return true;
      });
      
      if (validConversations.length === 0) {
        console.log('📱 No valid conversations after filtering');
        return;
      }
      
      console.log(`📱 Setting up subscriptions for ${validConversations.length} valid conversations`);
      
      // Subscribe to messages in all valid conversations
      validConversations.forEach(conversation => {
        // Skip setting up global subscription for the currently active chat
        // to avoid conflicts with the chat screen's subscription
        if (this.isInChatScreen && this.currentConversationId === conversation.id) {
          console.log(`⏭️ Skipping global subscription for active chat: ${conversation.id}`);
          return;
        }
        
        console.log(`📱 Setting up global subscription for conversation: ${conversation.id}`);
        try {
          const subscription = chatService.subscribeToMessages(
            conversation.id,
            (message: Message) => {
              if (message && typeof message === 'object' && message.id) {
                this.handleIncomingMessage(message, conversation);
              } else {
                console.warn('⚠️ Received invalid message in global listener:', message);
              }
            }
          );
          
          if (subscription && typeof subscription.unsubscribe === 'function') {
            this.globalSubscriptions.push({
              conversationId: conversation.id,
              subscription: subscription
            });
            console.log(`✅ Successfully subscribed to conversation: ${conversation.id}`);
          } else {
            console.warn(`⚠️ Failed to create valid subscription for conversation: ${conversation.id}`);
          }
        } catch (subscriptionError) {
          console.error(`❌ Error setting up subscription for conversation ${conversation.id}:`, subscriptionError);
        }
      });

      console.log(`📱 Global message listener setup complete - monitoring ${this.globalSubscriptions.length} conversations`);
    } catch (error) {
      console.error('❌ Error setting up global message listener:', error);
    } finally {
      this.isSetupInProgress = false;
    }
  }

  // Handle incoming messages
  private async handleIncomingMessage(message: Message, conversation: any) {
    this.notificationCount++;
    const notificationId = this.notificationCount;
    
    NotificationLogger.log(`NOTIFICATION #${notificationId}: handleIncomingMessage called`, {
      messageId: message?.id,
      senderId: message?.sender_id, 
      conversationId: message?.conversation_id,
      contentPreview: message?.content?.substring(0, 30) + '...',
      currentUserId: this.currentUser?.id,
      currentUserType: this.currentUser?.userType,
      isInChatScreen: this.isInChatScreen,
      currentConversationId: this.currentConversationId
    });
    
    if (!message || typeof message !== 'object') {
      NotificationLogger.warn(`NOTIFICATION #${notificationId}: Invalid message object received`);
      return;
    }
    
    if (!message.id || !message.sender_id || !message.conversation_id) {
      NotificationLogger.warn(`NOTIFICATION #${notificationId}: Message missing required fields`, message);
      return;
    }
    
    if (!this.currentUser || !this.currentUser.id) {
      NotificationLogger.warn(`NOTIFICATION #${notificationId}: No current user in notification handler`);
      return;
    }
    
    // Don't notify for own messages
    if (message.sender_id === this.currentUser.id) {
      NotificationLogger.log(`NOTIFICATION #${notificationId}: SKIPPING - Message is from current user (no self-notifications)`);
      return;
    }

    // Don't show notification if user is already in this chat
    if (this.isInChatScreen && this.currentConversationId === message.conversation_id) {
      NotificationLogger.log(`NOTIFICATION #${notificationId}: SKIPPING - User is currently in this chat screen`);
      return;
    }

    NotificationLogger.success(`NOTIFICATION #${notificationId}: PROCEEDING - Will show notification for message`);

    // Validate conversation object
    if (!conversation || typeof conversation !== 'object') {
      NotificationLogger.warn(`NOTIFICATION #${notificationId}: Invalid conversation object`);
      return;
    }

    // Determine notification content based on user type
    let notificationTitle: string;
    let notificationBody: string;
    let navigationDestination: string;

    if (this.currentUser.userType === 'artist') {
      // For artists: Generic notification that routes to chat overview
      notificationTitle = 'New Message';
      notificationBody = 'You have new messages from customers';
      navigationDestination = 'dashboard'; // Will route to Chat screen to see conversation list
      
      NotificationLogger.log(`NOTIFICATION #${notificationId}: Artist notification - routing to chat overview`);
    } else {
      // For users: Specific notification with sender name that routes to chat
      const isFromUser = message.sender_type === 'user';
      let senderName = 'Unknown Sender';
      
      try {
        if (isFromUser) {
          senderName = conversation.user_display_name || 'User';
        } else {
          senderName = conversation.artist_display_name || 'Nowak Tattoo';
        }
      } catch (error) {
        NotificationLogger.warn(`NOTIFICATION #${notificationId}: Error determining sender name:`, error);
        senderName = isFromUser ? 'User' : 'Nowak Tattoo';
      }

      notificationTitle = `New message from ${senderName}`;
      notificationBody = message.content && typeof message.content === 'string' && message.content.length > 50 ? 
        message.content.substring(0, 50) + '...' : 
        (message.content || 'New message');
      navigationDestination = 'chat'; // Route to specific chat
      
      NotificationLogger.log(`NOTIFICATION #${notificationId}: User notification - routing to chat with ${senderName}`);
    }
    
    // Store message for potential background notification
    try {
      this.notificationQueue.push(message);
      await this.saveNotificationQueue();
      NotificationLogger.log(`NOTIFICATION #${notificationId}: Message saved to queue (${this.notificationQueue.length} total)`);
    } catch (error) {
      NotificationLogger.error(`NOTIFICATION #${notificationId}: Error saving notification queue:`, error);
    }
    
    // Show immediate notification if app is active
    try {
      await this.showNotification({
        title: notificationTitle,
        body: notificationBody,
        data: {
          conversationId: message.conversation_id,
          senderId: message.sender_id,
          messageId: message.id,
          userType: this.currentUser.userType,
          navigationDestination: navigationDestination
        }
      }, notificationId);
    } catch (error) {
      NotificationLogger.error(`NOTIFICATION #${notificationId}: Error showing notification:`, error);
    }
    
    // Vibrate device
    try {
      this.vibrate();
      NotificationLogger.log(`NOTIFICATION #${notificationId}: Device vibration triggered`);
    } catch (error) {
      NotificationLogger.error(`NOTIFICATION #${notificationId}: Error vibrating device:`, error);
    }
  }

  // Show notification using custom component or Alert fallback
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
        NotificationLogger.log(`NOTIFICATION #${id}: Skipping - notifications disabled in preferences`);
        return;
      }

      NotificationLogger.log(`NOTIFICATION #${id}: Showing notification: ${notification.title}`);
      
      const handleView = () => {
        NotificationLogger.log(`NOTIFICATION #${id}: User wants to view message`, {
          conversationId: notification.data.conversationId,
          userType: notification.data.userType,
          navigationDestination: notification.data.navigationDestination
        });
        
        if (this.navigationCallback) {
          // Route based on user type and notification data
          if (notification.data.navigationDestination === 'dashboard') {
            // For artists: go to chat overview to see conversations with unread indicators
            NotificationLogger.log(`NOTIFICATION #${id}: Routing artist to chat overview`);
            this.navigationCallback('dashboard');
          } else {
            // For users: go directly to chat with specific conversation
            NotificationLogger.log(`NOTIFICATION #${id}: Routing user to chat`);
            this.navigationCallback(notification.data.conversationId);
          }
          NotificationLogger.success(`NOTIFICATION #${id}: Navigation callback executed`);
        } else {
          NotificationLogger.error(`NOTIFICATION #${id}: No navigation callback set`);
          Alert.alert(
            'Navigation Error', 
            'Unable to navigate to chat. Please restart the app if this issue persists.',
            [
              { text: 'OK', style: 'default' }
            ]
          );
        }
      };

      const handleDismiss = () => {
        NotificationLogger.log(`NOTIFICATION #${id}: User dismissed notification`);
      };

      // Try custom notification first, fallback to Alert
      if (this.customNotificationCallback) {
        NotificationLogger.log(`NOTIFICATION #${id}: Using custom styled notification`);
        this.customNotificationCallback(
          notification.title,
          notification.body,
          handleView,
          handleDismiss
        );
      } else {
        NotificationLogger.warn(`NOTIFICATION #${id}: Custom notification not available, using Alert fallback`);
        Alert.alert(
          notification.title,
          notification.body,
          [
            {
              text: 'View',
              onPress: handleView
            },
            {
              text: 'Dismiss',
              style: 'cancel',
              onPress: handleDismiss
            }
          ],
          { cancelable: true }
        );
      }
      
    } catch (error) {
      NotificationLogger.error(`NOTIFICATION #${id}: Error showing notification:`, error);
    }
  }

  // Save notification queue for background processing
  private async saveNotificationQueue() {
    try {
      const queueKey = `notification_queue_${this.currentUser?.id}`;
      await AsyncStorage.setItem(queueKey, JSON.stringify(this.notificationQueue));
    } catch (error) {
      console.error('Error saving notification queue:', error);
    }
  }

  // Process any queued notifications when app becomes active
  async processQueuedNotifications() {
    try {
      const queueKey = `notification_queue_${this.currentUser?.id}`;
      const queueStr = await AsyncStorage.getItem(queueKey);
      
      if (queueStr) {
        const queue: Message[] = JSON.parse(queueStr);
        console.log(`📱 Processing ${queue.length} queued notifications`);
        
        // Clear the queue
        await AsyncStorage.removeItem(queueKey);
        this.notificationQueue = [];
        
        // Could show a summary notification here
        if (queue.length > 0) {
          console.log(`📱 You have ${queue.length} unread messages`);
        }
      }
    } catch (error) {
      console.error('Error processing queued notifications:', error);
    }
  }

  // Vibrate device
  private vibrate() {
    Vibration.vibrate([100, 200, 100]);
  }

  // Set chat screen status (to avoid duplicate notifications)
  setChatScreenStatus(isInChat: boolean, conversationId?: string) {
    const wasInChat = this.isInChatScreen;
    const previousConversationId = this.currentConversationId;
    
    this.isInChatScreen = isInChat;
    this.currentConversationId = conversationId || null;
    
    NotificationLogger.log(`Chat screen status changed: ${isInChat ? 'ENTERED' : 'EXITED'}`, {
      conversationId: conversationId || 'none',
      wasInChat,
      previousConversationId
    });
    
    // Only refresh subscriptions if there's a meaningful change
    const shouldRefreshSubscriptions = (
      wasInChat !== isInChat || 
      (previousConversationId !== conversationId && (previousConversationId || conversationId))
    );
    
    if (shouldRefreshSubscriptions && !this.isSetupInProgress) {
      // Clear any pending timeout
      if (this.statusChangeTimeout) {
        clearTimeout(this.statusChangeTimeout);
      }
      
      NotificationLogger.log('Meaningful chat status change detected, refreshing global subscriptions...');
      
      // Use timeout to prevent rapid re-initialization and debounce status changes
      this.statusChangeTimeout = setTimeout(() => {
        if (!this.isSetupInProgress) {
          this.setupGlobalMessageListener();
        }
        this.statusChangeTimeout = null;
      }, 1000); // Increased debounce time to 1 second
    }
  }

  // Clean up subscriptions
  cleanup() {
    if (this.globalSubscriptions.length === 0) {
      return;
    }
    
    console.log(`🧹 Cleaning up ${this.globalSubscriptions.length} global subscriptions`);
    this.globalSubscriptions.forEach(globalSub => {
      if (globalSub && globalSub.subscription && typeof globalSub.subscription.unsubscribe === 'function') {
        try {
          globalSub.subscription.unsubscribe();
          console.log(`✅ Unsubscribed from conversation: ${globalSub.conversationId}`);
        } catch (error) {
          console.error(`❌ Error unsubscribing from conversation ${globalSub.conversationId}:`, error);
        }
      }
    });
    this.globalSubscriptions = [];
  }

  // Logout - cleanup and clear user
  logout() {
    console.log('📱 Notification service logging out...');
    
    // Clear any pending timeouts
    if (this.statusChangeTimeout) {
      clearTimeout(this.statusChangeTimeout);
      this.statusChangeTimeout = null;
    }
    
    this.cleanup();
    this.currentUser = null;
    this.isInChatScreen = false;
    this.currentConversationId = null;
    this.notificationQueue = [];
    this.isInitializing = false;
    this.isSetupInProgress = false;
    this.navigationCallback = null; // Clear navigation callback
    this.customNotificationCallback = null; // Clear custom notification callback
    console.log('📱 Notification service cleaned up for logout');
  }
}

export const notificationService = new NotificationService();

// Import test utilities for development
if (__DEV__) {
  import('./NotificationTestUtils').then(({ NotificationTestUtils }) => {
    (global as any).NotificationTestUtils = NotificationTestUtils;
    NotificationLogger.log('🧪 Notification test utilities loaded - use NotificationTestUtils in console');
  }).catch(() => {
    // Test utils not available in production
  });
}
