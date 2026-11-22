// @ts-check
import { defineConfig } from 'astro/config';

// Fully static build for Cloudflare Pages. The only dynamic part is /functions/api/* (Cloudflare Pages Functions),
// which Cloudflare deploys alongside the static files; Astro itself needs no adapter.
export default defineConfig({
  site: 'https://fetchsubs.com',
  trailingSlash: 'never',
  build: {
    // /about -> about.html, so Cloudflare Pages serves clean URLs without trailing slashes (same as the old site).
    format: 'file',
  },
});
