// 公式の埋め込み（YouTube／X）。他社の動画は転載せず、ここで作る埋め込みだけを使う。
import { esc } from './html.mjs';

const YT_HOSTS = ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'];
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const X_HOSTS = ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'];

function parseUrl(url) {
  try { return new URL(url); } catch { return null; }
}

function youtubeId(url) {
  const u = parseUrl(url);
  if (!u || u.protocol !== 'https:' || !YT_HOSTS.includes(u.hostname)) return null;
  let id = null;
  if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
  else if (u.pathname === '/watch') id = u.searchParams.get('v');
  else {
    const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/);
    if (m) id = m[1];
  }
  return id && YT_ID.test(id) ? id : null;
}

export function parseEmbed(embed) {
  if (!embed || embed.type === 'none') return null;
  if (embed.type === 'youtube') {
    const id = youtubeId(embed.url);
    if (!id) throw new Error(`embed：YouTube の動画の URL ではありません（${embed.url}）`);
    return { type: 'youtube', id };
  }
  if (embed.type === 'x') {
    const u = parseUrl(embed.url);
    const m = u && u.protocol === 'https:' && X_HOSTS.includes(u.hostname) && u.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)\/?$/);
    if (!m) throw new Error(`embed：X の投稿の URL ではありません（${embed.url}）`);
    return { type: 'x', url: `https://twitter.com/${m[1]}/status/${m[2]}`, user: m[1], statusId: m[2] };
  }
  throw new Error(`embed：type「${embed.type}」は使えません`);
}

export function renderEmbed(parsed, { title } = {}) {
  if (!parsed) return '';
  if (parsed.type === 'youtube') {
    const id = esc(parsed.id);
    const t = esc(title || 'YouTube の動画');
    // 押すまで YouTube に通信しない。押したら youtube-nocookie の iframe に差し替える（assets/content.js）
    return `<figure class="embed embed-youtube" data-embed-id="${id}" data-embed-type="youtube">
  <button type="button" class="yt-play" data-yt="${id}" aria-label="動画を再生：${t}">
    <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy">
    <span class="yt-btn" aria-hidden="true"></span>
  </button>
  <figcaption>公式の動画（YouTube）。再生ボタンを押すと YouTube から読み込みます。<a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer">YouTube で見る</a></figcaption>
</figure>`;
  }
  if (parsed.type === 'x') {
    return `<figure class="embed embed-x" data-embed-id="x-${esc(parsed.statusId)}" data-embed-type="x">
  <blockquote class="twitter-tweet" data-dnt="true" data-conversation="none" data-lang="ja"><a href="${esc(parsed.url)}">@${esc(parsed.user)} の投稿を X で見る</a></blockquote>
  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
  <figcaption>公式の投稿（X）</figcaption>
</figure>`;
  }
  return '';
}
