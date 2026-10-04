// 社員の吹き出し： :::staff <ID> … ::: を本文から切り出し、HTML にする。
// 並びは 顔のアイコン → 名前と担当 → 吹き出し（実行計画 I2）。
import { esc } from './html.mjs';

const OPEN_RE = /^:::staff(?:\s+(\S+))?\s*$/;
const CLOSE_RE = /^:::\s*$/;
const FENCE_RE = /^\s*(```|~~~)/;

export function splitStaffBlocks(body, { bodyLine = 1, staff }) {
  const lines = String(body).split('\n');
  const parts = [];
  let md = [];
  let open = null; // { id, line, text: [] }
  let fence = null;

  const flushMd = () => { if (md.length) { parts.push({ kind: 'md', text: md.join('\n') }); md = []; } };

  lines.forEach((line, i) => {
    const lineNo = bodyLine + i;
    const f = line.match(FENCE_RE);
    if (f && !open) {
      if (!fence) fence = f[1]; else if (f[1] === fence) fence = null;
      md.push(line);
      return;
    }
    if (fence) { md.push(line); return; }

    const o = line.match(OPEN_RE);
    if (o) {
      if (open) throw new Error(`${lineNo}行目：吹き出しの中に吹き出しは書けません（${open.line}行目の :::staff が閉じていません）`);
      if (!o[1]) throw new Error(`${lineNo}行目：:::staff の後ろに社員の ID を書いてください`);
      if (!staff[o[1]]) throw new Error(`${lineNo}行目：社員の ID「${o[1]}」はありません（${Object.keys(staff).join('／')}）`);
      flushMd();
      open = { id: o[1], line: lineNo, text: [] };
      return;
    }
    if (open && CLOSE_RE.test(line)) {
      parts.push({ kind: 'staff', id: open.id, text: open.text.join('\n'), line: open.line });
      open = null;
      return;
    }
    (open ? open.text : md).push(line);
  });
  if (open) throw new Error(`${open.line}行目：:::staff ${open.id} が閉じていません（::: の行が要ります）`);
  flushMd();
  return parts;
}

export function countStaff(parts) {
  return parts.filter((p) => p.kind === 'staff').length;
}

export function renderStaff({ id, html }, { staff, faceExists }) {
  const s = staff[id];
  const label = `${s.name}（${s.role}・AIのスタッフ）`;
  const face = faceExists(id)
    ? `<img class="staff-face" src="/assets/staff/${esc(id)}/face.webp" alt="${esc(label)}" width="64" height="64" loading="lazy">`
    : `<span class="staff-face is-placeholder" aria-hidden="true">${esc(s.initial)}</span>`;
  return `<aside class="staff-say" data-staff="${esc(id)}">
  ${face}
  <p class="staff-who"><span class="staff-name">${esc(s.name)}</span><span class="staff-role">${esc(s.role)}</span></p>
  <div class="staff-bubble">${html}</div>
</aside>`;
}
