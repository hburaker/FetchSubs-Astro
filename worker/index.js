// Cloudflare Worker entry. Static files in dist/ are served by Workers Static Assets without running this code;
// only /api/* reaches the Worker (see run_worker_first in wrangler.toml).
import { handleCaption } from './caption.js';
import { handleVideo } from './video.js';
import { json } from './youtube.js';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/video' || pathname === '/api/caption') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return json({ success: false, message: 'Method not allowed.' }, 405, { Allow: 'GET, HEAD' });
      }
      return pathname === '/api/video' ? handleVideo(request, env, ctx) : handleCaption(request, env);
    }
    if (pathname.startsWith('/api/')) return json({ success: false, message: 'Not found.' }, 404);

    return env.ASSETS.fetch(request);
  },
};
