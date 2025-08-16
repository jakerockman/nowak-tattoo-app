# Chat System Setup Instructions

## Database Setup

1. **Run the SQL setup script in your Supabase SQL editor:**
   - Open your Supabase dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `database/chat-setup.sql`
   - Run the script to create tables, policies, and triggers

2. **Enable Realtime (if not already enabled):**
   - Go to Database → Replication in your Supabase dashboard
   - Make sure the `messages` and `conversations` tables are enabled for realtime

## How the Chat System Works

### For Users:
1. **Login**: Users must log in through the User Login screen
2. **Start Chat**: Tap "Start New Chat" to see available artists
3. **Select Artist**: Choose an artist to start a conversation
4. **Send Messages**: Type and send messages in real-time
5. **View Conversations**: All conversations appear on the main chat screen

### For Artists:
1. **Login**: Artists must log in through the Artist Login screen
2. **Receive Messages**: Conversations appear automatically when users message them
3. **Reply**: Tap on any conversation to view and reply to messages
4. **Real-time Updates**: Messages appear instantly without refreshing

## Features

### ✅ Real-time Messaging
- Messages appear instantly for both parties
- Uses Supabase Realtime subscriptions

### ✅ User Authentication
- Separate login flows for users and artists
- Secure authentication with Supabase Auth
- User type metadata to differentiate users and artists

### ✅ Conversation Management
- Automatic conversation creation
- Conversation list with timestamps
- Message history persistence

### ✅ Security
- Row Level Security (RLS) policies
- Users can only see their own conversations
- Secure message sending and receiving

### ✅ UI/UX
- Clean, modern chat interface
- Message bubbles (own messages on right, others on left)
- Timestamps for all messages
- Pull-to-refresh for conversations
- Keyboard handling for better mobile experience

## Database Schema

### Conversations Table
- `id`: Unique conversation identifier
- `user_id`: Reference to the user
- `artist_id`: Reference to the artist
- `user_display_name`: Display name of the user
- `artist_display_name`: Display name of the artist
- `created_at`, `updated_at`: Timestamps

### Messages Table
- `id`: Unique message identifier
- `conversation_id`: Reference to conversation
- `sender_id`: Who sent the message
- `content`: Message text content
- `sender_type`: 'user' or 'artist'
- `is_read`: Read status
- `created_at`: When message was sent

## Security Features

1. **Row Level Security**: Users can only access their own conversations and messages
2. **Authentication Required**: All chat features require valid login
3. **Input Validation**: Message content is validated before sending
4. **User Type Verification**: System verifies user permissions for actions

## Troubleshooting

### Chat not loading:
- Check if user is logged in
- Verify database tables exist
- Ensure RLS policies are active

### Messages not appearing:
- Check Supabase Realtime settings
- Verify internet connection
- Try refreshing the conversation list

### Can't start new chat:
- Ensure there are artists in the system
- Check user authentication status
- Verify artist accounts have user_type: 'artist'

## Next Steps for Enhancement

1. **Push Notifications**: Add push notifications for new messages
2. **Image Sharing**: Allow users to share images in chat
3. **Read Receipts**: Show when messages have been read
4. **Typing Indicators**: Show when someone is typing
5. **Message Search**: Add ability to search through message history
6. **File Attachments**: Support for file sharing
7. **Message Reactions**: Add emoji reactions to messages
8. **Chat Moderation**: Admin tools for managing conversations
