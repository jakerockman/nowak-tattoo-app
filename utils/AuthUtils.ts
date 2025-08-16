// utils/AuthUtils.ts
import { supabase } from '../lib/supabase';
import { AuthPersistence } from '../services/AuthPersistence';
import { Alert } from 'react-native';

export class AuthUtils {
  // Sign out user and clean up
  static async signOut(navigation?: any) {
    try {
      // Show confirmation dialog
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🔐 AuthUtils: Starting logout process...');
                
                // Use the new auth persistence system
                await AuthPersistence.handleLogout();
                
                console.log('🔐 AuthUtils: Logout completed, navigating...');
                
                // Navigate to home or login screen
                if (navigation) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  });
                }
                
                console.log('✅ User signed out successfully');
              } catch (error) {
                console.error('Error during sign out:', error);
                Alert.alert('Error', 'An unexpected error occurred during sign out.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error showing sign out dialog:', error);
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      // Check both active session and stored user
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) return true;
      
      // Check stored user as fallback
      const storedUser = await AuthPersistence.getStoredUser();
      return !!storedUser;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Get current user info
  static async getCurrentUser() {
    try {
      // Try to get from active session first
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return AuthPersistence.getUserFromSession(session);
      }
      
      // Fallback to stored user
      return await AuthPersistence.getStoredUser();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}
