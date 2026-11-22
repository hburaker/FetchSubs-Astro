import type { APIRoute } from 'astro';
import { LANDING_PAGES } from '../data/landing';
import { SITE_UPDATED, SITE_URL, isoDate } from '../data/site';
import { posts } from '../lib/blog';

type Node = [path: string, lastmod: Date, changefreq: string, priority: string];

// lastmod reflects real content changes (never the build time), so Google keeps trusting it.
export const GET: APIRoute = () => {
  const latestPost = posts.reduce((max, p) => (p.lastModified > max ? p.lastModified : max), SITE_UPDATED);
  const nodes: Node[] = [
    ['/', SITE_UPDATED, 'weekly', '1.0'],
    ...LANDING_PAGES.map((p): Node => [`/${p.slug}`, p.lastModified, 'monthly', '0.9']),
    ['/faq', SITE_UPDATED, 'monthly', '0.6'],
    ['/usage', SITE_UPDATED, 'monthly', '0.5'],
    ['/about', SITE_UPDATED, 'yearly', '0.4'],
    ['/contact', SITE_UPDATED, 'yearly', '0.3'],
    ['/terms', SITE_UPDATED, 'yearly', '0.2'],
    ['/privacy', SITE_UPDATED, 'yearly', '0.3'],
    ['/blog', latestPost, 'weekly', '0.7'],
    ...posts.map((p): Node => [`/blog/${p.slug}`, p.lastModified, 'monthly', '0.6']),
  ];
  const urls = nodes.map(
    ([path, lastmod, freq, priority]) =>
      `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${isoDate(lastmod)}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  );
  const body =
    '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
