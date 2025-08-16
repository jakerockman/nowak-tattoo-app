-- Fix missing UPDATE policy for messages table
-- This allows participants in a conversation to update message read status

-- Add UPDATE policy for messages
CREATE POLICY "Users can update messages in their conversations" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.user_id = auth.uid() OR conversations.artist_id = auth.uid())
    )
  );

-- Verify policies are correctly set
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY policyname;
