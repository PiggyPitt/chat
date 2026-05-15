export type MessageType = 'text' | 'image';

export class Message {
  public readonly id: string;
  public readonly roomId: string;
  public readonly senderId: string;
  public readonly senderUsername: string;
  public readonly type: MessageType;
  public readonly content: string;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    roomId: string;
    senderId: string;
    senderUsername: string;
    type?: MessageType;
    content: string;
    createdAt?: Date;
  }) {
    this.id = params.id;
    this.roomId = params.roomId;
    this.senderId = params.senderId;
    this.senderUsername = params.senderUsername;
    this.type = params.type ?? 'text';
    this.content = params.content;
    this.createdAt = params.createdAt ?? new Date();
  }
}
