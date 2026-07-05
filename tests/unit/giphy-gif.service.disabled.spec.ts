import { GiphyGifService } from '../../src/infrastructure/services/GiphyGifService.js';
import { HttpError } from '../../src/shared/errors/HttpError.js';

jest.mock('../../src/shared/config/index.js', () => ({
  config: { giphyApiKey: '' }
}));

describe('GiphyGifService (not configured)', () => {
  it('throws a 503 HttpError instead of calling the Giphy API', async () => {
    const service = new GiphyGifService();
    await expect(service.search('cats')).rejects.toThrow(HttpError);
    await expect(service.trending()).rejects.toThrow(HttpError);
  });
});
