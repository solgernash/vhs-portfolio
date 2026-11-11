import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';

// ---------- entertainment center layout (meters, floor at y = 0, unit front at z = U.d / 2) ----------
export const U = { t: 0.022, d: 0.36, cols: [0.4, 0.62, 0.4], base: 0.1 };
U.w = U.cols.reduce((a, b) => a + b, 0) + 4 * U.t;

const panelX = [];
for (let i = 0, x = -U.w / 2 + U.t / 2; i < 4; i++, x += (U.cols[i - 1] ?? 0) + U.t) panelX.push(x);
const colX = U.cols.map((c, i) => panelX[i] + U.t / 2 + c / 2);

// Bottom of each shelf board, bottom to top.
const SIDE_BOARDS = [0.1, 0.34, 0.58, 0.82, 1.04];
const CENTER_BOARDS = [0.1, 0.34, 0.88, 1.0, 1.34];
export const SIDE_TOP = SIDE_BOARDS.at(-1) + U.t;
export const CENTER_TOP = CENTER_BOARDS.at(-1) + U.t;

const floorOf = (boards, i) => boards[i] + U.t;
export const SPOTS = {
  L1: { x: colX[0], y: floorOf(SIDE_BOARDS, 3) },
  L2: { x: colX[0], y: floorOf(SIDE_BOARDS, 2) },
  L3: { x: colX[0], y: floorOf(SIDE_BOARDS, 1) },
  R1: { x: colX[2], y: floorOf(SIDE_BOARDS, 3) },
  R2: { x: colX[2], y: floorOf(SIDE_BOARDS, 2) },
  R3: { x: colX[2], y: floorOf(SIDE_BOARDS, 1) },
  top: { x: colX[1], y: floorOf(CENTER_BOARDS, 3) },
  tv: { x: colX[1], y: floorOf(CENTER_BOARDS, 1) },
  vcr: { x: colX[1], y: floorOf(CENTER_BOARDS, 0) },
};

export const TAPE = { w: 0.28, h: 0.042, d: 0.17, slotScale: 0.5 };

const std = (o) => new THREE.MeshStandardMaterial(o);

function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}

export function buildUnit(name) {
  const g = new THREE.Group();
  const woodH = std({ map: T.makeWood(false), roughness: 0.72 });
  const woodV = std({ map: T.makeWood(true), roughness: 0.72 });
  const backMat = std({ map: T.makeWood(false), color: '#b9a37c', roughness: 0.85 });
  const white = std({ color: '#f3f0ea', roughness: 0.55 });
  const { t, d } = U;
  const h = (top) => top - U.base;

  // Upright panels: outer ones stop at the side columns, inner ones rise with the center.
  [0, 3].forEach((i) => g.add(box(t, h(SIDE_TOP), d, woodV, panelX[i], U.base + h(SIDE_TOP) / 2, 0)));
  [1, 2].forEach((i) => g.add(box(t, h(CENTER_TOP), d, woodV, panelX[i], U.base + h(CENTER_TOP) / 2, 0)));

  // Shelf boards.
  for (const i of [0, 2]) for (const y of SIDE_BOARDS) g.add(box(U.cols[i], t, d, woodH, colX[i], y + t / 2, 0));
  for (const y of CENTER_BOARDS) g.add(box(U.cols[1], t, d, woodH, colX[1], y + t / 2, 0));

  // Back panels.
  g.add(box(U.w, h(SIDE_TOP), 0.008, backMat, 0, U.base + h(SIDE_TOP) / 2, -d / 2 + 0.004));
  g.add(box(U.cols[1] + 2 * t, CENTER_TOP - SIDE_TOP, 0.008, backMat, 0, (SIDE_TOP + CENTER_TOP) / 2, -d / 2 + 0.004));

  // Engraved name plate between the TV cubby and the top shelf.
  const plateY0 = floorOf(CENTER_BOARDS, 2), plateH = CENTER_BOARDS[3] - plateY0;
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(U.cols[1], plateH, t),
    [woodH, woodH, woodH, woodH, std({ map: T.makeHeaderPlate(name), roughness: 0.7 }), woodH],
  );
  plate.position.set(colX[1], plateY0 + plateH / 2, d / 2 - t / 2);
  g.add(plate);

  // Drawers.
  const drawerH = SIDE_BOARDS[1] - floorOf(SIDE_BOARDS, 0);
  const pull = std({ color: '#2b241d', roughness: 0.9 });
  for (const i of [0, 2]) {
    const y = floorOf(SIDE_BOARDS, 0) + drawerH / 2;
    g.add(box(U.cols[i] - 0.006, drawerH - 0.006, 0.02, white, colX[i], y, d / 2 - 0.01));
    g.add(box(0.12, 0.018, 0.004, pull, colX[i], y + drawerH / 2 - 0.03, d / 2 + 0.001));
  }

  // Warm LED strip and a little light at the top of each display cubby.
  const led = new THREE.MeshBasicMaterial({ color: '#ffd3a0', toneMapped: false });
  const cubbies = [
    ...[0, 2].flatMap((i) => [2, 3, 4].map((k) => [colX[i], U.cols[i], SIDE_BOARDS[k]])),
    [colX[1], U.cols[1], CENTER_BOARDS[4]],
    [colX[1], U.cols[1], CENTER_BOARDS[2]],
  ];
  for (const [x, w, top] of cubbies) {
    g.add(box(w - 0.04, 0.004, 0.008, led, x, top - 0.002, d / 2 - 0.03));
    const light = new THREE.PointLight('#ffbf80', 0.03, 0.45, 2);
    light.position.set(x, top - 0.035, d / 2 - 0.06);
    g.add(light);
  }

  // Splayed legs.
  const legGeo = new THREE.CylinderGeometry(0.018, 0.011, U.base + 0.01, 12);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, white);
      leg.position.set(sx * (U.w / 2 - 0.07), U.base / 2, sz * (d / 2 - 0.06));
      leg.rotation.z = sx * 0.18;
      leg.castShadow = true;
      g.add(leg);
    }
  return g;
}

// ---------- TV ----------
const TV = { w: 0.48, h: 0.38, d: 0.32, feet: 0.008 };

export function buildTV() {
  const g = new THREE.Group();
  const red = new THREE.MeshPhysicalMaterial({ color: '#c3282b', roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const black = std({ color: '#0e0e10', roughness: 0.35 });
  const cream = std({ color: '#ece4d2', roughness: 0.5 });
  const chrome = std({ color: '#d9d6cf', roughness: 0.25, metalness: 0.8 });
  const front = TV.d / 2;

  const body = new THREE.Mesh(new RoundedBoxGeometry(TV.w, TV.h, TV.d, 4, 0.03), red);
  body.castShadow = body.receiveShadow = true;
  g.add(body);

  const scr = { x: -0.06, y: 0.03, w: 0.29, h: 0.2175 };
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(scr.w + 0.04, scr.h + 0.04, 0.02, 3, 0.008), black);
  bezel.position.set(scr.x, scr.y, front - 0.008);
  g.add(bezel);

  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.085, scr.h + 0.04), cream);
  panel.position.set(0.17, scr.y, front + 0.0005);
  g.add(panel);
  [[0.1, 0.022], [0.02, 0.022], [-0.06, 0.014]].forEach(([y, r]) => {
    const k = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, 0.018, 28), chrome);
    k.rotation.x = Math.PI / 2;
    k.position.set(0.17, scr.y + y, front + 0.009);
    k.castShadow = true;
    g.add(k);
  });

  const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.05), std({ map: T.makeGrille(), roughness: 0.8 }));
  grille.position.set(-0.13, -0.145, front + 0.0005);
  const recess = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.03), std({ color: '#7d1518', roughness: 0.6 }));
  recess.position.set(0.02, -0.145, front + 0.0005);
  g.add(grille, recess);
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.01, 16), black);
    b.rotation.x = Math.PI / 2;
    b.position.set(0.11 + i * 0.026, -0.145, front + 0.005);
    g.add(b);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.03, TV.feet, 0.03, black, sx * 0.19, -TV.h / 2 - TV.feet / 2, sz * 0.12));

  // Screen: slightly bulged plane with a CRT shader over a canvas texture.
  const screenGeo = new THREE.PlaneGeometry(scr.w, scr.h, 32, 24);
  const p = screenGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const nx = p.getX(i) / (scr.w / 2), ny = p.getY(i) / (scr.h / 2);
    p.setZ(i, 0.008 * (1 - (nx * nx + ny * ny) / 2));
  }
  screenGeo.computeVertexNormals();
  const screen = T.makeScreen();
  const screenMat = new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: { map: { value: screen.texture }, time: { value: 0 }, staticAmt: { value: 0 }, power: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform float time, staticAmt, power;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec2 c = vUv - 0.5;
        vec2 uv = 0.5 + c * (1.0 + 0.04 * dot(c, c));
        float wobble = sin(uv.y * 30.0 + time * 6.0) * 0.0008;
        vec3 col;
        col.r = texture2D(map, uv + vec2(0.0018 + wobble, 0.0)).r;
        col.g = texture2D(map, uv + vec2(wobble, 0.0)).g;
        col.b = texture2D(map, uv - vec2(0.0018 - wobble, 0.0)).b;
        float n = hash(floor(uv * vec2(320.0, 240.0)) + floor(time * 50.0) * 7.0);
        col = mix(col, vec3(n * 0.9), staticAmt);
        col *= 0.86 + 0.14 * sin(uv.y * 240.0 * 3.14159);
        col *= 0.97 + 0.03 * sin((uv.y - time * 0.25) * 6.2831);
        col *= smoothstep(0.85, 0.35, length(c * vec2(1.0, 0.9)));
        vec2 q = abs(uv - 0.5) - (0.5 - 0.07);
        float corner = length(max(q, 0.0)) - 0.07;
        col *= 1.0 - smoothstep(-0.006, 0.0, corner);
        gl_FragColor = vec4(col * power, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(scr.x, scr.y, front + 0.0025);
  g.add(screenMesh);

  const s = SPOTS.tv;
  g.position.set(s.x, s.y + TV.feet + TV.h / 2, U.d / 2 - TV.d / 2 - 0.012);
  const screenWorld = { x: g.position.x + scr.x, y: g.position.y + scr.y, z: g.position.z + front + 0.0025, w: scr.w, h: scr.h };
  return { group: g, screen, screenMat, SCREEN: screenWorld };
}

// ---------- VCR ----------
export function buildVCR() {
  const V = { w: 0.5, h: 0.085, d: 0.3, feet: 0.004 };
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(V.w, V.h, V.d, 2, 0.006), std({ color: '#19191c', roughness: 0.5, metalness: 0.1 }));
  body.castShadow = body.receiveShadow = true;
  g.add(body);
  const face = T.makeVcrFace();
  const faceW = V.w - 0.016, faceH = V.h - 0.008;
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(faceW, faceH),
    std({ map: face.texture, roughness: 0.55, emissiveMap: face.texture, emissive: '#ffffff', emissiveIntensity: 0.1 }),
  );
  plate.position.z = V.d / 2 + 0.0015;
  g.add(plate);

  const s = SPOTS.vcr;
  g.position.set(s.x, s.y + V.feet + V.h / 2, U.d / 2 - V.d / 2 - 0.012);
  const slotPos = new THREE.Vector3(
    g.position.x - faceW / 2 + face.slot.x * faceW,
    g.position.y + faceH / 2 - face.slot.y * faceH,
    g.position.z + V.d / 2,
  );
  return { group: g, face, slotPos };
}

// ---------- tapes ----------
const tapeGeo = new RoundedBoxGeometry(TAPE.w, TAPE.h, TAPE.d, 2, 0.003);
const shellMat = std({ color: '#141416', roughness: 0.4 });

export function buildTape(tape) {
  const mesh = new THREE.Mesh(tapeGeo, shellMat);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(TAPE.w - 0.006, TAPE.h - 0.005),
    std({ map: T.makeLabelTexture(tape), roughness: 0.7 }),
  );
  label.position.z = TAPE.d / 2 + 0.0008;
  mesh.add(label);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

// ---------- wall decor ----------
export function buildDecor() {
  const g = new THREE.Group();
  const wallZ = -U.d / 2 - 0.01;

  const neonX = -0.55, neonY = SIDE_TOP + 0.17;
  const neon = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.2),
    new THREE.MeshBasicMaterial({ map: T.makeNeon(['be kind,', 'rewind'], '#ff8fb8'), transparent: true, depthWrite: false, toneMapped: false }),
  );
  neon.position.set(neonX, neonY, wallZ + 0.016);
  const neonLight = new THREE.PointLight('#ff8fb8', 0.25, 0.9, 2);
  neonLight.position.set(neonX, neonY, wallZ + 0.15);

  const frame = std({ color: '#141216', roughness: 0.5 });
  const posterY = SIDE_TOP + 0.25;
  const posterFrame = box(0.29, 0.39, 0.02, frame, 0.53, posterY, wallZ + 0.01);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.265, 0.365), std({ map: T.makePoster(), roughness: 0.6 }));
  poster.position.set(0.53, posterY, wallZ + 0.021);

  // Small succulent next to the tapes on the top shelf.
  const top = buildSucculent();
  top.position.set(SPOTS.top.x + 0.2, SPOTS.top.y, 0.04);

  g.add(neon, neonLight, posterFrame, poster, top);
  return g;
}

function buildSucculent() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.05, 20), std({ color: '#c8734a', roughness: 0.8 }));
  pot.position.y = 0.025;
  g.add(pot);
  const geo = new THREE.ConeGeometry(0.012, 0.06, 8);
  for (let i = 0; i < 11; i++) {
    const leaf = new THREE.Mesh(geo, std({ color: new THREE.Color().setHSL(0.3 + Math.random() * 0.06, 0.42, 0.3 + Math.random() * 0.1), roughness: 0.6 }));
    const a = (i / 11) * Math.PI * 2, tilt = i < 7 ? 0.9 : 0.35;
    leaf.position.set(Math.cos(a) * 0.012, 0.065, Math.sin(a) * 0.012);
    leaf.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
    g.add(leaf);
  }
  return g;
}

// ---------- shoes ----------
// Footprint in the XY plane: x runs heel (-L/2) to toe (+L/2), y across the foot.
function footprint(L, W) {
  const s = new THREE.Shape();
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 2, c = Math.cos(t);
    const half = (W / 2) * (0.74 + 0.26 * (c + 1) / 2);
    i ? s.lineTo((L / 2) * c, half * Math.sin(t)) : s.moveTo((L / 2) * c, half * Math.sin(t));
  }
  return s;
}

function buildShoe({ L, W, upperMat, soleMat, soleH, upperH, heelH = 0, toeDrop = 0.5, laceMat, tabMat }) {
  const g = new THREE.Group();
  const body = new THREE.Group();

  const soleGeo = new THREE.ExtrudeGeometry(footprint(L, W), { depth: soleH, bevelEnabled: false, curveSegments: 6 });
  soleGeo.rotateX(-Math.PI / 2);
  body.add(new THREE.Mesh(soleGeo, soleMat));

  const bev = W * 0.12, bt = upperH * 0.45;
  const upGeo = new THREE.ExtrudeGeometry(footprint(L * 0.97 - 2 * bev, W * 0.94 - 2 * bev), {
    depth: upperH, bevelEnabled: true, bevelThickness: bt, bevelSize: bev, bevelSegments: 5, curveSegments: 8,
  });
  upGeo.rotateX(-Math.PI / 2);
  upGeo.translate(0, soleH + bt, 0);
  // Slope the upper down toward the toe.
  const slope = (x) => toeDrop + (1 - toeDrop) * THREE.MathUtils.smoothstep(-x, -L / 2, L / 4);
  const p = upGeo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, soleH + (p.getY(i) - soleH) * slope(p.getX(i)));
  upGeo.computeVertexNormals();
  body.add(new THREE.Mesh(upGeo, upperMat));
  const topAt = (x) => soleH + (upperH + 2 * bt) * slope(x);

  const opening = new THREE.Mesh(new THREE.CircleGeometry(1, 32), std({ color: '#17120e', roughness: 0.9 }));
  opening.rotation.x = -Math.PI / 2;
  opening.scale.set(L * 0.17, W * 0.3, 1);
  opening.position.set(-L * 0.2, topAt(-L * 0.2) + 0.0012, 0);
  body.add(opening);

  if (laceMat) {
    for (let i = 0; i < 4; i++) {
      const x = -L * 0.02 + i * L * 0.05;
      const lace = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.003, W * 0.42), laceMat);
      lace.position.set(x, topAt(x) + 0.0005, 0);
      body.add(lace);
    }
  }
  if (tabMat) {
    const tab = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.03, W * 0.32, 2, 0.004), tabMat);
    tab.position.set(-L / 2 + 0.008, topAt(-L / 2) - 0.004, 0);
    body.add(tab);
  }

  if (heelH) {
    const a = Math.asin(heelH / L);
    body.rotation.z = -a;
    body.position.y = (L / 2) * Math.sin(a);
    const heel = new THREE.Mesh(new RoundedBoxGeometry(L * 0.2, heelH * 0.92, W * 0.62, 2, 0.003), soleMat);
    heel.position.set(-L / 2 + L * 0.12, (heelH * 0.92) / 2, 0);
    g.add(heel);
  }
  g.add(body);
  g.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  return g;
}

// ---------- easter eggs (origin = bottom center, facing +z) ----------
export function buildEgg(egg) {
  const g = new THREE.Group();
  switch (egg.kind) {
    case 'cassette': {
      const shell = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.088, 0.018, 2, 0.004), std({ color: '#1c1c21', roughness: 0.35 }));
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.134, 0.084), std({ map: T.makeCassette(egg.title, egg.sub, egg.stripe), roughness: 0.5 }));
      face.position.z = 0.0092;
      const tilt = new THREE.Group();
      tilt.add(shell, face);
      tilt.rotation.x = -0.14;
      tilt.position.set(0, 0.044, -0.02);
      g.add(tilt);
      break;
    }
    case 'vr': {
      const shell = std({ color: '#e9e9ec', roughness: 0.45 });
      const visor = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.075, 0.07, 3, 0.025), shell);
      visor.position.set(0, 0.04, 0.03);
      const faceplate = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.066, 0.01, 2, 0.004), std({ color: '#1d1e22', roughness: 0.3 }));
      faceplate.position.set(0, 0.04, 0.066);
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.009, 8, 40), std({ color: '#3a3c42', roughness: 0.8 }));
      strap.rotation.x = Math.PI / 2;
      strap.scale.set(0.95, 1, 1);
      strap.position.set(0, 0.03, -0.04);
      g.add(visor, faceplate, strap);
      break;
    }
    case 'danceShoe': {
      // A lead's ballroom shoe: black patent oxford with a low heel.
      const patent = new THREE.MeshPhysicalMaterial({ color: '#0b0b0d', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
      g.add(buildShoe({
        L: 0.2, W: 0.072, soleH: 0.006, upperH: 0.026, heelH: 0.024, toeDrop: 0.48,
        upperMat: patent, soleMat: std({ color: '#2b1d14', roughness: 0.7 }), laceMat: std({ color: '#121214', roughness: 0.6 }),
      }));
      break;
    }
    case 'runningShoe': {
      g.add(buildShoe({
        L: 0.2, W: 0.08, soleH: 0.02, upperH: 0.028, toeDrop: 0.55,
        upperMat: std({ color: '#2f6fe0', roughness: 0.65 }), soleMat: std({ color: '#f4f2ee', roughness: 0.55 }),
        laceMat: std({ color: '#ffffff', roughness: 0.6 }), tabMat: std({ color: '#ff7a2f', roughness: 0.5 }),
      }));
      break;
    }
    case 'polaroid': {
      const tex = egg.image ? new THREE.TextureLoader().load(egg.image, (t) => (t.colorSpace = THREE.SRGBColorSpace)) : T.makePolaroid(egg.caption ?? '');
      const white = std({ color: '#fbfaf6' });
      const photo = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.003), [white, white, white, white, std({ map: tex, roughness: 0.4 }), white]);
      photo.position.set(0, 0.054, 0);
      photo.rotation.x = -0.18;
      g.add(photo);
      break;
    }
    case 'gamecube': {
      const indigo = std({ color: '#4b3e94', roughness: 0.45 });
      const port = std({ color: '#17142a', roughness: 0.7 });
      const grey = std({ color: '#9b9aa6', roughness: 0.4, metalness: 0.3 });
      const w = 0.14, h = 0.105, d = 0.14, cx = -0.06;
      const cube = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.01), indigo);
      cube.position.set(cx, h / 2, 0);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.003, 40), std({ color: '#3f3383', roughness: 0.3 }));
      lid.position.set(cx, h + 0.0015, -0.01);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.007, 8, 24, Math.PI), indigo);
      handle.position.set(cx, h - 0.006, -d / 2 + 0.01);
      handle.rotation.x = -0.3;
      g.add(cube, lid, handle);
      for (let i = 0; i < 4; i++) g.add(box(0.02, 0.012, 0.003, port, cx - 0.045 + i * 0.03, 0.026, d / 2));
      for (const sx of [-1, 1]) g.add(box(0.03, 0.004, 0.003, port, cx + sx * 0.03, 0.058, d / 2));
      for (const sx of [-1, 1]) {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.004, 16), grey);
        btn.position.set(cx + sx * 0.045, h + 0.002, d / 2 - 0.022);
        g.add(btn);
      }

      // Controller propped up beside the console, face toward the room.
      const pad = new THREE.Group();
      pad.add(new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.022, 0.05, 3, 0.009), indigo));
      for (const sx of [-1, 1]) {
        const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.028, 6, 12), indigo);
        grip.rotation.set(Math.PI / 2, 0, 0);
        grip.rotation.y = sx * 0.35;
        grip.position.set(sx * 0.03, -0.003, 0.03);
        pad.add(grip);
      }
      const knob = (r, color, x, z, hgt = 0.006) => {
        const k = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hgt, 20), std({ color, roughness: 0.4 }));
        k.position.set(x, 0.011 + hgt / 2, z);
        pad.add(k);
      };
      knob(0.009, '#2fa84f', 0.02, 0);          // A
      knob(0.005, '#d6312f', 0.007, 0.011);     // B
      knob(0.0045, '#cfcfd6', 0.031, -0.008);   // X
      knob(0.0045, '#cfcfd6', 0.015, -0.014);   // Y
      knob(0.008, '#8e8d99', -0.022, -0.004, 0.01); // stick
      knob(0.0055, '#f2c230', 0.014, 0.02, 0.008);  // C-stick
      pad.rotation.x = Math.PI / 2 - 0.32;
      pad.rotation.z = 0.12;
      pad.position.set(0.105, 0.05, -0.05);
      g.add(pad);
      g.traverse((o) => o.isMesh && (o.castShadow = true));
      break;
    }
    case 'strawHat': {
      const profile = [
        [0.118, 0.004], [0.112, 0.009], [0.08, 0.014], [0.058, 0.016],
        [0.056, 0.05], [0.05, 0.068], [0.03, 0.076], [0.0, 0.078],
      ].map(([x, y]) => new THREE.Vector2(x, y));
      const straw = T.makeStraw();
      straw.repeat.set(6, 1);
      const hat = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), std({ map: straw, roughness: 0.85, side: THREE.DoubleSide }));
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0572, 0.0572, 0.016, 48, 1, true), std({ color: '#c8262c', roughness: 0.7 }));
      band.position.y = 0.026;
      const tilt = new THREE.Group();
      tilt.add(hat, band);
      tilt.rotation.set(0.18, 0, 0.05);
      tilt.position.y = 0.01;
      g.add(tilt);
      break;
    }
    case 'books': {
      let x = -0.05;
      egg.titles.forEach(([title, color, ink], i) => {
        const w = 0.028 + (i % 2) * 0.01, h = 0.15 + ((i * 7) % 3) * 0.012;
        const mat = std({ color, roughness: 0.7 });
        const spine = std({ map: T.makeBookSpine(title, color, ink), roughness: 0.7 });
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.11), [mat, mat, mat, mat, spine, mat]);
        b.position.set(x + w / 2, h / 2, 0);
        b.castShadow = true;
        g.add(b);
        x += w + 0.002;
      });
      break;
    }
  }
  return g;
}

export function placeEgg(egg, group) {
  const s = SPOTS[egg.spot];
  group.position.set(s.x + (egg.x ?? 0), s.y, 0.02);
  group.rotation.y = egg.rot ?? 0;
}
