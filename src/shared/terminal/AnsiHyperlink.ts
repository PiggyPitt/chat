import { UrlValidator } from './UrlValidator.js';

// OSC 8 hyperlink — supported by Windows Terminal, WezTerm, iTerm2
const OSC = '\x1b]';
const ST = '\x1b\\';

export class AnsiHyperlink {
  static render(url: string, label: string): string {
    const { valid, reason } = UrlValidator.validate(url);
    if (!valid) return `${label} [blocked: ${reason}]`;

    if (AnsiHyperlink.hyperlinksDisabled()) {
      return `${label} (${url})`;
    }

    return `${OSC}8;;${url}${ST}${label}${OSC}8;;${ST}`;
  }

  static imageLink(url: string): string {
    return AnsiHyperlink.render(url, '[OpenImage]');
  }

  static downloadLink(url: string): string {
    return AnsiHyperlink.render(url, '[Download]');
  }

  // wrap any http/https URLs in plain text as clickable links
  static autoLink(text: string): string {
    return text.replace(/https?:\/\/[^\s<>"]+/g, (url) => AnsiHyperlink.render(url, url));
  }

  // opt-out via env var for terminals that don't support OSC 8
  private static hyperlinksDisabled(): boolean {
    return process.env['CHAT_NO_HYPERLINKS'] === '1';
  }
}
