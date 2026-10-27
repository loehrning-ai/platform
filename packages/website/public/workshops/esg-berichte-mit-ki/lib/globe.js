/* Spinning line globe for the deck, in the style of the loehrning.ai hero globe.
 *
 * <canvas data-globe data-lat="38" data-speed="9" data-arc="germany"></canvas>
 *
 * Orthographic projection on a 2D canvas, no dependencies. Land outlines come from
 * window.ESG_GEO (lib/geo.js). North Macedonia is filled in Mennige and pulses while it faces the
 * room. The globe only animates while its slide is active, and holds still on North Macedonia under
 * reduced motion.
 *
 * Attributes (all optional):
 *   data-lat     tilt in degrees (38)            data-speed   cruise spin, degrees per second (9)
 *   data-cx/cy   globe centre as a share of the canvas width / height (0.5 / 0.5)
 *   data-r       radius as a share of the shorter canvas side (0.47)
 *   data-boost   extra spin in degrees per second when the slide becomes active, decaying (0)
 *   data-arc     "germany" or "eu": draw that arc from North Macedonia by itself on first activation
 *   data-home    start view in degrees east of North Macedonia (70); a larger value keeps North Macedonia in view longer
 *
 * Script control (used by slide scripts): const g = ESGGlobe.get(canvas);
 *   g.settle({lon, lat, zoom, cx, cy, ms, short})  ease to a stop facing lon/lat (short: shortest way); zoom scales the radius,
 *                                    cx/cy move the centre (shares of the canvas)
 *   g.arc(to, {ms, delay, lift, labels: [[place, text], ...]})  draw an arc from North Macedonia
 *   g.still({lon, lat, zoom, cx, cy})  jump to a still view (no motion)
 *   g.reset()                       spin again from the start, no arcs
 * Places: 'macedonia', 'skopje', 'germany', 'eu' (Brussels), 'sweden' (Gothenburg) or [lon, lat].
 */
(() => {
  const GEO = window.ESG_GEO;
  if (!GEO) return;
  const DEG = Math.PI / 180;
  const PLACES = {
    macedonia: [21.75, 41.6], skopje: [21.43, 42.0], germany: [10.4, 51.2],
    eu: [4.35, 50.85], brussels: [4.35, 50.85], sweden: [11.97, 57.71],
  };
  const MACEDONIA = PLACES.macedonia;
  const place = (p) => (Array.isArray(p) ? p : PLACES[p]);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp01 = (t) => Math.min(1, Math.max(0, t));

  function projector(lon0, lat0, r, cx, cy) {
    const sl = Math.sin(lat0 * DEG), cl = Math.cos(lat0 * DEG);
    return ([lon, lat]) => {
      const l = (lon - lon0) * DEG, p = lat * DEG;
      const cp = Math.cos(p), sp = Math.sin(p), cll = Math.cos(l);
      const z = sl * sp + cl * cp * cll;
      return [cx + r * cp * Math.sin(l), cy - r * (cl * sp - sl * cp * cll), z];
    };
  }

  // stroke a lon/lat ring, lifting the pen where it passes behind the globe
  function trace(ctx, ring, project, close) {
    let pen = false;
    ctx.beginPath();
    for (const pt of ring) {
      const [x, y, z] = project(pt);
      if (z <= 0) { pen = false; continue; }
      if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; }
    }
    if (close) ctx.closePath();
  }

  function visibleShare(ring, project) {
    let n = 0;
    for (const pt of ring) if (project(pt)[2] > 0) n += 1;
    return n / ring.length;
  }

  function greatCircle(a, b, steps) {
    const toV = ([lon, lat]) => [Math.cos(lat * DEG) * Math.cos(lon * DEG), Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG)];
    const va = toV(a), vb = toV(b);
    const omega = Math.acos(va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]);
    const out = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const k1 = Math.sin((1 - t) * omega) / Math.sin(omega), k2 = Math.sin(t * omega) / Math.sin(omega);
      const v = [k1 * va[0] + k2 * vb[0], k1 * va[1] + k2 * vb[1], k1 * va[2] + k2 * vb[2]];
      out.push([Math.atan2(v[1], v[0]) / DEG, Math.asin(v[2]) / DEG, Math.sin(t * Math.PI)]);
    }
    return out;
  }

  const graticule = [];
  for (let lon = -180; lon < 180; lon += 15) {
    const ring = [];
    for (let lat = -90; lat <= 90; lat += 3) ring.push([lon, lat]);
    graticule.push(ring);
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const ring = [];
    for (let lon = -180; lon <= 180; lon += 3) ring.push([lon, lat]);
    graticule.push(ring);
  }

  const controllers = new WeakMap();

  function mount(canvas) {
    const ctx = canvas.getContext('2d');
    const slide = canvas.closest('section');
    const ds = canvas.dataset;
    const lat00 = parseFloat(ds.lat || '38');
    const speed = parseFloat(ds.speed || '9');
    const boost = parseFloat(ds.boost || '0');
    const fcx0 = parseFloat(ds.cx || '0.5'), fcy0 = parseFloat(ds.cy || '0.5'), fr = parseFloat(ds.r || '0.47');
    const autoArc = ds.arc === 'germany' || ds.arc === 'eu' ? ds.arc : null;
    const highlightGermany = ds.arc === 'germany';
    const ink = css('--ink', '#121212');
    const accent = css('--mennige', '#B73A15');
    const card = css('--card', '#E5E4E2');
    const paper = css('--paper', '#F3F0E9');

    const homeOff = parseFloat(ds.home || '70'); // start this many degrees east of North Macedonia (spins towards it)
    const home = () => ({ lon: MACEDONIA[0] + homeOff, lat: lat00, zoom: 1, cx: fcx0, cy: fcy0 });
    const view = home();
    let mode = 'spin';            // spin | settle | still
    let move = null;              // settle animation
    let arcs = [];                // {path, t0, ms, lift, labels}
    let last = 0, wasActive = false, boostT0 = -1e9, velocity = speed;
    let autoArcDone = false;

    function size() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.max(1, w * 2); canvas.height = Math.max(1, h * 2);
    }

    function label(x, y, text, align) {
      const fs = 24 * 2;
      ctx.font = `600 ${fs}px "JetBrains Mono", ui-monospace, monospace`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${0.12 * fs}px`;
      const w = ctx.measureText(text).width + 0.12 * fs;
      const padX = 14, padY = 10, h = fs + padY * 2;
      const bx = align === 'left' ? x - w - padX * 2 - 26 : x + 26;
      const by = y - h / 2;
      ctx.fillStyle = paper; ctx.fillRect(bx, by, w + padX * 2, h);
      ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.strokeRect(bx, by, w + padX * 2, h);
      ctx.fillStyle = ink; ctx.textBaseline = 'middle';
      ctx.fillText(text, bx + padX + 0.06 * fs, y + 2);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    }

    function draw(t) {
      const W = canvas.width, H = canvas.height;
      const r = Math.min(W, H) * fr * view.zoom, cx = W * view.cx, cy = H * view.cy;
      const project = projector(view.lon, view.lat, r, cx, cy);
      ctx.clearRect(0, 0, W, H);

      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;

      ctx.lineWidth = 1.4; ctx.strokeStyle = ink; ctx.globalAlpha = 0.13;
      for (const ring of graticule) { trace(ctx, ring, project, false); ctx.stroke(); }

      ctx.globalAlpha = 1;
      for (const ring of GEO.land) {
        if (visibleShare(ring, project) < 0.999) { ctx.globalAlpha = 0.5; trace(ctx, ring, project, false); ctx.lineWidth = 1.6; ctx.strokeStyle = ink; ctx.stroke(); ctx.globalAlpha = 1; continue; }
        trace(ctx, ring, project, true);
        ctx.fillStyle = card; ctx.fill();
        ctx.lineWidth = 1.6; ctx.strokeStyle = ink; ctx.globalAlpha = 0.55; ctx.stroke(); ctx.globalAlpha = 1;
      }

      const facing = project(MACEDONIA)[2];
      if (highlightGermany) {
        for (const ring of GEO.germany) {
          if (visibleShare(ring, project) < 0.999) continue;
          trace(ctx, ring, project, true); ctx.strokeStyle = accent; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
        }
      }
      for (const ring of GEO.macedonia) {
        if (visibleShare(ring, project) < 0.999) continue;
        trace(ctx, ring, project, true); ctx.fillStyle = accent; ctx.fill();
      }
      if (facing > 0.2) {
        const [mx, my] = project(MACEDONIA);
        const phase = ((t / 1600) % 1);
        ctx.beginPath(); ctx.arc(mx, my, 10 + phase * 46, 0, Math.PI * 2);
        ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.globalAlpha = (1 - phase) * Math.min(1, facing * 2); ctx.stroke(); ctx.globalAlpha = 1;
      }

      for (const a of arcs) {
        const p = reduce || a.ms <= 0 ? 1 : easeIO(clamp01((t - a.t0) / a.ms));
        if (p <= 0) continue;
        const upto = Math.max(2, Math.round((a.path.length - 1) * p) + 1);
        const lifted = (lon, lat, lift) => projector(view.lon, view.lat, r * (1 + a.lift * lift), cx, cy)([lon, lat]);
        ctx.beginPath();
        let pen = false, tip = null;
        for (let i = 0; i < upto; i += 1) {
          const [lon, lat, lift] = a.path[i];
          if (project([lon, lat])[2] <= 0 && lift < 0.2) { pen = false; continue; }
          const q = lifted(lon, lat, lift);
          if (pen) ctx.lineTo(q[0], q[1]); else { ctx.moveTo(q[0], q[1]); pen = true; }
          tip = q;
        }
        ctx.strokeStyle = accent; ctx.lineWidth = 6; ctx.lineCap = 'butt';
        if (p >= 1) { ctx.setLineDash([18, 12]); ctx.lineDashOffset = t / 28; }
        ctx.stroke(); ctx.setLineDash([]);
        if (tip && p < 1) { ctx.fillStyle = accent; ctx.fillRect(tip[0] - 9, tip[1] - 9, 18, 18); }
        if (p >= 1) {
          const end = a.path[a.path.length - 1];
          const e = project([end[0], end[1]]);
          if (e[2] > 0) { ctx.fillStyle = accent; ctx.fillRect(e[0] - 10, e[1] - 10, 20, 20); }
          const fade = reduce || a.ms <= 0 ? 1 : clamp01((t - a.t0 - a.ms) / 250);
          ctx.globalAlpha = fade;
          for (const [where, text, align] of a.labels) {
            const q = project(place(where));
            if (q[2] > 0) label(q[0], q[1], text, align);
          }
          ctx.globalAlpha = 1;
        }
      }
    }

    function advance(t, dt) {
      if (mode === 'spin' && !reduce) {
        velocity = speed + boost * Math.exp(-(t - boostT0) / 650);
        view.lon -= (dt / 1000) * velocity;
      } else if (mode === 'settle' && move) {
        const s = clamp01((t - move.t0) / move.ms);
        // cubic Hermite: leave with the current spin velocity, arrive at rest
        const h01 = 3 * s * s - 2 * s * s * s, h10 = s * s * s - 2 * s * s + s;
        view.lon = move.lon - (move.v0 * move.ms * h10 + move.d * h01);
        const e = easeIO(s);
        view.lat = move.lat + (move.toLat - move.lat) * e;
        for (const k of ['zoom', 'cx', 'cy']) view[k] = move.from[k] + (move.to[k] - move.from[k]) * e;
        if (s >= 1) { mode = 'still'; view.lon = move.toLon; move = null; }
      }
    }

    function frame(t) {
      const active = !slide || slide.hasAttribute('data-deck-active');
      // The deck scales its 1920 x 1080 canvas; follow the layout size if it changed since the last frame.
      if (canvas.width !== Math.max(1, canvas.clientWidth * 2) || canvas.height !== Math.max(1, canvas.clientHeight * 2)) size();
      const dt = Math.min(50, t - (last || t));
      if (active && !wasActive) {
        boostT0 = t;
        if (autoArc && !autoArcDone) {
          autoArcDone = true;
          arcs = [{ path: greatCircle(MACEDONIA, place(autoArc), 48), t0: t, ms: 1400, lift: 0.12, labels: [] }];
        }
      }
      wasActive = active;
      if (active) { advance(t, dt); draw(t); }
      last = t;
      requestAnimationFrame(frame);
    }

    const api = {
      settle({ lon = MACEDONIA[0], lat = 44, zoom = 1, cx = fcx0, cy = fcy0, ms = 1800, short = false } = {}) {
        if (reduce) { api.still({ lon, lat, zoom, cx, cy }); return; }
        // default: travel forward (the way it spins) at least 140 degrees, so the stop reads as a move;
        // short: take the shortest way round, so the stop lands quickly
        let d = (view.lon - lon) % 360;
        if (d < 0) d += 360;
        if (short) { if (d > 180) d -= 360; } else if (d < 140) d += 360;
        move = { t0: performance.now(), ms, lon: view.lon, d, toLon: view.lon - d, v0: velocity / 1000,
          lat: view.lat, toLat: lat, from: { zoom: view.zoom, cx: view.cx, cy: view.cy }, to: { zoom, cx, cy } };
        mode = 'settle';
      },
      still({ lon = MACEDONIA[0], lat = 44, zoom = 1, cx = fcx0, cy = fcy0 } = {}) {
        move = null; mode = 'still';
        Object.assign(view, { lon, lat, zoom, cx, cy });
      },
      arc(to, { ms = 1300, delay = 0, lift = 0.12, labels = [] } = {}) {
        arcs.push({ path: greatCircle(MACEDONIA, place(to), 64), t0: performance.now() + delay, ms: reduce ? 0 : ms, lift, labels });
      },
      clearArcs() { arcs = []; },
      reset() {
        arcs = []; move = null; mode = 'spin';
        Object.assign(view, home());
        boostT0 = performance.now();
        if (reduce) api.still({ lon: MACEDONIA[0] - 8, lat: lat00 });
      },
    };
    controllers.set(canvas, api);

    size();
    window.addEventListener('resize', size);
    if (reduce) { api.still({ lon: MACEDONIA[0] - 8, lat: lat00 }); }
    requestAnimationFrame(frame);
  }

  document.querySelectorAll('canvas[data-globe]').forEach(mount);
  window.ESGGlobe = { get: (canvas) => controllers.get(canvas), places: PLACES };
})();
