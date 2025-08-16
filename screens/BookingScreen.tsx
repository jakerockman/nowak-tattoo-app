// screens/BookingScreen.tsx

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert, Image, ActivityIndicator, ScrollView, KeyboardAvoidingView, SafeAreaView, Animated } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const BookingScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const { refreshData } = useData();




  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Image Picker Error', 'Failed to pick image. Please try again.');
    }
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [notes, setNotes] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errors, setErrors] = useState({ name: false, email: false, phone: false });
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-50)).current;

  const onChangeDate = (event: unknown, selectedDate?: Date | undefined) => {
    setShowDate(false);
    if (selectedDate) setDate(selectedDate);
  };

  const displaySuccessToast = () => {
    setShowSuccessToast(true);
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateY, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowSuccessToast(false));
    }, 2000);
  };

  const handleSubmit = async () => {
    // Reset errors
    setErrors({ name: false, email: false, phone: false });

    // Robust validation using stricter regex and country code support
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValidEmail = emailRegex.test(email.trim());
    // Accept international phone numbers, min 8 digits
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const isValidPhone = cleanPhone.length >= 8 && cleanPhone.length <= 15;

    const newErrors = {
      name: !name.trim(),
      email: !email.trim() || !isValidEmail,
      phone: !phone.trim() || !isValidPhone,
    };
    if (newErrors.name || newErrors.email || newErrors.phone) {
      setErrors(newErrors);
      let errorMessage = 'Please check the following:\n';
      if (newErrors.name) errorMessage += '• Name is required\n';
      if (newErrors.email) errorMessage += '• Valid email address is required\n';
      if (newErrors.phone) errorMessage += '• Valid mobile number is required\n';
      Alert.alert('Validation Error', errorMessage.trim());
      return;
    }

    setUploading(true);
    let imagePath = null;

    try {
      // Handle image upload if present
      if (image) {
        try {
          const fileExt = image.split('.').pop() || 'jpg';
          const fileName = `booking_${Date.now()}.${fileExt}`;
          const response = await fetch(image);
          const blob = await response.blob();
          const { data, error: uploadError } = await supabase.storage
            .from('booking-images')
            .upload(fileName, blob);
          if (!uploadError) {
            imagePath = fileName;
          } else {
            Alert.alert('Image Upload Error', 'Failed to upload image. You can retry or continue without image.');
            // Optionally allow user to retry or continue
          }
        } catch (imageError) {
          Alert.alert('Image Upload Error', 'Failed to process image. You can retry or continue without image.');
          imagePath = null;
        }
      }

      // Automated check for required columns (status)
      const { error: statusError } = await supabase.from('bookings').select('status').limit(1);
      if (statusError && statusError.message.includes('status')) {
        Alert.alert('Database Error', 'Booking table is missing required columns. Please contact support.');
        setUploading(false);
        return;
      }

      // Database insert with proper error handling
      const { data: insertResult, error } = await supabase.from('bookings').insert([
        {
          name: name.trim(),
          contact: `${email.trim()} | ${phone.trim()}`,
          date: date.toISOString(),
          notes: notes.trim() || null,
          image_url: imagePath,
        },
      ]).select();

      if (error) {
        Alert.alert('Booking Error', `Failed to submit booking: ${error.message}. Please try again.`);
        setUploading(false);
        return;
      }

      // Trigger data refresh for artist dashboard
      try {
        await refreshData();
      } catch (refreshError) {
        Alert.alert('Dashboard Update Error', 'Booking submitted, but dashboard update failed.');
      }

      // Success - show toast and reset form
      displaySuccessToast();
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setDate(new Date());
      setImage(null);

    } catch (err) {
      Alert.alert('Booking Error', 'Unable to submit booking. Please try again or contact the studio directly.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>SEND US A BOOKING ENQUIRY</Text>
      </View>
      <Text style={styles.subtitle}>Please let us know your desired date and we'll get back to you with availability. Feel free to attach samples of tattoos you want!</Text>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        placeholder="Your Name *"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (errors.name) setErrors(prev => ({ ...prev, name: false }));
        }}
        onBlur={() => {
          if (!name.trim()) {
            setErrors(prev => ({ ...prev, name: true }));
          }
        }}
        placeholderTextColor="#bbb"
        autoCapitalize="words"
      />
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Email Address *"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors(prev => ({ ...prev, email: false }));
        }}
        onBlur={() => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValidEmail = emailRegex.test(email.trim());
          if (email.trim() && !isValidEmail) {
            setErrors(prev => ({ ...prev, email: true }));
          }
        }}
        placeholderTextColor="#bbb"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, errors.phone && styles.inputError]}
        placeholder="Phone Number *"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          if (errors.phone) setErrors(prev => ({ ...prev, phone: false }));
        }}
        onBlur={() => {
          const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
          const isValidPhone = cleanPhone.length >= 8 && /^\d+$/.test(cleanPhone);
          if (phone.trim() && !isValidPhone) {
            setErrors(prev => ({ ...prev, phone: true }));
          }
        }}
        placeholderTextColor="#bbb"
        keyboardType="phone-pad"
      />
      <TouchableOpacity onPress={() => setShowDate(true)} style={styles.input}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Date: {date.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={onChangeDate}
          minimumDate={new Date()}
        />
      )}
      <TextInput
        style={[styles.input, { minHeight: 48, maxHeight: 120 }]}
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholderTextColor="#bbb"
        multiline
        textAlignVertical="top"
      />
      <TouchableOpacity style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]} onPress={pickImage}>
        <Text style={{ color: '#fff', flex: 1 }}>Upload Tattoo Idea (optional)</Text>
        {image && <Text style={{ color: '#fff' }}>Attached</Text>}
      </TouchableOpacity>
      {image && (
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Image source={{ uri: image }} style={{ width: 120, height: 120, borderRadius: 10 }} />
        </View>
      )}
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#181818" /> : <Text style={styles.buttonText}>SEND</Text>}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Success Toast */}
      {showSuccessToast && (
        <Animated.View 
          style={[
            styles.successToast,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <Text style={styles.toastText}>Booking request submitted!</Text>
        </Animated.View>
      )}
      
      {/* Bottom navigation visibility banner */}
      <View style={styles.bottomBanner} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Wallpoet_400Regular',
    textAlign: 'left',
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'Roboto_400Regular',
    textAlign: 'left',
    marginTop: 8,
    marginBottom: 4,
    marginHorizontal: 16,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#232323',
    color: '#ffffff',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    textAlign: 'left',
    textTransform: 'none',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 48,
  },
  inputError: {
    backgroundColor: '#232323',
    color: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    textAlign: 'left',
    textTransform: 'none',
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
    minHeight: 48,
  },
  buttonText: {
    color: '#181818',
    fontSize: 24,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1.1,
  },
  keyboardView: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 40,
    marginRight: 48,
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
  bottomBanner: {
    height: 55,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  successToast: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    zIndex: 2000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Wallpoet_400Regular',
    fontWeight: 'normal',
  },
});

export default BookingScreen;