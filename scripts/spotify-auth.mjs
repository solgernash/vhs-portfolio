// One-time setup: connects your Spotify account and saves a refresh token for /api/now-playing.
//
// 1. Put SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .dev.vars (copy .dev.vars.example).
// 2. Run `npm run spotify:auth`, approve in the browser, and the token is written to .dev.vars.
//
// The token only grants read access to what you're playing and recently played.
import http from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { exec } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const VARS = new URL('../.dev.vars', import.meta.url);
const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = 'user-read-currently-playing user-read-recently-played';

const vars = readVars();
if (!vars.SPOTIFY_CLIENT_ID || !vars.SPOTIFY_CLIENT_SECRET) {
  console.error('Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .dev.vars first (copy .dev.vars.example).');
  process.exit(1);
}

const state = randomBytes(12).toString('hex');
const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
  response_type: 'code',
  client_id: vars.SPOTIFY_CLIENT_ID,
  scope: SCOPES,
  redirect_uri: REDIRECT_URI,
  state,
})}`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== '/callback') return res.writeHead(404).end();

  const code = url.searchParams.get('code');
  if (url.searchParams.get('state') !== state || !code) {
    res.writeHead(400).end(`Authorization failed: ${url.searchParams.get('error') ?? 'state mismatch'}`);
    return finish(1);
  }

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${vars.SPOTIFY_CLIENT_ID}:${vars.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI }),
  });
  const data = await tokenRes.json();
  if (!tokenRes.ok || !data.refresh_token) {
    console.error('Token exchange failed:', data);
    res.end('Token exchange failed. Check the terminal.');
    return finish(1);
  }

  vars.SPOTIFY_REFRESH_TOKEN = data.refresh_token;
  writeVars(vars);
  res.end('Connected! The refresh token is saved in .dev.vars. You can close this tab.');
  console.log('Saved SPOTIFY_REFRESH_TOKEN to .dev.vars.');
  finish(0);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Opening Spotify to authorize. If nothing opens, visit:\n\n${authUrl}\n`);
  const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
  exec(`${open} "${authUrl}"`);
});

function finish(code) {
  server.close();
  process.exitCode = code;
}

function readVars() {
  if (!existsSync(VARS)) return {};
  return Object.fromEntries(
    readFileSync(VARS, 'utf8')
      .split('\n')
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/))
      .filter(Boolean)
      .map(([, k, v]) => [k, v]),
  );
}

function writeVars(obj) {
  writeFileSync(VARS, Object.entries(obj).map(([k, v]) => `${k}="${v}"`).join('\n') + '\n');
}
