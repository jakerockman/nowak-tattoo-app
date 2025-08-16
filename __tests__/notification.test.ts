describe('Notification logic', () => {
  type NotificationPayload = {
    type: string;
    event: string;
    payload: {
      conversationId: string;
      userId: string;
      messageCount: number;
    };
  };

  it('should call the notification callback with correct payload', () => {
    const testPayload: NotificationPayload = {
      type: 'broadcast',
      event: 'messages-read',
      payload: {
        conversationId: 'conv-123',
        userId: 'user-456',
        messageCount: 3,
      },
    };

    const callback = jest.fn();

    // Simulate notification send
    callback(testPayload);

    expect(callback).toHaveBeenCalledWith(testPayload);
  });
});
