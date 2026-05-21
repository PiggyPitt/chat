import { useEffect } from 'react'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'
import ChatArea from '@/components/chat/ChatArea'
import CreateRoomModal from '@/components/rooms/CreateRoomModal'
import PasswordModal from '@/components/ui/PasswordModal'
import AdminPanel from '@/components/admin/AdminPanel'
import ToastContainer from '@/components/ui/Toast'
import { useUIStore } from '@/store/useUIStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export default function AppShell() {
  const sidebarOpen      = useUIStore((s) => s.sidebarOpen)
  const rightSidebarOpen = useUIStore((s) => s.rightSidebarOpen)
  const setSidebarOpen      = useUIStore((s) => s.setSidebarOpen)
  const setRightSidebarOpen = useUIStore((s) => s.setRightSidebarOpen)

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isTablet  = useMediaQuery('(min-width: 768px)')

  // keep defaults in sync when viewport crosses breakpoints
  useEffect(() => { setSidebarOpen(isDesktop) },      [isDesktop, setSidebarOpen])
  useEffect(() => { setRightSidebarOpen(isTablet) },  [isTablet,  setRightSidebarOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-dc-bg">

      {/* ━━━ LEFT SIDEBAR ━━━
          Desktop (≥1024px): lives in flex flow, width animates 256→0
          Mobile/tablet:     fixed overlay drawer from left              */}
      {isDesktop ? (
        <div
          className="shrink-0 h-full overflow-hidden transition-all duration-200 ease-in-out"
          style={{ width: sidebarOpen ? 256 : 0 }}
        >
          <div className="w-64 h-full">
            <LeftSidebar />
          </div>
        </div>
      ) : (
        <>
          {/* backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-20 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {/* drawer */}
          <div
            className="fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-200 ease-in-out"
            style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
          >
            <LeftSidebar />
          </div>
        </>
      )}

      {/* ━━━ MAIN CONTENT ━━━ */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <ChatArea />
      </div>

      {/* ━━━ RIGHT SIDEBAR ━━━
          Tablet+ (≥768px): lives in flex flow, width animates 208→0
          Mobile:           fixed overlay drawer from right             */}
      {isTablet ? (
        <div
          className="shrink-0 h-full overflow-hidden transition-all duration-200 ease-in-out"
          style={{ width: rightSidebarOpen ? 208 : 0 }}
        >
          <div className="w-52 h-full">
            <RightSidebar />
          </div>
        </div>
      ) : (
        <>
          {rightSidebarOpen && (
            <div
              className="fixed inset-0 z-20 bg-black/50"
              onClick={() => setRightSidebarOpen(false)}
            />
          )}
          <div
            className="fixed inset-y-0 right-0 z-30 w-52 transition-transform duration-200 ease-in-out"
            style={{ transform: rightSidebarOpen ? 'translateX(0)' : 'translateX(100%)' }}
          >
            <RightSidebar />
          </div>
        </>
      )}

      <CreateRoomModal />
      <PasswordModal />
      <AdminPanel />
      <ToastContainer />
    </div>
  )
}

