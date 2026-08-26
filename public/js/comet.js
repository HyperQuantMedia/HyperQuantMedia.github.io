/* Cursor comet — a bluish-white streak behind the pointer.

   Drawn as one continuous tapered polyline through the pointer's recent
   path, not as scattered particles: a comet is a head and a tail, not
   confetti. A separate 2D canvas above the content (the starfield canvas
   sits behind it, so a trail drawn there would vanish under every card).

   Idle cost is zero by construction: the rAF loop runs only while trail
   points are alive and stops when the last one fades. Not started at all on
   touch devices, coarse pointers, or under prefers-reduced-motion. */
(function () {
  'use strict';

  const canvas = document.getElementById('cometCanvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const ctx = canvas.getContext('2d');
  let dpr = 1, w = 0, h = 0;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  size();
  window.addEventListener('resize', size);

  /* One colour, both themes: bluish white on the dark ground, the same hue
     as dark ink on the light ground -- a white streak is invisible there. */
  function ink() {
    const set = document.documentElement.getAttribute('data-theme');
    const light = set === 'light'
      || (set !== 'dark' && window.matchMedia('(prefers-color-scheme: light)').matches);
    return light ? '50,75,160' : '214,230,255';
  }
  let rgb = ink();
  window.addEventListener('hqm:themechange', () => { rgb = ink(); });

  /* The trail: the pointer's recent path, newest last. Each point fades on
     its own clock, so standing still lets the tail burn down to nothing. */
  const trail = [];
  const MAX_POINTS = 36;
  let running = false;
  let lastTick = 0;

  window.addEventListener('pointermove', (e) => {
    const last = trail[trail.length - 1];
    // Skip sub-pixel jitter; it makes the head shimmer in place.
    if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 3) return;
    trail.push({ x: e.clientX, y: e.clientY, life: 1 });
    if (trail.length > MAX_POINTS) trail.shift();
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }, { passive: true });

  function tick() {
    ctx.clearRect(0, 0, w, h);

    // Fade by real elapsed time, not per frame, so the tail burns at the
    // same rate on every refresh rate. 3/s equals the old 0.05-per-frame
    // at 60Hz.
    const now = performance.now();
    const dt = lastTick ? Math.min((now - lastTick) / 1000, 0.05) : 0.016;
    lastTick = now;
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].life -= 3 * dt;
      if (trail[i].life <= 0) trail.splice(i, 1);
    }

    if (trail.length > 1) {
      /* Tail: tapered segments, thin and faint at the oldest point, thick
         and bright approaching the head. */
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i];
        const b = trail[i - 1];
        const k = (i / trail.length) * a.life;
        ctx.strokeStyle = 'rgba(' + rgb + ',' + (k * 0.5).toFixed(3) + ')';
        ctx.lineWidth = 0.5 + k * 2.6;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(a.x, a.y);
        ctx.stroke();
      }

      /* Head: a small bright core with a soft halo. */
      const head = trail[trail.length - 1];
      const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 9);
      glow.addColorStop(0, 'rgba(' + rgb + ',' + (0.55 * head.life).toFixed(3) + ')');
      glow.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    if (trail.length) {
      requestAnimationFrame(tick);
    } else {
      running = false;
      lastTick = 0;
      ctx.clearRect(0, 0, w, h);
    }
  }
})();
