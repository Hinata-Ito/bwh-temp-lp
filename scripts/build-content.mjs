#!/usr/bin/env node
// content/ の原稿（コラム・AI瓦版）から HTML・一覧・sitemap.xml を作る。
//   node scripts/build-content.mjs                       … 本番（リポジトリ直下に書く）
//   node scripts/build-content.mjs --content tests/fixtures/content --out .preview --drafts   … 試作のプレビュー
// 環境変数 KAWARABAN_BASE=/kawaraban/ で、瓦版の出し先を LP 未公開用に切り替える（既定 /yorozuya/kawaraban/）。
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './lib/build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

try {
  const r = build({
    root,
    contentDir: opt('--content') ? path.resolve(opt('--content')) : path.join(root, 'content'),
    outDir: opt('--out') ? path.resolve(opt('--out')) : root,
    env: process.env,
    drafts: args.includes('--drafts'),
    today: opt('--today'),
    feedPath: opt('--feed') ? path.resolve(opt('--feed')) : undefined,
    knowledgeVariant: opt('--knowledge') || 'cols',
  });
  console.log(`書き出し ${r.written.length} 件（記事 ${r.items.length} 本）`);
  for (const w of r.warnings) console.warn(`注意：${w}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
