import { resolveImageUrl, renderMessageContent } from '../../src/presentation/cli/message-render.js';

describe('resolveImageUrl', () => {
  it('returns absolute http(s) URLs unchanged (GIF picker content)', () => {
    expect(resolveImageUrl('https://cli.example', 'https://media.giphy.com/x.gif')).toBe(
      'https://media.giphy.com/x.gif'
    );
    expect(resolveImageUrl('https://cli.example', 'http://media.giphy.com/x.gif')).toBe(
      'http://media.giphy.com/x.gif'
    );
  });

  it('prefixes the server URL onto origin-relative upload paths', () => {
    expect(resolveImageUrl('https://chat.example', '/uploads/pic.png')).toBe(
      'https://chat.example/uploads/pic.png'
    );
  });
});

describe('renderMessageContent', () => {
  const ORIGINAL_ENV = process.env['CHAT_NO_HYPERLINKS'];

  beforeAll(() => {
    // Deterministic plain-text output ("label (url)") instead of OSC 8 escape sequences.
    process.env['CHAT_NO_HYPERLINKS'] = '1';
  });

  afterAll(() => {
    if (ORIGINAL_ENV === undefined) delete process.env['CHAT_NO_HYPERLINKS'];
    else process.env['CHAT_NO_HYPERLINKS'] = ORIGINAL_ENV;
  });

  it('resolves relative upload paths against the server URL before linking', () => {
    const rendered = renderMessageContent('https://chat.example', 'image', '/uploads/pic.png');
    expect(rendered).toContain('https://chat.example/uploads/pic.png');
    expect(rendered).toContain('[OpenImage]');
    expect(rendered).toContain('[Download]');
  });

  it('leaves absolute GIF URLs untouched with no double-prefixing', () => {
    const rendered = renderMessageContent('https://chat.example', 'image', 'https://media.giphy.com/x.gif');
    expect(rendered).toContain('https://media.giphy.com/x.gif');
    expect(rendered).not.toContain('https://chat.examplehttps://');
  });

  it('renders non-image messages via autoLink, untouched by image resolution', () => {
    const rendered = renderMessageContent('https://chat.example', 'text', 'hello world');
    expect(rendered).toBe('hello world');
  });
});
