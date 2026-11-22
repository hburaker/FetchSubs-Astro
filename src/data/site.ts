export const SITE_URL = 'https://fetchsubs.com';
export const SITE_AUTHOR = 'Halit Burak Eroğlu';
export const DEFAULT_DESCRIPTION =
  'Free YouTube subtitle downloader. Download subtitles and transcripts as SRT, VTT or TXT in any language. No sign-up, no install.';

/** Date the static pages last changed meaningfully (used for sitemap lastmod). */
export const SITE_UPDATED = new Date(Date.UTC(2026, 10, 22));

export const GA_ID = 'G-H77CG89VC5';
export const ADSENSE_CLIENT = 'ca-pub-6866555164057364';

/** Bump when public/Content/style.css changes so browsers drop the cached copy. */
export const STYLE_VERSION = '20261122';

export interface FaqItem {
  question: string;
  /** Plain text (HTML-escaped when rendered, used verbatim in FAQPage JSON-LD). */
  answer: string;
}

/** Safe JSON for embedding inside <script type="application/ld+json">. */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** "November 22, 2026" — the format the old site used (invariant culture). */
export function longDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric', timeZone: 'UTC' });
}
