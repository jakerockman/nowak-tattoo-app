import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Vibration, Alert, Linking, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useData } from '../contexts/DataContext';

interface BookingDetailsParams {
  booking: {
    id: number;
    name: string;
    contact: string;
    notes: string;
    date: string;
    created_at: string;
    image_url?: string | null;
  };
}

const BookingDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { booking } = route.params as BookingDetailsParams;
  const [isUpdating, setIsUpdating] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { refreshData } = useData();

  // Get the image URL from Supabase storage
  const getImageUrl = async (imagePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('booking-images')
        .createSignedUrl(imagePath, 3600); // 1 hour expiry
      
      if (data?.signedUrl) {
        setImageUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error getting image URL:', error);
    }
  };

  // Load image when component mounts
  React.useEffect(() => {
    if (booking.image_url) {
      getImageUrl(booking.image_url);
    }
  }, [booking.image_url]);

  const handleBack = () => {
    Vibration.vibrate(50);
    navigation.goBack();
  };

  const markAsHandled = async () => {
    try {
      setIsUpdating(true);
      Vibration.vibrate(50);
      
      console.log('🔄 Updating booking status to handled for ID:', booking.id);
      
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'handled' })
        .eq('id', booking.id)
        .select();

      if (error) {
        console.error('❌ Error updating booking status:', error);
        Alert.alert(
          'Error',
          'Failed to mark booking as handled. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('✅ Booking marked as handled:', data);
      
      // Trigger data refresh to update booking counts
      console.log('🔄 Refreshing booking data after status update...');
      await refreshData();
      
      Alert.alert(
        'Success',
        'Booking has been marked as handled!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to see updated bookings list
              navigation.goBack();
            }
          }
        ]
      );

    } catch (err) {
      console.error('❌ Exception marking booking as handled:', err);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteBooking = async () => {
    Alert.alert(
      'Delete Booking',
      'Are you sure you want to permanently delete this booking? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true);
              Vibration.vibrate([0, 100, 50, 100]);
              
              console.log('🗑️ Permanently deleting booking ID:', booking.id);
              
              const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', booking.id);

              if (error) {
                console.error('❌ Error deleting booking:', error);
                Alert.alert(
                  'Error',
                  'Failed to delete booking. Please try again.',
                  [{ text: 'OK' }]
                );
                return;
              }

              console.log('✅ Booking permanently deleted');
              
              // Trigger data refresh to update booking counts
              console.log('🔄 Refreshing booking data after deletion...');
              await refreshData();
              
              Alert.alert(
                'Deleted',
                'Booking has been permanently deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate back to see updated bookings list
                      navigation.goBack();
                    }
                  }
                ]
              );

            } catch (err) {
              console.error('❌ Exception deleting booking:', err);
              Alert.alert(
                'Error',
                'An unexpected error occurred. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const contactCustomer = () => {
    Vibration.vibrate(50);
    setShowContactOptions(!showContactOptions);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BOOKING DETAILS</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.detailCard}>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>CUSTOMER NAME</Text>
            <Text style={styles.detailValue}>{booking.name}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>CONTACT INFORMATION</Text>
            <Text style={styles.detailValue}>{booking.contact}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>PREFERRED DATE</Text>
            <Text style={styles.detailValue}>
              {booking.date ? new Date(booking.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Not specified'}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>SUBMISSION DATE</Text>
            <Text style={styles.detailValue}>
              {new Date(booking.created_at).toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>

          {booking.notes && (
            <>
              <View style={styles.separator} />
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>NOTES & DESCRIPTION</Text>
                <Text style={styles.detailValueLong}>{booking.notes}</Text>
              </View>
            </>
          )}

          {booking.image_url && (
            <>
              <View style={styles.separator} />
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>REFERENCE IMAGE</Text>
                {imageUrl ? (
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.bookingImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.imageNote}>Loading image...</Text>
                )}
              </View>
            </>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={contactCustomer}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>CONTACT CUSTOMER</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.secondaryButton,
              isUpdating && styles.disabledButton
            ]}
            onPress={markAsHandled}
            activeOpacity={0.7}
            disabled={isUpdating}
          >
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              {isUpdating ? 'UPDATING...' : 'MARK AS HANDLED'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.deleteButton,
              isUpdating && styles.disabledButton
            ]}
            onPress={deleteBooking}
            activeOpacity={0.7}
            disabled={isUpdating}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              🗑️ DELETE BOOKING
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact Options */}
        {showContactOptions && (() => {
          const contactParts = booking.contact.split('|').map(part => part.trim());
          const email = contactParts[0] || '';
          const phone = contactParts[1] || '';
          
          return (
            <View style={styles.contactOptions}>
              {phone && (
                <>
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => {
                      Vibration.vibrate(50);
                      Linking.openURL(`tel:${phone}`);
                      setShowContactOptions(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.contactButtonText}>📞 CALL {phone}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => {
                      Vibration.vibrate(50);
                      const cleanPhone = phone.replace(/[^0-9+]/g, '');
                      Linking.openURL(`https://wa.me/${cleanPhone}`);
                      setShowContactOptions(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.contactButtonText}>💬 WHATSAPP {phone}</Text>
                  </TouchableOpacity>
                </>
              )}

              {email && (
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={() => {
                    Vibration.vibrate(50);
                    Linking.openURL(`mailto:${email}`);
                    setShowContactOptions(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.contactButtonText}>📧 EMAIL {email}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.contactButton, styles.cancelButton]}
                onPress={() => {
                  Vibration.vibrate(50);
                  setShowContactOptions(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.contactButtonText, styles.cancelButtonText]}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* Dashboard Button at Bottom */}
        <View style={styles.dashboardButtonContainer}>
          <TouchableOpacity 
            style={styles.dashboardButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.dashboardButtonText}>BACK TO BOOKINGS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#232323',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#fff',
  },
  detailSection: {
    marginVertical: 8,
  },
  detailLabel: {
    color: '#aaa',
    fontSize: 12,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1,
    marginBottom: 8,
  },
  detailValue: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    lineHeight: 24,
  },
  detailValueLong: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    lineHeight: 24,
    textAlign: 'left',
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 16,
  },
  imageNote: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    fontStyle: 'italic',
  },
  bookingImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#181818',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 40,
  },
  actionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1,
  },
  secondaryButton: {
    borderColor: '#666',
  },
  secondaryButtonText: {
    color: '#ccc',
  },
  deleteButton: {
    borderColor: '#f44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  deleteButtonText: {
    color: '#f44336',
  },
  disabledButton: {
    opacity: 0.6,
    borderColor: '#444',
  },
  dashboardButtonContainer: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 10,
  },
  dashboardButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 40,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dashboardButtonText: {
    color: '#181818',
    fontSize: 16,
    fontFamily: 'Wallpoet_400Regular',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  contactOptions: {
    gap: 10,
    marginBottom: 20,
    paddingTop: 10,
  },
  contactButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    letterSpacing: 0.5,
  },
  cancelButton: {
    borderColor: '#666',
    marginTop: 5,
  },
  cancelButtonText: {
    color: '#aaa',
  },
});

export default BookingDetailsScreen;
