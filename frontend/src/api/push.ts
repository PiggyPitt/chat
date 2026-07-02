import client from './client'

export async function getVapidPublicKey(): Promise<string> {
  const res = await client.get('/push/vapid-key')
  return (res.data as { publicKey: string }).publicKey
}

export async function subscribePush(subscription: PushSubscriptionJSON): Promise<void> {
  await client.post('/push/subscribe', {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  })
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await client.delete('/push/subscribe', { data: { endpoint } })
}

export async function toggleMuteRoom(roomId: string): Promise<{ muted: boolean }> {
  const res = await client.patch(`/push/mute/${encodeURIComponent(roomId)}`)
  return res.data as { muted: boolean }
}
