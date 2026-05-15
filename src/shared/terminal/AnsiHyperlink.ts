import { UrlValidator } from './UrlValidator.js';

// OSC 8 hyperlink — supported by Windows Terminal, WezTerm, iTerm2
const OSC = '\x1b]';
const ST = '\x1b\\';

export class AnsiHyperlink {
  static render(url: string, label: string): string {
    const { valid, reason } = UrlValidator.validate(url);
    if (!valid) return `${label} [blocked: ${reason}]`;
    if (AnsiHyperlink.supportsOsc8()) {
      return `${OSC}8;;${url}${ST}${label}${OSC}8;;${ST}`;
    }
    // fallback: show label + URL for terminals without OSC 8
    return `${label} (${url})`;
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

  private static supportsOsc8(): boolean {
    return (
      process.env['WT_SESSION'] !== undefined ||
      process.env['TERM_PROGRAM'] === 'WezTerm' ||
      process.env['TERM_PROGRAM'] === 'iTerm.app' ||
      process.env['VTE_VERSION'] !== undefined
    );
  }
}
