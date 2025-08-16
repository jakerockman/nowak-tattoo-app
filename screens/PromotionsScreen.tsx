// screens/PromotionsScreen.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const SPACING = 16;

const promotions = [
  {
    id: '1',
    image: require('../assets/promotions/promo1.jpg'),
    title: 'Summer Ink Special',
    desc: '10% off any tattoo through August'
  },
  {
    id: '2',
    image: require('../assets/skul-background.png'),
    title: 'Flash Tattoo Friday',
    desc: 'Quick 2-hour designs at a flat rate'
  }
];

type StackParamList = {
  Home: undefined;
  Gallery: undefined;
  Promotions: undefined;
  Booking: undefined;
  Chat: undefined;
};

type PromotionsNavProp =
  NativeStackNavigationProp<StackParamList, 'Promotions'>;

export default function PromotionsScreen() {
  const navigation = useNavigation<PromotionsNavProp>();
  const { currentUser } = useAuth();




  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={promotions}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.fullScreenCard}>
            <Image source={item.image} style={styles.fullscreenImage} />

            <View style={styles.textOverlay}>
              {item.id === '1' ? (
                <Text style={styles.title}>
                  <Text>Summer </Text>
                  <Text style={styles.inkText}>Ink</Text>
                  <Text> Special</Text>
                </Text>
              ) : (
                <Text style={styles.title}>{item.title}</Text>
              )}
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
          </View>
        )}
      />
      
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
    backgroundColor: '#000'
  },
  fullScreenCard: {
    width: width,
    height: height,
    position: 'relative'
  },
  fullscreenImage: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'cover'
  },

  textOverlay: {
    position: 'absolute',
    bottom: SPACING * 2,
    left: SPACING,
    right: SPACING,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: SPACING
  },
  title: {
    color: '#fff',
    fontSize: 50,
    fontFamily: 'Wallpoet_400Regular',
    marginBottom: 8,
    textAlign: 'left',
  },
  inkText: {
    fontSize: 80,
  },
  desc: {
    color: '#eee',
    fontSize: 20,
    fontFamily: 'Wallpoet_400Regular',
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 55,
    backgroundColor: '#000000',
  },
});