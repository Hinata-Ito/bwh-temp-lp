// robots.txt と Search Console の所有確認ファイルのテスト。 node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { verificationBody, isValidName } from '../scripts/add-sc-verification.mjs';

test('所有確認ファイルの中身', () => {
  assert.equal(verificationBody('google1a2b3c4d5e6f7a8b.html'), 'google-site-verification: google1a2b3c4d5e6f7a8b.html');
});

test('名前の形を確かめる', () => {
  assert.ok(isValidName('google1a2b3c4d5e6f7a8b.html'));
  assert.ok(!isValidName('../google1.html'));
  assert.ok(!isValidName('googleXYZ.html'));
  assert.ok(!isValidName('google1a2b.htm'));
  assert.ok(!isValidName(''));
});

test('robots.txt が全体を許可し、sitemap を指す', () => {
  const s = fs.readFileSync(new URL('../robots.txt', import.meta.url), 'utf8');
  assert.match(s, /^User-agent: \*$/m);
  assert.match(s, /^Allow: \/$/m);
  assert.match(s, /^Sitemap: https:\/\/bwh-research\.com\/sitemap\.xml$/m);
  assert.doesNotMatch(s, /^Disallow: \/\s*$/m);
});

test('置いてある所有確認ファイルは正しい中身', () => {
  const files = fs.readdirSync(new URL('..', import.meta.url)).filter(isValidName);
  for (const f of files) {
    assert.equal(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8').trim(), verificationBody(f));
  }
});
