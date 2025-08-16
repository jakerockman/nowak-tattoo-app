# Real-Time Messaging Debugging Guide

## Current Issues
Messages are not appearing in real-time despite successful subscription setup.

## Potential Root Causes

### 1. Supabase Realtime Configuration
- **Issue**: Realtime might not be enabled for the `messages` table in Supabase
- **Check**: Go to Supabase Dashboard → Database → Replication → Enable realtime for `messages` table
- **Status**: NEEDS VERIFICATION

### 2. RLS (Row Level Security) Policies
- **Issue**: RLS policies might be blocking realtime events
- **Check**: Ensure realtime policies allow SELECT for authenticated users
- **Status**: NEEDS VERIFICATION

### 3. Subscription Filter Issues
- **Issue**: The conversation filter might not be working correctly
- **Fix Applied**: Added specific filter `conversation_id=eq.${conversationId}`
- **Status**: TESTING

### 4. Message Callback Problems
- **Issue**: The callback function might not be handling messages correctly
- **Fix Applied**: Enhanced validation and logging in message callback
- **Status**: TESTING

## Debug Steps Applied

### Enhanced Logging
```typescript
// Added detailed subscription status logging
.subscribe((status) => {
  console.log(`📡 Subscription status for ${conversationId}:`, status);
});

// Added raw payload logging
console.log('📨 Raw realtime payload received:', payload);
```

### Message Validation
```typescript
if (newMessage && newMessage.conversation_id === conversationId) {
  console.log('📱 New message received in ChatScreen:', newMessage.content);
  callback(newMessage);
} else {
  console.log('⚠️ Message not for this conversation or invalid:', newMessage);
}
```

### Database Error Logging
```typescript
console.error('❌ Error sending message to database:', error.message, error.details);
```

## Testing Strategy

1. **Check Subscription Status**: Look for "📡 Subscription status" logs
2. **Verify Message Creation**: Look for "✅ Database message created successfully" logs  
3. **Monitor Realtime Payloads**: Look for "📨 Raw realtime payload received" logs
4. **Test Message Flow**: Send a message and verify each step

## Next Steps if Still Failing

1. **Verify Supabase Realtime Settings**
   - Enable realtime for messages table
   - Check RLS policies
   - Verify API keys have realtime permissions

2. **Test Direct Database Subscription**
   - Create a simple test subscription to all message events
   - Verify basic realtime functionality

3. **Alternative Approaches**
   - Implement polling as fallback
   - Use Supabase functions for message notifications
   - Consider WebSocket alternative

## Expected Logs for Working System

```
🧪 Realtime test channel created: [channel object]
Setting up realtime for conversation: c6fc7b92-0e21-4914-a1b9-7e2b1669170f
📡 Subscription status for c6fc7b92-0e21-4914-a1b9-7e2b1669170f: SUBSCRIBED
✅ Message subscription created successfully
✅ Database message created successfully: [message-id]
📨 Raw realtime payload received: [payload object]
📱 New message received in ChatScreen: [message content]
📱 Added new message. Total messages: [count]
```
