// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The local device harness (tools/devview.html), served at /devview.
//
// `apply: 'serve'` is load-bearing: the harness exists only while the dev
// server is running and is invisible to `astro build`, so it can never leak
// into dist/ or onto the public site. It is served rather than opened over
// file:// so that it is SAME-ORIGIN with the pages it frames -- that is what
// lets it force a theme, measure each frame's overflow and tap targets, and
// catch script errors. A cross-origin harness could only take pictures.
//
// The file is read per request, so editing the harness needs no restart.
const devview = {
  name: 'hqm-devview',
  apply: 'serve',
  configureServer(server) {
    // Registered outside the returned-callback form on purpose: that form
    // installs after Astro's own middleware, which would 404 /devview first.
    server.middlewares.use((req, res, next) => {
      const path = (req.url || '').split('?')[0];

      // The device table, shared with tools/responsive-audit.mjs. The harness
      // imports it as a module rather than carrying its own copy -- one table,
      // or the two halves of the kit drift apart and start disagreeing.
      if (path === '/devview/devices.mjs') {
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(readFileSync(new URL('./tools/devices.mjs', import.meta.url), 'utf8'));
        return;
      }

      if (path !== '/devview' && path !== '/devview/') return next();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(readFileSync(new URL('./tools/devview.html', import.meta.url), 'utf8'));
    });
  },
};

export default defineConfig({
  site: 'https://hyperquantmedia.com',
  // The 404 page is served, never indexed; keep it out of the sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],

  // Hovering a link starts fetching the destination, so by the time the
  // reader clicks, the warp lands on a page that is already here. Pages are
  // static HTML measured in tens of kilobytes; prefetching all of them is
  // cheaper than one image.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  // URL management lives here and in src/data/site.js.
  //
  // Only the legacy paths from the previous site are declared here. In a static build Astro
  // materialises each redirect as a real file, so a '/index.html' entry would
  // try to create dist/index.html/ as a directory and collide with the actual
  // homepage. The old hand-written .html URLs are therefore handled solely by
  // public/_redirects at the host level -- no loss, since that version of the
  // site was never published.
  //
  // Note these emit meta-refresh pages, not 301s. public/_redirects carries
  // the real 301s on Cloudflare Pages / Netlify; these are the fallback for
  // hosts that ignore that file, such as GitHub Pages.
  redirects: {
    '/solutions': '/services',
    '/get-started': '/contact',
    '/home': '/',
    // Ecosystem was renamed to Cosmos.
    '/ecosystem': '/cosmos',
    // The Star Chart moved to /credits, which is what the navbar has always
    // called it. The old path was public for a matter of hours, but a URL
    // that shipped is a URL that has to keep working.
    '/titles': '/credits',
  },

  build: {
    // Emit /services/index.html rather than /services.html so clean URLs work
    // on any static host without server-side rewriting.
    format: 'directory',
  },

  vite: { plugins: [devview] },
});
