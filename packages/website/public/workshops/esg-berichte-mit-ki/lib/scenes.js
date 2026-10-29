/* scenes.js: step engine of the workshop decks (source scripts/workshops/deck-engine/, synced by
 * sync-deck-engine.mjs). A frame is a pure function of (step, t); every [data-step] gets --p, drawn by
 * engine.css. Attributes: data-step data-win data-out data-out-win data-fx data-ease data-count
 * data-count-as data-count-unit data-count-at data-fill; polls: data-poll data-value data-poll-show data-poll-n. Back, jumps, reduced motion and
 * renderers that never tick render t = 1. Keys belong to the stage (deck-keys.js, deck-stage.js). */
(() => {
  'use strict';
  const root = document.documentElement;
  const LANG = String(root.lang || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
  const params = new URLSearchParams(window.location.search);
  const PREVIEW = params.has('preview');
  const EXPORT = params.get('export') === 'final';
  const stage = document.querySelector('deck-stage');
  if (!stage) return;
  const keys = window.DeckKeys;
  const deckId = (keys && keys.deckId()) || root.getAttribute('data-deck-id') || '';

  const COPY = {
    de: { notice: 'Zurück am Anfang. Vorher: Folie {n}, Schritt {s}.', appendix: 'Anhang {n}', copied: 'Kopiert', failed: 'Bitte markieren und kopieren' },
    en: { notice: 'Back at the start. Before: slide {n}, step {s}.', appendix: 'appendix {n}', copied: 'Copied', failed: 'Select and copy, please' },
  }[LANG];

  /* pure frame */
  const clamp01 = (x) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);
  const EASE = {
    out: (x) => 1 - Math.pow(1 - x, 3),
    linear: (x) => x,
    spring: (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2),
  };
  const SPRING_FX = /^(?:pop|fly|flip)$/;
  const seg = (t, a, b, e) => e(clamp01((clamp01(t) - a) / (b - a || 1)));
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
      const d = el.dataset;
      const [a, b] = pair(d.win, [0, 1]);
      const out = d.out === undefined ? null : Number(d.out);
      const [oa, ob] = pair(d.outWin, [0, 0.5]);
      const count = d.count ? d.count.split(',').map(Number) : null;
      const at = d.countAt ? d.countAt.split(',').map((x) => x.split(':').map(Number)) : null;
      const fill = d.fill ? { n: Number(d.fill), cells: [...el.querySelectorAll('[data-cell]:not([data-miss])')] } : null;
      const e = EASE[d.ease] || (SPRING_FX.test(d.fx || '') ? EASE.spring : EASE.out);
      return { el, k: Number(d.step), a, b, out, oa, ob, count, at, mss: d.countAs === 'mss', unit: d.countUnit || '', fill, e };
    });
    partsCache.set(slide, list);
    return list;
  }

  function progress(item, step, t) {
    const pin = step > item.k ? 1 : step < item.k ? 0 : seg(t, item.a, item.b, item.e);
    if (item.out === null) return pin;
    const pout = step > item.out ? 1 : step < item.out ? 0 : seg(t, item.oa, item.ob, EASE.out);
    return pin * (1 - pout);
  }

  function render(slide, step, t) {
    for (const item of parts(slide)) {
      const p = progress(item, step, t);
      const q = clamp01(p);
      item.el.style.setProperty('--p', p.toFixed(4));
      item.el.toggleAttribute('data-off', p <= 0);
      if (item.count) {
        const [from, to, digits = 0] = item.count;
        const factor = Math.pow(10, digits);
        // data-count-at="1:3,2:5": a value per press
        const at = (n) => item.at.reduce((v, [k, x]) => (k <= n ? x : v), from);
        const raw = item.at ? at(step - 1) + (at(step) - at(step - 1)) * seg(t, item.a, item.b, item.e) : from + (to - from) * q;
        const v = Math.round(raw * factor) / factor;
        // data-count-as="mss": seconds shown as m:ss (a measured duration, counting up)
        item.el.textContent = item.mss ? Math.floor(v / 60) + ':' + String(Math.round(v) % 60).padStart(2, '0') : fmt(v, digits) + item.unit;
      }
      if (item.fill) {
        const on = Math.round(item.fill.n * q);
        item.fill.cells.forEach((cell, index) => cell.toggleAttribute('data-on', index < on));
      }
    }
    slide.setAttribute('data-view', String(step));
  }

  /* playback */
  const reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  let frame = 0;
  let guard = 0;
  let playing = null;
  const durations = (slide) => String(slide.dataset.durations || '').split(',').map(Number);
  const total = (slide) => Number.parseInt(slide.dataset.stepTotal || '0', 10) || 0;
  const current = (slide) => Math.min(total(slide), Math.max(0, Number.parseInt(slide.dataset.stepCurrent || '0', 10) || 0));

  function stop() {
    if (frame) window.cancelAnimationFrame(frame);
    window.clearTimeout(guard);
    frame = 0;
    playing = null;
  }

  function finish() {
    const p = playing;
    stop();
    if (p) render(p.slide, p.step, 1);
  }

  function play(slide, step) {
    stop();
    const ms = durations(slide)[step];
    const duration = Number.isFinite(ms) ? ms : 900;
    if (reduced.matches || PREVIEW || EXPORT || duration <= 0 || document.visibilityState !== 'visible') {
      render(slide, step, 1);
      return;
    }
    const start = performance.now();
    let ticked = false;
    playing = { slide, step };
    render(slide, step, 0);
    const tick = (now) => {
      ticked = true;
      const t = Math.min(1, (now - start) / duration);
      render(slide, step, t);
      if (t < 1) frame = window.requestAnimationFrame(tick);
      else stop();
    };
    frame = window.requestAnimationFrame(tick);
    // A hidden or occluded renderer never ticks: show the step's final frame instead of a blank slide.
    guard = window.setTimeout(() => { if (!ticked) finish(); }, 120);
  }

  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') finish(); });

  function settle(slide, step) {
    stop();
    slide.dataset.stepCurrent = String(step);
    render(slide, step, 1);
  }

  /* room poll */
  const POLL = `deck:${deckId}:poll:`;
  const store = (fn) => { try { return fn(window.sessionStorage); } catch (_e) { return null; } };
  const votes = (name, value) => Number(store((s) => s.getItem(POLL + name + ':' + value))) || 0;

  function pollRender() {
    const groups = {};
    document.querySelectorAll('[data-poll][data-value], [data-poll-show] [data-value]').forEach((el) => {
      const name = el.dataset.poll || el.closest('[data-poll-show]').dataset.pollShow;
      (groups[name] ??= []).push(el);
    });
    for (const [name, list] of Object.entries(groups)) {
      const n = list.map((el) => votes(name, el.dataset.value));
      const max = Math.max(0, ...n);
      list.forEach((el, i) => {
        el.style.setProperty('--share', max ? (n[i] / max).toFixed(3) : '0');
        el.dataset.n = String(n[i]);
        el.toggleAttribute('data-lead', max > 0 && n[i] === max);
        el.querySelectorAll('[data-poll-n]').forEach((c) => { c.textContent = String(n[i]); });
      });
    }
  }

  function pollAdd(name, value) {
    if (PREVIEW || !name || value == null) return;
    store((s) => s.setItem(POLL + name + ':' + value, String(votes(name, value) + 1)));
    pollRender();
  }

  function pollClear() {
    store((s) => Object.keys(s).filter((k) => k.startsWith(POLL)).forEach((k) => s.removeItem(k)));
    pollRender();
  }

  document.querySelectorAll('[data-poll-show]').forEach((el) => el.setAttribute('aria-live', 'polite'));
  pollRender();

  /* stage events */
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

  // r or Shift+R: all slides to step 0, polls cleared, the old place named once.
  stage.addEventListener('deckreset', () => {
    const slide = stage.currentSlide;
    const from = slide ? { index: stage.index, step: current(slide) } : null;
    resetFrom = from && (from.index !== 0 || from.step !== 0) ? from : null;
    document.querySelectorAll('deck-stage > section.slide').forEach((section) => { section.dataset.stepCurrent = '0'; });
    pollClear();
    if (resetFrom) notice(resetFrom);
    if (stage.index === 0 && stage.currentSlide) {
      play(stage.currentSlide, 0);
      stage.syncHash();
      postState();
    }
  });

  /* reset notice */
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

  /* presenter view (lib/presenter.js) */
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
      else if (m.type === 'poll') pollAdd(String(m.name || ''), m.value == null ? null : String(m.value));
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

  // The presenter's next-slide frame: { deckPreview: true, index }, same origin.
  if (PREVIEW) {
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      const m = event.data || {};
      if (!m.deckPreview || !Number.isInteger(m.index)) return;
      stage.goTo(m.index, 'presenter');
      if (stage.currentSlide) settle(stage.currentSlide, total(stage.currentSlide));
    });
  }

  /* copy buttons and poll buttons */
  document.addEventListener('click', (event) => {
    const vote = event.target?.closest?.('button[data-poll][data-value]');
    if (vote) {
      if (event.detail > 0) vote.blur();
      pollAdd(vote.dataset.poll, vote.dataset.value);
      return;
    }
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
