import * as THREE from 'three';

function canvasTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Spine label for a tape: black plastic with a slightly crooked hand-written sticker.
export function makeLabelTexture(tape) {
  const c = document.createElement('canvas');
  c.width = 1200;
  c.height = 160;
  const g = c.getContext('2d');

  const plastic = g.createLinearGradient(0, 0, 0, c.height);
  plastic.addColorStop(0, '#1d1d20');
  plastic.addColorStop(1, '#0c0c0e');
  g.fillStyle = plastic;
  g.fillRect(0, 0, c.width, c.height);

  g.save();
  g.translate(c.width / 2, c.height / 2);
  g.rotate((Math.random() - 0.5) * 0.012);
  const w = 1040, h = 116;
  g.fillStyle = '#f1ebdc';
  g.fillRect(-w / 2, -h / 2, w, h);
  g.fillStyle = tape.stripe;
  g.fillRect(-w / 2, -h / 2, 110, h);
  g.fillStyle = 'rgba(0,0,0,0.08)';
  for (let y = -h / 2 + 30; y < h / 2; y += 30) g.fillRect(-w / 2 + 130, y, w - 150, 2);

  g.fillStyle = '#1b1b1f';
  g.textBaseline = 'middle';
  g.font = '64px "Permanent Marker", cursive';
  g.fillText(tape.title, -w / 2 + 140, 4);
  g.font = '30px "Permanent Marker", cursive';
  g.textAlign = 'right';
  g.fillStyle = '#4a4a52';
  g.fillText(tape.sub, w / 2 - 24, 10);
  g.restore();

  return canvasTexture(c);
}

// What the CRT shows before the camera zooms in. Redrawn on state change / blink.
export function makeScreen() {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 480;
  const g = c.getContext('2d');
  const texture = canvasTexture(c);

  function osd(text, x, y, size, align = 'left') {
    g.font = `${size}px VT323, monospace`;
    g.textAlign = align;
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fillText(text, x + 3, y + 3);
    g.fillStyle = '#f4f6ff';
    g.fillText(text, x, y);
  }

  function draw(state, { title = '', blink = true } = {}) {
    g.textBaseline = 'middle';
    if (state === 'idle') {
      g.fillStyle = '#1631c9';
      g.fillRect(0, 0, c.width, c.height);
      osd('CH 03', 40, 50, 48);
      osd('PICK A TAPE', c.width / 2, 230, 96, 'center');
      if (blink) osd('▲ TOP SHELF ▲', c.width / 2, 350, 56, 'center');
    } else {
      g.fillStyle = '#050508';
      g.fillRect(0, 0, c.width, c.height);
      osd('▶ PLAY', 40, 50, 48);
      osd('SP', c.width - 40, 50, 48, 'right');
      osd(title, c.width / 2, c.height / 2, 72, 'center');
    }
    texture.needsUpdate = true;
  }

  return { texture, draw };
}

// Painted VCR front: slot, buttons and a green VFD display.
export function makeVcrFace() {
  const c = document.createElement('canvas');
  c.width = 1240;
  c.height = 200;
  const g = c.getContext('2d');
  const texture = canvasTexture(c);

  // Slot center as a fraction of the faceplate, used by the scene to aim tapes.
  const slot = { x: 0.36, y: 0.42, w: 0.4, h: 0.3 };

  function draw(text, lit = true) {
    const face = g.createLinearGradient(0, 0, 0, c.height);
    face.addColorStop(0, '#2a2a2e');
    face.addColorStop(1, '#161618');
    g.fillStyle = face;
    g.fillRect(0, 0, c.width, c.height);
    for (let x = 0; x < c.width; x += 3) {
      g.fillStyle = `rgba(255,255,255,${Math.random() * 0.018})`;
      g.fillRect(x, 0, 1, c.height);
    }

    const sx = (slot.x - slot.w / 2) * c.width, sy = (slot.y - slot.h / 2) * c.height;
    const sw = slot.w * c.width, sh = slot.h * c.height;
    g.fillStyle = '#050505';
    g.fillRect(sx - 6, sy - 6, sw + 12, sh + 12);
    g.fillStyle = '#121214';
    g.fillRect(sx, sy, sw, sh);
    g.fillStyle = 'rgba(255,255,255,0.06)';
    g.fillRect(sx, sy, sw, 4);

    g.fillStyle = '#8b8b92';
    g.font = '600 22px "IBM Plex Mono", monospace';
    g.textBaseline = 'middle';
    g.fillText('VHS  HQ', 40, 46);
    g.fillText('4 HEAD HI-FI STEREO', sx, sy + sh + 34);

    const dx = 830, dy = 50, dw = 270, dh = 70;
    g.fillStyle = '#050807';
    g.fillRect(dx, dy, dw, dh);
    g.font = '56px VT323, monospace';
    g.textAlign = 'center';
    g.fillStyle = lit ? '#5dffb0' : 'rgba(93,255,176,0.12)';
    g.shadowColor = '#5dffb0';
    g.shadowBlur = lit ? 14 : 0;
    g.fillText(text, dx + dw / 2, dy + dh / 2 + 3);
    g.shadowBlur = 0;
    g.textAlign = 'left';

    for (let i = 0; i < 5; i++) {
      g.fillStyle = '#0d0d0f';
      g.fillRect(830 + i * 56, 145, 42, 22);
      g.fillStyle = '#3a3a40';
      g.fillRect(832 + i * 56, 147, 38, 6);
    }
    g.fillStyle = '#ff3b30';
    g.beginPath();
    g.arc(1160, 156, 7, 0, Math.PI * 2);
    g.fill();

    texture.needsUpdate = true;
  }

  return { texture, draw, slot };
}

// ---------- entertainment center ----------

function grain(g, w, h, base, { dark = 'rgba(120,84,40,', light = 'rgba(255,240,210,', seed = 1 } = {}) {
  let r = seed;
  const rand = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    const y0 = rand() * h, amp = 2 + rand() * 6, freq = 0.004 + rand() * 0.01;
    g.strokeStyle = rand() < 0.75 ? `${dark}${0.05 + rand() * 0.09})` : `${light}${0.05 + rand() * 0.07})`;
    g.lineWidth = 0.6 + rand() * 1.6;
    g.beginPath();
    for (let x = 0; x <= w; x += 8) g.lineTo(x, y0 + Math.sin(x * freq + i) * amp);
    g.stroke();
  }
}

// Light plywood. `vertical` rotates the grain for upright panels.
export function makeWood(vertical = false) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  grain(c.getContext('2d'), 512, 512, '#d6b986');
  const t = canvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (vertical) {
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 2;
  }
  return t;
}

// Dark walnut inlay with gold-leaf letters, so the name stands out from the light plywood.
export function makeHeaderPlate(text) {
  const c = document.createElement('canvas');
  c.width = 1240;
  c.height = 200;
  const g = c.getContext('2d');
  grain(g, c.width, c.height, '#3d2517', { dark: 'rgba(20,10,4,', light: 'rgba(160,110,70,', seed: 7 });
  g.strokeStyle = 'rgba(214,170,84,0.55)';
  g.lineWidth = 3;
  g.strokeRect(22, 22, c.width - 44, c.height - 44);

  g.font = '600 92px Georgia, "Times New Roman", serif';
  if ('letterSpacing' in g) g.letterSpacing = '14px';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const x = c.width / 2, y = c.height / 2 + 6;
  const gold = g.createLinearGradient(0, y - 46, 0, y + 46);
  gold.addColorStop(0, '#fbe6a6');
  gold.addColorStop(0.5, '#d9a84a');
  gold.addColorStop(1, '#a8742a');
  g.fillStyle = 'rgba(0,0,0,0.5)';
  g.fillText(text, x + 3, y + 4);
  g.fillStyle = gold;
  g.fillText(text, x, y);
  return canvasTexture(c);
}

// Script neon on a transparent background: glow, colored tube, then a hot white core.
export function makeNeon(lines, color) {
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 500;
  const g = c.getContext('2d');
  g.font = '210px Sacramento, cursive';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = g.lineCap = 'round';
  const rows = lines.map((text, i) => [text, c.height / 2 + (i - (lines.length - 1) / 2) * 190 + 10]);
  g.shadowColor = color;
  for (const [blur, width, alpha] of [[60, 13, 0.5], [26, 9, 0.8], [9, 6, 1]]) {
    g.shadowBlur = blur;
    g.globalAlpha = alpha;
    g.strokeStyle = color;
    g.lineWidth = width;
    for (const [text, y] of rows) g.strokeText(text, c.width / 2, y);
  }
  g.globalAlpha = 1;
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(255,245,250,0.95)';
  g.lineWidth = 2.5;
  for (const [text, y] of rows) g.strokeText(text, c.width / 2, y);
  return canvasTexture(c);
}

export function makePoster() {
  const c = document.createElement('canvas');
  c.width = 600;
  c.height = 840;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, '#13183a');
  bg.addColorStop(1, '#3a1430');
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 120; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.6})`;
    g.fillRect(Math.random() * c.width, Math.random() * 420, 2, 2);
  }
  g.textAlign = 'center';
  g.fillStyle = '#f5c85c';
  g.font = '44px VT323, monospace';
  g.fillText('★ NOW SHOWING ★', 300, 90);
  // a cassette as the "key art"
  g.save();
  g.translate(300, 330);
  g.rotate(-0.12);
  g.fillStyle = '#101014';
  g.fillRect(-190, -110, 380, 220);
  g.fillStyle = '#f1ebdc';
  g.fillRect(-160, -90, 320, 70);
  g.fillStyle = '#e5484d';
  g.fillRect(-160, -90, 40, 70);
  g.fillStyle = '#1b1b1f';
  g.font = '40px "Permanent Marker", cursive';
  g.fillText('PORTFOLIO', 20, -42);
  for (const x of [-80, 80]) {
    g.beginPath();
    g.arc(x, 40, 38, 0, Math.PI * 2);
    g.fillStyle = '#2a2a30';
    g.fill();
    g.beginPath();
    g.arc(x, 40, 12, 0, Math.PI * 2);
    g.fillStyle = '#f1ebdc';
    g.fill();
  }
  g.restore();
  g.fillStyle = '#ffffff';
  g.font = '92px "Permanent Marker", cursive';
  g.fillText('NASH', 300, 590);
  g.fillText('CARROLL', 300, 680);
  g.fillStyle = '#c9b8e6';
  g.font = '34px VT323, monospace';
  g.fillText('A PORTFOLIO IN FIVE TAPES', 300, 750);
  g.fillText('RATED PG · BE KIND, REWIND', 300, 790);
  return canvasTexture(c);
}

export function makeBookSpine(title, color, ink = '#f6efdf') {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 640;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.fillRect(0, 40, c.width, 6);
  g.fillRect(0, c.height - 46, c.width, 6);
  g.save();
  g.translate(c.width / 2, c.height / 2);
  g.rotate(-Math.PI / 2);
  g.fillStyle = ink;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '600 44px Georgia, serif';
  g.fillText(title, 0, 2, c.height - 120);
  g.restore();
  return canvasTexture(c);
}

// A tiny dot-matrix board for the side shelf.
export function makeStraw() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#e3bd62';
  g.fillRect(0, 0, c.width, c.height);
  for (let y = 0; y < c.height; y += 6) {
    g.fillStyle = y % 12 ? 'rgba(150,105,35,0.35)' : 'rgba(255,235,170,0.35)';
    g.fillRect(0, y, c.width, 2);
  }
  for (let x = 0; x < c.width; x += 10) {
    g.fillStyle = 'rgba(120,80,25,0.18)';
    g.fillRect(x, 0, 2, c.height);
  }
  const t = canvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Face of an audio cassette: label strip, window and two reels.
export function makeCassette(title, sub, stripe) {
  const c = document.createElement('canvas');
  c.width = 560;
  c.height = 352;
  const g = c.getContext('2d');
  g.fillStyle = '#1c1c21';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#f1ebdc';
  g.fillRect(30, 26, 500, 210);
  g.fillStyle = stripe;
  g.fillRect(30, 26, 500, 34);
  g.fillStyle = '#1b1b1f';
  g.font = '62px "Permanent Marker", cursive';
  g.textBaseline = 'middle';
  g.fillText(title, 56, 98);
  g.font = '30px "Permanent Marker", cursive';
  g.fillStyle = '#4a4a52';
  g.textAlign = 'right';
  g.fillText(sub, 506, 98);
  g.textAlign = 'left';
  g.fillStyle = '#121216';
  g.fillRect(130, 142, 300, 80);
  for (const x of [190, 370]) {
    g.beginPath();
    g.arc(x, 182, 32, 0, Math.PI * 2);
    g.fillStyle = '#f4f1ea';
    g.fill();
    g.fillStyle = '#121216';
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      g.fillRect(x + Math.cos(a) * 18 - 4, 182 + Math.sin(a) * 18 - 4, 8, 8);
    }
  }
  g.fillStyle = '#2a2a30';
  g.beginPath();
  g.moveTo(110, 352);
  g.lineTo(140, 270);
  g.lineTo(420, 270);
  g.lineTo(450, 352);
  g.fill();
  return canvasTexture(c);
}

export function makePolaroid(caption) {
  const c = document.createElement('canvas');
  c.width = 360;
  c.height = 440;
  const g = c.getContext('2d');
  g.fillStyle = '#fbfaf6';
  g.fillRect(0, 0, c.width, c.height);
  const sky = g.createLinearGradient(0, 24, 0, 344);
  sky.addColorStop(0, '#3b2b6e');
  sky.addColorStop(0.55, '#f2706b');
  sky.addColorStop(1, '#ffc46b');
  g.fillStyle = sky;
  g.fillRect(24, 24, 312, 320);
  g.fillStyle = '#ffe9a8';
  g.beginPath();
  g.arc(180, 250, 52, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#2a1830';
  g.fillRect(24, 270, 312, 74);
  g.fillStyle = '#33333a';
  g.font = '40px "Permanent Marker", cursive';
  g.textAlign = 'center';
  g.fillText(caption, 180, 400);
  return canvasTexture(c);
}

export function makeGrille() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#a31f22';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#4a0d0f';
  for (let y = 10; y < c.height; y += 16)
    for (let x = 10; x < c.width; x += 16) {
      g.beginPath();
      g.arc(x, y, 4, 0, Math.PI * 2);
      g.fill();
    }
  return canvasTexture(c);
}
