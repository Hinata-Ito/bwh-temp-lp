#!/usr/bin/env node
/**
 * Note RSS取得 → note-feed.json 書き出し
 * GitHub Actions上で定期実行する想定（依存ゼロ、Node20+のみ）。
 */
'use strict';

const https = require('https');
const fs = require('fs');

const NOTE_USER = 'ginzoshizuki_bwh';
const MAGAZINES = {
  cases:     'm582db0aec069', // BWH支援事例
  knowledge: 'm17ec54167d82'  // BWH知見・講演
};
const MAX_ITEMS = 6;

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'BWH-Site-Bot/1.0 (+https://bwh-research.com)' } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 3) {
        return resolve(get(res.headers.location, redirects + 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode));
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

function stripCdata(s) {
  return String(s).replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
}

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function tagText(item, tag) {
  const re = new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>');
  const m = item.match(re);
  return m ? stripCdata(m[1]) : '';
}

function tagAttr(item, tag, attr) {
  const re = new RegExp('<' + tag + '[^>]*\\s' + attr + '="([^"]+)"');
  const m = item.match(re);
  return m ? m[1] : '';
}

function stripHtml(html) {
  return decodeEntities(
    String(html)
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

function parseFeed(xml) {
  const items = [];
  const itemRe = /<item\b[\s\S]*?<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null && items.length < MAX_ITEMS) {
    const raw = m[0];
    const desc = tagText(raw, 'description');
    items.push({
      title: tagText(raw, 'title'),
      link: tagText(raw, 'link'),
      pubDate: tagText(raw, 'pubDate'),
      thumbnail: tagText(raw, 'media:thumbnail') || tagAttr(raw, 'media:thumbnail', 'url') || '',
      excerpt: stripHtml(desc).slice(0, 120)
    });
  }
  return items;
}

(async () => {
  const out = { _updated: new Date().toISOString() };
  let anyError = false;
  for (const [key, id] of Object.entries(MAGAZINES)) {
    const rssUrl = 'https://note.com/' + NOTE_USER + '/m/' + id + '/rss';
    try {
      const xml = await get(rssUrl);
      out[key] = parseFeed(xml);
      console.log('  ' + key + ': ' + out[key].length + ' items');
    } catch (e) {
      console.warn('  ' + key + ' FAILED: ' + e.message);
      out[key] = [];
      anyError = true;
    }
  }
  fs.writeFileSync('note-feed.json', JSON.stringify(out, null, 2) + '\n');
  console.log('Wrote note-feed.json');
  if (anyError) process.exit(1);
})();
