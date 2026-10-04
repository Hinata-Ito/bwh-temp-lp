// 生成ページの共通部品。コラムは HP のトーン（cx-hp）、瓦版は LP のトーン（cx-yz）。
import { esc, dotDate } from '../scripts/lib/html.mjs';
import { canonical } from '../scripts/lib/site.mjs';
import { jsonLdScript } from '../scripts/lib/seo.mjs';

export const GENERATOR = 'bwh-build-content';

const FONTS = {
  hp: 'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=Cormorant+Garamond:ital,wght@0,400;1,300&display=swap',
  yz: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Jost:wght@400;500;600&display=swap',
};

// <head>。S1 との約束（I3）：analytics.js を読み込む。head のそれ以外は S2 の生成物なので S2 が持つ。
export function head({ theme, title, description, path, site, ogType = 'article', image, noindex = false, jsonld = [], extra = '' }) {
  const url = canonical(path, site);
  const img = image ? canonical(image, site) : '';
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="generator" content="${GENERATOR}">${noindex ? '\n<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="${theme === 'yz' ? '福井「AI よろづや」' : '合同会社 BWH総合研究所'}">
<meta property="og:locale" content="ja_JP">${img ? `\n<meta property="og:image" content="${esc(img)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS[theme]}" rel="stylesheet">${theme === 'hp' ? '\n<link rel="stylesheet" href="/style.css">' : ''}
<link rel="stylesheet" href="/assets/content.css">
${jsonld.map(jsonLdScript).join('\n')}
<script src="/assets/analytics.js" defer></script>
<script src="/assets/content.js" defer></script>${extra}
</head>`;
}

export function siteHeader(theme, site) {
  if (theme === 'yz') {
    const home = site.lpLive ? '/yorozuya/' : site.kawarabanBase;
    return `<header class="cx-header"><div class="cx-header-in">
  <a class="cx-brand-yz" href="${home}"><span class="cx-brand-fukui">福井</span>「AI よろづや」</a>
  <nav class="cx-nav" aria-label="メニュー">${site.lpLive ? '<a href="/yorozuya/#staff">AI社員</a>' : ''}<a href="${site.kawarabanBase}">AI瓦版</a><a href="/column/">コラム</a></nav>
</div></header>`;
  }
  return `<header class="cx-header"><div class="cx-header-in">
  <a class="cx-brand-hp" href="/"><span class="logo-mark">BWH</span><span class="logo-text">総合研究所</span></a>
  <nav class="cx-nav" aria-label="メニュー"><a href="/#service">サービス</a><a href="/column/">コラム</a><a href="/#contact">お問い合わせ</a></nav>
</div></header>`;
}

export function siteFooter(theme) {
  const run = theme === 'yz' ? '<p class="cx-run">福井「AI よろづや」の運営：<a href="/">合同会社 BWH総合研究所</a>。記事に出てくる社員は、AIのスタッフです。</p>' : '';
  return `<footer class="cx-footer"><div class="cx-footer-in">
  ${run}
  <nav aria-label="フッター"><a href="/">BWH総合研究所 トップ</a><a href="/column/">コラム</a><a href="/#contact">お問い合わせ</a></nav>
  <p class="cx-copy">&copy; 合同会社 BWH総合研究所</p>
</div></footer>`;
}

export function crumbs(list) {
  const li = list.map((c, i) => i === list.length - 1
    ? `<li aria-current="page">${esc(c.name)}</li>`
    : `<li><a href="${esc(c.path)}">${esc(c.name)}</a></li>`).join('');
  return `<nav class="crumbs" aria-label="パンくずリスト"><ol>${li}</ol></nav>`;
}

export function serviceBox(item, link, config) {
  const s = config.services[item.service];
  // 「詳しく見る」（LP・HP へ＝to_lp）と「相談する」（フォームへ＝cta_click）。LP 未公開のときは相談だけ
  const more = link.kind === 'form' ? '' : `<a class="service-box-go" href="${esc(link.href)}">${esc(s.name)}を詳しく見る<span aria-hidden="true">→</span></a>`;
  const cta = `<a class="service-box-cta" href="${esc(link.form)}" target="_blank" rel="noopener" data-cta-service="${esc(item.service)}">${esc(s.name)}について相談する<span aria-hidden="true">→</span></a>`;
  return `<aside class="service-box" aria-label="関係するサービス">
  <p class="service-box-label">この記事に関係するサービス</p>
  <p class="service-box-name">${esc(s.name)}</p>
  <p class="service-box-lead">${esc(s.lead)}</p>
  <div class="service-box-acts">${more}${cta}</div>
</aside>`;
}

export function authorBox(config) {
  const a = config.site.author;
  return `<section class="author-box" aria-label="監修">
  <img src="${esc(a.image)}" alt="${esc(a.name)}" width="72" height="72" loading="lazy">
  <div>
    <p class="author-role">監修</p>
    <p class="author-name">${esc(a.name)}<span>${esc(a.title)}</span></p>
    <p class="author-bio">京都大学大学院人間環境学研究科で組織開発を専攻。エムスリー株式会社を経て、福井の中小企業やスタートアップで、経営と組織の参謀と実行を担う。記事に出てくるAIのスタッフの発言も、監修の対象です。</p>
  </div>
</section>`;
}

export function sources(list) {
  if (!list || !list.length) return '';
  return `<section class="sources" aria-label="出典"><h2>出典</h2><ul>${list.map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u)}</a></li>`).join('')}</ul></section>`;
}

export function related(items, heading) {
  if (!items.length) return '';
  return `<section class="related" aria-label="${esc(heading)}"><h2>${esc(heading)}</h2><ul>${items.map((x) =>
    `<li><a href="${esc(x.path)}"><time datetime="${esc(x.date)}">${esc(dotDate(x.date))}</time><span class="related-title">${esc(x.title)}</span></a></li>`).join('')}</ul></section>`;
}

export function listRow(x, pillarName) {
  return `<li><a href="${esc(x.path)}">
  <span class="row-meta"><time datetime="${esc(x.date)}">${esc(dotDate(x.date))}</time>${pillarName ? `<span class="tag">${esc(pillarName)}</span>` : ''}</span>
  <span class="row-title">${esc(x.title)}</span>
  <span class="row-desc">${esc(x.description)}</span>
</a></li>`;
}
