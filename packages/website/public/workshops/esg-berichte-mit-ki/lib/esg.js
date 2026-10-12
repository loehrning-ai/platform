/* Workshop 04 deck behaviour: in-slide build steps, counters, typing, rolls, odometers, events,
 * copy buttons and chrome. Full reference with examples: _build/deck/DESIGN.md.
 *
 * Build steps: a slide with data-steps="N" holds N extra key presses. Elements with data-at="k"
 * get the class "on" once the slide's step reaches k; the slide carries data-step="k".
 * → / Space / PageDown advance a step before the deck moves on; ← / PageUp step back.
 * Arriving forward resets the slide to step 0, so its motion replays; arriving backward (←) shows
 * the finished slide at once, without motion.
 *
 * Counters: <span data-count="653.7" data-dec="1">0</span> counts up when it (or the data-at
 * element that owns it) turns on, or on arrival when it sits outside any data-at.
 * Typing: <code data-type>3_420_000 / (180_000 * 3.80)</code> types itself out the same way.
 * Odometer: <span data-odo="4.10">2.34</span> rolls every digit to the new value.
 * Rolling: <span data-roll="320.9 MWh">NOT FOUND</span> rolls to the new text (build steps only).
 * Stagger: children of [data-stagger] get --i = 0, 1, 2 ... for staggered delays.
 * Session clock: a slide with data-clock-start starts it on arrival, data-clock-stop stops it on
 * leaving it forward; any [data-clock] shows the running minutes and seconds. The clock lives in
 * localStorage, so a reload keeps it. ESG.clockMs() and ESG.clockStarted() read it.
 *
 * Events on document (detail.n is the slide's data-n, or its 1-based position):
 *   esg:enter {slide, n, index, step, steps, backward}   after the slide is set to its entry state
 *   esg:step  {slide, n, index, step, steps, backward}   after a key press changed the step
 *   esg:leave {slide, n, index}                          before the next slide enters
 *   esg:reset {slide, n, index, step: 0}                 a hidden slide was put back to step 0
 * Helpers on window.ESG: on(n, {enter, step, leave, state}), tween, ease, flip, reduce, current.
 */
(() => {
  const deck = document.querySelector('deck-stage');
  const slides = Array.from(deck.querySelectorAll(':scope > section'));
  const THREAD = ['Questionnaire', 'Claims', 'Bank', 'Passport', 'Update'];
  const FWD = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Spacebar']);
  const BACK = new Set(['ArrowLeft', 'ArrowUp', 'PageUp']);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // pacing budget (DESIGN.md "Pacing"): every helper below clamps to it, so a step settles in about 1.2 s
  const PACE = { move: 900, delay: 600 };
  let current = null;

  // reduced motion: Web Animations (el.animate) are not stopped by CSS, so finish them at once.
  // A finished animation without fill shows the element's own final style; onfinish handlers still run.
  if (reduce && typeof Element !== 'undefined' && Element.prototype.animate) {
    const native = Element.prototype.animate;
    Element.prototype.animate = function animateReduced(frames, opts) {
      const a = native.call(this, frames, opts);
      try { a.finish(); } catch { a.cancel(); }
      return a;
    };
  }

  const fmt = (v, dec) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const nOf = (slide) => parseInt(slide.dataset.n || '', 10) || slides.indexOf(slide) + 1;
  const stepsOf = (slide) => parseInt(slide.dataset.steps || '0', 10);
  const info = (slide) => ({ slide, n: nOf(slide), index: slides.indexOf(slide) });
  const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

  /* ── shared motion helpers ─────────────────────────────────────────────── */
  const ease = {
    linear: (t) => t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  };

  // tween(ms, fn, {ease, delay}): calls fn(p) with eased progress 0..1 every frame; returns cancel()
  function tween(ms, fn, opts = {}) {
    ms = Math.min(ms, PACE.move);
    const curve = typeof opts.ease === 'function' ? opts.ease : ease[opts.ease || 'out'];
    if (reduce || opts.instant || ms <= 0) { fn(1); return () => {}; }
    let raf = 0, alive = true;
    const t0 = performance.now() + Math.min(opts.delay || 0, PACE.delay);
    const tick = (now) => {
      if (!alive) return;
      const p = Math.min(1, Math.max(0, (now - t0) / ms));
      fn(curve(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }

  // flip(els, mutate, {ms, ease}): FLIP morph. Measure, run mutate(), then animate each element
  // from its old box to its new one with transforms only. Works inside the scaled deck canvas.
  function flip(els, mutate, opts = {}) {
    const list = Array.from(els);
    const scaleOf = (el) => {
      const s = el.closest('section');
      return s ? s.getBoundingClientRect().width / s.offsetWidth || 1 : 1;
    };
    const first = list.map((el) => el.getBoundingClientRect());
    mutate();
    if (reduce || opts.instant) return;
    list.forEach((el, i) => {
      const last = el.getBoundingClientRect();
      const s = scaleOf(el);
      const dx = (first[i].left - last.left) / s, dy = (first[i].top - last.top) / s;
      const sx = last.width ? first[i].width / last.width : 1, sy = last.height ? first[i].height / last.height : 1;
      if (!dx && !dy && sx === 1 && sy === 1) return;
      el.animate([
        { transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transformOrigin: '0 0', transform: 'none' },
      ], { duration: Math.min(opts.ms || 700, PACE.move), easing: opts.ease || 'cubic-bezier(.65,0,.35,1)',
        delay: Math.min((opts.delay || 0) + (opts.stagger || 0) * i, PACE.delay), fill: 'backwards' });
    });
  }

  /* ── value effects ─────────────────────────────────────────────────────── */
  function countUp(el, instant) {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || '0', 10);
    if (el._stop) el._stop();
    el._stop = tween(parseInt(el.dataset.ms || '700', 10), (p) => { el.textContent = fmt(target * p, dec); }, { instant });
  }

  function typeOut(el, instant) {
    const text = el.dataset.typeText || el.textContent;
    el.dataset.typeText = text;
    const token = (el._typeToken || 0) + 1;
    el._typeToken = token;
    if (reduce || instant) { el.textContent = text; return; }
    el.textContent = '';
    // the whole line types within PACE.move: long lines type faster, short ones keep their rhythm
    const per = Math.max(6, Math.min(parseInt(el.dataset.typeMs || '28', 10), PACE.move / Math.max(1, text.length)));
    const t0 = performance.now();
    let i = 0;
    const tick = () => {
      if (el._typeToken !== token) return;
      i = Math.min(text.length, Math.max(i + 1, Math.round((performance.now() - t0) / per)));
      el.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(tick, per);
    };
    tick();
  }

  function roll(el, instant) {
    if (!el.dataset.rollFrom) el.dataset.rollFrom = el.textContent;
    el.innerHTML = `<span class="roll"><span>${el.dataset.rollFrom}</span><span>${el.dataset.roll}</span></span>`;
    if (instant) { el.firstChild.classList.add('go'); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => el.firstChild && el.firstChild.classList.add('go')));
  }

  function unroll(el) {
    if (el.dataset.rollFrom) el.textContent = el.dataset.rollFrom;
  }

  // odometer: each digit is a column that scrolls from the old digit to the new one. Digits to the
  // right travel extra full turns, like a real counter. Other characters stay put.
  function odo(el, instant) {
    if (el.dataset.odoFrom == null) el.dataset.odoFrom = el.textContent.trim();
    const from = el.dataset.odoFrom, to = el.dataset.odo;
    const width = Math.max(from.length, to.length);
    const a = from.padStart(width, ' '), b = to.padStart(width, ' ');
    let html = '', k = 0;
    for (let i = 0; i < width; i += 1) {
      const cb = b[i];
      if (!/\d/.test(cb)) { html += cb === ' ' ? '' : `<span>${cb}</span>`; continue; }
      const start = /\d/.test(a[i]) ? +a[i] : 0;
      const steps = ((+cb - start + 10) % 10) + 10 * Math.min(2, k);
      const col = [];
      for (let s = 0; s <= steps; s += 1) col.push(`<span>${(start + s) % 10}</span>`);
      html += `<span class="odo-d"><span class="odo-s" style="--k:${k}" data-steps="${steps}">${col.join('')}</span></span>`;
      k += 1;
    }
    el.innerHTML = `<span class="odo">${html}</span>`;
    const go = () => el.querySelectorAll('.odo-s').forEach((s) => { s.style.transform = `translateY(-${s.dataset.steps}em)`; });
    if (instant || reduce) {
      el.querySelectorAll('.odo-s').forEach((s) => { s.style.transition = 'none'; });
      go();
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(go));
  }

  function unodo(el) {
    if (el.dataset.odoFrom != null) el.textContent = el.dataset.odoFrom;
  }

  // the effects an element owns: itself, plus descendants whose nearest data-at is this element
  function owned(el, sel) {
    const found = Array.from(el.querySelectorAll(sel)).filter((x) => x.closest('[data-at]') === el);
    return el.matches(sel) ? [el, ...found] : found;
  }

  function activate(el, instant) {
    owned(el, '[data-count]').forEach((x) => countUp(x, instant));
    owned(el, '[data-type]').forEach((x) => typeOut(x, instant));
    owned(el, '[data-roll]').forEach((x) => roll(x, instant));
    owned(el, '[data-odo]').forEach((x) => odo(x, instant));
  }

  function deactivate(el) {
    owned(el, '[data-roll]').forEach(unroll);
    owned(el, '[data-odo]').forEach(unodo);
  }

  /* ── session clock ─────────────────────────────────────────────────────── */
  // Wall-clock based and kept in localStorage, so a reload or a crash during the hands-on does not
  // reset it. A forward arrival on the data-clock-start slide starts a fresh run when none is going.
  const CLOCK_KEY = 'esg04-clock';
  const clock = { start: 0, total: 0, running: false };
  try {
    const saved = JSON.parse(localStorage.getItem(CLOCK_KEY) || 'null');
    if (saved && typeof saved.total === 'number') Object.assign(clock, saved);
  } catch { /* storage blocked: the clock just starts fresh */ }
  const saveClock = () => { try { localStorage.setItem(CLOCK_KEY, JSON.stringify(clock)); } catch { /* ignore */ } };
  const clockMs = () => clock.total + (clock.running ? Date.now() - clock.start : 0);
  const clockStarted = () => clock.running || clock.total > 0;
  function clockText() {
    const ms = clockMs();
    const m = Math.floor(ms / 60000), sec = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }
  setInterval(() => document.querySelectorAll('[data-clock]').forEach((el) => { el.textContent = clockText(); }), 500);

  /* ── steps ─────────────────────────────────────────────────────────────── */
  function render(slide, step, instant = false) {
    slide.dataset.step = String(step);
    const snapped = [];
    slide.querySelectorAll('[data-at]').forEach((el) => {
      const on = step >= parseInt(el.dataset.at, 10);
      const was = el.classList.contains('on');
      if (on === was) return;
      if (instant) { el.classList.add('esg-snap'); snapped.push(el); }
      el.classList.toggle('on', on);
      if (on) activate(el, instant); else deactivate(el);
    });
    if (snapped.length) {
      void slide.offsetWidth; // commit the new state while transitions are off
      snapped.forEach((el) => el.classList.remove('esg-snap'));
    }
  }

  // reset(slide): put a slide back to step 0 without motion while it is hidden, so the next forward
  // arrival never shows the previous visit un-building itself. State hooks get esg:reset.
  function reset(slide) {
    if (slide === current) return;
    slide.classList.add('esg-snap');
    render(slide, 0, true);
    emit('esg:reset', { ...info(slide), step: 0, steps: stepsOf(slide), backward: false });
    void slide.offsetWidth;
    slide.classList.remove('esg-snap');
  }

  function enter(slide, back = false) {
    if (current && current !== slide) {
      const old = current;
      emit('esg:leave', info(old));
      // stop the clock only when the stop slide is left forward
      if (old.hasAttribute('data-clock-stop') && clock.running && !back) {
        clock.total += Date.now() - clock.start; clock.running = false; saveClock();
      }
      setTimeout(() => reset(old), 60);
    }
    if (slide.hasAttribute('data-clock-start') && !clock.running && !back) {
      clock.start = Date.now(); clock.total = 0; clock.running = true; saveClock();
    }
    current = slide;
    const steps = stepsOf(slide);
    const step = back ? steps : 0;
    // backward: the whole slide jumps to its finished state, arrival transitions included
    if (back) slide.classList.add('esg-snap');
    render(slide, step, true);
    // counters, typing and odometers outside any build step run on arrival
    slide.querySelectorAll('[data-count], [data-type], [data-odo]').forEach((el) => {
      if (el.closest('[data-at]')) return;
      if (el.hasAttribute('data-count')) countUp(el, back);
      if (el.hasAttribute('data-type')) typeOut(el, back);
      if (el.hasAttribute('data-odo')) odo(el, back);
    });
    if (back) {
      void slide.offsetWidth;
      slide.classList.remove('esg-snap');
    }
    emit('esg:enter', { ...info(slide), step, steps, backward: back });
  }

  deck.addEventListener('slidechange', (e) => enter(e.detail.slide, e.detail.previousIndex > e.detail.index));
  // the deck may have mounted (and fired its init event) before this script ran
  // On page load the first slide is active before its first paint, so its arrival transitions would
  // not run; toggling the attribute once (inside one task, never painted) lets them play.
  requestAnimationFrame(() => {
    const first = current || deck.querySelector(':scope > section[data-deck-active]') || slides[0];
    first.classList.add('esg-snap');
    first.removeAttribute('data-deck-active');
    void first.offsetWidth; // commit the hidden arrival state without motion
    first.classList.remove('esg-snap');
    first.setAttribute('data-deck-active', '');
    // every other slide starts at step 0 with its state hooks run once, so a first arrival is clean
    slides.forEach((s) => { if (s !== first) reset(s); });
    if (!current) enter(first);
  });

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || !current) return;
    const max = stepsOf(current);
    const step = parseInt(current.dataset.step || '0', 10);
    let next;
    if (FWD.has(e.key) && step < max) next = step + 1;
    else if (BACK.has(e.key) && step > 0) next = step - 1;
    else return;
    e.preventDefault();
    e.stopImmediatePropagation();
    render(current, next);
    emit('esg:step', { ...info(current), step: next, steps: max, backward: next < step });
  }, { capture: true });

  /* ── stagger indices ───────────────────────────────────────────────────── */
  document.querySelectorAll('[data-stagger]').forEach((box) => {
    Array.from(box.children).forEach((child, i) => {
      if (!child.style.getPropertyValue('--i')) child.style.setProperty('--i', String(i));
    });
  });

  /* ── prompt text: file names never break at their hyphens ──────────────── */
  // Wraps tokens like esg-passport.docx or inbox/1-nordvik-questionnaire.md in <span class="fn">
  // (white-space: nowrap). textContent, the copy payload and verify_course.py parity stay identical.
  const FILE = /[\w./-]*\w\.(?:md|csv|docx|xlsx|png|txt|pdf|json|html)\b/g;
  document.querySelectorAll('.prompt, .pc-body').forEach((box) => {
    const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (!walker.currentNode.parentElement.closest('.fn')) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const text = node.nodeValue;
      FILE.lastIndex = 0;
      if (!FILE.test(text)) return;
      FILE.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0, m;
      while ((m = FILE.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const span = document.createElement('span');
        span.className = 'fn';
        span.textContent = m[0];
        frag.appendChild(span);
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  });

  /* ── interactions kept from v1 ─────────────────────────────────────────── */
  // claim cards flip on click as well as by build step
  document.querySelectorAll('.claim').forEach((card) => {
    card.addEventListener('click', () => card.classList.toggle('flip'));
  });

  // copy buttons on prompt cards
  document.querySelectorAll('.prompt-card').forEach((card) => {
    const btn = card.querySelector('.pc-copy');
    const body = card.querySelector('.pc-body');
    if (!btn || !body) return;
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(body.textContent.trim());
        btn.textContent = 'Copied';
        btn.classList.add('done');
      } catch {
        btn.textContent = 'Select and copy';
      }
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('done'); }, 1600);
    });
  });

  /* ── chrome: brand, red-thread rail and page number on every slide ─────── */
  const total = parseInt(deck.dataset.total || '', 10) || slides.length;
  slides.forEach((slide) => {
    if (slide.hasAttribute('data-no-chrome')) return;
    const at = parseInt(slide.dataset.thread || '0', 10);
    // the rail is born on slide 9 (data-rail) and lives on the hands-on slides (data-thread)
    const hasRail = slide.hasAttribute('data-thread') || slide.hasAttribute('data-rail');
    const rail = !hasRail ? '' : THREAD.map((name, k) => {
      const state = k + 1 < at ? 'done' : k + 1 === at ? 'now' : '';
      return `<span class="rail-i ${state}"><b>${k + 1}</b>${name}</span>`;
    }).join('');
    // the fiction line lives in the footer (22px, left of the page number): data-fiction="text" on the
    // section, or a fragment's own <p class="...-fict"> which is moved here so it never collides
    const own = slide.querySelector(':scope > p[class$="-fict"], :scope > p.fict');
    const fict = slide.dataset.fiction || (own ? own.textContent.trim() : '');
    if (own) own.remove();
    const chrome = document.createElement('div');
    chrome.className = 'chrome';
    chrome.innerHTML =
      `<div class="chrome__topbar"><span class="brand"><span class="markdot"></span>loehrning.ai · Workshop 04</span>` +
      `<span class="rail">${rail}</span></div><div class="chrome__topline"></div>` +
      `<div class="chrome__footer"><span class="fleft"><span class="mini-rule"></span>${slide.dataset.label || ''}</span>` +
      (fict ? `<span class="chrome__fict">${fict}</span>` : '') +
      `<span class="page">${String(nOf(slide)).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span></div>`;
    slide.prepend(chrome);
  });

  /* ── public helpers ────────────────────────────────────────────────────── */
  // on(n, {enter, step, leave, reset, state}): per-slide hooks. state(step, detail) runs on enter and on
  // every step, with detail.instant = true on entry, so one function can own a canvas or SVG.
  function on(n, hooks) {
    const mine = (fn) => (e) => { if (e.detail.n === n) fn(e.detail); };
    if (hooks.enter) document.addEventListener('esg:enter', mine(hooks.enter));
    if (hooks.step) document.addEventListener('esg:step', mine(hooks.step));
    if (hooks.leave) document.addEventListener('esg:leave', mine(hooks.leave));
    if (hooks.reset) document.addEventListener('esg:reset', mine(hooks.reset));
    if (hooks.state) {
      document.addEventListener('esg:enter', mine((d) => hooks.state(d.step, { ...d, instant: true })));
      document.addEventListener('esg:step', mine((d) => hooks.state(d.step, { ...d, instant: false })));
      document.addEventListener('esg:reset', mine((d) => hooks.state(0, { ...d, instant: true, reset: true })));
    }
  }

  // audit(slide): what breaks the BAR on a slide's current state. Text below 24px (22px in the chrome),
  // transitions longer than PACE.move or delayed beyond PACE.delay. Used by _build/deck/audit (shoot tool).
  function audit(slide = current) {
    const out = [];
    const ms = (v) => v.split(',').map((x) => parseFloat(x) * (x.trim().endsWith('ms') ? 1 : 1000));
    // the stage scales the 1920 x 1080 canvas to the window; text that a transform shrinks
    // (scaled clones, miniatures) counts at its rendered size, measured against that stage scale
    const stage = slide.offsetWidth ? slide.getBoundingClientRect().width / slide.offsetWidth : 1;
    // invisible because an ancestor is transparent (a hidden panel, a card not yet built)
    const hiddenUp = (el) => { for (let e = el.parentElement; e && e !== slide; e = e.parentElement) { if (parseFloat(getComputedStyle(e).opacity) < 0.05) return true; } return false; };
    slide.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el);
      const own = Array.from(el.childNodes).some((c) => c.nodeType === 3 && c.nodeValue.trim());
      const r = el.getBoundingClientRect();
      // a transform that shrinks text counts (offsetWidth is rounded, so ignore the last 3 %)
      const raw = el.offsetWidth && stage ? (r.width / el.offsetWidth) / stage : 1;
      const scale = raw < 0.97 ? raw : 1;
      // aria-hidden pictograms are skipped unless a transform shrinks their text (a scaled clone is still read)
      const skip = el.closest('svg') || (el.closest('[aria-hidden="true"]') && scale === 1) || (own && hiddenUp(el));
      if (own && r.width && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05 && !skip) {
        const floor = el.closest('.chrome') ? 22 : 24;
        const px = Math.round(parseFloat(cs.fontSize) * scale * 10) / 10;
        if (px < floor - 0.1) out.push({ kind: 'font', px, cls: typeof el.className === 'string' ? el.className : '', text: el.textContent.trim().slice(0, 40) });
      }
      const d = ms(cs.transitionDuration), dl = ms(cs.transitionDelay);
      const worstD = Math.max(...d), worstDl = Math.max(...dl);
      if ((worstD > PACE.move || worstDl > PACE.delay) && cs.transitionProperty !== 'none' && worstD > 0) {
        out.push({ kind: 'pace', dur: worstD, delay: worstDl, cls: typeof el.className === 'string' ? el.className : '' });
      }
    });
    return out;
  }

  window.ESG = { on, tween, ease, flip, reduce, current: () => current, slides, clockMs, clockStarted, audit, PACE };
})();
