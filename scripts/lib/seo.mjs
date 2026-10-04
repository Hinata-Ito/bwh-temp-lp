// sitemap.xml と構造化データ（Article・BreadcrumbList）
import { canonical } from './site.mjs';

const xmlEsc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

export function buildSitemap(entries) {
  const rows = entries.map((e) => `  <url><loc>${xmlEsc(e.loc)}</loc>${e.lastmod ? `<lastmod>${xmlEsc(e.lastmod)}</lastmod>` : ''}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

export function articleJsonLd(item, site, config) {
  const url = canonical(item.path, site);
  const a = config.site.author;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    description: item.description,
    datePublished: item.date,
    dateModified: item.updated || item.date,
    image: [canonical(item.image, site)],
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Person', name: a.name, jobTitle: a.title, url: a.url },
    publisher: { '@type': 'Organization', name: config.site.org_name, url: site.origin + '/' },
  };
}

export function breadcrumbJsonLd(crumbs, site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: canonical(c.path, site) })),
  };
}

export function jsonLdScript(obj) {
  // </script> や <!-- で script が閉じないよう、< を \u003c にする（JSON としては同じ値）
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
}
