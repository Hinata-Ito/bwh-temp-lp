#!/usr/bin/env node
// プレビュー用の静的サーバ（依存なし）。.preview/（試作のビルド）を上に重ね、無ければリポジトリ直下を返す。
//   node scripts/preview-server.mjs [--port 4173] [--mount /yorozuya/=C:/dev/ai-yorozuya-lp/yorozuya]
// --mount で LP を同じオリジンの /yorozuya/ に差すと、LP の「関連コラム」も本番と同じ形で試せる。
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
const layers = [path.join(root, opt('--out') || '.preview'), root];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8' };

function resolve(urlPath) {
  const p = decodeURIComponent(urlPath.split('?')[0]);
  const cands = [];
  for (const m of mounts) if (p.startsWith(m.prefix)) cands.push(path.join(m.dir, p.slice(m.prefix.length)));
  for (const l of layers) cands.push(path.join(l, p));
  for (let c of cands) {
    if (!c.startsWith(path.dirname(root)) && !mounts.some((m) => c.startsWith(m.dir))) continue;
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
}).listen(port, () => console.log(`preview: http://localhost:${port}/`));
