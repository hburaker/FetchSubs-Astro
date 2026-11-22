const ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts the 11-character video ID from any common YouTube URL form:
 * watch?v=, youtu.be/, /shorts/, /embed/, /live/, /v/, m./music. hosts, youtube-nocookie.com, or a bare ID.
 */
export function extractVideoId(input: string): string | null {
  const value = input.trim();
  if (ID.test(value)) return value;

  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(value) ? value : 'https://' + value);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, '');

  if (host === 'youtu.be') {
    const id = url.pathname.split('/')[1] ?? '';
    return ID.test(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v');
    if (v && ID.test(v)) return v;
    const m = url.pathname.match(/^\/(?:shorts|embed|live|v|e)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}
