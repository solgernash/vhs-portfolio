// Draws the link-preview images (Open Graph, 1200×630) into public/og/: one per page plus the home page.
// Run `npm run og` after changing a page name, role or year in src/data/tapes.js.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { TAPES } from '../src/data/tapes.js';

const require = createRequire(import.meta.url);
// satori needs static font files (it can't read variable fonts), so this uses the static build of the same face.
const fonts = await Promise.all([400, 700, 800].map(async (weight) => ({
  name: 'Grotesk',
  data: await readFile(require.resolve(`@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-${weight}-normal.woff`)),
  weight,
  style: 'normal',
})));

const h = (type, style, children) => ({ type, props: { style, children } });
const PAPER = '#f4f4f1', INK = '#111111', RED = '#cf2a15';

function card({ name, role, year }) {
  return h('div', { width: 1200, height: 630, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '44px 64px 56px', background: PAPER, color: INK, fontFamily: 'Grotesk' }, [
    h('div', { display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 700, paddingBottom: 18, borderBottom: `4px solid ${INK}` }, [
      h('div', {}, 'Nash Carroll'),
      h('div', { color: RED }, 'Software engineer'),
    ]),
    h('div', { display: 'flex', flexDirection: 'column' }, [
      h('div', { fontSize: name.length > 10 ? 150 : 190, fontWeight: 800, lineHeight: 0.86, letterSpacing: '-0.05em' }, name),
      role ? h('div', { display: 'flex', justifyContent: 'space-between', marginTop: 34, paddingTop: 14, borderTop: `2px solid ${INK}`, fontSize: 32, fontWeight: 700 }, [h('div', {}, role), h('div', {}, year ?? '')]) : h('div', {}, ''),
    ]),
  ]);
}

await mkdir(new URL('../public/og/', import.meta.url), { recursive: true });
const cards = [{ id: 'home', name: 'Nash Carroll', role: 'Real-time web apps and XR tools', year: 'M.S. CS, UGA 2027' }, ...TAPES];
for (const page of cards) {
  const svg = await satori(card(page), { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  await writeFile(new URL(`../public/og/${page.id}.png`, import.meta.url), png);
  console.log(`public/og/${page.id}.png`);
}
