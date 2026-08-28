// ==================================================================
// NARUTO / NINJA ANIME FX — leaves, chakra sparks, weapon decorations
// Pure original decorative artwork (no copyrighted assets).
// ==================================================================
(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SHURIKEN_SVG = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <g fill="#d9dbe0" stroke="#0a0a0c" stroke-width="2">
        <path d="M50 4 L58 40 L96 30 L62 50 L96 70 L58 60 L50 96 L42 60 L4 70 L38 50 L4 30 L42 40 Z"/>
      </g>
      <circle cx="50" cy="50" r="8" fill="#1a1b1e"/>
    </svg>`;

  const KUNAI_SVG = `
    <svg viewBox="0 0 40 120" xmlns="http://www.w3.org/2000/svg">
      <polygon points="20,0 30,34 20,26 10,34" fill="#c7ccd4" stroke="#0a0a0c" stroke-width="1.5"/>
      <rect x="16" y="30" width="8" height="58" fill="#a7abb3" stroke="#0a0a0c" stroke-width="1.5"/>
      <rect x="10" y="86" width="20" height="10" rx="2" fill="#2b1205" stroke="#0a0a0c" stroke-width="1.5"/>
      <rect x="13" y="94" width="14" height="22" rx="2" fill="#1c1d22" stroke="#0a0a0c" stroke-width="1.5"/>
    </svg>`;

  // Original spiral (uzumaki-style) watermark artwork — generic spiral, not a trademarked emblem.
  function spiralPath() {
    let d = '';
    const turns = 4.5, steps = 200, cx = 450, cy = 450;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * turns * Math.PI * 2;
      const r = t * 420;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }
    return d;
  }
  const SPIRAL_SVG = `
    <svg class="spiral-watermark" viewBox="0 0 900 900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="${spiralPath()}" fill="none" stroke="#FF7A18" stroke-width="14" stroke-linecap="round"/>
    </svg>`;

  // ---------------------------------------------------------------
  // 0. Intro splash — headband slash reveal on first load
  // ---------------------------------------------------------------
  if (!prefersReducedMotion) {
    const splash = document.createElement('div');
    splash.id = 'ninjaSplash';
    splash.innerHTML = `
      <div class="splash-plate"></div>
      <p class="splash-label">Entering the village…</p>
    `;
    document.body.prepend(splash);
    window.addEventListener('load', () => {
      setTimeout(() => splash.classList.add('hide'), 1500);
      setTimeout(() => splash.remove(), 2200);
    });
  }

  // ---------------------------------------------------------------
  // 0b. Chakra Mode toggle
  // ---------------------------------------------------------------
  const toggle = document.createElement('button');
  toggle.id = 'chakraToggle';
  toggle.type = 'button';
  toggle.innerHTML = '<span class="dot"></span><span class="label">Activate Chakra Mode</span>';
  toggle.addEventListener('click', () => {
    const on = document.body.classList.toggle('chakra-mode');
    toggle.classList.toggle('active', on);
    toggle.querySelector('.label').textContent = on ? 'Chakra Mode: ON' : 'Activate Chakra Mode';
  });
  document.body.appendChild(toggle);

  // ---------------------------------------------------------------
  // 1. Inject hero chakra backdrop + floating weapon decorations
  // ---------------------------------------------------------------
  const hero3d = document.getElementById('hero3d');
  if (hero3d) {
    const bg = document.createElement('div');
    bg.className = 'hero-chakra-bg';
    bg.innerHTML = SPIRAL_SVG;
    hero3d.prepend(bg);

    const weapons = document.createElement('div');
    weapons.className = 'hero-weapons';
    weapons.innerHTML = `
      <div class="fx-kunai k1">${KUNAI_SVG}</div>
      <div class="fx-kunai k2">${KUNAI_SVG}</div>
      <div class="fx-kunai k3">${KUNAI_SVG}</div>
      <div class="fx-shuriken s1">${SHURIKEN_SVG}</div>
      <div class="fx-shuriken s2">${SHURIKEN_SVG}</div>
      <div class="fx-shuriken s3">${SHURIKEN_SVG}</div>
    `;
    hero3d.appendChild(weapons);
  }

  // Swap the plain loader dots for a rasengan spinner
  const loading = document.getElementById('hero3dLoading');
  if (loading) {
    loading.innerHTML = '<div class="rasengan"></div>';
  }

  // ---------------------------------------------------------------
  // 2. Spinning shuriken dividers between major sections
  // ---------------------------------------------------------------
  document.querySelectorAll('main > .section').forEach((section, i) => {
    if (i === 0) return; // no divider before the first section
    const div = document.createElement('div');
    div.className = 'jutsu-divider';
    div.setAttribute('aria-hidden', 'true');
    div.innerHTML = SHURIKEN_SVG;
    section.parentNode.insertBefore(div, section);
  });

  // ---------------------------------------------------------------
  // 3. Radial hover glow follows the cursor on glass cards/tags
  // ---------------------------------------------------------------
  document.querySelectorAll('.hover-glass').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      el.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    });
  });

  // ---------------------------------------------------------------
  // 4. Chakra spark cursor trail (throttled, desktop only)
  // ---------------------------------------------------------------
  if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    let lastSpark = 0;
    document.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastSpark < 45) return;
      lastSpark = now;
      const spark = document.createElement('div');
      spark.className = 'chakra-spark';
      spark.style.left = `${e.clientX - 3}px`;
      spark.style.top = `${e.clientY - 3}px`;
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 700);
    });
  }

  // ---------------------------------------------------------------
  // 5. Falling-leaf storm canvas — subtle, full-page, reduced-motion aware
  // ---------------------------------------------------------------
  if (prefersReducedMotion) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'leafCanvas';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let w, h, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const LEAF_COUNT = window.innerWidth < 700 ? 12 : 22;
  const leafColors = ['#FF7A18', '#FFB25E', '#E4291B', '#c9762f'];

  function makeLeaf() {
    return {
      x: Math.random() * w,
      y: Math.random() * -h,
      size: 6 + Math.random() * 7,
      speedY: 0.35 + Math.random() * 0.6,
      speedX: (Math.random() - 0.5) * 0.6,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      color: leafColors[Math.floor(Math.random() * leafColors.length)],
    };
  }

  const leaves = Array.from({ length: LEAF_COUNT }, makeLeaf);

  function drawLeaf(l) {
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(l.rot);
    ctx.fillStyle = l.color;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(0, -l.size);
    ctx.bezierCurveTo(l.size, -l.size * 0.6, l.size, l.size * 0.6, 0, l.size);
    ctx.bezierCurveTo(-l.size, l.size * 0.6, -l.size, -l.size * 0.6, 0, -l.size);
    ctx.fill();
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const l of leaves) {
      l.sway += l.swaySpeed;
      l.x += l.speedX + Math.sin(l.sway) * 0.4;
      l.y += l.speedY;
      l.rot += l.rotSpeed;
      if (l.y > h + 20) {
        Object.assign(l, makeLeaf(), { y: -20 });
      }
      if (l.x < -20) l.x = w + 20;
      if (l.x > w + 20) l.x = -20;
      drawLeaf(l);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
