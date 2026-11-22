// Blog posts live in src/content/blog/<slug>.html: a small frontmatter block followed by the article HTML.
// Each frontmatter line is `key: <JSON value>`.
//
// Scheduled publishing: posts whose publishDate is in the future are left out of the build. Rebuild the site
// on or after the publish date (see .github/workflows/scheduled-rebuild.yml) and they appear automatically.

export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  author: string;
  publishDate: Date;
  updatedDate?: Date;
  lang: string;
  order: number;
  content: string;
  /** Updated date if it is later than the publish date, otherwise the publish date. */
  lastModified: Date;
  /** Self-hosted cover image path, or undefined when there is none. */
  cover?: string;
}

const files = import.meta.glob('/src/content/blog/*.html', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const covers = new Set(
  Object.keys(import.meta.glob('/public/Content/blog/*.png')).map((p) => p.split('/').pop()!.replace(/\.png$/, '')),
);

function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function parse(path: string, raw: string): BlogPost {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing frontmatter in ${path}`);
  const meta: Record<string, unknown> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = JSON.parse(line.slice(i + 1).trim());
  }
  const slug = path.split('/').pop()!.replace(/\.html$/, '');
  const publishDate = parseDate(String(meta.publishDate));
  const updatedDate = meta.updatedDate ? parseDate(String(meta.updatedDate)) : undefined;
  return {
    slug,
    title: String(meta.title),
    summary: String(meta.summary ?? ''),
    author: String(meta.author ?? 'Halit Burak Eroğlu'),
    publishDate,
    updatedDate,
    lang: String(meta.lang ?? 'en'),
    order: Number(meta.order ?? 0),
    content: match[2],
    lastModified: updatedDate && updatedDate > publishDate ? updatedDate : publishDate,
    cover: covers.has(slug) ? `/Content/blog/${slug}.png` : undefined,
  };
}

/** Every post, including scheduled ones. */
export const allPosts: BlogPost[] = Object.entries(files)
  .map(([path, raw]) => parse(path, raw))
  .sort((a, b) => a.order - b.order);

const buildDay = (() => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
})();

/** Published posts (publish date on or before the build day), newest first; ties keep their original order. */
export const posts: BlogPost[] = allPosts
  .filter((p) => p.publishDate <= buildDay)
  .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime() || a.order - b.order);

const scheduled = allPosts.filter((p) => !posts.includes(p));

/** Links to scheduled (not yet published) posts would 404 until their date, so render them as plain text. */
export function stripScheduledLinks(html: string): string {
  let body = html;
  for (const pending of scheduled) {
    const escaped = pending.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    body = body.replace(new RegExp(`<a\\s[^>]*href="/blog/${escaped}"[^>]*>([\\s\\S]*?)</a>`, 'gi'), '$1');
  }
  return body;
}
