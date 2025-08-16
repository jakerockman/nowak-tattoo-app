import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Pressable, Vibration, ImageBackground, RefreshControl, FlatList } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useMessageCount } from '../contexts/MessageCountContext';
import { AuthUtils } from '../utils/AuthUtils';
import { CustomNotification } from '../components/CustomNotification';

interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  notes: string;
  status: string;
  image_url?: string | null;
  viewed?: boolean;
}

const ArtistBookingsScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const { refreshData } = useData();
  const { onMessageCountRefresh, offMessageCountRefresh } = useMessageCount();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadBookingsCount, setUnreadBookingsCount] = useState(0);
  const [showBookingsList, setShowBookingsList] = useState(false);
  
  // Booking notification state
  const [showBookingNotification, setShowBookingNotification] = useState(false);
  const [newBookingData, setNewBookingData] = useState<{ name: string; date: string } | null>(null);

  const refreshLocalData = async () => {
    console.log('🔄 ArtistBookingsScreen: Starting refresh cycle');
    setRefreshing(true);
    try {
      await Promise.all([fetchBookings(), fetchUnreadMessages()]);
      console.log('✅ ArtistBookingsScreen: Refresh cycle completed');
    } catch (error) {
      console.error('❌ ArtistBookingsScreen: Refresh cycle failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchBookings = async () => {
    try {
      console.log('🔄 Fetching bookings...');
      
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching bookings:', error);
        setBookings([]);
        setUnreadBookingsCount(0);
        return;
      }
      
      setBookings(bookingData || []);
      
      // Count unread bookings (viewed = false or null)
      const unreadCount = bookingData?.filter(booking => !booking.viewed).length || 0;
      setUnreadBookingsCount(unreadCount);
      
      console.log(`✅ REAL DATA: ${bookingData?.length || 0} total bookings, ${unreadCount} unread`);
      
    } catch (err) {
      console.error('❌ Exception fetching bookings:', err);
      setBookings([]);
      setUnreadBookingsCount(0);
    }
  };

  const markSingleBookingAsViewed = async (bookingId: number) => {
    try {
      console.log('👁️ Marking single booking as viewed:', bookingId);
      
      const { error } = await supabase
        .from('bookings')
        .update({ viewed: true })
        .eq('id', bookingId)
        .eq('viewed', false); // Only update if not already viewed
      
      if (error) {
        console.error('❌ Error marking booking as viewed:', error);
      } else {
        console.log('✅ Booking marked as viewed:', bookingId);
        // Refresh to get updated data and recalculate unread count
        fetchBookings();
      }
    } catch (err) {
      console.error('❌ Exception marking booking as viewed:', err);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      console.log('🔄 Fetching unread messages...');
      
      if (!currentUser?.id) {
        console.log('❌ No current user ID available');
        setUnreadMessagesCount(0);
        return;
      }

      // Get conversations where this artist is a participant
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`user_id.eq.${currentUser.id},artist_id.eq.${currentUser.id}`);

      if (convError) {
        console.error('❌ Error fetching conversations:', convError);
        setUnreadMessagesCount(0);
        return;
      }

      if (!conversations || conversations.length === 0) {
        console.log('✅ No conversations found for artist');
        setUnreadMessagesCount(0);
        return;
      }

      const conversationIds = conversations.map(c => c.id);
      console.log(`🔍 Found ${conversations.length} conversations for artist: ${conversationIds.join(', ')}`);

      // Get unread messages FROM CUSTOMERS TO ARTIST (not artist messages)
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, conversation_id, content, created_at, is_read, sender_type, sender_id')
        .eq('is_read', false)
        .eq('sender_type', 'user') // Only customer messages
        .in('conversation_id', conversationIds);

      if (error) {
        console.error('❌ Error fetching messages:', error);
        setUnreadMessagesCount(0);
        return;
      }
      
      const count = messages?.length || 0;
      setUnreadMessagesCount(count);
      console.log(`✅ REAL DATA: ${count} unread messages from customers to this artist`);
      if (count > 0) {
        console.log('📋 Unread message details:', messages?.map(m => 
          `ID: ${m.id}, Conv: ${m.conversation_id}, From: ${m.sender_id}, Read: ${m.is_read}`
        ));
      }
      
    } catch (err) {
      console.error('❌ Exception fetching messages:', err);
      setUnreadMessagesCount(0);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchBookings(), fetchUnreadMessages()]);
      setLoading(false);
    };
    loadInitialData();

    // DIRECT SOLUTION: Listen for immediate message count refresh triggers
    const handleMessageCountRefresh = async () => {
      console.log('🔔 ArtistBookingsScreen: Received direct message count refresh signal');
      await fetchUnreadMessages();
    };

    onMessageCountRefresh(handleMessageCountRefresh);

    // Enhanced real-time subscriptions with better debugging
    const bookingsChannelName = `artist-bookings-${Date.now()}`;
    const messagesChannelName = `artist-messages-${Date.now()}`;
    
    console.log('🔗 Setting up booking subscription:', bookingsChannelName);
    const bookingsSubscription = supabase
      .channel(bookingsChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        console.log('🔔 Booking database change:', payload.eventType, payload);
        console.log('🔄 Refreshing bookings due to database change...');
        
        // Show notification for new bookings
        if (payload.eventType === 'INSERT' && payload.new) {
          const newBooking = payload.new as Booking;
          console.log('🎉 New booking received:', newBooking.name);
          
          // Set notification data
          setNewBookingData({
            name: newBooking.name,
            date: new Date(newBooking.date).toLocaleDateString()
          });
          
          // Show notification
          setShowBookingNotification(true);
          
          // Vibrate to alert artist
          Vibration.vibrate([0, 300, 100, 300]);
        }
        
        fetchBookings();
        refreshData(); // Also refresh global DataContext
      })
      .subscribe((status) => {
        console.log('📡 Booking subscription status:', status);
      });

    console.log('🔗 Setting up message subscription:', messagesChannelName);
    const messagesSubscription = supabase
      .channel(messagesChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        console.log('🔔 Message database change:', payload.eventType);
        // Immediate refresh without delay - the database change has already happened
        console.log('🔄 Refreshing message count due to database change...');
        fetchUnreadMessages();
        refreshData(); // Also refresh global DataContext
      })
      .subscribe((status) => {
        console.log('📡 Message subscription status:', status);
      });

    // Backup: Periodic refresh every 30 seconds for booking count
    // This ensures booking count updates even if real-time fails
    const refreshInterval = setInterval(() => {
      console.log('⏰ Backup refresh: Checking for new bookings...');
      fetchBookings();
    }, 30000); // 30 seconds

    return () => {
      // Clean up direct message count listener
      offMessageCountRefresh(handleMessageCountRefresh);
      
      // Clean up subscriptions
      console.log('🧹 Cleaning up artist dashboard subscriptions');
      bookingsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      
      // Clean up backup refresh timer
      clearInterval(refreshInterval);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('🎯 ArtistBookingsScreen focused - refreshing data immediately');
      fetchBookings();
      fetchUnreadMessages();
      refreshData(); // Also refresh global DataContext
    }, [])
  );

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.bookingItem,
        !item.viewed && styles.unreadBookingItem, // Highlight unread bookings
        pressed && { backgroundColor: '#2a2a2a', transform: [{ scale: 0.98 }] }
      ]}
      onPress={() => {
        console.log('🔥 Navigation to booking details for:', item.name);
        Vibration.vibrate(50);
        
        // Mark this specific booking as viewed when opening its details
        if (!item.viewed) {
          markSingleBookingAsViewed(item.id);
        }
        
        (navigation.navigate as any)('BookingDetails', { booking: item });
      }}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingName}>{item.name}</Text>
        {!item.viewed && <View style={styles.unreadIndicator} />}
      </View>
      <Text style={styles.bookingContact}>{item.email} | {item.phone}</Text>
      <Text style={styles.bookingDate}>{new Date(item.date).toLocaleDateString()}</Text>
      <Text style={styles.bookingStatus}>Status: {item.status || 'pending'}</Text>
      {item.notes && <Text style={styles.bookingNotes}>{item.notes}</Text>}
    </Pressable>
  );

  const newBookingsCount = unreadBookingsCount;

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#fff" /></View>
    );
  }

  // Show bookings list view
  if (showBookingsList) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>ALL BOOKING ENQUIRIES</Text>
        </View>
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.bookingsList}
          contentContainerStyle={styles.bookingsListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshLocalData} tintColor="#fff" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No booking enquiries yet</Text>
            </View>
          }
        />
        
        {/* Dashboard Button at Bottom */}
        <View style={styles.dashboardButtonContainer}>
          <TouchableOpacity 
            style={styles.dashboardButton}
            onPress={() => setShowBookingsList(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.dashboardButtonText}>BACK TO DASHBOARD</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../assets/skul-background.png')}
        style={styles.backgroundImage}
        imageStyle={{ resizeMode: 'cover' }}
      >
        <View style={styles.centerContent}>
        <View style={styles.topButtonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            Vibration.vibrate(50);
            console.log('🔄 Showing bookings list');
            setShowBookingsList(true);
            // Don't mark as viewed here - only when individual booking is opened
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>BOOKINGS</Text>
          <Text style={styles.actionButtonSubtext}>
            {newBookingsCount > 0 ? `${newBookingsCount} new enquir${newBookingsCount === 1 ? 'y' : 'ies'}` : 'No new enquiries'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            Vibration.vibrate(50);
            console.log('🔄 Refreshing messages from MESSAGES button');
            fetchUnreadMessages();
            refreshData(); // Also refresh global DataContext
            navigation.navigate('Chat' as never);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>MESSAGES</Text>
          <Text style={styles.actionButtonSubtext}>
            {unreadMessagesCount > 0 ? `${unreadMessagesCount} unread message${unreadMessagesCount === 1 ? '' : 's'}` : 'No new messages'}
          </Text>
        </TouchableOpacity>
        </View>

        <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]}
          onPress={() => {
            Vibration.vibrate(50);
            AuthUtils.signOut(navigation);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionButtonText, styles.logoutText]}>LOG OUT</Text>
        </TouchableOpacity>
        </View>
      </View>
      </ImageBackground>
      
      {/* Booking Notification */}
      <CustomNotification
        visible={showBookingNotification}
        title="🎉 New Booking!"
        message={newBookingData ? `${newBookingData.name} just submitted a booking request for ${newBookingData.date}` : ''}
        onView={() => {
          setShowBookingNotification(false);
          setShowBookingsList(true);
          // Don't mark all as viewed - only when individual booking is opened
        }}
        onDismiss={() => {
          setShowBookingNotification(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181818',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  topButtonsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  bottomButtonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  actionButton: {
    width: '95%',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 40,
    marginVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 2,
    marginBottom: 4,
  },
  actionButtonSubtext: {
    color: '#aaa',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    textAlign: 'center',
  },
  logoutButton: {
    width: '60%',
    paddingVertical: 16,
    borderColor: '#FFFFFF',
  },
  logoutText: {
    color: '#ff6347',
    fontSize: 18,
  },
  // Bookings list styles
  listHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  listTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Wallpoet_400Regular',
    textAlign: 'center',
  },
  dashboardButtonContainer: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#181818',
  },
  dashboardButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 40,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dashboardButtonText: {
    color: '#181818',
    fontSize: 16,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  bookingsList: {
    flex: 1,
    backgroundColor: '#181818',
  },
  bookingsListContent: {
    padding: 20,
  },
  bookingItem: {
    backgroundColor: '#232323',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#fff',
  },
  unreadBookingItem: {
    backgroundColor: '#2a2a3a',
    borderLeftColor: '#ffeb3b',
    shadowColor: '#ffeb3b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffeb3b',
  },
  bookingName: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Wallpoet_400Regular',
    flex: 1,
  },
  bookingContact: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    marginBottom: 4,
  },
  bookingDate: {
    color: '#aaa',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    marginBottom: 4,
  },
  bookingStatus: {
    color: '#f0f8ff',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    marginBottom: 8,
  },
  bookingNotes: {
    color: '#ddd',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    textAlign: 'center',
  },
});

export default ArtistBookingsScreen;
