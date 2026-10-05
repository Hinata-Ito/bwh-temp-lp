// 全HTMLの計測の組み込みを検査する（S2 の生成物も対象）。 node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set(['.git', 'node_modules', 'tests', 'scripts', '.github', 'templates']);
const KEYS = new Set(['kenshu', 'sagyou', 'migiude', 'migiude-hr', 'migiude-strategy', 'general']);
const TAG = '<script src="/assets/analytics.js" defer></script>';

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html') && !/^google[0-9a-f]+\.html$/.test(e.name)) out.push(p);
  }
  return out;
}
const pages = walk(ROOT);

test('HTML が10枚以上見つかる', () => assert.ok(pages.length >= 10, String(pages.length)));

for (const p of pages) {
  const rel = path.relative(ROOT, p).replace(/\\/g, '/');
  const s = fs.readFileSync(p, 'utf8');
  test(`${rel}: <head> に analytics.js のタグがちょうど1つ`, () => {
    const head = (/<head[\s\S]*?<\/head>/i.exec(s) || [''])[0];
    assert.equal(head.split(TAG).length - 1, 1);
    assert.equal(s.split('/assets/analytics.js').length - 1, 1);
  });

  test(`${rel}: 相談フォームへのリンクすべてに data-cta-service`, () => {
    const tags = s.match(/<a\b[^>]*href="https:\/\/(docs\.google\.com\/forms|forms\.gle)[^"]*"[^>]*>/g) || [];
    for (const t of tags) {
      const m = /data-cta-service="([^"]+)"/.exec(t);
      assert.ok(m, `属性が無い: ${t.slice(0, 140)}`);
      assert.ok(KEYS.has(m[1]), `知らないキー: ${m[1]}`);
    }
  });

  if (/<footer\b/i.test(s)) {
    test(`${rel}: フッターに外部送信のページへのリンク`, () => {
      const foot = (/<footer\b[\s\S]*?<\/footer>/i.exec(s) || [''])[0];
      assert.match(foot, /href="\/external-transmission\/"/);
    });
  }
}

test('外部送信のページに、送信先・送信される情報・目的・止め方がある', () => {
  const s = fs.readFileSync(path.join(ROOT, 'external-transmission/index.html'), 'utf8');
  for (const w of ['Google LLC', 'Google アナリティクス', '送信される情報', '目的', 'tools.google.com/dlpage/gaoptout', 'YouTube', 'X Corp.', 'Google Fonts', 'note株式会社', '合同会社BWH総合研究所']) {
    assert.ok(s.includes(w), w);
  }
});

test('設定ファイルの選択肢は、フォームの選択肢と一字一句同じ', () => {
  // 2026-10-04 に公開フォームから読んだ「ご相談したいこと」の選択肢
  const FORM_CHOICES = ['戦略の右腕', '組織の右腕', '現場AI研修', 'AIおまかせ制作', 'AXのみぎうで（AIの右腕）', 'まだ決めていない・その他'];
  const win = {};
  new Function('window', fs.readFileSync(path.join(ROOT, 'assets/analytics.config.js'), 'utf8'))(win);
  assert.equal(win.BWH_FORM.entries.service, '523560967');
  for (const [k, v] of Object.entries(win.BWH_FORM.choices)) {
    assert.ok(KEYS.has(k), k);
    assert.ok(FORM_CHOICES.includes(v), v);
  }
  assert.ok(win.BWH_GA4_ID === '' || /^G-[A-Z0-9]{4,}$/.test(win.BWH_GA4_ID));
  assert.equal(win.BWH_GA4_DRYRUN, false, '本番の設定で DRYRUN を true にしない');
});
