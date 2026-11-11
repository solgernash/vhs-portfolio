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

## Deploy (Cloudflare Pages)

Connect the repo in Cloudflare Pages, or deploy from the CLI:

- Build command: `npm run build`
- Output directory: `dist`

CLI alternative: `npm run build && npx wrangler pages deploy dist`

## Spotify "now playing" (the mixtape on the left shelf)

`functions/api/now-playing.js` is a Cloudflare Pages Function. It needs three secrets:
`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`.

1. Create an app at https://developer.spotify.com/dashboard with the redirect URI
   `http://127.0.0.1:8888/callback` and the Web API enabled.
2. `cp .dev.vars.example .dev.vars` and fill in the client ID and secret.
3. `npm run spotify:auth` and approve in the browser. This writes the refresh token to `.dev.vars`.
4. `npm run preview:cf` runs the site with the function at http://localhost:8788.
5. In Cloudflare: Pages project → Settings → Variables and Secrets → add all three as secrets, then redeploy.

`.dev.vars` is gitignored. Never commit it.
