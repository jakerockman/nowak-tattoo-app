describe('Supabase real-time event handling', () => {
  type TestMessage = {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
    sender_type: 'user' | 'artist';
  };

  it('should call the callback when a new message event is simulated', () => {
    const testMessage: TestMessage = {
      id: 'msg-test-1',
      conversation_id: 'conv-test-1',
      sender_id: 'user-test',
      content: 'Hello, test!',
      created_at: new Date().toISOString(),
      is_read: false,
      sender_type: 'user',
    };

    type MockChannel = {
      on: (eventType: string, filter: object, handler: (payload: { new: TestMessage }) => void) => MockChannel;
      unsubscribe: () => void;
    };

    const mockChannel: MockChannel = {
      on: jest.fn((eventType: string, filter: object, handler: (payload: { new: TestMessage }) => void) => {
        handler({ new: testMessage });
        return mockChannel;
      }),
      unsubscribe: jest.fn(),
    };

    const callback = jest.fn();

    // Simulate subscription and event
    mockChannel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'conversation_id=eq.conv-test-1' }, (payload: { new: TestMessage }) => {
      callback(payload.new);
    });

    expect(callback).toHaveBeenCalledWith(testMessage);
    mockChannel.unsubscribe();
    expect(mockChannel.unsubscribe).toHaveBeenCalled();
  });
});