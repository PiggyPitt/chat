import client from './client'

export async function uploadImage(file: File): Promise<{ publicUrl: string; filename: string }> {
  const formData = new FormData()
  formData.append('image', file)
  const res = await client.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
