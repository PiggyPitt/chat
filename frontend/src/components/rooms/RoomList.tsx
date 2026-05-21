import { useRoomStore } from '@/store/useRoomStore'
import RoomItem from './RoomItem'

export default function RoomList() {
  const rooms = useRoomStore((s) => s.rooms)

  if (rooms.length === 0) {
    return <p className="text-dc-muted text-xs px-2 py-2">No rooms yet</p>
  }

  return (
    <div className="flex flex-col gap-0.5">
      {rooms.map((room) => (
        <RoomItem key={room.id} room={room} />
      ))}
    </div>
  )
}
