import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://trbfaozlvwykygnrxaxy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmZhb3psdnd5a3lnbnJ4YXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzIxMDMsImV4cCI6MjA3MDM0ODEwM30.yoocL7YVlTYpIiH_T9HYMspVU8pBAG6x7yJSFPgLKDU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Configure for both development and production environments
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 50, // Increased from 10 to handle more real-time events
    },
  },
});

// Global broadcast channels for cross-screen communication
export const globalChannels = {
  bookingNotifications: supabase.channel('global-booking-notifications'),
  messageReadNotifications: supabase.channel('global-message-read-notifications')
};

// Development flag for debug logging
const isDev = process.env.NODE_ENV === 'development';

// Initialize global channels and provide unsubscribe/cleanup
let bookingNotificationsSubscription: { unsubscribe?: () => void } | null = null;
let messageReadNotificationsSubscription: { unsubscribe?: () => void } | null = null;
if (globalChannels.bookingNotifications) {
  bookingNotificationsSubscription = globalChannels.bookingNotifications.subscribe();
}
if (globalChannels.messageReadNotifications) {
  messageReadNotificationsSubscription = globalChannels.messageReadNotifications.subscribe();
}

export function cleanupGlobalChannels() {
  if (bookingNotificationsSubscription && typeof bookingNotificationsSubscription.unsubscribe === 'function') {
    bookingNotificationsSubscription.unsubscribe();
  }
  if (messageReadNotificationsSubscription && typeof messageReadNotificationsSubscription.unsubscribe === 'function') {
    messageReadNotificationsSubscription.unsubscribe();
  }
}

// Chat-related types
export interface Conversation {
  id: string;
  user_id: string;
  artist_id: string;
  created_at: string;
  updated_at: string;
  user_display_name?: string;
  artist_display_name?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_type: 'user' | 'artist';
}

// Chat utility functions
export const chatService = {
  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        if (isDev) console.error('Database test failed:', error);
        if (error.code === 'PGRST205') {
          if (isDev) console.log('❌ Chat tables do not exist. Please run the database setup script in Supabase.');
          return false;
        }
        return false;
      }
      if (isDev) console.log('✅ Database connection successful - chat tables exist');
      return true;
    } catch (error) {
      if (isDev) console.error('Database test error:', error);
      return false;
    }
  },
  // Create or get existing conversation
  async getOrCreateConversation(userId: string, artistId: string, userDisplayName: string, artistDisplayName: string): Promise<Conversation | null> {
    try {
      console.log('Getting/creating conversation:', { userId, artistId, userDisplayName, artistDisplayName });
      
      // First, try to find existing conversation (user to artist)
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('artist_id', artistId);

      if (fetchError) {
        console.error('Error checking existing conversation:', fetchError);
      }

      if (!fetchError && existing && existing.length > 0) {
        console.log('Found existing conversation:', existing[0].id);
        return existing[0];
      }

      // Also check reverse direction (artist to user)
      const { data: existingReverse, error: fetchReverseError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', artistId)
        .eq('artist_id', userId);

      if (fetchReverseError) {
        console.error('Error checking reverse conversation:', fetchReverseError);
      }

      if (!fetchReverseError && existingReverse && existingReverse.length > 0) {
        console.log('Found existing reverse conversation:', existingReverse[0].id);
        return existingReverse[0];
      }

      // If artistId is a placeholder, we need to handle this differently
      if (artistId.includes('placeholder')) {
        console.log('Using placeholder artist - creating conversation with special handling');
        // For placeholder artist, we create a conversation that can work offline
        const placeholderConversation: Conversation = {
          id: `conv-${userId}-placeholder-${Date.now()}`,
          user_id: userId,
          artist_id: artistId,
          user_display_name: userDisplayName,
          artist_display_name: artistDisplayName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return placeholderConversation;
      }

      // Create new conversation if none exists
      console.log('Creating new conversation...');
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          artist_id: artistId,
          user_display_name: userDisplayName,
          artist_display_name: artistDisplayName,
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        // If database insert fails, create a placeholder conversation
        console.log('Database insert failed, creating placeholder conversation');
        const placeholderConversation: Conversation = {
          id: `conv-${userId}-fallback-${Date.now()}`,
          user_id: userId,
          artist_id: artistId,
          user_display_name: userDisplayName,
          artist_display_name: artistDisplayName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return placeholderConversation;
      }
      
      console.log('Created new conversation:', data?.id);
      return data;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      // Return a fallback conversation so the chat can still work
      const fallbackConversation: Conversation = {
        id: `conv-${userId}-error-${Date.now()}`,
        user_id: userId,
        artist_id: artistId,
        user_display_name: userDisplayName,
        artist_display_name: artistDisplayName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return fallbackConversation;
    }
  },

  // Get user's conversations
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      console.log('Fetching conversations for user:', userId);
      
      // Get all conversations for this user (either as user or artist)
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user_id.eq.${userId},artist_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        
        // If table doesn't exist (PGRST205), return empty array and log helpful message
        if (error.code === 'PGRST205') {
          console.log('Conversations table does not exist. Please run the database setup script.');
          return [];
        }
        
        throw error;
      }

      console.log('Conversations found:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },

  // Send a message
  async sendMessage(conversationId: string, senderId: string, content: string, senderType: 'user' | 'artist'): Promise<Message | null> {
    try {
      console.log('Sending message:', { conversationId, senderId, content: content.substring(0, 50), senderType });
      
      // Handle placeholder conversations
      if (conversationId.includes('placeholder') || conversationId.includes('fallback') || conversationId.includes('error')) {
        console.log('Sending message to placeholder conversation');
        const placeholderMessage: Message = {
          id: `msg-${Date.now()}-${Math.random()}`,
          conversation_id: conversationId,
          sender_id: senderId,
          content: content.trim(),
          sender_type: senderType,
          is_read: false,
          created_at: new Date().toISOString()
        };
        
        // Store in AsyncStorage for persistence
        const storageKey = `chat_messages_${conversationId}`;
        const existingMessagesStr = await AsyncStorage.getItem(storageKey);
        const existingMessages = existingMessagesStr ? JSON.parse(existingMessagesStr) : [];
        existingMessages.push(placeholderMessage);
        await AsyncStorage.setItem(storageKey, JSON.stringify(existingMessages));
        
        console.log('Placeholder message created:', placeholderMessage.id);
        return placeholderMessage;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: content.trim(),
          sender_type: senderType,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error sending message to database:', error.message, error.details);
        // Fallback to AsyncStorage
        const placeholderMessage: Message = {
          id: `msg-fallback-${Date.now()}-${Math.random()}`,
          conversation_id: conversationId,
          sender_id: senderId,
          content: content.trim(),
          sender_type: senderType,
          is_read: false,
          created_at: new Date().toISOString()
        };
        
        const storageKey = `chat_messages_${conversationId}`;
        const existingMessagesStr = await AsyncStorage.getItem(storageKey);
        const existingMessages = existingMessagesStr ? JSON.parse(existingMessagesStr) : [];
        existingMessages.push(placeholderMessage);
        await AsyncStorage.setItem(storageKey, JSON.stringify(existingMessages));
        
        console.log('Fallback message created:', placeholderMessage.id);
        return placeholderMessage;
      }
      
      console.log('✅ Database message created successfully:', data?.id);
      console.log('📊 Message data:', data);
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  // Get messages for a conversation
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      // Handle placeholder conversations
      if (conversationId.includes('placeholder') || conversationId.includes('fallback') || conversationId.includes('error')) {
        console.log('Getting messages from AsyncStorage for placeholder conversation');
        const storageKey = `chat_messages_${conversationId}`;
        const messagesStr = await AsyncStorage.getItem(storageKey);
        const messages = messagesStr ? JSON.parse(messagesStr) : [];
        return messages.sort((a: Message, b: Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages from database:', error);
        // Fallback to AsyncStorage
        const storageKey = `chat_messages_${conversationId}`;
        const messagesStr = await AsyncStorage.getItem(storageKey);
        const messages = messagesStr ? JSON.parse(messagesStr) : [];
        return messages.sort((a: Message, b: Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      console.log(`🔄 Marking messages as read for conversation ${conversationId}, user ${userId}`);
      console.log(`� URGENT DEBUG: Function entered successfully!`);
      
      // SIMPLE test - just count all messages in conversation
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);
        
      console.log(`� URGENT: Total messages in conversation ${conversationId}: ${count}, error: ${countError?.message || 'none'}`);
      
      // Test if we can read any data at all
      const { data: basicTest, error: basicError } = await supabase
        .from('messages')
        .select('id, sender_id, is_read')
        .eq('conversation_id', conversationId)
        .limit(3);
        
      console.log(`🚨 URGENT: Basic test result - found ${basicTest?.length || 0} messages, error: ${basicError?.message || 'none'}`);
      if (basicTest) {
        console.log(`🚨 URGENT: Sample data:`, basicTest);
      }
      
      console.log(`🚨 CHECKPOINT 1: About to enter intermediate query section`);
      console.log(`🚨 CHECKPOINT 2: conversationId=${conversationId}, userId=${userId}`);
      
      // NEW APPROACH: Instead of using complex conditions, get specific message IDs first
      const { data: targetMessages, error: queryError } = await supabase
        .from('messages')
        .select('id, sender_id, content')
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender_id', userId);

      if (queryError) {
        console.log('❌ Query error:', queryError.message);
        return;
      }

      if (!targetMessages || targetMessages.length === 0) {
        console.log('ℹ️ No unread messages to mark as read');
        return;
      }

      console.log(`🎯 NEW METHOD: Found ${targetMessages.length} messages to update`);

      // Update messages using their specific IDs (this bypasses any RLS issues)
      const messageIds = targetMessages.map(msg => msg.id);
      
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds)
        .select('id, content');

      if (error) {
        console.error('❌ Error updating messages:', error);
      } else {
        console.log(`✅ NEW METHOD: Successfully marked ${data?.length || 0} messages as read`);
        
        // Send broadcast notification
        if (data && data.length > 0) {
          globalChannels.messageReadNotifications.send({
            type: 'broadcast',
            event: 'messages-read',
            payload: { 
              conversationId, 
              userId, 
              messageCount: data.length 
            }
          });
          console.log(`📢 Sent broadcast: ${data.length} messages marked as read`);
        }
      }
    } catch (error) {
      console.error('❌ Exception marking messages as read:', error);
    }
  },

  // Subscribe to new messages in a conversation
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    // For placeholder/offline conversations, we can't use realtime subscriptions
    if (conversationId.includes('placeholder') || conversationId.includes('fallback') || conversationId.includes('error')) {
      console.log('Cannot subscribe to realtime for placeholder conversation');
      return { unsubscribe: () => {} };
    }

  if (isDev) console.log(`Setting up realtime for conversation: ${conversationId}`);
    
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}` // Add filter for specific conversation
        },
        (payload) => {
          if (isDev) console.log('📨 Raw realtime payload received:', payload);
          const newMessage = payload.new as Message;
          if (newMessage && newMessage.conversation_id === conversationId) {
            if (isDev) console.log('New message received:', newMessage.content);
            callback(newMessage);
          } else {
            if (isDev) console.log('⚠️ Message not for this conversation or invalid:', newMessage);
          }
        }
      )
      .subscribe((status) => {
        if (isDev) console.log(`📡 Subscription status for ${conversationId}:`, status);
      });
    // Return channel with unsubscribe method for cleanup
    return {
      unsubscribe: () => channel.unsubscribe(),
      channel,
    };
  },

  // Test realtime connection
  async testRealtime() {
    console.log('🧪 Testing realtime connection...');
    const testChannel = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('🧪 Test realtime payload:', payload);
        }
      )
      .subscribe((status) => {
        console.log('🧪 Test subscription status:', status);
      });
    
    return testChannel;
  },

  // Get the single artist (Nowak Tattoo)
  async getArtist(): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, user_type')
        .eq('user_type', 'artist')
        .single();

      if (error) {
        console.error('Error fetching artist from profiles:', error);
        // If no artist in profiles, create a placeholder one
        return await this.createPlaceholderArtist();
      }
      return data;
    } catch (error) {
      console.error('Error fetching artist:', error);
      // Fallback to placeholder artist
      return await this.createPlaceholderArtist();
    }
  },

  // Create a placeholder artist for chat purposes
  async createPlaceholderArtist(): Promise<any> {
    try {
      // Try to insert artist profile if it doesn't exist
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: crypto.randomUUID(),
          email: 'jacobrockman.digital@gmail.com',
          display_name: 'Nowak Tattoo',
          user_type: 'artist'
        }, {
          onConflict: 'email'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating artist profile:', error);
        // Return hardcoded fallback
        return {
          id: 'jacob-digital-artist-placeholder',
          email: 'jacobrockman.digital@gmail.com',
          display_name: 'Nowak Tattoo',
          user_type: 'artist'
        };
      }
      return data;
    } catch (error) {
      console.error('Error creating placeholder artist:', error);
      // Return hardcoded fallback
      return {
        id: 'jacob-digital-artist-placeholder',
        email: 'jacobrockman.digital@gmail.com',
        display_name: 'Nowak Tattoo',
        user_type: 'artist'
      };
    }
  },

  // Keep this for backward compatibility but it now returns single artist
  async getArtists(): Promise<any[]> {
    const artist = await this.getArtist();
    return artist ? [artist] : [];
  },
};
