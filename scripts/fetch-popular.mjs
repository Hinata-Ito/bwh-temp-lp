#!/usr/bin/env node
// GA4 から解説記事（/yorozuya/articles/<id>/）の閲覧数を取り、多い順に yorozuya/data/popular.json へ書く（依存なし）。
// よろづやトップの「AIの解説記事」は、この順で上から3枚を出す（yorozuya.js の data-popular）。
//   GA4_PROPERTY_ID=123456789 GA4_SA_KEY='{"client_email":…,"private_key":…}' node scripts/fetch-popular.mjs [--days 30] [--dry]
// GA4_SA_KEY の代わりに GA4_SA_KEY_FILE（鍵の JSON のパス）でもよい。鍵は GA4 の閲覧者権限だけを持つサービスアカウントのもの。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = '/yorozuya/articles/';
const OUT = path.join(root, 'yorozuya', 'data', 'popular.json');

// GA4 の行（pagePath と閲覧数）を、記事ごとの閲覧数の多い順にまとめる。
// 末尾の / や index.html の有無で分かれた行は1つに足し、今ある記事（known）以外は捨てる。
export function rankArticles(rows, known) {
  const views = new Map();
  for (const r of rows) {
    const m = String(r.path || '').split(/[?#]/)[0].match(/^\/yorozuya\/articles\/([^/]+)(?:\/(?:index\.html)?)?$/);
    if (!m || !known.has(m[1])) continue;
    const p = PREFIX + m[1] + '/';
    views.set(p, (views.get(p) || 0) + (Number(r.views) || 0));
  }
  return [...views].filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([p, v]) => ({ path: p, views: v }));
}

function b64url(x) { return Buffer.from(x).toString('base64url'); }

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: key.client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  }));
  const sig = crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(key.private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: head + '.' + claim + '.' + sig }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error('トークンを取れません: ' + (j.error_description || j.error || res.status));
  return j.access_token;
}

async function report(propertyId, token, days) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'yesterday' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: PREFIX } } },
      limit: 1000,
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error('GA4 の集計を取れません: ' + (j.error?.message || res.status));
  return (j.rows || []).map((r) => ({ path: r.dimensionValues[0].value, views: r.metricValues[0].value }));
}

async function main() {
  const args = process.argv.slice(2);
  const days = Number(args[args.indexOf('--days') + 1]) || 30;
  const propertyId = process.env.GA4_PROPERTY_ID;
  const raw = process.env.GA4_SA_KEY || (process.env.GA4_SA_KEY_FILE && fs.readFileSync(process.env.GA4_SA_KEY_FILE, 'utf8'));
  if (!propertyId || !raw) {
    console.error('GA4_PROPERTY_ID と GA4_SA_KEY（または GA4_SA_KEY_FILE）が要ります。');
    process.exit(1);
  }
  const known = new Set(fs.readdirSync(path.join(root, 'yorozuya', 'articles'), { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name));
  const items = rankArticles(await report(propertyId, await accessToken(JSON.parse(raw)), days), known);

  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  if (JSON.stringify(prev.items) === JSON.stringify(items) && prev.days === days) {
    console.log('変わりなし（' + items.length + '本）');
    return;
  }
  const out = { updated: new Date().toISOString().slice(0, 10), days, basis: `GA4 の表示回数（直近${days}日・前日まで）`, items };
  if (args.includes('--dry')) { console.log(JSON.stringify(out, null, 2)); return; }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log('書き出し：' + items.map((x) => x.path.slice(PREFIX.length, -1) + '=' + x.views).join(', '));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
