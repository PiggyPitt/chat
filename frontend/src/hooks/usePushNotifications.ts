import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { getVapidPublicKey, subscribePush } from '@/api/push'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export function usePushNotifications() {
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!token) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    async function setup() {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) return // already subscribed on this device

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const publicKey = await getVapidPublicKey()
      if (!publicKey) return

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      await subscribePush(sub.toJSON())
    }

    setup().catch(() => {}) // push is non-critical — never surface errors to user
  }, [token])
}
