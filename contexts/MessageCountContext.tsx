import React, { createContext, useContext, useState, useRef } from 'react';

interface MessageCountContextType {
  triggerMessageCountRefresh: () => void;
  onMessageCountRefresh: (callback: () => void) => void;
  offMessageCountRefresh: (callback: () => void) => void;
}

const MessageCountContext = createContext<MessageCountContextType | undefined>(undefined);

export const MessageCountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const callbacksRef = useRef<Set<() => void>>(new Set());

  const triggerMessageCountRefresh = () => {
    console.log('🔔 MessageCountContext: Triggering message count refresh for all listeners');
    callbacksRef.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('❌ Error in message count refresh callback:', error);
      }
    });
  };

  const onMessageCountRefresh = (callback: () => void) => {
    console.log('📋 MessageCountContext: Adding message count refresh listener');
    callbacksRef.current.add(callback);
  };

  const offMessageCountRefresh = (callback: () => void) => {
    console.log('📋 MessageCountContext: Removing message count refresh listener');
    callbacksRef.current.delete(callback);
  };

  return (
    <MessageCountContext.Provider value={{
      triggerMessageCountRefresh,
      onMessageCountRefresh,
      offMessageCountRefresh
    }}>
      {children}
    </MessageCountContext.Provider>
  );
};

export const useMessageCount = () => {
  const context = useContext(MessageCountContext);
  if (!context) {
    throw new Error('useMessageCount must be used within a MessageCountProvider');
  }
  return context;
};
