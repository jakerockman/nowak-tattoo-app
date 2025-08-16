

import React, { useRef, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  Animated,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Session } from '@supabase/supabase-js';

const { width, height } = Dimensions.get('window');
const images = [
  require('../assets/images/tattoo1.jpg'),
  require('../assets/images/tattoo2.jpg'),
  require('../assets/images/tattoo3.jpg'),
  require('../assets/images/tattoo4.jpg'),
  require('../assets/images/tattoo5.jpg'),
  require('../assets/images/tattoo6.jpg'),
  require('../assets/images/tattoo7.jpg'),
  require('../assets/images/tattoo8.jpg'),
  require('../assets/images/tattoo9.jpg'),
  require('../assets/images/tattoo10.jpg'),
  require('../assets/images/tattoo11.jpg'),
  require('../assets/images/tattoo12.jpg'),
  require('../assets/images/tattoo13.jpg'),
  require('../assets/images/tattoo14.jpg'),
  require('../assets/images/tattoo15.jpg'),
  require('../assets/images/tattoo16.jpg'),
  require('../assets/images/tattoo17.jpg'),
];

type StackParamList = {
  Home: undefined;
  Gallery: undefined;
  Promotions: undefined;
  Booking: undefined;
  Chat: undefined;
};
type GalleryNavProp = NativeStackNavigationProp<StackParamList, 'Gallery'>;

export default function GalleryScreen() {
  const navigation = useNavigation<GalleryNavProp>();
  const { currentUser } = useAuth();
  const scrollX = useRef(new Animated.Value(0)).current;
  const carouselRef = useRef<ScrollView>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [refreshing, setRefreshing] = useState(false);



  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };



  const scrollToImage = (index: number) => {
    // First scroll to top to see the carousel
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
    
    // Use scrollTo for ScrollView
    setTimeout(() => {
      const itemWidth = width;
      carouselRef.current?.scrollTo({
        x: index * itemWidth,
        y: 0,
        animated: true,
      });
    }, 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        ref={scrollViewRef} 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={["#ffffff"]}
          />
        }
      >
        <View style={styles.headerContainer}>
          <Text style={styles.header}>GALLERY</Text>
        </View>
      <Animated.ScrollView
        ref={carouselRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        contentOffset={{ x: 0, y: 0 }}
        style={styles.carouselList}
      >
        {images.map((item, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.85, 1, 0.85],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.6, 1, 0.6],
            extrapolate: 'clamp',
          });
          return (
            <View key={`carousel-${index}`} style={{ width, justifyContent: 'center', alignItems: 'center' }}>
              <Animated.Image
                key={`image-${index}`}
                source={item}
                style={[
                  styles.carouselImage,
                  { transform: [{ scale }], opacity },
                ]}
                resizeMode="cover"
              />
            </View>
          );
        })}
      </Animated.ScrollView>
      <View style={styles.indicatorContainer}>
        {images.map((_, i) => {
          const inputRange = [
            (i - 1) * width,
            i * width,
            (i + 1) * width,
          ];
          const dotScale = scrollX.interpolate({
            inputRange,
            outputRange: [1, 1.6, 1],
            extrapolate: 'clamp',
          });
          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.indicator,
                { transform: [{ scale: dotScale }], opacity: dotOpacity },
              ]}
            />
          );
        })}
      </View>
      
      <View style={styles.gridContainer}>
        <FlatList
          data={images}
          keyExtractor={(_, idx) => `grid-${idx}`}
          numColumns={3}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => scrollToImage(index)}
              activeOpacity={0.7}
            >
              <Image
                source={item}
                style={styles.gridImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        />
      </View>
      </ScrollView>
      
      {/* Bottom navigation visibility banner */}
      <View style={styles.bottomBanner} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    paddingTop: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  header: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1.2,
  },
  hamburgerBtn: {
    position: 'absolute',
    top: 60,
    right: 16,
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
  carouselList: {
    flexGrow: 0,
  },
  carouselImage: {
    width: width * 0.85,
    height: width * 0.6,
    borderRadius: 20,
    backgroundColor: '#181818',
    marginVertical: 16,
    elevation: 6,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  gridItem: {
    flex: 1,
    margin: 4,
  },
  gridImage: {
    width: '100%',
    height: (width - 56) / 3,
    borderRadius: 8,
    backgroundColor: '#181818',
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
});