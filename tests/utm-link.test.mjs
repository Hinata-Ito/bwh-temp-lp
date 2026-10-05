// scripts/utm-link.mjs のテスト。 node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildUtmUrl } from '../scripts/utm-link.mjs';

const K = 'https://bwh-research.com/yorozuya/kawaraban/';

test('IG のプロフィールのリンク（campaign は profile）', () => {
  assert.equal(buildUtmUrl({ base: K, platform: 'instagram', placement: 'profile' }),
    K + '?utm_source=instagram&utm_medium=social&utm_campaign=profile');
});

test('IG のキャプション・投稿は押せないので拒む（Review Focus 1）', () => {
  assert.throws(() => buildUtmUrl({ base: K, platform: 'instagram', placement: 'caption', campaign: 'kawaraban_20261026' }), /押せない/);
  assert.throws(() => buildUtmUrl({ base: K, platform: 'instagram', placement: 'post', campaign: 'kawaraban_20261026' }), /押せない/);
  assert.throws(() => buildUtmUrl({ base: K, platform: 'instagram' }), /押せない/);
});

test('IG のストーリーズのリンクスタンプ', () => {
  assert.equal(buildUtmUrl({ base: K + '20261026-runway-gen5/', platform: 'instagram', placement: 'story', campaign: 'kawaraban_20261026', content: 'reel_hanabi' }),
    K + '20261026-runway-gen5/?utm_source=instagram&utm_medium=social&utm_campaign=kawaraban_20261026&utm_content=reel_hanabi');
});

test('FB の投稿は押せるので投稿ごとに付ける', () => {
  assert.equal(buildUtmUrl({ base: 'https://bwh-research.com/column/jinzai/', platform: 'facebook', placement: 'post', campaign: 'column_jinzai', content: 'carousel_sora' }),
    'https://bwh-research.com/column/jinzai/?utm_source=facebook&utm_medium=social&utm_campaign=column_jinzai&utm_content=carousel_sora');
});

test('セミナーのQRは medium=qr、メールは email、note は referral', () => {
  assert.match(buildUtmUrl({ base: 'https://bwh-research.com/yorozuya/', platform: 'seminar', placement: 'qr', campaign: 'seminar_20261110_fukui' }), /\?utm_source=seminar&utm_medium=qr&utm_campaign=seminar_20261110_fukui$/);
  assert.match(buildUtmUrl({ base: 'https://bwh-research.com/yorozuya/', platform: 'flyer', placement: 'qr', campaign: 'seminar_20261110_fukui' }), /utm_medium=qr/);
  assert.match(buildUtmUrl({ base: 'https://bwh-research.com/column/a/', platform: 'email', placement: 'mail', campaign: 'column_a' }), /utm_medium=email/);
  assert.match(buildUtmUrl({ base: 'https://bwh-research.com/column/a/', platform: 'note', placement: 'article', campaign: 'column_a' }), /utm_medium=referral/);
});

test('決まりにない値は拒む', () => {
  assert.throws(() => buildUtmUrl({ base: K, platform: 'tiktok', placement: 'profile' }), /platform/);
  assert.throws(() => buildUtmUrl({ base: K, platform: 'facebook', placement: 'post', campaign: 'Kawaraban 1026' }), /campaign/);
  assert.throws(() => buildUtmUrl({ base: K, platform: 'facebook', placement: 'post' }), /campaign/);
  assert.throws(() => buildUtmUrl({ base: K, platform: 'facebook', placement: 'post', campaign: 'kawaraban_20261026', content: 'reel_taro' }), /content/);
  assert.throws(() => buildUtmUrl({ base: K, platform: 'facebook', placement: 'billboard', campaign: 'kawaraban_20261026' }), /placement/);
  assert.throws(() => buildUtmUrl({ base: 'bwh-research.com/x', platform: 'facebook', placement: 'post', campaign: 'column_x' }), /base/);
});

test('既に ? があるURLにも正しく足し、UTM が既にあれば拒む', () => {
  assert.equal(buildUtmUrl({ base: K + '?a=1', platform: 'instagram', placement: 'profile' }), K + '?a=1&utm_source=instagram&utm_medium=social&utm_campaign=profile');
  assert.throws(() => buildUtmUrl({ base: K + '?utm_source=x', platform: 'instagram', placement: 'profile' }), /既に/);
});

test('CLI で1本作れて、IG のキャプションでは exit 1', () => {
  const cli = fileURLToPath(new URL('../scripts/utm-link.mjs', import.meta.url));
  assert.equal(execFileSync(process.execPath, [cli, '--base', K, '--platform', 'instagram', '--placement', 'profile'], { encoding: 'utf8' }).trim(),
    K + '?utm_source=instagram&utm_medium=social&utm_campaign=profile');
  assert.throws(() => execFileSync(process.execPath, [cli, '--base', K, '--platform', 'instagram', '--placement', 'caption', '--campaign', 'kawaraban_20261026'], { stdio: 'pipe' }));
});
