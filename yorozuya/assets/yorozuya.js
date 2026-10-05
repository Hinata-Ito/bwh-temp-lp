/* AI よろづや v2 — 共通スクリプト（依存なし） */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // スマホのメニュー
  var hd = document.querySelector(".hd");
  var btn = hd && hd.querySelector(".menu-btn");
  if (btn) {
    var close = function () { hd.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; };
    btn.addEventListener("click", function () {
      var open = hd.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    hd.querySelectorAll(".nav a").forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (!hd.classList.contains("is-open")) return;
      if (e.key === "Escape") { close(); btn.focus(); return; }
      if (e.key === "Tab") {
        var f = [btn].concat([].slice.call(hd.querySelectorAll(".nav a")));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  // FV：見出し2行目の文字が入れ替わってから確定する（ACESの数字の演出を、言葉で）
  var sc = document.querySelector("[data-scramble]");
  if (sc && !reduce) {
    var finalText = sc.textContent;
    var pool = "01AIエーアイ研修制作右腕福井越前よろづ";
    var frame = 0, total = 26;
    var tick = function () {
      frame++;
      var out = "";
      for (var i = 0; i < finalText.length; i++) {
        var fixAt = Math.floor(total * (i + 1) / finalText.length);
        out += frame >= fixAt ? finalText[i] : pool[Math.floor(Math.random() * pool.length)];
      }
      sc.textContent = out;
      if (frame < total) setTimeout(tick, 55);
      else sc.textContent = finalText;
    };
    setTimeout(tick, 400);
  }

  // FV：研修 — 作業 — みぎうで を順に点ける
  var tabs = document.querySelectorAll(".fv-tabs span");
  if (tabs.length && !reduce) {
    var ti = 0;
    tabs[0].classList.add("on");
    setInterval(function () {
      tabs[ti].classList.remove("on");
      ti = (ti + 1) % tabs.length;
      tabs[ti].classList.add("on");
    }, 2200);
  } else if (tabs.length) { tabs.forEach(function (s) { s.classList.add("on"); }); }

  // ファーストビューは判定を待たずに出す
  document.querySelectorAll(".fv, .s-hero").forEach(function (fv) {
    fv.classList.add("is-in");
    fv.querySelectorAll(".rv, .pic").forEach(function (el) { el.classList.add("is-in"); });
  });

  // スマホの固定の相談ボタン：ファーストビューを過ぎたら出し、ページ末の相談欄では隠す
  var sp = document.querySelector(".sp-cta");
  if (sp && "IntersectionObserver" in window) {
    var fvEl = document.querySelector(".fv, .s-hero");
    var endEl = document.querySelector(".end");
    var pastFv = false, atEnd = false;
    var upd = function () {
      var show = pastFv && !atEnd;
      sp.classList.toggle("is-show", show);
      sp.setAttribute("aria-hidden", show ? "false" : "true");
      sp.tabIndex = show ? 0 : -1;
    };
    upd();
    if (fvEl) new IntersectionObserver(function (e) { pastFv = !e[0].isIntersecting; upd(); }).observe(fvEl);
    if (endEl) new IntersectionObserver(function (e) { atEnd = e[0].isIntersecting; upd(); }).observe(endEl);
  }

  // 出現：画面に入ったら .is-in（題字の線描きもこれで始まる）
  var targets = [].slice.call(document.querySelectorAll(".rv:not(.is-in), .wipe, .bar, .cases .num"));
  // 写真は幅0に切ってあるので自身は「画面に入った」と判定されない。親を見張る
  document.querySelectorAll(".pic:not(.is-in)").forEach(function (pic) {
    var host = pic.parentElement;
    host.__pics = (host.__pics || []).concat(pic);
    if (targets.indexOf(host) < 0) targets.push(host);
  });
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in"); io.unobserve(e.target);
          (e.target.__pics || []).forEach(function (p) { p.classList.add("is-in"); });
          if (e.target.classList.contains("num")) countUp(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add("is-in"); (el.__pics || []).forEach(function (p) { p.classList.add("is-in"); }); });
  }


  // 数字のカウントアップ（.num の先頭の数字だけ。「約66時間」「85%」「約1.5万円」）
  function countUp(el) {
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return;
    var m = node.nodeValue.match(/^(\D*)([\d.]+)(.*)$/);
    if (!m) return;
    var pre = m[1], target = parseFloat(m[2]), post = m[3], dec = (m[2].split(".")[1] || "").length;
    var t0 = null, dur = 1200;
    var step = function (ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      node.nodeValue = pre + (target * e).toFixed(dec) + post;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // 読了の線
  var bar = document.querySelector(".progress");
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, scrollY / h) : 0) + ")";
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
  }

  // 暖簾：布が風で波打ち、カーソルの動きでなびく
  var noren = document.querySelector(".noren");
  if (noren && !reduce) {
    var turb = noren.querySelector("feTurbulence"), disp = noren.querySelector("feDisplacementMap");
    var leans = [].slice.call(noren.querySelectorAll(".lean"));
    var fvBox = document.querySelector(".fv");
    var t = 0, gust = 0, target = 0, cur = 0, lastX = null, lastT = 0, visible = true, last = 0;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(fvBox);
    fvBox.addEventListener("pointermove", function (e) {
      var r = fvBox.getBoundingClientRect();
      target = ((e.clientX - r.left) / r.width - 0.5) * -5;
      var now = performance.now();
      if (lastX !== null) gust = Math.min(1.4, gust + Math.abs(e.clientX - lastX) / Math.max(16, now - lastT) * 0.08);
      lastX = e.clientX; lastT = now;
    });
    fvBox.addEventListener("pointerleave", function () { target = 0; lastX = null; });
    var loop = function (ts) {
      requestAnimationFrame(loop);
      if (!visible || ts - last < 33) return;
      last = ts; t += 0.033;
      gust *= 0.95;
      cur += (target - cur) * 0.06;
      var fx = 0.0035 + Math.sin(t * 0.9) * 0.0008, fy = 0.006 + Math.cos(t * 0.6) * 0.0015;
      turb.setAttribute("baseFrequency", fx.toFixed(4) + " " + fy.toFixed(4));
      disp.setAttribute("scale", (5 + Math.sin(t * 1.3) * 1.5 + gust * 12).toFixed(1));
      leans.forEach(function (g, i) {
        var k = parseFloat(g.getAttribute("data-k")) || 1;
        g.style.transform = "skewX(" + (cur * (0.9 + k * 0.1) + Math.sin(t * 1.7 - i * 0.35) * gust * 1.6).toFixed(2) + "deg)";
      });
    };
    requestAnimationFrame(loop);
  }


  // 事例・作例の絞り込み
  document.querySelectorAll(".cases-box").forEach(function (box) {
    var f = box.querySelector(".case-filter");
    if (!f) return;
    f.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var k = b.getAttribute("data-kind");
      f.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      box.querySelectorAll(".case").forEach(function (c) { c.hidden = !!k && c.getAttribute("data-kind") !== k; });
    });
  });

  // AI瓦版：data/feed.json を読んで一覧にする
  var feed = document.querySelector("[data-feed]");
  if (!feed) return;
  var src = feed.getAttribute("data-feed");
  var limit = parseInt(feed.getAttribute("data-limit") || "0", 10);
  var list = feed.querySelector(".feed");
  var filter = feed.querySelector(".feed-filter");
  var updated = feed.querySelector("[data-updated]");
  var moreWrap = feed.querySelector(".feed-more");
  var expanded = false;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(d) { return String(d || "").replace(/-/g, "."); }
  function safeUrl(u) { return /^https?:\/\//.test(u || "") ? u : "#"; }

  function render(items, tool) {
    var all = items.filter(function (it) { return !tool || it.tool === tool; });
    var rows = (limit && !expanded) ? all.slice(0, limit) : all;
    if (moreWrap) moreWrap.hidden = !(limit && !expanded && all.length > limit);
    list.innerHTML = rows.map(function (it) {
      return '<li><a href="' + esc(safeUrl(it.url)) + '" target="_blank" rel="noopener noreferrer">' +
        '<time datetime="' + esc(it.date) + '">' + esc(fmt(it.date)) + "</time>" +
        '<span class="tag">' + esc(it.tool) + "</span>" +
        '<div class="body"><h3>' + esc(it.title) + "</h3>" +
        '<span class="sum">' + esc(it.summary) + "</span>" +
        '<span class="src">' + esc(it.org) + "｜出典：" + esc(it.source) + "</span></div>" +
        '<span class="circ" aria-hidden="true"></span></a></li>';
    }).join("");
  }

  fetch(src, { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var items = (data.items || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      if (updated && data.updated) updated.textContent = fmt(data.updated) + " 更新";
      var cur = "";
      render(items, cur);
      if (moreWrap) {
        moreWrap.querySelector("button").addEventListener("click", function () {
          expanded = true; render(items, cur);
          var next = list.querySelectorAll("li a")[limit];
          if (next) next.focus({ preventScroll: true });
        });
      }
      if (filter) {
        var tools = [];
        items.forEach(function (it) { if (tools.indexOf(it.tool) < 0) tools.push(it.tool); });
        filter.innerHTML = ['<button type="button" aria-pressed="true" data-tool="">すべて</button>']
          .concat(tools.map(function (x) { return '<button type="button" aria-pressed="false" data-tool="' + esc(x) + '">' + esc(x) + "</button>"; }))
          .join("");
        filter.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          filter.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          cur = b.getAttribute("data-tool");
          render(items, cur);
        });
      }
    })
    .catch(function () {
      list.innerHTML = '<li class="note">事例を読み込めませんでした。時間をおいて開き直してください。</li>';
    });
})();
