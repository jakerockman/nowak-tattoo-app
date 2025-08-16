// ChatDiagnostics.ts - Utility to diagnose real-time chat issues

import { supabase, chatService } from '../lib/supabase';

export class ChatDiagnostics {
  
  // Test basic database connection
  static async testDatabaseConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing database connection...');
      const isConnected = await chatService.testConnection();
      if (isConnected) {
        console.log('✅ Database connection: SUCCESS');
      } else {
        console.log('❌ Database connection: FAILED - Tables may not exist');
      }
      return isConnected;
    } catch (error) {
      console.error('❌ Database connection: ERROR', error);
      return false;
    }
  }
  
  // Test Supabase realtime connectivity
  static async testRealtimeConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing realtime connection...');
      
      return new Promise((resolve) => {
        let isResolved = false;
        
        // Set up a test channel
        const testChannel = supabase
          .channel('test-connection')
          .subscribe((status) => {
            if (!isResolved) {
              if (status === 'SUBSCRIBED') {
                console.log('✅ Realtime connection: SUCCESS');
                isResolved = true;
                testChannel.unsubscribe();
                resolve(true);
              } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.log('❌ Realtime connection: FAILED -', status);
                isResolved = true;
                resolve(false);
              }
            }
          });
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (!isResolved) {
            console.log('❌ Realtime connection: TIMEOUT');
            isResolved = true;
            testChannel.unsubscribe();
            resolve(false);
          }
        }, 10000);
      });
    } catch (error) {
      console.error('❌ Realtime connection: ERROR', error);
      return false;
    }
  }
  
  // Test message table realtime setup
  static async testMessageTableRealtime(conversationId: string): Promise<boolean> {
    try {
      console.log('🔍 Testing message table realtime for conversation:', conversationId);
      
      return new Promise((resolve) => {
        let isResolved = false;
        
        const testChannel = supabase
          .channel(`test-messages-${conversationId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              console.log('✅ Message table realtime: SUCCESS - Received test payload');
              if (!isResolved) {
                isResolved = true;
                testChannel.unsubscribe();
                resolve(true);
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Message table subscription status:', status);
            if (status === 'CHANNEL_ERROR' && !isResolved) {
              console.log('❌ Message table realtime: SUBSCRIPTION ERROR');
              isResolved = true;
              resolve(false);
            }
          });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!isResolved) {
            console.log('❌ Message table realtime: TIMEOUT - No subscription confirmation');
            isResolved = true;
            testChannel.unsubscribe();
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error('❌ Message table realtime: ERROR', error);
      return false;
    }
  }
  
  // Run comprehensive diagnostics
  static async runFullDiagnostic(conversationId?: string): Promise<{
    database: boolean;
    realtime: boolean;
    messageTable: boolean;
    summary: string;
  }> {
    console.log('🚀 Starting comprehensive chat diagnostics...');
    
    const results = {
      database: false,
      realtime: false,
      messageTable: false,
      summary: ''
    };
    
    // Test database connection
    results.database = await this.testDatabaseConnection();
    
    // Test realtime connection
    results.realtime = await this.testRealtimeConnection();
    
    // Test message table realtime if conversation ID provided
    if (conversationId && results.realtime) {
      results.messageTable = await this.testMessageTableRealtime(conversationId);
    }
    
    // Generate summary
    const issues = [];
    if (!results.database) {
      issues.push('Database tables not set up');
    }
    if (!results.realtime) {
      issues.push('Realtime connection failed');
    }
    if (conversationId && !results.messageTable) {
      issues.push('Message table realtime not working');
    }
    
    if (issues.length === 0) {
      results.summary = '✅ All systems working correctly';
    } else {
      results.summary = `❌ Issues found: ${issues.join(', ')}`;
    }
    
    console.log('📊 Diagnostic complete:', results.summary);
    return results;
  }
  
  // Quick fix suggestions
  static getFixSuggestions(diagnosticResults: any): string[] {
    const suggestions = [];
    
    if (!diagnosticResults.database) {
      suggestions.push('Run the database setup script in Supabase SQL Editor (database/chat-setup.sql)');
      suggestions.push('Check if chat tables exist in your Supabase dashboard');
    }
    
    if (!diagnosticResults.realtime) {
      suggestions.push('Check your internet connection');
      suggestions.push('Verify Supabase project settings and API keys');
      suggestions.push('Check if realtime is enabled in your Supabase project');
    }
    
    if (!diagnosticResults.messageTable) {
      suggestions.push('Enable realtime for messages table in Supabase Dashboard > Database > Replication');
      suggestions.push('Check Row Level Security policies for messages table');
    }
    
    return suggestions;
  }
}
