// The 3D shelf on the Making Of page. three.js is only downloaded when the frame comes near the screen,
// and the scene only draws while the frame is visible.
import { TAPES, tapeUrl } from '../data/tapes.js';
import { EGGS } from '../data/eggs.js';
import { setReduced } from './timeline.js';

const figure = document.querySelector('[data-shelf]');
const canvas = figure?.querySelector('canvas');
const note = figure?.querySelector('.shelf-note');
const keys = figure ? [...figure.querySelectorAll('[data-egg]')] : [];
const cue = figure?.querySelector('.shelf-cue');

let scene = null;
let visible = false;
let shown = -1;

setReduced(matchMedia('(prefers-reduced-motion: reduce)').matches);

function showEgg(index) {
  shown = index;
  const egg = EGGS[index];
  keys.forEach((k) => k.setAttribute('aria-pressed', String(Number(k.dataset.egg) === index)));
  scene?.highlight('egg', index);
  const label = document.createElement('strong');
  label.textContent = `${egg.label}. `;
  note.replaceChildren(label, egg.note);
  if (egg.live === 'spotify') {
    fetch('/api/now-playing')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (shown !== index || !data?.title) return;
        note.replaceChildren(label, `${data.playing ? 'Listening right now' : 'Last played'}: ${data.title} — ${data.artist}`);
      })
      .catch(() => {});
  }
}

function clearEgg() {
  shown = -1;
  keys.forEach((k) => k.setAttribute('aria-pressed', 'false'));
  scene?.highlight(null);
  note.textContent = 'Click a tape to open its page, or anything on the side shelves to read its note.';
}

async function load() {
  if (!window.WebGL2RenderingContext) {
    cue.textContent = 'This browser can’t draw the 3D shelf.';
    return;
  }
  try {
    const { createScene } = await import('../scene/index.js');
    scene = await createScene({
      canvas,
      tapes: TAPES,
      eggs: EGGS,
      onTape: (id) => location.assign(tapeUrl(id)),
      onEgg: (index) => showEgg(index),
      onMiss: clearEgg,
    });
    figure.classList.add('shelf-on');
    if (visible) scene.wake();
  } catch (err) {
    console.warn('3D shelf unavailable', err);
    cue.textContent = 'The 3D shelf couldn’t load in this browser.';
  }
}

if (figure && canvas) {
  keys.forEach((k) => k.addEventListener('click', () => (Number(k.dataset.egg) === shown ? clearEgg() : showEgg(Number(k.dataset.egg)))));
  let started = false;
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !started) {
        started = true;
        load();
      }
    },
    { rootMargin: '400px 0px' },
  ).observe(figure);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!scene) return;
    if (visible) scene.wake();
    else scene.sleep();
  }).observe(canvas);
}
