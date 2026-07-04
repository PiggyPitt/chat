import client from './client'

export async function uploadImage(file: File): Promise<{ publicUrl: string; filename: string }> {
  const formData = new FormData()
  formData.append('image', file)
  const res = await client.post('/upload', formData)
  return res.data
}
