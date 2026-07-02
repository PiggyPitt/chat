import type { MessageGroup } from '@/utils/groupMessages'
import { formatDate } from '@/utils/formatDate'
import ImagePreview from './ImagePreview'

interface Props {
  group: MessageGroup
}

const EMOJI_ONLY_RE = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u

function isEmojiOnly(text: string): boolean {
  return text.trim().length > 0 && EMOJI_ONLY_RE.test(text.trim())
}

export default function MessageItem({ group }: Props) {
  const initial = group.senderUsername[0]?.toUpperCase() ?? '?'
  const firstMsg = group.messages[0]

  return (
    <div className="flex gap-3 px-4 py-1 hover:bg-white/[0.02] group">
      <div className="w-10 h-10 rounded-full bg-dc-input flex items-center justify-center text-dc-muted font-medium shrink-0 mt-0.5">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-semibold text-dc-text">{group.senderUsername}</span>
          <span className="text-xs text-dc-muted">{formatDate(firstMsg.createdAt)}</span>
        </div>
        {group.messages.map((msg) =>
          msg.type === 'image' ? (
            <ImagePreview key={msg.id} url={msg.content} />
          ) : (
            <p
              key={msg.id}
              className={
                isEmojiOnly(msg.content)
                  ? 'text-4xl leading-snug'
                  : 'text-sm text-dc-text break-words leading-relaxed'
              }
            >
              {msg.content}
            </p>
          )
        )}
      </div>
    </div>
  )
}
