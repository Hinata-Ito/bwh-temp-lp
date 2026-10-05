// UTM付きリンクを決まり（設計書 3-4・実行計画 I3）どおりに組み立てる。
//   node scripts/utm-link.mjs --base <URL> --platform instagram --placement profile
//   node scripts/utm-link.mjs --base <URL> --platform facebook --placement post --campaign kawaraban_20261026 --content reel_hanabi
// Instagram はキャプションのURLを押せないので、profile（プロフィールのリンク）と story（リンクスタンプ）だけ作る。
import { fileURLToPath } from 'node:url';

const MEDIUM = { instagram: 'social', facebook: 'social', note: 'referral', seminar: 'qr', flyer: 'qr', email: 'email' };
const PLACEMENTS = ['profile', 'story', 'post', 'caption', 'qr', 'mail', 'article'];
const STAFF = ['joh', 'sakura', 'sora', 'aya', 'hanabi', 'nami', 'ren', 'ryu', 'sumi', 'yui'];
const CAMPAIGN = /^(profile|kawaraban_\d{8}|column_[a-z0-9-]+|seminar_\d{8}_[a-z0-9-]+)$/;
const CONTENT = new RegExp(`^(reel|carousel)_(${STAFF.join('|')})$`);

export function buildUtmUrl({ base, platform, placement, campaign, content } = {}) {
  if (!MEDIUM[platform]) throw new Error(`platform が決まりにない: ${platform}（${Object.keys(MEDIUM).join('|')}）`);
  if (platform === 'instagram' && !['profile', 'story'].includes(placement)) {
    throw new Error('Instagram のキャプション・投稿のURLは押せない。profile（プロフィールのリンク）か story（リンクスタンプ）を使う');
  }
  if (!PLACEMENTS.includes(placement)) throw new Error(`placement が決まりにない: ${placement}`);
  const cmp = placement === 'profile' ? (campaign || 'profile') : campaign;
  if (!cmp || !CAMPAIGN.test(cmp)) throw new Error(`campaign が決まりにない: ${cmp}（profile|kawaraban_YYYYMMDD|column_<slug>|seminar_YYYYMMDD_<場所の英字>）`);
  if (content !== undefined && !CONTENT.test(content)) throw new Error(`content が決まりにない: ${content}（reel_<社員ID>|carousel_<社員ID>）`);
  let u;
  try { u = new URL(base); } catch { throw new Error(`base がURLでない: ${base}`); }
  if ([...u.searchParams.keys()].some(k => k.startsWith('utm_'))) throw new Error('base に既に utm_ が付いている');
  u.searchParams.append('utm_source', platform);
  u.searchParams.append('utm_medium', MEDIUM[platform]);
  u.searchParams.append('utm_campaign', cmp);
  if (content) u.searchParams.append('utm_content', content);
  return u.toString();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const a = {};
  for (let i = 2; i < process.argv.length; i += 2) a[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
  try { console.log(buildUtmUrl(a)); } catch (e) { console.error('NG ' + e.message); process.exit(1); }
}
