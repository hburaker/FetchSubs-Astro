// Shared helpers for the API routes in worker/index.js.

// The ANDROID_VR InnerTube client returns caption tracks without a PO token, and its signed timedtext URLs
// use ip=0.0.0.0, so the visitor's browser can download them directly.
const CLIENT = {
  context: {
    client: {
      clientName: 'ANDROID_VR',
      clientVersion: '1.60.19',
      deviceMake: 'Oculus',
      deviceModel: 'Quest 3',
      androidSdkVersion: 32,
      osName: 'Android',
      osVersion: '12L',
      hl: 'en',
      gl: 'US',
    },
  },
  userAgent: 'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
};

export const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

export async function getPlayer(videoId) {
  const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': CLIENT.userAgent, 'Accept-Language': 'en-US,en;q=0.9' },
    body: JSON.stringify({ videoId, context: CLIENT.context, contentCheckOk: true, racyCheckOk: true }),
  });
  if (!res.ok) throw new Error(`YouTube responded with HTTP ${res.status}`);
  return res.json();
}

export function blockedIds(env) {
  return new Set(String(env.BLOCKED_VIDEO_IDS || '').split(/[\s,;]+/).filter(Boolean));
}

export const BLOCKED_MESSAGE = 'Subtitles for this video are not available through FetchSubs at the request of the rights holder.';

// ---------------------------------------------------------------------------------------------------------------
// Legacy backend: the original ASP.NET FetchSubs server. YouTube flags Cloudflare's IPs as bots, so when the direct
// call fails the Worker asks the old server (whose IP YouTube accepts) instead. Server-to-server, so no CORS needed.
// Set LEGACY_API_ORIGIN in wrangler.toml; leave it empty to disable the fallback.

export function legacyOrigin(env) {
  return String(env.LEGACY_API_ORIGIN || '').trim().replace(/\/+$/, '');
}

export async function legacyPost(env, path, params) {
  const res = await fetch(legacyOrigin(env) + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Accept: 'application/json' },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Legacy server responded with HTTP ${res.status}`);
  const type = res.headers.get('Content-Type') || '';
  if (!type.includes('json')) throw new Error('Legacy server did not return JSON');
  return res.json();
}
