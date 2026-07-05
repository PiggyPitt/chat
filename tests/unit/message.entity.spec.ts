import { Message } from '../../src/domain/entities/Message.js';

describe('Message entity', () => {
  it('defaults type to "text" and createdAt to now when omitted', () => {
    const before = Date.now();
    const message = new Message({ id: 'm1', roomId: 'r1', senderId: 'u1', senderUsername: 'mike', content: 'hi' });
    const after = Date.now();

    expect(message.type).toBe('text');
    expect(message.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(message.createdAt.getTime()).toBeLessThanOrEqual(after);
  });

  it('keeps explicit type and createdAt when provided', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const message = new Message({
      id: 'm2',
      roomId: 'r1',
      senderId: 'u1',
      senderUsername: 'mike',
      content: '/uploads/pic.png',
      type: 'image',
      createdAt
    });

    expect(message.type).toBe('image');
    expect(message.createdAt).toBe(createdAt);
  });
});
