import type { Message } from '@/types'

export interface MessageGroup {
  senderId: string
  senderUsername: string
  messages: Message[]
}

const GROUP_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

export function groupMessages(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  for (const msg of messages) {
    const last = groups[groups.length - 1]
    const lastMsg = last?.messages[last.messages.length - 1]
    const withinWindow = lastMsg
      ? new Date(msg.createdAt).getTime() - new Date(lastMsg.createdAt).getTime() < GROUP_THRESHOLD_MS
      : false
    if (last && last.senderId === msg.senderId && withinWindow) {
      last.messages.push(msg)
    } else {
      groups.push({ senderId: msg.senderId, senderUsername: msg.senderUsername, messages: [msg] })
    }
  }
  return groups
}
