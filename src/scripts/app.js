// Runs on every page. The pages are complete as plain HTML; this only adds the "now playing" line to
// the footer, from the Spotify mixtape Worker (worker/index.js). Without the Worker it stays hidden.

const line = document.getElementById('now-playing');
const CACHE_KEY = 'now-playing';
const CACHE_MS = 60_000;

function ago(iso) {
  const min = Math.round((Date.now() - new Date(iso)) / 60000);
  if (min < 60) return `${Math.max(min, 1)} min ago`;
  if (min < 60 * 24) return `${Math.round(min / 60)} h ago`;
  return `${Math.round(min / 1440)} days ago`;
}

async function nowPlaying() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null');
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
  } catch {}
  const res = await fetch('/api/now-playing');
  if (!res.ok) return null;
  const data = await res.json();
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {}
  return data;
}

if (line) {
  nowPlaying()
    .then((data) => {
      if (!data?.title) return;
      const when = data.playing ? 'Listening right now' : `Last played${data.playedAt ? ` ${ago(data.playedAt)}` : ''}`;
      const song = document.createElement(data.url ? 'a' : 'span');
      song.textContent = `${data.title} — ${data.artist}`;
      if (data.url) Object.assign(song, { href: data.url, target: '_blank', rel: 'noopener' });
      line.replaceChildren(`${when}: `, song);
      line.hidden = false;
    })
    .catch(() => {});
}
