import { UrlValidator } from '../../src/shared/terminal/UrlValidator.js';
import { AnsiHyperlink } from '../../src/shared/terminal/AnsiHyperlink.js';

describe('UrlValidator', () => {
  it('accepts well-formed http(s) URLs', () => {
    expect(UrlValidator.validate('https://example.com')).toEqual({ valid: true });
  });

  it('rejects URLs containing control characters', () => {
    expect(UrlValidator.validate('https://example.com/\r\nSet-Cookie:evil')).toEqual({
      valid: false,
      reason: 'URL contains invalid characters'
    });
  });

  it('rejects a malformed URL', () => {
    expect(UrlValidator.validate('not a url')).toEqual({ valid: false, reason: 'Malformed URL' });
  });

  it('rejects a blocked protocol', () => {
    expect(UrlValidator.validate('file:///etc/passwd')).toEqual({
      valid: false,
      reason: 'Protocol "file:" is blocked'
    });
  });
});

describe('AnsiHyperlink', () => {
  const ORIGINAL_ENV = process.env['CHAT_NO_HYPERLINKS'];

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete process.env['CHAT_NO_HYPERLINKS'];
    else process.env['CHAT_NO_HYPERLINKS'] = ORIGINAL_ENV;
  });

  it('shows a [blocked] label for an invalid URL', () => {
    expect(AnsiHyperlink.imageLink('not a url')).toBe('[OpenImage] [blocked: Malformed URL]');
  });

  it('falls back to plain "(url)" text when hyperlinks are disabled', () => {
    process.env['CHAT_NO_HYPERLINKS'] = '1';
    expect(AnsiHyperlink.downloadLink('https://example.com/a.png')).toBe('[Download] (https://example.com/a.png)');
  });

  it('renders an OSC 8 escape sequence when hyperlinks are enabled', () => {
    delete process.env['CHAT_NO_HYPERLINKS'];
    const rendered = AnsiHyperlink.imageLink('https://example.com/a.png');
    expect(rendered).toContain('\x1b]8;;https://example.com/a.png\x1b\\');
    expect(rendered).toContain('[OpenImage]');
  });

  it('wraps bare http(s) URLs found inside plain text', () => {
    delete process.env['CHAT_NO_HYPERLINKS'];
    const rendered = AnsiHyperlink.autoLink('check https://example.com out');
    expect(rendered).toContain('check ');
    expect(rendered).toContain('\x1b]8;;https://example.com\x1b\\');
  });

  it('leaves text with no URLs untouched', () => {
    expect(AnsiHyperlink.autoLink('just plain text')).toBe('just plain text');
  });
});
