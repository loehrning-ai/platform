/* deck-stage.js: the runtime of the Workshop 05 deck (both editions).
 *
 * Keys come from lib/deck-keys.js, the one contract of every workshop deck:
 *   ArrowRight next build step, then the next main slide (never into the appendix)
 *   ArrowLeft  previous step; at step 0 the previous slide at its last step
 *   r, Shift+R the cover, step 0: votes, timers and the remembered slide cleared
 *   P          the presenter view (presenter.html?deck=<this edition>)
 *   Escape     leaves the appendix, back to the slide and step it was opened from
 *
 * Motion is a pure function of (slide, step, t): an element with data-from="k" gets --p, 0 to 1, from the
 * step's t; lib/scenes.js draws what CSS cannot. t runs 0 to 1 once per press; going back, reduced motion,
 * ?preview=1 (the presenter's next-slide frame) and ?seek=<n>:<step>:<t> render t directly.
 * Hash: #<slide id>/<step>. Votes and timers live in memory only.
 */
(function () {
  'use strict';

  var K = window.DeckKeys;
  var doc = document.documentElement;
  var ID = K.deckId(document);
  var RUNTIME = JSON.parse(document.getElementById('deck-ui').textContent);
  var UI = RUNTIME.ui;
  var params = new URLSearchParams(location.search);
  var PREVIEW = params.has('preview');
  var SEEK = params.get('seek');
  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var stage = document.querySelector('deck-stage');
  var slides = Array.prototype.slice.call(stage.children).filter(function (el) { return el.tagName === 'SECTION'; });
  var STEP_MS = 900;

  var POS_KEY = K.storageKey(ID, 'position');
  var RETURN_KEY = K.storageKey(ID, 'appendix-return');
  function store(kind) { try { return window[kind]; } catch (e) { return null; } }
  function get(kind, key) { var s = store(kind); try { return s ? s.getItem(key) : null; } catch (e) { return null; } }
  function set(kind, key, value) { var s = store(kind); try { if (s) { if (value === null) s.removeItem(key); else s.setItem(key, value); } } catch (e) { /* storage off */ } }

  var pos = { index: 0, step: 0 };
  var anim = 0;
  var tallies = {};
  var timers = {};

  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (v) { v = clamp(v); return 1 - Math.pow(1 - v, 3); };
  var stepsOf = function (i) { return parseInt(slides[i].getAttribute('data-steps') || '0', 10); };
  var kindOf = function (i) { return slides[i].getAttribute('data-kind') || 'main'; };
  var isMain = function (i) { return kindOf(i) === 'main'; };
  var indexOfId = function (id) { for (var i = 0; i < slides.length; i += 1) if (slides[i].id === id) return i; return -1; };
  var fill = function (text, vars) { return String(text).replace(/\{(\w+)\}/g, function (m, k) { return k in vars ? vars[k] : m; }); };

  /* ── fit: one 1920 × 1080 stage scaled into the window ── */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    doc.style.setProperty('--deck-scale', String(s));
  }

  /* ── drawing a frame ── */
  function progressFor(el, step, t) {
    var from = parseInt(el.getAttribute('data-from'), 10);
    var until = el.hasAttribute('data-until') ? parseInt(el.getAttribute('data-until'), 10) : Infinity;
    var delay = parseFloat(el.getAttribute('data-delay') || '0');
    var span = parseFloat(el.getAttribute('data-span') || String(1 - delay));
    if (span <= 0) span = 0.001;
    var local = ease((t - delay) / span);
    if (step > until + 1) return 0;
    if (step === until + 1) return 1 - ease(t / 0.35);
    if (step > from) return 1;
    if (step === from) return local;
    return 0;
  }

  function drawSlide(i, step, t) {
    var el = slides[i];
    var shown = el.querySelectorAll('[data-from]');
    for (var k = 0; k < shown.length; k += 1) {
      var node = shown[k];
      var p = progressFor(node, step, t);
      node.style.setProperty('--p', p.toFixed(4));
      var off = p < 0.001;
      if (off !== node.hasAttribute('data-off')) {
        if (off) { node.setAttribute('data-off', ''); node.setAttribute('aria-hidden', 'true'); node.inert = true; }
        else { node.removeAttribute('data-off'); node.removeAttribute('aria-hidden'); node.inert = false; }
      }
    }
    var typed = el.querySelectorAll('.typed[data-full]');
    for (var j = 0; j < typed.length; j += 1) {
      var full = typed[j].getAttribute('data-full');
      var holder = typed[j].closest('[data-from]');
      var tp;
      if (typed[j].hasAttribute('data-type-step')) {
        var ts = parseInt(typed[j].getAttribute('data-type-step'), 10);
        tp = step > ts ? 1 : step === ts ? clamp(t / 0.7) : 0;
      } else {
        tp = holder ? clamp(parseFloat(holder.style.getPropertyValue('--p') || '1') * 1.15) : 1;
      }
      var text = full.slice(0, Math.floor(tp * full.length));
      if (typed[j].textContent !== text) typed[j].textContent = text;
      typed[j].classList.toggle('is-typing', tp > 0 && tp < 1);
    }
    el.setAttribute('data-step', String(step));
    var scene = window.DECK_SCENES && window.DECK_SCENES[el.id];
    if (scene && scene.render) scene.render(el, step, t, api);
  }

  function show(i) {
    for (var k = 0; k < slides.length; k += 1) {
      var on = k === i;
      if (on !== slides[k].hasAttribute('data-deck-active')) {
        if (on) { slides[k].setAttribute('data-deck-active', ''); slides[k].removeAttribute('aria-hidden'); slides[k].inert = false; }
        else { slides[k].removeAttribute('data-deck-active'); slides[k].setAttribute('aria-hidden', 'true'); slides[k].inert = true; }
      }
    }
    doc.setAttribute('data-slide', slides[i].id);
    doc.toggleAttribute('data-in-appendix', !isMain(i));
  }

  function frame(i, step, t) {
    show(i);
    drawSlide(i, step, t);
  }

  function play(i, step) {
    cancelAnimationFrame(anim);
    if (reduceQuery.matches || PREVIEW) { frame(i, step, 1); return; }
    var start = performance.now();
    var ms = STEP_MS;
    var scene = window.DECK_SCENES && window.DECK_SCENES[slides[i].id];
    if (scene && scene.ms) ms = scene.ms(step) || STEP_MS;
    var tick = function (now) {
      var t = clamp((now - start) / ms);
      frame(i, step, t);
      if (t < 1) anim = requestAnimationFrame(tick);
    };
    frame(i, step, 0);
    anim = requestAnimationFrame(tick);
  }

  function go(i, step, animate) {
    pos = { index: i, step: step };
    if (animate) play(i, step);
    else { cancelAnimationFrame(anim); frame(i, step, 1); }
    afterMove();
  }

  function afterMove() {
    if (PREVIEW) return;
    var hash = '#' + slides[pos.index].id + '/' + pos.step;
    if (location.hash !== hash) { try { history.replaceState(null, '', hash); } catch (e) { /* file:// */ } }
    if (isMain(pos.index)) set('localStorage', POS_KEY, pos.index + ':' + pos.step);
    paintChrome();
    postState('move');
  }

  /* ── navigation ── */
  function next() {
    var i = pos.index;
    if (!isMain(i)) {
      for (var a = i + 1; a < slides.length; a += 1) if (!isMain(a)) { go(a, 0, true); return; }
      return;
    }
    if (pos.step < stepsOf(i)) { go(i, pos.step + 1, true); return; }
    for (var j = i + 1; j < slides.length; j += 1) if (isMain(j)) { go(j, 0, true); return; }
  }

  function prev() {
    var i = pos.index;
    if (!isMain(i)) {
      if (i > 0 && !isMain(i - 1)) go(i - 1, 0, false);
      else leaveAppendix();
      return;
    }
    if (pos.step > 0) { go(i, pos.step - 1, false); return; }
    for (var j = i - 1; j >= 0; j -= 1) if (isMain(j)) { go(j, stepsOf(j), false); return; }
  }

  function reset() {
    tallies = {};
    Object.keys(timers).forEach(function (key) { stopTimer(key); });
    timers = {};
    set('localStorage', POS_KEY, null);
    set('sessionStorage', RETURN_KEY, null);
    paintVotes();
    paintTimers();
    go(0, 0, true);
  }

  function gotoIndex(i) {
    if (i < 0 || i >= slides.length) return;
    if (!isMain(i)) {
      if (isMain(pos.index)) set('sessionStorage', RETURN_KEY, pos.index + ':' + pos.step);
      go(i, 0, false);
      return;
    }
    go(i, 0, true);
  }

  function leaveAppendix() {
    var saved = (get('sessionStorage', RETURN_KEY) || '').split(':');
    var i = parseInt(saved[0], 10), step = parseInt(saved[1], 10);
    set('sessionStorage', RETURN_KEY, null);
    if (!(i >= 0 && i < slides.length && isMain(i))) { i = slides.length - 1; while (i > 0 && !isMain(i)) i -= 1; step = stepsOf(i); }
    go(i, Math.min(Math.max(0, step || 0), stepsOf(i)), false);
  }

  function openPresenter() {
    var w = window.open('./presenter.html?deck=' + encodeURIComponent(RUNTIME.edition), K.presenterChannel(ID), 'width=1180,height=820');
    if (w) { try { w.focus(); } catch (e) { /* ignore */ } }
    postState('presenter');
  }

  var handlers = { next: next, prev: prev, reset: reset, presenter: openPresenter, 'leave-appendix': leaveAppendix };

  /* ── presenter link ── */
  var channel = null;
  function postState(reason) {
    if (!channel) return;
    var el = slides[pos.index];
    channel.postMessage({
      from: 'deck', type: 'state', reason: reason, index: pos.index, total: slides.length,
      label: el.getAttribute('data-label') || '', section: el.getAttribute('data-section') || '',
      step: pos.step, steps: stepsOf(pos.index),
    });
  }
  function openChannel() {
    if (PREVIEW || typeof BroadcastChannel === 'undefined') return;
    channel = new BroadcastChannel(K.presenterChannel(ID));
    channel.onmessage = function (ev) {
      var m = ev.data || {};
      if (m.from !== 'presenter') return;
      if (m.type === 'hello') postState('hello');
      else if (m.type === 'goto') gotoIndex(parseInt(m.index, 10));
      else if (m.type === 'key') {
        if (m.key === 'ArrowRight') next();
        else if (m.key === 'ArrowLeft') prev();
        else if (m.key === 'r' || m.key === 'R') reset();
      }
    };
  }

  /* ── chrome: toolbar, position, idle fade, phone note ── */
  function paintChrome() {
    var el = slides[pos.index];
    var label = document.querySelector('[data-pos]');
    if (label) {
      var steps = stepsOf(pos.index);
      label.textContent = el.getAttribute('data-n') + (steps ? ' · ' + pos.step + '/' + steps : '');
      label.setAttribute('aria-label', fill(UI.slide, { n: el.getAttribute('data-n'), total: '11' }) + (steps ? ', ' + fill(UI.step, { step: pos.step, steps: steps }) : ''));
    }
    var back = document.querySelectorAll('[data-action="leave-appendix"]');
    var saved = (get('sessionStorage', RETURN_KEY) || '').split(':');
    var from = parseInt(saved[0], 10);
    var n = from >= 0 && slides[from] ? slides[from].getAttribute('data-n') : '11';
    for (var b = 0; b < back.length; b += 1) back[b].textContent = fill(back[b].getAttribute('data-label'), { n: n });
  }

  var idleTimer = 0;
  function wake() {
    doc.removeAttribute('data-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { doc.setAttribute('data-idle', ''); }, 2600);
  }

  function setupRotateNote() {
    var note = document.querySelector('[data-rotate]');
    if (!note) return;
    var query = window.matchMedia('(orientation: portrait) and (max-width: 699px)');
    var paint = function () { note.hidden = !query.matches || get('sessionStorage', K.storageKey(ID, 'rotate-closed')) === '1'; doc.toggleAttribute('data-rotate-open', !note.hidden); };
    note.querySelector('[data-rotate-close]').addEventListener('click', function () { set('sessionStorage', K.storageKey(ID, 'rotate-closed'), '1'); paint(); });
    if (query.addEventListener) query.addEventListener('change', paint);
    paint();
  }

  /* ── votes: visible buttons only, in memory, with undo ── */
  function paintVotes() {
    var groups = document.querySelectorAll('[data-vote]');
    for (var g = 0; g < groups.length; g += 1) {
      var key = groups[g].getAttribute('data-vote');
      var list = tallies[key] || [];
      var counts = {};
      list.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
      var max = 0;
      Object.keys(counts).forEach(function (v) { if (counts[v] > max) max = counts[v]; });
      var buttons = groups[g].querySelectorAll('[data-value]');
      for (var b = 0; b < buttons.length; b += 1) {
        var n = counts[buttons[b].getAttribute('data-value')] || 0;
        buttons[b].querySelector('[data-count]').textContent = String(n);
        buttons[b].style.setProperty('--share', max ? String(n / max) : '0');
        buttons[b].classList.toggle('has-votes', n > 0);
      }
      var total = groups[g].querySelector('[data-vote-total]');
      if (total) total.textContent = list.length ? list.length + ' ' + total.getAttribute('data-unit') : total.getAttribute('data-none');
      var undo = groups[g].querySelector('[data-undo]');
      if (undo) undo.disabled = !list.length;
    }
    var active = window.DECK_SCENES && window.DECK_SCENES[slides[pos.index].id];
    if (active && active.onVotes) frame(pos.index, pos.step, 1);
  }

  /* ── work timers: they count up against the planned minutes; nothing counts down ── */
  function timerState(key) { return timers[key] || (timers[key] = { elapsed: 0, since: 0, handle: 0 }); }
  function elapsedOf(key) { var s = timerState(key); return s.elapsed + (s.since ? Date.now() - s.since : 0); }
  function stopTimer(key) { var s = timers[key]; if (!s) return; if (s.since) { s.elapsed += Date.now() - s.since; s.since = 0; } clearInterval(s.handle); s.handle = 0; }
  function paintTimers() {
    var boxes = document.querySelectorAll('[data-timer]');
    for (var b = 0; b < boxes.length; b += 1) {
      var box = boxes[b], key = box.getAttribute('data-timer');
      var minutes = parseFloat(box.getAttribute('data-minutes'));
      var ms = timers[key] ? elapsedOf(key) : 0;
      var s = Math.floor(ms / 1000);
      box.querySelector('[data-timer-clock]').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
      var share = clamp(ms / (minutes * 60000));
      box.querySelector('[data-timer-fill]').style.transform = 'scaleX(' + share.toFixed(4) + ')';
      var running = Boolean(timers[key] && timers[key].since);
      var toggle = box.querySelector('[data-timer-toggle]');
      toggle.textContent = running ? toggle.getAttribute('data-pause') : toggle.getAttribute('data-start');
      box.classList.toggle('is-running', running);
      box.classList.toggle('is-over', share >= 1);
      var phases = box.getAttribute('data-phases');
      if (phases) {
        var acc = 0, current = -1, list = phases.split(',').map(Number);
        for (var p = 0; p < list.length; p += 1) { acc += list[p] * 60000; if (ms < acc && current < 0) current = p; }
        if (current < 0) current = list.length - 1;
        var items = box.querySelectorAll('[data-phase]');
        for (var q = 0; q < items.length; q += 1) items[q].classList.toggle('is-now', q === current && ms > 0);
      }
    }
  }
  function toggleTimer(key) {
    var s = timerState(key);
    if (s.since) stopTimer(key);
    else { s.since = Date.now(); s.handle = setInterval(paintTimers, 500); }
    paintTimers();
  }

  /* ── clicks ── */
  function onClick(e) {
    var t = e.target.closest ? e.target.closest('button, a') : null;
    if (!t) return;
    var action = t.getAttribute('data-action');
    if (action && handlers[action]) { handlers[action](); return; }
    if (t.hasAttribute('data-value')) {
      var group = t.closest('[data-vote]');
      var key = group.getAttribute('data-vote');
      (tallies[key] = tallies[key] || []).push(t.getAttribute('data-value'));
      paintVotes();
      return;
    }
    if (t.hasAttribute('data-undo')) { var list = tallies[t.getAttribute('data-undo')]; if (list) list.pop(); paintVotes(); return; }
    if (t.hasAttribute('data-timer-toggle')) { toggleTimer(t.closest('[data-timer]').getAttribute('data-timer')); return; }
    if (t.hasAttribute('data-timer-reset')) { var k = t.closest('[data-timer]').getAttribute('data-timer'); stopTimer(k); delete timers[k]; paintTimers(); return; }
    if (t.hasAttribute('data-goto')) { gotoIndex(indexOfId(t.getAttribute('data-goto'))); return; }
    if (t.hasAttribute('data-copy')) {
      var body = t.closest('figure').querySelector('pre');
      if (navigator.clipboard) navigator.clipboard.writeText(body.textContent).then(function () {
        t.textContent = UI.copied; setTimeout(function () { t.textContent = UI.copy; }, 1400);
      }, function () { /* clipboard blocked */ });
    }
  }

  /* Touch: a tap on the right half of an empty slide area moves on, on the left half moves back. */
  function onPointerUp(e) {
    if (e.pointerType !== 'touch') return;
    if (e.target.closest('button, a, input, select, textarea, [data-vote], .prompt, .toolbar, .rotate')) return;
    if (e.clientX > window.innerWidth / 2) next(); else prev();
  }

  /* ── start ── */
  function fromHash() {
    var m = /^#([\w-]+)\/(\d+)$/.exec(location.hash || '');
    if (!m) return null;
    var i = indexOfId(m[1]);
    if (i < 0) return null;
    return { index: i, step: Math.min(parseInt(m[2], 10), stepsOf(i)) };
  }

  var api = {
    tallies: function () { return tallies; },
    ui: UI,
    status: RUNTIME.status,
    lang: RUNTIME.lang,
    ease: ease,
    clamp: clamp,
  };

  function start() {
    fit();
    window.addEventListener('resize', fit);
    if (PREVIEW) {
      doc.setAttribute('data-deck-preview', '');
      window.addEventListener('message', function (ev) {
        if (ev.origin !== location.origin) return;
        var m = ev.data || {};
        if (m.deckPreview && typeof m.index === 'number' && slides[m.index]) { pos = { index: m.index, step: stepsOf(m.index) }; frame(m.index, pos.step, 1); }
      });
      frame(0, 0, 1);
      return;
    }
    if (SEEK) {
      var s = SEEK.split(':');
      var si = Math.min(Math.max(1, parseInt(s[0], 10) || 1), slides.length) - 1;
      var st = Math.min(Math.max(0, parseInt(s[1], 10) || 0), stepsOf(si));
      var tt = clamp(parseFloat(s[2] === undefined ? '1' : s[2]));
      pos = { index: si, step: st };
      frame(si, st, tt);
      doc.setAttribute('data-seek', '');
    } else {
      var start0 = fromHash();
      if (!start0) {
        var saved = (get('localStorage', POS_KEY) || '').split(':');
        var i = parseInt(saved[0], 10);
        if (i >= 0 && i < slides.length && isMain(i)) start0 = { index: i, step: Math.min(parseInt(saved[1], 10) || 0, stepsOf(i)) };
      }
      start0 = start0 || { index: 0, step: 0 };
      if (start0.index === 0 && start0.step === 0) { pos = start0; play(0, 0); }
      else { pos = start0; frame(start0.index, start0.step, 1); }
    }
    openChannel();
    document.addEventListener('keydown', function (e) {
      K.handle(e, handlers, { inAppendix: !isMain(pos.index) });
    });
    document.addEventListener('click', onClick);
    document.addEventListener('pointerup', onPointerUp);
    ['mousemove', 'pointerdown', 'keydown'].forEach(function (type) { window.addEventListener(type, wake, { passive: true }); });
    window.addEventListener('hashchange', function () { var h = fromHash(); if (h && (h.index !== pos.index || h.step !== pos.step)) go(h.index, h.step, false); });
    setupRotateNote();
    paintVotes();
    paintTimers();
    paintChrome();
    postState('load');
    wake();
    if (!SEEK) afterMove();
  }

  window.DECK = {
    state: function () { return { index: pos.index, id: slides[pos.index].id, step: pos.step, steps: stepsOf(pos.index), tallies: JSON.parse(JSON.stringify(tallies)), timers: Object.keys(timers).length }; },
    seek: function (i, step, t) { cancelAnimationFrame(anim); pos = { index: i, step: step }; frame(i, step, t); paintChrome(); },
    goto: gotoIndex,
    slides: slides,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
