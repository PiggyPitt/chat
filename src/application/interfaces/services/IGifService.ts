export interface GifResult {
  id: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

export interface IGifService {
  search(query: string, limit?: number): Promise<GifResult[]>;
  trending(limit?: number): Promise<GifResult[]>;
}
