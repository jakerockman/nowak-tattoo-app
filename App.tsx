import React, { useEffect, useState, useRef } from 'react';
import { useFonts as useRobotoFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { useFonts as useWallpoetFonts, Wallpoet_400Regular } from '@expo-google-fonts/wallpoet';
import { AppState, View, TouchableOpacity } from 'react-native';
import 'react-native-gesture-handler';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { MessageCountProvider } from './contexts/MessageCountContext';
import { CustomNotification } from './components/CustomNotification';
import NotificationTestPanel from './components/NotificationTestPanel';

import HomeScreen from './screens/HomeScreen';
import GalleryScreen from './screens/GalleryScreen';
import BookingScreen from './screens/BookingScreen';
import PromotionsScreen from './screens/PromotionsScreen';
import ChatScreen from './screens/ChatScreen';
import ArtistLoginScreen from './screens/ArtistLoginScreen';
import ArtistBookingsScreen from './screens/ArtistBookingsScreen';
import BookingDetailsScreen from './screens/BookingDetailsScreen';
import UserLoginScreen from './screens/UserLoginScreen';
import { supabase } from './lib/supabase';
import { AuthPersistence } from './services/AuthPersistence';
import { notificationService } from './services/NotificationService';
import type { Session } from '@supabase/supabase-js';

interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  userType: 'user' | 'artist';
}

const Stack = createNativeStackNavigator();

// Navigation wrapper component to handle auto-navigation for logged-in users
function AppNavigator({ currentUser, artistSession, isInitializing }: {
  currentUser: CurrentUser | null;
  artistSession: Session | null;
  isInitializing: boolean;
}) {
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  
  // Set up navigation callback for notifications
  useEffect(() => {
    if (navigationRef.current) {
      notificationService.setNavigationCallback((destination: string) => {
        console.log('📱 Notification navigation request:', destination);
        console.log('📱 Navigation ref ready:', navigationRef.current?.isReady());
        
        if (navigationRef.current?.isReady()) {
          try {
            if (destination === 'dashboard') {
              // For artists: Navigate to ArtistBookings dashboard to see unread message count
              console.log('📱 Navigating artist to ArtistBookings dashboard...');
              (navigationRef.current as any).navigate('ArtistBookings');
            } else {
              // Navigate to Chat screen with conversation ID (for users)
              console.log('📱 Navigating to Chat screen with conversation:', destination);
              (navigationRef.current as any).navigate('Chat', { conversationId: destination });
            }
            console.log('📱 Navigation call completed');
          } catch (error) {
            console.error('❌ Navigation error:', error);
          }
        } else {
          console.warn('⚠️ Navigation not ready for notification callback');
        }
      });
    } else {
      console.warn('⚠️ Navigation ref not available when setting up callback');
    }
  }, [navigationRef.current]);
  
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // Only auto-navigate once when the app is ready and user is restored
        if (!isInitializing && currentUser && !hasAutoNavigated) {
          setHasAutoNavigated(true);
          // For artists, always redirect to their bookings dashboard
          if (currentUser.userType === 'artist') {
            console.log('🏠 Auto-navigating artist to ArtistBookings');
            // Use a timeout to ensure navigation is ready
            setTimeout(() => {
              // This will be handled by the navigation state
            }, 100);
          }
          // Regular users stay on Home screen (no navigation needed)
        }
      }}
    >
      <Stack.Navigator 
        initialRouteName={
          // If user is restored and is an artist, start on ArtistBookings
          !isInitializing && currentUser?.userType === 'artist' 
            ? "ArtistBookings" 
            : "Home"
        }
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
        />
      <Stack.Screen 
        name="Gallery" 
        component={GalleryScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Promotions" 
        component={PromotionsScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="Booking" 
        component={BookingScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="UserLogin" 
        component={UserLoginScreen}
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="ArtistBookings" 
        component={ArtistBookingsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="BookingDetails" 
        component={BookingDetailsScreen}
        options={{
          animation: 'slide_from_right',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [robotoLoaded] = useRobotoFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  });
  const [wallpoetLoaded] = useWallpoetFonts({
    Wallpoet_400Regular,
  });
  const [artistSession, setArtistSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const appState = useRef(AppState.currentState);

  // Custom notification state
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    title: string;
    message: string;
    onView: () => void;
    onDismiss: () => void;
  } | null>(null);

  // Test panel state (for development)
  const [testPanelVisible, setTestPanelVisible] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    initializeAuth();
    setupAppStateListener();
    setupCustomNotificationCallback();
  }, []);

  const setupCustomNotificationCallback = () => {
    // Set up custom notification callback
    notificationService.setCustomNotificationCallback((title, message, onView, onDismiss) => {
      console.log('🎨 Showing custom notification:', title);
      setNotificationData({
        title,
        message,
        onView: () => {
          setNotificationVisible(false);
          setNotificationData(null);
          onView();
        },
        onDismiss: () => {
          setNotificationVisible(false);
          setNotificationData(null);
          onDismiss();
        }
      });
      setNotificationVisible(true);
    });
    
    // Log notification setup status in development
    if (__DEV__) {
      console.log('📱 Notification system status:');
      console.log('- Custom notification callback: ✅ Set');
      console.log('- Navigation integration: ✅ Ready');
      console.log('- Background notifications: ❌ Not implemented (in-app only)');
    }
  };

  // Hidden test panel access (for development)
  const handleTestPanelAccess = () => {
    if (__DEV__) {
      const newTapCount = tapCount + 1;
      setTapCount(newTapCount);
      
      if (newTapCount >= 5) {
        setTestPanelVisible(true);
        setTapCount(0);
      }
      
      // Reset tap count after 3 seconds
      setTimeout(() => setTapCount(0), 3000);
    }
  };

  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App has come to the foreground');
        // Process any queued notifications when app becomes active
        if (currentUser) {
          notificationService.processQueuedNotifications();
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  };

  const initializeAuth = async () => {
    try {
      console.log('🚀 Initializing app authentication...');
      
      // Initialize persistent auth first
      const user = await AuthPersistence.initialize();
      if (user) {
        setCurrentUser(user);
        console.log('✅ User restored from persistence:', user.displayName);
      } else {
        console.log('ℹ️ No user session to restore');
      }

      // Get current session state
      const { data } = await supabase.auth.getSession();
      setArtistSession(data.session);

      // Listen for auth changes
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        
        setArtistSession(session);
        
        if (event === 'SIGNED_IN' && session) {
          try {
            const user = await AuthPersistence.handleSuccessfulLogin(session);
            setCurrentUser(user);
            console.log('✅ User signed in:', user.displayName);
          } catch (error) {
            console.error('❌ Error handling sign in:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          try {
            // Don't call AuthPersistence.handleLogout() here as it was already called
            // by AuthUtils.signOut() - just update the app state
            console.log('🔐 App.tsx: Setting currentUser to null after SIGNED_OUT');
            setCurrentUser(null);
            console.log('✅ User signed out - app state updated');
          } catch (error) {
            console.error('❌ Error handling sign out:', error);
          }
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Token refreshed successfully');
          // Update stored session with new tokens
          try {
            await AuthPersistence.storeUserSession(session);
          } catch (error) {
            console.error('❌ Error storing refreshed session:', error);
          }
        }
      });

      setIsInitializing(false);
      
      // Return cleanup function
      return () => {
        if (listener?.subscription) {
          listener.subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
      setIsInitializing(false);
    }
  };

  if (!robotoLoaded || !wallpoetLoaded || isInitializing) {
    return null; // Could add a loading screen here
  }

  return (
    <MessageCountProvider>
      <DataProvider>
        <AuthProvider 
          currentUser={currentUser} 
          artistSession={artistSession} 
          isInitializing={isInitializing}
        >
        <AppNavigator 
          currentUser={currentUser}
          artistSession={artistSession}
          isInitializing={isInitializing}
        />
        
        {/* Custom notification overlay */}
        {notificationData && (
          <CustomNotification
            visible={notificationVisible}
            title={notificationData.title}
            message={notificationData.message}
            onView={notificationData.onView}
            onDismiss={notificationData.onDismiss}
          />
        )}

        {/* Hidden test panel access - tap 5 times in corner */}
        {__DEV__ && (
          <View style={{
            position: 'absolute',
            top: 50,
            right: 20,
            width: 50,
            height: 50,
            backgroundColor: 'transparent',
            zIndex: 9999,
          }}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={handleTestPanelAccess}
            />
          </View>
        )}

        {/* Notification test panel */}
        <NotificationTestPanel
          visible={testPanelVisible}
          onClose={() => setTestPanelVisible(false)}
        />
      </AuthProvider>
      </DataProvider>
    </MessageCountProvider>
  );
}