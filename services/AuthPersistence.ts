// AuthPersistence.ts - Handle persistent authentication and auto-login
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { notificationService } from './NotificationService';

interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  userType: 'user' | 'artist';
  lastLogin: string;
}

export class AuthPersistence {
  private static readonly USER_KEY = 'nowak_tattoo_user';
  private static readonly SESSION_KEY = 'nowak_tattoo_session';
  private static isInitializing = false;
  private static lastInitializedUserId: string | null = null;
  private static isLoggingOut = false; // Add logout flag

  // Initialize auth persistence when app starts
  static async initialize() {
    if (this.isInitializing) {
      console.log('🔐 Auth persistence already initializing, waiting...');
      return null;
    }

    if (this.isLoggingOut) {
      console.log('🔐 Logout in progress, skipping initialization');
      return null;
    }

    this.isInitializing = true;
    try {
      console.log('🔐 Initializing auth persistence...');
      
      // First, try to get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Error getting session:', sessionError);
      }
      
      if (session?.user) {
        // Validate session is still active
        const isValid = await this.validateSession(session);
        if (isValid) {
          // Check if we already initialized for this user
          if (this.lastInitializedUserId === session.user.id) {
            console.log('✅ Auth already initialized for this user');
            return this.getUserFromSession(session);
          }

          console.log('✅ Found valid active session, restoring user');
          await this.storeUserSession(session);
          const user = await this.initializeUserServices(session);
          this.lastInitializedUserId = session.user.id;
          return user;
        } else {
          console.log('⚠️ Session invalid, attempting refresh...');
          const refreshedUser = await this.attemptSessionRefresh();
          if (refreshedUser) return refreshedUser;
        }
      } else {
        console.log('ℹ️ No active session, checking stored session...');
        // Try to restore from stored session
        const restoredUser = await this.attemptSessionRestore();
        if (restoredUser) return restoredUser;
      }
      
      console.log('ℹ️ No valid session found - user needs to login');
      this.lastInitializedUserId = null;
      return null;
    } catch (error) {
      console.error('❌ Error initializing auth persistence:', error);
      // Try to restore from stored data as fallback
      try {
        const storedUser = await this.getStoredUser();
        if (storedUser && await this.shouldAutoLogin()) {
          console.log('🔄 Attempting fallback restore from stored user');
          return storedUser;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback restore also failed:', fallbackError);
      }
      return null;
    } finally {
      this.isInitializing = false;
    }
  }

  // Store user session data for persistence
  static async storeUserSession(session: any) {
    try {
      const user = session.user;
      const userType = user.user_metadata?.user_type || 'user';
      const displayName = user.user_metadata?.display_name || 
                         user.email?.split('@')[0] || 
                         user.email;

      const storedUser: StoredUser = {
        id: user.id,
        email: user.email || '',
        displayName,
        userType,
        lastLogin: new Date().toISOString()
      };

      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(storedUser));
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }));

      console.log('💾 User session stored successfully');
    } catch (error) {
      console.error('❌ Error storing user session:', error);
    }
  }

  // Get stored user data
  static async getStoredUser(): Promise<StoredUser | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Error getting stored user:', error);
      return null;
    }
  }

  // Initialize user-specific services (notifications, etc.)
  static async initializeUserServices(session: any) {
    try {
      const userType = session.user.user_metadata?.user_type || 'user';
      const displayName = session.user.user_metadata?.display_name || 
                         session.user.email?.split('@')[0] || 
                         session.user.email;

      const currentUser = {
        id: session.user.id,
        email: session.user.email || '',
        displayName,
        userType
      };

      // Initialize notification service (only if not already initialized for this user)
      await notificationService.initialize(currentUser);
      
      console.log('🔔 User services initialized for:', displayName);
      return currentUser;
    } catch (error) {
      console.error('❌ Error initializing user services:', error);
      throw error;
    }
  }

  // Convert session to user object
  static getUserFromSession(session: any) {
    const userType = session.user.user_metadata?.user_type || 'user';
    const displayName = session.user.user_metadata?.display_name || 
                       session.user.email?.split('@')[0] || 
                       session.user.email;

    return {
      id: session.user.id,
      email: session.user.email || '',
      displayName,
      userType
    };
  }

  // Clear stored authentication data
  static async clearStoredAuth() {
    try {
      await AsyncStorage.multiRemove([this.USER_KEY, this.SESSION_KEY]);
      console.log('🧹 Stored auth data cleared');
    } catch (error) {
      console.error('❌ Error clearing stored auth:', error);
    }
  }

  // Check if user should stay logged in
  static async shouldAutoLogin(): Promise<boolean> {
    try {
      const storedUser = await this.getStoredUser();
      if (!storedUser) {
        console.log('ℹ️ No stored user for auto-login check');
        return false;
      }

      // Check if last login was within 30 days (adjust as needed)
      const lastLogin = new Date(storedUser.lastLogin);
      const now = new Date();
      const daysSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLogin > 30) {
        console.log(`⏰ Last login was ${Math.floor(daysSinceLogin)} days ago, too old for auto-login`);
        return false;
      }

      console.log(`✅ Last login was ${Math.floor(daysSinceLogin)} days ago, auto-login allowed`);
      return true;
    } catch (error) {
      console.error('❌ Error checking auto-login:', error);
      return false;
    }
  }

  // Handle successful login
  static async handleSuccessfulLogin(session: any) {
    try {
      console.log('🔐 Handling successful login...');
      
      if (!session || !session.user) {
        throw new Error('Invalid session data provided');
      }

      await this.storeUserSession(session);
      const user = await this.initializeUserServices(session);
      this.lastInitializedUserId = session.user.id;
      
      console.log('✅ Login handled successfully for user:', user.displayName);
      return user;
    } catch (error) {
      console.error('❌ Error handling successful login:', error);
      throw error;
    }
  }

  // Handle logout
  static async handleLogout() {
    try {
      console.log('🔐 Starting logout process...');
      this.isLoggingOut = true;
      
      // Clean up services
      notificationService.logout();
      
      // Clear stored data
      await this.clearStoredAuth();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Reset state
      this.lastInitializedUserId = null;
      
      console.log('✅ Logout handled successfully');
      
      // Small delay before allowing re-initialization
      setTimeout(() => {
        this.isLoggingOut = false;
        console.log('🔐 Logout process completed, re-initialization allowed');
      }, 1000);
    } catch (error) {
      console.error('❌ Error handling logout:', error);
      this.isLoggingOut = false;
      throw error;
    }
  }

  // Validate if a session is still active and not expired
  static async validateSession(session: any): Promise<boolean> {
    try {
      if (!session || !session.access_token) {
        console.log('❌ Session missing or no access token');
        return false;
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at <= now) {
        console.log('⏰ Session token expired');
        return false;
      }

      // Try to make an authenticated request to validate the session
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.log('❌ Session validation failed:', error?.message);
        return false;
      }

      console.log('✅ Session is valid for user:', user.user.email);
      return true;
    } catch (error) {
      console.error('❌ Error validating session:', error);
      return false;
    }
  }

  // Attempt to refresh the current session
  static async attemptSessionRefresh(): Promise<any> {
    try {
      console.log('🔄 Attempting to refresh session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.log('❌ Session refresh failed:', error?.message);
        return null;
      }

      console.log('✅ Session refreshed successfully');
      await this.storeUserSession(data.session);
      const user = await this.initializeUserServices(data.session);
      this.lastInitializedUserId = data.session.user.id;
      return user;
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
      return null;
    }
  }

  // Attempt to restore session from stored data
  static async attemptSessionRestore(): Promise<any> {
    try {
      console.log('🔄 Attempting to restore session from storage...');
      
      const storedSessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      if (!storedSessionData) {
        console.log('ℹ️ No stored session data found');
        return null;
      }

      const sessionData = JSON.parse(storedSessionData);
      const storedUser = await this.getStoredUser();
      
      if (!storedUser || !await this.shouldAutoLogin()) {
        console.log('ℹ️ Stored session expired or auto-login not allowed');
        await this.clearStoredAuth();
        return null;
      }

      // Try to restore the session with stored refresh token
      if (sessionData.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token
        });

        if (error || !data.session) {
          console.log('❌ Failed to restore session:', error?.message);
          await this.clearStoredAuth();
          return null;
        }

        console.log('✅ Session restored from storage');
        await this.storeUserSession(data.session);
        const user = await this.initializeUserServices(data.session);
        this.lastInitializedUserId = data.session.user.id;
        return user;
      }

      console.log('ℹ️ No refresh token available for session restore');
      return null;
    } catch (error) {
      console.error('❌ Error restoring session from storage:', error);
      // Clear potentially corrupted data
      await this.clearStoredAuth();
      return null;
    }
  }
}
