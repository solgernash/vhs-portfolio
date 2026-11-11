const active = new Set();

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Runs onUpdate(easedProgress) every frame for `duration` seconds; resolves when done.
export function tween(duration, onUpdate, ease = easeInOutCubic) {
  return new Promise((resolve) => {
    active.add({ t: 0, duration, onUpdate, ease, resolve });
  });
}

export const wait = (duration) => tween(duration, () => {});

export function updateTweens(dt) {
  for (const tw of active) {
    tw.t = Math.min(tw.t + dt, tw.duration);
    tw.onUpdate(tw.ease(tw.duration > 0 ? tw.t / tw.duration : 1));
    if (tw.t >= tw.duration) {
      active.delete(tw);
      tw.resolve();
    }
  }
}
