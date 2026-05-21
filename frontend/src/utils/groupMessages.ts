import type { Message } from '@/types'

export interface MessageGroup {
  senderId: string
  senderUsername: string
  messages: Message[]
}

export function groupMessages(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  for (const msg of messages) {
    const last = groups[groups.length - 1]
    if (last && last.senderId === msg.senderId) {
      last.messages.push(msg)
    } else {
      groups.push({ senderId: msg.senderId, senderUsername: msg.senderUsername, messages: [msg] })
    }
  }
  return groups
}
