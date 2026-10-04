// 記事1本（コラム／瓦版）
import { esc, dotDate } from '../scripts/lib/html.mjs';
import { head, siteHeader, siteFooter, crumbs, serviceBox, authorBox, sources, related } from './parts.mjs';

export function articlePage({ item, site, config, crumbList, relatedItems, serviceLinkObj, bodyHtml, embedHtml, jsonld }) {
  const theme = item.type === 'column' ? 'hp' : 'yz';
  const pillarName = config.pillars[item.type][item.pillar];
  const suffix = item.type === 'column' ? 'BWH総合研究所 コラム' : 'AI瓦版｜福井「AI よろづや」';
  const updated = item.updated && item.updated !== item.date
    ? `<span>更新 <time datetime="${esc(item.updated)}">${esc(dotDate(item.updated))}</time></span>` : '';
  const draftNote = item.isDraft ? '<p class="cx-draft">下書きのプレビューです（公開されていません）</p>' : '';
  return `${head({ theme, title: `${item.title}｜${suffix}`, description: item.description, path: item.path, site, image: item.image, noindex: item.isDraft, jsonld })}
<body class="cx cx-${theme}">
${siteHeader(theme, site)}
<main class="cx-main" id="main">
${draftNote}
${crumbs(crumbList)}
<article class="cx-article">
  <header class="cx-article-head">
    <p class="cx-meta"><span class="tag">${esc(pillarName)}</span><span>公開 <time datetime="${esc(item.date)}">${esc(dotDate(item.date))}</time></span>${updated}</p>
    <h1>${esc(item.title)}</h1>
    ${item.type === 'kawaraban' ? `<p class="cx-lead">${esc(item.description)}</p>` : ''}
  </header>
  ${embedHtml}
  <div class="cx-body">
${bodyHtml}
  </div>
  ${sources(item.sources)}
</article>
${serviceBox(item, serviceLinkObj, config)}
${authorBox(config)}
${related(relatedItems, item.type === 'column' ? '関連するコラム' : 'ほかの瓦版')}
<p class="cx-back"><a href="${item.type === 'column' ? '/column/' : esc(site.kawarabanBase)}">${item.type === 'column' ? 'コラムの一覧へ' : 'AI瓦版の一覧へ'}</a></p>
</main>
${siteFooter(theme)}
</body>
</html>
`;
}

// LP の公開後、旧 /kawaraban/ に残す転送ページ（SNS に出した URL を切らさない）
export function redirectPage({ to, site }) {
  const url = site.origin + to;
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="generator" content="bwh-build-content">
<meta name="robots" content="noindex">
<link rel="canonical" href="${esc(url)}">
<meta http-equiv="refresh" content="0; url=${esc(to)}">
<title>移転しました</title>
</head>
<body><p>このページは <a href="${esc(to)}">${esc(url)}</a> に移りました。</p></body>
</html>
`;
}
