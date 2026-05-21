import { useRoomStore } from '@/store/useRoomStore'
import { useChatStore } from '@/store/useChatStore'
import { groupMessages } from '@/utils/groupMessages'
import { useScrollToBottom } from '@/hooks/useScrollToBottom'
import MessageItem from './MessageItem'
import LoadMoreButton from './LoadMoreButton'

export default function MessageList() {
  const activeRoomId = useRoomStore((s) => s.activeRoomId)
  const messages = useChatStore((s) => (activeRoomId ? s.messages[activeRoomId] ?? [] : []))
  const scrollRef = useScrollToBottom<HTMLDivElement>([messages.length, activeRoomId])
  const groups = groupMessages(messages)

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col">
      <LoadMoreButton />
      {activeRoomId ? (
        groups.length > 0 ? (
          <div className="flex flex-col pb-2">
            {groups.map((group, i) => (
              <MessageItem key={`${group.senderId}-${i}`} group={group} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-dc-muted text-sm">No messages yet. Say hello!</p>
          </div>
        )
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-dc-muted text-sm">Select a channel to start chatting</p>
        </div>
      )}
    </div>
  )
}
