import { AnsiHyperlink } from '../../shared/terminal/AnsiHyperlink.js';

// Uploaded images are stored as origin-relative paths (e.g. `/uploads/xxx.png`) so the
// web client stays same-origin under CSP regardless of which public domain served it.
// The CLI has no page origin of its own, so it resolves against the server it's connected
// to. GIF picker messages are already absolute (Giphy CDN URLs) and pass through unchanged.
export function resolveImageUrl(serverUrl: string, content: string): string {
  return /^https?:\/\//i.test(content) ? content : `${serverUrl}${content}`;
}

export function renderMessageContent(serverUrl: string, type: string | undefined, content: string): string {
  if (type === 'image') {
    const url = resolveImageUrl(serverUrl, content);
    return `${AnsiHyperlink.imageLink(url)}  ${AnsiHyperlink.downloadLink(url)}`;
  }
  return AnsiHyperlink.autoLink(content);
}
