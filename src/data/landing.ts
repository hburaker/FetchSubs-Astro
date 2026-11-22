/** Keyword-targeted tool landing pages. Each one is a page in src/pages that embeds the shared tool. */
export interface LandingPage {
  /** URL path without leading slash, e.g. "youtube-to-srt" or "tr/youtube-transkript-indir". */
  slug: string;
  lang: 'en' | 'tr' | 'es';
  /** Short anchor text used for internal links (footer / related tools). */
  linkTitle: string;
  /** One-line description shown under the link in the related tools block. */
  linkBlurb: string;
  /** Pages with the same group are translations of each other and get reciprocal hreflang links. */
  hreflangGroup?: string;
  lastModified: Date;
}

const LAUNCH = new Date(Date.UTC(2026, 10, 22));

export const LANDING_PAGES: LandingPage[] = [
  { slug: 'youtube-transcript', lang: 'en', hreflangGroup: 'transcript', linkTitle: 'YouTube Transcript Generator', linkBlurb: 'Full transcript with or without timestamps', lastModified: LAUNCH },
  { slug: 'youtube-to-srt', lang: 'en', linkTitle: 'YouTube to SRT', linkBlurb: 'Download subtitles as .srt (and .vtt) files', lastModified: LAUNCH },
  { slug: 'youtube-to-text', lang: 'en', linkTitle: 'YouTube to Text', linkBlurb: 'Clean, copyable TXT transcript', lastModified: LAUNCH },
  { slug: 'youtube-shorts-transcript', lang: 'en', linkTitle: 'YouTube Shorts Transcript', linkBlurb: 'Captions and text from any Short', lastModified: LAUNCH },
  { slug: 'youtube-auto-generated-subtitles', lang: 'en', linkTitle: 'Auto-Generated Subtitles', linkBlurb: "Download YouTube's automatic captions", lastModified: LAUNCH },
  { slug: 'youtube-transcript-for-chatgpt', lang: 'en', linkTitle: 'Transcript for ChatGPT & AI', linkBlurb: 'Summarize videos with ChatGPT, Claude or Gemini', lastModified: LAUNCH },
  { slug: 'tr/youtube-transkript-indir', lang: 'tr', hreflangGroup: 'transcript', linkTitle: 'Türkçe: YouTube Transkript İndir', linkBlurb: 'YouTube altyazı ve transkript indirme', lastModified: LAUNCH },
  { slug: 'es/transcripcion-youtube', lang: 'es', hreflangGroup: 'transcript', linkTitle: 'Español: Transcripción de YouTube', linkBlurb: 'Descargar subtítulos y transcripción', lastModified: LAUNCH },
];

export const ENGLISH_LANDING = LANDING_PAGES.filter((p) => p.lang === 'en');
export const LOCALIZED_LANDING = LANDING_PAGES.filter((p) => p.lang !== 'en');

export function findLanding(slug: string): LandingPage {
  const page = LANDING_PAGES.find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown landing page: ${slug}`);
  return page;
}

export function alternatesOf(page: LandingPage): LandingPage[] {
  return page.hreflangGroup ? LANDING_PAGES.filter((p) => p.hreflangGroup === page.hreflangGroup) : [];
}
