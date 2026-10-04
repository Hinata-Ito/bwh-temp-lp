import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSite, columnPath, kawarabanPath, canonical, serviceLink } from '../scripts/lib/site.mjs';
import { loadConfig } from '../scripts/lib/config.mjs';

const config = loadConfig(new URL('../content/', import.meta.url));

test('既定は /yorozuya/kawaraban/（LP が出ている前提）', () => {
  const s = resolveSite({}, config);
  assert.equal(s.kawarabanBase, '/yorozuya/kawaraban/');
  assert.equal(s.lpLive, true);
  assert.equal(s.legacyKawarabanBase, '/kawaraban/');
  assert.equal(s.origin, 'https://bwh-research.com');
});

test('KAWARABAN_BASE=/kawaraban/ は LP 未公開の扱い', () => {
  const s = resolveSite({ KAWARABAN_BASE: '/kawaraban/' }, config);
  assert.equal(s.kawarabanBase, '/kawaraban/');
  assert.equal(s.lpLive, false);
  assert.equal(s.legacyKawarabanBase, null);
});

test('前後のスラッシュの書き漏れは補い、それ以外の値は止める', () => {
  assert.equal(resolveSite({ KAWARABAN_BASE: '/kawaraban' }, config).kawarabanBase, '/kawaraban/');
  assert.equal(resolveSite({ KAWARABAN_BASE: 'yorozuya/kawaraban/' }, config).kawarabanBase, '/yorozuya/kawaraban/');
  assert.throws(() => resolveSite({ KAWARABAN_BASE: '/foo/' }, config), /KAWARABAN_BASE/);
  assert.equal(resolveSite({ KAWARABAN_BASE: '' }, config).kawarabanBase, '/yorozuya/kawaraban/');
});

test('URL と canonical', () => {
  const s = resolveSite({}, config);
  assert.equal(columnPath('abc'), '/column/abc/');
  assert.equal(kawarabanPath('20261026-x', s), '/yorozuya/kawaraban/20261026-x/');
  assert.equal(canonical('/column/abc/', s), 'https://bwh-research.com/column/abc/');
});

test('サービスの案内：LP が出ていれば LP へ', () => {
  const s = resolveSite({}, config);
  assert.deepEqual(serviceLink('kenshu', s, config), { href: '/yorozuya/kenshu/', kind: 'lp' });
  assert.deepEqual(serviceLink('migiude-hr', s, config), { href: '/migiude-hr.html', kind: 'hp' });
});

test('サービスの案内：LP が未公開ならフォーム（そのサービスを選んだ状態）', () => {
  const s = resolveSite({ KAWARABAN_BASE: '/kawaraban/' }, config);
  const l = serviceLink('kenshu', s, config);
  assert.equal(l.kind, 'form');
  assert.ok(l.href.startsWith(config.site.form + '?usp=pp_url&entry.1036629582='));
  assert.ok(l.href.endsWith(encodeURIComponent('現場AI研修')));
  assert.deepEqual(serviceLink('migiude-strategy', s, config), { href: '/migiude-strategy.html', kind: 'hp' });
});
