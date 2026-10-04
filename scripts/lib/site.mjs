// 出し先・URL・canonical と、LP が出ているかどうかの判定。
// KAWARABAN_BASE が /kawaraban/ のときは「LP が未公開」とみなし、LP へのリンクを作らない（実行計画 Review Focus 3）。

const BASES = ['/yorozuya/kawaraban/', '/kawaraban/'];

export function resolveSite(env, config) {
  let base = (env.KAWARABAN_BASE || '').trim();
  if (!base) base = BASES[0];
  if (!base.startsWith('/')) base = '/' + base;
  if (!base.endsWith('/')) base += '/';
  if (!BASES.includes(base)) throw new Error(`KAWARABAN_BASE は ${BASES.join(' か ')} にしてください（いまの値：${env.KAWARABAN_BASE}）`);
  const lpLive = base === BASES[0];
  return {
    origin: config.site.origin,
    kawarabanBase: base,
    lpLive,
    // LP の公開後は、それまで /kawaraban/ で出していた URL に転送ページを残す
    legacyKawarabanBase: lpLive ? BASES[1] : null,
  };
}

export const columnPath = (slug) => `/column/${slug}/`;
export const kawarabanPath = (id, site) => `${site.kawarabanBase}${id}/`;
export const canonical = (p, site) => site.origin + p;

export function formUrl(choice, config) {
  if (!choice) return config.site.form;
  return `${config.site.form}?usp=pp_url&entry.${config.site.form_entry}=${encodeURIComponent(choice)}`;
}

export function serviceLink(service, site, config) {
  const s = config.services[service];
  if (s.hp) return { href: s.hp, kind: 'hp' };
  if (site.lpLive && s.lp) return { href: s.lp, kind: 'lp' };
  return { href: formUrl(s.form_choice, config), kind: 'form' };
}
