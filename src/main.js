import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TAPES } from './tapes.js';
import { EGGS } from './eggs.js';
import { U, SPOTS, TAPE, buildUnit, buildTV, buildVCR, buildTape, buildDecor, buildEgg, placeEgg } from './props.js';
import { tween, wait, updateTweens, easeOutCubic } from './tween.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const D = reducedMotion ? 0.001 : 1; // duration multiplier
const HOME_TARGET = new THREE.Vector3(0, 0.76, 0);

// ---------- DOM ----------
const canvas = document.getElementById('scene');
const shelfNav = document.getElementById('shelf');
const hint = document.getElementById('hint');
const tv = document.getElementById('tv');
const tvTitle = document.getElementById('tv-title');
const tvContent = document.getElementById('tv-content');
const tvCounter = document.getElementById('tv-counter');
const ejectBtn = document.getElementById('tv-eject');
const note = document.getElementById('note');
const noteText = document.getElementById('note-text');
const notePlay = document.getElementById('note-play');
const noteArt = document.getElementById('note-art');
const noteLink = document.getElementById('note-link');

for (const tape of TAPES) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = tape.title;
  b.style.setProperty('--stripe', tape.stripe);
  b.dataset.tape = tape.id;
  b.addEventListener('click', () => play(tape.id));
  shelfNav.append(b);
}

// ---------- overlay ----------
let counterTimer = 0;
let lastTrigger = null;

function openOverlay(tape) {
  tvTitle.textContent = tape.title;
  tvContent.replaceChildren(document.getElementById(`tape-${tape.id}`).content.cloneNode(true));
  tvContent.style.setProperty('--accent', tape.stripe);
  tvContent.scrollTop = 0;
  tv.hidden = false;
  requestAnimationFrame(() => tv.classList.add('on'));
  let s = 0;
  tvCounter.textContent = '0:00:00';
  clearInterval(counterTimer);
  counterTimer = setInterval(() => {
    s++;
    tvCounter.textContent = `0:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }, 1000);
  if (location.hash !== `#/${tape.id}`) history.replaceState(null, '', `#/${tape.id}`);
  ejectBtn.focus();
}

async function closeOverlay() {
  tv.classList.remove('on');
  clearInterval(counterTimer);
  await wait(0.25 * D);
  tv.hidden = true;
  tvContent.replaceChildren();
  if (location.hash) history.replaceState(null, '', location.pathname);
}

let current = null; // id of the tape in the VCR
let busy = false;

// ---------- three.js (optional: the overlay + shelf nav work without it) ----------
let three = null;
try {
  three = await initScene();
} catch (err) {
  console.warn('WebGL unavailable, falling back to plain navigation', err);
  document.body.classList.add('no-webgl');
}

async function play(id, { instant = false } = {}) {
  const tape = TAPES.find((t) => t.id === id);
  if (!tape || busy) return;
  lastTrigger = document.activeElement;
  if (!three) return openOverlay(tape);
  busy = true;
  hideNote();
  hint.classList.add('gone');
  document.body.classList.add('playing');
  try {
    if (current && current !== id) await eject({ keepOverlayClosed: true });
    if (current !== id) await three.insert(tape, instant);
    current = id;
    await three.zoomToScreen(instant);
    openOverlay(tape);
  } finally {
    busy = false;
  }
}

async function eject({ keepOverlayClosed = false } = {}) {
  if (!tv.hidden) await closeOverlay();
  if (three && current) {
    const id = current;
    current = null;
    await three.zoomHome();
    await three.remove(TAPES.find((t) => t.id === id));
  }
  if (!keepOverlayClosed) {
    document.body.classList.remove('playing');
    if (lastTrigger?.isConnected) lastTrigger.focus();
  }
}

ejectBtn.addEventListener('click', () => {
  if (!busy) {
    busy = true;
    eject().finally(() => (busy = false));
  }
});
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!tv.hidden) ejectBtn.click();
  else hideNote();
});

// ---------- sticky notes for the easter eggs ----------
let noteEgg = null;
let noteAnchor = null;

function showNote(egg, screenPos) {
  noteEgg = egg;
  noteAnchor = screenPos;
  noteText.textContent = egg.note;
  noteArt.hidden = noteLink.hidden = true;
  notePlay.hidden = !egg.tape;
  notePlay.onclick = () => play(egg.tape);
  note.style.setProperty('--tilt', `${(Math.random() - 0.5) * 6}deg`);
  note.hidden = false;
  placeNote();
  if (egg.live === 'spotify') showNowPlaying(egg);
}

function placeNote() {
  const r = note.getBoundingClientRect();
  note.style.left = `${Math.min(Math.max(noteAnchor.x - r.width / 2, 12), innerWidth - r.width - 12)}px`;
  note.style.top = `${Math.min(Math.max(noteAnchor.y - r.height - 16, 12), innerHeight - r.height - 12)}px`;
}

async function showNowPlaying(egg) {
  noteText.textContent = "Checking what I'm listening to…";
  placeNote();
  let data = null;
  try {
    const res = await fetch('/api/now-playing');
    if (res.ok) data = await res.json();
  } catch {}
  if (note.hidden || noteEgg !== egg) return; // closed or replaced while loading
  if (!data?.title) {
    noteText.textContent = egg.note;
  } else {
    const when = data.playing ? 'Listening right now:' : `Last played${data.playedAt ? ` ${ago(data.playedAt)}` : ''}:`;
    noteText.textContent = `${when} ${data.title} — ${data.artist}`;
    if (data.art) {
      noteArt.src = data.art;
      noteArt.hidden = false;
    }
    if (data.url) {
      noteLink.href = data.url;
      noteLink.hidden = false;
    }
  }
  placeNote();
}

function ago(iso) {
  const min = Math.round((Date.now() - new Date(iso)) / 60000);
  if (min < 60) return `${Math.max(min, 1)} min ago`;
  if (min < 60 * 24) return `${Math.round(min / 60)} h ago`;
  return `${Math.round(min / 1440)} days ago`;
}

function hideNote() {
  note.hidden = true;
}
addEventListener('hashchange', () => {
  const id = location.hash.replace('#/', '');
  if (TAPES.some((t) => t.id === id)) play(id);
  else if (!tv.hidden) ejectBtn.click();
});

const initial = location.hash.replace('#/', '');
if (TAPES.some((t) => t.id === initial)) play(initial, { instant: true });

// ======================================================================


async function initScene() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no webgl context');
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Canvas text needs the web fonts before we paint labels.
  await Promise.all(
    ['64px "Permanent Marker"', '48px VT323', '22px "IBM Plex Mono"'].map((f) => document.fonts.load(f)),
  );

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#120c08');
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 20);
  // Soft reflections so metal (trophy, knobs) doesn't render black.
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.2;

  // ----- lights: cozy evening room, warm pools of light from the cubbies and a lamp off to the right -----
  scene.add(new THREE.HemisphereLight('#ffd2a6', '#2a1a10', 0.42));
  const key = new THREE.SpotLight('#ffc48a', 15, 7, 0.5, 1, 2);
  key.position.set(0.9, 2.5, 2.4);
  key.target.position.set(0, 0.7, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  scene.add(key, key.target);
  const lamp = new THREE.PointLight('#ffa04d', 1.1, 3, 2);
  lamp.position.set(1.05, 1.0, 0.6);
  scene.add(lamp);

  // ----- room -----
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ color: '#3a2416', roughness: 0.6 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), new THREE.MeshStandardMaterial({ color: '#7a6656', roughness: 1 }));
  wall.position.set(0, 2.5, -U.d / 2 - 0.01);
  wall.receiveShadow = true;
  scene.add(floor, wall, buildUnit('NASH CARROLL'), buildDecor());

  // ----- TV + VCR -----
  const tvSet = buildTV();
  const { SCREEN, screen, screenMat } = tvSet;
  const vcr = buildVCR();
  scene.add(tvSet.group, vcr.group);
  const glow = new THREE.PointLight('#5b7bff', 0.5, 1.2, 2);
  glow.position.set(SCREEN.x, SCREEN.y, SCREEN.z + 0.25);
  scene.add(glow);

  // ----- project tapes, stacked on the top shelf -----
  const tapes = new Map();
  const stackX = SPOTS.top.x - 0.11, stackZ = U.d / 2 - TAPE.d / 2 - 0.015;
  TAPES.forEach((tape, i) => {
    const mesh = buildTape(tape);
    const level = TAPES.length - 1 - i;
    const home = {
      pos: new THREE.Vector3(stackX + (Math.random() - 0.5) * 0.016, SPOTS.top.y + TAPE.h / 2 + level * (TAPE.h + 0.001), stackZ),
      quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (Math.random() - 0.5) * 0.1, 0)),
    };
    mesh.position.copy(home.pos);
    mesh.quaternion.copy(home.quat);
    mesh.userData = { pick: { type: 'tape', id: tape.id }, home, state: 'shelf', pull: 0 };
    tapes.set(tape.id, mesh);
    scene.add(mesh);
  });

  // ----- easter eggs on the side shelves -----
  const eggs = [];
  for (const egg of EGGS) {
    const group = buildEgg(egg);
    placeEgg(egg, group);
    group.traverse((o) => o.isMesh && (o.castShadow = true));
    group.userData = { pick: egg.note ? { type: 'egg', egg } : null, base: group.position.clone(), pull: 0, kind: egg.kind };
    eggs.push(group);
    scene.add(group);
  }

  // ----- screen / VCR state -----
  let blinkOn = true;
  let screenState = 'idle';
  let vcrText = '12:00';
  function setScreen(state, title) {
    screenState = state;
    screen.draw(state, { title, blink: blinkOn });
    glow.color.set(state === 'idle' ? '#5b7bff' : '#9aa4c8');
  }
  setScreen('idle');
  vcr.face.draw(vcrText);
  setInterval(() => {
    blinkOn = !blinkOn;
    if (screenState === 'idle') screen.draw('idle', { blink: blinkOn });
    vcr.face.draw(vcrText, vcrText !== '12:00' || blinkOn);
  }, 600);

  // ----- camera framing -----
  const homeCam = new THREE.Vector3();
  const camLook = HOME_TARGET.clone();
  let camMode = 'home'; // 'home' | 'moving' | 'screen'

  function fitDistance(width, height) {
    const v = THREE.MathUtils.degToRad(camera.fov) / 2;
    const h = Math.atan(Math.tan(v) * camera.aspect);
    return Math.max(width / 2 / Math.tan(h), height / 2 / Math.tan(v));
  }
  function computeHome() {
    // Frame the whole unit; on phones, frame its width and let the wall crop.
    // Tight on the unit: the legs and the top of the wall decor crop off, like a photo of a shelf.
    const d = camera.aspect < 0.8 ? fitDistance(U.w + 0.04, 1.0) : fitDistance(U.w + 0.06, 1.3);
    homeCam.set(HOME_TARGET.x, HOME_TARGET.y + 0.05, HOME_TARGET.z + U.d / 2 + d);
  }
  function screenCam() {
    return new THREE.Vector3(SCREEN.x, SCREEN.y, SCREEN.z + 0.008 + fitDistance(SCREEN.w + 0.02, SCREEN.h + 0.02));
  }
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    computeHome();
    if (camMode === 'home') camera.position.copy(homeCam);
    if (camMode === 'screen') camera.position.copy(screenCam());
  }
  addEventListener('resize', resize);
  resize();
  camera.lookAt(camLook);

  async function moveCamera(toPos, toLook, duration) {
    camMode = 'moving';
    const fromPos = camera.position.clone(), fromLook = camLook.clone();
    await tween(duration, (k) => {
      camera.position.lerpVectors(fromPos, toPos, k);
      camLook.lerpVectors(fromLook, toLook, k);
    });
  }

  // ----- tape animations -----
  async function moveTape(mesh, toPos, toQuat, toScale, duration, ease) {
    const p0 = mesh.position.clone(), q0 = mesh.quaternion.clone(), s0 = mesh.scale.x;
    await tween(duration, (k) => {
      mesh.position.lerpVectors(p0, toPos, k);
      mesh.quaternion.slerpQuaternions(q0, toQuat, k);
      mesh.scale.setScalar(THREE.MathUtils.lerp(s0, toScale, k));
    }, ease);
  }

  const upright = new THREE.Quaternion();
  const s = TAPE.slotScale;
  const atSlot = vcr.slotPos.clone().add(new THREE.Vector3(0, 0, (TAPE.d * s) / 2 + 0.14));
  const inSlot = vcr.slotPos.clone().add(new THREE.Vector3(0, 0, -(TAPE.d * s) / 2 - 0.02));
  const pulledOut = (home) => home.pos.clone().add(new THREE.Vector3(0, 0.01, 0.32));

  async function insert(tape, instant) {
    const mesh = tapes.get(tape.id);
    mesh.userData.state = 'moving';
    const k = instant ? 0.001 : D;
    await moveTape(mesh, pulledOut(mesh.userData.home), upright, 1, 0.45 * k, easeOutCubic);
    await moveTape(mesh, atSlot, upright, s, 0.65 * k);
    await moveTape(mesh, inSlot, upright, s, 0.35 * k);
    mesh.visible = false;
    vcrText = 'PLAY ▶';
    vcr.face.draw(vcrText);
    screenMat.uniforms.staticAmt.value = 1;
    await wait(0.5 * k);
    setScreen('play', tape.title);
    await tween(0.35 * k, (t) => (screenMat.uniforms.staticAmt.value = 1 - t));
    await wait(0.25 * k);
  }

  async function remove(tape) {
    const mesh = tapes.get(tape.id);
    vcrText = 'EJECT';
    vcr.face.draw(vcrText);
    setScreen('idle');
    mesh.visible = true;
    await moveTape(mesh, atSlot, upright, s, 0.35 * D, easeOutCubic);
    const { home } = mesh.userData;
    await moveTape(mesh, pulledOut(home), upright, 1, 0.6 * D);
    await moveTape(mesh, home.pos, home.quat, 1, 0.4 * D);
    mesh.userData.state = 'shelf';
    vcrText = '12:00';
    vcr.face.draw(vcrText);
  }

  async function zoomToScreen(instant) {
    if (camMode === 'screen') return;
    await moveCamera(screenCam(), new THREE.Vector3(SCREEN.x, SCREEN.y, SCREEN.z), (instant ? 0.001 : 1.0) * D);
    camMode = 'screen';
  }
  async function zoomHome() {
    await moveCamera(homeCam.clone(), HOME_TARGET.clone(), 0.9 * D);
    camMode = 'home';
  }

  // ----- hover / click -----
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(9, 9);
  const parallax = new THREE.Vector2();
  const pickRoots = [...tapes.values(), ...eggs.filter((e) => e.userData.pick)];
  let hovered = null; // the root object under the pointer

  function pick() {
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObjects(pickRoots, true)) {
      let o = hit.object;
      while (o && !o.userData.pick) o = o.parent;
      if (o) return o;
    }
    return null;
  }
  const setPointer = (e) => pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  canvas.addEventListener('pointermove', (e) => {
    setPointer(e);
    parallax.copy(pointer);
  });
  canvas.addEventListener('pointerleave', () => pointer.set(9, 9));
  canvas.addEventListener('click', (e) => {
    setPointer(e);
    const target = camMode === 'home' && !busy ? pick() : null;
    if (!target) return hideNote();
    const { pick: p } = target.userData;
    if (p.type === 'tape') return play(p.id);
    const top = new THREE.Box3().setFromObject(target);
    const pos = new THREE.Vector3((top.min.x + top.max.x) / 2, top.max.y, top.max.z).project(camera);
    showNote(p.egg, { x: ((pos.x + 1) / 2) * innerWidth, y: ((1 - pos.y) / 2) * innerHeight });
  });

  // ----- loop -----
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    updateTweens(dt);

    hovered = camMode === 'home' && !busy ? pick() : null;
    canvas.style.cursor = hovered ? 'pointer' : '';
    const ease = Math.min(1, dt * 12);
    for (const mesh of tapes.values()) {
      const u = mesh.userData;
      if (u.state !== 'shelf') continue;
      u.pull += ((mesh === hovered ? 1 : 0) - u.pull) * ease;
      tmp.set(0, 0.003, 0.05).applyQuaternion(u.home.quat).multiplyScalar(u.pull);
      mesh.position.copy(u.home.pos).add(tmp);
    }
    for (const egg of eggs) {
      const u = egg.userData;
      u.pull += ((egg === hovered ? 1 : 0) - u.pull) * ease;
      tmp.set(0, u.kind === 'tape' ? 0.002 : 0.012, u.kind === 'tape' ? 0.035 : 0.01).multiplyScalar(u.pull);
      egg.position.copy(u.base).add(tmp);
    }

    if (camMode === 'home' && !reducedMotion) {
      tmp.set(parallax.x * 0.05, parallax.y * 0.03, 0).add(homeCam);
      camera.position.lerp(tmp, Math.min(1, dt * 3));
    }
    camera.lookAt(camLook);

    screenMat.uniforms.time.value = t;
    glow.intensity = 0.5 + Math.sin(t * 13) * 0.02 + Math.sin(t * 3.1) * 0.04;
    renderer.render(scene, camera);
  });

  return { insert, remove, zoomToScreen, zoomHome };
}
