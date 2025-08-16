import React, { useRef, useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Image, Modal, Pressable, Dimensions, StatusBar, Animated, ImageBackground, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AuthUtils } from '../utils/AuthUtils';
import type { Session } from '@supabase/supabase-js';

const { width, height } = Dimensions.get('window');

type StackParamList = {
  Home: undefined;
  Gallery: undefined;
  Promotions: undefined;
  Booking: undefined;
  Chat: undefined;
  ArtistLogin: undefined;
  ArtistBookings: undefined;
  UserLogin: { mode?: 'login' | 'signup' } | undefined;
};

interface MenuItem {
  label: string;
  nav: string;
  isLogin?: boolean;
  isLogout?: boolean;
}

type HomeNavProp = NativeStackNavigationProp<StackParamList, 'Home'>;

function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { currentUser, artistSession } = useAuth();
  const [modalVisible, setModalVisible] = React.useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  // Use a single anim value for both logo and menu
  const menuAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Session changes are now handled by AuthContext
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Dynamic menu based on user authentication state
  const getMenuItems = (): MenuItem[] => {
    if (currentUser) {
      // User is logged in
      if (currentUser.userType === 'artist') {
        // Artist - simplified work-focused menu
        return [
          { label: 'View Bookings', nav: 'ArtistBookings' },
          { label: 'Chat', nav: 'Chat' },
          { label: 'Log Out', nav: 'LOGOUT', isLogout: true },
        ];
      } else {
        // Regular user - customer menu
        return [
          { label: 'Gallery', nav: 'Gallery' },
          { label: 'Promotions', nav: 'Promotions' },
          { label: 'Book Session', nav: 'Booking' },
          { label: 'Chat', nav: 'Chat' },
          { label: 'Log Out', nav: 'LOGOUT', isLogout: true },
        ];
      }
    } else {
      // Guest user - show all options plus combined login/signup button
      return [
        { label: 'Gallery', nav: 'Gallery' },
        { label: 'Promotions', nav: 'Promotions' },
        { label: 'Book Session', nav: 'Booking' },
        { label: 'Chat', nav: 'Chat' },
        { label: 'Log In / Sign Up', nav: 'UserLogin', isLogin: true },
      ];
    }
  };

  // Recalculate menu items whenever currentUser changes
  const menuItems = getMenuItems();
  
  // Debug logging to track menu updates
  useEffect(() => {
    console.log('HomeScreen: currentUser changed:', currentUser ? `${currentUser.displayName} (${currentUser.userType})` : 'GUEST');
    console.log('HomeScreen: menu items:', getMenuItems().map(item => item.label));
  }, [currentUser]);

  // Additional debug for artistSession
  useEffect(() => {
    console.log('HomeScreen: artistSession changed:', artistSession ? 'HAS_SESSION' : 'NO_SESSION');
  }, [artistSession]);

  const openMenu = () => {
    Vibration.vibrate(50); // Subtle haptic feedback
    setModalVisible(true);
    menuAnim.setValue(0);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(iconAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(menuAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  };
  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(iconAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start(() => setModalVisible(false));
  };

  // Hamburger to X animation
  const line1Rotate = iconAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  const line2Opacity = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const line3Rotate = iconAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-45deg'] });
  // Logo translateY animation (reduce upward movement)
  const logoTranslateY = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.12] });
  // Menu modal opacity and translateY for smooth sync
  const menuModalOpacity = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const menuModalTranslateY = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.bg, { backgroundColor: '#000' }]}> 
        {/* Overlay moved below logo */}
        <View style={styles.content}>
          <Animated.View style={{ transform: [{ translateY: logoTranslateY }] }}>
            <Image
              source={require('../assets/images/nowak-logo.png')}
              style={[styles.logo, { marginTop: 20 }]}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={styles.slogan}>where art meets the skin</Text>
          <TouchableOpacity style={styles.hamburgerBtn} onPress={openMenu} activeOpacity={0.6}>
            <Animated.View style={[styles.hamburgerLine, { transform: [{ rotate: line1Rotate }] }]} />
            <Animated.View style={[styles.hamburgerLine, { opacity: line2Opacity }]} />
            <Animated.View style={[styles.hamburgerLine, { transform: [{ rotate: line3Rotate }] }]} />
          </TouchableOpacity>
        </View>
        <View style={styles.overlay} />
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeMenu}
        >
          <Pressable style={styles.modalOverlay} onPress={closeMenu} />
          <Animated.View style={[styles.menuModal, { right: slideAnim, opacity: menuModalOpacity, transform: [{ translateY: menuModalTranslateY }] }]}> 
            <ImageBackground
              source={require('../assets/skul-background.png')}
              style={styles.menuBg}
              imageStyle={{ resizeMode: 'cover' }}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.28)']}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.menuItemsContainer}>
                {menuItems.map((item, idx) => (
                  <Animated.View
                    key={item.label}
                    style={{
                      opacity: slideAnim.interpolate({
                        inputRange: [0, width],
                        outputRange: [1, 0],
                      }),
                      transform: [
                        {
                          translateX: slideAnim.interpolate({
                            inputRange: [0, width],
                            outputRange: [0, 40 + idx * 10],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.menuItem,
                        (item.isLogin || item.isLogout) && styles.loginItem
                      ]}
                      onPress={async () => {
                        Vibration.vibrate(30); // Light haptic feedback for menu selection
                        closeMenu();
                        
                        if (item.isLogout) {
                          // Handle logout
                          await AuthUtils.signOut(navigation);
                        } else {
                          // Navigate to regular screen
                          setTimeout(() => navigation.navigate({ name: item.nav as any, params: undefined }), 150);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.menuText,
                        (item.isLogin || item.isLogout) && styles.loginMenuText
                      ]}>{item.label.toUpperCase()}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </ImageBackground>
          </Animated.View>
        </Modal>
      </View>
      {/* Bottom navigation visibility banner */}
      <View style={styles.bottomBanner} />
    </SafeAreaView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bg: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  logo: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 32,
  },
  hamburgerBtn: {
    marginTop: 16,
    alignSelf: 'center',
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
    shadowRadius: 6,
  },
  hamburgerLine: {
    width: 28,
    height: 4,
    backgroundColor: '#fff',
    marginVertical: 2,
    borderRadius: 2,
  },
  menuModal: {
    position: 'absolute',
    left: 0,
    right: 0,
  top: height * 0.45,
    width: width,
    height: height * 0.5,
    backgroundColor: '#000',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 0,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  menuItemsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
  },
  menuItem: {
    width: '95%',
    paddingVertical: 10,
    borderRadius: 16,
    marginVertical: 4,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  menuText: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    fontWeight: 'normal',
  },
  loginMenuText: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    letterSpacing: 0.5,
    fontWeight: 'normal',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  slogan: {
    color: '#d2d0d0ff',
    fontSize: 45,
    fontFamily: 'Wallpoet_400Regular',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    letterSpacing: 1.2,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  menuBg: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#000',
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
  guestButtonsContainer: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 16,
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: '#CCCCCC',
  },
  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto_700Bold',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
});