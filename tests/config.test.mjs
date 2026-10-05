import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../scripts/lib/config.mjs';

const config = loadConfig(new URL('../content/', import.meta.url));
const STAFF_IDS = ['joh', 'sakura', 'sora', 'aya', 'hanabi', 'nami', 'ren', 'ryu', 'sumi', 'yui'];

test('社員10人がそろい、名前・担当・頭文字がある', () => {
  assert.deepEqual(Object.keys(config.staff).sort(), [...STAFF_IDS].sort());
  for (const id of STAFF_IDS) {
    const s = config.staff[id];
    assert.ok(s.name && s.role && s.initial, id);
    assert.equal([...s.initial].length, 1, id);
  }
});

test('サービスは5種で、LPかHPかフォームのどれかに行ける', () => {
  assert.deepEqual(Object.keys(config.services).sort(),
    ['kenshu', 'migiude', 'migiude-hr', 'migiude-strategy', 'sagyou']);
  for (const [k, s] of Object.entries(config.services)) {
    assert.ok(s.name && s.lead, k);
    assert.ok(s.lp || s.hp, k);
    if (s.lp) assert.ok(s.form_choice, `${k}: LPのサービスはフォームの選択肢が要る`);
  }
});

test('柱：コラム6種・瓦版3種', () => {
  assert.deepEqual(Object.keys(config.pillars.column).sort(),
    ['case', 'fukui-kenshu', 'hr', 'kawaraban-deep', 'subsidy', 'trial']);
  assert.deepEqual(Object.keys(config.pillars.kawaraban).sort(), ['case', 'kawaraban', 'trial']);
});

test('固定ページは / から始まり、file と対応する', () => {
  for (const p of config.site.static_pages) {
    assert.match(p.path, /^\//);
    if (p.path.endsWith('/')) assert.match(p.file, /index\.html$/);
  }
  assert.equal(config.site.origin, 'https://bwh-research.com');
});
