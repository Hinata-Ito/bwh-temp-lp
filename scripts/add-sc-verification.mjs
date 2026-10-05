// Search Console の所有確認ファイル（「HTMLファイル」の方法）をリポジトリ直下に置く。
// ファイル名は、静木さんが Search Console の画面（URLプレフィックス https://bwh-research.com/）で受け取ったもの。
//   node scripts/add-sc-verification.mjs google1a2b3c4d5e6f7a8b.html
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const isValidName = n => /^google[0-9a-f]+\.html$/.test(String(n || ''));
export const verificationBody = n => `google-site-verification: ${n}`;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const n = process.argv[2];
  if (!isValidName(n)) { console.error('NG ファイル名は google<16進>.html の形'); process.exit(1); }
  fs.writeFileSync(new URL('../' + n, import.meta.url), verificationBody(n) + '\n', 'utf8');
  console.log('OK ' + n + ' を置いた。コミットしてブランチをプレビューし、公開は静木さんの承認後');
}
