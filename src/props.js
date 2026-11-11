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

// ---------- loft helpers (shoes, headset visor) ----------
const { smoothstep, lerp } = THREE.MathUtils;

// Smooth, overshoot-free curve through [t, value] points (monotone cubic), values multiplied by `scale`.
function interp(table, scale = 1) {
  const xs = table.map((p) => p[0]), ys = table.map((p) => p[1] * scale), n = xs.length;
  const d = xs.slice(0, -1).map((x, k) => (ys[k + 1] - ys[k]) / (xs[k + 1] - x));
  const m = ys.map((_, k) => (k === 0 ? d[0] : k === n - 1 ? d[n - 2] : d[k - 1] * d[k] <= 0 ? 0 : 2 / (1 / d[k - 1] + 1 / d[k])));
  return (t) => {
    if (t <= xs[0]) return ys[0];
    if (t >= xs[n - 1]) return ys[n - 1];
    let k = 0;
    while (t > xs[k + 1]) k++;
    const h = xs[k + 1] - xs[k], s = (t - xs[k]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[k] + (s3 - 2 * s2 + s) * h * m[k] + (-2 * s3 + 3 * s2) * ys[k + 1] + (s3 - s2) * h * m[k + 1];
  };
}

// One cross-section in the (z, y) plane, counterclockwise from the bottom center: flat bottom, straight
// sides, rounded corners. `breaks` are heights where the side color changes (a tight pair of points each).
// `taper` narrows the top so the sides lean inward, like the quarters of a shoe.
function section(w, y0, y1, rBot, rTop, breaks, colorAt, taper = 1, k = 6) {
  w = Math.max(w, 1e-5);
  y1 = Math.max(y1, y0 + 1e-5);
  const wt = w * taper;
  rBot = Math.min(rBot, w, (y1 - y0) / 2);
  rTop = Math.min(rTop, wt, y1 - y0 - rBot);
  const sideZ = (y) => lerp(w, wt, (y - y0 - rBot) / Math.max(y1 - rTop - y0 - rBot, 1e-6));
  const pts = [];
  const add = (z, y) => pts.push({ z, y, c: colorAt(y) });
  const arc = (cz, cy, r, a0) => {
    for (let i = 0; i <= k; i++) {
      const a = a0 + (i / k) * (Math.PI / 2);
      add(cz + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
  };
  const side = breaks
    .map((b) => THREE.MathUtils.clamp(b, y0 + rBot, y1 - rTop))
    .sort((a, b) => a - b)
    .flatMap((b) => [b - 1e-5, b + 1e-5]);
  add(0, y0);
  arc(w - rBot, y0 + rBot, rBot, -Math.PI / 2);
  side.forEach((y) => add(sideZ(y), y));
  arc(wt - rTop, y1 - rTop, rTop, 0);
  arc(-wt + rTop, y1 - rTop, rTop, Math.PI / 2);
  [...side].reverse().forEach((y) => add(-sideZ(y), y));
  arc(-w + rBot, y0 + rBot, rBot, Math.PI);
  return pts;
}

// Sweeps sections along x: ringAt(t) returns [{ z, y, c }] with the same count for every t, placed at
// x = (t - 0.5) * len for t from t0 to t1. `caps` closes flat ends. Colors land in a vertex color attribute.
function loft(len, steps, ringAt, { t0 = 0, t1 = 1, caps = false } = {}) {
  const pos = [], col = [], idx = [];
  const color = new THREE.Color();
  const push = (x, p) => {
    pos.push(x, p.y, p.z);
    color.set(p.c ?? '#ffffff');
    col.push(color.r, color.g, color.b);
  };
  const rings = [];
  for (let i = 0; i <= steps; i++) {
    const t = lerp(t0, t1, i / steps), x = (t - 0.5) * len, ring = ringAt(t);
    rings.push({ x, ring, base: pos.length / 3 });
    ring.forEach((p) => push(x, p));
  }
  const n = rings[0].ring.length;
  for (let i = 0; i < steps; i++)
    for (let j = 0; j < n; j++) {
      const a = rings[i].base + j, b = rings[i].base + ((j + 1) % n);
      idx.push(a, a + n, b, b, a + n, b + n);
    }
  if (caps)
    for (const [{ x, ring }, end] of [[rings[0], false], [rings[steps], true]]) {
      const center = pos.length / 3;
      push(x, { z: ring.reduce((s, p) => s + p.z, 0) / n, y: ring.reduce((s, p) => s + p.y, 0) / n, c: ring[0].c });
      ring.forEach((p) => push(x, p));
      for (let j = 0; j < n; j++) {
        const p = center + 1 + j, q = center + 1 + ((j + 1) % n);
        end ? idx.push(center, q, p) : idx.push(center, p, q);
      }
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// Height of a section's top surface at lateral offset z, for laces and eyelets that sit on it.
function topAtZ(w, y1, rTop, z) {
  const over = Math.abs(z) - (w - rTop);
  return over <= 0 ? y1 : y1 - rTop + Math.sqrt(Math.max(rTop * rTop - over * over, 0));
}

// A lace arching across the top of a shoe at x.
function lace(x, halfSpan, surfaceAt, radius, mat, yaw = 0) {
  const pts = [-1, -0.5, 0, 0.5, 1].map((u) => new THREE.Vector3(0, surfaceAt(u * halfSpan) + radius * 0.8, u * halfSpan));
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, radius, 6), mat);
  m.position.x = x;
  m.rotation.y = yaw;
  return m;
}

// The foot opening: a strip lying on the shoe's top surface between t0 and t1, shaded from dark
// edges to the insole color in the middle so it reads as a cavity.
function footOpening(len, t0, t1, halfAt, yAt, edge, insole, steps = 28) {
  const pos = [], col = [], idx = [];
  const ce = new THREE.Color(edge), ci = new THREE.Color(insole);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps, t = lerp(t0, t1, u), x = (t - 0.5) * len;
    const hw = halfAt(t) * Math.sqrt(Math.sin(Math.PI * u)), mid = ce.clone().lerp(ci, Math.sin(Math.PI * u) ** 0.5);
    pos.push(x, yAt(t), -hw, x, yAt(t), 0, x, yAt(t), hw);
    for (const c of [ce, mid, ce]) col.push(c.r, c.g, c.b);
    if (i) {
      const a = (i - 1) * 3;
      for (const j of [0, 1]) idx.push(a + j, a + j + 1, a + j + 3, a + j + 1, a + j + 4, a + j + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, std({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }));
}

function dropToFloor(obj) {
  obj.updateMatrixWorld(true);
  obj.position.y -= new THREE.Box3().setFromObject(obj).min.y;
  obj.updateMatrixWorld(true);
}

// ---------- shoes (x runs heel to toe, profiles traced from side photos, in units of length L) ----------
function buildRunningShoe() {
  // Max-cushion trainer: thick rocker midsole with orange stripes, blue mesh upper, navy padded collar.
  const L = 0.2, W = 0.078, S = 120;
  const g = new THREE.Group();
  const plan = (t) => (W / 2) * Math.sin(Math.PI * t) ** 0.42 * (0.84 + 0.16 * smoothstep(t, 0.25, 0.7));
  const bottom = interp([[0, 0.06], [0.07, 0.016], [0.16, 0.002], [0.3, 0], [0.68, 0], [0.84, 0.012], [0.95, 0.042], [1, 0.075]], L);
  const midTop = interp([[0, 0.19], [0.1, 0.205], [0.35, 0.198], [0.6, 0.183], [0.8, 0.17], [0.92, 0.152], [0.98, 0.122], [1, 0.095]], L);
  const top = interp([
    [0, 0.46], [0.03, 0.49], [0.09, 0.46], [0.16, 0.415], [0.23, 0.388], [0.3, 0.395], [0.36, 0.445], [0.4, 0.48],
    [0.44, 0.46], [0.5, 0.43], [0.6, 0.38], [0.7, 0.336], [0.8, 0.303], [0.9, 0.262], [0.96, 0.22], [1, 0.13],
  ], L);

  const WHITE = '#f3f2ee', ORANGE = '#f5992b', RUBBER = '#c5d2db';
  const midsole = loft(L, S, (t) => {
    const y0 = bottom(t), y1 = midTop(t), rub = y0 + 0.014 * L;
    const sMid = lerp(y0, y1, 0.42), sHalf = 0.006 * L * smoothstep(t, 0.4, 0.55) * (1 - smoothstep(t, 0.96, 1));
    const band = 0.013 * L * (1 - smoothstep(t, 0.55, 0.8));
    const colorAt = (y) => (y < rub ? RUBBER : Math.abs(y - sMid) < sHalf || y > y1 - band ? ORANGE : WHITE);
    return section(plan(t) * 1.1, y0, y1, 0.004, 0.0025, [rub, sMid - sHalf, sMid + sHalf, y1 - band], colorAt);
  });

  const NAVY = '#2a3a64', MESH = '#93b1d8', COUNTER = '#7f9bc2', TOE = '#7f9cc4';
  const upperW = (t) => plan(t) * 0.97, TAPER = 0.8;
  const topW = (t) => upperW(t) * TAPER;
  const rTopAt = (t) => topW(t) * lerp(0.4, 0.95, smoothstep(t, 0.34, 0.5));
  const upper = loft(L, S, (t) => {
    const y0 = midTop(t) - 0.002, y1 = top(t), inCollar = t < 0.42;
    const yb = inCollar ? y1 - 0.075 * L : lerp(y0, y1, 0.5);
    const colorAt = (y) => (inCollar && y > yb ? NAVY : t < 0.14 ? COUNTER : t > 0.93 ? TOE : MESH);
    return section(upperW(t), y0, y1, 0.002, rTopAt(t), [yb], colorAt, TAPER);
  });

  g.add(new THREE.Mesh(midsole, std({ vertexColors: true, roughness: 0.6 })), new THREE.Mesh(upper, std({ vertexColors: true, roughness: 0.85 })));
  g.add(footOpening(L, 0.05, 0.36, (t) => topW(t) * 0.55, (t) => top(t) + 0.0006, '#121a30', '#5a6c94'));
  const laceMat = std({ color: '#c6d5ea', roughness: 0.7 });
  for (let i = 0; i < 6; i++) {
    const t = 0.45 + i * 0.04, w = topW(t), r = rTopAt(t), y1 = top(t);
    g.add(lace((t - 0.5) * L, w * 0.62, (z) => topAtZ(w, y1, r, z), 0.0016, laceMat, i % 2 ? 0.22 : -0.22));
  }
  return g;
}

function buildDanceShoe() {
  // A lead's ballroom shoe: black patent oxford, five eyelets, 1" Cuban heel, thin suede sole.
  const L = 0.2, W = 0.07, S = 120;
  const g = new THREE.Group();
  const plan = (t) => (W / 2) * Math.sin(Math.PI * t) ** 0.45 * (0.8 + 0.2 * smoothstep(t, 0.3, 0.72));
  const bottom = interp([[0, 0.09], [0.27, 0.09], [0.36, 0.076], [0.46, 0.032], [0.56, 0.006], [0.62, 0], [0.9, 0], [0.97, 0.006], [1, 0.02]], L);
  const top = interp([
    [0, 0.255], [0.012, 0.31], [0.035, 0.338], [0.1, 0.345], [0.3, 0.335], [0.45, 0.325], [0.52, 0.322], [0.6, 0.292],
    [0.68, 0.27], [0.76, 0.235], [0.84, 0.195], [0.9, 0.165], [0.94, 0.14], [0.97, 0.11], [0.99, 0.075], [1, 0.045],
  ], L);
  const soleTh = 0.014 * L;
  const plain = () => '#ffffff';
  const upperW = (t) => plan(t) * 0.98, TAPER = 0.78;
  const topW = (t) => upperW(t) * TAPER;
  const rTopAt = (t) => topW(t) * lerp(0.35, 0.95, smoothstep(t, 0.48, 0.62));

  const patent = new THREE.MeshPhysicalMaterial({ color: '#0b0b0d', roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.04 });
  const suede = std({ color: '#2b2b2e', roughness: 0.95 });
  const heelSpan = { t0: 0.004, t1: 0.27, caps: true };
  g.add(
    new THREE.Mesh(loft(L, S, (t) => section(plan(t) * 1.03, bottom(t), bottom(t) + soleTh, 0.0012, 0.0008, [], plain)), suede),
    new THREE.Mesh(loft(L, S, (t) => section(upperW(t), bottom(t) + soleTh - 0.0008, top(t), 0.0015, rTopAt(t), [], plain, TAPER)), patent),
    new THREE.Mesh(loft(L, 30, (t) => section(plan(t) * 0.9, 0.004, bottom(t), 0.002, 0.0005, [], plain), heelSpan), patent),
    new THREE.Mesh(loft(L, 30, (t) => section(plan(t) * 0.9, 0, 0.0042, 0.0015, 0.0003, [], plain), heelSpan), suede),
  );
  g.add(footOpening(L, 0.05, 0.5, (t) => topW(t) * 0.58, (t) => top(t) + 0.0006, '#0e0c0b', '#9c7650'));

  // Stitched seam sweeping from the eyelets down to the sole, on both sides.
  const seamMat = std({ color: '#4a4a52', roughness: 0.5 });
  const sideAt = (t, f) => {
    const y0 = bottom(t) + soleTh, y1 = top(t), r = Math.min(rTopAt(t), topW(t));
    const y = lerp(y0 + 0.002, y1 - r, f);
    return { y, z: lerp(upperW(t), topW(t), (y - y0) / Math.max(y1 - r - y0, 1e-6)) + 0.0005 };
  };
  for (const s of [-1, 1]) {
    const pts = [[0.535, 1], [0.5, 0.78], [0.45, 0.5], [0.4, 0.24], [0.36, 0.04]].map(([t, f]) => {
      const { y, z } = sideAt(t, f);
      return new THREE.Vector3((t - 0.5) * L, y, s * z);
    });
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0007, 5), seamMat));
  }

  const laceMat = std({ color: '#111113', roughness: 0.6 });
  const eyeletMat = std({ color: '#3a3a40', roughness: 0.3, metalness: 0.8 });
  for (let i = 0; i < 5; i++) {
    const t = 0.53 + i * 0.033, w = topW(t), r = rTopAt(t), y1 = top(t), x = (t - 0.5) * L;
    const surf = (z) => topAtZ(w, y1, r, z);
    g.add(lace(x, w * 0.44, surf, 0.0012, laceMat));
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.TorusGeometry(0.0021, 0.0007, 6, 14), eyeletMat);
      eye.rotation.x = Math.PI / 2;
      eye.position.set(x, surf(s * w * 0.46) + 0.0004, s * w * 0.46);
      g.add(eye);
    }
  }
  return g;
}

// ---------- VR headset ----------
function buildQuest() {
  const g = new THREE.Group();
  const white = std({ color: '#efeff1', roughness: 0.38 });
  const grey = std({ color: '#8e9096', roughness: 0.9 });
  const glass = std({ color: '#25272c', roughness: 0.18, metalness: 0.2 });

  // Visor: a rounded front-to-back profile swept across the width and curved around the face.
  const VW = 0.16, depth = 0.026, ys = 0.046, hh = 0.04;
  const round = (t, n) => (1 - Math.abs(2 * t - 1) ** n) ** (1 / n); // superellipse: rounded-rectangle outline
  const env = (t) => round(t, 4);
  const bend = (t) => -2.4 * ((t - 0.5) * VW) ** 2;
  const visor = loft(VW, 64, (t) => {
    const w = depth * env(t), half = hh * round(t, 3.2);
    return section(w, ys - half, ys + half, w * 0.6, w * 0.6, [], () => '#ffffff').map((p) => ({ ...p, z: p.z + bend(t) }));
  });
  const headset = new THREE.Group();
  headset.position.x = 0.045;
  g.add(headset);
  headset.add(new THREE.Mesh(visor, white));

  const face = new THREE.Mesh(new RoundedBoxGeometry(0.135, 0.066, 0.03, 3, 0.012), std({ color: '#5f6167', roughness: 0.9 }));
  face.position.set(0, ys - 0.002, -depth - 0.004);
  headset.add(face);

  // Three vertical sensor slots across the front.
  for (const x of [-0.027, 0, 0.027]) {
    const pill = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.01, 4, 12), glass);
    pill.scale.z = 0.35;
    pill.position.set(x, ys + 0.002, depth * env(x / VW + 0.5) + bend(x / VW + 0.5) + 0.0006);
    pill.rotation.y = Math.atan(4.8 * x); // follow the curve of the visor
    headset.add(pill);
  }

  // Strap loop behind the visor.
  const zc = -depth - 0.05, loop = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    loop.push(new THREE.Vector3(Math.cos(a) * 0.083, 0, zc + Math.sin(a) * 0.06));
  }
  const strap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(loop, true), 96, 0.0035, 8, true), std({ color: '#dcdde1', roughness: 0.7 }));
  strap.scale.y = 2.3;
  strap.position.y = ys - 0.004;
  headset.add(strap);

  for (const side of [-1, 1]) {
    const c = questController(side, white, glass);
    // Standing side by side to the left of the headset, seen in profile.
    c.rotation.set(0.3, side * 1.25, 0, 'YXZ');
    c.position.set(side < 0 ? -0.14 : -0.088, 0, 0.05 + side * 0.012);
    dropToFloor(c);
    g.add(c);
  }
  return g;
}

function questController(side, white, dark) {
  const c = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.0115, 0.028, 6, 16), white);
  handle.rotation.x = -0.45;
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), white);
  head.scale.set(0.025, 0.012, 0.024);
  head.position.set(side * 0.002, 0.026, -0.008);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0048, 0.007, 16), dark);
  stick.position.set(-side * 0.007, 0.037, -0.006);
  c.add(handle, head, stick);
  for (const [x, z] of [[0.01, -0.014], [0.009, 0.001]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.002, 14), std({ color: '#bfc0c6', roughness: 0.4 }));
    b.position.set(side * x, 0.0372, z);
    c.add(b);
  }
  return c;
}

// ---------- game console ----------
function buildGameCube() {
  const g = new THREE.Group();
  const indigo = std({ color: '#5044a6', roughness: 0.42 });
  const dark = std({ color: '#15121e', roughness: 0.5 });
  const silver = std({ color: '#bdbcc8', roughness: 0.35, metalness: 0.25 });
  const pale = std({ color: '#d9d8e0', roughness: 0.4 });
  const w = 0.13, h = 0.1, d = 0.14, cx = -0.045, cz = -0.025, feet = 0.004, front = d / 2;
  const at = (m, x, y, z) => {
    m.position.set(cx + x, y, cz + z);
    g.add(m);
    return m;
  };

  at(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.008), indigo), 0, feet + h / 2, 0);
  for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) at(box(0.012, feet, 0.012, dark, 0, 0, 0), sx * 0.05, feet / 2, sz * 0.055);

  // Top: the round disc lid, open/power/reset buttons, and the carry handle at the back.
  const top = feet + h;
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.003, 48), std({ color: '#0d0d12', roughness: 0.25 })), 0, top + 0.0012, -0.01);
  at(new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.0016, 6, 48), std({ color: '#2a2838', roughness: 0.4 })), 0, top + 0.001, -0.01).rotation.x = Math.PI / 2;
  for (const [x, z, r] of [[-0.046, 0.05, 0.0085], [0.047, 0.052, 0.0055], [0.033, 0.055, 0.004]]) {
    at(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.004, 20), pale), x, top + 0.0012, z);
  }
  const handle = at(new THREE.Mesh(new THREE.TorusGeometry(0.054, 0.0072, 10, 36, Math.PI), std({ color: '#1e1b2e', roughness: 0.5 })), 0, top - 0.004, -front + 0.01);
  handle.scale.y = 0.55;
  handle.rotation.x = -0.95;

  // Front: silver panel with four controller ports and two memory card slots.
  at(box(0.112, 0.056, 0.004, silver, 0, 0, 0), 0, feet + 0.042, front + 0.0005);
  for (let i = 0; i < 4; i++) at(new THREE.Mesh(new RoundedBoxGeometry(0.017, 0.02, 0.006, 2, 0.0025), dark), -0.039 + i * 0.026, feet + 0.054, front + 0.002);
  for (const s of [-1, 1]) at(box(0.032, 0.0045, 0.004, dark, 0, 0, 0), s * 0.027, feet + 0.026, front + 0.002);

  // Right side: vent grille.
  at(new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.062), std({ map: T.makeVent(), roughness: 0.5 })), w / 2 + 0.0006, feet + 0.048, -0.015).rotation.y = Math.PI / 2;

  // Controller propped up beside the console, plugged into port 1.
  const pad = buildGameCubePad(indigo);
  pad.rotation.set(0.95, 0.35, 0, 'YXZ');
  pad.position.set(0.095, 0, 0.04);
  dropToFloor(pad);
  g.add(pad);
  const start = pad.localToWorld(new THREE.Vector3(0, 0.012, -0.03));
  const port = new THREE.Vector3(cx - 0.039, feet + 0.054, cz + front + 0.004);
  const cord = new THREE.CatmullRomCurve3([
    start,
    start.clone().add(new THREE.Vector3(-0.004, 0.012, -0.012)),
    new THREE.Vector3(lerp(start.x, port.x, 0.45), 0.0025, Math.max(start.z, port.z) + 0.035),
    new THREE.Vector3(port.x + 0.006, 0.0025, port.z + 0.03),
    new THREE.Vector3(port.x, 0.02, port.z + 0.012),
    port,
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(cord, 64, 0.0021, 6), std({ color: '#3b3480', roughness: 0.6 })));
  at(box(0.012, 0.015, 0.008, std({ color: '#6b6a78', roughness: 0.4 }), 0, 0, 0), -0.039, feet + 0.054, front + 0.006);
  return g;
}

function buildGameCubePad(body) {
  const pad = new THREE.Group();
  // Top-view outline: shoulders across the back, two grips toward the player.
  const s = new THREE.Shape();
  s.moveTo(-0.038, 0.024);
  s.quadraticCurveTo(0, 0.032, 0.038, 0.024);
  s.quadraticCurveTo(0.052, 0.02, 0.052, 0.004);
  s.quadraticCurveTo(0.054, -0.03, 0.04, -0.044);
  s.quadraticCurveTo(0.028, -0.054, 0.02, -0.036);
  s.quadraticCurveTo(0.014, -0.018, 0, -0.018);
  s.quadraticCurveTo(-0.014, -0.018, -0.02, -0.036);
  s.quadraticCurveTo(-0.028, -0.054, -0.04, -0.044);
  s.quadraticCurveTo(-0.054, -0.03, -0.052, 0.004);
  s.quadraticCurveTo(-0.052, 0.02, -0.038, 0.024);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 4, curveSegments: 14 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0.005, 0);
  pad.add(new THREE.Mesh(geo, body));

  const topY = 0.02;
  const knob = (r, h, color, x, y, stretch = 1, yaw = 0) => {
    const k = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), std({ color, roughness: 0.35 }));
    k.scale.x = stretch;
    k.rotation.y = yaw;
    k.position.set(x, topY + h / 2 - 0.001, -y);
    pad.add(k);
  };
  knob(0.0115, 0.002, '#3d3486', -0.026, 0.006); // stick well
  knob(0.0075, 0.009, '#9a99a6', -0.026, 0.006); // analog stick
  knob(0.0085, 0.005, '#2fae55', 0.026, 0.004); // A
  knob(0.005, 0.004, '#d8312e', 0.011, -0.007); // B
  knob(0.0042, 0.004, '#c9c8d2', 0.041, 0.011, 1.7, -0.9); // X
  knob(0.0042, 0.004, '#c9c8d2', 0.022, 0.02, 1.7, 0.15); // Y
  knob(0.0055, 0.008, '#f2c12e', 0.016, -0.026); // C-stick
  knob(0.0028, 0.003, '#c9c8d2', 0, 0.004); // Start
  for (const [bw, bd] of [[0.013, 0.0042], [0.0042, 0.013]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.003, bd), std({ color: '#9a99a6', roughness: 0.4 }));
    b.position.set(-0.015, topY + 0.001, 0.026);
    pad.add(b);
  }
  return pad;
}

// ---------- straw hat ----------
function buildStrawHat() {
  // Tall rounded crown, thick red band, floppy brim with a frayed, torn edge.
  const crownPts = [[0.06, 0], [0.0614, 0.024], [0.0606, 0.05], [0.0566, 0.073], [0.048, 0.091], [0.0345, 0.104], [0.018, 0.111], [0, 0.113]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const crownTex = T.makeStrawCrown();
  crownTex.repeat.set(3, 1);
  const crown = new THREE.Mesh(new THREE.LatheGeometry(crownPts, 56), std({ map: crownTex, roughness: 0.9, side: THREE.DoubleSide }));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0617, 0.0623, 0.027, 56, 1, true), std({ color: '#c2202c', roughness: 0.75, side: THREE.DoubleSide }));
  band.position.y = 0.0145;

  const ri = 0.058, ro = 0.13;
  const brimGeo = new THREE.RingGeometry(ri, ro, 120, 5);
  brimGeo.rotateX(-Math.PI / 2);
  const fray = (a) => 0.03 * Math.sin(9 * a) + 0.02 * Math.sin(23 * a + 2) + 0.025 * Math.sin(41 * a + 0.5) * Math.sin(5 * a) - (Math.sin(3 * a + 1) > 0.93 ? 0.07 : 0);
  const p = brimGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z), a = Math.atan2(z, x), s = (r - ri) / (ro - ri);
    const r2 = r + s * s * ro * fray(a);
    p.setXYZ(i, (x / r) * r2, -0.02 * s * s + 0.007 * s * Math.sin(2 * a + 0.7) + 0.004 * s * Math.sin(5 * a + 1.3), (z / r) * r2);
  }
  brimGeo.computeVertexNormals();
  const brim = new THREE.Mesh(brimGeo, std({ map: T.makeStrawBrim(), roughness: 0.92, side: THREE.DoubleSide }));

  const hat = new THREE.Group();
  hat.add(crown, band, brim);
  hat.rotation.set(0.1, 0, 0.05);
  dropToFloor(hat);
  return hat;
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
    case 'vr':
      g.add(buildQuest());
      break;
    case 'danceShoe':
      g.add(buildDanceShoe());
      break;
    case 'runningShoe':
      g.add(buildRunningShoe());
      break;
    case 'gamecube':
      g.add(buildGameCube());
      break;
    case 'strawHat':
      g.add(buildStrawHat());
      break;
    case 'polaroid': {
      // Instant-film card (portrait), leaning back a little.
      const white = std({ color: '#fbfaf6', roughness: 0.6 });
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.118, 0.002), [white, white, white, white, std({ map: T.makePolaroid(egg.caption ?? '', egg.image), roughness: 0.45 }), white]);
      card.rotation.x = -0.16;
      card.position.set(0, 0.06, -0.004);
      dropToFloor(card);
      g.add(card);
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
