// GET /api/subtitle?videoId=<id>&lang=<code>&auto=<true|false>&format=<srt|vtt|txt>
// Downloads a ready-made subtitle file from the legacy FetchSubs server. Used for tracks that /api/video got from
// the legacy server (url: null), because YouTube blocks Cloudflare's IPs.
import { BLOCKED_MESSAGE, VIDEO_ID, blockedIds, json, legacyOrigin, legacyPost } from './youtube.js';

const LANG = /^[A-Za-z0-9_.-]{1,20}$/;
const FORMATS = new Set(['srt', 'vtt', 'txt']);

export async function handleSubtitle(request, env, ctx) {
  const params = new URL(request.url).searchParams;
  const videoId = params.get('videoId') || '';
  const lang = params.get('lang') || '';
  const format = params.get('format') || '';
  const auto = params.get('auto') === 'true';
  if (!VIDEO_ID.test(videoId) || !LANG.test(lang) || !FORMATS.has(format)) {
    return json({ success: false, message: 'Bad request.' }, 400);
  }
  if (blockedIds(env).has(videoId)) return json({ success: false, message: BLOCKED_MESSAGE });
  if (!legacyOrigin(env)) return json({ success: false, message: 'Subtitle service is not configured.' }, 503);

  const cache = caches.default;
  const cacheKey = new Request(`https://fetchsubs-cache/api/subtitle?v=${videoId}&l=${encodeURIComponent(lang)}&a=${auto}&f=${format}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let body;
  try {
    body = await legacyPost(env, '/fetch-subs', { videoId, langCode: lang, format, auto: String(auto) });
  } catch {
    return json({ success: false, message: 'Could not download the subtitles. Please try again in a moment.' }, 502);
  }
  if (!body?.success || typeof body.content !== 'string') {
    return json({ success: false, message: body?.message || 'Subtitles not found.' });
  }

  const response = json({ success: true, content: body.content }, 200, { 'Cache-Control': 'public, max-age=3600' });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
