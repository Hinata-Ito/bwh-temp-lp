// content/ の原稿から、記事・一覧・転送ページ・sitemap.xml・content-index.json を作り、
// index.html の #knowledge の目印の間にコラムの欄を差し込む。
// 原稿に誤りが1つでもあれば、何も書かずに止める（壊れたページを公開しない）。
import fs from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';
import { loadConfig } from './config.mjs';
import { parseFrontmatter } from './frontmatter.mjs';
import { validateMeta, BANNED } from './validate.mjs';
import { splitStaffBlocks, renderStaff, countStaff } from './staff.mjs';
import { parseEmbed, renderEmbed } from './embed.mjs';
import { resolveSite, columnPath, kawarabanPath, serviceLink } from './site.mjs';
import { pickRelated } from './related.mjs';
import { buildSitemap, articleJsonLd, breadcrumbJsonLd } from './seo.mjs';
import { articlePage, redirectPage } from '../../templates/article.mjs';
import { columnListPage, kawarabanListPage } from '../../templates/list.mjs';
import { renderKnowledge, injectBetweenMarkers } from '../../templates/knowledge.mjs';
import { GENERATOR } from '../../templates/parts.mjs';

export { GENERATOR };

const TYPES = ['column', 'kawaraban'];
const MAX_STAFF = 3; // 設定書4章：吹き出しは1記事2〜3か所

export function todayJst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function readSources(contentDir, config) {
  const items = [];
  const errors = [];
  for (const dir of TYPES) {
    const d = path.join(contentDir, dir);
    if (!fs.existsSync(d)) continue;
    for (const filename of fs.readdirSync(d).filter((f) => f.endsWith('.md') && !f.startsWith('_')).sort()) {
      const rel = `${dir}/${filename}`;
      try {
        const { data, body, bodyLine, keyLines } = parseFrontmatter(fs.readFileSync(path.join(d, filename), 'utf8'));
        // 前付けの誤りは、そのキーの行番号を付ける
        const errs = validateMeta(data, { dir, filename, config }).map((e) => {
          const k = Object.keys(keyLines).find((key) => e.startsWith(key));
          return k ? `${keyLines[k]}行目：${e}` : e;
        });
        // 本文の禁止語（前付けは validateMeta が見る）
        body.split('\n').forEach((l, i) => {
          for (const w of BANNED) if (l.includes(w)) errs.push(`${bodyLine + i}行目：本文に「${w}」があります（使わない約束の言葉です）`);
        });
        if (errs.length) { errors.push(...errs.map((e) => `${rel}：${e}`)); continue; }
        const id = dir === 'column' ? data.slug : filename.replace(/\.md$/, '');
        items.push({ ...data, id, rel, body, bodyLine });
      } catch (e) {
        errors.push(`${rel}：${e.message}`);
      }
    }
  }
  const seen = new Map();
  for (const it of items) {
    const key = `${it.type}:${it.slug}`;
    if (seen.has(key)) errors.push(`${it.rel}：slug「${it.slug}」が ${seen.get(key)} と重複しています`);
    else seen.set(key, it.rel);
  }
  return { items, errors };
}

function renderBody(item, { config, md, faceExists, warnings }) {
  const parts = splitStaffBlocks(item.body, { bodyLine: item.bodyLine, staff: config.staff });
  const n = countStaff(parts);
  if (n > MAX_STAFF) warnings.push(`${item.rel}：吹き出しが${n}か所あります（目安は2〜3か所）`);
  return parts.map((p) => (p.kind === 'md'
    ? md.parse(p.text)
    : renderStaff({ id: p.id, html: md.parse(p.text) }, { staff: config.staff, faceExists }))).join('\n');
}

// 前回の生成物（目印 GENERATOR を持つ index.html）だけを消す。手で置いたページは残す。
function cleanGenerated(dir) {
  if (!fs.existsSync(dir)) return;
  const isGen = (f) => fs.existsSync(f) && fs.readFileSync(f, 'utf8').includes(`content="${GENERATOR}"`);
  for (const name of fs.readdirSync(dir)) {
    const sub = path.join(dir, name);
    if (fs.statSync(sub).isDirectory() && isGen(path.join(sub, 'index.html'))) fs.rmSync(sub, { recursive: true, force: true });
  }
  if (isGen(path.join(dir, 'index.html'))) fs.rmSync(path.join(dir, 'index.html'));
  if (!fs.readdirSync(dir).length) fs.rmSync(dir, { recursive: true, force: true });
}

function write(outDir, rel, text, written) {
  const f = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text);
  written.push(rel.replace(/\\/g, '/'));
}

const toRel = (urlPath) => urlPath.replace(/^\//, '') + (urlPath.endsWith('/') ? 'index.html' : '');

export function build({ root, contentDir, outDir, env = {}, drafts = false, today = todayJst(), feedPath, knowledgeVariant = 'cols' }) {
  root = path.resolve(root);
  outDir = path.resolve(outDir || root);
  contentDir = path.resolve(contentDir || path.join(root, 'content'));
  const config = loadConfig(path.join(root, 'content'));
  const site = resolveSite(env, config);
  const warnings = [];
  const written = [];

  // 1) 読む・検証する（誤りがあればここで止まる。まだ何も書いていない）
  const { items: all, errors } = readSources(contentDir, config);
  for (const it of all) {
    try { it.embedParsed = it.type === 'kawaraban' ? parseEmbed(it.embed) : null; }
    catch (e) { errors.push(`${it.rel}：${e.message}`); }
  }
  const md = new Marked({ gfm: true });
  const faceExists = (id) => fs.existsSync(path.join(root, 'assets/staff', id, 'face.webp'));
  for (const it of all) {
    try { it.bodyHtml = renderBody(it, { config, md, faceExists, warnings }); }
    catch (e) { errors.push(`${it.rel}：${e.message}`); }
  }
  if (errors.length) throw new Error(`原稿に誤りがあるため、ビルドを止めました（何も書いていません）\n- ${errors.join('\n- ')}`);

  // 2) 出すものを決める（下書きと未来の日付は、--drafts のときだけ noindex で出す）
  const items = [];
  for (const it of all) {
    const hidden = it.draft === true || it.date > today;
    if (hidden && !drafts) continue;
    it.isDraft = hidden;
    it.path = it.type === 'column' ? columnPath(it.slug) : kawarabanPath(it.id, site);
    it.image = it.image || config.site.og[it.type];
    items.push(it);
  }
  const byDate = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  const columns = items.filter((x) => x.type === 'column').sort(byDate);
  const kawaraban = items.filter((x) => x.type === 'kawaraban').sort(byDate);
  const publicItems = items.filter((x) => !x.isDraft);

  site.hasColumns = columns.length > 0; // 0本のときはナビとフッターに /column/ を出さない（404 にしない）

  // index.html の差し込みを先に組み立てる（目印が無ければ、何も書かずにここで止まる）
  const srcIndex = fs.existsSync(path.join(outDir, 'index.html')) ? path.join(outDir, 'index.html') : path.join(root, 'index.html');
  let indexOut = null;
  if (fs.existsSync(srcIndex)) {
    const html = fs.readFileSync(srcIndex, 'utf8');
    const next = injectBetweenMarkers(html, 'knowledge', renderKnowledge(columns, knowledgeVariant));
    if (next !== html || srcIndex !== path.join(outDir, 'index.html')) indexOut = next;
  }

  // 3) 前回の生成物を片づける
  for (const d of ['column', 'kawaraban', 'yorozuya/kawaraban']) cleanGenerated(path.join(outDir, d));

  // 4) 記事
  for (const it of items) {
    const crumbList = it.type === 'column'
      ? [{ name: 'ホーム', path: '/' }, { name: 'コラム', path: '/column/' }, { name: it.title, path: it.path }]
      : site.lpLive
        ? [{ name: 'ホーム', path: '/' }, { name: '福井「AI よろづや」', path: '/yorozuya/' }, { name: 'AI瓦版', path: site.kawarabanBase }, { name: it.title, path: it.path }]
        : [{ name: 'ホーム', path: '/' }, { name: 'AI瓦版', path: site.kawarabanBase }, { name: it.title, path: it.path }];
    const html = articlePage({
      item: it, site, config, crumbList,
      relatedItems: pickRelated(it, items),
      serviceLinkObj: serviceLink(it.service, site, config),
      bodyHtml: it.bodyHtml,
      embedHtml: renderEmbed(it.embedParsed, { title: it.title }),
      jsonld: [articleJsonLd(it, site, config), breadcrumbJsonLd(crumbList, site)],
    });
    write(outDir, toRel(it.path), html, written);
  }

  // 5) 一覧（0本なら作らない）
  let feed = null;
  const fp = feedPath || path.join(root, 'yorozuya/data/feed.json');
  if (fs.existsSync(fp)) feed = JSON.parse(fs.readFileSync(fp, 'utf8'));
  if (columns.length) write(outDir, 'column/index.html', columnListPage({ items: columns, site, config }), written);
  if (kawaraban.length) write(outDir, toRel(site.kawarabanBase), kawarabanListPage({ items: kawaraban, site, config, feed }), written);

  // 6) LP の公開後は、旧 /kawaraban/ に転送ページを残す
  if (site.legacyKawarabanBase && kawaraban.length) {
    for (const it of kawaraban) {
      write(outDir, toRel(site.legacyKawarabanBase + it.id + '/'), redirectPage({ to: it.path, site }), written);
    }
    write(outDir, toRel(site.legacyKawarabanBase), redirectPage({ to: site.kawarabanBase, site }), written);
  }

  // 7) sitemap.xml（固定ページは実在するものだけ）
  const lastOf = (xs) => xs.map((x) => x.updated || x.date).sort().pop() || null;
  const pubCol = publicItems.filter((x) => x.type === 'column');
  const pubKw = publicItems.filter((x) => x.type === 'kawaraban');
  const entries = [
    ...config.site.static_pages.filter((p) => fs.existsSync(path.join(root, p.file))).map((p) => ({ loc: site.origin + p.path, lastmod: null })),
    ...(pubCol.length ? [{ loc: site.origin + '/column/', lastmod: lastOf(pubCol) }] : []),
    ...pubCol.map((x) => ({ loc: site.origin + x.path, lastmod: x.updated || x.date })),
    ...(pubKw.length ? [{ loc: site.origin + site.kawarabanBase, lastmod: lastOf(pubKw) }] : []),
    ...pubKw.map((x) => ({ loc: site.origin + x.path, lastmod: x.updated || x.date })),
  ];
  write(outDir, 'sitemap.xml', buildSitemap(entries), written);

  // 8) content-index.json（LP の「関連コラム」「関連の瓦版」が読む）
  const index = {
    generated_by: GENERATOR,
    kawaraban_base: site.kawarabanBase,
    items: publicItems.sort(byDate).map((x) => ({
      type: x.type, id: x.id, title: x.title, description: x.description,
      date: x.date, updated: x.updated || x.date, pillar: x.pillar, service: x.service, url: x.path,
    })),
  };
  write(outDir, 'content-index.json', JSON.stringify(index, null, 2) + '\n', written);

  // 9) トップの #knowledge（index.html があるときだけ。目印が無ければ止める）
  if (indexOut !== null) write(outDir, 'index.html', indexOut, written);

  return { written, warnings, items };
}
