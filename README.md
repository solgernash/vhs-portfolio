# Portfolio

A three.js entertainment center: project tapes on the top shelf, a CRT and VCR in the middle, easter eggs on the side shelves. Click a tape to play that section.

## Develop

    npm install
    npm run dev

## Where things live

- `index.html`: the content of each tape, in `<template id="tape-{id}">` blocks
- `src/tapes.js`: tape labels, colors and order
- `src/eggs.js`: the side-shelf easter eggs and their sticky-note text
- `src/props.js`: the entertainment center, TV, VCR and prop models
- `src/main.js`: scene setup, clicking, and the insert/eject animations
- `public/demos/scoreplus/`: standalone ScorePlus simulator (also loaded in an iframe on its tape)
- `public/resume.pdf`: drop your resume here

Deep links: `/#/about`, `/#/scoreplus`, `/#/cinja`, `/#/resume`, `/#/contact` open that tape directly.

## Deploy (Cloudflare Worker)

The site is a Cloudflare Worker (`wrangler.jsonc`) that serves `dist/` and handles `/api/now-playing`
in `worker/index.js`. With Workers Builds connected to this repo, every push to `main` deploys.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

CLI alternative: `npm run build && npx wrangler deploy`

## Spotify "now playing" (the mixtape on the left shelf)

`worker/index.js` needs three secrets: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`.

1. Create an app at https://developer.spotify.com/dashboard with the redirect URI
   `http://127.0.0.1:8888/callback` and the Web API enabled.
2. `cp .dev.vars.example .dev.vars` and fill in the client ID and secret.
3. `npm run spotify:auth` and approve in the browser. This writes the refresh token to `.dev.vars`.
4. `npm run preview:cf` runs the site and the Worker at http://localhost:8787.
5. In Cloudflare: the Worker → Settings → **Variables and Secrets** (the runtime section, not the
   one under Builds) → add all three as secrets.

`.dev.vars` is gitignored. Never commit it.
