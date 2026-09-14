// Cinematic pirate-adventure effects. All decorative marks are original CSS/canvas shapes.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = document.getElementById('siteLoader');

  function dismissLoader() {
    if (!loader || loader.classList.contains('is-gone')) return;
    // Let the seal complete a short visual beat, without holding up the page.
    window.setTimeout(() => loader.classList.add('is-gone'), reducedMotion ? 0 : 520);
  }

  if (document.readyState === 'complete') dismissLoader();
  else window.addEventListener('load', dismissLoader, { once: true });
  window.setTimeout(dismissLoader, 4800);

  // Keep the hero's WebGL fallback/loading state in the same visual language.
  const heroLoader = document.getElementById('hero3dLoading');
  if (heroLoader) heroLoader.innerHTML = '<div class="hero-seal-loader"></div>';

  const heroStage = document.getElementById('hero3d');
  const hero = document.querySelector('.hero');
  if (heroStage) {
    const marks = document.createElement('div');
    marks.className = 'hero-marks';
    marks.setAttribute('aria-hidden', 'true');
    marks.innerHTML = '<span></span><span></span><span></span>';
    heroStage.appendChild(marks);
  }

  // Delicate perspective response makes the entire 3D stage feel connected to the cursor.
  if (hero && !reducedMotion && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('pointermove', (event) => {
      const bounds = hero.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - .5) * 22;
      const y = ((event.clientY - bounds.top) / bounds.height - .5) * 18;
      hero.style.setProperty('--px', `${x}px`);
      hero.style.setProperty('--py', `${y}px`);
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--px', '0px');
      hero.style.setProperty('--py', '0px');
    });
  }

  // Make navigation feel anchored as the visitor crosses the hero.
  const nav = document.getElementById('siteNav');
  const updateNav = () => nav?.classList.toggle('scrolled', window.scrollY > 28);
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  // Make zoom unmistakable on the rest of the page as well as in the 3D hero.
  // Each section grows toward 100% as it approaches the viewport centre, and
  // eases back out as it leaves—so scroll down and scroll up both read clearly.
  const zoomPanels = [...document.querySelectorAll('.section-inner')];
  let zoomFrame;
  function updateSectionZoom() {
    zoomFrame = undefined;
    const viewportCenter = window.innerHeight * .51;
    const range = Math.max(window.innerHeight * .72, 1);
    zoomPanels.forEach((panel) => {
      const rect = panel.getBoundingClientRect();
      const panelCenter = rect.top + rect.height / 2;
      const proximity = Math.max(0, Math.min(1, 1 - Math.abs(panelCenter - viewportCenter) / range));
      const scale = .91 + proximity * .09;
      const opacity = .62 + proximity * .38;
      panel.style.setProperty('--section-zoom', scale.toFixed(3));
      panel.style.setProperty('--section-opacity', opacity.toFixed(3));
      panel.classList.toggle('is-scroll-focus', proximity > .7);
    });
  }
  function scheduleSectionZoom() {
    if (!zoomFrame) zoomFrame = window.requestAnimationFrame(updateSectionZoom);
  }
  updateSectionZoom();
  window.addEventListener('scroll', scheduleSectionZoom, { passive: true });
  window.addEventListener('resize', scheduleSectionZoom, { passive: true });

  // A narrow, light cursor trail only on pointer devices.
  if (!reducedMotion && window.matchMedia('(hover: hover)').matches) {
    let previous = 0;
    document.addEventListener('pointermove', (event) => {
      const now = performance.now();
      if (now - previous < 70) return;
      previous = now;
      const spark = document.createElement('i');
      spark.className = 'chakra-spark';
      spark.style.left = `${event.clientX}px`;
      spark.style.top = `${event.clientY}px`;
      document.body.appendChild(spark);
      window.setTimeout(() => spark.remove(), 650);
    }, { passive: true });
  }

  // Sea-spray glints in the background; canvas avoids dozens of live DOM nodes.
  if (reducedMotion) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'leafCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const colors = ['#5bd5e7', '#ffe099', '#ffffff', '#4e9c78'];
  function makeSeaGlint(initial = false) {
    return {
      x: Math.random() * width,
      y: initial ? Math.random() * height : -24 - Math.random() * height * .25,
      size: 3 + Math.random() * 5.5,
      drift: (Math.random() - .5) * .46,
      speed: .16 + Math.random() * .42,
      turn: Math.random() * Math.PI * 2,
      turnRate: .008 + Math.random() * .016,
      angle: Math.random() * Math.PI,
      angleRate: (Math.random() - .5) * .036,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  const count = window.innerWidth < 720 ? 9 : 18;
  const leaves = Array.from({ length: count }, () => makeSeaGlint(true));

  function paintSeaGlint(leaf) {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.angle);
    ctx.globalAlpha = .36;
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.moveTo(-leaf.size, 0);
    ctx.quadraticCurveTo(0, -leaf.size * .55, leaf.size, 0);
    ctx.quadraticCurveTo(0, leaf.size * .55, -leaf.size, 0);
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let index = 0; index < leaves.length; index += 1) {
      const leaf = leaves[index];
      leaf.turn += leaf.turnRate;
      leaf.x += leaf.drift + Math.sin(leaf.turn) * .3;
      leaf.y += leaf.speed;
      leaf.angle += leaf.angleRate;
      if (leaf.y > height + 20 || leaf.x < -20 || leaf.x > width + 20) leaves[index] = makeSeaGlint();
      paintSeaGlint(leaves[index]);
    }
    window.requestAnimationFrame(animate);
  }
  animate();
})();
