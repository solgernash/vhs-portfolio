// The 3D entertainment center the site started as. Shown in a frame on the Making Of page
// (src/scripts/shelf.js loads it); it draws into whatever size its canvas is.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { U, SPOTS, TAPE, buildUnit, buildTV, buildVCR, buildTape, buildDecor, buildEgg, placeEgg } from './props.js';
import { tween, pause, easeOut, isMoving, isReduced } from '../scripts/timeline.js';

const HOME_TARGET = new THREE.Vector3(0, 0.76, 0);

// onTape(id), onEgg(index, {x, y}) and onMiss() report clicks on the shelf; {x, y} is relative to the canvas.
export async function createScene({ canvas, tapes: TAPES, eggs: EGGS, onTape, onEgg, onMiss }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no webgl context');
  const touch = matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // the shelf mostly sits still; redrawn only while something moves

  // Canvas text needs the web fonts before we paint labels.
  await Promise.all(
    ['64px "Permanent Marker"', '48px VT323', '600 22px "IBM Plex Mono"', '210px Sacramento'].map((f) =>
      document.fonts.load(f).catch(() => {}),
    ),
  );

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#120c08');
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 20);
  // Soft reflections so metal (trophy, knobs) doesn't render black.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.2;
  pmrem.dispose();

  // ----- lights: cozy evening room, warm pools of light from the cubbies and a lamp off to the right -----
  scene.add(new THREE.HemisphereLight('#ffd2a6', '#2a1a10', 0.42));
  const key = new THREE.SpotLight('#ffc48a', 15, 7, 0.5, 1, 2);
  key.position.set(0.9, 2.5, 2.4);
  key.target.position.set(0, 0.7, 0);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(touch ? 1024 : 2048);
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
  scene.add(floor, wall, buildUnit('NASH CARROLL'), buildDecor(TAPES.length));

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
    mesh.userData = { pick: { type: 'tape', id: tape.id }, home, state: 'shelf', pull: 0 };
    tapes.set(tape.id, mesh);
    scene.add(mesh);
  });

  // ----- easter eggs on the side shelves -----
  const eggs = EGGS.map((egg, index) => {
    const group = buildEgg(egg);
    placeEgg(egg, group);
    group.traverse((o) => o.isMesh && (o.castShadow = true));
    group.userData = { pick: egg.note ? { type: 'egg', index } : null, base: group.position.clone(), pull: 0, kind: egg.kind };
    scene.add(group);
    return group;
  });

  // ----- screen / VCR state -----
  let blinkOn = true;
  let screenState = 'idle';
  let vcrText = null; // null: the VCR shows the clock

  // The viewer's local time (the browser's time zone), in their usual 12- or 24-hour style.
  const hourOpts = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions();
  const twelveHour = hourOpts.hour12 ?? /h1[12]/.test(hourOpts.hourCycle ?? '');
  function drawVcr() {
    if (vcrText) return vcr.face.draw(vcrText);
    const now = new Date(), h = now.getHours(), m = String(now.getMinutes()).padStart(2, '0');
    const colon = now.getSeconds() % 2 ? ' ' : ':';
    if (twelveHour) vcr.face.draw(`${h % 12 || 12}${colon}${m}`, true, h < 12 ? 'AM' : 'PM');
    else vcr.face.draw(`${String(h).padStart(2, '0')}${colon}${m}`);
  }
  function setScreen(state, title) {
    screenState = state;
    screen.draw(state, { title, blink: blinkOn });
    glow.color.set(state === 'idle' ? '#5b7bff' : '#9aa4c8');
  }
  // 500 ms divides a second evenly, so the clock's colon blinks in step with real seconds.
  setInterval(() => {
    if (!awake || document.hidden) return;
    blinkOn = !blinkOn;
    if (screenState === 'idle') screen.draw('idle', { blink: blinkOn });
    drawVcr();
  }, 500);

  // ----- camera framing -----
  const homeCam = new THREE.Vector3();
  const homeLook = HOME_TARGET.clone();
  const camLook = HOME_TARGET.clone();
  const screenLook = new THREE.Vector3(SCREEN.x, SCREEN.y, SCREEN.z);
  const insets = { top: 0, bottom: 0 }; // px the page's own controls cover at the top and bottom
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
    // Slide the camera up or down so the unit sits in the middle of the space the page's controls leave free.
    const worldPerPx = (2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / size().h;
    const shift = ((insets.top - insets.bottom) / 2) * worldPerPx;
    homeLook.set(HOME_TARGET.x, HOME_TARGET.y + shift, HOME_TARGET.z);
    homeCam.set(HOME_TARGET.x, HOME_TARGET.y + 0.05 + shift, HOME_TARGET.z + U.d / 2 + d);
  }
  function screenCam() {
    return new THREE.Vector3(SCREEN.x, SCREEN.y, SCREEN.z + 0.008 + fitDistance(SCREEN.w + 0.02, SCREEN.h + 0.02));
  }
  function resize() {
    const { w, h } = size();
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    computeHome();
    if (camMode === 'home') {
      camera.position.copy(homeCam);
      camLook.copy(homeLook);
    }
    if (camMode === 'screen') camera.position.copy(screenCam());
    still = 0;
  }
  const size = () => ({ w: Math.max(canvas.clientWidth, 1), h: Math.max(canvas.clientHeight, 1) });
  new ResizeObserver(() => resize()).observe(canvas);

  async function moveCamera(toPos, toLook, seconds, thenMode) {
    camMode = 'moving';
    const fromPos = camera.position.clone(), fromLook = camLook.clone();
    await tween(seconds, (k) => {
      camera.position.lerpVectors(fromPos, toPos, k);
      camLook.lerpVectors(fromLook, toLook, k);
    });
    camMode = thenMode;
  }

  // ----- tape animations -----
  const upright = new THREE.Quaternion();
  const s = TAPE.slotScale;
  const atSlot = vcr.slotPos.clone().add(new THREE.Vector3(0, 0, (TAPE.d * s) / 2 + 0.14));
  const inSlot = vcr.slotPos.clone().add(new THREE.Vector3(0, 0, -(TAPE.d * s) / 2 - 0.02));
  const pulledOut = (home) => home.pos.clone().add(new THREE.Vector3(0, 0.01, 0.32));
  let current = null; // id of the tape in the VCR

  function slide(mesh, toPos, seconds, ease) {
    const from = mesh.position.clone();
    return tween(seconds, (k) => mesh.position.lerpVectors(from, toPos, k), ease);
  }
  // One sweep between the shelf and the front of the VCR, out past the shelf edge so it never clips.
  function fly(mesh, points, fromQuat, toQuat, fromScale, toScale, seconds) {
    const path = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    return tween(seconds, (k) => {
      path.getPoint(k, mesh.position);
      mesh.quaternion.slerpQuaternions(fromQuat, toQuat, k);
      mesh.scale.setScalar(THREE.MathUtils.lerp(fromScale, toScale, k));
    });
  }
  function shelve(mesh) {
    const u = mesh.userData;
    mesh.visible = true;
    mesh.position.copy(u.home.pos);
    mesh.quaternion.copy(u.home.quat);
    mesh.scale.setScalar(1);
    u.state = 'shelf';
    u.pull = 0;
  }

  // Tape off the stack, into the VCR, camera into the screen. `full` is the unhurried first play.
  async function play(id, full) {
    const tape = TAPES.find((t) => t.id === id), mesh = tapes.get(id);
    if (!mesh) return;
    if (current && current !== id) shelve(tapes.get(current));
    current = id;
    hovered = null;
    const u = mesh.userData;
    u.state = 'moving';

    const load = async () => {
      await slide(mesh, inSlot, full ? 0.28 : 0.14);
      mesh.visible = false;
      vcrText = 'PLAY ▶';
      drawVcr();
      screenMat.uniforms.staticAmt.value = 1;
      await pause(full ? 0.22 : 0.06);
      setScreen('play', tape.title);
      await tween(full ? 0.3 : 0.16, (k) => (screenMat.uniforms.staticAmt.value = 1 - k));
    };
    const zoom = () => moveCamera(screenCam(), screenLook, full ? 0.85 : 0.72, 'screen');
    const toSlot = fly(mesh, [mesh.position.clone(), pulledOut(u.home), atSlot], mesh.quaternion.clone(), upright, 1, s, full ? 0.8 : 0.38);

    if (full) {
      await toSlot;
      const loading = load();
      await pause(0.28); // the camera waits until the tape is in
      await Promise.all([zoom(), loading]);
    } else {
      await Promise.all([zoom(), toSlot.then(load)]);
    }
    u.state = 'vcr';
  }

  // Camera back out, tape back onto the stack.
  async function eject() {
    const mesh = tapes.get(current);
    current = null;
    hovered = null;
    const zooming = moveCamera(homeCam, homeLook, 0.7, 'home');
    if (mesh) {
      const u = mesh.userData;
      u.state = 'moving';
      vcrText = 'EJECT';
      drawVcr();
      mesh.visible = true;
      mesh.position.copy(inSlot);
      mesh.quaternion.copy(upright);
      mesh.scale.setScalar(s);
      await slide(mesh, atSlot, 0.2, easeOut);
      setScreen('idle');
      await fly(mesh, [atSlot, pulledOut(u.home), u.home.pos], upright, u.home.quat, s, 1, 0.52);
      shelve(mesh);
      vcrText = null;
      drawVcr();
    } else {
      setScreen('idle');
    }
    await zooming;
  }

  // Jump straight to a page's state: no animation. `route` is { view: 'home' } or { view: 'tape', id }.
  function sync(route) {
    for (const mesh of tapes.values()) shelve(mesh);
    const mesh = route.view === 'tape' ? tapes.get(route.id) : null;
    screenMat.uniforms.staticAmt.value = 0;
    if (mesh) {
      current = route.id;
      mesh.visible = false;
      mesh.userData.state = 'vcr';
      vcrText = 'PLAY ▶';
      setScreen('play', TAPES.find((t) => t.id === route.id).title);
      camera.position.copy(screenCam());
      camLook.copy(screenLook);
      camMode = 'screen';
    } else {
      current = null;
      vcrText = null;
      setScreen('idle');
      camera.position.copy(homeCam);
      camLook.copy(homeLook);
      camMode = 'home';
    }
    drawVcr();
    still = 0;
  }

  // ----- hover / click -----
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(9, 9);
  const parallax = new THREE.Vector2();
  const pickRoots = [...tapes.values(), ...eggs.filter((e) => e.userData.pick)];
  let hovered = null; // the object under the pointer
  let highlighted = null; // an object the page asked to bring forward (keyboard focus on its link)
  let pointerMoved = false;

  function pick() {
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObjects(pickRoots, true)) {
      let o = hit.object;
      while (o && !o.userData.pick) o = o.parent;
      if (o) return o;
    }
    return null;
  }
  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointerMoved = true;
  }
  const interactive = () => camMode === 'home' && !isMoving();
  canvas.addEventListener('pointermove', (e) => {
    setPointer(e);
    if (e.pointerType === 'mouse') parallax.copy(pointer);
  });
  canvas.addEventListener('pointerleave', () => {
    pointer.set(9, 9);
    pointerMoved = true;
  });
  canvas.addEventListener('click', (e) => {
    setPointer(e);
    const target = interactive() ? pick() : null;
    if (!target) return onMiss();
    const p = target.userData.pick;
    if (p.type === 'tape') onTape(p.id);
    else onEgg(p.index, screenPosOf(target));
  });

  function screenPosOf(object) {
    const box = new THREE.Box3().setFromObject(object);
    const top = new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, box.max.z).project(camera);
    const { w, h } = size();
    return { x: ((top.x + 1) / 2) * w, y: ((1 - top.y) / 2) * h };
  }

  // ----- loop -----
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  let awake = false;
  let still = 0; // frames since anything last moved
  let wasInteractive = false;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    let moving = isMoving();

    const live = interactive();
    if (!live) hovered = null;
    else if (pointerMoved || !wasInteractive) hovered = pick();
    pointerMoved = false;
    wasInteractive = live;
    canvas.style.cursor = hovered ? 'pointer' : '';

    const ease = Math.min(1, dt * 12);
    for (const mesh of tapes.values()) {
      const u = mesh.userData;
      if (u.state !== 'shelf') continue;
      const want = mesh === hovered || mesh === highlighted ? 1 : 0;
      if (Math.abs(want - u.pull) > 0.002) moving = true;
      u.pull += (want - u.pull) * ease;
      tmp.set(0, 0.003, 0.05).applyQuaternion(u.home.quat).multiplyScalar(u.pull);
      mesh.position.copy(u.home.pos).add(tmp);
    }
    for (const egg of eggs) {
      const u = egg.userData;
      const want = egg === hovered || egg === highlighted ? 1 : 0;
      if (Math.abs(want - u.pull) > 0.002) moving = true;
      u.pull += (want - u.pull) * ease;
      tmp.set(0, u.kind === 'tape' ? 0.002 : 0.012, u.kind === 'tape' ? 0.035 : 0.01).multiplyScalar(u.pull);
      egg.position.copy(u.base).add(tmp);
    }

    if (camMode === 'home') {
      // A little parallax with the mouse; with reduced motion the camera stays put.
      if (isReduced()) tmp.copy(homeCam);
      else tmp.set(parallax.x * 0.05, parallax.y * 0.03, 0).add(homeCam);
      if (camera.position.distanceToSquared(tmp) > 1e-9) moving = true;
      camera.position.lerp(tmp, Math.min(1, dt * 3));
    }
    camera.lookAt(camLook);

    // Nothing moving: the only life is the CRT's shimmer, which is fine at half the frame rate.
    still = moving ? 0 : still + 1;
    if (still > 2 && still % 2) return;
    renderer.shadowMap.needsUpdate = still <= 2;

    const t = clock.elapsedTime;
    screenMat.uniforms.time.value = t;
    glow.intensity = 0.5 + Math.sin(t * 13) * 0.02 + Math.sin(t * 3.1) * 0.04;
    renderer.render(scene, camera);
  }

  resize();
  sync({ view: 'home' });
  // Compile the shaders off the main thread where the browser can, so the first frame doesn't hitch.
  await renderer.compileAsync(scene, camera).catch(() => {});

  return {
    play,
    eject,
    sync,
    // Start or stop drawing. Asleep, the shelf costs nothing (a tape page is covering it).
    wake() {
      if (awake) return;
      awake = true;
      still = 0;
      clock.getDelta();
      drawVcr();
      frame();
      renderer.setAnimationLoop(frame);
    },
    sleep() {
      awake = false;
      renderer.setAnimationLoop(null);
    },
    setInsets(top, bottom) {
      if (insets.top === top && insets.bottom === bottom) return;
      insets.top = top;
      insets.bottom = bottom;
      computeHome();
      if (camMode === 'home' && !isMoving()) camLook.copy(homeLook);
      still = 0;
    },
    // Bring a tape ('tape', id) or a side-shelf object ('egg', index) forward, as hovering it would.
    highlight(type, key) {
      highlighted = type === 'tape' ? tapes.get(key) : type === 'egg' ? eggs[key] : null;
      still = 0;
    },
    eggScreenPos: (index) => screenPosOf(eggs[index]),
  };
}
