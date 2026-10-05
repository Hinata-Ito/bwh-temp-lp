import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEmbed, renderEmbed } from '../scripts/lib/embed.mjs';

const ID = 'dQw4w9WgXcQ';

test('YouTube の URL の形を受ける', () => {
  for (const url of [
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=30s`,
    `https://m.youtube.com/watch?feature=share&v=${ID}`,
    `https://youtu.be/${ID}?si=abc`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
  ]) {
    assert.deepEqual(parseEmbed({ type: 'youtube', url }), { type: 'youtube', id: ID }, url);
  }
});

test('YouTube：形が違えば止める', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=short',
    'https://evil.example.com/watch?v=' + ID,
    'javascript:alert(1)',
    'http://www.youtube.com/watch?v=' + ID,
    'https://www.youtube.com/channel/UCxxxx',
  ]) {
    assert.throws(() => parseEmbed({ type: 'youtube', url }), /YouTube/, url);
  }
});

test('X の投稿URL', () => {
  assert.deepEqual(parseEmbed({ type: 'x', url: 'https://x.com/OpenAI/status/1849000000000000001' }),
    { type: 'x', url: 'https://twitter.com/OpenAI/status/1849000000000000001', user: 'OpenAI', statusId: '1849000000000000001' });
  assert.deepEqual(parseEmbed({ type: 'x', url: 'https://twitter.com/runwayml/status/123?s=20' }).statusId, '123');
  for (const url of ['https://x.com/OpenAI', 'https://x.com/i/spaces/1', 'https://evil.com/a/status/1', 'https://x.com/a/status/abc']) {
    assert.throws(() => parseEmbed({ type: 'x', url }), /X/, url);
  }
});

test('none と未指定は null', () => {
  assert.equal(parseEmbed({ type: 'none' }), null);
  assert.equal(parseEmbed(undefined), null);
  assert.equal(parseEmbed(null), null);
});

test('YouTube は押すまで読み込まない（iframe を最初から置かない）', () => {
  const html = renderEmbed({ type: 'youtube', id: ID }, { title: '新モデル <公開>' });
  assert.doesNotMatch(html, /<iframe/);
  assert.match(html, /data-embed-id="dQw4w9WgXcQ"/);
  assert.match(html, /i\.ytimg\.com\/vi\/dQw4w9WgXcQ\//);
  assert.match(html, /<button[^>]*>/);
  assert.match(html, /新モデル &lt;公開&gt;/);
  assert.match(html, /youtube\.com\/watch\?v=dQw4w9WgXcQ/); // JS が動かないときのリンク
});

test('X は公式の blockquote と widgets.js', () => {
  const html = renderEmbed(parseEmbed({ type: 'x', url: 'https://x.com/OpenAI/status/123' }), { title: 't' });
  assert.match(html, /<blockquote class="twitter-tweet"/);
  assert.match(html, /href="https:\/\/twitter\.com\/OpenAI\/status\/123"/);
  assert.match(html, /platform\.twitter\.com\/widgets\.js/);
  assert.match(html, /data-embed-id="x-123"/);
});

test('null は空文字', () => assert.equal(renderEmbed(null, {}), ''));
