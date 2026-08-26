/* Lost in deep space — the 404 minigame.

   An endless run: the comet flies, the field streams past, and you steer
   through it collecting waypoints for as long as you can hold the course.
   One control, every platform — the pointer, a finger, or the arrow keys.
   Nothing to combo, nothing to time.

   Rules of the house:
     - It never traps anyone. The real Return Home link sits above the panel
       and always works, and the run's own end screen offers it again.
     - Three knocks end a run, so there is a score worth beating, but nothing
       is ever lost except the run.
     - Zero idle cost. The loop runs only while the panel is on screen, the
       tab is visible, and a run is live.
     - Off entirely under prefers-reduced-motion, where the panel says so
       rather than sitting there as a dead black box.
     - A fixed 60Hz simulation, clamped: the run advances in 1/60 steps no
       matter the display's refresh rate, and draws once per step rather than
       once per frame.

   Loaded only by the 404 page, but re-initialised on `astro:page-load` too,
   since the client-side router can swap into this page without re-running
   the file. */
(function () {
  'use strict';

  var BEST_KEY = 'hqm-lost-best';
  var SHIELDS = 3;
  var SPEED_0 = 200;          // px/sec at the start of a run
  var SPEED_RAMP = 7;         // px/sec gained per second flown
  var SPEED_MAX = 560;
  var STEER = 7.5;            // how hard the comet chases the pointer
  var KEY_ACCEL = 1100;       // arrow-key acceleration, units/sec^2
  var FRICTION = 0.86;
  var HIT = 12;               // comet nose radius for collisions
  var FIXED = 1 / 60;         // one simulation step; the run is 60Hz everywhere
  var MAX_STEPS = 4;          // catch-up ceiling, so a stall never fast-forwards
  var instance = null;

  function readBest() {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) { return 0; }
  }
  function writeBest(v) {
    try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* private mode: score lives for the session only */ }
  }

  function tokens(el) {
    var cs = getComputedStyle(el);
    function get(name, fallback) {
      var v = cs.getPropertyValue(name).trim();
      return v || fallback;
    }
    return {
      comet: get('--polaris', '#ffce6e'),
      trail: get('--stellar', '#b8d3ff'),
      way: get('--nebula', '#57e1c4'),
      debris: get('--star-faint', '#767ea6'),
      dust: get('--star-faint', '#767ea6'),
    };
  }

  function start(root) {
    var canvas = root.querySelector('.lost-canvas');
    var status = root.querySelector('.lost-status');
    var live = root.querySelector('.lost-live');
    var overTitle = root.querySelector('.lost-over-title');
    var overStats = root.querySelector('.lost-over-stats');
    var replay = root.querySelector('.lost-replay');
    var ctx = canvas.getContext('2d');

    var dpr = 1, w = 0, h = 0;
    var ink = tokens(root);
    var running = false, raf = 0, last = 0, acc = 0, onScreen = false;
    var best = readBest();

    var comet, target, rocks, ways, dust, speed, dist, waysGot, shields, over, spawnIn, wayIn, seed;

    function size() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(rect.width, 1);
      h = Math.max(rect.height, 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    /* One deterministic stream instead of Math.random, so a run is
       reproducible and nothing here depends on a seeded RNG library. */
    function rnd() {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    function reset() {
      seed = 20260827;
      comet = { x: w * 0.22, y: h * 0.5, vx: 0, vy: 0, tail: [] };
      target = null;
      rocks = [];
      ways = [];
      dust = [];
      for (var i = 0; i < 60; i++) {
        dust.push({ x: rnd() * w, y: rnd() * h, z: 0.3 + rnd() * 0.9, r: 0.5 + rnd() * 1.2 });
      }
      speed = SPEED_0;
      dist = 0;
      waysGot = 0;
      shields = SHIELDS;
      over = false;
      spawnIn = 0.8;
      wayIn = 2.4;
      root.classList.remove('is-over');
      report();
    }

    /* The hull: one pip per hit the ship can still take. Spent pips hollow
       out rather than vanishing, so the count never shifts position, and the
       pip that just changed pulses - the number alone is easy to miss mid-
       flight. */
    var pips = root.querySelectorAll('.lost-pip');
    var pulseTimers = [];
    function pulse(i, cls) {
      var el = pips[i];
      if (!el) return;
      el.classList.remove(cls);
      void el.offsetWidth;               // restart the animation
      el.classList.add(cls);
      pulseTimers.push(setTimeout(function () { el.classList.remove(cls); }, 620));
    }
    function report() {
      if (status) status.textContent = Math.floor(dist) + ' ly · best ' + best;
      for (var i = 0; i < pips.length; i++) {
        pips[i].classList.toggle('is-spent', i >= shields);
      }
    }

    function announce(msg) { if (live) live.textContent = msg; }

    function spawnRock() {
      var r = 10 + rnd() * 16;
      rocks.push({
        x: w + r + 10,
        y: 14 + rnd() * (h - 28),
        r: r,
        vy: (rnd() - 0.5) * 46,
        rot: rnd() * 6.283,
        spin: (rnd() - 0.5) * 1.6,
      });
    }

    function spawnWay() {
      ways.push({ x: w + 20, y: 22 + rnd() * (h - 44), t: 0 });
    }

    function endRun() {
      over = true;
      var score = Math.floor(dist);
      var isBest = score > best;
      if (isBest) { best = score; writeBest(best); }
      root.classList.add('is-over');
      if (overTitle) overTitle.textContent = isBest ? 'New best course.' : 'Course lost.';
      if (overStats) {
        overStats.textContent = score + ' light-years · ' + waysGot + ' waypoint'
          + (waysGot === 1 ? '' : 's') + ' · best ' + best + ' ly';
      }
      announce('Run over. ' + score + ' light-years, ' + waysGot + ' waypoints charted.');
      report();
    }

    function step(dt) {
      var i, o;

      speed = Math.min(speed + SPEED_RAMP * dt, SPEED_MAX);
      dist += (speed * dt) / 18;

      // Steering. Keys win while held; otherwise the comet chases the pointer.
      var ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      var ay = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (ax || ay) {
        var m = Math.hypot(ax, ay) || 1;
        comet.vx += (ax / m) * KEY_ACCEL * dt;
        comet.vy += (ay / m) * KEY_ACCEL * dt;
      } else if (target) {
        comet.vx += (target.x - comet.x) * STEER * dt * 6;
        comet.vy += (target.y - comet.y) * STEER * dt * 6;
      }
      // A gentle pull back to the flying lane, so the comet never parks in
      // a corner and the run keeps its shape.
      comet.vx += (w * 0.22 - comet.x) * 1.4 * dt;

      var damp = Math.pow(FRICTION, dt * 60);
      comet.vx *= damp;
      comet.vy *= damp;
      comet.x += comet.vx * dt;
      comet.y += comet.vy * dt;

      if (comet.x < 12) { comet.x = 12; comet.vx = Math.abs(comet.vx) * 0.3; }
      if (comet.x > w * 0.62) { comet.x = w * 0.62; comet.vx = -Math.abs(comet.vx) * 0.3; }
      if (comet.y < 10) { comet.y = 10; comet.vy = Math.abs(comet.vy) * 0.3; }
      if (comet.y > h - 10) { comet.y = h - 10; comet.vy = -Math.abs(comet.vy) * 0.3; }

      comet.tail.push({ x: comet.x, y: comet.y, life: 1 });
      if (comet.tail.length > 24) comet.tail.shift();
      for (i = 0; i < comet.tail.length; i++) comet.tail[i].life -= dt * 2.2;

      // The field streams past. Dust is parallax, so speed reads as speed.
      for (i = 0; i < dust.length; i++) {
        o = dust[i];
        o.x -= speed * o.z * dt;
        if (o.x < -2) { o.x = w + 2; o.y = rnd() * h; }
      }

      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawnRock();
        spawnIn = Math.max(0.28, 0.95 - speed / 900);
      }
      wayIn -= dt;
      if (wayIn <= 0) { spawnWay(); wayIn = 2.6 + rnd() * 1.8; }

      for (i = rocks.length - 1; i >= 0; i--) {
        o = rocks[i];
        o.x -= speed * dt;
        o.y += o.vy * dt;
        o.rot += o.spin * dt;
        if (o.y < o.r || o.y > h - o.r) o.vy *= -1;
        if (o.x < -o.r - 20) { rocks.splice(i, 1); continue; }

        if (Math.hypot(o.x - comet.x, o.y - comet.y) < o.r + HIT) {
          rocks.splice(i, 1);
          shields--;
          comet.tail.length = 0;
          // Shoved off course, and the run slows while you recover.
          comet.vx = -140;
          comet.vy = (comet.y < h / 2 ? 1 : -1) * 120;
          speed = Math.max(SPEED_0, speed * 0.72);
          pulse(shields, 'is-hit');
          report();
          if (shields <= 0) { endRun(); return; }
          announce(shields + ' hull point' + (shields === 1 ? '' : 's') + ' left.');
        }
      }

      for (i = ways.length - 1; i >= 0; i--) {
        o = ways[i];
        o.x -= speed * dt;
        o.t += dt;
        if (o.x < -20) { ways.splice(i, 1); continue; }
        if (Math.hypot(o.x - comet.x, o.y - comet.y) < 20) {
          ways.splice(i, 1);
          waysGot++;
          dist += 25;
          if (shields < SHIELDS && waysGot % 5 === 0) {
            shields++;
            pulse(shields - 1, 'is-mend');
            announce('Hull repaired.');
          }
          report();
        }
      }
    }

    function draw() {
      var i, o, p;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.fillStyle = ink.dust;
      for (i = 0; i < dust.length; i++) {
        o = dust[i];
        ctx.globalAlpha = 0.16 + o.z * 0.4;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Waypoints: the same four-point mark the Cosmos field uses.
      for (i = 0; i < ways.length; i++) {
        o = ways[i];
        var pulse = 1 + Math.sin(o.t * 4) * 0.16;
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = ink.way;
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(0, -10); ctx.quadraticCurveTo(1.7, -1.7, 10, 0);
        ctx.quadraticCurveTo(1.7, 1.7, 0, 10);
        ctx.quadraticCurveTo(-1.7, 1.7, -10, 0);
        ctx.quadraticCurveTo(-1.7, -1.7, 0, -10);
        ctx.fill();
        ctx.restore();
      }

      for (i = 0; i < rocks.length; i++) {
        o = rocks[i];
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rot);
        ctx.strokeStyle = ink.debris;
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (var k = 0; k < 7; k++) {
          var a = (k / 7) * Math.PI * 2;
          var rr = o.r * (0.72 + ((k * 37) % 10) / 24);
          if (k === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.strokeStyle = ink.trail;
      for (i = 1; i < comet.tail.length; i++) {
        p = comet.tail[i];
        if (p.life <= 0) continue;
        ctx.globalAlpha = Math.max(p.life, 0) * 0.5;
        ctx.lineWidth = 1 + (i / comet.tail.length) * 5;
        ctx.beginPath();
        ctx.moveTo(comet.tail[i - 1].x, comet.tail[i - 1].y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = over ? 0.35 : 1;
      ctx.fillStyle = ink.comet;
      ctx.shadowColor = ink.comet;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(comet.x, comet.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* Fixed 60Hz simulation, decoupled from the display. A 144Hz screen runs
       the same number of steps per second as a 60Hz one and simply skips the
       frames with nothing new to show, so the run plays identically on any
       refresh rate and never renders faster than it simulates. A long stall
       (a backgrounded tab, a slow frame) is dropped rather than fast-
       forwarded: at most MAX_STEPS are caught up in one frame. */
    function frame(now) {
      if (!running) return;
      var elapsed = (now - last) / 1000;
      last = now;
      if (elapsed > 0.25) elapsed = FIXED;   // came back from a stall: skip it
      acc += elapsed;

      var steps = 0;
      while (acc >= FIXED && steps < MAX_STEPS) {
        if (!over) step(FIXED);
        acc -= FIXED;
        steps++;
      }
      if (acc > FIXED * MAX_STEPS) acc = 0;

      if (steps) draw();
      if (over) { running = false; raf = 0; return; }
      raf = requestAnimationFrame(frame);
    }

    function play() {
      if (running || over || !onScreen || document.hidden) return;
      running = true;
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    }
    function pause() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function point(e) {
      var r = canvas.getBoundingClientRect();
      target = { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    var keys = Object.create(null);
    function onKey(e) {
      var k = e.key;
      var hit = true;
      if (k === 'ArrowLeft' || k === 'a') keys.left = e.type === 'keydown';
      else if (k === 'ArrowRight' || k === 'd') keys.right = e.type === 'keydown';
      else if (k === 'ArrowUp' || k === 'w') keys.up = e.type === 'keydown';
      else if (k === 'ArrowDown' || k === 's') keys.down = e.type === 'keydown';
      else if ((k === 'Enter' || k === ' ') && over) { onReplay(); }
      else hit = false;
      if (hit) e.preventDefault();
    }

    function onReplay() {
      size();
      reset();
      play();
      announce('New run. Steer with the pointer or the arrow keys.');
      canvas.focus({ preventScroll: true });
    }

    var io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) play(); else pause();
      }, { threshold: 0.15 });
      io.observe(canvas);
    } else {
      onScreen = true;
    }

    function onVisible() { if (document.hidden) pause(); else play(); }
    function onBlur() { keys = Object.create(null); }
    function onThemeChange() { ink = tokens(root); }

    canvas.addEventListener('pointermove', point);
    canvas.addEventListener('pointerdown', point);
    canvas.addEventListener('pointerleave', function () { target = null; });
    canvas.addEventListener('keydown', onKey);
    canvas.addEventListener('keyup', onKey);
    canvas.addEventListener('blur', onBlur);
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('hqm:themechange', onThemeChange);
    document.addEventListener('hqm:themechange', onThemeChange);
    if (replay) replay.addEventListener('click', onReplay);

    size();
    reset();
    play();

    return {
      destroy: function () {
        pause();
        for (var t = 0; t < pulseTimers.length; t++) clearTimeout(pulseTimers[t]);
        if (io) io.disconnect();
        canvas.removeEventListener('pointermove', point);
        canvas.removeEventListener('pointerdown', point);
        canvas.removeEventListener('keydown', onKey);
        canvas.removeEventListener('keyup', onKey);
        canvas.removeEventListener('blur', onBlur);
        window.removeEventListener('resize', size);
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('hqm:themechange', onThemeChange);
        document.removeEventListener('hqm:themechange', onThemeChange);
        if (replay) replay.removeEventListener('click', onReplay);
      },
    };
  }

  function init() {
    if (instance) { instance.destroy(); instance = null; }
    var root = document.querySelector('[data-lost-game]');
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('is-still');
      return;
    }
    instance = start(root);
  }

  document.addEventListener('astro:page-load', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
