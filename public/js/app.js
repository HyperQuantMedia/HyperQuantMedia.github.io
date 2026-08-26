/* HyperQuant Media — site interactions (all pages)

   The site navigates client-side (Astro's ClientRouter), so this script
   loads once and then lives across every page. That splits the work in two:

     - bind ONCE: listeners on window/document, which survive navigation
     - bind PER PAGE: everything touching elements inside <body>, which are
       replaced on every swap

   Per-page setup runs on `astro:page-load`, which fires on the initial load
   and after every navigation. A DOMContentLoaded fallback covers the case
   where the router fails to boot; the body-dataset guard keeps the two from
   double-binding the same DOM. */
(function () {
  'use strict';

  /* Element refs, refreshed on every page swap. The once-bound scroll
     handler reads these rather than re-querying per frame. */
  let nav = null;
  let toTop = null;
  let progress = null;

  /* ── Bound once ─────────────────────────────────────────────── */

  /* Navbar solid state, back-to-top visibility, and the reading-progress
     hairline all ride one rAF-throttled scroll handler. */
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 60);
    if (toTop) toTop.classList.toggle('visible', y > 600);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* Pointer spotlight on cards: one delegated listener sets the pointer's
     position as CSS custom properties on whichever card it is over; the
     stylesheet draws the glow. Bound only on devices that actually hover. */
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest?.(
        '.service-card, .tool-card, .value-card, .principle-card, .project-card, .belief-block',
      );
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* Lite YouTube embeds: the page ships only a thumbnail and a play glyph;
     the iframe (privacy-enhanced youtube-nocookie host) is created on the
     first click. Sixteen eager iframes would wreck the page load; zero do. */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('.chart-video');
    if (!btn || btn.dataset.playing) return;
    btn.dataset.playing = '1';
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + btn.dataset.video
      + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    iframe.title = 'Trailer';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    btn.replaceChildren(iframe);
  });

  /* With no explicit choice stored, keep following the system if it changes
     mid-session. */
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    let stored = null;
    try { stored = localStorage.getItem('hqm-theme'); } catch (e) { /* ignore */ }
    if (stored !== 'light' && stored !== 'dark') {
      window.dispatchEvent(new CustomEvent('hqm:themechange', {
        detail: { theme: activeTheme() },
      }));
    }
  });

  function activeTheme() {
    const set = document.documentElement.getAttribute('data-theme');
    if (set === 'light' || set === 'dark') return set;
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  /* ── Bound per page ─────────────────────────────────────────── */

  function init() {
    /* The body is replaced on every navigation, so a fresh body means fresh
       bindings are needed; a marked one means init already ran here. */
    if (document.body.dataset.hqmInit) return;
    document.body.dataset.hqmInit = '1';

    nav = document.getElementById('mainNav');
    toTop = document.getElementById('toTop');
    progress = document.getElementById('scrollProgress');
    onScroll();

    if (toTop) {
      toTop.addEventListener('click', () => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    }

    /* Theme toggle.
       No stored value means "follow the system", which is the default and is
       handled entirely in CSS. Clicking stores an explicit choice, resolved
       against what is actually being displayed right now rather than against
       the stored value -- otherwise the first click from the system default
       can be a no-op. */
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const theme = activeTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        try {
          localStorage.setItem('hqm-theme', theme);
        } catch (e) { /* storage unavailable; the attribute still applies */ }
        // Let the starfield recolour itself for the new ground.
        window.dispatchEvent(new CustomEvent('hqm:themechange', { detail: { theme } }));
      });
    }

    /* Active nav link — read the page key the layout stamped on <body>.
       Deriving it from the URL instead breaks on clean URLs: '/contact/'
       ends in a slash, so split('/').pop() returns '' and every page
       resolves to 'home'. */
    const page = document.body.dataset.page || 'home';
    document.querySelectorAll('[data-nav]').forEach((link) => {
      if (link.getAttribute('data-nav') === page) link.classList.add('active');
    });

    /* Fade-in on scroll via IntersectionObserver */
    const fadeEls = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      fadeEls.forEach((el) => io.observe(el));
    } else {
      fadeEls.forEach((el) => el.classList.add('visible'));
    }

    /* Star Chart: platform filter. Cards carry data-platforms="A|B|C";
       clicking a button hides the cards that lack the platform and any year
       group left with nothing visible. */
    const filter = document.getElementById('titleFilter');
    if (filter) {
      filter.addEventListener('click', (e) => {
        const btn = e.target.closest('.chart-filter-btn');
        if (!btn) return;
        filter.querySelectorAll('.chart-filter-btn').forEach((b) =>
          b.classList.toggle('active', b === btn));
        const want = btn.dataset.platform;
        document.querySelectorAll('.chart-card').forEach((card) => {
          const has = want === 'all'
            || card.dataset.platforms.split('|').includes(want);
          card.classList.toggle('filtered-out', !has);
        });
        document.querySelectorAll('[data-chart-year]').forEach((group) => {
          const visible = group.querySelector('.chart-card:not(.filtered-out)');
          group.classList.toggle('filtered-out', !visible);
          // Keep the year rail in step: no group, no rail stop.
          const railLink = document.querySelector(
            `[data-rail-year="${group.id.replace(/^y-/, '')}"]`,
          );
          if (railLink) railLink.classList.toggle('filtered-out', !visible);
        });
      });
    }

    /* Year rail: highlight the year group nearest the top of the viewport
       as the reader scrolls. */
    const rail = document.getElementById('yearRail');
    if (rail && 'IntersectionObserver' in window) {
      const railLinks = new Map(
        [...rail.querySelectorAll('[data-rail-year]')].map((a) => [a.dataset.railYear, a]),
      );
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const year = entry.target.id.replace(/^y-/, '');
          railLinks.forEach((a, y) => a.classList.toggle('active', y === year));
        });
      }, { rootMargin: '-15% 0px -70% 0px' });
      document.querySelectorAll('[data-chart-year]').forEach((g) => spy.observe(g));
    }

    /* Compendium: kind filter plus live search. A card must pass BOTH the
       active kind and the query; groups and the empty-state line follow. */
    const compFilter = document.getElementById('compFilter');
    if (compFilter) {
      const search = document.getElementById('compSearch');
      const empty = document.getElementById('compEmpty');
      const apply = () => {
        const kind = compFilter.querySelector('.chart-filter-btn.active')?.dataset.kind || 'all';
        const q = (search?.value || '').trim().toLowerCase();
        let visible = 0;
        document.querySelectorAll('[data-comp-kind]').forEach((kd) => {
          const kindOn = kind === 'all' || kd.dataset.compKind === kind;
          kd.querySelectorAll('.comp-card').forEach((card) => {
            const hit = kindOn && (!q || card.dataset.search.includes(q));
            card.classList.toggle('filtered-out', !hit);
            if (hit) visible += 1;
          });
          kd.querySelectorAll('[data-comp-group]').forEach((g) => {
            g.classList.toggle('filtered-out', !g.querySelector('.comp-card:not(.filtered-out)'));
          });
        });
        if (empty) empty.hidden = visible > 0;
      };
      compFilter.addEventListener('click', (e) => {
        const btn = e.target.closest('.chart-filter-btn');
        if (!btn) return;
        compFilter.querySelectorAll('.chart-filter-btn').forEach((b) =>
          b.classList.toggle('active', b === btn));
        apply();
      });
      search?.addEventListener('input', apply);
    }

    /* Smooth scroll for in-page anchor links */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (!target) return;
        e.preventDefault();

        /* Close mobile nav if open */
        const collapse = document.getElementById('navbarNav');
        if (collapse && collapse.classList.contains('show')) {
          bootstrap.Collapse.getInstance(collapse)?.hide();
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  document.addEventListener('astro:page-load', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
