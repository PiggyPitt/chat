import { GifResult, IGifService } from '../../application/interfaces/services/IGifService.js';
import { HttpError } from '../../shared/errors/HttpError.js';
import { config } from '../../shared/config/index.js';

const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

interface GiphyImage {
  url: string;
  width: string;
  height: string;
}

interface GiphyGif {
  id: string;
  images: {
    original: GiphyImage;
    fixed_width: GiphyImage;
  };
}

export class GiphyGifService implements IGifService {
  private readonly enabled: boolean;

  constructor() {
    this.enabled = !!config.giphyApiKey;
  }

  async search(query: string, limit = 24): Promise<GifResult[]> {
    return this.fetchGifs('/search', { q: query, limit: String(limit) });
  }

  async trending(limit = 24): Promise<GifResult[]> {
    return this.fetchGifs('/trending', { limit: String(limit) });
  }

  private async fetchGifs(path: string, params: Record<string, string>): Promise<GifResult[]> {
    if (!this.enabled) {
      throw new HttpError('GIF search is not configured', 503);
    }

    const url = new URL(`${GIPHY_BASE_URL}${path}`);
    url.searchParams.set('api_key', config.giphyApiKey);
    url.searchParams.set('rating', 'pg-13');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new HttpError('Failed to fetch GIFs', 502);
    }

    const body = (await response.json()) as { data: GiphyGif[] };
    return body.data.map((gif) => ({
      id: gif.id,
      url: gif.images.original.url,
      previewUrl: gif.images.fixed_width.url,
      width: Number(gif.images.original.width),
      height: Number(gif.images.original.height),
    }));
  }
}
