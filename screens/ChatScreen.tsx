import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Modal, 
  Pressable, 
  FlatList, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  RefreshControl,
  Keyboard,
  Image
} from 'react-native';
import { Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase, chatService, type Conversation, type Message } from '../lib/supabase';
import { simpleRealtime } from '../lib/SimpleRealtime';
import { useData } from '../contexts/DataContext';
import { useMessageCount } from '../contexts/MessageCountContext';
import { notificationService } from '../services/NotificationService';
import { ChatDiagnostics } from '../utils/ChatDiagnostics';
import { useAuth } from '../contexts/AuthContext';

interface ChatUser {
  id: string;
  email: string;
  displayName: string;
  userType: 'user' | 'artist';
}

export default function ChatScreen() {
  const navigation = useNavigation();
  const { currentUser: authUser } = useAuth();
  const { refreshData } = useData();
  const { triggerMessageCountRefresh } = useMessageCount();

  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mainArtist, setMainArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const subscription = useRef<any>(null);
  const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null);



  useEffect(() => {
    // Check if user is logged in via AuthContext
    console.log('ChatScreen: authUser state changed:', authUser ? 'LOGGED_IN' : 'GUEST');
    
    if (authUser) {
      // User is logged in, convert to ChatUser format
      const chatUser: ChatUser = {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
        userType: authUser.userType
      };
      setCurrentUser(chatUser);
    } else {
      // User is not logged in
      setCurrentUser(null);
    }
    
    // Always set loading to false once we know the auth state
    setLoading(false);
  }, [authUser]);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
      if (currentUser.userType === 'user') {
        loadMainArtist();
      }
      // Initialize notification service
      notificationService.initialize(currentUser);
    }
  }, [currentUser]);

  // Listen for message count refresh triggers to update unread counts
  useEffect(() => {
    const refreshCallback = () => {
      console.log('🔔 ChatScreen: Refreshing unread counts due to message count trigger');
      if (currentUser) {
        loadUnreadCounts();
      }
    };
    
    // Set up the callback if we have the context available
    if (triggerMessageCountRefresh && typeof triggerMessageCountRefresh === 'function') {
      // For some reason, we need to get the context methods directly
      try {
        const { useMessageCount } = require('../contexts/MessageCountContext');
        const { onMessageCountRefresh, offMessageCountRefresh } = useMessageCount();
        
        onMessageCountRefresh(refreshCallback);
        
        return () => {
          offMessageCountRefresh(refreshCallback);
        };
      } catch (error) {
        console.log('Could not set up message count refresh listener:', error);
      }
    }
  }, [currentUser]);

  // Auto-select conversation for users
  useEffect(() => {
    if (currentUser?.userType === 'user' && conversations.length > 0) {
      // For users, automatically open their conversation with the artist
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, currentUser]);

  // Auto-start chat for users with no conversations
  useEffect(() => {
    if (currentUser?.userType === 'user' && conversations.length === 0 && mainArtist && !selectedConversation) {
      // Automatically start a chat with the artist for users
      startChatWithArtist();
    }
  }, [currentUser, conversations, mainArtist, selectedConversation]);

  // Track chat screen status for notifications
  useEffect(() => {
    let isMounted = true;

    const setupChat = async () => {
      if (!selectedConversation?.id || !isMounted) return;
      
            console.log('Setting up chat for conversation:', selectedConversation.id);
      
      try {
        // Notify service we're in chat first to prevent race conditions
        notificationService.setChatScreenStatus(true, selectedConversation.id);
        
        await loadMessages();
        if (!isMounted) return;
        
        subscribeToMessages();
        if (!isMounted) return;
        
        await markMessagesAsRead();
        if (!isMounted) return;
        
      } catch (error) {
        console.error('Error setting up chat:', error);
      }
    };

    const debouncedSetup = () => {
      // Clear any existing timeout
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
      }
      
      // Set up with delay to prevent rapid re-initialization
      setupTimeoutRef.current = setTimeout(() => {
        if (isMounted) {
          if (selectedConversation?.id) {
            setupChat();
          } else {
            // Notify service we're not in active chat
            notificationService.setChatScreenStatus(false);
          }
        }
        setupTimeoutRef.current = null;
      }, 200); // Small delay to prevent rapid firing
    };

    debouncedSetup();
    
    return () => {
      isMounted = false;
      console.log('Cleaning up chat screen useEffect');
      
      // Clear timeout
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
        setupTimeoutRef.current = null;
      }
      
      if (subscription.current) {
        console.log('Unsubscribing from realtime messages');
        try {
          subscription.current.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
        subscription.current = null;
      }
      
      // Cleanup simple realtime subscriptions
      try {
        simpleRealtime.cleanup();
        console.log('Simple realtime cleanup completed');
      } catch (error) {
        console.error('Error during simple realtime cleanup:', error);
      }
      
      // Reset chat screen status
      notificationService.setChatScreenStatus(false);
    };
  }, [selectedConversation?.id]); // Only depend on conversation ID, not the full object

  // Mark messages as read whenever the chat screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (selectedConversation && currentUser) {
        console.log('🎯 ChatScreen focused - marking messages as read for conversation:', selectedConversation.id);
        markMessagesAsRead();
      } else if (currentUser && !selectedConversation) {
        console.log('🎯 ChatScreen focused on conversation list - refreshing unread counts');
        loadUnreadCounts();
      } else {
        console.log('🎯 ChatScreen focused but no conversation/user available');
      }

      // Return cleanup function that runs when screen loses focus
      return () => {
        console.log('🎯 ChatScreen losing focus - cleaning up notification status');
        notificationService.setChatScreenStatus(false);
      };
    }, [selectedConversation?.id, currentUser?.id])
  );

  const checkUserSession = async () => {
    try {
      // Test database connection first
      const dbConnected = await chatService.testConnection();
      setDatabaseReady(dbConnected);
      
      if (!dbConnected) {
        console.log('Database not set up yet - using fallback mode');
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userType = session.user.user_metadata?.user_type || 'user';
        const displayName = session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || session.user.email;
        
        setCurrentUser({
          id: session.user.id,
          email: session.user.email || '',
          displayName,
          userType
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking session:', error);
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!currentUser) return;
    
    try {
      const userConversations = await chatService.getUserConversations(currentUser.id);
      setConversations(userConversations);
      
      // Also load unread counts for each conversation
      await loadUnreadCounts(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadUnreadCounts = async (conversationList?: Conversation[]) => {
    if (!currentUser) return;
    
    const conversationsToCheck = conversationList || conversations;
    if (conversationsToCheck.length === 0) return;

    try {
      const counts: Record<string, number> = {};
      
      // For each conversation, get unread message count
      for (const conversation of conversationsToCheck) {
        const { data: messages, error } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conversation.id)
          .eq('is_read', false)
          .neq('sender_id', currentUser.id); // Don't count own messages as unread

        if (!error && messages) {
          counts[conversation.id] = messages.length;
        } else {
          counts[conversation.id] = 0;
        }
      }
      
      setUnreadCounts(counts);
      console.log('🔢 Unread counts loaded:', counts);
      
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  const loadMainArtist = async () => {
    try {
      const artist = await chatService.getArtist();
      setMainArtist(artist);
    } catch (error) {
      console.error('Error loading artist:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;
    
    try {
      const conversationMessages = await chatService.getMessages(selectedConversation.id);
      setMessages(conversationMessages);
      
      // Scroll to bottom after loading messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!selectedConversation?.id) {
      console.log('No selected conversation for subscription');
      return;
    }
    
    // Clean up existing subscription
    if (subscription.current) {
      try {
        subscription.current.unsubscribe();
        console.log('Cleaned up existing subscription');
      } catch (error) {
        console.error('Error cleaning up subscription:', error);
      }
      subscription.current = null;
    }
    
    try {
      console.log(`Setting up SIMPLE realtime for conversation: ${selectedConversation.id}`);
      
      // Use simplified realtime approach
      subscription.current = simpleRealtime.subscribeToConversation(
        selectedConversation.id,
        (newMessage: Message) => {
          if (!newMessage || typeof newMessage !== 'object') {
            console.warn('Received null or invalid message from simple subscription');
            return;
          }
          
          if (!newMessage.id) {
            console.warn('Received message without ID:', newMessage);
            return;
          }
          
          console.log('SIMPLE: New message received:', newMessage.content?.substring(0, 50) || 'No content');
          
          setMessages(prev => {
            // Don't add if already exists
            const exists = prev.find(msg => msg.id === newMessage.id);
            if (exists) {
              console.log('Message already exists, skipping duplicate');
              return prev;
            }
            
            const newMessages = [...prev, newMessage];
            console.log(`SIMPLE: Added new message. Total messages: ${newMessages.length}`);
            return newMessages;
          });
          
          // Auto scroll with delay to ensure rendering is complete
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      );
      
      if (subscription.current) {
        console.log('SIMPLE subscription created successfully');
      } else {
        console.warn('SIMPLE subscription created but returned null/undefined');
      }
    } catch (error) {
      console.error('Error creating SIMPLE subscription:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedConversation || !currentUser) return;
    
    try {
      console.log(`🔄 ChatScreen: Marking messages as read for conversation ${selectedConversation.id}, user ${currentUser.id}`);
      await chatService.markMessagesAsRead(selectedConversation.id, currentUser.id);
      
      // Update local messages state to reflect read status immediately
      setMessages(prevMessages => 
        prevMessages.map(message => ({
          ...message,
          is_read: message.sender_id !== currentUser.id ? true : message.is_read
        }))
      );
      
      // Update unread counts for this conversation
      setUnreadCounts(prevCounts => ({
        ...prevCounts,
        [selectedConversation.id]: 0
      }));
      
      // DIRECT SOLUTION: Immediately trigger message count refresh across all screens
      triggerMessageCountRefresh();
      
      // Also refresh global data context as backup
      await refreshData();
      
      console.log('✅ ChatScreen: Messages marked as read, updated local state, triggered direct refresh, and refreshed global data');
    } catch (error) {
      console.error('❌ ChatScreen: Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !currentUser) return;
    
    // Determine what to send
    let messageContent = '';
    if (selectedImage) {
      // Send image URI as message content
      messageContent = selectedImage;
      console.log('📸 Sending image:', selectedImage);
    } else if (newMessage.trim()) {
      // Send text message
      messageContent = newMessage.trim();
      console.log('💬 Sending text message:', messageContent);
    } else {
      // Nothing to send
      console.log('❌ Nothing to send - no message or image');
      return;
    }
    
    try {
      console.log('🚀 Attempting to send message:', messageContent.substring(0, 50));
      
      // Clear inputs immediately for better UX
      const originalMessage = newMessage;
      const originalImage = selectedImage;
      setNewMessage('');
      setSelectedImage(null);
      
      const message = await chatService.sendMessage(
        selectedConversation.id,
        currentUser.id,
        messageContent,
        currentUser.userType
      );
      
      console.log('✅ Message send result:', message?.id);
      
      if (message) {
        console.log('🧹 Message sent successfully');
        
        // For placeholder conversations, manually add the message to state
        // since real-time subscriptions don't work for them
        if (selectedConversation.id.includes('placeholder') || 
            selectedConversation.id.includes('fallback') || 
            selectedConversation.id.includes('error')) {
          console.log('📱 Adding message to placeholder conversation state');
          setMessages(prev => {
            const exists = prev.find(msg => msg.id === message.id);
            if (!exists) {
              const newMessages = [...prev, message].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              return newMessages;
            }
            return prev;
          });
        }
        
        // Scroll to bottom after sending
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.log('❌ No message returned from sendMessage, restoring inputs');
        // Restore inputs if send failed
        setNewMessage(originalMessage);
        setSelectedImage(originalImage);
      }
    } catch (error) {
      console.error('💥 Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      // Restore inputs on error
      setNewMessage(newMessage);
      setSelectedImage(selectedImage);
    }
  };

  const pickImage = async () => {
    try {
      console.log('📷 Opening image picker...');
      
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        console.log('❌ Permission denied');
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }
      
      console.log('✅ Permission granted, launching picker...');

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      console.log('📱 Image picker result:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('🖼️ Image selected:', result.assets[0].uri);
        setSelectedImage(result.assets[0].uri);
      } else {
        console.log('❌ Image selection cancelled or failed');
      }
    } catch (error) {
      console.error('💥 Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  const startChatWithArtist = async () => {
    if (!currentUser || !mainArtist) return;
    
    try {
      const artistDisplayName = mainArtist.display_name || mainArtist.email;
      const conversation = await chatService.getOrCreateConversation(
        currentUser.id,
        mainArtist.id,
        currentUser.displayName,
        artistDisplayName
      );
      
      if (conversation) {
        setSelectedConversation(conversation);
        await loadConversations(); // Refresh conversation list
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
  };

  const runDiagnostics = async () => {
    console.log('🔍 Running chat diagnostics...');
    try {
      const results = await ChatDiagnostics.runFullDiagnostic(selectedConversation?.id);
      const suggestions = ChatDiagnostics.getFixSuggestions(results);
      
      let alertMessage = results.summary;
      if (suggestions.length > 0) {
        alertMessage += '\n\nSuggested fixes:\n• ' + suggestions.join('\n• ');
      }
      
      Alert.alert(
        'Chat Diagnostics',
        alertMessage,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error running diagnostics:', error);
      Alert.alert('Error', 'Failed to run diagnostics');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    if (selectedConversation) {
      await loadMessages();
    }
    setRefreshing(false);
  };



  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString();
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const isUser = currentUser?.userType === 'user';
    const displayName = isUser ? item.artist_display_name : item.user_display_name;
    
    // Check if conversation has unread messages using unreadCounts
    const unreadCount = unreadCounts[item.id] || 0;
    const hasUnreadMessages = unreadCount > 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          hasUnreadMessages && styles.conversationItemUnread
        ]}
        onPress={() => setSelectedConversation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={[
              styles.conversationName,
              hasUnreadMessages && styles.conversationNameUnread
            ]}>
              {displayName}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.conversationTime}>{formatDate(item.updated_at)}</Text>
            {hasUnreadMessages && (
              <View style={[styles.unreadBadge, { marginLeft: 12 }]}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isImageUri = (content: string) => {
    return content.startsWith('file://') || content.startsWith('content://') || content.startsWith('http');
  };

  // Keyboard listeners for auto-scrolling
  useEffect(() => {
    const keyboardWillShow = () => {
      // Multiple attempts with different delays to ensure it works on all screen sizes
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
    };

    const keyboardWillHide = () => {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    };

    const showSubscription = Keyboard.addListener('keyboardDidShow', keyboardWillShow);
    const hideSubscription = Keyboard.addListener('keyboardDidHide', keyboardWillHide);

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Multiple scroll attempts for reliability on larger screens
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 500);
    }
  }, [messages.length]);

  const renderMessageItem = React.useCallback(({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === currentUser?.id;
    const isImage = isImageUri(item.content);
    const isUnreadMessage = !isOwnMessage && !item.is_read;
    
    return (
      <View style={styles.messageWrapper}>
        <Text style={[
          styles.messageTime,
          { 
            textAlign: isOwnMessage ? 'right' : 'left',
            marginBottom: 4,
            marginLeft: isOwnMessage ? 50 : 0,
            marginRight: isOwnMessage ? 0 : 50
          }
        ]}>
          {formatTime(item.created_at)}
          {isUnreadMessage && (
            <Text style={styles.unreadIndicator}> • New</Text>
          )}
        </Text>
        <View style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
          isImage && { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
          isUnreadMessage && styles.unreadMessage
        ]}>
          {isImage ? (
            <TouchableOpacity onPress={() => {
              // Could open full-screen image viewer here
            }}>
              <Image 
                source={{ uri: item.content }} 
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          )}
        </View>
      </View>
    );
  }, [currentUser?.id]);

  if (loading) {
    console.log('🔄 ChatScreen: Showing loading state');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.text}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    console.log('🚫 ChatScreen: No current user, showing login modal');
    return (
      <SafeAreaView style={styles.container}>
        {/* Login Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={true}
          onRequestClose={() => {
            navigation.goBack();
          }}
        >
          <View style={styles.loginModalOverlay}>
            <View style={styles.loginModalContent}>
              <Text style={styles.loginModalTitle}>You are not logged in</Text>
              <Text style={styles.loginModalText}>
                Please log in to access the chat.
              </Text>
              
              <TouchableOpacity 
                style={styles.loginModalButton}
                onPress={() => {
                  navigation.navigate('UserLogin' as never);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.loginModalButtonText}>Log In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.loginModalCancelButton}
                onPress={() => {
                  navigation.goBack();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.loginModalCancelText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  if (selectedConversation) {
    const isUser = currentUser.userType === 'user';
    const otherPartyName = isUser ? selectedConversation.artist_display_name : selectedConversation.user_display_name;

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.chatHeader}>
          </View>
          
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => {
              // Multiple scroll attempts for larger screens
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
            }}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            maxToRenderPerBatch={50}
            windowSize={21}
            initialNumToRender={50}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10
            }}
          />
          
          <View style={styles.inputContainer}>
            {/* Selected Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={removeSelectedImage}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputRow}>
              {/* Image Attachment Button */}
              <TouchableOpacity
                style={styles.imageButton}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <ImageIcon size={24} color="#007AFF" strokeWidth={2} />
              </TouchableOpacity>

              {/* Message Input */}
              <View style={styles.inputFieldWrapper}>
                <TextInput
                  style={[styles.messageInput, selectedImage && styles.messageInputWithImage]}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder={selectedImage ? "Add a caption..." : "Message"}
                  placeholderTextColor="#B0B0B0"
                  multiline
                  maxLength={500}
                  autoCapitalize="sentences"
                  blurOnSubmit={false}
                  onFocus={() => {
                    setTimeout(() => {
                      flatListRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
              </View>

              {/* Emoji Button */}
              {/* Send Button */}
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  (!newMessage.trim() && !selectedImage) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim() && !selectedImage}
                activeOpacity={0.7}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>CHAT</Text>
        </View>
        
        {!databaseReady && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Chat database not set up yet. Please run the database setup script in Supabase.
            </Text>
            <Text style={styles.warningSubtext}>
              Chat will work in offline mode until database is configured.
            </Text>
          </View>
        )}
        
        {/* Show conversation list only for artists */}
        {currentUser.userType === 'artist' && (
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            style={styles.conversationsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
            ListEmptyComponent={
              <View style={styles.centerContent}>
                <Text style={styles.text}>
                  No conversations yet. Users will appear here when they message you.
                </Text>
              </View>
            }
          />
        )}
        
        {/* For users, show loading state while chat is being set up */}
        {currentUser.userType === 'user' && !selectedConversation && (
          <View style={styles.centerContent}>
            <Text style={styles.text}>Setting up your chat...</Text>
          </View>
        )}
      </View>
      
      {/* Bottom Banner for Navigation Visibility */}
      <LinearGradient
        colors={['#000000', '#000000']}
        style={styles.bottomBanner}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1.2,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Wallpoet_400Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  hamburgerBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 24,
    zIndex: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  hamburgerLine: {
    width: 28,
    height: 3,
    backgroundColor: '#fff',
    marginVertical: 2,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModal: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 250,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  loginItem: {
    backgroundColor: '#000000',
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 3,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1.2,
    fontWeight: 'normal',
  },
  loginMenuText: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    letterSpacing: 0.5,
    fontWeight: 'normal',
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 24,
    alignSelf: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1,
    fontWeight: 'normal',
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    backgroundColor: '#1C1D26',
    borderRadius: 24,                   // More rounded corners
    padding: 12,                        // Normal vertical padding
    paddingHorizontal: 16,              // Less horizontal padding = narrower boxes
    marginBottom: 16,                   // Normal bottom margin
    marginHorizontal: 0,                // Align with page title - no horizontal margin
    marginRight: 20,                    // More right margin to give space for circles
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  conversationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conversationName: {
    color: '#FFFFFF',
    fontSize: 15,                       // Smaller font size
    fontFamily: 'Roboto_400Regular',    // Changed to Roboto
    flex: 1,
    fontWeight: 'normal',               // Keep normal weight
  },
  conversationNameUnread: {
    color: '#FFFFFF',
    fontWeight: 'normal',               // Remove bold, keep normal weight
  },
  conversationItemUnread: {
    borderLeftColor: '#FF6B35',
    backgroundColor: '#252631',
    borderWidth: 1,
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOpacity: 0.3,
    borderRadius: 24,                   // More rounded corners for unread items too
  },
  unreadBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 14,                   // Circular
    width: 28,                          // Size
    height: 28,                         // Size
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,                    // Border for contrast
    borderColor: '#000000',            // Black border
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,                       // Slightly smaller font
    fontWeight: 'bold',
    textAlign: 'center',               // Center the text
  },
  conversationTime: {
    color: '#B0B0B0',
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    opacity: 0.8,
  },
  chatContainer: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#000000',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Wallpoet_400Regular',
    flex: 1,
    textAlign: 'left',
    fontWeight: 'normal',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diagnosticsBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
  },
  diagnosticsIcon: {
    fontSize: 20,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#000000',
  },
  messagesContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  messageContainer: {
    marginVertical: 2,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageWrapper: {
    width: '100%',
    marginVertical: 2,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#21Af85',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#145c4a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
    marginLeft: 50,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E4E6EA',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    marginRight: 50,
  },
  unreadMessage: {
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Roboto_400Regular',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
    fontFamily: 'Roboto_400Regular',
    opacity: 0.7,
    color: '#FFFFFF',
  },
  unreadIndicator: {
    color: '#007AFF',
    fontSize: 10,
    fontFamily: 'Roboto_400Regular',
    fontWeight: 'bold',
  },
  ownMessageTime: {
    color: '#FFFFFF',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#B0B0B0',
    textAlign: 'left',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: '3%',
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 100,
    height: 80,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  attachButton: {
  },
  imageButton: {
    backgroundColor: '#23243A',
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 52,
    height: 52,
    marginRight: 8,
    borderWidth: 0,
  },
  inputFieldWrapper: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#23243A',
    borderRadius: 24,
    overflow: 'hidden',
  },
  emojiButton: {
    backgroundColor: 'transparent',
    borderRadius: 22,
    padding: 6,
    marginRight: 4,
    minWidth: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 22,
    color: '#007AFF',
  },
  thumbButton: {
    backgroundColor: 'transparent',
    borderRadius: 22,
    padding: 6,
    marginRight: 4,
    minWidth: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbIcon: {
    fontSize: 22,
    color: '#007AFF',
  },
  attachButtonText: {
    fontSize: 18,
  },
  inputContainerWrapper: {
    backgroundColor: '#1C1D26',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#ffffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    color: '#000000',
    fontSize: 16,
    maxHeight: 120,
    minHeight: 44,
    fontFamily: 'Roboto_400Regular',
    textTransform: 'none',
    textAlignVertical: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  messageInputWithImage: {
    backgroundColor: '#F0F0F0',
    borderColor: '#0084FF',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 22,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    height: 40,
    marginLeft: 6,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#4A4B56',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Wallpoet_400Regular',
    fontWeight: 'normal',
  },
  warningContainer: {
    backgroundColor: '#444',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  warningText: {
    color: '#ff9500',
    fontSize: 14,
    fontFamily: 'Wallpoet_400Regular',
    marginBottom: 8,
  },
  warningSubtext: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'Wallpoet_400Regular',
  },
  bottomBanner: {
    height: 55,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  loginButtonsContainer: {
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  loginButton: {
    backgroundColor: '#000000',
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    fontWeight: 'normal',
    letterSpacing: 0.5,
  },
  loginModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginModalContent: {
    backgroundColor: '#181818',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  loginModalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Wallpoet_400Regular',
    marginBottom: 15,
    textAlign: 'center',
  },
  loginModalText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  loginModalButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  loginModalButtonText: {
    color: '#181818',
    fontSize: 16,
    fontFamily: 'Wallpoet_400Regular',
    fontWeight: 'bold',
  },
  loginModalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  loginModalCancelText: {
    color: '#888888',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    textDecorationLine: 'underline',
  },
});
