// トップページ #knowledge に差し込むコラムの欄。note のカードは既存の JS（note-feed.json）が描く。
// 案A「並べる」（cols）：左にコラムの新着、右に note。案B「タブ」（tabs）：コラムと note を切り替える。
// <head> は S1 の持ち場なので、CSS と JS はこの欄の中で読み込む。
import { esc, dotDate } from '../scripts/lib/html.mjs';

export function renderKnowledge(columns, variant = 'cols') {
  const latest = [...columns].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);
  if (!latest.length) return '';
  const v = variant === 'tabs' ? 'tabs' : 'cols';
  const rows = latest.map((x) => `<li><a href="${esc(x.path)}"><time datetime="${esc(x.date)}">${esc(dotDate(x.date))}</time><span class="kc-title">${esc(x.title)}</span></a></li>`).join('');
  const column = `<div class="kc-column">
    <p class="kc-label"><span class="kc-en">Column</span>コラム</p>
    <ul class="kc-list">${rows}</ul>
    <a class="kc-more" href="/column/">コラムの一覧へ <span aria-hidden="true">→</span></a>
  </div>`;
  const css = '<link rel="stylesheet" href="/assets/content.css">';
  if (v === 'tabs') {
    return `${css}
<div class="kc-tabbar" role="tablist" aria-label="知見の種類"><button type="button" role="tab" data-kc-tab="column" aria-selected="true">コラム</button><button type="button" role="tab" data-kc-tab="note" aria-selected="false">note の記事</button></div>
<div class="kc kc-tabs" data-kc-variant="tabs">
  ${column}
</div>
<script src="/assets/content.js" defer></script>`;
  }
  return `${css}
<div class="kc kc-cols" data-kc-variant="cols">
  ${column}
</div>
<p class="kc-label kc-note-label"><span class="kc-en">note</span>note の記事</p>`;
}

export function injectBetweenMarkers(html, name, inner) {
  const start = `<!-- build-content:${name}:start -->`;
  const end = `<!-- build-content:${name}:end -->`;
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i < 0 || j < 0 || j < i) throw new Error(`目印 ${start} 〜 ${end} が見つかりません`);
  return html.slice(0, i + start.length) + (inner ? `\n${inner}\n` : '\n') + html.slice(j);
}
