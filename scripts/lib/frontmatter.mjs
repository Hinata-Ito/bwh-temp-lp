// 原稿の前付け（--- で挟んだメタ情報）を読む。
// YAML の全部は読まない。読むのは「キー: 値」「1段の入れ子（キー: 値）」「- の配列」「引用符」「# コメント」「true/false」だけ。
// それ以外の書き方は、黙って読み違えるより止めるほうが安全なので、行番号つきで throw する。

const KEY_RE = /^([A-Za-z_][\w-]*):(.*)$/;

function scalar(raw, lineNo) {
  let v = raw.trim();
  if (v === '') return '';
  if (v[0] === '"' || v[0] === "'") {
    const q = v[0];
    const end = v.indexOf(q, 1);
    if (end < 0) throw new Error(`前付けの${lineNo}行目：引用符が閉じていません`);
    const rest = v.slice(end + 1).trim();
    if (rest && !rest.startsWith('#')) throw new Error(`前付けの${lineNo}行目：引用符の後ろに文字があります`);
    return v.slice(1, end);
  }
  v = v.replace(/\s+#.*$/, '').trim();
  if (v[0] === '[' || v[0] === '{' || v[0] === '|' || v[0] === '>') {
    throw new Error(`前付けの${lineNo}行目：この書き方（${v[0]}）は読めません。配列は「- 」の行で書いてください`);
  }
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}

export function parseFrontmatter(text) {
  const src = String(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const lines = src.split('\n');
  if (lines[0].trimEnd() !== '---') throw new Error('前付け（先頭の ---）がありません');
  const close = lines.findIndex((l, i) => i > 0 && l.trimEnd() === '---');
  if (close < 0) throw new Error('前付けが閉じていません（2つ目の --- がありません）');

  const data = {};
  let container = null; // { key, kind: 'map'|'list'|null }
  for (let i = 1; i < close; i++) {
    const lineNo = i; // 前付けの中の行番号（1始まり）
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    if (!/^\s/.test(line)) {
      const m = line.match(KEY_RE);
      if (!m) throw new Error(`前付けの${lineNo}行目：「キー: 値」の形になっていません`);
      const [, key, rest] = m;
      if (key in data) throw new Error(`前付けの${lineNo}行目：キー「${key}」が重複しています`);
      const value = scalar(rest, lineNo);
      if (value === '') { data[key] = null; container = { key, kind: null }; }
      else { data[key] = value; container = null; }
      continue;
    }

    if (!container) throw new Error(`前付けの${lineNo}行目：字下げされた行の親のキーがありません`);
    const body = line.trim();
    if (body.startsWith('- ') || body === '-') {
      if (container.kind === 'map') throw new Error(`前付けの${lineNo}行目：「- 」と「キー: 値」が混ざっています`);
      if (container.kind === null) { data[container.key] = []; container.kind = 'list'; }
      data[container.key].push(scalar(body.slice(1), lineNo));
    } else {
      const m = body.match(KEY_RE);
      if (!m) throw new Error(`前付けの${lineNo}行目：「キー: 値」の形になっていません`);
      if (container.kind === 'list') throw new Error(`前付けの${lineNo}行目：「- 」と「キー: 値」が混ざっています`);
      if (container.kind === null) { data[container.key] = {}; container.kind = 'map'; }
      if (m[1] in data[container.key]) throw new Error(`前付けの${lineNo}行目：キー「${m[1]}」が重複しています`);
      data[container.key][m[1]] = scalar(m[2], lineNo);
    }
  }
  return { data, body: lines.slice(close + 1).join('\n'), bodyLine: close + 2 };
}
