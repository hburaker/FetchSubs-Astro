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
