// assets/analytics.js の単体テスト。 node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../assets/analytics.js');

const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSc2eHUy1JeRPg17E6asX3A_j6NY2b4Jxyb1N6jSdifA1vU_gQ/viewform';
const CFG = { entries: { service: '1036629582', source: '999' }, choices: { kenshu: '現場AI研修', 'migiude-hr': '組織の右腕' } };
function mem() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; }
const broken = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceeded'); } };

// ---- Task 1: 純粋関数 ----

test('イベントは4つだけ。送信を装うイベントは無い（Review Focus 2）', () => {
  assert.deepEqual(A.EVENTS, ['cta_click', 'to_lp', 'embed_play', 'note_click']);
  assert.ok(!A.EVENTS.includes('generate_lead'));
});

test('parseUtm: utm_source が無ければ null', () => {
  assert.equal(A.parseUtm('?utm_medium=social'), null);
  assert.equal(A.parseUtm(''), null);
  assert.equal(A.parseUtm(undefined), null);
});

test('parseUtm: 値を取り出す', () => {
  const u = A.parseUtm('?utm_source=instagram&utm_medium=social&utm_campaign=profile&utm_content=reel_hanabi&x=1');
  assert.deepEqual(u, { utm_source: 'instagram', utm_medium: 'social', utm_campaign: 'profile', utm_content: 'reel_hanabi', utm_term: '' });
});

test('parseUtm: 区切りを壊す文字を除き、60字に切り、日本語は残す（Review Focus 5）', () => {
  const u = A.parseUtm('?utm_source=ins%7Ctagram%0A&utm_campaign=seminar_20261110_%E7%A6%8F%E4%BA%95&utm_content=' + 'a'.repeat(100) + '&utm_term=a%2Fb');
  assert.equal(u.utm_source, 'instagram');
  assert.equal(u.utm_campaign, 'seminar_20261110_福井');
  assert.equal(u.utm_content.length, 60);
  assert.equal(u.utm_term, 'ab');
});

test('refHost: 外のサイトだけ返す', () => {
  assert.equal(A.refHost('https://www.google.com/search?q=x', 'bwh-research.com'), 'www.google.com');
  assert.equal(A.refHost('https://bwh-research.com/column/a/', 'bwh-research.com'), '');
  assert.equal(A.refHost('', 'bwh-research.com'), '');
  assert.equal(A.refHost('not a url', 'bwh-research.com'), '');
});

test('rememberTouch: UTM つきで来たら保存し、次のページでは上書きしない', () => {
  const s = mem();
  A.rememberTouch(s, '?utm_source=instagram&utm_medium=social&utm_campaign=profile', 'https://l.instagram.com/', 'bwh-research.com', '/yorozuya/kawaraban/');
  A.rememberTouch(s, '', 'https://bwh-research.com/yorozuya/kawaraban/', 'bwh-research.com', '/yorozuya/kenshu/');
  const t = A.readTouch(s);
  assert.equal(t.utm.utm_source, 'instagram');
  assert.equal(t.landing, '/yorozuya/kawaraban/');
  assert.equal(t.ref, 'l.instagram.com');
});

test('rememberTouch: UTM なしの初回はリファラだけ保存し、後から UTM が来たら上書き', () => {
  const s = mem();
  A.rememberTouch(s, '', 'https://www.google.com/', 'bwh-research.com', '/column/a/');
  assert.equal(A.readTouch(s).utm, null);
  assert.equal(A.readTouch(s).ref, 'www.google.com');
  A.rememberTouch(s, '', 'https://www.bing.com/', 'bwh-research.com', '/column/b/');
  assert.equal(A.readTouch(s).ref, 'www.google.com');
  A.rememberTouch(s, '?utm_source=facebook&utm_medium=social', '', 'bwh-research.com', '/yorozuya/');
  assert.equal(A.readTouch(s).utm.utm_source, 'facebook');
  assert.equal(A.readTouch(s).landing, '/yorozuya/');
});

test('rememberTouch/readTouch: sessionStorage が使えなくても例外を出さない（Review Focus 3）', () => {
  assert.equal(A.rememberTouch(broken, '?utm_source=instagram', '', 'bwh-research.com', '/'), null);
  assert.equal(A.rememberTouch(null, '?utm_source=instagram', '', 'bwh-research.com', '/'), null);
  assert.equal(A.readTouch(broken), null);
  assert.equal(A.readTouch(null), null);
  const s = mem(); s.setItem('bwh_touch', '{壊れた');
  assert.equal(A.readTouch(s), null);
  s.setItem('bwh_touch', '42');
  assert.equal(A.readTouch(s), null);
});

test('sourceValue: UTM・着いたページ・押したページを1行に', () => {
  const t = { utm: { utm_source: 'instagram', utm_medium: 'social', utm_campaign: 'profile', utm_content: '', utm_term: '' }, ref: 'l.instagram.com', landing: '/yorozuya/kawaraban/' };
  assert.equal(A.sourceValue(t, '/yorozuya/kenshu/'), 'instagram/social/profile/- | in:/yorozuya/kawaraban/ | btn:/yorozuya/kenshu/');
});

test('sourceValue: UTM なしはリファラ、それも無ければ direct', () => {
  assert.equal(A.sourceValue({ utm: null, ref: 'www.google.com', landing: '/column/a/' }, '/column/a/'), 'ref:www.google.com | in:/column/a/ | btn:/column/a/');
  assert.equal(A.sourceValue(null, '/'), 'direct | btn:/');
});

test('sourceValue: 200字に切る', () => {
  const long = '/column/' + 'x'.repeat(300) + '/';
  assert.ok(A.sourceValue({ utm: null, ref: '', landing: long }, long).length <= 200);
});

test('isFormUrl', () => {
  assert.ok(A.isFormUrl(FORM));
  assert.ok(A.isFormUrl('https://forms.gle/abc'));
  assert.ok(!A.isFormUrl('https://docs.google.com/document/d/x'));
  assert.ok(!A.isFormUrl('/yorozuya/'));
  assert.ok(!A.isFormUrl(''));
});

test('formUrl: サービスと流入元を事前入力する', () => {
  const u = new URL(A.formUrl(FORM, { service: 'kenshu', source: 'direct | btn:/', form: CFG }));
  assert.equal(u.searchParams.get('usp'), 'pp_url');
  assert.equal(u.searchParams.get('entry.1036629582'), '現場AI研修');
  assert.equal(u.searchParams.get('entry.999'), 'direct | btn:/');
});

test('formUrl: 既にある事前入力を二重にせず置き換える（Review Focus 4）', () => {
  const pre = FORM + '?usp=pp_url&entry.1036629582=%E7%8F%BE%E5%A0%B4AI%E7%A0%94%E4%BF%AE';
  const u = new URL(A.formUrl(pre, { service: 'migiude-hr', source: '', form: CFG }));
  assert.deepEqual(u.searchParams.getAll('entry.1036629582'), ['組織の右腕']);
  assert.deepEqual(u.searchParams.getAll('usp'), ['pp_url']);
});

test('formUrl: 2回押しても流入元は1つ', () => {
  const once = A.formUrl(FORM, { service: 'kenshu', source: 'direct | btn:/', form: CFG });
  const twice = A.formUrl(once, { service: 'kenshu', source: 'direct | btn:/', form: CFG });
  assert.deepEqual(new URL(twice).searchParams.getAll('entry.999'), ['direct | btn:/']);
});

test('formUrl: general や不明なサービスは元の選択を残す', () => {
  const pre = FORM + '?usp=pp_url&entry.1036629582=%E7%8F%BE%E5%A0%B4AI%E7%A0%94%E4%BF%AE';
  assert.equal(new URL(A.formUrl(pre, { service: 'general', source: '', form: CFG })).searchParams.get('entry.1036629582'), '現場AI研修');
  assert.equal(new URL(A.formUrl(FORM, { service: 'nazo', source: '', form: CFG })).searchParams.get('entry.1036629582'), null);
});

test('formUrl: 流入元の entry ID が空なら足さず、何も変えないときは元の href のまま', () => {
  const cfg = { entries: { service: '1036629582', source: '' }, choices: CFG.choices };
  assert.equal(A.formUrl(FORM, { service: 'general', source: 'direct', form: cfg }), FORM);
  assert.equal(A.formUrl(FORM, { service: 'general', source: 'direct' }), FORM);
});

test('formUrl: 壊れた href はそのまま返す', () => {
  assert.equal(A.formUrl('::::', { service: 'kenshu', source: 'x', form: CFG }), '::::');
});

test('lpService: LP の4ページだけを認める', () => {
  assert.equal(A.lpService('/yorozuya/'), 'top');
  assert.equal(A.lpService('/yorozuya/index.html'), 'top');
  assert.equal(A.lpService('/yorozuya'), 'top');
  assert.equal(A.lpService('/yorozuya/kenshu/'), 'kenshu');
  assert.equal(A.lpService('/yorozuya/sagyou/index.html'), 'sagyou');
  assert.equal(A.lpService('/yorozuya/migiude'), 'migiude');
  assert.equal(A.lpService('/yorozuya/kawaraban/'), '');
  assert.equal(A.lpService('/yorozuya/privacy/'), '');
  assert.equal(A.lpService('/column/a/'), '');
});

const HERE_COL = { origin: 'https://bwh-research.com', pathname: '/column/jinzai/' };
const HERE_LP = { origin: 'https://bwh-research.com', pathname: '/yorozuya/kenshu/' };

test('classify: 相談フォーム → cta_click', () => {
  assert.deepEqual(A.classify(FORM, HERE_LP), { event: 'cta_click', params: { page_path: '/yorozuya/kenshu/' } });
});

test('classify: コラム・瓦版から LP → to_lp。LP の中の移動は数えない', () => {
  assert.deepEqual(A.classify('/yorozuya/kenshu/', HERE_COL), { event: 'to_lp', params: { from_path: '/column/jinzai/', lp_service: 'kenshu' } });
  assert.deepEqual(A.classify('../', { origin: 'https://bwh-research.com', pathname: '/yorozuya/kawaraban/20261026-x/' }), null);
  assert.deepEqual(A.classify('https://bwh-research.com/yorozuya/', { origin: 'https://bwh-research.com', pathname: '/yorozuya/kawaraban/20261026-x/' }), { event: 'to_lp', params: { from_path: '/yorozuya/kawaraban/20261026-x/', lp_service: 'top' } });
  assert.equal(A.classify('/yorozuya/sagyou/', HERE_LP), null);
  assert.equal(A.classify('../sagyou/', HERE_LP), null);
});

test('classify: 相対リンクも解決する', () => {
  assert.deepEqual(A.classify('yorozuya/', { origin: 'https://bwh-research.com', pathname: '/' }), { event: 'to_lp', params: { from_path: '/', lp_service: 'top' } });
});

test('classify: note → note_click', () => {
  assert.deepEqual(A.classify('https://note.com/ginzoshizuki_bwh/m/m582db0aec069', HERE_COL), { event: 'note_click', params: { from_path: '/column/jinzai/', link_url: 'https://note.com/ginzoshizuki_bwh/m/m582db0aec069' } });
  assert.equal(A.classify('https://notenote.com/', HERE_COL), null);
});

test('classify: それ以外とページ内リンクは null', () => {
  assert.equal(A.classify('#services', HERE_COL), null);
  assert.equal(A.classify('https://example.com/', HERE_COL), null);
  assert.equal(A.classify('mailto:a@b.c', HERE_COL), null);
  assert.equal(A.classify('', HERE_COL), null);
  assert.equal(A.classify(null, HERE_COL), null);
});

test('kawarabanId: 瓦版の1件のパスから ID', () => {
  assert.equal(A.kawarabanId('/yorozuya/kawaraban/20261026-runway-gen5/'), '20261026-runway-gen5');
  assert.equal(A.kawarabanId('/kawaraban/20261026-runway-gen5/index.html'), '20261026-runway-gen5');
  assert.equal(A.kawarabanId('/yorozuya/kawaraban/'), '');
  assert.equal(A.kawarabanId('/column/a/'), '');
});

test('validId: G- で始まる形だけ', () => {
  assert.ok(A.validId('G-ABC123XYZ9'));
  assert.ok(!A.validId(''));
  assert.ok(!A.validId(undefined));
  assert.ok(!A.validId('UA-1234-1'));
  assert.ok(!A.validId('G-<script>'));
});

// ---- Task 2: ブラウザでの起動（偽の window で動かす） ----

function fakeWin(extra) {
  const listeners = {};
  const scripts = [];
  const doc = {
    referrer: '',
    currentScript: { src: 'https://bwh-research.com/assets/analytics.js' },
    head: { appendChild: s => { scripts.push(s); if (s.onload) s.onload(); } },
    createElement: () => ({}),
    addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); },
    activeElement: null,
  };
  const win = Object.assign({
    document: doc,
    location: { search: '', hostname: 'bwh-research.com', origin: 'https://bwh-research.com', pathname: '/column/a/' },
    sessionStorage: mem(),
    addEventListener: (t, f) => { (listeners['win:' + t] = listeners['win:' + t] || []).push(f); },
    setTimeout: f => f(),
  }, extra);
  return { win, listeners, scripts };
}
function link(href, svc) {
  return {
    href,
    getAttribute(n) { return n === 'href' ? this.href : n === 'data-cta-service' ? (svc || null) : null; },
    setAttribute(n, v) { if (n === 'href') this.href = v; },
  };
}
function clickOn(listeners, a) { listeners.click.forEach(f => f({ target: { closest: () => a } })); }
const gtm = scripts => scripts.filter(s => /googletagmanager/.test(s.src || ''));

test('initGa: ID が空なら gtag も dataLayer も作らず、何も読み込まない', () => {
  const { win, scripts } = fakeWin({ BWH_GA4_ID: '' });
  assert.equal(A.initGa(win), false);
  assert.equal(win.gtag, undefined);
  assert.equal(win.dataLayer, undefined);
  assert.equal(gtm(scripts).length, 0);
  assert.equal(A.send(win, 'cta_click', {}), false);
});

test('initGa: DRYRUN は dataLayer に積むが gtag.js を読み込まない', () => {
  const { win, scripts } = fakeWin({ BWH_GA4_ID: 'G-TEST1234', BWH_GA4_DRYRUN: true });
  assert.equal(A.initGa(win), true);
  assert.equal(gtm(scripts).length, 0);
  assert.equal(A.send(win, 'cta_click', { cta_service: 'kenshu' }), true);
  const last = win.dataLayer[win.dataLayer.length - 1];
  assert.equal(last[0], 'event');
  assert.equal(last[1], 'cta_click');
});

test('initGa: 本番の形の ID なら gtag.js を1回だけ読み込む', () => {
  const { win, scripts } = fakeWin({ BWH_GA4_ID: 'G-TEST1234' });
  A.initGa(win); A.initGa(win);
  assert.equal(gtm(scripts).length, 1);
  assert.match(gtm(scripts)[0].src, /gtag\/js\?id=G-TEST1234$/);
});

test('initGa: ga_debug=1 では debug_mode、ふだんは付けない', () => {
  const a = fakeWin({ BWH_GA4_ID: 'G-TEST1234', BWH_GA4_DRYRUN: true });
  a.win.location.search = '?ga_debug=1';
  A.initGa(a.win);
  assert.deepEqual(a.win.dataLayer.find(x => x[0] === 'config')[2], { debug_mode: true });
  const b = fakeWin({ BWH_GA4_ID: 'G-TEST1234', BWH_GA4_DRYRUN: true });
  A.initGa(b.win);
  assert.deepEqual(b.win.dataLayer.find(x => x[0] === 'config')[2], {});
});

test('send: 4つ以外のイベント名は送らない', () => {
  const { win } = fakeWin({ BWH_GA4_ID: 'G-TEST1234', BWH_GA4_DRYRUN: true });
  A.initGa(win);
  assert.equal(A.send(win, 'generate_lead', {}), false);
  assert.equal(win.dataLayer.filter(x => x[1] === 'generate_lead').length, 0);
});

test('boot: UTM つきで来て相談リンクを押すと、href に選択肢と流入元が入り cta_click が積まれる', () => {
  const { win, listeners } = fakeWin({ BWH_GA4_ID: 'G-TEST1234', BWH_GA4_DRYRUN: true,
    BWH_FORM: { entries: { service: '1036629582', source: '999' }, choices: { kenshu: '現場AI研修' } } });
  win.location.search = '?utm_source=instagram&utm_medium=social&utm_campaign=profile';
  A.boot(win);
  const a = link(FORM, 'kenshu');
  clickOn(listeners, a);
  const u = new URL(a.href);
  assert.equal(u.searchParams.get('entry.1036629582'), '現場AI研修');
  assert.equal(u.searchParams.get('entry.999'), 'instagram/social/profile/- | in:/column/a/ | btn:/column/a/');
  const last = win.dataLayer[win.dataLayer.length - 1];
  assert.equal(last[1], 'cta_click');
  assert.equal(last[2].cta_service, 'kenshu');
  assert.equal(last[2].page_path, '/column/a/');
});

test('boot: data-cta-service が無い相談リンクは general', () => {
  const { win, listeners } = fakeWin({ BWH_GA4_ID: 'G-TEST1234', BWH_GA4_DRYRUN: true });
  A.boot(win);
  clickOn(listeners, link(FORM));
  assert.equal(win.dataLayer[win.dataLayer.length - 1][2].cta_service, 'general');
});

test('boot: 設定が読めず sessionStorage も壊れていても、例外を出さず何も送らない', () => {
  const { win, listeners, scripts } = fakeWin({});
  win.document.head.appendChild = s => { scripts.push(s); if (s.onerror) s.onerror(); };
  win.sessionStorage = broken;
  assert.doesNotThrow(() => A.boot(win));
  const a = link(FORM + '?usp=pp_url&entry.1036629582=x', 'kenshu');
  assert.doesNotThrow(() => clickOn(listeners, a));
  assert.equal(new URL(a.href).searchParams.get('entry.1036629582'), '現場AI研修');
  assert.equal(win.dataLayer, undefined);
  assert.equal(gtm(scripts).length, 0);
});

test('boot: sessionStorage へのアクセス自体が例外でも動く（Review Focus 3）', () => {
  const { win } = fakeWin({ BWH_GA4_ID: '' });
  Object.defineProperty(win, 'sessionStorage', { get() { throw new Error('SecurityError'); } });
  assert.doesNotThrow(() => A.boot(win));
});

test('boot: 設定ファイルを analytics.js の隣から読み、読めたら GA を始める', () => {
  const { win, scripts } = fakeWin({});
  win.document.head.appendChild = s => {
    scripts.push(s);
    if (/analytics\.config\.js$/.test(s.src)) { win.BWH_GA4_ID = 'G-TEST1234'; win.BWH_GA4_DRYRUN = true; }
    if (s.onload) s.onload();
  };
  A.boot(win);
  assert.equal(scripts[0].src, 'https://bwh-research.com/assets/analytics.config.js');
  assert.equal(typeof win.gtag, 'function');
});

test('boot: LP への移動は to_lp、note は note_click、ページ内リンクは送らない', () => {
  const { win, listeners } = fakeWin({ BWH_GA4_ID: 'G-TEST1234', BWH_GA4_DRYRUN: true });
  A.boot(win);
  clickOn(listeners, link('/yorozuya/kenshu/'));
  clickOn(listeners, link('https://note.com/ginzoshizuki_bwh/m/m582db0aec069'));
  clickOn(listeners, link('#top'));
  assert.deepEqual(win.dataLayer.filter(x => x[0] === 'event').map(x => x[1]), ['to_lp', 'note_click']);
});

test('boot: 埋め込みの iframe にフォーカスが移ったら embed_play を1回だけ', () => {
  const { win, listeners } = fakeWin({ BWH_GA4_ID: 'G-TEST1234', BWH_GA4_DRYRUN: true });
  win.location.pathname = '/yorozuya/kawaraban/20261026-runway-gen5/';
  A.boot(win);
  win.document.activeElement = { tagName: 'IFRAME', src: 'https://www.youtube-nocookie.com/embed/abc', getAttribute: () => null };
  listeners['win:blur'].forEach(f => f());
  listeners['win:blur'].forEach(f => f());
  const plays = win.dataLayer.filter(x => x[1] === 'embed_play');
  assert.equal(plays.length, 1);
  assert.deepEqual(plays[0][2], { kawaraban_id: '20261026-runway-gen5', embed_host: 'www.youtube-nocookie.com', method: 'iframe_focus' });
});

test('boot: iframe でないものにフォーカスが移っても送らない', () => {
  const { win, listeners } = fakeWin({ BWH_GA4_ID: 'G-TEST1234', BWH_GA4_DRYRUN: true });
  A.boot(win);
  win.document.activeElement = { tagName: 'BODY' };
  listeners['win:blur'].forEach(f => f());
  assert.equal(win.dataLayer.filter(x => x[1] === 'embed_play').length, 0);
});
