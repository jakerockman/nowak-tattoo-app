import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, Vibration, Animated } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { AuthUtils } from '../utils/AuthUtils';

interface MenuItem {
  label: string;
  nav: string;
  isLogin?: boolean;
  isLogout?: boolean;
}

interface SharedMenuProps {
  modalVisible: boolean;
  onClose: () => void;
  navigation: any;
  slideAnim?: Animated.Value;
  menuAnim?: Animated.Value;
}

export const SharedMenu: React.FC<SharedMenuProps> = ({ 
  modalVisible, 
  onClose, 
  navigation,
  slideAnim,
  menuAnim 
}) => {
  const { currentUser } = useAuth();

  const getMenuItems = (): MenuItem[] => {
    const baseMenuItems: MenuItem[] = [
      { label: 'Gallery', nav: 'Gallery' },
      { label: 'Promotions', nav: 'Promotions' },
      { label: 'Book Appointment', nav: 'Booking' },
      { label: 'Chat', nav: 'Chat' },
    ];

    if (currentUser) {
      // User is logged in - show logout button
      return [
        ...baseMenuItems,
        { label: 'Log Out', nav: 'LOGOUT', isLogout: true },
      ];
    } else {
      // Guest user - show login button  
      return [
        ...baseMenuItems,
        { label: 'Log In', nav: 'UserLogin', isLogin: true },
      ];
    }
  };

  const menuItems = getMenuItems();

  const handleMenuPress = async (item: MenuItem) => {
    Vibration.vibrate(30);
    onClose();
    
    if (item.isLogout) {
      await AuthUtils.signOut(navigation);
    } else {
      setTimeout(() => navigation.navigate({ name: item.nav as any, params: undefined }), 150);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.menuModal}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                (item.isLogin || item.isLogout) && styles.loginItem
              ]}
              onPress={() => handleMenuPress(item)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.menuText,
                (item.isLogin || item.isLogout) && styles.loginMenuText
              ]}>
                {item.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
});
