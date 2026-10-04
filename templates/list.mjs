// 一覧：コラムは柱ごと、瓦版は新着順＋公表事例（LP の feed.json）
import { esc, dotDate } from '../scripts/lib/html.mjs';
import { head, siteHeader, siteFooter, crumbs, listRow } from './parts.mjs';
import { breadcrumbJsonLd } from '../scripts/lib/seo.mjs';

export function columnListPage({ items, site, config }) {
  const path = '/column/';
  const cr = [{ name: 'ホーム', path: '/' }, { name: 'コラム', path }];
  const groups = Object.entries(config.pillars.column)
    .map(([key, name]) => ({ key, name, rows: items.filter((x) => x.pillar === key) }))
    .filter((g) => g.rows.length);
  const desc = '福井の中小企業の経営者に向けて、AI研修と助成金、業務でAIを試した記録、人事・組織とAIの話を書いています。監修：静木銀蔵（合同会社BWH総合研究所）。';
  return `${head({ theme: 'hp', title: 'コラム｜BWH総合研究所', description: desc, path, site, ogType: 'website', image: config.site.og.column, jsonld: [breadcrumbJsonLd(cr, site)] })}
<body class="cx cx-hp">
${siteHeader('hp', site)}
<main class="cx-main cx-list" id="main">
${crumbs(cr)}
<header class="cx-list-head"><p class="cx-en">Column</p><h1>コラム</h1><p>${esc(desc)}</p></header>
${groups.length > 1 ? `<nav class="cx-toc" aria-label="柱"><ul>${groups.map((g) => `<li><a href="#p-${g.key}">${esc(g.name)}</a></li>`).join('')}</ul></nav>` : ''}
${groups.map((g) => `<section class="cx-group" id="p-${g.key}"><h2>${esc(g.name)}</h2><ul class="cx-rows">${g.rows.map((x) => listRow(x, null)).join('')}</ul></section>`).join('\n')}
</main>
${siteFooter('hp')}
</body>
</html>
`;
}

export function kawarabanListPage({ items, site, config, feed }) {
  const path = site.kawarabanBase;
  const cr = site.lpLive
    ? [{ name: 'ホーム', path: '/' }, { name: '福井「AI よろづや」', path: '/yorozuya/' }, { name: 'AI瓦版', path }]
    : [{ name: 'ホーム', path: '/' }, { name: 'AI瓦版', path }];
  const desc = 'AIの新着と、公表されている活用事例を、福井の会社での使い道と一緒に紹介します。福井「AI よろづや」（運営：合同会社BWH総合研究所）。';
  const feedItems = (feed && Array.isArray(feed.items) ? feed.items : [])
    .filter((f) => /^https?:\/\//.test(f.url || ''))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const feedHtml = feedItems.length ? `<section class="cx-group" id="cases"><h2>公表されている事例</h2><p class="cx-note">公式の発表や報道から選んでいます。リンク先は各社のページです。</p><ul class="cx-rows">${feedItems.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">
  <span class="row-meta"><time datetime="${esc(f.date)}">${esc(dotDate(f.date))}</time><span class="tag">${esc(f.tool)}</span></span>
  <span class="row-title">${esc(f.title)}</span>
  <span class="row-desc">${esc(f.summary)}</span>
  <span class="row-src">${esc(f.org)}｜出典：${esc(f.source)}</span>
</a></li>`).join('')}</ul></section>` : '';
  return `${head({ theme: 'yz', title: 'AI瓦版｜福井「AI よろづや」', description: desc, path, site, ogType: 'website', image: config.site.og.kawaraban, jsonld: [breadcrumbJsonLd(cr, site)] })}
<body class="cx cx-yz">
${siteHeader('yz', site)}
<main class="cx-main cx-list" id="main">
${crumbs(cr)}
<header class="cx-list-head"><p class="cx-en">AI Kawaraban</p><h1>AI瓦版</h1><p>${esc(desc)}</p></header>
${items.length ? `<section class="cx-group" id="latest"><h2>新着</h2><ul class="cx-rows">${items.map((x) => listRow(x, config.pillars.kawaraban[x.pillar])).join('')}</ul></section>` : ''}
${feedHtml}
</main>
${siteFooter('yz')}
</body>
</html>
`;
}
