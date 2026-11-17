# Portfolio

Nash Carroll's portfolio: static pages on a Swiss grid, built by [Astro](https://astro.build) and hosted on
Cloudflare Pages. The site started as a three.js entertainment center of VHS tapes; that scene now lives on
the Making Of page.

## Develop

    npm install
    npm run dev

Needs Node 20.3 or newer. (Astro is pinned to version 5 for that reason; newer Astro needs Node 22.)

## Where things live

- `src/data/tapes.js`: the pages: names, roles and years for the home index, descriptions for search and
  link previews, and the label text and colors for the tapes on the 3D shelf
- `src/pages/{id}.astro`: each page's content; `index.astro` is the home page, `404.astro` the not-found page
- `src/layouts/Base.astro`: the `<head>`, top bar and footer every page shares
- `src/layouts/Page.astro`: a content page: title, facts, lede, sections, Next link
- `src/styles/global.css`: all styling; colors, font and spacing are the variables at the top (see `DESIGN.md`)
- `src/data/eggs.js`: the personal notes (the home page's "Off the clock" and the objects on the 3D shelf)
- `src/scene/`: the 3D shelf; `src/scripts/shelf.js` loads it on the Making Of page
- `src/scripts/app.js`: the footer's "now playing" line
- `public/demos/scoreplus/`: standalone ScorePlus simulator (also embedded on its page)
- `public/resume.pdf`: drop your resume here

### Add a project

1. Add an entry to `src/data/tapes.js` with `work: true`, a `role`, a `year` and a one-line `summary`.
2. Create `src/pages/{id}.astro` (copy `cinja.astro`).
3. Run `npm run og` to draw its link-preview image.

The home index, the Next links and the tapes on the 3D shelf all follow `tapes.js`.

## Link previews

`npm run og` draws one preview image per page into `public/og/` (commit them). For previews to work on
LinkedIn, Slack and the like, the build needs the site's public address: set a `SITE_URL` build variable
in Cloudflare (for example `https://your-domain.com`), or put it in `astro.config.mjs`.

## Deploy (Cloudflare Pages)

The site is a Cloudflare Pages project connected to this repo: every push to `main` deploys to production,
and every other branch gets a preview URL. Pages serves `dist/` as static files (`404.html` for unknown
addresses, `public/_headers` for headers) and runs `functions/api/now-playing.js` as `/api/now-playing`.

Project settings (Workers & Pages → your project → Settings → Build):

- Framework preset: Astro (or None)
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Environment variable: `SITE_URL` (see Link previews)

Node comes from `.node-version`. CLI alternative: `npm run build && npx wrangler pages deploy`.

Links from the first version (`/#/scoreplus`) redirect to the matching page.

## Spotify "now playing" (the footer line and the mixtape on the 3D shelf)

`functions/api/now-playing.js` needs three secrets: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`,
`SPOTIFY_REFRESH_TOKEN`.

1. Create an app at https://developer.spotify.com/dashboard with the redirect URI
   `http://127.0.0.1:8888/callback` and the Web API enabled.
2. `cp .dev.vars.example .dev.vars` and fill in the client ID and secret.
3. `npm run spotify:auth` and approve in the browser. This writes the refresh token to `.dev.vars`.
4. `npm run preview:cf` runs the site and the function at http://localhost:8788.
5. In Cloudflare: the Pages project → Settings → **Variables and Secrets** → add all three as secrets
   (type "Secret") for Production, then redeploy.

`.dev.vars` is gitignored. Never commit it.
