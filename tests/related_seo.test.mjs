import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickRelated } from '../scripts/lib/related.mjs';
import { buildSitemap, articleJsonLd, breadcrumbJsonLd, jsonLdScript } from '../scripts/lib/seo.mjs';
import { loadConfig } from '../scripts/lib/config.mjs';
import { resolveSite } from '../scripts/lib/site.mjs';

const config = loadConfig(new URL('../content/', import.meta.url));
const site = resolveSite({}, config);
const it = (id, over = {}) => ({ id, type: 'column', pillar: 'trial', service: 'sagyou', date: '2026-10-01', ...over });

test('1本だけなら関連は0', () => {
  const a = it('a');
  assert.deepEqual(pickRelated(a, [a]), []);
});

test('同じ type だけ。同じ柱 → 同じサービス → 新しい順', () => {
  const me = it('me', { pillar: 'subsidy', service: 'kenshu' });
  const items = [
    me,
    it('k1', { type: 'kawaraban', pillar: 'subsidy', service: 'kenshu' }),
    it('old-same-pillar', { pillar: 'subsidy', date: '2026-01-01' }),
    it('new-other', { pillar: 'hr', service: 'migiude-hr', date: '2026-12-01' }),
    it('same-service', { pillar: 'trial', service: 'kenshu', date: '2026-02-01' }),
    it('newer-same-pillar', { pillar: 'subsidy', date: '2026-03-01' }),
  ];
  assert.deepEqual(pickRelated(me, items).map((x) => x.id), ['newer-same-pillar', 'old-same-pillar', 'same-service']);
});

test('sitemap：XML のエスケープと lastmod', () => {
  const xml = buildSitemap([
    { loc: 'https://bwh-research.com/', lastmod: null },
    { loc: 'https://bwh-research.com/column/a/?x=1&y=2', lastmod: '2026-10-20' },
  ]);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<loc>https:\/\/bwh-research.com\/column\/a\/\?x=1&amp;y=2<\/loc><lastmod>2026-10-20<\/lastmod>/);
  assert.match(xml, /<url><loc>https:\/\/bwh-research.com\/<\/loc><\/url>/);
});

test('Article の構造化データ', () => {
  const item = { title: 'T', description: 'D', date: '2026-10-20', updated: '2026-10-22', path: '/column/t/', type: 'column', image: '/assets/og/column.png' };
  const ld = articleJsonLd(item, site, config);
  assert.equal(ld['@type'], 'Article');
  assert.equal(ld.headline, 'T');
  assert.equal(ld.datePublished, '2026-10-20');
  assert.equal(ld.dateModified, '2026-10-22');
  assert.equal(ld.author.name, '静木 銀蔵');
  assert.equal(ld.publisher.name, '合同会社 BWH総合研究所');
  assert.equal(ld.mainEntityOfPage['@id'], 'https://bwh-research.com/column/t/');
  assert.equal(ld.image[0], 'https://bwh-research.com/assets/og/column.png');
});

test('updated が無ければ dateModified は date', () => {
  const ld = articleJsonLd({ title: 'T', description: 'D', date: '2026-10-20', path: '/column/t/', type: 'column', image: '/x.png' }, site, config);
  assert.equal(ld.dateModified, '2026-10-20');
});

test('パンくずの構造化データ', () => {
  const ld = breadcrumbJsonLd([{ name: 'ホーム', path: '/' }, { name: 'コラム', path: '/column/' }, { name: 'T', path: '/column/t/' }], site);
  assert.equal(ld.itemListElement.length, 3);
  assert.deepEqual(ld.itemListElement[1], { '@type': 'ListItem', position: 2, name: 'コラム', item: 'https://bwh-research.com/column/' });
});

test('</script> が入っても script を閉じない', () => {
  const s = jsonLdScript({ headline: 'a</script><script>alert(1)</script>' });
  assert.equal((s.match(/<\/script>/g) || []).length, 1);
  assert.ok(JSON.parse(s.replace(/^<script type="application\/ld\+json">/, '').replace(/<\/script>$/, '')));
});
