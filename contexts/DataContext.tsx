import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
// Development flag for debug logging
const isDev = process.env.NODE_ENV === 'development';

interface Booking {
  id: number;
  name: string;
  contact: string;
  notes: string;
  date: string;
  created_at: string;
  image_url?: string | null;
}

interface DataContextType {
  bookings: Booking[];
  unreadMessageCount: number;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  markMessagesAsRead: () => Promise<void>;
  addBooking: (booking: Partial<Booking>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // CACHE KEYS
  const BOOKINGS_CACHE_KEY = 'cached_bookings';
  const MESSAGES_CACHE_KEY = 'cached_message_count';

  // Load cached data first, then fetch fresh data
  const loadCachedData = async () => {
    try {
      const cachedBookings = await AsyncStorage.getItem(BOOKINGS_CACHE_KEY);
      const cachedMessages = await AsyncStorage.getItem(MESSAGES_CACHE_KEY);
      
      if (cachedBookings) {
        setBookings(JSON.parse(cachedBookings));
        if (isDev) console.log('📱 Loaded cached bookings');
      }
      
      if (cachedMessages) {
        setUnreadMessageCount(parseInt(cachedMessages) || 0);
        if (isDev) console.log('📱 Loaded cached message count');
      }
    } catch (error) {
      if (isDev) console.error('❌ Cache load error:', error);
    }
  };

  // Save data to cache
  const saveToCache = async (bookingsData: Booking[], messageCount: number) => {
    try {
      await AsyncStorage.setItem(BOOKINGS_CACHE_KEY, JSON.stringify(bookingsData));
      await AsyncStorage.setItem(MESSAGES_CACHE_KEY, messageCount.toString());
      if (isDev) console.log('💾 Data saved to cache');
    } catch (error) {
      if (isDev) console.error('❌ Cache save error:', error);
    }
  };

  // FRESH DATA FETCH
  const refreshData = async () => {
    try {
  if (isDev) console.log('🔄 Fetching fresh data...');
      
      // Get ALL bookings - no filters
      const { data: freshBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingError) {
        if (isDev) console.error('❌ Booking fetch error:', bookingError);
      } else {
        if (isDev) console.log(`✅ Fresh bookings: ${freshBookings?.length || 0} found`);
        setBookings(freshBookings || []);
      }

      // Get unread message count - improved with specific artist filtering
      const { data: unreadMessages, error: messageError } = await supabase
        .from('messages')
        .select('id, conversation_id')
        .eq('is_read', false)
        .eq('sender_type', 'user'); // Only customer messages to artist

      if (messageError) {
        if (isDev) console.error('❌ Message fetch error:', messageError);
        setUnreadMessageCount(0);
      } else {
        const count = unreadMessages?.length || 0;
        if (isDev) console.log(`✅ Fresh unread messages: ${count} found`);
        setUnreadMessageCount(count);
        // Save fresh data to cache
        await saveToCache(freshBookings || [], count);
      }
      
    } catch (error) {
      if (isDev) console.error('❌ Data refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark messages as read and update count
  const markMessagesAsRead = async () => {
    try {
      if (isDev) console.log('📖 Marking messages as read...');
      // Update all unread customer messages to read
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('is_read', false)
        .eq('sender_type', 'user');

      if (error) {
        if (isDev) console.error('❌ Mark read error:', error);
      } else {
        if (isDev) console.log('✅ Messages marked as read');
        setUnreadMessageCount(0);
        await AsyncStorage.setItem(MESSAGES_CACHE_KEY, '0');
      }
    } catch (error) {
      if (isDev) console.error('❌ Mark read exception:', error);
    }
  };

  // Add new booking (optimistic update)
  const addBooking = (newBooking: Partial<Booking>) => {
    const booking: Booking = {
      id: Date.now(), // Optimistic ID (will be replaced by database ID)
      name: newBooking.name || '',
      contact: newBooking.contact || '',
      notes: newBooking.notes || '',
      date: newBooking.date || new Date().toISOString(),
      created_at: new Date().toISOString(),
      image_url: newBooking.image_url || null,
    };
    
    const updatedBookings = [booking, ...bookings];
    setBookings(updatedBookings);
    saveToCache(updatedBookings, unreadMessageCount);
    console.log('➕ Booking added optimistically');
  };

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      await loadCachedData(); // Load cache first (fast)
      await refreshData(); // Then fetch fresh data (slower)
    };
    initializeData();

    // TEMPLATE: Cleanup for subscriptions (add your subscription cleanup here)
    return () => {
      // Example: if you create a subscription, unsubscribe here
      // if (mySubscription && typeof mySubscription.unsubscribe === 'function') {
      //   mySubscription.unsubscribe();
      // }
    };
    // Auto-refresh disabled in favor of real-time subscriptions
    // Real-time updates are handled by individual screens via postgres_changes
    // This prevents UI conflicts and provides better user experience
  }, []);

  const value: DataContextType = {
    bookings,
    unreadMessageCount,
    isLoading,
    refreshData,
    markMessagesAsRead,
    addBooking,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
