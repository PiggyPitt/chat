import { GiphyGifService } from '../../src/infrastructure/services/GiphyGifService.js';
import { HttpError } from '../../src/shared/errors/HttpError.js';

jest.mock('../../src/shared/config/index.js', () => ({
  config: { giphyApiKey: 'test-key' }
}));

describe('GiphyGifService (configured)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('searches gifs and maps the Giphy response shape', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 'g1',
            images: {
              original: { url: 'https://media.giphy.com/g1.gif', width: '200', height: '100' },
              fixed_width: { url: 'https://media.giphy.com/g1-small.gif', width: '150', height: '75' }
            }
          }
        ]
      })
    }) as unknown as typeof fetch;

    const service = new GiphyGifService();
    const results = await service.search('cats');

    expect(results).toEqual([
      {
        id: 'g1',
        url: 'https://media.giphy.com/g1.gif',
        previewUrl: 'https://media.giphy.com/g1-small.gif',
        width: 200,
        height: 100
      }
    ]);
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get('q')).toBe('cats');
    expect(calledUrl.searchParams.get('rating')).toBe('pg-13');
  });

  it('fetches trending gifs from the /trending path', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }) as unknown as typeof fetch;

    const service = new GiphyGifService();
    await service.trending();

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(calledUrl.pathname).toContain('/trending');
  });

  it('throws a 502 HttpError when the upstream request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    const service = new GiphyGifService();
    await expect(service.search('cats')).rejects.toThrow(HttpError);
  });
});
