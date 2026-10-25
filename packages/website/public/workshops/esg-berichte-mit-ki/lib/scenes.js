/* scenes.js: the step engine of the Workshop 04 deck.
 *
 * Every frame is a pure function of (step, t), t in [0, 1] the progress into `step`. The markup
 * declares what moves; this file only computes numbers:
 *   data-step="k"          the element arrives with step k (opacity and a 10 px rise, see deck.css)
 *   data-win="a,b"         ...inside the window [a, b] of that step (stagger), eased, no overshoot
 *   data-out="k"           ...and leaves with step k (window data-out-win="a,b")
 *   data-fx="draw|line|move|fade|none"   how --p is drawn (deck.css)
 *   data-count="from,to,d" the text counts from `from` to `to` with d decimals as --p runs
 *   data-fill="n"          the first round(n * --p) children [data-cell] get data-on
 * --p is written on the element, data-off while --p is 0 (hidden from screen readers too).
 * A forward press plays t from 0 to 1 over the slide's data-durations; a backward press, a hash,
 * a reload, a presenter jump and reduced motion render t = 1 at once.
 *
 * The keys are the stage's (lib/deck-keys.js through lib/deck-stage.js); this file only answers
 * fragmentrequest, fragmentreset, deckreset and slidechange, and talks to the presenter view.
 */
(() => {
  'use strict';
  const root = document.documentElement;
  const LANG = String(root.lang || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
  const params = new URLSearchParams(window.location.search);
  const PREVIEW = params.has('preview');
  const EXPORT = params.get('export') === 'final';
  const stage = document.querySelector('deck-stage');
  if (!stage) return;

  const COPY = {
    de: { notice: 'Zurück am Anfang. Vorher: Folie {n}, Schritt {s}.', appendix: 'Anhang {n}', copied: 'Kopiert', failed: 'Bitte markieren und kopieren' },
    en: { notice: 'Back at the start. Before: slide {n}, step {s}.', appendix: 'appendix {n}', copied: 'Copied', failed: 'Select and copy, please' },
  }[LANG];

  /* ── pure frame ─────────────────────────────────────────────────────── */
  const clamp01 = (x) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);
  const ease = (x) => 1 - Math.pow(1 - clamp01(x), 3);
  const seg = (t, a, b) => ease((clamp01(t) - a) / (b - a || 1));
  const formats = {};
  const fmt = (value, digits) => (formats[digits] ??= new Intl.NumberFormat(LANG === 'de' ? 'de-DE' : 'en-GB', {
    minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: true,
  })).format(value);
  const pair = (text, fallback) => {
    const [a, b] = String(text || '').split(',').map(Number);
    return Number.isFinite(a) && Number.isFinite(b) && b > a ? [a, b] : fallback;
  };

  const partsCache = new WeakMap();
  function parts(slide) {
    let list = partsCache.get(slide);
    if (list) return list;
    list = [...slide.querySelectorAll('[data-step]')].map((el) => {
      const [a, b] = pair(el.dataset.win, [0, 1]);
      const out = el.dataset.out === undefined ? null : Number(el.dataset.out);
      const [oa, ob] = pair(el.dataset.outWin, [0, 0.5]);
      const count = el.dataset.count ? el.dataset.count.split(',').map(Number) : null;
      const fill = el.dataset.fill ? { n: Number(el.dataset.fill), cells: [...el.querySelectorAll('[data-cell]')] } : null;
      return { el, k: Number(el.dataset.step), a, b, out, oa, ob, count, fill };
    });
    partsCache.set(slide, list);
    return list;
  }

  /** --p of one element at (step, t): in by its step, out by its data-out step. */
  function progress(item, step, t) {
    const pin = step > item.k ? 1 : step < item.k ? 0 : seg(t, item.a, item.b);
    if (item.out === null) return pin;
    const pout = step > item.out ? 1 : step < item.out ? 0 : seg(t, item.oa, item.ob);
    return pin * (1 - pout);
  }

  function render(slide, step, t) {
    for (const item of parts(slide)) {
      const p = progress(item, step, t);
      item.el.style.setProperty('--p', p.toFixed(4));
      item.el.toggleAttribute('data-off', p <= 0);
      if (item.count) {
        const [from, to, digits = 0] = item.count;
        const factor = Math.pow(10, digits);
        item.el.textContent = fmt(Math.round((from + (to - from) * p) * factor) / factor, digits);
      }
      if (item.fill) {
        const on = Math.round(item.fill.n * p);
        item.fill.cells.forEach((cell, index) => cell.toggleAttribute('data-on', index < on));
      }
    }
    slide.setAttribute('data-view', String(step));
  }

  /* ── playback ───────────────────────────────────────────────────────── */
  const reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  let frame = 0;
  const durations = (slide) => String(slide.dataset.durations || '').split(',').map(Number);
  const total = (slide) => Number.parseInt(slide.dataset.stepTotal || '0', 10) || 0;
  const current = (slide) => Math.min(total(slide), Math.max(0, Number.parseInt(slide.dataset.stepCurrent || '0', 10) || 0));

  function stop() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  }

  function play(slide, step) {
    stop();
    const ms = durations(slide)[step];
    const duration = Number.isFinite(ms) ? ms : 900;
    if (reduced.matches || PREVIEW || EXPORT || duration <= 0) {
      render(slide, step, 1);
      return;
    }
    const start = performance.now();
    render(slide, step, 0);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      render(slide, step, t);
      frame = t < 1 ? window.requestAnimationFrame(tick) : 0;
    };
    frame = window.requestAnimationFrame(tick);
  }

  function settle(slide, step) {
    stop();
    slide.dataset.stepCurrent = String(step);
    render(slide, step, 1);
  }

  /* ── stage events ───────────────────────────────────────────────────── */
  let resetFrom = null;

  stage.addEventListener('slidechange', (event) => {
    const { slide, entry, reason } = event.detail;
    if (!slide) return;
    if (PREVIEW || EXPORT) {
      settle(slide, total(slide));
    } else {
      const step = current(slide);
      slide.dataset.stepCurrent = String(step);
      if (entry === 'forward' || reason === 'full-reset' || (reason === 'init' && step === 0)) play(slide, step);
      else settle(slide, step);
    }
    root.dataset.story = 'ready';
    if (reason !== 'full-reset' && reason !== 'presenter') resetFrom = null;
    postState();
  });

  stage.addEventListener('fragmentrequest', (event) => {
    const detail = event.detail;
    const slide = detail?.slide;
    if (!slide || detail.handled) return;
    const step = current(slide);
    if (detail.direction > 0 && step < total(slide)) {
      slide.dataset.stepCurrent = String(step + 1);
      play(slide, step + 1);
      detail.handled = true;
    } else if (detail.direction < 0 && step > 0) {
      settle(slide, step - 1);
      detail.handled = true;
    }
    if (detail.handled) {
      stage.syncHash();
      resetFrom = null;
      postState();
    }
  });

  stage.addEventListener('fragmentreset', (event) => {
    const slide = event.detail?.slide;
    if (!slide) return;
    settle(slide, 0);
    stage.syncHash();
    postState();
  });

  // r or Shift+R: every slide back to step 0, the cover plays its opening again. The old place is
  // named once, visibly and for screen readers, and the presenter view offers the way back.
  stage.addEventListener('deckreset', () => {
    const slide = stage.currentSlide;
    const from = slide ? { index: stage.index, step: current(slide) } : null;
    resetFrom = from && (from.index !== 0 || from.step !== 0) ? from : null;
    document.querySelectorAll('deck-stage > section.slide').forEach((section) => { section.dataset.stepCurrent = '0'; });
    if (resetFrom) notice(resetFrom);
    if (stage.index === 0 && stage.currentSlide) {
      play(stage.currentSlide, 0);
      stage.syncHash();
      postState();
    }
  });

  /* ── reset notice ───────────────────────────────────────────────────── */
  const box = document.createElement('div');
  box.className = 'deck-notice';
  box.setAttribute('role', 'status');
  box.setAttribute('aria-live', 'polite');
  document.body.appendChild(box);
  let noticeTimer = 0;

  function slideName(index) {
    const all = [...document.querySelectorAll('deck-stage > section.slide')];
    const slide = all[index];
    if (!slide) return String(index + 1);
    const kind = slide.dataset.kind === 'appendix' ? 'appendix' : 'main';
    const n = all.filter((s) => (s.dataset.kind === 'appendix' ? 'appendix' : 'main') === kind).indexOf(slide) + 1;
    return kind === 'appendix' ? COPY.appendix.replace('{n}', String(n)) : String(n);
  }

  function notice(from) {
    box.textContent = COPY.notice.replace('{n}', slideName(from.index)).replace('{s}', String(from.step));
    box.setAttribute('data-visible', '');
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => box.removeAttribute('data-visible'), 4000);
  }

  /* ── presenter view (lib/presenter.js) ──────────────────────────────── */
  const keys = window.DeckKeys;
  const deckId = (keys && keys.deckId()) || root.getAttribute('data-deck-id') || '';
  const channel = !PREVIEW && typeof BroadcastChannel !== 'undefined' && keys ? new BroadcastChannel(keys.presenterChannel(deckId)) : null;

  function postState() {
    if (!channel) return;
    const slide = stage.currentSlide;
    if (!slide) return;
    channel.postMessage({
      from: 'deck', type: 'state', index: stage.index, total: stage.length,
      label: slide.dataset.label || slide.id, step: current(slide), steps: total(slide),
      kind: slide.dataset.kind === 'appendix' ? 'appendix' : 'main', resetFrom,
    });
  }

  if (channel) {
    channel.onmessage = (event) => {
      const m = event.data || {};
      if (m.from !== 'presenter') return;
      if (m.type === 'hello') postState();
      else if (m.type === 'key') {
        if (m.key === 'ArrowRight') stage.fragment(1);
        else if (m.key === 'ArrowLeft') stage.fragment(-1);
        else if (m.key === 'R' || m.key === 'r') stage.fullReset();
        else if (m.key === 'Escape') stage.returnFromAppendix();
      } else if (m.type === 'goto' && Number.isInteger(m.index)) {
        stage.goTo(m.index, 'presenter');
        const slide = stage.currentSlide;
        if (slide && Number.isInteger(m.step)) {
          settle(slide, Math.min(total(slide), Math.max(0, m.step)));
          stage.syncHash();
        }
        resetFrom = null;
        postState();
      }
    };
  }

  // The presenter view's next-slide frame: { deckPreview: true, index } from the same origin.
  if (PREVIEW) {
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      const m = event.data || {};
      if (!m.deckPreview || !Number.isInteger(m.index)) return;
      stage.goTo(m.index, 'presenter');
      if (stage.currentSlide) settle(stage.currentSlide, total(stage.currentSlide));
    });
  }

  /* ── copy buttons on the prompt slides ──────────────────────────────── */
  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('button[data-copy]');
    if (!button) return;
    const source = document.getElementById(button.dataset.copy);
    if (!source) return;
    const label = button.querySelector('.copy__label') || button;
    const idle = button.dataset.idle || label.textContent;
    button.dataset.idle = idle;
    const done = (text) => {
      label.textContent = text;
      window.setTimeout(() => { label.textContent = idle; }, 1600);
    };
    if (event.detail > 0) button.blur();
    const text = source.textContent.replace(/\r/g, '');
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => done(COPY.copied), () => done(COPY.failed));
    else done(COPY.failed);
  });
})();
