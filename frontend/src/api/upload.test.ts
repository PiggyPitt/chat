import { describe, it, expect, vi, beforeEach } from 'vitest'
import client from './client'
import { uploadImage } from './upload'

vi.mock('./client', () => ({
  default: { post: vi.fn() },
}))

describe('uploadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Regression test: an explicit `Content-Type: multipart/form-data` header (without a
  // boundary) stops the browser from appending one itself, which breaks multipart parsing
  // on the server and silently drops every image upload before a message is ever sent.
  // axios must be left to set Content-Type automatically for FormData bodies.
  it('posts FormData without a manual Content-Type header', async () => {
    const mockedPost = client.post as unknown as ReturnType<typeof vi.fn>
    mockedPost.mockResolvedValue({ data: { publicUrl: '/uploads/x.png', filename: 'x.png' } })

    const file = new File(['bytes'], 'photo.png', { type: 'image/png' })
    const result = await uploadImage(file)

    expect(mockedPost).toHaveBeenCalledTimes(1)
    const [url, body, config] = mockedPost.mock.calls[0]
    expect(url).toBe('/upload')
    expect(body).toBeInstanceOf(FormData)
    expect(config).toBeUndefined()
    expect(result).toEqual({ publicUrl: '/uploads/x.png', filename: 'x.png' })
  })

  it('appends the file under the "image" field name', async () => {
    const mockedPost = client.post as unknown as ReturnType<typeof vi.fn>
    mockedPost.mockResolvedValue({ data: { publicUrl: '/uploads/x.png', filename: 'x.png' } })

    const file = new File(['bytes'], 'photo.png', { type: 'image/png' })
    await uploadImage(file)

    const formData = mockedPost.mock.calls[0][1] as FormData
    expect(formData.get('image')).toBe(file)
  })
})
