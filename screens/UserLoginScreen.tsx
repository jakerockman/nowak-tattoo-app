import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, Modal, Pressable, KeyboardAvoidingView, Platform, ScrollView, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

const UserLoginScreen = ({ navigation, route }: any) => {
  // Development flag for debug logging
  const isDev = process.env.NODE_ENV === 'development';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [loading, setLoading] = useState(false);

  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get the return destination and mode from route params
  const returnTo = route?.params?.returnTo || 'Home';
  const initialMode = route?.params?.mode || 'login';

  // Set initial signup state based on route params
  React.useEffect(() => {
    if (initialMode === 'signup') {
      setIsSignUp(true);
    }
  }, [initialMode]);

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
  if (isDev) console.log('🔍 Starting email existence check for:', email);
  if (isDev) console.log('🔍 Email to check (trimmed):', email.trim());
  if (isDev) console.log('🔍 Email length:', email.trim().length);
      
      // SAFE APPROACH: Use password reset to check if email exists
      // This won't create users, just sends reset email if user exists
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://jakerockman.github.io/nowak-tattoo-reset/'
      });
      
  if (isDev) console.log('🔍 Password reset error:', error);
      
      if (error) {
        const errorMsg = error.message || '';
  if (isDev) console.log('🔍 Error message:', errorMsg);
        
        // If we get specific "not found" errors, email doesn't exist
        if (errorMsg.toLowerCase().includes('user not found') || 
            errorMsg.toLowerCase().includes('no user found') ||
            errorMsg.toLowerCase().includes('invalid email')) {
          if (isDev) console.log('❌ DECISION: Email does NOT exist (user not found)');
          return false;
        }
        
        // For other errors, assume email doesn't exist to be safe
  if (isDev) console.log('❌ DECISION: Email does NOT exist (other error)');
        return false;
      }
      
      // If no error, password reset was sent - email exists
  if (isDev) console.log('✅ DECISION: Email EXISTS (password reset sent)');
      return true;
    } catch (error) {
      console.error('❌ Exception in checkEmailExists:', error);
      return false; // If check fails, proceed with signup anyway
    }
  };

  const validateEmail = (email: string) => {
    // More comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!email.trim()) {
      return 'Email is required';
    }
    
    if (email.length > 254) {
      return 'Email address is too long';
    }
    
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address (e.g., name@example.com)';
    }
    
    return null;
  };

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return requirements;
  };

  const getPasswordError = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };



  const handleAuth = async () => {
  if (isDev) console.log('🔴 handleAuth called - isSignUp:', isSignUp);
  if (isDev) console.log('🔴 Form data:', { email, firstName, surname, passwordLength: password?.length });
    
    if (!email || !password) {
      if (isDev) console.log('🔴 Missing email or password');
      Alert.alert('Missing Information', 'Please fill in both email and password to continue.');
      return;
    }

    // Enhanced email validation
    const emailError = validateEmail(email);
    if (emailError) {
      if (isDev) console.log('🔴 Email validation failed:', emailError);
      Alert.alert('Invalid Email', emailError);
      return;
    }

    if (isSignUp) {
      if (isDev) console.log('🔴 In signup mode - checking all fields');
      // Additional validation for sign up - ALL FIELDS COMPULSORY
      if (!firstName.trim()) {
        Alert.alert('First Name Required', 'Please enter your first name to create your account.');
        return;
      }

      if (firstName.trim().length < 2) {
        Alert.alert('Invalid First Name', 'First name must be at least 2 characters long.');
        return;
      }

      if (!surname.trim()) {
        Alert.alert('Surname Required', 'Please enter your surname to create your account.');
        return;
      }

      if (surname.trim().length < 2) {
        Alert.alert('Invalid Surname', 'Surname must be at least 2 characters long.');
        return;
      }

      // Check if email already exists before attempting signup
  if (isDev) console.log('🔍 Checking if email already exists for:', email);
      const emailExists = await checkEmailExists(email);
  if (isDev) console.log('🔍 Email exists check result:', emailExists);
      if (emailExists) {
  if (isDev) console.log('🚫 Email already exists, blocking signup');
        Alert.alert(
          'Email Already in Use', 
          'An account with this email address already exists. Please try logging in instead, or use a different email address.',
          [
            { text: 'Try Different Email', style: 'default' },
            { text: 'Go to Login', style: 'default', onPress: () => setIsSignUp(false) }
          ]
        );
        return;
      }
  if (isDev) console.log('✅ Email is available, proceeding with signup');

      const passwordError = getPasswordError(password);
      if (passwordError) {
        Alert.alert('Password Requirements', passwordError);
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    
    try {
      let result;
      if (isSignUp) {
  if (isDev) console.log('🔄 Starting signup process for:', email.trim());
        
        // Sign up new user with email verification
        result = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            // Remove custom redirect - let Supabase handle default confirmation
            data: {
              user_type: 'user',
              display_name: `${firstName.trim()} ${surname.trim()}`,
              first_name: firstName.trim(),
              surname: surname.trim()
            }
          }
        });
        
        if (isDev) console.log('🔄 Signup result:', {
          user: result.data?.user?.id,
          session: !!result.data?.session,
          error: result.error?.message
        });
      } else {
        // Sign in existing user
        result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      }

      if (result.error) {
        // Handle specific error types with better messages
        let errorMessage = result.error.message;
        
        if (result.error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (result.error.message.includes('Email not confirmed') || result.error.message.includes('email_not_confirmed')) {
          errorMessage = 'Please check your email and click the verification link before logging in. Check your spam folder if you don\'t see the email.';
        } else if (result.error.message.includes('signup_disabled')) {
          errorMessage = 'New registrations are temporarily disabled. Please contact support.';
        } else if (
          result.error.message.includes('User already registered') ||
          result.error.message.includes('already registered') ||
          result.error.message.includes('already exists') ||
          result.error.message.includes('duplicate key value') ||
          result.error.message.includes('unique constraint') ||
          result.error.code === '23505' // PostgreSQL unique violation error code
        ) {
          errorMessage = 'An account with this email address already exists. Please try logging in instead, or use a different email address.';
        }
        
        Alert.alert(isSignUp ? 'Sign Up Failed' : 'Login Failed', errorMessage);
      } else {
        if (isSignUp) {
          Alert.alert(
            'Account Created Successfully! 🎉', 
            'A verification email has been sent to your email address. Please check your inbox (and spam folder) and click the verification link to activate your account.\n\nOnce verified, you can log in with your credentials.',
            [{ text: 'Got it!', onPress: () => setIsSignUp(false) }]
          );
          // Clear form after successful signup
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setFirstName('');
          setSurname('');
        } else {
          // Successful login - determine user type and navigate accordingly
          const userType = result.data.user?.user_metadata?.user_type || 'user';
          if (isDev) console.log('🔐 User logged in with type:', userType);
          
          if (userType === 'artist') {
            Alert.alert('Login Successful', 'Welcome back, artist!');
            // Navigate to artist dashboard
            navigation.navigate('ArtistBookings');
          } else {
            Alert.alert('Login Successful', 'Welcome back!');
            // Navigate to the intended destination or Home as fallback
            navigation.navigate(returnTo);
          }
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      Alert.alert(
        'Connection Error', 
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
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
              <Text style={styles.formTitle}>
                {isSignUp ? 'CREATE ACCOUNT' : 'LOGIN'}
              </Text>
              {isSignUp && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    placeholderTextColor="#aaa"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Surname"
                    value={surname}
                    onChangeText={setSurname}
                    autoCapitalize="words"
                    placeholderTextColor="#aaa"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor="#aaa"
                  />
                </>
              )}
              {!isSignUp && (
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#aaa"
                />
              )}
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
              {isSignUp && (
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor="#aaa"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#aaa"
                    />
                  </TouchableOpacity>
                </View>
              )}
              
              {isSignUp && (
                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementText}>Password must contain:</Text>
                  {(() => {
                    const requirements = validatePassword(password);
                    return (
                      <>
                        <View style={styles.requirementRow}>
                          <Ionicons 
                            name={requirements.length ? 'checkmark-circle' : 'close-circle'} 
                            size={16} 
                            color={requirements.length ? '#4CAF50' : '#F44336'} 
                          />
                          <Text style={[styles.requirementItem, { color: requirements.length ? '#4CAF50' : '#F44336' }]}>
                            At least 8 characters
                          </Text>
                        </View>
                        <View style={styles.requirementRow}>
                          <Ionicons 
                            name={requirements.uppercase ? 'checkmark-circle' : 'close-circle'} 
                            size={16} 
                            color={requirements.uppercase ? '#4CAF50' : '#F44336'} 
                          />
                          <Text style={[styles.requirementItem, { color: requirements.uppercase ? '#4CAF50' : '#F44336' }]}>
                            One uppercase letter
                          </Text>
                        </View>
                        <View style={styles.requirementRow}>
                          <Ionicons 
                            name={requirements.lowercase ? 'checkmark-circle' : 'close-circle'} 
                            size={16} 
                            color={requirements.lowercase ? '#4CAF50' : '#F44336'} 
                          />
                          <Text style={[styles.requirementItem, { color: requirements.lowercase ? '#4CAF50' : '#F44336' }]}>
                            One lowercase letter
                          </Text>
                        </View>
                        <View style={styles.requirementRow}>
                          <Ionicons 
                            name={requirements.number ? 'checkmark-circle' : 'close-circle'} 
                            size={16} 
                            color={requirements.number ? '#4CAF50' : '#F44336'} 
                          />
                          <Text style={[styles.requirementItem, { color: requirements.number ? '#4CAF50' : '#F44336' }]}>
                            One number
                          </Text>
                        </View>
                        <View style={styles.requirementRow}>
                          <Ionicons 
                            name={requirements.special ? 'checkmark-circle' : 'close-circle'} 
                            size={16} 
                            color={requirements.special ? '#4CAF50' : '#F44336'} 
                          />
                          <Text style={[styles.requirementItem, { color: requirements.special ? '#4CAF50' : '#F44336' }]}>
                            One special character
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
              )}
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => {
                  console.log('🟡 Button pressed - isSignUp:', isSignUp, 'loading:', loading);
                  handleAuth();
                }} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#181818" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isSignUp ? 'SIGN UP' : 'LOGIN'}
                  </Text>
                )}
              </TouchableOpacity>
              
              {!isSignUp && (
                <TouchableOpacity 
                  style={styles.forgotPasswordButton} 
                  onPress={() => setShowForgotPassword(true)}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.switchButton} 
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={styles.switchText}>
                  {isSignUp 
                    ? 'Already have an account? Login' 
                    : "Don't have an account? Sign up"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

      {/* Forgot Password Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showForgotPassword}
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowForgotPassword(false)}
        >
          <Pressable style={styles.menuModal} onPress={(e) => e.stopPropagation()}>
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
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={false}
            />
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.modalButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowForgotPassword(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
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

  formContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  formTitle: {
    fontSize: 28,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1.2,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
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
    letterSpacing: 1,
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    textDecorationLine: 'underline',
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
    minWidth: 320,
    maxWidth: 400,
    width: '90%',
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
  passwordRequirements: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  requirementText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    fontWeight: 'normal',
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementItem: {
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    marginLeft: 8,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    textDecorationLine: 'underline',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Wallpoet_400Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDescription: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 8,
    padding: 18,
    marginBottom: 20,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    width: '100%',
    minHeight: 56,
  },
  modalButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Wallpoet_400Regular',
    fontWeight: 'normal',
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalCancelText: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
  },
});

export default UserLoginScreen;
