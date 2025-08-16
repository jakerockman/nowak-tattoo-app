import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface CustomNotificationProps {
  visible: boolean;
  title: string;
  message: string;
  onView: () => void;
  onDismiss: () => void;
}

export const CustomNotification: React.FC<CustomNotificationProps> = ({
  visible,
  title,
  message,
  onView,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in from top
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out to top
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: -100,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop for auto-dismiss - MUST be behind the notification */}
        <Pressable style={styles.backdrop} onPress={onDismiss} />
        
        <Animated.View
          style={[
            styles.notification,
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Background gradient for glassmorphism effect */}
          <LinearGradient
            colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.content}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message} numberOfLines={2}>
                {message}
              </Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.dismissButton]} 
                onPress={onDismiss}
                activeOpacity={0.7}
              >
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.viewButton]} 
                onPress={onView}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.viewText}>View</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  notification: {
    width: width * 0.92,
    marginTop: 60, // Below status bar
    marginHorizontal: width * 0.04,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  content: {
    padding: 20,
    paddingBottom: 16,
  },
  textContainer: {
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1,
    marginBottom: 6,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  message: {
    color: '#d2d0d0ff',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    lineHeight: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  viewButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonGradient: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  dismissText: {
    color: '#d2d0d0ff',
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    letterSpacing: 0.5,
  },
  viewText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Roboto_700Bold',
    letterSpacing: 0.5,
  },
});

export default CustomNotification;
