// Cloudflare Pages Function: GET /api/now-playing
// Returns what's playing on Spotify right now, or the last track played.
// Needs SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN
// (locally in .dev.vars, in production as Cloudflare secrets; see scripts/spotify-auth.mjs).

const CACHE_SECONDS = 30;

export async function onRequestGet({ request, env, waitUntil }) {
  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/now-playing', request.url));
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let body;
  try {
    body = await lookup(env);
  } catch (err) {
    console.error('now-playing failed:', err.message);
    return json({ error: 'unavailable' }, 502, 0);
  }
  const res = json(body, 200, CACHE_SECONDS);
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

async function lookup(env) {
  const headers = { Authorization: `Bearer ${await accessToken(env)}` };

  const now = await fetch('https://api.spotify.com/v1/me/player/currently-playing?additional_types=episode', { headers });
  if (now.status === 200) {
    const data = await now.json();
    if (data?.is_playing && data.item) return { playing: true, ...describe(data.item) };
  } else if (now.status !== 204) {
    throw new Error(`currently-playing ${now.status}`);
  }

  const recent = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', { headers });
  if (!recent.ok) throw new Error(`recently-played ${recent.status}`);
  const item = (await recent.json()).items?.[0];
  return item ? { playing: false, playedAt: item.played_at, ...describe(item.track) } : { playing: false };
}

// Tracks have album art and artists; podcast episodes have images and a show.
function describe(item) {
  const images = item.album?.images ?? item.images ?? [];
  return {
    title: item.name,
    artist: item.artists?.map((a) => a.name).join(', ') || item.show?.name || '',
    url: item.external_urls?.spotify ?? null,
    art: (images.find((i) => i.width <= 300) ?? images[0])?.url ?? null,
  };
}

async function accessToken(env) {
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refresh } = env;
  if (!id || !secret || !refresh) throw new Error('missing Spotify secrets');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  return (await res.json()).access_token;
}

function json(body, status, maxAge) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': maxAge ? `public, max-age=${maxAge}` : 'no-store',
    },
  });
}
