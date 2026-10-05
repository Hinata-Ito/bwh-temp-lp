import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, GENERATOR } from '../scripts/lib/build.mjs';

const REPO = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const FIX = path.join(REPO, 'tests/fixtures/content');

// 本物の設定を写した一時のリポジトリを作る
function tempRoot({ withIndex = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 's2-build-'));
  fs.mkdirSync(path.join(root, 'content'));
  for (const f of ['staff.json', 'services.json', 'pillars.json', 'site.json']) {
    fs.copyFileSync(path.join(REPO, 'content', f), path.join(root, 'content', f));
  }
  if (withIndex) {
    fs.writeFileSync(path.join(root, 'index.html'),
      '<html><head><title>x</title></head><body><section id="knowledge">\n<!-- build-content:knowledge:start -->\n<!-- build-content:knowledge:end -->\n</section></body></html>\n');
  }
  fs.writeFileSync(path.join(root, 'migiude-hr.html'), '<html></html>');
  return root;
}
const read = (root, p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (root, p) => fs.existsSync(path.join(root, p));
const run = (root, env = {}, extra = {}) => build({ root, contentDir: FIX, outDir: root, env, today: '2026-10-31', ...extra });
function ldOf(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
}

test('コラム1本・瓦版2件・一覧・sitemap・content-index ができる', () => {
  const root = tempRoot();
  run(root);
  for (const p of [
    'column/ai-gijiroku-tameshite-mita/index.html',
    'column/index.html',
    'yorozuya/kawaraban/20261026-dummy-gemini-demo/index.html',
    'yorozuya/kawaraban/20261027-dummy-claude-code/index.html',
    'yorozuya/kawaraban/index.html',
    'sitemap.xml',
    'content-index.json',
  ]) assert.ok(exists(root, p), p);
  const idx = JSON.parse(read(root, 'content-index.json'));
  assert.equal(idx.items.length, 3);
  assert.deepEqual(Object.keys(idx.items[0]).sort(), ['date', 'description', 'id', 'pillar', 'service', 'title', 'type', 'updated', 'url']);
});

test('記事：canonical・OGP・構造化データ', () => {
  const root = tempRoot();
  run(root);
  const html = read(root, 'column/ai-gijiroku-tameshite-mita/index.html');
  const url = 'https://bwh-research.com/column/ai-gijiroku-tameshite-mita/';
  assert.match(html, new RegExp(`<link rel="canonical" href="${url}">`));
  assert.match(html, /<meta property="og:type" content="article">/);
  assert.match(html, new RegExp(`<meta property="og:url" content="${url}">`));
  assert.match(html, /<meta property="og:image" content="https:\/\/bwh-research\.com\/assets\/og\/column\.png">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  const ld = ldOf(html);
  assert.equal(ld.find((x) => x['@type'] === 'Article').mainEntityOfPage['@id'], url);
  assert.equal(ld.find((x) => x['@type'] === 'BreadcrumbList').itemListElement.length, 3);
  assert.match(html, new RegExp(`<meta name="generator" content="${GENERATOR}">`));
  assert.match(html, /<script src="\/assets\/analytics\.js" defer><\/script>/);
});

test('記事：パンくず・吹き出し・サービス案内1枠・書き手の欄・関連記事', () => {
  const root = tempRoot();
  run(root);
  const col = read(root, 'column/ai-gijiroku-tameshite-mita/index.html');
  assert.match(col, /<nav class="crumbs"/);
  assert.equal((col.match(/class="staff-say"/g) || []).length, 3);
  assert.equal((col.match(/class="service-box"/g) || []).length, 1);
  assert.match(col, /data-cta-service="kenshu"/);
  assert.match(col, /監修/);
  assert.match(col, /静木 銀蔵/);
  assert.doesNotMatch(col, /class="related"/); // コラムが1本だけなので関連記事の欄は出さない
  const kw = read(root, 'yorozuya/kawaraban/20261026-dummy-gemini-demo/index.html');
  assert.match(kw, /class="related"/);
  assert.match(kw, /20261027-dummy-claude-code/);
  assert.match(kw, /data-embed-id="UIZAiXYceBI"/);
  assert.match(kw, /href="\/yorozuya\/sagyou\/"/);
  assert.match(kw, /class="sources"/);
});

test('既定では旧 /kawaraban/ に転送ページを残し、sitemap には載せない', () => {
  const root = tempRoot();
  run(root);
  const r = read(root, 'kawaraban/20261026-dummy-gemini-demo/index.html');
  assert.match(r, /<meta name="robots" content="noindex">/);
  assert.match(r, /<link rel="canonical" href="https:\/\/bwh-research\.com\/yorozuya\/kawaraban\/20261026-dummy-gemini-demo\/">/);
  assert.match(r, /http-equiv="refresh"/);
  const sm = read(root, 'sitemap.xml');
  assert.match(sm, /\/yorozuya\/kawaraban\/20261026-dummy-gemini-demo\//);
  assert.doesNotMatch(sm, /bwh-research\.com\/kawaraban\//);
});

test('KAWARABAN_BASE=/kawaraban/：出し先・canonical・sitemap が切り替わり、LP へのリンクが無い', () => {
  const root = tempRoot();
  run(root, { KAWARABAN_BASE: '/kawaraban/' });
  assert.ok(exists(root, 'kawaraban/20261026-dummy-gemini-demo/index.html'));
  assert.ok(!exists(root, 'yorozuya'));
  const kw = read(root, 'kawaraban/20261026-dummy-gemini-demo/index.html');
  assert.match(kw, /<link rel="canonical" href="https:\/\/bwh-research\.com\/kawaraban\/20261026-dummy-gemini-demo\/">/);
  assert.doesNotMatch(kw, /href="\/yorozuya\//);
  assert.match(kw, /docs\.google\.com\/forms/);
  const sm = read(root, 'sitemap.xml');
  assert.match(sm, /bwh-research\.com\/kawaraban\/20261026-dummy-gemini-demo\//);
  assert.doesNotMatch(sm, /yorozuya\/kawaraban/);
  const col = read(root, 'column/ai-gijiroku-tameshite-mita/index.html');
  assert.doesNotMatch(col, /href="\/yorozuya\//);
});

test('切り替えを戻すと、前の出し先の生成物は消えて転送ページに置き換わる', () => {
  const root = tempRoot();
  run(root, { KAWARABAN_BASE: '/kawaraban/' });
  run(root, {});
  assert.match(read(root, 'kawaraban/20261026-dummy-gemini-demo/index.html'), /noindex/);
  assert.ok(exists(root, 'yorozuya/kawaraban/20261026-dummy-gemini-demo/index.html'));
});

test('sitemap：固定ページは実在するものだけ', () => {
  const root = tempRoot();
  run(root);
  const sm = read(root, 'sitemap.xml');
  assert.match(sm, /<loc>https:\/\/bwh-research\.com\/<\/loc>/);
  assert.match(sm, /migiude-hr\.html/);
  assert.doesNotMatch(sm, /migiude-strategy\.html/); // 一時リポジトリに無い
  assert.doesNotMatch(sm, /<loc>https:\/\/bwh-research\.com\/yorozuya\/<\/loc>/);
  assert.match(sm, /<lastmod>2026-10-22<\/lastmod>/);
});

test('未来の日付と draft は出さない。--drafts なら noindex つきで出す', () => {
  const root = tempRoot();
  run(root, {}, { today: '2026-10-26' });
  assert.ok(!exists(root, 'yorozuya/kawaraban/20261027-dummy-claude-code/index.html'));
  assert.doesNotMatch(read(root, 'sitemap.xml'), /20261027/);
  run(root, {}, { today: '2026-10-26', drafts: true });
  assert.match(read(root, 'yorozuya/kawaraban/20261027-dummy-claude-code/index.html'), /<meta name="robots" content="noindex">/);
});

test('前付けに誤りがあれば、何も書かずにファイル名つきで止める', () => {
  const root = tempRoot();
  const bad = fs.mkdtempSync(path.join(os.tmpdir(), 's2-bad-'));
  fs.mkdirSync(path.join(bad, 'column'));
  fs.writeFileSync(path.join(bad, 'column', 'x.md'), '---\ntitle: a\nslug: x\ndate: 2026-10-01\ntype: column\npillar: nope\nservice: kenshu\ndescription: d\n---\n本文');
  assert.throws(() => build({ root, contentDir: bad, outDir: root, env: {}, today: '2026-10-31' }), /x\.md.*pillar/s);
  assert.ok(!exists(root, 'column'));
  assert.ok(!exists(root, 'sitemap.xml'));
});

test('slug の重複は止める', () => {
  const root = tempRoot();
  const dup = fs.mkdtempSync(path.join(os.tmpdir(), 's2-dup-'));
  fs.mkdirSync(path.join(dup, 'kawaraban'));
  const src = fs.readFileSync(path.join(FIX, 'kawaraban/20261026-dummy-gemini-demo.md'), 'utf8');
  fs.writeFileSync(path.join(dup, 'kawaraban/20261026-dummy-gemini-demo.md'), src);
  fs.writeFileSync(path.join(dup, 'kawaraban/20261028-dummy-gemini-demo.md'), src.replace(/2026-10-26/, '2026-10-28').replace(/card_id: .*/, 'card_id: x'));
  assert.throws(() => build({ root, contentDir: dup, outDir: root, env: {}, today: '2026-10-31' }), /重複/);
});

test('原稿が消えた記事のフォルダは消える（目印のある生成物だけ）', () => {
  const root = tempRoot();
  run(root);
  fs.mkdirSync(path.join(root, 'column/hand-made'), { recursive: true });
  fs.writeFileSync(path.join(root, 'column/hand-made/index.html'), '<html>手で置いたページ</html>');
  fs.mkdirSync(path.join(root, 'column/old-article'), { recursive: true });
  fs.writeFileSync(path.join(root, 'column/old-article/index.html'), `<meta name="generator" content="${GENERATOR}">`);
  run(root);
  assert.ok(!exists(root, 'column/old-article'));
  assert.ok(exists(root, 'column/hand-made/index.html'));
});

test('記事が0本なら一覧を作らず、sitemap にも載せない', () => {
  const root = tempRoot();
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 's2-empty-'));
  build({ root, contentDir: empty, outDir: root, env: {}, today: '2026-10-31' });
  assert.ok(!exists(root, 'column/index.html'));
  assert.doesNotMatch(read(root, 'sitemap.xml'), /column/);
  assert.deepEqual(JSON.parse(read(root, 'content-index.json')).items, []);
});

test('コラムが0本のときは、瓦版のページに /column/ へのリンクを出さない（404 にしない）', () => {
  const root = tempRoot();
  const onlyKw = fs.mkdtempSync(path.join(os.tmpdir(), 's2-kw-'));
  fs.mkdirSync(path.join(onlyKw, 'kawaraban'));
  fs.copyFileSync(path.join(FIX, 'kawaraban/20261026-dummy-gemini-demo.md'), path.join(onlyKw, 'kawaraban/20261026-dummy-gemini-demo.md'));
  build({ root, contentDir: onlyKw, outDir: root, env: {}, today: '2026-10-31' });
  for (const p of ['yorozuya/kawaraban/20261026-dummy-gemini-demo/index.html', 'yorozuya/kawaraban/index.html']) {
    assert.doesNotMatch(read(root, p), /href="\/column\/"/, p);
  }
});

test('本文に「実質無料」があれば、行番号つきで止める', () => {
  const root = tempRoot();
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 's2-ban-'));
  fs.mkdirSync(path.join(d, 'column'));
  fs.writeFileSync(path.join(d, 'column/a.md'), '---\ntitle: a\nslug: a\ndate: 2026-10-01\ntype: column\npillar: trial\nservice: kenshu\ndescription: d\n---\n本文\n\n研修が実質無料になります。\n');
  assert.throws(() => build({ root, contentDir: d, outDir: root, env: {}, today: '2026-10-31' }), /a\.md：12行目.*実質無料/);
});

test('前付けの誤りには行番号が付く', () => {
  const root = tempRoot();
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 's2-line-'));
  fs.mkdirSync(path.join(d, 'column'));
  fs.writeFileSync(path.join(d, 'column/a.md'), '---\ntitle: a\nslug: a\ndate: 2026-10-01\ntype: column\npillar: triall\nservice: kenshu\ndescription: d\n---\n本文\n');
  assert.throws(() => build({ root, contentDir: d, outDir: root, env: {}, today: '2026-10-31' }), /a\.md：6行目：pillar/);
});

test('瓦版のファイル名の日付と date のずれにも、date の行番号が付く', () => {
  const root = tempRoot();
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 's2-kwline-'));
  fs.mkdirSync(path.join(d, 'kawaraban'));
  const src = fs.readFileSync(path.join(FIX, 'kawaraban/20261026-dummy-gemini-demo.md'), 'utf8').replace('date: 2026-10-26', 'date: 2026-10-25');
  fs.writeFileSync(path.join(d, 'kawaraban/20261026-dummy-gemini-demo.md'), src);
  assert.throws(() => build({ root, contentDir: d, outDir: root, env: {}, today: '2026-10-31' }), /20261026-dummy-gemini-demo\.md：4行目：ファイル名の日付/);
});

test('LP の事例ページは、実在すれば sitemap に載る', () => {
  const root = tempRoot();
  fs.mkdirSync(path.join(root, 'yorozuya/cases/pv-video'), { recursive: true });
  fs.writeFileSync(path.join(root, 'yorozuya/cases/pv-video/index.html'), '<html></html>');
  run(root);
  const sm = read(root, 'sitemap.xml');
  assert.match(sm, /\/yorozuya\/cases\/pv-video\//);
  assert.doesNotMatch(sm, /\/yorozuya\/cases\/lp-site\//);
});

test('転送ページも analytics.js を読み込む（I3）', () => {
  const root = tempRoot();
  run(root);
  assert.match(read(root, 'kawaraban/20261026-dummy-gemini-demo/index.html'), /<script src="\/assets\/analytics\.js" defer><\/script>/);
});

test('index.html の目印が無ければ、何も書かずに止める', () => {
  const root = tempRoot({ withIndex: false });
  fs.writeFileSync(path.join(root, 'index.html'), '<html><body>目印なし</body></html>');
  assert.throws(() => run(root), /目印/);
  assert.ok(!exists(root, 'column'));
  assert.ok(!exists(root, 'sitemap.xml'));
});

test('吹き出しが4か所以上なら警告（止めない）', () => {
  const root = tempRoot();
  const many = fs.mkdtempSync(path.join(os.tmpdir(), 's2-many-'));
  fs.mkdirSync(path.join(many, 'column'));
  const say = ':::staff sora\nx\n:::\n\n';
  fs.writeFileSync(path.join(many, 'column/a.md'), `---\ntitle: a\nslug: a\ndate: 2026-10-01\ntype: column\npillar: trial\nservice: kenshu\ndescription: d\n---\n${say.repeat(4)}`);
  const r = build({ root, contentDir: many, outDir: root, env: {}, today: '2026-10-31' });
  assert.ok(r.warnings.some((w) => w.includes('a.md') && w.includes('4')));
});

test('_config.yml が原稿とスクリプトを Jekyll の公開から外している', () => {
  const yml = fs.readFileSync(path.join(REPO, '_config.yml'), 'utf8');
  for (const d of ['content', 'scripts', 'templates', 'tests', 'node_modules', 'package.json', 'package-lock.json']) {
    assert.match(yml, new RegExp(`^\\s+- ${d.replace('.', '\\.')}\\s*$`, 'm'), d);
  }
});

// S1 の決まり（I3 の補足1〜3）を、生成したページにも求める。統合（feature/seo-integrate）で見つかった漏れの再発防止
test('生成したページは計測の決まりを満たす（タグ1つ・相談リンクの属性・フッターに外部送信）', () => {
  const root = tempRoot();
  run(root);
  const pages = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html') && ['column', 'kawaraban'].some((k) => path.relative(root, p).split(path.sep).includes(k))) pages.push(p); } };
  walk(root);
  assert.ok(pages.length >= 4, String(pages.length));
  for (const p of pages) {
    const s = fs.readFileSync(p, 'utf8');
    const rel = path.relative(root, p);
    const head = (/<head[\s\S]*?<\/head>/i.exec(s) || [''])[0];
    assert.equal(head.split('<script src="/assets/analytics.js" defer></script>').length - 1, 1, `${rel}: タグ`);
    for (const t of s.match(/<a\b[^>]*href="https:\/\/(docs\.google\.com\/forms|forms\.gle)[^"]*"[^>]*>/g) || []) {
      assert.match(t, /data-cta-service="[a-z-]+"/, `${rel}: ${t.slice(0, 120)}`);
    }
    if (/<footer\b/i.test(s)) {
      const foot = (/<footer\b[\s\S]*?<\/footer>/i.exec(s) || [''])[0];
      assert.match(foot, /href="\/external-transmission\/"/, `${rel}: フッターに外部送信のリンクが無い`);
    }
  }
});

// 記事は AI よろづや の記事ページ（/yorozuya/articles/）に一本化した（2026-10-05 静木さん 問1=b）。公開済みの記事だけ sitemap に載せる
test('sitemap に LP の解説記事を載せる（noindex の下書きは載せない）', () => {
  const root = tempRoot();
  const art = (id, html) => { fs.mkdirSync(path.join(root, 'yorozuya/articles', id), { recursive: true }); fs.writeFileSync(path.join(root, 'yorozuya/articles', id, 'index.html'), html); };
  art('fukui-ai-guide', '<html><head><title>x</title></head></html>');
  art('draft-one', '<html><head><meta name="robots" content="noindex"></head></html>');
  fs.mkdirSync(path.join(root, 'yorozuya/cases/new-case'), { recursive: true });
  fs.writeFileSync(path.join(root, 'yorozuya/cases/new-case/index.html'), '<html><head><title>x</title></head></html>');
  run(root);
  const sm = read(root, 'sitemap.xml');
  assert.match(sm, /<loc>https:\/\/bwh-research\.com\/yorozuya\/articles\/fukui-ai-guide\/<\/loc>/);
  assert.doesNotMatch(sm, /draft-one/);
  assert.match(sm, /<loc>https:\/\/bwh-research\.com\/yorozuya\/cases\/new-case\/<\/loc>/);
});
