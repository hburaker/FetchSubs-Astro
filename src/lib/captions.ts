// Caption parsing and SRT / VTT / TXT generation. Output matches the old ASP.NET version byte for byte:
// CRLF line endings everywhere, cues numbered from 1, empty cues dropped.

export interface Caption {
  /** Start time in milliseconds. */
  start: number;
  /** Duration in milliseconds. */
  duration: number;
  text: string;
}

/**
 * Parses YouTube timedtext XML: format 3 (<p t="ms" d="ms">, optionally with <s> word segments)
 * or the legacy format (<text start="sec" dur="sec">).
 */
export function parseTimedText(xml: string): Caption[] {
  if (!xml.trim()) return [];
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const captions: Caption[] = [];

  const add = (start: number, duration: number, raw: string | null) => {
    // Normalize line breaks inside a cue to CRLF so the whole file is consistent.
    const text = (raw ?? '').replace(/\r\n?/g, '\n').replace(/\n/g, '\r\n').trim();
    if (text) captions.push({ start: start || 0, duration: duration || 0, text });
  };

  const paragraphs = doc.getElementsByTagName('p');
  if (paragraphs.length) {
    for (const p of Array.from(paragraphs)) {
      add(Number(p.getAttribute('t')), Number(p.getAttribute('d')), p.textContent);
    }
    return captions;
  }
  for (const t of Array.from(doc.getElementsByTagName('text'))) {
    // Legacy format double-escapes entities (&amp;#39;), so decode once more.
    const decoded = new DOMParser().parseFromString(`<x>${t.textContent ?? ''}</x>`, 'text/html').body.textContent;
    add(Math.round(Number(t.getAttribute('start')) * 1000), Math.round(Number(t.getAttribute('dur')) * 1000), decoded);
  }
  return captions;
}

function timestamp(ms: number, separator: ',' | '.'): string {
  const total = Math.max(0, Math.round(ms));
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  // .NET's hh format wraps at 24h; videos that long don't have captions, so plain hours are fine.
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}${separator}${pad(total % 1000, 3)}`;
}

const NL = '\r\n';

export function captionsToSrt(captions: Caption[]): string {
  return captions
    .map((c, i) => `${i + 1}${NL}${timestamp(c.start, ',')} --> ${timestamp(c.start + c.duration, ',')}${NL}${c.text}${NL}${NL}`)
    .join('');
}

export function captionsToVtt(captions: Caption[]): string {
  return (
    `WEBVTT${NL}${NL}` +
    captions
      .map((c, i) => `${i + 1}${NL}${timestamp(c.start, '.')} --> ${timestamp(c.start + c.duration, '.')}${NL}${c.text}${NL}${NL}`)
      .join('')
  );
}

export function captionsToTxt(captions: Caption[]): string {
  return captions.map((c) => c.text + NL).join('');
}

/** Same rule as the old site: non-word characters become "_", truncated to 50 characters. */
export function buildFileName(title: string, langCode: string, isAuto: boolean, ext: string): string {
  let cleaned = (title || 'video').replace(/[^\p{L}\p{Mn}\p{Nd}\p{Pc}\-.]/gu, '_');
  if (cleaned.length > 50) cleaned = cleaned.slice(0, 50);
  return `${cleaned}_${langCode}${isAuto ? '_auto' : ''}${ext}`;
}
