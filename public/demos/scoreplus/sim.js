// ScorePlus demo: a browser-only recreation of the operator panel driving a simulated LED board.
// Nothing here talks to a server; "updates sent" are logged instead of written to a TCP socket.

const COLS = 160, ROWS = 64, PITCH = 6;
const AMBER = '#ffb020', RED = '#ff4b2b', WHITE = '#f2f2f2';
const SPORTS = {
  Football: { period: 'QTR', periods: 4, clock: 15 * 60, dir: 'down' },
  Soccer: { period: 'HALF', periods: 2, clock: 0, dir: 'up' },
  Basketball: { period: 'QTR', periods: 4, clock: 8 * 60, dir: 'down' },
  XC: { period: null, periods: 0, clock: 0, dir: 'up' },
};

const $ = (s) => document.querySelector(s);
const STORE = 'scoreplus-demo-state';

const defaults = () => ({
  sport: 'Football',
  home: { name: 'TIGERS', color: '#f5a524', score: 0 },
  away: { name: 'EAGLES', color: '#3e8ed0', score: 0 },
  period: 1,
  dir: 'down',
  clockMs: 15 * 60 * 1000,
});

let state = defaults();
try {
  const saved = JSON.parse(localStorage.getItem(STORE));
  if (saved) state = { ...state, ...saved };
} catch {}

let running = false;
let runStart = 0;   // performance.now() when the clock was started
let runBase = 0;    // clockMs at that moment
let hornUntil = 0;
let dirty = true;

function persist() {
  try { localStorage.setItem(STORE, JSON.stringify({ ...state, clockMs: currentMs() })); } catch {}
}

// ---------- clock ----------
function currentMs() {
  if (!running) return state.clockMs;
  const elapsed = performance.now() - runStart;
  return state.dir === 'down' ? Math.max(0, runBase - elapsed) : runBase + elapsed;
}

function formatClock(ms) {
  const tenths = Math.floor(ms / 100) % 10;
  if (state.sport === 'XC') {
    const s = Math.floor(ms / 1000);
    return `${pad(Math.floor(s / 60))}:${pad(s % 60)}.${tenths}`;
  }
  if (state.dir === 'down' && ms < 60_000) {
    return `${Math.floor(ms / 1000)}.${tenths}`.padStart(4, ' ');
  }
  const s = state.dir === 'down' ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
const pad = (n) => String(n).padStart(2, '0');

function parseClock(str) {
  const m = str.trim().match(/^(\d{1,3})(?::(\d{1,2}))?$/);
  if (!m) return null;
  return m[2] === undefined ? Number(m[1]) * 1000 : (Number(m[1]) * 60 + Number(m[2])) * 1000;
}

function startClock() {
  if (running) return;
  runBase = state.clockMs;
  runStart = performance.now();
  running = true;
  send('clock.run', 'START');
}
function stopClock() {
  if (!running) return;
  state.clockMs = currentMs();
  running = false;
  send('clock.run', `STOP @ ${formatClock(state.clockMs).trim()}`);
  persist();
}

// ---------- LED board ----------
const board = $('#board');
const g = board.getContext('2d');
const off = Object.assign(document.createElement('canvas'), { width: COLS, height: ROWS });
const og = off.getContext('2d', { willReadFrequently: true });

const unlit = Object.assign(document.createElement('canvas'), { width: board.width, height: board.height });
{
  const u = unlit.getContext('2d');
  u.fillStyle = '#050505';
  u.fillRect(0, 0, unlit.width, unlit.height);
  u.fillStyle = '#161616';
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      u.beginPath();
      u.arc(x * PITCH + PITCH / 2, y * PITCH + PITCH / 2, PITCH * 0.36, 0, Math.PI * 2);
      u.fill();
    }
}

function text(str, x, y, size, color, align = 'left') {
  og.font = `${size}px "Press Start 2P"`;
  og.textAlign = align;
  og.textBaseline = 'top';
  og.fillStyle = color;
  og.fillText(str, x, y);
}

function composeBoard(now) {
  og.clearRect(0, 0, COLS, ROWS);
  const ms = currentMs();
  const sport = SPORTS[state.sport];

  if (state.sport === 'XC') {
    text('CROSS COUNTRY', 80, 2, 8, AMBER, 'center');
    text('RUNNING TIME', 80, 16, 8, WHITE, 'center');
    text(formatClock(ms), 80, 30, 16, RED, 'center');
    text(state.home.name, 80, 54, 8, state.home.color, 'center');
  } else {
    text(state.home.name, 1, 1, 8, state.home.color);
    text(state.away.name, 159, 1, 8, state.away.color, 'right');
    text(String(state.home.score), 40, 13, 24, AMBER, 'center');
    text(String(state.away.score), 120, 13, 24, AMBER, 'center');
    text(formatClock(ms), 80, 44, 16, RED, 'center');
    text(sport.period, 1, 44, 8, WHITE);
    text(String(state.period), 1, 54, 8, AMBER);
    if (running && Math.floor(now / 500) % 2) {
      og.fillStyle = RED;
      og.fillRect(154, 56, 4, 4);
    }
  }

  if (now < hornUntil && Math.floor(now / 125) % 2) {
    og.strokeStyle = RED;
    og.lineWidth = 1;
    og.strokeRect(0.5, 0.5, COLS - 1, ROWS - 1);
  }
}

function renderBoard(now) {
  composeBoard(now);
  const px = og.getImageData(0, 0, COLS, ROWS).data;

  g.drawImage(unlit, 0, 0);
  // Soft bloom: the low-res frame scaled up and blurred under the dots.
  g.save();
  g.imageSmoothingEnabled = true;
  g.filter = 'blur(10px)';
  g.globalAlpha = 0.55;
  g.drawImage(off, 0, 0, board.width, board.height);
  g.restore();

  const r = PITCH * 0.4;
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const i = (y * COLS + x) * 4;
      if (px[i + 3] < 110) continue;
      g.fillStyle = `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`;
      g.beginPath();
      g.arc(x * PITCH + PITCH / 2, y * PITCH + PITCH / 2, r, 0, Math.PI * 2);
      g.fill();
    }
}

let lastDraw = 0;
function frame(now) {
  if (running && state.dir === 'down' && currentMs() === 0) {
    stopClock();
    horn();
  }
  if (dirty || running || now < hornUntil + 200 || now - lastDraw > 500) {
    renderBoard(now);
    lastDraw = now;
    dirty = false;
  }
  requestAnimationFrame(frame);
}

// ---------- log ----------
const logEl = $('#log');
function send(field, value) {
  const li = document.createElement('li');
  const t = new Date().toLocaleTimeString([], { hour12: false });
  li.innerHTML = `${t} → <b></b> `;
  li.querySelector('b').textContent = field;
  li.append(String(value));
  logEl.prepend(li);
  while (logEl.children.length > 40) logEl.lastChild.remove();
  dirty = true;
}

// ---------- UI ----------
function syncUI() {
  const sport = SPORTS[state.sport];
  $(`input[name=sport][value="${state.sport}"]`).checked = true;
  $('#homeName').value = state.home.name;
  $('#awayName').value = state.away.name;
  $('#homeColor').value = state.home.color;
  $('#awayColor').value = state.away.color;
  $('#homeLegend').textContent = state.home.name;
  $('#awayLegend').textContent = state.away.name;
  $('#homeScore').value = state.home.score;
  $('#awayScore').value = state.away.score;
  $(`input[name=dir][value="${state.dir}"]`).checked = true;
  $('#periodSet').hidden = !sport.period;
  $('#periodLegend').textContent = sport.period === 'HALF' ? 'Half' : 'Quarter';
  document.querySelectorAll('input[name=period]').forEach((r) => {
    r.parentElement.hidden = Number(r.value) > sport.periods;
    r.checked = Number(r.value) === state.period;
  });
  $('.scores').hidden = state.sport === 'XC';
  $('#clockInput').value = formatClock(state.clockMs).trim().replace(/\.\d$/, '');
  dirty = true;
}

document.querySelectorAll('[role=tab]').forEach((tab) =>
  tab.addEventListener('click', () => {
    document.querySelectorAll('[role=tab]').forEach((t) => t.setAttribute('aria-selected', t === tab));
    document.querySelectorAll('.tab').forEach((p) => (p.hidden = p.id !== `tab-${tab.dataset.tab}`));
  }),
);

$('#save').addEventListener('click', () => {
  const sport = document.querySelector('input[name=sport]:checked').value;
  if (sport !== state.sport) {
    stopClock();
    const cfg = SPORTS[sport];
    Object.assign(state, { sport, dir: cfg.dir, clockMs: cfg.clock * 1000, period: 1 });
    send('sport', sport);
  }
  for (const side of ['home', 'away']) {
    const name = $(`#${side}Name`).value.trim().toUpperCase().slice(0, 9) || side.toUpperCase();
    const color = $(`#${side}Color`).value;
    if (name !== state[side].name) send(`${side}.name`, name);
    if (color !== state[side].color) send(`${side}.color`, color);
    Object.assign(state[side], { name, color });
  }
  persist();
  syncUI();
});

$('#resetGame').addEventListener('click', () => {
  running = false;
  const { sport, home, away } = state;
  const cfg = SPORTS[sport];
  state = { ...defaults(), sport, dir: cfg.dir, clockMs: cfg.clock * 1000 };
  state.home = { ...home, score: 0 };
  state.away = { ...away, score: 0 };
  send('game', 'RESET');
  persist();
  syncUI();
});

document.querySelectorAll('.score').forEach((fs) => {
  const side = fs.dataset.side;
  fs.addEventListener('click', (e) => {
    const d = Number(e.target.dataset?.d);
    if (!d) return;
    addScore(side, d);
  });
});
function addScore(side, d) {
  state[side].score = Math.min(999, Math.max(0, state[side].score + d));
  $(`#${side}Score`).value = state[side].score;
  send(`${side}.score`, state[side].score);
  persist();
}

$('#period').addEventListener('change', (e) => {
  state.period = Number(e.target.value);
  send('period', state.period);
  persist();
});
$('#direction').addEventListener('change', (e) => {
  state.clockMs = currentMs();
  if (running) { runBase = state.clockMs; runStart = performance.now(); }
  state.dir = e.target.value;
  send('clock.dir', state.dir.toUpperCase());
  persist();
});

$('#setClock').addEventListener('click', () => {
  const ms = parseClock($('#clockInput').value);
  if (ms === null) {
    $('#clockInput').setCustomValidity('Use mm:ss');
    $('#clockInput').reportValidity();
    return;
  }
  $('#clockInput').setCustomValidity('');
  const wasRunning = running;
  running = false;
  state.clockMs = ms;
  send('clock.set', formatClock(ms).trim());
  if (wasRunning) startClock();
  persist();
});
$('#clockInput').addEventListener('keydown', (e) => e.key === 'Enter' && $('#setClock').click());
$('#start').addEventListener('click', startClock);
$('#stop').addEventListener('click', stopClock);
$('#horn').addEventListener('click', horn);
function horn() {
  hornUntil = performance.now() + 1500;
  send('horn', 'ON');
}

// "Simulate a game": scores plausible points for the current sport every couple of seconds.
let autoTimer = 0;
$('#autoplay').addEventListener('click', (e) => {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = 0;
    e.target.textContent = '▶ Simulate a game';
    return;
  }
  e.target.textContent = '■ Stop simulation';
  startClock();
  autoTimer = setInterval(() => {
    if (state.sport === 'XC') return;
    const side = Math.random() < 0.5 ? 'home' : 'away';
    const pts = { Football: [3, 6, 7], Soccer: [1], Basketball: [2, 2, 3, 1] }[state.sport];
    if (state.sport === 'Soccer' && Math.random() < 0.7) return;
    addScore(side, pts[Math.floor(Math.random() * pts.length)]);
  }, 1800);
});

addEventListener('pagehide', persist);

await document.fonts.load('8px "Press Start 2P"');
syncUI();
send('connect', 'scoreboard @ 192.168.1.50 (simulated)');
requestAnimationFrame(frame);
