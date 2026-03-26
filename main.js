/* ===================================================
   BWH総合研究所 - メインJavaScript
   近未来的なCanvasアニメーション
   =================================================== */

// ===== HERO CANVAS =====
(function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, animId;
  const particles = [];
  const lines = [];
  const NUM_PARTICLES = 120;
  const NUM_LINES = 8;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  // Particle class
  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 10;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -(Math.random() * 0.6 + 0.1);
      this.size = Math.random() * 1.5 + 0.3;
      this.alpha = Math.random() * 0.6 + 0.1;
      this.life = 0;
      this.maxLife = Math.random() * 300 + 200;
      // Color: cyan/purple/gold
      const hues = [200, 260, 45];
      this.hue = hues[Math.floor(Math.random() * hues.length)];
      this.sat = Math.random() * 30 + 70;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife || this.y < -10) this.reset(false);
    }
    draw() {
      const progress = this.life / this.maxLife;
      const fade = progress < 0.1 ? progress / 0.1 : progress > 0.8 ? (1 - progress) / 0.2 : 1;
      ctx.save();
      ctx.globalAlpha = this.alpha * fade;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `hsla(${this.hue}, ${this.sat}%, 70%, 0.8)`;
      ctx.fillStyle = `hsla(${this.hue}, ${this.sat}%, 80%, 1)`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Energy line class
  class EnergyLine {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 50;
      this.len = Math.random() * 120 + 40;
      this.speed = Math.random() * 3 + 1;
      this.alpha = Math.random() * 0.3 + 0.05;
      this.width = Math.random() * 1.5 + 0.3;
      const hues = [200, 260, 45, 320];
      this.hue = hues[Math.floor(Math.random() * hues.length)];
      this.angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    }
    update() {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      if (this.y < -this.len) this.reset(false);
    }
    draw() {
      const x2 = this.x - Math.cos(this.angle) * this.len;
      const y2 = this.y - Math.sin(this.angle) * this.len;
      const grad = ctx.createLinearGradient(x2, y2, this.x, this.y);
      grad.addColorStop(0, `hsla(${this.hue}, 90%, 70%, 0)`);
      grad.addColorStop(0.5, `hsla(${this.hue}, 90%, 70%, ${this.alpha})`);
      grad.addColorStop(1, `hsla(${this.hue}, 90%, 70%, 0)`);
      ctx.save();
      ctx.strokeStyle = grad;
      ctx.lineWidth = this.width;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `hsla(${this.hue}, 90%, 70%, 0.5)`;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Grid lines
  function drawGrid() {
    const spacing = 80;
    ctx.save();
    ctx.strokeStyle = 'rgba(108, 99, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Nebula / glow blobs
  let t = 0;
  function drawNebula() {
    t += 0.003;
    const blobs = [
      { x: W * 0.2 + Math.sin(t * 0.7) * 80, y: H * 0.3 + Math.cos(t * 0.5) * 60, r: 300, h: 260, s: 80, a: 0.06 },
      { x: W * 0.8 + Math.sin(t * 0.4) * 100, y: H * 0.6 + Math.cos(t * 0.6) * 80, r: 350, h: 200, s: 90, a: 0.05 },
      { x: W * 0.5 + Math.sin(t * 0.9) * 60, y: H * 0.5 + Math.cos(t * 0.3) * 50, r: 250, h: 45, s: 70, a: 0.04 },
    ];
    blobs.forEach(b => {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, `hsla(${b.h}, ${b.s}%, 60%, ${b.a})`);
      g.addColorStop(1, `hsla(${b.h}, ${b.s}%, 60%, 0)`);
      ctx.save();
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function init() {
    resize();
    particles.length = 0;
    lines.length = 0;
    for (let i = 0; i < NUM_PARTICLES; i++) particles.push(new Particle());
    for (let i = 0; i < NUM_LINES; i++) lines.push(new EnergyLine());
  }

  function animate() {
    animId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, W, H);

    // Dark background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#05050d');
    bg.addColorStop(0.5, '#080812');
    bg.addColorStop(1, '#050510');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawGrid();
    drawNebula();
    lines.forEach(l => { l.update(); l.draw(); });
    particles.forEach(p => { p.update(); p.draw(); });
  }

  init();
  animate();

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    init();
    animate();
  });
})();


// ===== RING CANVAS (Message Section) =====
(function initRingCanvas() {
  const canvas = document.getElementById('ring-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, animId;
  let t = 0;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = rect.width || 400;
    H = canvas.height = rect.height || 400;
  }

  function drawRings() {
    const cx = W / 2;
    const cy = H / 2;
    const baseR = Math.min(W, H) * 0.35;

    // Multiple rotating rings
    const rings = [
      { r: baseR, rot: t * 0.5, tilt: 0.3, color: '#c9a84c', alpha: 0.6, width: 1.5 },
      { r: baseR * 0.85, rot: -t * 0.7, tilt: 0.5, color: '#6c63ff', alpha: 0.4, width: 1 },
      { r: baseR * 1.15, rot: t * 0.3, tilt: 0.7, color: '#00d4ff', alpha: 0.3, width: 0.8 },
      { r: baseR * 0.65, rot: t * 0.9, tilt: 0.2, color: '#ff6b9d', alpha: 0.25, width: 0.6 },
    ];

    rings.forEach(ring => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ring.rot);

      // Draw ellipse to simulate 3D ring
      const scaleY = Math.abs(Math.sin(ring.tilt + t * 0.2));
      ctx.scale(1, 0.3 + scaleY * 0.5);

      const grad = ctx.createLinearGradient(-ring.r, 0, ring.r, 0);
      grad.addColorStop(0, `${ring.color}00`);
      grad.addColorStop(0.3, `${ring.color}${Math.floor(ring.alpha * 255).toString(16).padStart(2, '0')}`);
      grad.addColorStop(0.7, `${ring.color}${Math.floor(ring.alpha * 255).toString(16).padStart(2, '0')}`);
      grad.addColorStop(1, `${ring.color}00`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = ring.width;
      ctx.shadowBlur = 15;
      ctx.shadowColor = ring.color;
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // Center glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.4);
    glow.addColorStop(0, 'rgba(201, 168, 76, 0.08)');
    glow.addColorStop(1, 'rgba(201, 168, 76, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting dots
    const dotCount = 6;
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2 + t * 0.8;
      const r = baseR * (0.7 + Math.sin(t * 0.5 + i) * 0.15);
      const dx = cx + Math.cos(angle) * r;
      const dy = cy + Math.sin(angle) * r * 0.4;
      const colors = ['#c9a84c', '#6c63ff', '#00d4ff', '#ff6b9d', '#c9a84c', '#6c63ff'];
      ctx.save();
      ctx.fillStyle = colors[i];
      ctx.shadowBlur = 10;
      ctx.shadowColor = colors[i];
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function animate() {
    animId = requestAnimationFrame(animate);
    t += 0.012;
    ctx.clearRect(0, 0, W, H);
    drawRings();
  }

  resize();
  animate();

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    resize();
    animate();
  });
})();


// ===== CONTACT BG CANVAS =====
(function initContactCanvas() {
  const canvas = document.getElementById('contact-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, animId;
  let t = 0;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function animate() {
    animId = requestAnimationFrame(animate);
    t += 0.005;
    ctx.clearRect(0, 0, W, H);

    // Subtle animated gradient
    const blobs = [
      { x: W * 0.1 + Math.sin(t) * 100, y: H * 0.2 + Math.cos(t * 0.7) * 80, r: 400, h: 260, a: 0.04 },
      { x: W * 0.9 + Math.sin(t * 0.6) * 80, y: H * 0.8 + Math.cos(t * 0.4) * 60, r: 350, h: 200, a: 0.03 },
    ];
    blobs.forEach(b => {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, `hsla(${b.h}, 80%, 60%, ${b.a})`);
      g.addColorStop(1, `hsla(${b.h}, 80%, 60%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  resize();
  animate();

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    resize();
    animate();
  });
})();


// ===== HEADER SCROLL =====
(function initHeader() {
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
})();


// ===== HAMBURGER MENU (Dropdown) =====
(function initHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('dropdown-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.classList.toggle('active');
    nav.classList.toggle('open');
  });

  // 外側クリックで閉じる
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !nav.contains(e.target)) {
      btn.classList.remove('active');
      nav.classList.remove('open');
    }
  });
})();

function closeDropdown() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('dropdown-nav');
  if (btn) btn.classList.remove('active');
  if (nav) nav.classList.remove('open');
}


// ===== SCROLL ANIMATIONS =====
(function initScrollAnimations() {
  // fade-up クラスが既に付いている要素も含めて全て監視
  const selector = [
    '.message-heading',
    '.message-body',
    '.service-card',
    '.case-card',
    '.knowledge-card',
    '.company-table',
    '.contact-form',
    '.knowledge-genre-block',
    '.other-service-banner',
    '.founder-img-wrap',
    '.founder-text',
    '.fade-up'
  ].join(', ');

  const targets = document.querySelectorAll(selector);

  // まだ fade-up が付いていない要素に付与
  targets.forEach(el => {
    if (!el.classList.contains('fade-up')) el.classList.add('fade-up');
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px 100px 0px' });

  targets.forEach(el => observer.observe(el));
})();


// ===== CONTACT FORM =====
(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    btn.textContent = '送信中...';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = '送信が完了しました';
      btn.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
      form.reset();
    }, 1500);
  });
})();


// ===== SECTION LABEL PARALLAX =====
(function initParallax() {
  const labels = document.querySelectorAll('.section-label-en');
  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    labels.forEach(label => {
      const section = label.closest('section');
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const offset = rect.top * 0.05;
      label.style.transform = `translateY(${offset}px)`;
    });
  }, { passive: true });
})();
