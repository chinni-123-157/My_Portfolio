/**
 * Interactive 3D desk workspace — hero visual.
 * Built from primitive geometries (no external models), lit for a
 * premium dark/gold cinematic look. Drag to orbit, scroll to zoom,
 * gentle idle auto-rotate when the visitor isn't interacting.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('hero3d');
const canvas = document.getElementById('scene-canvas');
const loadingEl = document.getElementById('hero3dLoading');
const hintEl = document.getElementById('hero3dHint');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fail(reason){
  console.warn('3D scene unavailable:', reason);
  container.classList.add('no-webgl');
  loadingEl.classList.add('hidden');
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (e) {
  fail(e);
}

if (renderer) {
  init();
}

function init(){
  const COLORS = {
    bg: 0x0a0a0c,
    wood: 0x3a2c22,
    woodDark: 0x241a14,
    metal: 0x8b8d94,
    fabric: 0x1c1e24,
    screenGlow: 0xe7cd7a,
    gold: 0xc9a227,
    plant: 0x3f6b4a,
    pot: 0x545860,
  };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.bg);
  scene.fog = new THREE.Fog(COLORS.bg, 9, 20);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(4.6, 3.1, 6.2);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ---------------------------------------------------------------
  // Lighting
  // ---------------------------------------------------------------
  scene.add(new THREE.AmbientLight(0x3b3f4d, 0.9));

  const keyLight = new THREE.DirectionalLight(0xffe3ab, 1.7);
  keyLight.position.set(5, 7, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -6;
  keyLight.shadow.camera.right = 6;
  keyLight.shadow.camera.top = 6;
  keyLight.shadow.camera.bottom = -6;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x6ea8ff, 0.7);
  rimLight.position.set(-6, 4, -5);
  scene.add(rimLight);

  const screenLight = new THREE.PointLight(COLORS.screenGlow, 1.4, 4.5, 2);
  screenLight.position.set(0, 1.85, -0.55);
  scene.add(screenLight);

  // ---------------------------------------------------------------
  // Floor
  // ---------------------------------------------------------------
  const floorTex = makeGridTexture();
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(11, 64),
    new THREE.MeshStandardMaterial({ color: 0x121319, roughness: 0.95, metalness: 0.05, map: floorTex })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ---------------------------------------------------------------
  // Rig group — everything sits inside this so we can rotate as one
  // ---------------------------------------------------------------
  const rig = new THREE.Group();
  scene.add(rig);

  // ---- Desk ----
  const desk = new THREE.Group();
  const deskMat = new THREE.MeshStandardMaterial({ color: COLORS.wood, roughness: 0.55, metalness: 0.08 });
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.09, 1.7), deskMat);
  deskTop.position.y = 1.0;
  deskTop.castShadow = true; deskTop.receiveShadow = true;
  desk.add(deskTop);

  const legMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.6, metalness: 0.1 });
  const legGeo = new THREE.BoxGeometry(0.09, 0.98, 0.09);
  const legOffsets = [[-1.68, 0.51, -0.72], [1.68, 0.51, -0.72], [-1.68, 0.51, 0.72], [1.68, 0.51, 0.72]];
  legOffsets.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    desk.add(leg);
  });
  rig.add(desk);

  // ---- Monitor ----
  const monitor = new THREE.Group();
  const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.03, 24), new THREE.MeshStandardMaterial({ color: COLORS.metal, roughness: 0.4, metalness: 0.7 }));
  standBase.position.set(0, 1.045, -0.5);
  standBase.castShadow = true;
  monitor.add(standBase);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.06), new THREE.MeshStandardMaterial({ color: COLORS.metal, roughness: 0.4, metalness: 0.7 }));
  neck.position.set(0, 1.22, -0.5);
  neck.castShadow = true;
  monitor.add(neck);

  const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.92, 0.04), new THREE.MeshStandardMaterial({ color: 0x14151a, roughness: 0.5, metalness: 0.3 }));
  screenFrame.position.set(0, 1.78, -0.52);
  screenFrame.castShadow = true;
  monitor.add(screenFrame);

  const screenCanvas = makeCodeCanvas();
  const screenTex = new THREE.CanvasTexture(screenCanvas.canvas);
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex, emissive: new THREE.Color(0x2a2410), emissiveMap: screenTex, emissiveIntensity: 1.1,
    roughness: 0.3, metalness: 0.1,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.82), screenMat);
  screen.position.set(0, 1.78, -0.499);
  monitor.add(screen);
  desk.add(monitor);

  // ---- Keyboard ----
  const keyboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.03, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x1e1f24, roughness: 0.7 })
  );
  keyboard.position.set(-0.1, 1.06, 0.28);
  keyboard.rotation.y = -0.03;
  keyboard.castShadow = true;
  desk.add(keyboard);
  desk.add(makeKeyGrid(-0.1, 1.075, 0.28));

  // ---- Mouse ----
  const mouse = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x24252b, roughness: 0.5 })
  );
  mouse.scale.set(1, 0.55, 1.4);
  mouse.position.set(0.55, 1.045, 0.32);
  mouse.castShadow = true;
  desk.add(mouse);

  // ---- Laptop (closed-ish, tilted open) ----
  const laptop = new THREE.Group();
  const lapBase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.025, 0.42), new THREE.MeshStandardMaterial({ color: 0xa9abb2, roughness: 0.35, metalness: 0.6 }));
  lapBase.position.set(0, 1.03, 0);
  lapBase.castShadow = true;
  laptop.add(lapBase);

  const lapScreenPivot = new THREE.Group();
  lapScreenPivot.position.set(0, 1.03, -0.2);
  const lapScreen = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.02), new THREE.MeshStandardMaterial({ color: 0xa9abb2, roughness: 0.35, metalness: 0.6 }));
  lapScreen.position.set(0, 0.2, 0);
  lapScreen.rotation.x = -0.32;
  lapScreen.castShadow = true;
  lapScreenPivot.add(lapScreen);

  const lapGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x0d0e12, emissive: 0xcaa54a, emissiveIntensity: 0.35, roughness: 0.4 })
  );
  lapGlow.position.set(0, 0.2, 0.011);
  lapGlow.rotation.x = -0.32;
  lapScreenPivot.add(lapGlow);

  laptop.add(lapScreenPivot);
  laptop.position.set(1.15, 0, -0.15);
  desk.add(laptop);

  // ---- Mug ----
  const mug = new THREE.Group();
  const mugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.15, 20), new THREE.MeshStandardMaterial({ color: COLORS.gold, roughness: 0.5 }));
  mugBody.position.set(-1.35, 1.115, 0.35);
  mugBody.castShadow = true;
  mug.add(mugBody);
  const handleGeo = new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI * 1.3);
  const mugHandle = new THREE.Mesh(handleGeo, new THREE.MeshStandardMaterial({ color: COLORS.gold, roughness: 0.5 }));
  mugHandle.position.set(-1.44, 1.115, 0.35);
  mugHandle.rotation.z = Math.PI / 2;
  mug.add(mugHandle);
  desk.add(mug);

  // ---- Plant ----
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.16, 16), new THREE.MeshStandardMaterial({ color: COLORS.pot, roughness: 0.6 }));
  pot.position.set(1.62, 1.115, 0.55);
  pot.castShadow = true;
  plant.add(pot);
  const foliageMat = new THREE.MeshStandardMaterial({ color: COLORS.plant, roughness: 0.8 });
  for (let i = 0; i < 5; i++){
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), foliageMat);
    const angle = (i / 5) * Math.PI * 2;
    leaf.position.set(1.62 + Math.cos(angle) * 0.05, 1.24 + (i % 2) * 0.05, 0.55 + Math.sin(angle) * 0.05);
    leaf.castShadow = true;
    plant.add(leaf);
  }
  desk.add(plant);

  // ---- Chair ----
  const chair = new THREE.Group();
  const chairMat = new THREE.MeshStandardMaterial({ color: COLORS.fabric, roughness: 0.75 });
  const metalMat = new THREE.MeshStandardMaterial({ color: COLORS.metal, roughness: 0.4, metalness: 0.8 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.09, 0.55), chairMat);
  seat.position.set(0, 0.58, 0);
  seat.castShadow = true;
  chair.add(seat);

  const backPivot = new THREE.Group();
  backPivot.position.set(0, 0.6, -0.24);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.08), chairMat);
  back.position.set(0, 0.33, 0);
  back.rotation.x = -0.14;
  back.castShadow = true;
  backPivot.add(back);
  chair.add(backPivot);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 12), metalMat);
  pole.position.set(0, 0.34, 0);
  chair.add(pole);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16), metalMat);
  hub.position.set(0, 0.12, 0);
  chair.add(hub);

  for (let i = 0; i < 5; i++){
    const angle = (i / 5) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.035), metalMat);
    spoke.position.set(Math.cos(angle) * 0.13, 0.1, Math.sin(angle) * 0.13);
    spoke.rotation.y = -angle;
    chair.add(spoke);
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), metalMat);
    wheel.position.set(Math.cos(angle) * 0.26, 0.09, Math.sin(angle) * 0.26);
    chair.add(wheel);
  }

  chair.position.set(-0.1, 0.42, 1.5);
  chair.rotation.y = 0.35;
  rig.add(chair);

  rig.position.y = -0.55;

  // ---------------------------------------------------------------
  // Camera controls
  // ---------------------------------------------------------------
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 3.6;
  controls.maxDistance = 9.5;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 1.45;
  controls.target.set(0, 0.75, -0.1);
  controls.enablePan = false;
  controls.autoRotate = !prefersReducedMotion;
  controls.autoRotateSpeed = 0.6;
  controls.update();

  let idleTimer = null;
  function pauseAutoRotate(){
    controls.autoRotate = false;
    if (idleTimer) clearTimeout(idleTimer);
    if (!prefersReducedMotion){
      idleTimer = setTimeout(() => { controls.autoRotate = true; }, 3200);
    }
  }
  renderer.domElement.addEventListener('pointerdown', pauseAutoRotate);
  renderer.domElement.addEventListener('wheel', pauseAutoRotate, { passive: true });

  // ---------------------------------------------------------------
  // Resize
  // ---------------------------------------------------------------
  function resize(){
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------------------------------------------------------------
  // Animate — idle bob + periodic "typing" screen refresh
  // ---------------------------------------------------------------
  const clock = new THREE.Clock();
  let screenTimer = 0;

  function tick(){
    const t = clock.getElapsedTime();

    if (!prefersReducedMotion){
      monitor.position.y = Math.sin(t * 0.6) * 0.004;
      screenLight.intensity = 1.25 + Math.sin(t * 3.1) * 0.15;
    }

    screenTimer += clock.getDelta();
    if (screenTimer > 2.4){
      screenTimer = 0;
      screenCanvas.retype();
      screenTex.needsUpdate = true;
    }

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(() => {
    resize();
    renderer.render(scene, camera);
    loadingEl.classList.add('hidden');
    hintEl.classList.add('show');
    tick();
  });
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function makeGridTexture(){
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#121319';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(201,162,39,0.08)';
  ctx.lineWidth = 1;
  const step = 32;
  for (let i = 0; i <= size; i += step){
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

function makeKeyGrid(cx, cy, cz){
  const group = new THREE.Group();
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x33343b, roughness: 0.6 });
  const cols = 12, rows = 4;
  const w = 0.72, d = 0.22;
  const geo = new THREE.BoxGeometry(w / cols * 0.78, 0.012, d / rows * 0.7);
  const mesh = new THREE.InstancedMesh(geo, keyMat, cols * rows);
  let idx = 0;
  const dummy = new THREE.Object3D();
  for (let r = 0; r < rows; r++){
    for (let cIdx = 0; cIdx < cols; cIdx++){
      const x = cx - w / 2 + (cIdx + 0.5) * (w / cols) - 0.1;
      const z = cz - d / 2 + (r + 0.5) * (d / rows);
      dummy.position.set(x, cy, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx++, dummy.matrix);
    }
  }
  mesh.castShadow = true;
  group.add(mesh);
  return group;
}

function makeCodeCanvas(){
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 300;
  const ctx = canvas.getContext('2d');

  const linesPool = [
    "def build_portfolio(resume):",
    "    data = load(resume)",
    "    render(data, theme='elite')",
    "    return response(200)",
    "",
    "class Engineer:",
    "    role = 'AI/ML'",
    "    available = True",
    "",
    "SELECT * FROM projects",
    "WHERE impact = 'high';",
  ];

  function draw(){
    ctx.fillStyle = '#0d0e12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '20px monospace';
    let y = 34;
    const shuffled = linesPool.slice(Math.floor(Math.random() * 3));
    shuffled.slice(0, 9).forEach((line, i) => {
      ctx.fillStyle = i % 3 === 0 ? '#e7cd7a' : '#9fe2c6';
      ctx.fillText(line, 18, y);
      y += 28;
    });
    // blinking cursor block
    ctx.fillStyle = '#e7cd7a';
    ctx.fillRect(18, y - 20, 10, 20);
  }

  draw();
  return { canvas, retype: draw };
}
