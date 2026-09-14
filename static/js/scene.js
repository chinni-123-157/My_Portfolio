/*
  Interactive pirate-adventure hero scene.
  The ship, map sail, islands, ocean, compass, and crew are original Three.js primitives.
*/
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('hero3d');
const canvas = document.getElementById('scene-canvas');
const loadingEl = document.getElementById('hero3dLoading');
const hintEl = document.getElementById('hero3dHint');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function hideLocalLoader() {
  loadingEl?.classList.add('hidden');
  hintEl?.classList.add('show');
}

if (!container || !canvas) {
  hideLocalLoader();
} else {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (error) {
    console.warn('3D scene unavailable:', error);
    container.classList.add('no-webgl');
    hideLocalLoader();
  }
  if (renderer) init(renderer);
}

function init(renderer) {
  const C = {
    ocean: 0x0a4965,
    deep: 0x031827,
    cyan: 0x5bd5e7,
    foam: 0xc6f8f4,
    gold: 0xe4a739,
    goldSoft: 0xffe099,
    sail: 0xf2dfb5,
    wood: 0x5a301d,
    woodDark: 0x2b1a18,
    red: 0xbd4934,
    green: 0x286b57,
  };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.deep);
  scene.fog = new THREE.FogExp2(C.deep, .065);

  const camera = new THREE.PerspectiveCamera(37, 1, .1, 100);
  const baseCamera = new THREE.Vector3(5.7, 3.25, 8.7);
  camera.position.copy(baseCamera);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.HemisphereLight(0x8be3e9, 0x071522, 1.45));
  const moonLight = new THREE.DirectionalLight(0x9deaf0, 2.1);
  moonLight.position.set(-4, 7, 3);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(1024, 1024);
  scene.add(moonLight);
  const lanternLight = new THREE.PointLight(C.gold, 18, 10, 2);
  lanternLight.position.set(2.7, 1.5, 2.8);
  scene.add(lanternLight);
  const seaLight = new THREE.PointLight(C.cyan, 13, 11, 2);
  seaLight.position.set(-2.5, .2, 2);
  scene.add(seaLight);

  const ocean = makeOcean(C);
  ocean.position.y = -1.57;
  scene.add(ocean);

  const leftIsland = makeIsland(C, .86);
  leftIsland.position.set(-3.7, -1.32, -4.7);
  scene.add(leftIsland);
  const rightIsland = makeIsland(C, 1.13);
  rightIsland.position.set(3.9, -1.2, -5.2);
  scene.add(rightIsland);
  const clouds = makeClouds(C);
  clouds.position.set(2.1, 2.1, -5.8);
  scene.add(clouds);
  scene.add(makeStars(C, 125, 8));

  const ship = makeShip(C);
  ship.position.set(2.05, -.42, -.25);
  ship.rotation.y = -.27;
  ship.scale.setScalar(.94);
  scene.add(ship);

  const compass = makeCompass(C);
  compass.position.set(2.07, .45, 1.1);
  compass.scale.setScalar(.78);
  scene.add(compass);

  const waveRings = new THREE.Group();
  [1.25, 1.75, 2.25].forEach((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, .014, 8, 80),
      new THREE.MeshBasicMaterial({ color: index === 1 ? C.gold : C.cyan, transparent: true, opacity: .43, blending: THREE.AdditiveBlending }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(2.05, -1.52 + index * .006, .1);
    waveRings.add(ring);
  });
  scene.add(waveRings);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .055;
  controls.enablePan = false;
  controls.minDistance = 4.3;
  controls.maxDistance = 10;
  controls.minPolarAngle = .58;
  controls.maxPolarAngle = 1.55;
  controls.target.set(1.75, -.05, 0);
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = .36;
  controls.update();
  let spinResume;
  const pauseSpin = () => {
    controls.autoRotate = false;
    window.clearTimeout(spinResume);
    if (!reducedMotion) spinResume = window.setTimeout(() => { controls.autoRotate = true; }, 2400);
  };
  renderer.domElement.addEventListener('pointerdown', pauseSpin);
  renderer.domElement.addEventListener('wheel', pauseSpin, { passive: true });

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Deliberately strong scroll response: down = voyage toward the ship, up = pull back out.
  let zoom = 0;
  let targetZoom = 0;
  const onScroll = () => {
    targetZoom = THREE.MathUtils.clamp(window.scrollY / Math.max(window.innerHeight * .72, 1), 0, 1);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const clock = new THREE.Clock();
  let firstFrame = true;
  function render() {
    const time = clock.getElapsedTime();
    zoom = THREE.MathUtils.lerp(zoom, targetZoom, .085);
    camera.position.lerp(new THREE.Vector3(
      baseCamera.x - zoom * .68,
      baseCamera.y - zoom * .33,
      baseCamera.z - zoom * 3.05,
    ), .12);
    const nextFov = 37 - zoom * 8;
    if (Math.abs(camera.fov - nextFov) > .01) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }

    if (!reducedMotion) {
      ocean.userData.animate(time);
      ship.position.y = -.42 + Math.sin(time * 1.12) * .11;
      ship.rotation.z = Math.sin(time * .88) * .045;
      ship.rotation.x = Math.cos(time * .71) * .018;
      ship.userData.sail.rotation.y = Math.sin(time * .72) * .055;
      ship.userData.flag.rotation.z = Math.sin(time * 2.4) * .13;
      compass.rotation.z = -time * .43;
      compass.userData.needle.rotation.z = time * 1.72;
      waveRings.rotation.z = time * .08;
      waveRings.scale.setScalar(1 + Math.sin(time * 1.2) * .025);
      clouds.position.x = 2.1 + Math.sin(time * .12) * .35;
      lanternLight.intensity = 15 + Math.sin(time * 2.1) * 3;
      seaLight.intensity = 11 + Math.sin(time * 1.7 + 1) * 2;
    }
    controls.update();
    renderer.render(scene, camera);
    if (firstFrame) {
      firstFrame = false;
      hideLocalLoader();
    }
    window.requestAnimationFrame(render);
  }
  render();
}

function makeOcean(C) {
  const geometry = new THREE.PlaneGeometry(17, 13, 52, 38);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const original = [];
  for (let index = 0; index < position.count; index += 1) original.push([position.getX(index), position.getZ(index)]);
  const material = new THREE.MeshStandardMaterial({ color: C.ocean, roughness: .26, metalness: .28, transparent: true, opacity: .92, side: THREE.DoubleSide });
  const ocean = new THREE.Mesh(geometry, material);
  ocean.receiveShadow = true;
  ocean.userData.animate = (time) => {
    for (let index = 0; index < position.count; index += 1) {
      const [x, z] = original[index];
      position.setY(index, Math.sin(x * .82 + time * 1.1) * .045 + Math.cos(z * 1.04 + time * .83) * .034);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  };
  return ocean;
}

function makeShip(C) {
  const ship = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: C.wood, roughness: .58, metalness: .06 });
  const darkWood = new THREE.MeshStandardMaterial({ color: C.woodDark, roughness: .67, metalness: .04 });
  const gold = new THREE.MeshStandardMaterial({ color: C.gold, roughness: .28, metalness: .72 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.05, .55, 1.02), wood);
  hull.position.y = -.22;
  hull.scale.z = .86;
  hull.castShadow = true;
  ship.add(hull);
  const hullBottom = new THREE.Mesh(new THREE.CylinderGeometry(.42, .58, 2.85, 12, 1, false, 0, Math.PI), darkWood);
  hullBottom.rotation.z = Math.PI / 2;
  hullBottom.rotation.x = Math.PI;
  hullBottom.position.y = -.58;
  hullBottom.castShadow = true;
  ship.add(hullBottom);
  const prow = new THREE.Mesh(new THREE.ConeGeometry(.32, .94, 4), wood);
  prow.rotation.z = -Math.PI / 2;
  prow.rotation.y = Math.PI / 4;
  prow.position.set(1.82, -.03, 0);
  ship.add(prow);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.62, .10, .84), new THREE.MeshStandardMaterial({ color: 0x8c5731, roughness: .7 }));
  deck.position.y = .08;
  ship.add(deck);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 2.72, 14), darkWood);
  mast.position.set(.05, 1.36, 0);
  mast.castShadow = true;
  ship.add(mast);
  const mastTop = new THREE.Mesh(new THREE.SphereGeometry(.12, 14, 12), gold);
  mastTop.position.set(.05, 2.72, 0);
  ship.add(mastTop);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.78, 1.62), new THREE.MeshStandardMaterial({ map: makeSailTexture(), side: THREE.DoubleSide, roughness: .72, metalness: 0 }));
  sail.position.set(-.72, 1.69, .02);
  sail.rotation.y = .05;
  sail.castShadow = true;
  ship.add(sail);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 2.05, 10), darkWood);
  boom.rotation.z = Math.PI / 2;
  boom.position.set(-.7, .92, 0);
  ship.add(boom);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(.62, .37), new THREE.MeshBasicMaterial({ color: C.red, side: THREE.DoubleSide, transparent: true, opacity: .96 }));
  flag.position.set(.38, 2.62, .02);
  ship.add(flag);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(.23, .045, 10, 20), gold);
  wheel.position.set(-.93, .38, .47);
  wheel.rotation.x = Math.PI / 2;
  ship.add(wheel);

  const lanternMaterial = new THREE.MeshBasicMaterial({ color: C.goldSoft });
  [-1.12, 1.16].forEach((x) => {
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 10), lanternMaterial);
    lantern.position.set(x, .38, .47);
    ship.add(lantern);
  });
  const captain = makePirate(C, .27, true);
  captain.position.set(.38, .2, -.16);
  ship.add(captain);
  const crewMate = makePirate(C, .21, false);
  crewMate.position.set(-.85, .18, .14);
  crewMate.rotation.y = .58;
  ship.add(crewMate);
  ship.userData = { sail, flag };
  return ship;
}

function makePirate(C, scale, captain) {
  const pirate = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color: captain ? C.red : 0x1d4e60, roughness: .72 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xbc7b4b, roughness: .82 });
  const hat = new THREE.MeshStandardMaterial({ color: captain ? 0x2b1a18 : 0x123142, roughness: .67 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(scale * .34, scale * .43, scale * .95, 10), cloth);
  body.position.y = scale * .48;
  body.castShadow = true;
  pirate.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(scale * .28, 12, 10), skin);
  head.position.y = scale * 1.16;
  pirate.add(head);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(scale * .43, scale * .43, scale * .08, 16), hat);
  brim.position.y = scale * 1.31;
  pirate.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(scale * .25, scale * .29, scale * .23, 14), hat);
  crown.position.y = scale * 1.42;
  pirate.add(crown);
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(scale * .095, scale * .11, scale * .69, 8), cloth);
    arm.position.set(side * scale * .39, scale * .6, 0);
    arm.rotation.z = side * -.52;
    pirate.add(arm);
  });
  return pirate;
}

function makeCompass(C) {
  const compass = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.77, .09, 10, 48), new THREE.MeshStandardMaterial({ color: C.gold, roughness: .25, metalness: .82 }));
  compass.add(rim);
  const face = new THREE.Mesh(new THREE.CircleGeometry(.69, 48), new THREE.MeshBasicMaterial({ map: makeCompassTexture(), transparent: true, opacity: .94 }));
  face.position.z = -.01;
  compass.add(face);
  const needle = new THREE.Group();
  const north = new THREE.Mesh(new THREE.ConeGeometry(.14, .62, 3), new THREE.MeshBasicMaterial({ color: C.red }));
  north.rotation.z = -Math.PI / 2;
  north.position.x = .22;
  needle.add(north);
  const south = new THREE.Mesh(new THREE.ConeGeometry(.12, .53, 3), new THREE.MeshBasicMaterial({ color: C.cyan }));
  south.rotation.z = Math.PI / 2;
  south.position.x = -.19;
  needle.add(south);
  compass.add(needle);
  compass.userData.needle = needle;
  return compass;
}

function makeIsland(C, scale) {
  const island = new THREE.Group();
  const rock = new THREE.Mesh(new THREE.ConeGeometry(1.08 * scale, 1.18 * scale, 7), new THREE.MeshStandardMaterial({ color: 0x304a48, roughness: .9 }));
  rock.position.y = -.08;
  island.add(rock);
  const green = new THREE.Mesh(new THREE.CylinderGeometry(.72 * scale, .9 * scale, .12 * scale, 20), new THREE.MeshStandardMaterial({ color: C.green, roughness: .86 }));
  green.position.y = .52 * scale;
  island.add(green);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.055 * scale, .075 * scale, .8 * scale, 8), new THREE.MeshStandardMaterial({ color: 0x50341d, roughness: .78 }));
  trunk.position.set(.1 * scale, .99 * scale, 0);
  trunk.rotation.z = -.18;
  island.add(trunk);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x3e8e61, roughness: .77, side: THREE.DoubleSide });
  for (let index = 0; index < 5; index += 1) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(.33 * scale, .86 * scale, 4), leafMaterial);
    leaf.position.set(.1 * scale, 1.37 * scale, 0);
    leaf.rotation.set(Math.PI / 2 + .35, (index / 5) * Math.PI * 2, 0);
    island.add(leaf);
  }
  return island;
}

function makeClouds(C) {
  const clouds = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: C.foam, transparent: true, opacity: .12, depthWrite: false });
  [[0, 0, .55], [.48, .09, .42], [-.48, .04, .38], [.85, -.04, .26], [-.84, -.08, .24]].forEach(([x, y, size]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 12), material);
    puff.position.set(x, y, 0);
    puff.scale.z = .28;
    clouds.add(puff);
  });
  return clouds;
}

function makeStars(C, count, spread) {
  const geometry = new THREE.BufferGeometry();
  const position = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const palette = [new THREE.Color(C.foam), new THREE.Color(C.goldSoft), new THREE.Color(C.cyan)];
  for (let index = 0; index < count; index += 1) {
    const radius = 2.4 + Math.random() * spread;
    const angle = Math.random() * Math.PI * 2;
    position[index * 3] = Math.cos(angle) * radius;
    position[index * 3 + 1] = (Math.random() - .25) * 5.6;
    position[index * 3 + 2] = Math.sin(angle) * radius - 2;
    const shade = palette[Math.floor(Math.random() * palette.length)];
    color[index * 3] = shade.r;
    color[index * 3 + 1] = shade.g;
    color[index * 3 + 2] = shade.b;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(color, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ size: .034, vertexColors: true, transparent: true, opacity: .72, depthWrite: false }));
}

function makeSailTexture() {
  const source = document.createElement('canvas');
  source.width = source.height = 512;
  const context = source.getContext('2d');
  context.fillStyle = '#f2dfb5';
  context.fillRect(0, 0, 512, 512);
  for (let index = 0; index < 1100; index += 1) {
    context.fillStyle = `rgba(86,51,25,${Math.random() * .045})`;
    context.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
  }
  context.strokeStyle = 'rgba(189,73,52,.68)';
  context.lineWidth = 20;
  context.beginPath();
  context.arc(255, 256, 110, .22, Math.PI * 1.75);
  context.stroke();
  context.strokeStyle = 'rgba(10,72,94,.55)';
  context.lineWidth = 10;
  context.beginPath();
  context.arc(255, 256, 53, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.moveTo(88, 405); context.quadraticCurveTo(245, 325, 422, 396); context.stroke();
  return new THREE.CanvasTexture(source);
}

function makeCompassTexture() {
  const source = document.createElement('canvas');
  source.width = source.height = 512;
  const context = source.getContext('2d');
  context.clearRect(0, 0, 512, 512);
  context.translate(256, 256);
  context.strokeStyle = 'rgba(255,236,180,.85)';
  context.lineWidth = 8;
  context.beginPath(); context.arc(0, 0, 210, 0, Math.PI * 2); context.stroke();
  context.strokeStyle = 'rgba(13,75,95,.88)';
  context.lineWidth = 4;
  for (let index = 0; index < 16; index += 1) {
    context.save(); context.rotate((index / 16) * Math.PI * 2); context.beginPath(); context.moveTo(158, 0); context.lineTo(206, 0); context.stroke(); context.restore();
  }
  return new THREE.CanvasTexture(source);
}
