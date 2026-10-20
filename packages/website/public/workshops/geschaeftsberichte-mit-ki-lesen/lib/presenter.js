/* presenter.js: speaker view for the deck-stage decks (Workshops 02 and 04).
 *
 * Opened from the deck with P or Shift+P (or its Presenter button). It reads the notes and slide names from
 * slides.html (#speaker-notes, one string per slide with the lines Time, Say, Students, Cue, Remember), follows the
 * deck over a BroadcastChannel and sends the same keys the deck listens to, so build steps, arrows and Shift+R
 * behave exactly as on the projector. Timers live in this window only; nothing is stored.
 *
 * Messages (channel "deck-presenter:<folder path>"):
 *   deck -> view   { from: "deck", type: "state", index, total, label, section, step, steps }
 *   view -> deck   { from: "presenter", type: "hello" | "key" (key, shiftKey) | "goto" (index) }
 */
(() => {
  'use strict';
  const body = document.body;
  const SLUG = body.dataset.slug || '';
  const CHANNEL = 'deck-presenter:' + location.pathname.replace(/[^/]*$/, '');
  const BLOCKS = [['Say', 'What to say', 'say'], ['Students', 'What students do', 'students'], ['Cue', 'Cue and clicks', 'cue'], ['Remember', 'Do not forget', 'remember']];
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + pad(s % 60); };

  let slides = [];   // [{ label, section }]
  let parsed = [];   // [{ title, Time, Say, ... }]
  let seconds = [];  // planned seconds per slide
  let state = { index: 0, total: 0, step: 0, steps: 0, live: false };
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
  // "3 min 15 s (...)" -> 195; only the text before a bracket, comma or semicolon counts.
  function planSeconds(time) {
    const head = String(time || '').split(/[(,;]/)[0];
    const min = head.match(/(\d+)\s*min/), sec = head.match(/(\d+)\s*s\b/);
    return (min ? parseInt(min[1], 10) * 60 : 0) + (sec ? parseInt(sec[1], 10) : 0);
  }
  const planBefore = (i) => seconds.slice(0, i).reduce((a, b) => a + b, 0);

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
      $('pv-pos').textContent = 'Slide ' + pad(i + 1) + ' / ' + pad(total);
      $('pv-label').textContent = meta.section || '';
      $('pv-title').textContent = (p.title || '').replace(/^[^·]*·\s*/, '') || meta.label || 'Waiting for the deck';
      $('pv-plan').textContent = p.Time ? 'Time: ' + p.Time : '';
      const box = $('pv-note'); box.textContent = '';
      const found = BLOCKS.filter(([k]) => p[k]);
      if (!found.length) { const e = document.createElement('p'); e.className = 'pv-empty'; e.textContent = 'No speaker note for this slide.'; box.append(e); }
      found.forEach(([k, label, cls]) => {
        const s = document.createElement('section'); s.className = 'pv-block ' + cls;
        const h = document.createElement('h2'); h.textContent = label;
        const t = document.createElement('p'); t.textContent = p[k];
        s.append(h, t); box.append(s);
      });
      const n = slides[i + 1];
      $('pv-next').classList.toggle('end', !n);
      $('pv-nlab').textContent = n ? pad(i + 2) + ' · ' + n.label : 'End of the deck';
      $('pv-ntime').textContent = n && parsed[i + 1] && parsed[i + 1].Time ? 'Time: ' + parsed[i + 1].Time : '';
      if (n) showNext(i + 1);
      $('pv-tplan').textContent = seconds[i] ? 'plan ' + mmss(seconds[i] * 1000) : 'not planned';
      $('pv-select').value = String(i);
    }
    $('pv-step').textContent = state.steps > 0 ? 'Step ' + state.step + ' / ' + state.steps : 'No steps';
    $('pv-prev').disabled = !state.live || i <= 0;
    $('pv-forward').disabled = !state.live || i >= total - 1;
  }

  function paintTimers() {
    const i = Math.max(0, shown);
    const ts = Date.now() - slideStart, plan = (seconds[i] || 0) * 1000;
    const tsl = $('pv-tslide'); tsl.textContent = mmss(ts); tsl.className = 'pv-big' + (plan && ts > plan ? ' over' : '');
    const sess = Date.now() - sessionStart, due = planBefore(i) * 1000, diff = sess - due;
    $('pv-tsess').textContent = mmss(sess);
    $('pv-tpace').textContent = 'plan at slide start ' + mmss(due) + (Math.abs(diff) < 30000 ? ', on pace' : diff > 0 ? ', ' + mmss(diff) + ' behind' : ', ' + mmss(-diff) + ' ahead');
  }
  setInterval(paintTimers, 500);

  function setConn(live) {
    const c = $('pv-conn');
    c.dataset.state = live ? 'live' : 'waiting';
    c.textContent = live ? 'Connected to deck' : 'Not connected: open the deck and press P';
  }

  /* ── deck link ── */
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  const post = (m) => { if (channel) channel.postMessage(Object.assign({ from: 'presenter' }, m)); };
  if (channel) {
    channel.onmessage = (ev) => {
      const m = ev.data || {};
      if (m.from !== 'deck' || m.type !== 'state') return;
      state = { index: m.index, total: m.total, step: m.step || 0, steps: m.steps || 0, live: true };
      lastSeen = Date.now(); setConn(true); render();
    };
  }
  setInterval(() => {
    if (state.live && Date.now() - lastSeen > 6000) { state.live = false; setConn(false); render(); }
    if (!state.live) post({ type: 'hello' });
  }, 1500);

  const sendKey = (key, shiftKey) => post({ type: 'key', key, shiftKey: !!shiftKey });
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if ((e.key === ' ' || e.key === 'Enter') && t && /^(BUTTON|A)$/.test(t.tagName)) return;
    if (/^(ArrowRight|ArrowLeft|PageDown|PageUp| |Home|End)$/.test(e.key)) { e.preventDefault(); sendKey(e.key, false); }
    else if ((e.key === 'r' || e.key === 'R') && e.shiftKey) { e.preventDefault(); sendKey('R', true); }
    else if (e.key === 'Escape') window.close();
  });
  $('pv-prev').addEventListener('click', () => sendKey('ArrowLeft'));
  $('pv-forward').addEventListener('click', () => sendKey('ArrowRight'));
  $('pv-reset').addEventListener('click', () => sendKey('R', true));
  $('pv-timer-reset').addEventListener('click', () => { sessionStart = Date.now(); slideStart = Date.now(); paintTimers(); });
  $('pv-select').addEventListener('change', (e) => post({ type: 'goto', index: parseInt(e.target.value, 10) }));

  /* ── notes and slide names come from slides.html ── */
  fetch('./slides.html', { credentials: 'same-origin' }).then((r) => r.text()).then((html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tag = doc.getElementById('speaker-notes');
    let notes = [];
    try { notes = tag ? JSON.parse(tag.textContent || '[]') : []; } catch (e) { notes = []; }
    slides = Array.from(doc.querySelectorAll('deck-stage > section')).map((s, i) => ({ label: s.getAttribute('data-label') || 'Slide ' + (i + 1), section: s.getAttribute('data-section') || '' }));
    parsed = slides.map((_, i) => parseNote(notes[i]));
    seconds = parsed.map((p) => planSeconds(p.Time));
    const sel = $('pv-select');
    slides.forEach((s, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = pad(i + 1) + '  ' + s.label; sel.append(o); });
    state.total = state.total || slides.length;
    shown = -1; render(); post({ type: 'hello' });
  }).catch(() => { $('pv-title').textContent = 'Could not load the speaker notes. Open this page from the workshop site, not from a file.'; });

  window.addEventListener('resize', scaleFrames);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(scaleFrames).observe(document.querySelector('.pv-frame'));
  setConn(false); scaleFrames(); paintTimers();
})();
