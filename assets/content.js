/* コラム・AI瓦版の小さな動き（依存なし）
   - YouTube：押すまで読み込まない。押したら youtube-nocookie の iframe に差し替える
   - トップの #knowledge 案B（タブ）の切り替え */
(function () {
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.yt-play');
    if (!b) return;
    var id = b.getAttribute('data-yt');
    if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) return;
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    f.title = b.getAttribute('aria-label') || 'YouTube の動画';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    f.allowFullscreen = true;
    f.setAttribute('loading', 'lazy');
    b.replaceWith(f);
  });

  var tabs = document.querySelector('.kc-tabs');
  if (tabs) {
    var sec = tabs.closest('section') || document;
    var btns = tabs.querySelectorAll('[data-kc-tab]');
    function show(name) {
      btns.forEach(function (x) { x.setAttribute('aria-selected', x.getAttribute('data-kc-tab') === name ? 'true' : 'false'); });
      sec.setAttribute('data-kc-show', name);
    }
    btns.forEach(function (x) { x.addEventListener('click', function () { show(x.getAttribute('data-kc-tab')); }); });
    show('column');
  }
})();
