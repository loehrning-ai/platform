/* presenter.js: speaker view for Workshop 04 (German and English edition).
 *
 * Workshop 02's presenter view, extended: copy in the deck's language (<html lang>), appendix pages
 * counted apart, "Zurück zu" after a reset, Escape leaves the appendix, and plain elapsed time with
 * the plan as text (no pace colours). Opened from the deck with P. It reads the notes and slide
 * names from ./slides.html (#speaker-notes: one string per slide with the lines Time, Say,
 * Students, Cue, Remember), follows the deck over a BroadcastChannel and sends the same keys the
 * deck listens to. Timers live in this window only; nothing is stored.
 *
 * Messages (channel "deck-presenter:<deck id>", the id from <html data-deck-id>):
 *   deck -> view   { from: "deck", type: "state", index, total, label, step, steps, kind, resetFrom }
 *   view -> deck   { from: "presenter", type: "hello" | "key" (key, shiftKey) | "goto" (index, step) }
 */
(() => {
  'use strict';
  const de = String(document.documentElement.lang || '').toLowerCase().startsWith('de');
  const T = de ? {
    slide: 'Folie', appendix: 'Anhang', step: 'Schritt', noSteps: 'Keine Schritte', waiting: 'Warte auf das Deck',
    time: 'Zeit', plan: 'Plan', notPlanned: 'ohne Plan', planUntil: 'Plan bis hier', end: 'Ende des Decks',
    empty: 'Keine Notiz zu dieser Folie.', live: 'Mit dem Deck verbunden', offline: 'Nicht verbunden: Deck öffnen und P drücken',
    loadFail: 'Die Notizen ließen sich nicht laden. Diese Seite über die Workshop-Seite öffnen, nicht als Datei.',
    back: 'Zurück zu', blocks: [['Say', 'Sagen', 'say'], ['Students', 'Raum', 'students'], ['Cue', 'Hinweis', 'cue'], ['Remember', 'Nicht vergessen', 'remember']],
  } : {
    slide: 'Slide', appendix: 'Appendix', step: 'Step', noSteps: 'No steps', waiting: 'Waiting for the deck',
    time: 'Time', plan: 'plan', notPlanned: 'not planned', planUntil: 'Plan up to here', end: 'End of the deck',
    empty: 'No speaker note for this slide.', live: 'Connected to deck', offline: 'Not connected: open the deck and press P',
    loadFail: 'Could not load the speaker notes. Open this page from the workshop site, not from a file.',
    back: 'Back to', blocks: [['Say', 'Say', 'say'], ['Students', 'Room', 'students'], ['Cue', 'Cue', 'cue'], ['Remember', 'Do not forget', 'remember']],
  };
  const CHANNEL = 'deck-presenter:' + (document.documentElement.getAttribute('data-deck-id') || document.body.dataset.slug || '');
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + pad(s % 60); };

  let slides = [];   // [{ label, kind }]
  let parsed = [];   // [{ title, Time, Say, ... }]
  let seconds = [];  // planned seconds per slide
  let state = { index: 0, total: 0, step: 0, steps: 0, live: false, resetFrom: null };
  let lastSeen = 0, sessionStart = Date.now(), slideStart = Date.now(), shown = -1;

  function parseNote(text) {
    const lines = String(text || '').split('\n');
    const out = { title: lines.shift() || '' };
    let key = null;
    lines.forEach((ln) => {
      const m = ln.match(/^(Time|Say|Students|Cue|Remember):\s*(.*)$/);
      if (m) { key = m[1]; out[key] = m[2]; } else if (key && ln.trim()) out[key] += ' ' + ln.trim();
    });
    return out;
  }
  // "3 min 30 s" -> 210; only the text before a bracket, comma or semicolon counts.
  function planSeconds(time) {
    const head = String(time || '').split(/[(,;]/)[0];
    const min = head.match(/(\d+)\s*min/), sec = head.match(/(\d+)\s*s\b/);
    return (min ? parseInt(min[1], 10) * 60 : 0) + (sec ? parseInt(sec[1], 10) : 0);
  }
  const planBefore = (i) => seconds.slice(0, i).reduce((a, b) => a + b, 0);

  /** "Folie 09 / 15" for a main slide, "Anhang 2 / 3" for an appendix page. */
  function where(i) {
    const s = slides[i];
    if (!s) return T.slide + ' ' + pad(i + 1);
    const list = slides.filter((x) => x.kind === s.kind);
    const n = list.indexOf(s) + 1;
    return s.kind === 'appendix' ? T.appendix + ' ' + n + ' / ' + list.length : T.slide + ' ' + pad(n) + ' / ' + pad(list.length);
  }

  function scaleFrames() {
    const f = document.querySelector('.pv-frame'), i = f && f.querySelector('iframe');
    if (i) i.style.transform = 'scale(' + f.clientWidth / 1920 + ')';
  }
  // The preview deck may load before or after this page asks, so the wanted slide is sent now and again every second.
  let nextIndex = -1;
  function sendNext() {
    const f = $('pv-next-frame');
    if (nextIndex < 0 || !f.contentWindow) return;
    try { f.contentWindow.postMessage({ deckPreview: true, index: nextIndex }, location.origin); } catch (e) { /* ignore */ }
  }
  function showNext(index) { nextIndex = index; sendNext(); }
  setInterval(sendNext, 1000);

  function render() {
    const total = state.total || slides.length;
    const i = Math.min(Math.max(0, state.index), Math.max(0, total - 1));
    const meta = slides[i] || {}, p = parsed[i] || {};
    if (i !== shown) {
      shown = i; slideStart = Date.now();
      $('pv-label').textContent = meta.label || '';
      $('pv-title').textContent = p.title || meta.label || T.waiting;
      $('pv-plan').textContent = p.Time ? T.time + ': ' + p.Time : '';
      const box = $('pv-note'); box.textContent = '';
      const found = T.blocks.filter(([k]) => p[k]);
      if (!found.length) { const e = document.createElement('p'); e.className = 'pv-empty'; e.textContent = T.empty; box.append(e); }
      found.forEach(([k, label, cls]) => {
        const s = document.createElement('section'); s.className = 'pv-block ' + cls;
        const h = document.createElement('h2'); h.textContent = label;
        const t = document.createElement('p'); t.textContent = p[k];
        s.append(h, t); box.append(s);
      });
      // The next main slide: the appendix is never "next" in the show.
      const n = slides[i + 1] && slides[i + 1].kind === meta.kind ? slides[i + 1] : null;
      $('pv-next').classList.toggle('end', !n);
      $('pv-nlab').textContent = n ? n.label : T.end;
      $('pv-ntime').textContent = n && parsed[i + 1] && parsed[i + 1].Time ? T.time + ': ' + parsed[i + 1].Time : '';
      if (n) showNext(i + 1);
      $('pv-tplan').textContent = seconds[i] ? T.plan + ' ' + mmss(seconds[i] * 1000) : T.notPlanned;
      $('pv-select').value = String(i);
    }
    $('pv-pos').textContent = where(i);
    $('pv-step').textContent = state.steps > 0 ? T.step + ' ' + state.step + ' / ' + state.steps : T.noSteps;
    $('pv-prev').disabled = !state.live;
    $('pv-forward').disabled = !state.live;
    const back = $('pv-return');
    const from = state.resetFrom;
    back.hidden = !(state.live && from && Number.isInteger(from.index));
    if (!back.hidden) back.textContent = T.back + ' ' + where(from.index) + ', ' + T.step + ' ' + from.step;
  }

  function paintTimers() {
    const i = Math.max(0, shown);
    $('pv-tslide').textContent = mmss(Date.now() - slideStart);
    $('pv-tsess').textContent = mmss(Date.now() - sessionStart);
    $('pv-tpace').textContent = T.planUntil + ': ' + mmss(planBefore(i) * 1000);
  }
  setInterval(paintTimers, 500);

  function setConn(live) {
    const c = $('pv-conn');
    c.dataset.state = live ? 'live' : 'waiting';
    c.textContent = live ? T.live : T.offline;
  }

  /* ── deck link ── */
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  const post = (m) => { if (channel) channel.postMessage(Object.assign({ from: 'presenter' }, m)); };
  if (channel) {
    channel.onmessage = (ev) => {
      const m = ev.data || {};
      if (m.from !== 'deck' || m.type !== 'state') return;
      state = { index: m.index, total: m.total, step: m.step || 0, steps: m.steps || 0, live: true, resetFrom: m.resetFrom || null };
      lastSeen = Date.now(); setConn(true); render();
    };
  }
  setInterval(() => {
    if (state.live && Date.now() - lastSeen > 6000) { state.live = false; setConn(false); render(); }
    if (!state.live) post({ type: 'hello' });
  }, 1500);

  // The same keys as the deck (lib/deck-keys.js), forwarded: arrows, r or Shift+R, Escape.
  const sendKey = (key, shiftKey) => post({ type: 'key', key, shiftKey: !!shiftKey });
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (e.repeat) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); sendKey(e.key, false); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); sendKey('R', true); }
    else if (e.key === 'Escape') { e.preventDefault(); sendKey('Escape', false); }
  });
  $('pv-prev').addEventListener('click', () => sendKey('ArrowLeft'));
  $('pv-forward').addEventListener('click', () => sendKey('ArrowRight'));
  $('pv-reset').addEventListener('click', () => sendKey('R', true));
  $('pv-return').addEventListener('click', () => {
    const from = state.resetFrom;
    if (from) post({ type: 'goto', index: from.index, step: from.step });
  });
  $('pv-timer-reset').addEventListener('click', () => { sessionStart = Date.now(); slideStart = Date.now(); paintTimers(); });
  $('pv-select').addEventListener('change', (e) => post({ type: 'goto', index: parseInt(e.target.value, 10) }));

  /* ── notes and slide names come from slides.html ── */
  fetch('./slides.html', { credentials: 'same-origin' }).then((r) => r.text()).then((html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tag = doc.getElementById('speaker-notes');
    let notes = [];
    try { notes = tag ? JSON.parse(tag.textContent || '[]') : []; } catch (e) { notes = []; }
    slides = Array.from(doc.querySelectorAll('deck-stage > section')).map((s, i) => ({
      label: s.getAttribute('data-label') || T.slide + ' ' + (i + 1),
      kind: s.getAttribute('data-kind') === 'appendix' ? 'appendix' : 'main',
    }));
    parsed = slides.map((_, i) => parseNote(notes[i]));
    seconds = parsed.map((p, i) => (slides[i].kind === 'main' ? planSeconds(p.Time) : 0));
    const sel = $('pv-select');
    slides.forEach((s, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = where(i) + '  ' + s.label; sel.append(o); });
    state.total = state.total || slides.length;
    shown = -1; render(); post({ type: 'hello' });
  }).catch(() => { $('pv-title').textContent = T.loadFail; });

  window.addEventListener('resize', scaleFrames);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(scaleFrames).observe(document.querySelector('.pv-frame'));
  setConn(false); scaleFrames(); paintTimers();
})();
