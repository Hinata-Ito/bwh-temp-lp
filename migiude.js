/* ============================================================
   Migiude Design System — 共通スクリプト
   ヘッダー / スクロールreveal / kinetic hero / FAQ /
   ヒーロー背景ネットワーク（--accent色を自動反映）/ Note事例ローダー
   ============================================================ */
(function(){
  'use strict';

  // accent(hex) → "r,g,b"
  function accentRGB(){
    var c=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#2563EB';
    var m=c.replace('#','');
    if(m.length===3){m=m[0]+m[0]+m[1]+m[1]+m[2]+m[2];}
    var n=parseInt(m,16);
    return (n>>16&255)+','+(n>>8&255)+','+(n&255);
  }

  // header scroll state
  var hd=document.getElementById('hd');
  if(hd){ addEventListener('scroll',function(){hd.classList.toggle('scr',scrollY>20);},{passive:true}); }

  // reveal on scroll
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in'); io.unobserve(e.target);}});},{threshold:.14});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});

  // kinetic hero
  setTimeout(function(){document.body.classList.add('loaded');},120);

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(function(it){
    var q=it.querySelector('.faq-q');
    if(q) q.addEventListener('click',function(){it.classList.toggle('open');});
  });

  // Hero light network — 白地に淡いアクセント色の線・点（演出は軽く）
  var cv=document.getElementById('net');
  if(cv && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    var cx=cv.getContext('2d'), rgb=accentRGB(), W,H,pts;
    var DPR=Math.min(devicePixelRatio||1,2);
    function init(){var n=Math.min(46,Math.round(cv.offsetWidth/26));pts=Array.from({length:n},function(){return {x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.18*DPR,vy:(Math.random()-.5)*.18*DPR,r:(Math.random()*1.6+.6)*DPR};});}
    function rz(){W=cv.width=cv.offsetWidth*DPR;H=cv.height=cv.offsetHeight*DPR;init();}
    function draw(){
      cx.clearRect(0,0,W,H);
      for(var i=0;i<pts.length;i++){var a=pts[i];
        for(var j=i+1;j<pts.length;j++){var b=pts[j];var d=Math.hypot(a.x-b.x,a.y-b.y);var md=150*DPR;
          if(d<md){cx.globalAlpha=(1-d/md)*.16;cx.strokeStyle='rgb('+rgb+')';cx.lineWidth=1;cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke();}}
      }
      cx.globalAlpha=1;
      pts.forEach(function(p){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
        cx.fillStyle='rgba('+rgb+',.35)';cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill();});
      requestAnimationFrame(draw);
    }
    addEventListener('resize',rz); rz(); draw();
  }

  // ── Note事例ローダー ──
  // opts.sources: 読むマガジンキー配列（例 ['ai'] / ['cases']）, opts.limit=3
  function esc(s){var t=document.createElement('div');t.textContent=s==null?'':String(s);return t.innerHTML;}
  function card(it){
    var link=esc(it.link||'#'), thumb=it.thumbnail?'<img src="'+esc(it.thumbnail)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':'';
    return '<a class="note-card" href="'+link+'" target="_blank" rel="noopener">'
      +'<div class="note-thumb">'+thumb+'</div>'
      +'<div class="note-body"><h3 class="note-title">'+esc(it.title)+'</h3>'
      +'<p class="note-exc">'+esc(it.excerpt||'')+'</p>'
      +'<span class="note-link">記事を読む →</span></div></a>';
  }
  window.loadMigiudeNotes=function(opts){
    opts=opts||{};
    var grid=document.getElementById(opts.gridId||'note-grid');
    if(!grid) return;
    fetch('note-feed.json?t='+Date.now(),{cache:'no-store'})
      .then(function(r){return r.ok?r.json():null;})
      .then(function(d){
        if(!d) return;
        var items=[];
        (opts.sources||['ai']).forEach(function(k){items=items.concat(d[k]||[]);});
        var seen={}; items=items.filter(function(it){if(!it||!it.link||seen[it.link])return false;seen[it.link]=1;return true;});
        var pick=items.slice(0,opts.limit||3);
        if(pick.length) grid.innerHTML=pick.map(card).join('');   // 0件なら Coming Soon のまま
      })
      .catch(function(){/* file://プレビュー等で取得不可なら Coming Soon */});
  };
})();
