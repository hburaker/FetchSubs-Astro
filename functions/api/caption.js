// GET /api/caption?url=<signed YouTube timedtext URL>
// Fallback only: the browser normally downloads captions from YouTube directly. Restricted to YouTube's
// timedtext endpoint so it can't be used as an open proxy.
import { BLOCKED_MESSAGE, blockedIds } from '../_youtube.js';

export async function onRequestGet({ request, env }) {
  let target;
  try {
    target = new URL(new URL(request.url).searchParams.get('url') || '');
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  if (target.protocol !== 'https:' || target.hostname !== 'www.youtube.com' || target.pathname !== '/api/timedtext') {
    return new Response('Forbidden', { status: 403 });
  }
  if (blockedIds(env).has(target.searchParams.get('v') || '')) return new Response(BLOCKED_MESSAGE, { status: 403 });

  const res = await fetch(target.toString(), { cf: { cacheTtl: 3600, cacheEverything: true } });
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
