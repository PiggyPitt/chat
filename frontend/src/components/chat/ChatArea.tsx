import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

export default function ChatArea() {
  return (
    <div className="flex flex-col h-full bg-dc-bg overflow-hidden">
      <ChatHeader />
      <MessageList />
      <MessageInput />
    </div>
  )
}
