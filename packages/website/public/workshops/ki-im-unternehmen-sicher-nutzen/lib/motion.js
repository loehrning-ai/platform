/* Workshop 05 deck engine. Vanilla, no library, no network.
 *
 * Steps:   <section data-steps="N"> holds N extra key presses. Elements with class "step" and data-step="k" appear at step k
 *          (data-until="m" removes them after step m). The slide carries data-s="k" so CSS can key on [data-s="2"].
 *          Right arrow, Space, PageDown or a click on empty slide area goes one step; left arrow goes back.
 *          Arriving forward starts at step 0; arriving backward shows the finished slide at once.
 * Hooks:   DECK.on("05", { enter(d), state(step, d), leave(d) }); d = { slide, n, step, steps, instant, backward, reset }.
 * Tally:   [data-tally="id:option"] buttons count +1 on click or on their data-key, -1 on Alt-click, Backspace undoes the last.
 *          [data-bar="id:option"] scales to its share, [data-val="id:option"] shows the count. Counts live in one object.
 * Route:   .route[data-stop] on a slide: the dot slides from the previous stop to this one.
 * Helpers: DECK.spring, DECK.flip, DECK.type, DECK.reduce, DECK.scaleOf.
 */
(() => {
  'use strict';
  const root = document.documentElement;
  const deck = document.querySelector('deck-stage');
  if (!deck) return;
  const reduce = !window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  root.classList.add('deck-js');
  if (!reduce) root.classList.add('motion');

  const slides = Array.from(deck.querySelectorAll(':scope > section'));
  const hooks = new Map();
  let current = null;

  const nOf = (s) => s.dataset.n;
  const stepsOf = (s) => parseInt(s.dataset.steps || '0', 10);
  const stepNow = (s) => parseInt(s.dataset.s || '0', 10);
  const scaleOf = (s) => (s && s.offsetWidth ? s.getBoundingClientRect().width / s.offsetWidth : 1) || 1;

  /* ── steps ─────────────────────────────────────────────────────────────── */
  function render(slide, step, instant) {
    if (instant) slide.classList.add('snap');
    slide.dataset.s = String(step);
    slide.querySelectorAll('.step').forEach((el) => {
      const from = parseInt(el.dataset.step || '1', 10);
      const until = el.dataset.until == null ? Infinity : parseInt(el.dataset.until, 10);
      el.classList.toggle('is-in', step >= from && step <= until);
      el.classList.toggle('is-gone', step > until);
      el.classList.toggle('is-pre', step < from);
    });
    if (instant) { void slide.offsetWidth; slide.classList.remove('snap'); }
  }

  function call(slide, kind, step, extra) {
    const list = hooks.get(nOf(slide));
    if (!list) return;
    const d = Object.assign({ slide, n: nOf(slide), step, steps: stepsOf(slide), instant: false, backward: false, reset: false }, extra);
    list.forEach((h) => { if (h[kind]) h[kind](kind === 'state' ? step : d, d); });
  }

  function setStep(slide, step, extra) {
    const prev = stepNow(slide);
    render(slide, step, !!(extra && extra.instant));
    call(slide, 'state', step, Object.assign({ backward: step < prev }, extra));
  }

  function resetSlide(slide) {
    if (slide === current) return;
    render(slide, 0, true);
    call(slide, 'state', 0, { instant: true, reset: true });
  }

  /* ── route bar ─────────────────────────────────────────────────────────── */
  let routeFrom = -1;
  function routeEnter(slide) {
    const r = slide.querySelector('.route');
    if (!r) { routeFrom = -1; return; }
    const to = parseInt(r.dataset.stop, 10);
    const stops = Array.from(r.querySelectorAll('.route-stop'));
    const dot = r.querySelector('.route-dot');
    const xOf = (i) => stops[i].offsetLeft + stops[i].offsetWidth / 2 - dot.offsetWidth / 2;
    stops.forEach((s, i) => { s.classList.toggle('done', i < to); s.classList.toggle('now', i === to); s.classList.remove('pulse'); });
    const from = routeFrom < 0 ? to : routeFrom;
    dot.style.transition = 'none';
    dot.style.setProperty('--x', xOf(from) + 'px');
    void dot.offsetWidth;
    dot.style.transition = '';
    dot.style.setProperty('--x', xOf(to) + 'px');
    if (!reduce) setTimeout(() => stops[to] && stops[to].classList.add('pulse'), from === to ? 0 : 560);
    routeFrom = to;
  }

  /* ── slide lifecycle ───────────────────────────────────────────────────── */
  function enter(slide, backward) {
    if (current && current !== slide) {
      const old = current;
      call(old, 'leave', stepNow(old), {});
      setTimeout(() => resetSlide(old), 80);
    }
    current = slide;
    const step = backward ? stepsOf(slide) : 0;
    render(slide, step, true);
    routeEnter(slide);
    call(slide, 'enter', step, { instant: true, backward });
    call(slide, 'state', step, { instant: true, backward });
  }

  deck.addEventListener('slidechange', (e) => enter(e.detail.slide, e.detail.previousIndex > e.detail.index));

  /* ── keyboard ──────────────────────────────────────────────────────────── */
  const FWD = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Spacebar']);
  const BACK = new Set(['ArrowLeft', 'ArrowUp', 'PageUp']);

  function liveButton(slide, key) {
    const list = Array.from(slide.querySelectorAll('[data-tally][data-key="' + key + '"]')).filter((b) =>
      !b.closest('.step:not(.is-in)') && !b.closest('.is-gone') && b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden');
    return list[list.length - 1] || null;
  }

  let mouseBtn = null;
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || !current) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const onButton = t && t.tagName === 'BUTTON' && t !== mouseBtn;
    if ((e.key === ' ' || e.key === 'Enter') && onButton) { e.stopImmediatePropagation(); return; }
    if (e.key === 'Backspace') { undo(); e.preventDefault(); return; }
    if (e.key.length === 1 && !e.shiftKey && /[a-z]/i.test(e.key)) {
      const b = liveButton(current, e.key.toLowerCase());
      if (b) { bump(b.dataset.tally, 1, b); e.preventDefault(); e.stopImmediatePropagation(); }
      return;
    }
    const max = stepsOf(current), st = stepNow(current);
    let next = null;
    if (FWD.has(e.key) && st < max) next = st + 1;
    else if (BACK.has(e.key) && st > 0) next = st - 1;
    if (next === null) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    setStep(current, next, {});
  }, { capture: true });

  deck.addEventListener('click', (e) => {
    if (!current || e.target.closest('button, a, input, textarea, select, [data-drag], [data-no-advance]')) return;
    const st = stepNow(current);
    if (st < stepsOf(current)) setStep(current, st + 1, {});
  });

  // touch: the deck's tap zones go one slide at a time; route them through the key handler so steps work too
  const sr = deck.shadowRoot;
  if (sr) {
    [['.tapzone--fwd', 'ArrowRight'], ['.tapzone--back', 'ArrowLeft']].forEach(([sel, key]) => {
      const el = sr.querySelector(sel);
      if (!el) return;
      const c = el.cloneNode(true);
      el.replaceWith(c);
      c.addEventListener('click', (ev) => { ev.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); });
    });
  }

  /* ── tally ─────────────────────────────────────────────────────────────── */
  const T = Object.create(null);
  const hist = [];
  const tallyListeners = [];
  function paintTally(id) {
    const els = Array.from(document.querySelectorAll('[data-tally^="' + id + ':"], [data-bar^="' + id + ':"], [data-val^="' + id + ':"]'));
    const keyOf = (el) => el.dataset.tally || el.dataset.bar || el.dataset.val;
    const opts = new Set(els.map(keyOf));
    let total = 0;
    opts.forEach((k) => { total += T[k] || 0; });
    els.forEach((el) => {
      const k = keyOf(el), n = T[k] || 0;
      if (el.dataset.bar) el.style.setProperty('--share', total ? (n / total).toFixed(4) : '0');
      if (el.dataset.val) el.textContent = String(n);
      if (el.dataset.tally) {
        const out = el.querySelector('[data-n]');
        if (out) out.textContent = String(n);
        el.classList.toggle('has', n > 0);
      }
    });
    document.querySelectorAll('[data-total-of="' + id + '"]').forEach((el) => { el.textContent = String(total); });
    tallyListeners.forEach((fn) => fn(id, T));
  }
  function bump(key, d, el, quiet) {
    const next = Math.max(0, (T[key] || 0) + d);
    if (next === (T[key] || 0)) return;
    T[key] = next;
    if (!quiet) hist.push([key, d]);
    paintTally(key.split(':')[0]);
    if (el && !reduce) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  }
  function undo() {
    const last = hist.pop();
    if (last) bump(last[0], -last[1], null, true);
  }
  // a button clicked with the mouse gives its focus back, so Space and Enter on a clicker keep stepping the deck
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn && e.detail > 0) { mouseBtn = btn; setTimeout(() => btn.blur(), 0); }
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tally]');
    if (b && !b.hasAttribute('data-drop-only')) bump(b.dataset.tally, e.altKey ? -1 : 1, b);
  });
  const tallyIds = new Set();
  document.querySelectorAll('[data-tally], [data-bar], [data-val]').forEach((el) => tallyIds.add((el.dataset.tally || el.dataset.bar || el.dataset.val).split(':')[0]));
  tallyIds.forEach(paintTally);

  /* ── copy buttons ──────────────────────────────────────────────────────── */
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const label = btn.textContent;
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const card = btn.closest('.pcard');
      const text = btn.dataset.copyText != null ? btn.dataset.copyText : card.querySelector('.pc-body').textContent.replace(/\s+/g, ' ').trim();
      let ok = true;
      try { await navigator.clipboard.writeText(text); } catch {
        try {
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove();
        } catch { ok = false; }
      }
      btn.textContent = ok ? 'Copied' : 'Select and copy';
      btn.classList.add('done');
      setTimeout(() => { btn.textContent = label; btn.classList.remove('done'); }, 1700);
    });
  });

  /* ── pointer depth ─────────────────────────────────────────────────────── */
  if (!reduce) {
    let raf = 0, px = 0, py = 0;
    window.addEventListener('pointermove', (e) => {
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; deck.style.setProperty('--px', px.toFixed(3)); deck.style.setProperty('--py', py.toFixed(3)); });
    }, { passive: true });
  }

  /* ── kinetic type: every .w inside [data-split] becomes characters ─────── */
  document.querySelectorAll('[data-split]').forEach((el) => {
    let i = 0;
    el.querySelectorAll('.w').forEach((w) => {
      const text = w.textContent;
      w.textContent = '';
      for (const ch of text) {
        const c = document.createElement('span');
        c.className = 'c';
        c.setAttribute('aria-hidden', 'true');
        c.style.setProperty('--i', String(i++));
        c.textContent = ch;
        w.appendChild(c);
      }
      i += 1;
    });
  });
  document.querySelectorAll('[data-stagger]').forEach((box) => {
    Array.from(box.children).forEach((child, i) => child.style.setProperty('--i', String(i)));
  });

  /* ── helpers for slide scripts ─────────────────────────────────────────── */
  const typers = new WeakMap();
  function type(el, text, ms, done) {
    const tok = (typers.get(el) || 0) + 1;
    typers.set(el, tok);
    if (reduce || !text) { el.textContent = text || ''; if (done) done(); return; }
    el.textContent = '';
    let i = 0;
    const tick = () => {
      if (typers.get(el) !== tok) return;
      i += 1;
      el.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(tick, ms || 20); else if (done) done();
    };
    setTimeout(tick, ms || 20);
  }

  function spring(el, o) {
    const cfg = Object.assign({ k: 230, c: 19 }, o);
    const s = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, rot: 0, raf: 0, t: 0, k: cfg.k, c: cfg.c };
    const paint = () => { el.style.transform = 'translate3d(' + s.x.toFixed(2) + 'px,' + s.y.toFixed(2) + 'px,0) rotate(' + s.rot.toFixed(2) + 'deg)'; };
    const tick = (now) => {
      const dt = Math.min(0.032, (now - s.t) / 1000 || 0.016);
      s.t = now;
      s.vx += (s.k * (s.tx - s.x) - s.c * s.vx) * dt;
      s.vy += (s.k * (s.ty - s.y) - s.c * s.vy) * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += (Math.max(-9, Math.min(9, s.vx * 0.012)) - s.rot) * 0.25;
      paint();
      const rest = Math.abs(s.vx) + Math.abs(s.vy) < 4 && Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) < 0.6;
      if (rest) { s.x = s.tx; s.y = s.ty; s.vx = s.vy = 0; s.rot = 0; paint(); s.raf = 0; } else s.raf = requestAnimationFrame(tick);
    };
    return {
      to(x, y, k, c) {
        s.tx = x; s.ty = y; s.k = k || cfg.k; s.c = c || cfg.c;
        if (reduce) { s.x = x; s.y = y; s.vx = s.vy = 0; s.rot = 0; paint(); return; }
        if (!s.raf) { s.t = performance.now(); s.raf = requestAnimationFrame(tick); }
      },
      get x() { return s.x; },
      get y() { return s.y; },
    };
  }

  function flip(el, mutate, o) {
    const cfg = Object.assign({ ms: 560, ease: 'cubic-bezier(.65,0,.35,1)' }, o);
    const sc = scaleOf(el.closest('section'));
    const a = el.getBoundingClientRect();
    mutate();
    if (reduce) return null;
    const b = el.getBoundingClientRect();
    const dx = (a.left - b.left) / sc, dy = (a.top - b.top) / sc;
    const sx = b.width ? a.width / b.width : 1, sy = b.height ? a.height / b.height : 1;
    return el.animate([
      { transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
      { transformOrigin: '0 0', transform: 'none' },
    ], { duration: cfg.ms, easing: cfg.ease });
  }

  function on(n, h) {
    const key = String(n);
    if (!hooks.has(key)) hooks.set(key, []);
    hooks.get(key).push(h);
  }

  window.DECK = {
    on, spring, flip, type, reduce, scaleOf, slides,
    current: () => current,
    tally: { get: (k) => T[k] || 0, bump, paint: paintTally, onChange: (fn) => tallyListeners.push(fn) },
  };

  /* ── start: wait for the deck to mount and the fonts to load, then replay the cover's arrival once ── */
  function start() {
    const first = deck.querySelector(':scope > section[data-deck-active]') || slides[0];
    if (!current) enter(first, false);
    slides.forEach((s) => { if (s !== current) resetSlide(s); });
    const retrigger = () => {
      if (current !== first) return;
      first.removeAttribute('data-deck-active');
      void first.offsetWidth;
      first.setAttribute('data-deck-active', '');
    };
    const fonts = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
    fonts.then(retrigger);
  }
  requestAnimationFrame(start);
})();
