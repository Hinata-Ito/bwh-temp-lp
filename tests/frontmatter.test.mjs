import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '../scripts/lib/frontmatter.mjs';

const doc = (fm, body = '本文') => `---\n${fm}\n---\n${body}`;

test('キーと値・入れ子1段・配列・コメントを読む', () => {
  const { data, body, bodyLine } = parseFrontmatter(doc([
    'title: 福井の会社がAIを使う手順',
    'slug: fukui-ai   # 行末のコメント',
    '# 行のコメント',
    'embed:',
    '  type: youtube',
    '  url: https://www.youtube.com/watch?v=abcdefghijk',
    'sources:',
    '  - https://www.mhlw.go.jp/a',
    '  - https://www.mhlw.go.jp/b',
  ].join('\n'), '\n本文です'));
  assert.equal(data.title, '福井の会社がAIを使う手順');
  assert.equal(data.slug, 'fukui-ai');
  assert.deepEqual(data.embed, { type: 'youtube', url: 'https://www.youtube.com/watch?v=abcdefghijk' });
  assert.deepEqual(data.sources, ['https://www.mhlw.go.jp/a', 'https://www.mhlw.go.jp/b']);
  assert.equal(body.trim(), '本文です');
  assert.equal(bodyLine, 12); // 閉じの --- の次の行（ファイルの行番号）
});

test('値の中のコロンと #（URLの断片）はそのまま', () => {
  const { data } = parseFrontmatter(doc('title: 結論：30分が5分に\nurl: https://example.com/a#b'));
  assert.equal(data.title, '結論：30分が5分に');
  assert.equal(data.url, 'https://example.com/a#b');
});

test('引用符つきの値・真偽値', () => {
  const { data } = parseFrontmatter(doc('title: "引用 # でもコメントでない"\nnote: \'単\'\ndraft: true'));
  assert.equal(data.title, '引用 # でもコメントでない');
  assert.equal(data.note, '単');
  assert.equal(data.draft, true);
});

test('CRLF と BOM', () => {
  const { data, body } = parseFrontmatter('﻿---\r\ntitle: あ\r\n---\r\n本文\r\n');
  assert.equal(data.title, 'あ');
  assert.equal(body.trim(), '本文');
});

test('前付けが無い・閉じていないときは止める', () => {
  assert.throws(() => parseFrontmatter('本文だけ'), /前付け/);
  assert.throws(() => parseFrontmatter('---\ntitle: a\n本文'), /前付け/);
});

test('読めない書き方は行番号つきで止める', () => {
  assert.throws(() => parseFrontmatter(doc('title: a\n  ぶら下がり')), /2行目/);
  assert.throws(() => parseFrontmatter(doc('tags: [a, b]')), /1行目/);
  assert.throws(() => parseFrontmatter(doc('title: a\ntitle: b')), /重複/);
});
