// 前付けの検証。誤りを文の配列で返す（空なら正しい）。ビルドは誤りが1つでもあれば止まる。

const REQUIRED = ['title', 'slug', 'date', 'type', 'pillar', 'service', 'description'];
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EMBED_TYPES = ['youtube', 'x', 'none'];
const BANNED = ['実質無料'];

export function isRealDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function validateMeta(data, { dir, filename, config }) {
  const errs = [];
  for (const k of REQUIRED) {
    if (data[k] === undefined || data[k] === null || data[k] === '') errs.push(`${k} がありません`);
  }
  if (data.type && data.type !== dir) errs.push(`type が「${data.type}」ですが、置き場は content/${dir}/ です`);

  const pillars = config.pillars[dir] || {};
  if (data.pillar && !(data.pillar in pillars)) {
    errs.push(`pillar「${data.pillar}」は ${dir} では使えません（${Object.keys(pillars).join('／')}）`);
  }
  if (data.service && !(data.service in config.services)) {
    errs.push(`service「${data.service}」は使えません（${Object.keys(config.services).join('／')}）`);
  }

  if (data.slug !== undefined && data.slug !== null) {
    if (typeof data.slug !== 'string' || !SLUG_RE.test(data.slug)) {
      errs.push(`slug「${data.slug}」は英小文字・数字・ハイフンだけで書いてください`);
    }
  }
  const base = filename.replace(/\.md$/, '');
  if (dir === 'column' && data.slug && base !== data.slug) {
    errs.push(`ファイル名（${filename}）と slug（${data.slug}）が違います`);
  }
  if (dir === 'kawaraban') {
    const m = base.match(/^(\d{8})-(.+)$/);
    if (!m) errs.push(`ファイル名（${filename}）は <YYYYMMDD>-<slug>.md にしてください`);
    else {
      if (data.slug && m[2] !== data.slug) errs.push(`ファイル名（${filename}）と slug（${data.slug}）が違います`);
      if (isRealDate(data.date) && m[1] !== data.date.replace(/-/g, '')) {
        errs.push(`ファイル名の日付（${m[1]}）と date（${data.date}）が違います`);
      }
    }
    if (!data.card_id) errs.push('card_id がありません（瓦版はネタカードの id が要ります）');
    if (data.embed !== undefined && data.embed !== null) {
      if (typeof data.embed !== 'object' || !EMBED_TYPES.includes(data.embed.type)) {
        errs.push(`embed の type は ${EMBED_TYPES.join('／')} のどれかにしてください`);
      } else if (data.embed.type !== 'none' && !data.embed.url) {
        errs.push('embed の url がありません');
      }
    }
  }

  if (data.date !== undefined && data.date !== null && !isRealDate(data.date)) {
    errs.push(`date「${data.date}」は実在する YYYY-MM-DD にしてください`);
  }
  if (data.updated !== undefined && data.updated !== null) {
    if (!isRealDate(data.updated)) errs.push(`updated「${data.updated}」は実在する YYYY-MM-DD にしてください`);
    else if (isRealDate(data.date) && data.updated < data.date) errs.push('updated が date より前です');
  }
  if (typeof data.description === 'string' && [...data.description].length > 120) {
    errs.push(`description が${[...data.description].length}字です（120字まで）`);
  }
  if (data.sources !== undefined && data.sources !== null) {
    if (!Array.isArray(data.sources)) errs.push('sources は「- https://…」の行で並べてください');
    else for (const u of data.sources) {
      if (typeof u !== 'string' || !/^https:\/\/[^\s]+$/.test(u)) errs.push(`sources に https の URL でないものがあります：${u}`);
    }
  }
  for (const w of BANNED) {
    for (const k of ['title', 'description']) {
      if (typeof data[k] === 'string' && data[k].includes(w)) errs.push(`${k} に「${w}」があります（使わない約束の言葉です）`);
    }
  }
  return errs;
}
