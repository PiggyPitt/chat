const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const DANGEROUS_CHARS = /[\0\r\n\t]/;

export interface UrlValidationResult {
  valid: boolean;
  reason?: string;
}

export class UrlValidator {
  static validate(url: string): UrlValidationResult {
    if (DANGEROUS_CHARS.test(url)) {
      return { valid: false, reason: 'URL contains invalid characters' };
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { valid: false, reason: 'Malformed URL' };
    }
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return { valid: false, reason: `Protocol "${parsed.protocol}" is blocked` };
    }
    return { valid: true };
  }
}
