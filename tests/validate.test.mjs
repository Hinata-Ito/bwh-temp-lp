import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateMeta } from '../scripts/lib/validate.mjs';
import { loadConfig } from '../scripts/lib/config.mjs';

const config = loadConfig(new URL('../content/', import.meta.url));

const columnOk = {
  title: '福井の中小企業がAI研修で人材開発支援助成金を使う手順',
  slug: 'jinzai-kaihatsu-ai-kenshu-fukui',
  date: '2026-10-20',
  updated: '2026-10-20',
  type: 'column',
  pillar: 'subsidy',
  service: 'kenshu',
  description: '要約',
  sources: ['https://www.mhlw.go.jp/a'],
};
const kawarabanOk = {
  title: 'Runway が動画生成の新モデルを公開',
  slug: 'runway-gen5',
  date: '2026-10-26',
  type: 'kawaraban',
  pillar: 'kawaraban',
  service: 'sagyou',
  description: '要約',
  embed: { type: 'youtube', url: 'https://www.youtube.com/watch?v=abcdefghijk' },
  card_id: '20261026-runway-gen5',
};
const col = (over, filename = 'jinzai-kaihatsu-ai-kenshu-fukui.md') =>
  validateMeta({ ...columnOk, ...over }, { dir: 'column', filename, config });
const kw = (over, filename = '20261026-runway-gen5.md') =>
  validateMeta({ ...kawarabanOk, ...over }, { dir: 'kawaraban', filename, config });
const has = (errs, word) => assert.ok(errs.some(e => e.includes(word)), `「${word}」を含む誤りが無い: ${JSON.stringify(errs)}`);

test('正しい原稿は誤りなし', () => {
  assert.deepEqual(col({}), []);
  assert.deepEqual(kw({}), []);
});

test('必須欄の欠け', () => {
  for (const k of ['title', 'slug', 'date', 'type', 'pillar', 'service', 'description']) {
    has(col({ [k]: undefined }), k);
  }
});

test('type とフォルダの不一致', () => has(col({ type: 'kawaraban' }), 'type'));

test('柱はその type の一覧から', () => {
  has(col({ pillar: 'kawaraban' }), 'pillar');
  has(kw({ pillar: 'subsidy' }), 'pillar');
  assert.deepEqual(kw({ pillar: 'trial' }), []);
});

test('サービスの綴り違い', () => has(col({ service: 'kensyu' }), 'service'));

test('slug の形とファイル名', () => {
  has(col({ slug: 'Jinzai_AI' }, 'Jinzai_AI.md'), 'slug');
  has(col({}, 'other-name.md'), 'ファイル名');
});

test('実在しない日付・updated が date より前', () => {
  has(col({ date: '2026-02-30' }), 'date');
  has(col({ date: '2026/10/20' }), 'date');
  has(col({ updated: '2026-10-19' }), 'updated');
});

test('description は120字まで', () => {
  assert.deepEqual(col({ description: 'あ'.repeat(120) }), []);
  has(col({ description: 'あ'.repeat(121) }), 'description');
});

test('瓦版：ファイル名の形・日付・card_id', () => {
  has(kw({}, 'runway-gen5.md'), 'ファイル名');
  has(kw({ date: '2026-10-27' }), 'ファイル名の日付');
  has(kw({ card_id: undefined }), 'card_id');
});

test('瓦版：embed の type', () => {
  has(kw({ embed: { type: 'tiktok', url: 'https://www.tiktok.com/x' } }), 'embed');
  assert.deepEqual(kw({ embed: { type: 'none' } }), []);
  assert.deepEqual(kw({ embed: undefined }), []);
});

test('コラムに embed・card_id があっても止めない（無視する）', () => {
  assert.deepEqual(col({ card_id: 'x' }), []);
});

test('sources は https の URL だけ', () => {
  has(col({ sources: ['http://example.com'] }), 'sources');
  has(col({ sources: 'https://example.com' }), 'sources');
});

test('「実質無料」は止める', () => {
  has(col({ title: 'AI研修が実質無料に' }), '実質無料');
  has(col({ description: '実質無料で受けられる' }), '実質無料');
});
