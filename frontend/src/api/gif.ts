import client from './client'
import type { GifResult } from '@/types'

export async function searchGifs(query: string): Promise<GifResult[]> {
  const res = await client.get('/gif/search', { params: { q: query } })
  return (res.data as { results: GifResult[] }).results
}

export async function trendingGifs(): Promise<GifResult[]> {
  const res = await client.get('/gif/trending')
  return (res.data as { results: GifResult[] }).results
}
