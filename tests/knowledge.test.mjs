import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderKnowledge, injectBetweenMarkers } from '../templates/knowledge.mjs';

const col = (id, date) => ({ id, path: `/column/${id}/`, title: `記事${id}`, date });

test('0本なら何も出さない（今の note だけの表示のまま）', () => {
  assert.equal(renderKnowledge([], 'cols'), '');
  assert.equal(renderKnowledge([], 'tabs'), '');
});

test('新しい順に3本まで', () => {
  const html = renderKnowledge([col('a', '2026-10-01'), col('b', '2026-10-20'), col('c', '2026-10-10'), col('d', '2026-10-05')]);
  const order = [...html.matchAll(/\/column\/(\w)\//g)].map((m) => m[1]);
  assert.deepEqual(order, ['b', 'c', 'd']);
  assert.match(html, /href="\/column\/"/);
});

test('案Bはタブと切り替えの JS つき', () => {
  const html = renderKnowledge([col('a', '2026-10-01')], 'tabs');
  assert.match(html, /role="tablist"/);
  assert.match(html, /data-kc-tab="note"/);
  assert.match(html, /\/assets\/content\.js/);
});

test('目印の外は1バイトも変えない', () => {
  const before = '<head>\n<title>t</title></head>\n<p>前</p>\n<!-- build-content:knowledge:start -->\n古い中身\n<!-- build-content:knowledge:end -->\n<p>後</p>\n';
  const after = injectBetweenMarkers(before, 'knowledge', '<div>新</div>');
  assert.ok(after.startsWith('<head>\n<title>t</title></head>\n<p>前</p>\n<!-- build-content:knowledge:start -->\n<div>新</div>\n'));
  assert.ok(after.endsWith('<!-- build-content:knowledge:end -->\n<p>後</p>\n'));
  assert.doesNotMatch(after, /古い中身/);
  assert.equal(injectBetweenMarkers(after, 'knowledge', '<div>新</div>'), after); // 何度回しても同じ
});

test('目印が無ければ止める', () => {
  assert.throws(() => injectBetweenMarkers('<p>x</p>', 'knowledge', 'a'), /目印/);
});

test('本物の index.html：目印は #knowledge の中にあり、head より後ろ', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const i = html.indexOf('<!-- build-content:knowledge:start -->');
  assert.ok(i > html.indexOf('id="knowledge"'));
  assert.ok(i > html.indexOf('</head>'));
  assert.ok(i < html.indexOf('knowledge-coming-soon'));
});
