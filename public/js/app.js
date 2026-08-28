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

  /* ── Navbar collapse ─────────────────────────────────────────
     This was Bootstrap's Collapse plugin, which cost 23.7 KB gzipped on every
     page to drive one control. It is a class swap plus a height transition, so
     it lives here instead. The CSS is unchanged: the custom Bootstrap build
     still ships .collapse / .collapsing / .show, and this drives exactly those.

     Delegated from document so it survives every client-side page swap without
     rebinding, and written against whatever #id the toggler names rather than
     assuming the navbar's.

     One deliberate difference from Bootstrap: Escape closes the menu. A
     full-width opaque panel over the page wants a keyboard way out. */
  const COLLAPSE_MS = 350;   // must match .collapsing's transition in the CSS

  function reduceMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* The open height is capped by the CSS (70svh below lg) so the panel can
     never run off a phone in landscape. Animating to the full scrollHeight
     would overshoot that cap and snap back, so clamp to whichever is smaller. */
  function openHeight(el) {
    const cap = parseFloat(getComputedStyle(el).maxHeight);
    const want = el.scrollHeight;
    return Number.isFinite(cap) ? Math.min(want, cap) : want;
  }

  function setExpanded(target, open) {
    document
      .querySelectorAll(`[data-nav-toggle="#${target.id}"]`)
      .forEach((btn) => btn.setAttribute('aria-expanded', open ? 'true' : 'false'));
  }

  function openCollapse(el) {
    if (el.dataset.animating || el.classList.contains('show')) return;
    setExpanded(el, true);
    if (reduceMotion()) { el.classList.add('show'); return; }
    el.dataset.animating = '1';
    el.classList.add('collapsing');
    el.style.height = '0px';
    void el.offsetHeight;                 // commit the start value before changing it
    el.style.height = openHeight(el) + 'px';
    setTimeout(() => {
      el.classList.remove('collapsing');
      el.classList.add('show');
      el.style.height = '';
      delete el.dataset.animating;
    }, COLLAPSE_MS);
  }

  function closeCollapse(el) {
    if (el.dataset.animating || !el.classList.contains('show')) return;
    setExpanded(el, false);
    if (reduceMotion()) { el.classList.remove('show'); return; }
    el.dataset.animating = '1';
    el.style.height = el.getBoundingClientRect().height + 'px';
    void el.offsetHeight;
    el.classList.add('collapsing');
    el.classList.remove('show');
    el.style.height = '0px';
    setTimeout(() => {
      el.classList.remove('collapsing');
      el.style.height = '';
      delete el.dataset.animating;
    }, COLLAPSE_MS);
  }

  /* Exposed on the module scope so the anchor handler further down can close
     the menu without re-querying the toggler. */
  function collapseTargetOf(btn) {
    return document.querySelector(btn.dataset.navToggle);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('[data-nav-toggle]');
    if (!btn) return;
    const target = collapseTargetOf(btn);
    if (!target) return;
    e.preventDefault();
    if (target.classList.contains('show')) closeCollapse(target);
    else openCollapse(target);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('[data-nav-toggle]').forEach((btn) => {
      const target = collapseTargetOf(btn);
      if (target && target.classList.contains('show')) {
        closeCollapse(target);
        btn.focus();
      }
    });
  });

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
    if (storedTheme() === null) {
      window.dispatchEvent(new CustomEvent('hqm:themechange', {
        detail: { theme: activeTheme() },
      }));
    }
    /* The state name did not change, but "switch to ..." did: the next press
       offers the opposite of what is now on screen. */
    labelToggles();
  });

  /* Local development only. The cycle back to "follow the device" is a
     developer affordance, not a visitor one: once a visitor has stored a
     choice, that choice sticks until they clear site data, so the half-disc
     never returns on the live site. Served from a dev host, the third step is
     kept so the default state can be reached again without wiping storage. */
  function devHost() {
    const h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1'
      || h === '' || h.endsWith('.local');
  }

  /* The stored choice, or null for "no choice stored" -- which is the same
     thing as "follows the device", and is what the absence of data-theme on
     <html> means. Anything unrecognised in storage counts as no choice. */
  function storedTheme() {
    let v = null;
    try { v = localStorage.getItem('hqm-theme'); } catch (e) { /* ignore */ }
    return (v === 'light' || v === 'dark') ? v : null;
  }

  /* Where the next press lands. One function, because the click handler and
     the label writer have to agree; two copies of this drifted apart once. */
  function nextTheme() {
    const stored = storedTheme();

    /* First press from the default: the OPPOSITE of what is on screen. A fixed
       "always light first" order does nothing at all on a light-OS machine, and
       a theme button that appears dead on the first press is worse than none. */
    if (stored === null) return activeTheme() === 'dark' ? 'light' : 'dark';

    const other = stored === 'light' ? 'dark' : 'light';

    /* Live site: two states from here on. Dev: the stored value having caught
       up with what the device says is the end of the long way round, so that is
       where the cycle returns to following the device. */
    if (!devHost()) return other;
    return stored === systemTheme() ? null : other;
  }

  /* What the device itself asks for, ignoring any stored choice. */
  function systemTheme() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  /* The glyph alone cannot carry three states to a general visitor -- an
     adaptive-theme icon is not common knowledge -- so the state is named in
     words on both the tooltip and the accessible name, and the label also says
     what the next press does. Written on init as well as on click, because the
     stored value is not knowable at build time and the static markup can only
     describe the control in general. */
  function labelToggles() {
    const stored = storedTheme();
    const next = nextTheme();

    const nameOf = (v) => (v === null ? 'follows your device' : v);
    const now = nameOf(stored);
    const then = nameOf(next);

    document.querySelectorAll('.theme-toggle').forEach((b) => {
      b.title = 'Theme: ' + now;
      b.setAttribute('aria-label', 'Theme: ' + now + '. Switch to ' + then + '.');
    });
  }

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

    /* Theme control. No stored value means "follow the device", which is the
       default, is what the half-disc glyph shows, and is handled entirely in
       CSS. The first press leaves it for the OPPOSITE of what is on screen, so
       the press is always visible whichever way the device is set.

       On the live site that first press is one-way: a stored choice is a choice,
       and it holds until the visitor clears site data. From then on the control
       is a plain two-state toggle and the half-disc does not come back.

       In local development the third step survives -- once the stored value has
       caught up with what the device itself says, the next press clears it --
       so the default state is reachable again without wiping storage. See
       nextTheme() and devHost(); the branch lives there, not here.

       There are TWO toggles in the DOM -- one in the bar for below-lg, one in
       the nav list for lg and up -- so this binds by class, not by id. Both
       read the live state, so neither can drift from the other. */
    document.querySelectorAll('.theme-toggle').forEach((themeBtn) => {
      themeBtn.addEventListener('click', () => {
        const next = nextTheme();

        if (next === null) {
          document.documentElement.removeAttribute('data-theme');
          try { localStorage.removeItem('hqm-theme'); } catch (e) { /* ignore */ }
        } else {
          document.documentElement.setAttribute('data-theme', next);
          try {
            localStorage.setItem('hqm-theme', next);
          } catch (e) { /* storage unavailable; the attribute still applies */ }
        }

        labelToggles();
        // Let the starfield recolour itself for the new ground.
        window.dispatchEvent(new CustomEvent('hqm:themechange', { detail: { theme: activeTheme() } }));
      });
    });

    labelToggles();

    /* Active nav link — read the page key the layout stamped on <body>.
       Deriving it from the URL instead breaks on clean URLs: '/contact/'
       ends in a slash, so split('/').pop() returns '' and every page
       resolves to 'home'. */
    const page = document.body.dataset.page || 'home';
    document.querySelectorAll('[data-nav]').forEach((link) => {
      if (link.getAttribute('data-nav') !== page) return;
      link.classList.add('active');
      /* A submenu child marks its parent too, so "you are in Cosmos" still
         reads on the bar while the panel is shut and the child link is not
         even on screen. */
      const parentItem = link.closest('.nav-has-sub');
      if (parentItem && !link.classList.contains('nav-sub-link')) return;
      const parentLink = parentItem && parentItem.querySelector('.nav-sub-row > .nav-link');
      if (parentLink) parentLink.classList.add('active');
    });

    /* Nav submenu disclosure. Only at lg and up: below that the panel is not a
       panel -- CSS leaves the child list open in the collapse menu and hides
       this button -- so binding a toggle there would drive an aria-expanded
       that describes nothing a visitor can see. */
    const wideNav = window.matchMedia('(min-width: 992px)');

    function closeSubmenus(except) {
      document.querySelectorAll('.nav-has-sub.open').forEach((item) => {
        if (item === except) return;
        item.classList.remove('open');
        const btn = item.querySelector('.nav-sub-toggle');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }

    document.querySelectorAll('.nav-sub-toggle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (!wideNav.matches) return;
        e.preventDefault();
        const item = btn.closest('.nav-has-sub');
        if (!item) return;
        const open = !item.classList.contains('open');
        closeSubmenus(item);
        item.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });

    /* Shut on a click anywhere else, on Escape, and whenever the width crosses
       back below lg -- an open panel left behind by a resize would be a
       floating box over a collapse menu that no longer has a button to shut
       it. Escape returns focus to the button that opened it, which is the
       whole reason a disclosure is a button and not a hover. */
    document.addEventListener('click', (e) => {
      if (!e.target.closest || !e.target.closest('.nav-has-sub')) closeSubmenus(null);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = document.querySelector('.nav-has-sub.open');
      if (!open) return;
      closeSubmenus(null);
      const btn = open.querySelector('.nav-sub-toggle');
      if (btn) btn.focus();
    });
    wideNav.addEventListener('change', () => closeSubmenus(null));

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
        if (collapse) closeCollapse(collapse);

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
