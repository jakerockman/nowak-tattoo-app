import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, Modal, Pressable, KeyboardAvoidingView, Platform, ScrollView, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

const ArtistLoginScreen = ({ navigation, route }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get the return destination from route params
  const returnTo = route?.params?.returnTo || 'Home';

  const menuItems = [
    { label: 'Home', nav: 'Home' },
    { label: 'Gallery', nav: 'Gallery' },
    { label: 'Promotions', nav: 'Promotions' },
    { label: 'Book Appointment', nav: 'Booking' },
    { label: 'Chat', nav: 'Chat' },
  ];

  const openMenu = () => {
    console.log('🟢 ArtistLoginScreen: hamburger menu button pressed!');
    setModalVisible(true);
  };

  const closeMenu = () => {
    setModalVisible(false);
  };

  const navigateToScreen = (screenName: string) => {
    setModalVisible(false);
    setTimeout(() => {
      navigation.navigate(screenName);
    }, 100);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please fill in both email and password.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      Alert.alert('Login Successful', 'Welcome, artist!');
      // Navigate to the intended destination or Home as fallback
      navigation.navigate(returnTo);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    setResetLoading(true);
    
    try {
      // Skip email validation for now - send reset email directly
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);

      if (error) {
        throw error;
      }

      Alert.alert(
        'Reset Email Sent',
        'A password reset link has been sent to your email. Please check your inbox and spam folder.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowForgotPassword(false);
              setResetEmail('');
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={require('../assets/skul-background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.headerContainer}>
          <View />
          <TouchableOpacity style={styles.hamburgerBtn} onPress={openMenu} activeOpacity={0.8}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#aaa"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#aaa"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#181818" /> : <Text style={styles.buttonText}>LOGIN</Text>}
          </TouchableOpacity>
          
          {!loading && (
            <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </ImageBackground>
      
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <View style={styles.menuModal}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  (item.label === 'User Login' || item.label === 'Artist Login') && styles.loginItem
                ]}
                onPress={() => navigateToScreen(item.nav)}
              >
                <Text style={[
                  styles.menuText,
                  (item.label === 'User Login' || item.label === 'Artist Login') && styles.loginMenuText
                ]}>{item.label.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showForgotPassword}
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowForgotPassword(false)}>
          <View style={styles.forgotPasswordModal}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalDescription}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Email Address"
              placeholderTextColor="#aaa"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleForgotPassword}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>SEND RESET LINK</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowForgotPassword(false)}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1.2,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  input: {
    backgroundColor: '#232323',
    color: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 18,
    fontFamily: 'Roboto_400Regular',
    textTransform: 'none',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232323',
    borderRadius: 12,
    marginBottom: 16,
    paddingRight: 4,
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    padding: 16,
    fontSize: 18,
    fontFamily: 'Roboto_400Regular',
    textTransform: 'none',
  },
  eyeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#181818',
    fontSize: 18,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1.1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
  forgotPasswordText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Wallpoet_400Regular',
    textAlign: 'center',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  forgotPasswordModal: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 20,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    minWidth: 320,
    maxWidth: 400,
    width: '90%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Wallpoet_400Regular',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1.2,
  },
  modalDescription: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
    fontSize: 16,
    color: '#fff',
    width: '100%',
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  modalButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#181818',
    fontSize: 16,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1.1,
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1.1,
  },
});

export default ArtistLoginScreen;
