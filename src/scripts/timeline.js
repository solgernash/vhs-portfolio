// Timing for the shelf's animations. Everything that moves goes through here so one call can finish
// it all at once: `rush(true)` when the visitor clicks again or skips, and reduced motion, which
// turns every movement into a cut.

const active = new Set(); // running tweens
const fades = new Set(); // pending fade() waits
let rushing = false;
let reduced = false;
let raf = 0;
let last = 0;

export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// Runs onUpdate(easedProgress) every frame for `seconds`; resolves when done.
export function tween(seconds, onUpdate, ease = easeInOut) {
  if (rushing || reduced || seconds <= 0) {
    onUpdate(1);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    active.add({ t: 0, seconds, onUpdate, ease, resolve });
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });
}

// A beat between movements.
export const pause = (seconds) => tween(seconds, () => {});

// Waits for a CSS fade. Fades are kept under reduced motion (nothing travels); rushing skips them.
export function fade(ms) {
  if (rushing) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      fades.delete(done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    fades.add(done);
  });
}

// While on, everything in flight finishes now and anything started finishes immediately.
export function rush(on) {
  rushing = on;
  if (!on) return;
  for (const tw of [...active]) finish(tw);
  for (const done of [...fades]) done();
}

export function setReduced(on) {
  reduced = on;
  if (on) for (const tw of [...active]) finish(tw);
}

export const isReduced = () => reduced;
export const isMoving = () => active.size > 0;

function finish(tw) {
  active.delete(tw);
  tw.onUpdate(1);
  tw.resolve();
}

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1); // a long gap (tab was hidden) advances by at most a tenth of a second
  last = now;
  for (const tw of [...active]) {
    tw.t = Math.min(tw.t + dt, tw.seconds);
    tw.onUpdate(tw.ease(tw.t / tw.seconds));
    if (tw.t >= tw.seconds) {
      active.delete(tw);
      tw.resolve();
    }
  }
  raf = active.size ? requestAnimationFrame(frame) : 0;
}
