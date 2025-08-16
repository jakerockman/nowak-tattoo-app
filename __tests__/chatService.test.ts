import { chatService, supabase } from '../lib/supabase';

describe('chatService', () => {
  afterAll(() => {
    // Remove all Supabase channels to close open handles
    if (typeof supabase.removeAllChannels === 'function') {
      supabase.removeAllChannels();
    } else if (supabase.getChannels) {
      // Fallback: manually unsubscribe all channels
      const channels = supabase.getChannels ? supabase.getChannels() : [];
      channels.forEach((ch: any) => ch.unsubscribe && ch.unsubscribe());
    }
  });
  it('should create a placeholder conversation if artistId includes "placeholder"', async () => {
    const userId = 'user123';
    const artistId = 'artist-placeholder';
    const userDisplayName = 'Test User';
    const artistDisplayName = 'Test Artist';
    const conversation = await chatService.getOrCreateConversation(userId, artistId, userDisplayName, artistDisplayName);
    expect(conversation).not.toBeNull();
    if (conversation) {
      expect(conversation.id).toContain('placeholder');
      expect(conversation.user_id).toBe(userId);
      expect(conversation.artist_id).toBe(artistId);
    }
  });

  it('should return a fallback conversation if database insert fails', async () => {
    // Use invalid IDs to simulate failure
    const userId = '';
    const artistId = '';
    const userDisplayName = 'Test User';
    const artistDisplayName = 'Test Artist';
    const conversation = await chatService.getOrCreateConversation(userId, artistId, userDisplayName, artistDisplayName);
    expect(conversation).not.toBeNull();
    if (conversation) {
      expect(conversation.id).toContain('fallback');
    }
  });
});
