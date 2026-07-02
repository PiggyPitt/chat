self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'New message', {
      body: data.body ?? '',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: data.roomId,       // one notification per room (replaces previous)
      renotify: true,
      data: { roomId: data.roomId },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.focus) return client.focus()
      }
      return clients.openWindow('/')
    })
  )
})
