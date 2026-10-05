#!/usr/bin/env node
// プレビュー用の静的サーバ（依存なし・手元専用）。.preview/（試作のビルド）を上に重ね、無ければリポジトリ直下を返す。
//   node scripts/preview-server.mjs [--port 4173] [--mount /yorozuya/=C:/dev/ai-yorozuya-lp/yorozuya]
// --mount で LP を同じオリジンの /yorozuya/ に差すと、LP の「関連コラム」も本番と同じ形で試せる。
// 127.0.0.1 だけで待ち受け、各層（.preview・リポジトリ直下・マウント先）の外のファイルは返さない。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const port = Number(opt('--port') || 4173);
const mounts = [];
args.forEach((a, i) => {
  if (a === '--mount') { const [prefix, dir] = args[i + 1].split('='); mounts.push({ prefix, dir: path.resolve(dir) }); }
});
const layers = [path.resolve(root, opt('--out') || '.preview'), root];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8' };

// base の中に収まるときだけパスを返す（.. や %2e%2e で外へ出られない）
function inside(base, rel) {
  const p = path.resolve(base, '.' + path.sep + rel);
  return p === base || p.startsWith(base + path.sep) ? p : null;
}

function resolve(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath.split('?')[0]); } catch { return null; }
  if (p.includes('\0')) return null;
  const cands = [];
  for (const m of mounts) if (p.startsWith(m.prefix)) cands.push(inside(m.dir, p.slice(m.prefix.length)));
  for (const l of layers) cands.push(inside(l, p));
  for (let c of cands) {
    if (!c) continue;
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) c = path.join(c, 'index.html');
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

http.createServer((req, res) => {
  const f = resolve(req.url);
  if (!f) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('404'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`preview: http://127.0.0.1:${port}/`));
