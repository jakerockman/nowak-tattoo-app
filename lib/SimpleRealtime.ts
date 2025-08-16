// SimpleRealtime.ts - A simplified real-time messaging solution
import { supabase } from './supabase';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_type: 'user' | 'artist';
}

class SimpleRealtime {
  private subscriptions: Map<string, any> = new Map();
  
  // Simple direct subscription to messages table
  subscribeToConversation(conversationId: string, onMessage: (message: Message) => void) {
    console.log('🔄 Creating simple realtime subscription for:', conversationId);
    
    // Clean up existing subscription
    if (this.subscriptions.has(conversationId)) {
      this.subscriptions.get(conversationId).unsubscribe();
    }
    
    // Create new subscription
    const subscription = supabase
      .channel(`simple-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('🎯 Simple realtime message received:', payload);
          const message = payload.new as Message;
          if (message) {
            onMessage(message);
          }
        }
      )
      .subscribe((status) => {
        console.log(`🔗 Simple subscription status for ${conversationId}:`, status);
      });
    
    this.subscriptions.set(conversationId, subscription);
    return subscription;
  }
  
  // Test basic realtime functionality
  testRealtime() {
    console.log('🧪 Testing basic realtime functionality...');
    
    const testSubscription = supabase
      .channel('test-simple-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🧪 Test realtime payload:', payload);
        }
      )
      .subscribe((status) => {
        console.log('🧪 Test subscription status:', status);
      });
    
    return testSubscription;
  }
  
  // Clean up subscription
  unsubscribe(conversationId: string) {
    if (this.subscriptions.has(conversationId)) {
      console.log('🧹 Cleaning up simple subscription for:', conversationId);
      this.subscriptions.get(conversationId).unsubscribe();
      this.subscriptions.delete(conversationId);
    }
  }
  
  // Clean up all subscriptions
  cleanup() {
    console.log('🧹 Cleaning up all simple subscriptions');
    this.subscriptions.forEach((subscription, conversationId) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
}

export const simpleRealtime = new SimpleRealtime();
