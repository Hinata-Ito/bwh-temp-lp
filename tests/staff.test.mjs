import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitStaffBlocks, renderStaff, countStaff } from '../scripts/lib/staff.mjs';
import { loadConfig } from '../scripts/lib/config.mjs';

const { staff } = loadConfig(new URL('../content/', import.meta.url));

test('本文と吹き出しに分ける（行番号はファイルの行）', () => {
  const body = ['前の段落', '', ':::staff sora', '福井の工務店なら、**施工事例**の動画に。', ':::', '', '後ろの段落'].join('\n');
  const parts = splitStaffBlocks(body, { bodyLine: 10, staff });
  assert.equal(parts.length, 3);
  assert.equal(parts[0].kind, 'md');
  assert.deepEqual({ ...parts[1], text: parts[1].text.trim() },
    { kind: 'staff', id: 'sora', text: '福井の工務店なら、**施工事例**の動画に。', line: 12 });
  assert.match(parts[2].text, /後ろの段落/);
});

test('知らない社員ID は行番号つきで止める', () => {
  assert.throws(() => splitStaffBlocks('\n:::staff tanaka\nこんにちは\n:::', { bodyLine: 5, staff }), /6行目.*tanaka/);
});

test('ID の書き忘れも止める', () => {
  assert.throws(() => splitStaffBlocks(':::staff\nこんにちは\n:::', { bodyLine: 1, staff }), /1行目/);
});

test('閉じ忘れは開いた行の番号で止める', () => {
  assert.throws(() => splitStaffBlocks('a\n:::staff aya\nコツです\n\n続きの段落', { bodyLine: 20, staff }), /21行目.*閉じ/);
});

test('吹き出しの中に吹き出しは書けない', () => {
  assert.throws(() => splitStaffBlocks(':::staff aya\n:::staff sumi\nx\n:::\n:::', { bodyLine: 1, staff }), /2行目/);
});

test('コードの囲みの中の :::staff は変換しない', () => {
  const body = '```\n:::staff sora\n例\n:::\n```';
  const parts = splitStaffBlocks(body, { bodyLine: 1, staff });
  assert.equal(parts.length, 1);
  assert.equal(parts[0].kind, 'md');
});

test('顔→名前と担当→吹き出しの順。alt に名前と担当', () => {
  const html = renderStaff({ id: 'sumi', html: '<p>料金に注意</p>' }, { staff, faceExists: () => true });
  const iFace = html.indexOf('staff-face');
  const iName = html.indexOf('今立 スミ');
  const iBubble = html.indexOf('料金に注意');
  assert.ok(iFace >= 0 && iFace < iName && iName < iBubble, html);
  assert.match(html, /<img[^>]+src="\/assets\/staff\/sumi\/face\.webp"[^>]+alt="今立 スミ（資料づくりの担当・AIのスタッフ）"/);
  assert.match(html, /data-staff="sumi"/);
});

test('顔の画像がまだ無いときは仮の丸（頭文字）', () => {
  const html = renderStaff({ id: 'sora', html: '<p>x</p>' }, { staff, faceExists: () => false });
  assert.match(html, /<span class="staff-face is-placeholder" aria-hidden="true">ソ<\/span>/);
  assert.doesNotMatch(html, /<img/);
});

test('吹き出しの数を数える', () => {
  const parts = splitStaffBlocks(':::staff aya\na\n:::\n\n:::staff sumi\nb\n:::', { bodyLine: 1, staff });
  assert.equal(countStaff(parts), 2);
});
