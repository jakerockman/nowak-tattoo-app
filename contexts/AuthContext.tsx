import React, { createContext, useContext, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  userType: 'user' | 'artist';
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  artistSession: Session | null;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  currentUser: CurrentUser | null;
  artistSession: Session | null;
  isInitializing: boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  currentUser,
  artistSession,
  isInitializing,
}) => {
  return (
    <AuthContext.Provider value={{ currentUser, artistSession, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
