import { defineConfig } from 'astro/config';

// SITE_URL is the public address, e.g. https://nashcarroll.dev. Link previews (Open Graph) need it to
// build absolute image URLs; set it as a build variable in Cloudflare, or replace the fallback here.
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'never' },
  // three.js is one large file by nature; it is loaded on demand, after the page.
  vite: { build: { target: 'es2022', chunkSizeWarningLimit: 700 } },
});
