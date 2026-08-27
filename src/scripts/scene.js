/* Three.js starfield + constellation scene — HyperQuant Media
 *
 * Moved out of public/js/ and into the Astro build so `three` can be
 * tree-shaken: the prebuilt UMD bundle was 636 KB raw / 161 KB gzipped on every
 * page — 45% of the site's transfer — and this scene touches 15 of its symbols.
 * Importing them by name lets Vite drop the rest.
 *
 * It is also no longer in the document. Base.astro dynamically imports this
 * module on requestIdleCallback, after first paint, so none of it sits on the
 * critical path. That costs nothing visually: #siteCanvas starts at opacity 0
 * and fades in over 1.2s once this adds `.live`, and body::before paints a
 * static CSS star wash underneath until then.
 *
 * Imported for its side effects — the module builds the scene on evaluation.
 * The browser's module cache means a second import is a no-op, which is what
 * keeps the persisted canvas from getting a second render loop across
 * client-side navigations.
 *
 * Symbols used: AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, LineBasicMaterial, LineSegments, NormalBlending, PerspectiveCamera, Points, PointsMaterial, Scene, Sprite, SpriteMaterial, WebGLRenderer
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  LineBasicMaterial,
  LineSegments,
  NormalBlending,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Sprite,
  SpriteMaterial,
  WebGLRenderer,
} from 'three';

(function () {
  'use strict';

  const canvas = document.getElementById('siteCanvas');
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  // The field backs every page rather than one hero, so density scales
  // with the viewport instead of being a fixed count -- an ultrawide monitor
  // was getting the same 220 stars as a laptop and looked empty.
  const area = window.innerWidth * window.innerHeight;
  const STAR_COUNT = Math.round(
    Math.min(isMobile ? 120 : 260, Math.max(isMobile ? 90 : 170, area / 8200)),
  );
  const SPREAD_XY  = 480;
  const SPREAD_Z   = 240;
  const LINK_DIST  = 96;
  const MAX_LINES  = STAR_COUNT * 5;
  const BASE_FOV   = 55;

  /* Renderer */
  const renderer = new WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new Scene();
  const camera = new PerspectiveCamera(BASE_FOV, window.innerWidth / window.innerHeight, 0.1, 2400);
  camera.position.z = 560;

  /* An untextured PointsMaterial draws each point as a hard square, which is
     invisible at 2px but reads as a literal gold square on the 11px Polaris.
     A tiny radial-gradient sprite makes every point a soft round glow; white,
     so vertex/material colours tint it per star in either theme. */
  const starSprite = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new CanvasTexture(c);
  })();

  /* A four-point glint for the handful of bright "hero" stars. */
  const flareSprite = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const core = g.createRadialGradient(64, 64, 0, 64, 64, 20);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = core;
    g.fillRect(0, 0, 128, 128);
    // The cross: two long thin beams, vertical and horizontal.
    for (const rot of [0, Math.PI / 2]) {
      g.save();
      g.translate(64, 64);
      g.rotate(rot);
      const beam = g.createLinearGradient(-62, 0, 62, 0);
      beam.addColorStop(0, 'rgba(255,255,255,0)');
      beam.addColorStop(0.5, 'rgba(255,255,255,0.9)');
      beam.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = beam;
      g.fillRect(-62, -1.6, 124, 3.2);
      g.restore();
    }
    return new CanvasTexture(c);
  })();

  /* A soft irregular cloud: several offset radial gradients on one canvas.
     White, so each nebula sprite tints it with its own accent colour. */
  const nebulaTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    for (let i = 0; i < 9; i++) {
      const x = 70 + Math.random() * 116;
      const y = 70 + Math.random() * 116;
      const r = 34 + Math.random() * 58;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.22)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 256, 256);
    }
    return new CanvasTexture(c);
  })();

  /* Star positions, velocities, sizes */
  const posArr  = new Float32Array(STAR_COUNT * 3);
  const colArr  = new Float32Array(STAR_COUNT * 3);
  const vel     = new Float32Array(STAR_COUNT * 3);

  /* Stellar palette, per theme.
     On a near-white page an additively-blended white star is invisible --
     additive blending can only brighten, and the ground is already at
     maximum. Light mode therefore uses dark inks with normal blending, and
     the accents are the same darkened values the CSS uses so the hero matches
     the rest of the page. */
  const THEMES = {
    dark: {
      stars: [0xffffff, 0xffffff, 0xeef1ff, 0xffce6e, 0x57e1c4, 0xa98bff],
      accents: [0xffce6e, 0x57e1c4, 0xa98bff],
      polaris: 0xffce6e,
      polarisScale: 1,
      // Lines fade by mixing toward the ground; black is the dark-mode ground,
      // which makes the mix identical to a plain alpha multiply.
      ground: 0x000000,
      blending: AdditiveBlending,
      starOpacity: 0.9,
      lineOpacity: 0.4,
      rose: 0xf472b6,
      nebulaOpacity: 0.30,
      flareOpacity: 1.0,
    },
    light: {
      stars: [0x0c0e1a, 0x181c33, 0x23284a, 0x8a5a00, 0x0b7a66, 0x5b3bd6],
      accents: [0x8a5a00, 0x0b7a66, 0x5b3bd6],
      // Deeper than the UI's polaris ink and drawn smaller: at full size the
      // soft sprite reads as a brown smudge on the light ground, not a star.
      polaris: 0x6d4700,
      polarisScale: 0.6,
      ground: 0xf6f7fb,
      blending: NormalBlending,
      starOpacity: 0.75,
      lineOpacity: 0.5,
      rose: 0xb02a72,
      nebulaOpacity: 0.16,
      flareOpacity: 0.65,
    },
  };

  function currentTheme() {
    const set = document.documentElement.getAttribute('data-theme');
    if (set === 'light' || set === 'dark') return set;
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  let theme = THEMES[currentTheme()];
  const palette = theme.stars.map((h) => new Color(h));
  const groundCol = new Color(theme.ground);

  for (let i = 0; i < STAR_COUNT; i++) {
    const i3 = i * 3;
    posArr[i3]     = (Math.random() - 0.5) * SPREAD_XY * 2;
    posArr[i3 + 1] = (Math.random() - 0.5) * SPREAD_XY * 2;
    posArr[i3 + 2] = (Math.random() - 0.5) * SPREAD_Z  * 2;

    const drift = reduceMotion ? 0 : 1;
    vel[i3]     = (Math.random() - 0.5) * 0.18 * drift;
    vel[i3 + 1] = (Math.random() - 0.5) * 0.18 * drift;
    vel[i3 + 2] = (Math.random() - 0.5) * 0.06 * drift;

    const c = palette[(Math.random() * palette.length) | 0];
    colArr[i3] = c.r; colArr[i3 + 1] = c.g; colArr[i3 + 2] = c.b;
  }

  const starsGeo = new BufferGeometry();
  starsGeo.setAttribute('position', new BufferAttribute(posArr, 3));
  starsGeo.setAttribute('color',    new BufferAttribute(colArr, 3));

  const starsMat = new PointsMaterial({
    size: isMobile ? 2.6 : 3.2,
    map: starSprite,
    transparent: true,
    opacity: theme.starOpacity,
    vertexColors: true,
    sizeAttenuation: true,
    depthWrite: false,
  });
  scene.add(new Points(starsGeo, starsMat));

  /* Polaris — the bright anchor star */
  const polarisGeo = new BufferGeometry();
  polarisGeo.setAttribute('position', new BufferAttribute(new Float32Array([0, 40, 60]), 3));
  const POLARIS_SIZE = isMobile ? 10 : 14;
  const polarisMat = new PointsMaterial({
    color: theme.polaris, size: POLARIS_SIZE * (theme.polarisScale || 1), map: starSprite,
    transparent: true, opacity: 1,
    sizeAttenuation: true, blending: theme.blending, depthWrite: false,
  });
  const polaris = new Points(polarisGeo, polarisMat);
  scene.add(polaris);

  /* Constellation links */
  const linesPosArr = new Float32Array(MAX_LINES * 6);
  const linesColArr = new Float32Array(MAX_LINES * 6);
  const linesGeo = new BufferGeometry();
  linesGeo.setAttribute('position', new BufferAttribute(linesPosArr, 3));
  linesGeo.setAttribute('color',    new BufferAttribute(linesColArr, 3));
  const linesMat = new LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: theme.lineOpacity,
    blending: theme.blending, depthWrite: false,
  });
  scene.add(new LineSegments(linesGeo, linesMat));

  /* Meteors — the occasional shooting star. A pool of three line segments;
     LineBasicMaterial has no per-vertex alpha, so fading is done the same
     way as the constellation lines: mix the colour toward the ground, and
     compact live meteors to the front of the buffer so drawRange can hide
     the dead ones entirely. */
  const METEOR_MAX = 3;
  const meteors = [];
  for (let i = 0; i < METEOR_MAX; i++) meteors.push({ active: false });
  const metPosArr = new Float32Array(METEOR_MAX * 6);
  const metColArr = new Float32Array(METEOR_MAX * 6);
  const metGeo = new BufferGeometry();
  metGeo.setAttribute('position', new BufferAttribute(metPosArr, 3));
  metGeo.setAttribute('color',    new BufferAttribute(metColArr, 3));
  const metMat = new LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.9,
    blending: theme.blending, depthWrite: false,
  });
  scene.add(new LineSegments(metGeo, metMat));
  let nextMeteor = 4 + Math.random() * 8; // seconds, in scene time

  /* Nebula clouds: a few large tinted sprites far behind the stars. Far
     enough back that warp and scroll give them a slower parallax than the
     field, which is what sells the depth. Deliberately faint -- at artwork
     intensity they would fight the text. */
  const NEB_DEFS = [
    { accent: 2, x: -360, y:  220, z: -200, scale: 700 },  // violet, top left
    { accent: 1, x:  380, y:  150, z: -170, scale: 560 },  // cyan, top right
    { accent: 0, x:   60, y: -300, z: -190, scale: 640 },  // gold, low centre
    { accent: 3, x: -280, y: -220, z: -150, scale: 460 },  // rose, low left
  ];
  const nebSprites = NEB_DEFS.map((def) => {
    const mat = new SpriteMaterial({
      map: nebulaTex,
      transparent: true,
      opacity: theme.nebulaOpacity,
      blending: theme.blending,
      depthWrite: false,
      rotation: Math.random() * Math.PI * 2,
    });
    const sp = new Sprite(mat);
    sp.position.set(def.x, def.y, def.z);
    sp.scale.set(def.scale, def.scale, 1);
    sp.userData = def;
    scene.add(sp);
    return sp;
  });

  /* Bright stars: a small cast of larger glinting stars over the field,
     each twinkling on its own phase. */
  const BRIGHT_COUNT = isMobile ? 5 : 9;
  const brightPos = new Float32Array(BRIGHT_COUNT * 3);
  const brightColArr = new Float32Array(BRIGHT_COUNT * 3);
  const brightBase = [];
  const brightPhase = [];
  const brightSpeed = [];
  for (let i = 0; i < BRIGHT_COUNT; i++) {
    brightPos[i * 3]     = (Math.random() - 0.5) * SPREAD_XY * 1.3;
    brightPos[i * 3 + 1] = (Math.random() - 0.5) * SPREAD_XY * 1.3;
    brightPos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z * 0.8;
    brightBase.push(new Color());
    brightPhase.push(Math.random() * Math.PI * 2);
    brightSpeed.push(0.5 + Math.random() * 0.9);
  }
  const brightGeo = new BufferGeometry();
  brightGeo.setAttribute('position', new BufferAttribute(brightPos, 3));
  brightGeo.setAttribute('color',    new BufferAttribute(brightColArr, 3));
  const brightMat = new PointsMaterial({
    size: isMobile ? 14 : 20,
    map: flareSprite,
    transparent: true,
    opacity: theme.flareOpacity,
    vertexColors: true,
    sizeAttenuation: true,
    blending: theme.blending,
    depthWrite: false,
  });
  scene.add(new Points(brightGeo, brightMat));

  function assignBrightColors() {
    // Mostly star-white with the accents sprinkled in.
    const pool = [palette[0], palette[0], cGold, cCyan, cViolet];
    for (let i = 0; i < BRIGHT_COUNT; i++) brightBase[i].copy(pool[i % pool.length]);
  }

  function tintNebulae() {
    const roseCol = new Color(theme.rose);
    nebSprites.forEach((sp) => {
      const a = sp.userData.accent;
      sp.material.color.copy(a === 0 ? cGold : a === 1 ? cCyan : a === 2 ? cViolet : roseCol);
    });
  }

  function spawnMeteor() {
    const m = meteors.find((x) => !x.active);
    if (!m) return;
    m.active = true;
    m.x = (Math.random() - 0.5) * SPREAD_XY * 1.6;
    m.y = SPREAD_XY * (0.3 + Math.random() * 0.6);
    m.z = (Math.random() - 0.5) * SPREAD_Z;
    const dir = Math.random() < 0.5 ? -1 : 1;
    m.vx = dir * (2.6 + Math.random() * 1.8);
    m.vy = -(2.2 + Math.random() * 1.4);
    m.vz = (Math.random() - 0.5) * 0.4;
    m.life = 0;
    m.maxLife = 55 + Math.random() * 35; // frames
  }

  const cGold   = new Color(theme.accents[0]);
  const cCyan   = new Color(theme.accents[1]);
  const cViolet = new Color(theme.accents[2]);

  /* Recolour in place when the reader switches theme. Cheaper and less
     jarring than tearing the scene down and rebuilding it. */
  function applyTheme(name) {
    theme = THEMES[name] || THEMES.dark;
    theme.stars.forEach((hex, i) => palette[i].setHex(hex));
    groundCol.setHex(theme.ground);
    cGold.setHex(theme.accents[0]);
    cCyan.setHex(theme.accents[1]);
    cViolet.setHex(theme.accents[2]);

    const col = starsGeo.attributes.color.array;
    for (let i = 0; i < STAR_COUNT; i++) {
      // Keep each star's palette slot stable so the field does not reshuffle.
      const c = palette[i % palette.length];
      const i3 = i * 3;
      col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
    }
    starsGeo.attributes.color.needsUpdate = true;

    starsMat.opacity = theme.starOpacity;
    starsMat.blending = theme.blending;
    starsMat.needsUpdate = true;
    polarisMat.color.setHex(theme.polaris);
    polarisMat.size = POLARIS_SIZE * (theme.polarisScale || 1);
    polarisMat.blending = theme.blending;
    polarisMat.needsUpdate = true;
    linesMat.opacity = theme.lineOpacity;
    linesMat.blending = theme.blending;
    linesMat.needsUpdate = true;
    metMat.blending = theme.blending;
    metMat.needsUpdate = true;
    nebSprites.forEach((sp) => {
      sp.material.opacity = theme.nebulaOpacity;
      sp.material.blending = theme.blending;
      sp.material.needsUpdate = true;
    });
    brightMat.opacity = theme.flareOpacity;
    brightMat.blending = theme.blending;
    brightMat.needsUpdate = true;
    assignBrightColors();
    tintNebulae();
  }

  window.addEventListener('hqm:themechange', (e) => {
    applyTheme((e.detail && e.detail.theme) || currentTheme());
    if (reduceMotion) renderFrame();
  });

  /* Mouse / touch parallax */
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth  - 0.5) * 64;
    targetY = (e.clientY / window.innerHeight - 0.5) * 42;
  });
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length) {
      targetX = (e.touches[0].clientX / window.innerWidth  - 0.5) * 42;
      targetY = (e.touches[0].clientY / window.innerHeight - 0.5) * 26;
    }
  }, { passive: true });

  /* Scroll parallax. The canvas is fixed, so without this the field sits dead
     still while the page moves over it, which reads as a printed backdrop
     rather than depth. */
  let scrollTarget = 0;
  let scrollCurrent = 0;
  const readScroll = () => {
    const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
    scrollTarget = Math.min(1, window.scrollY / max);
  };
  readScroll();
  window.addEventListener('scroll', readScroll, { passive: true });

  /* Warp. Navigating pushes the camera into the field with a field-of-view
     surge, and the constellation lines wash out for the duration -- pages
     swap mid-flight, so arriving reads as having travelled. Ramp-in is
     faster than ramp-out on purpose: a jolt, then a long deceleration. */
  let warp = 0;
  let warpTarget = 0;
  document.addEventListener('astro:before-preparation', () => { warpTarget = 1; });
  document.addEventListener('astro:after-swap', () => {
    warpTarget = 0;
    // The swap replaced <body>, which dropped its classes; restore the flag
    // that keeps the static CSS star wash faded out behind the live canvas.
    document.body.classList.add('field-live');
    if (reduceMotion) renderFrame();
  });
  document.addEventListener('astro:page-load', readScroll);

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      readScroll();
      if (reduceMotion) renderFrame();
    }, 120);
  });

  /* Stop rendering entirely when the tab is hidden. A fixed full-page canvas
     that keeps animating in a background tab is a real battery cost. */
  let visible = !document.hidden;
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible && !reduceMotion) requestAnimationFrame(animate);
  });

  let t = 0;
  let lastFrame = 0;
  function animate() {
    if (!visible) return;          // resumes on visibilitychange
    requestAnimationFrame(animate);
    renderFrame();
  }

  /* One full simulation + render step. The animation loop calls this every
     frame; under prefers-reduced-motion it is called once per event that
     changes what is on screen (theme change, page swap, resize) -- star
     drift is zero there, so each call redraws an equivalent still frame. */
  function renderFrame() {
    /* Real elapsed time, not a per-frame constant: per-frame stepping runs
       2.4x too fast on a 144Hz display and crawls when the browser
       throttles. Clamped so a background tab's long gap cannot teleport
       the field. dt60 rescales the original per-frame-at-60Hz tunings. */
    const now = performance.now();
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0.016;
    lastFrame = now;
    const dt60 = dt * 60;
    t += dt;

    const pos = starsGeo.attributes.position.array;
    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      pos[i3]     += vel[i3] * dt60;
      pos[i3 + 1] += vel[i3 + 1] * dt60;
      pos[i3 + 2] += vel[i3 + 2] * dt60;
      if (Math.abs(pos[i3])     > SPREAD_XY) vel[i3]     *= -1;
      if (Math.abs(pos[i3 + 1]) > SPREAD_XY) vel[i3 + 1] *= -1;
      if (Math.abs(pos[i3 + 2]) > SPREAD_Z)  vel[i3 + 2] *= -1;
    }
    starsGeo.attributes.position.needsUpdate = true;

    /* Twinkle Polaris */
    polarisMat.opacity = 0.7 + Math.sin(t * 1.6) * 0.3;

    /* Wire nearby stars into constellation lines. This is O(n^2) over
       STAR_COUNT, which looks alarming, so it was measured before being
       optimised: 0.034 ms at 190 stars and 0.063 ms at 260, against a 16.7 ms
       frame budget. Throttling it bought nothing worth the extra code path. */
    let lineCount = 0;
    const lp = linesGeo.attributes.position.array;
    const lc = linesGeo.attributes.color.array;
    for (let i = 0; i < STAR_COUNT && lineCount < MAX_LINES; i++) {
      const ix = pos[i * 3], iy = pos[i * 3 + 1], iz = pos[i * 3 + 2];
      for (let j = i + 1; j < STAR_COUNT && lineCount < MAX_LINES; j++) {
        const dx = ix - pos[j * 3], dy = iy - pos[j * 3 + 1], dz = iz - pos[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < LINK_DIST) {
          const alpha = (1 - dist / LINK_DIST) * 0.9;
          const li = lineCount * 6;
          const r = i / STAR_COUNT;
          const col = r < 0.34 ? cGold : (r < 0.67 ? cCyan : cViolet);
          lp[li] = ix; lp[li + 1] = iy; lp[li + 2] = iz;
          lp[li + 3] = pos[j * 3]; lp[li + 4] = pos[j * 3 + 1]; lp[li + 5] = pos[j * 3 + 2];
          const fr = groundCol.r + (col.r - groundCol.r) * alpha;
          const fg = groundCol.g + (col.g - groundCol.g) * alpha;
          const fb = groundCol.b + (col.b - groundCol.b) * alpha;
          lc[li] = fr; lc[li + 1] = fg; lc[li + 2] = fb;
          lc[li + 3] = fr; lc[li + 4] = fg; lc[li + 5] = fb;
          lineCount++;
        }
      }
    }
    linesGeo.setDrawRange(0, lineCount * 2);
    linesGeo.attributes.position.needsUpdate = true;
    linesGeo.attributes.color.needsUpdate = true;

    /* Meteors: spawn on a loose schedule, compact live ones to the front of
       the buffer, retire them when their arc completes. */
    if (t > nextMeteor) {
      spawnMeteor();
      nextMeteor = t + 6 + Math.random() * 10;
    }
    let metCount = 0;
    for (let i = 0; i < METEOR_MAX; i++) {
      const m = meteors[i];
      if (!m.active) continue;
      m.life += dt60;
      if (m.life >= m.maxLife || m.y < -SPREAD_XY * 1.1) { m.active = false; continue; }
      m.x += m.vx * dt60; m.y += m.vy * dt60; m.z += m.vz * dt60;

      // Bright at mid-arc, dark at both ends; the tail end stays at ground.
      const k = m.life / m.maxLife;
      const glow = Math.sin(Math.PI * k) * 0.95;
      const mi = metCount * 6;
      metPosArr[mi]     = m.x;              metPosArr[mi + 1] = m.y;              metPosArr[mi + 2] = m.z;
      metPosArr[mi + 3] = m.x - m.vx * 7;   metPosArr[mi + 4] = m.y - m.vy * 7;   metPosArr[mi + 5] = m.z - m.vz * 7;
      const head = palette[0]; // brightest star ink in either theme
      metColArr[mi]     = groundCol.r + (head.r - groundCol.r) * glow;
      metColArr[mi + 1] = groundCol.g + (head.g - groundCol.g) * glow;
      metColArr[mi + 2] = groundCol.b + (head.b - groundCol.b) * glow;
      metColArr[mi + 3] = groundCol.r;
      metColArr[mi + 4] = groundCol.g;
      metColArr[mi + 5] = groundCol.b;
      metCount++;
    }
    metGeo.setDrawRange(0, metCount * 2);
    metGeo.attributes.position.needsUpdate = true;
    metGeo.attributes.color.needsUpdate = true;

    /* Bright stars twinkle individually: brightness pulses per star by
       mixing between the ground and the star's base colour, which fades
       correctly under both blending modes. */
    const bcol = brightGeo.attributes.color.array;
    for (let i = 0; i < BRIGHT_COUNT; i++) {
      const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * brightSpeed[i] + brightPhase[i]));
      const base = brightBase[i];
      const i3 = i * 3;
      bcol[i3]     = groundCol.r + (base.r - groundCol.r) * pulse;
      bcol[i3 + 1] = groundCol.g + (base.g - groundCol.g) * pulse;
      bcol[i3 + 2] = groundCol.b + (base.b - groundCol.b) * pulse;
    }
    brightGeo.attributes.color.needsUpdate = true;

    /* Nebulae breathe: a very slow positional drift, nothing more. */
    for (let i = 0; i < nebSprites.length; i++) {
      const sp = nebSprites[i];
      sp.position.x = sp.userData.x + Math.sin(t * 0.05 + i * 2.1) * 18;
      sp.position.y = sp.userData.y + Math.cos(t * 0.04 + i * 1.7) * 12;
    }

    /* Exponential smoothing in continuous time: 1 - e^(-k*dt) equals the
       old per-frame factors exactly at 60Hz and stays correct elsewhere. */
    const easePointer = 1 - Math.exp(-2.6 * dt);
    const easeScroll = 1 - Math.exp(-3.1 * dt);
    const easeWarp = 1 - Math.exp(-(warpTarget > warp ? 10.5 : 3.1) * dt);
    currentX += (targetX - currentX) * easePointer;
    currentY += (targetY - currentY) * easePointer;
    scrollCurrent += (scrollTarget - scrollCurrent) * easeScroll;
    warp += (warpTarget - warp) * easeWarp;

    if (Math.abs(camera.fov - (BASE_FOV + warp * 18)) > 0.02) {
      camera.fov = BASE_FOV + warp * 18;
      camera.updateProjectionMatrix();
    }
    linesMat.opacity = theme.lineOpacity * (1 - warp * 0.8);

    camera.position.x = currentX;
    // Pointer parallax plus a slow drift down the field as the page scrolls,
    // plus the warp push into the field while navigating.
    camera.position.y = -currentY - scrollCurrent * 150;
    camera.position.z = 560 - scrollCurrent * 90 - warp * 140;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  assignBrightColors();
  tintNebulae();

  canvas.classList.add('live');
  document.body.classList.add('field-live');

  if (reduceMotion) {
    // Drift is zero, so a loop would burn frames redrawing the same image.
    // Render one frame now, then single frames on the events that change
    // what is on screen; otherwise stay idle.
    visible = false;
    renderFrame();
  } else {
    animate();
  }
})();
