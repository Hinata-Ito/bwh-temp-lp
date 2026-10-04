// HP の各HTMLに計測を組み込む（何度実行しても同じ結果になる）。 node scripts/add-analytics-tags.mjs [--check]
// - <head> の末尾に analytics.js のタグ1行
// - 相談フォームへの <a> に data-cta-service（ページごとのサービス）
// - <footer> があれば外部送信のページへのリンク
import fs from 'node:fs';

const TAG = '<script src="/assets/analytics.js" defer></script>';
const LINK = '<a href="/external-transmission/">外部送信について</a>';
export const SERVICE = {
  'index.html': 'general',
  'lp-ai.html': 'migiude',
  'migiude-ai.html': 'migiude',
  'lp-hr.html': 'migiude-hr',
  'lp-hr-detail.html': 'migiude-hr',
  'migiude-hr.html': 'migiude-hr',
  'lp-strategy.html': 'migiude-strategy',
  'migiude-strategy.html': 'migiude-strategy',
  'ai-desk/index.html': 'general',
  'ai-desk/section.html': 'general',
};

export function addTags(html, service) {
  let s = html;
  if (!s.includes('/assets/analytics.js')) {
    if ((s.match(/<\/head>/gi) || []).length !== 1) throw new Error('</head> が1つでない');
    s = s.replace(/(\r?\n)?<\/head>/i, (m, nl) => `${nl || '\n'}${TAG}${nl || '\n'}</head>`);
  }
  s = s.replace(/<a\b(?![^>]*data-cta-service=)([^>]*href="https:\/\/(?:docs\.google\.com\/forms|forms\.gle)[^"]*"[^>]*)>/g,
    (m, rest) => `<a data-cta-service="${service}"${rest}>`);
  if (/<footer\b/i.test(s) && !s.includes('href="/external-transmission/"')) {
    if (/<nav class="footer-nav">[\s\S]*?<\/nav>/.test(s)) {
      s = s.replace(/(<nav class="footer-nav">[\s\S]*?)(\r?\n)(\s*)<\/nav>/, (m, body, nl, ind) => `${body}${nl}${ind}  ${LINK}${nl}${ind}</nav>`);
    } else {
      s = s.replace(/<\/footer>/i, `<a href="/external-transmission/" style="margin-left:1.5em">外部送信について</a></footer>`);
    }
  }
  return s;
}

if (process.argv[1] && process.argv[1].endsWith('add-analytics-tags.mjs')) {
  const check = process.argv.includes('--check');
  let bad = 0;
  for (const [rel, svc] of Object.entries(SERVICE)) {
    const url = new URL('../' + rel, import.meta.url);
    if (!fs.existsSync(url)) { console.log('skip ' + rel); continue; }
    const before = fs.readFileSync(url, 'utf8');
    const after = addTags(before, svc);
    if (before === after) { console.log('same ' + rel); continue; }
    if (check) { console.log('NG   ' + rel); bad++; continue; }
    fs.writeFileSync(url, after, 'utf8');
    console.log('done ' + rel);
  }
  if (bad) process.exit(1);
}
