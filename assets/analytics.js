/* bwh-research.com の計測（GA4・UTM・相談フォームの事前入力）。設定は同じフォルダの analytics.config.js。
   ブラウザでは読み込まれた時点で起動する。Node では純粋関数だけを返す（tests/analytics.test.js）。
   設計：01_BWH/00_strategy/20261004_広報とSEO/S1_計測/01_S1詳細計画_v1.md */
(function (root, factory) {
  var A = factory();
  if (typeof module === 'object' && module.exports) { module.exports = A; return; }
  root.BWHAnalytics = A;
  A.boot(root);
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var EVENTS = ['cta_click', 'to_lp', 'embed_play', 'note_click'];
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var KEY = 'bwh_touch';
  var LP = { '/yorozuya/': 'top', '/yorozuya/kenshu/': 'kenshu', '/yorozuya/sagyou/': 'sagyou', '/yorozuya/migiude/': 'migiude' };

  // 流入元の欄では「|」と「/」を区切りに使うので、値からは除く
  function clean(v, max) { return String(v || '').replace(/[\u0000-\u001f\u007f|\/]/g, '').trim().slice(0, max); }

  function parseUtm(search) {
    var p;
    try { p = new URLSearchParams(search || ''); } catch (e) { return null; }
    if (!clean(p.get('utm_source'), 60)) return null;
    var u = {};
    UTM_KEYS.forEach(function (k) { u[k] = clean(p.get(k), 60); });
    return u;
  }

  function refHost(referrer, ownHost) {
    if (!referrer) return '';
    try { var h = new URL(referrer).hostname; return h === ownHost ? '' : h; } catch (e) { return ''; }
  }

  function readTouch(storage) {
    if (!storage) return null;
    try {
      var t = JSON.parse(storage.getItem(KEY));
      return t && typeof t === 'object' && typeof t.landing === 'string' ? t : null;
    } catch (e) { return null; }
  }

  // 来訪時に一度だけ呼ぶ。UTM つきで来たら上書き、UTM なしならセッションの最初の1回だけ保存する
  function rememberTouch(storage, search, referrer, ownHost, path) {
    if (!storage) return null;
    try {
      var utm = parseUtm(search), prev = readTouch(storage);
      if (!utm && prev) return prev;
      var t = { utm: utm, ref: refHost(referrer, ownHost), landing: String(path || '/').slice(0, 120) };
      storage.setItem(KEY, JSON.stringify(t));
      return t;
    } catch (e) { return null; }
  }

  // フォームの「流入元（自動で入ります）」に入れる1行
  function sourceValue(touch, ctaPath) {
    var parts = [];
    if (touch && touch.utm) {
      parts.push(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map(function (k) { return touch.utm[k] || '-'; }).join('/'));
    } else {
      parts.push(touch && touch.ref ? 'ref:' + touch.ref : 'direct');
    }
    if (touch && touch.landing) parts.push('in:' + touch.landing);
    parts.push('btn:' + (ctaPath || '/'));
    return parts.join(' | ').slice(0, 200);
  }

  function isFormUrl(href) {
    try {
      var u = new URL(href);
      return (u.hostname === 'docs.google.com' && /\/forms\//.test(u.pathname)) || u.hostname === 'forms.gle';
    } catch (e) { return false; }
  }

  // 相談フォームのURLに、サービスの選択と流入元を事前入力する。既にある同じ entry は置き換える
  function formUrl(href, o) {
    var u;
    try { u = new URL(href); } catch (e) { return href; }
    o = o || {};
    var form = o.form || {}, ent = form.entries || {}, ch = form.choices || {}, changed = false;
    if (ent.service && o.service && ch[o.service]) { u.searchParams.set('entry.' + ent.service, ch[o.service]); changed = true; }
    if (ent.source && o.source) { u.searchParams.set('entry.' + ent.source, o.source); changed = true; }
    if (!changed) return href;
    u.searchParams.set('usp', 'pp_url');
    return u.toString();
  }

  function normPath(p) {
    p = String(p || '/').replace(/index\.html$/, '');
    return p.charAt(p.length - 1) === '/' ? p : p + '/';
  }
  function lpService(path) { return LP[normPath(path)] || ''; }

  function classify(href, here) {
    if (!href || href.charAt(0) === '#') return null;
    var u;
    try { u = new URL(href, here.origin + here.pathname); } catch (e) { return null; }
    if (isFormUrl(u.href)) return { event: 'cta_click', params: { page_path: here.pathname } };
    if (/(^|\.)note\.com$/.test(u.hostname)) return { event: 'note_click', params: { from_path: here.pathname, link_url: u.href } };
    if (u.origin === here.origin && lpService(u.pathname) && !lpService(here.pathname)) {
      return { event: 'to_lp', params: { from_path: here.pathname, lp_service: lpService(u.pathname) } };
    }
    return null;
  }

  function kawarabanId(path) {
    var m = /\/kawaraban\/([^\/]+)\/(index\.html)?$/.exec(String(path || ''));
    return m ? m[1] : '';
  }

  function validId(id) { return /^G-[A-Z0-9]{4,}$/.test(String(id || '')); }

  // 設定ファイルがまだ読めていないときの事前入力。流入元の entry は設定ファイルにだけ書く
  var DEFAULT_FORM = {
    entries: { service: '1036629582', source: '' },
    choices: { kenshu: '現場AI研修', sagyou: 'AIおまかせ制作', migiude: 'AXのみぎうで（AIの右腕）', 'migiude-hr': '組織の右腕', 'migiude-strategy': '戦略の右腕' }
  };

  // 測定IDが正しい形のときだけ gtag を用意する。空なら何も作らず、何も読み込まない
  function initGa(win) {
    if (!validId(win.BWH_GA4_ID)) return false;
    if (win.__bwhGa) return true;
    win.__bwhGa = true;
    win.dataLayer = win.dataLayer || [];
    win.gtag = function () { win.dataLayer.push(arguments); };
    var h = win.location.hostname;
    var dbg = h === 'localhost' || h === '127.0.0.1' || /[?&]ga_debug=1(&|$)/.test(win.location.search || '');
    win.gtag('js', new Date());
    win.gtag('config', win.BWH_GA4_ID, dbg ? { debug_mode: true } : {});
    if (!win.BWH_GA4_DRYRUN) {
      var s = win.document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + win.BWH_GA4_ID;
      win.document.head.appendChild(s);
    }
    return true;
  }

  function send(win, name, params) {
    if (EVENTS.indexOf(name) < 0 || !win.__bwhGa || typeof win.gtag !== 'function') return false;
    win.gtag('event', name, params || {});
    return true;
  }

  function boot(win) {
    var doc = win.document, loc = win.location, store = null, seen = [];
    try { store = win.sessionStorage; } catch (e) { store = null; }
    rememberTouch(store, loc.search, doc.referrer || '', loc.hostname, loc.pathname);

    // 相談リンクは押した瞬間に href を書き換える（新しいタブで開くので、書き換えた URL がそのまま開く）
    doc.addEventListener('click', function (ev) {
      try {
        var a = ev.target && ev.target.closest && ev.target.closest('a[href]');
        if (!a) return;
        var hit = classify(a.getAttribute('href'), { origin: loc.origin, pathname: loc.pathname });
        if (!hit) return;
        if (hit.event === 'cta_click') {
          var svc = a.getAttribute('data-cta-service') || 'general';
          hit.params.cta_service = svc;
          a.setAttribute('href', formUrl(a.href, { service: svc, source: sourceValue(readTouch(store), loc.pathname), form: win.BWH_FORM || DEFAULT_FORM }));
        }
        send(win, hit.event, hit.params);
      } catch (e) { /* 計測の失敗でリンクを止めない */ }
    }, true);

    // 埋め込み（YouTube・X）は iframe にフォーカスが移ったときを「押した」とみなす。再生の完了は取らない
    win.addEventListener('blur', function () {
      win.setTimeout(function () {
        var f = doc.activeElement;
        if (!f || f.tagName !== 'IFRAME' || seen.indexOf(f) >= 0) return;
        seen.push(f);
        var host = '';
        try { host = new URL(f.src).hostname; } catch (e) { host = ''; }
        send(win, 'embed_play', { kawaraban_id: f.getAttribute('data-kawaraban-id') || kawarabanId(loc.pathname), embed_host: host, method: 'iframe_focus' });
      }, 0);
    });

    if (win.BWH_GA4_ID !== undefined) { initGa(win); return; }
    var me = doc.currentScript && doc.currentScript.src;
    if (!me) return;
    var c = doc.createElement('script');
    c.src = me.replace(/analytics\.js(\?.*)?$/, 'analytics.config.js');
    c.onload = function () { initGa(win); };
    doc.head.appendChild(c);
  }

  return {
    EVENTS: EVENTS, parseUtm: parseUtm, refHost: refHost, readTouch: readTouch, rememberTouch: rememberTouch,
    sourceValue: sourceValue, isFormUrl: isFormUrl, formUrl: formUrl, lpService: lpService, classify: classify,
    kawarabanId: kawarabanId, validId: validId, initGa: initGa, send: send, boot: boot
  };
});
