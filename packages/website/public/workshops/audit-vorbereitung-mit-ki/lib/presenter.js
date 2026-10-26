/* presenter.js: speaker view of the Workshop 05 deck. Built on the shared W02/W04 presenter.js: same
 * messages, same notes format, same timers. W05 additions:
 *   - one presenter page serves both editions: the deck opens presenter.html?deck=slides.html (German) or
 *     ?deck=en/slides.html (English); notes, the next-slide preview, the labels and the channel follow
 *     that edition (the English deck id is "<slug>:en");
 *   - appendix buttons (goto), so the appendix stays outside the arrow path of the deck;
 *   - a "goto" to an appendix slide makes the deck remember where it came from (Escape returns).
 *
 * Messages (channel "deck-presenter:<deck id>", the id from <html data-deck-id> plus ":en" for English):
 *   deck -> view   { from: "deck", type: "state", index, total, label, section, step, steps }
 *   view -> deck   { from: "presenter", type: "hello" | "key" (key, shiftKey) | "goto" (index) }
 * Keys here: ArrowRight, ArrowLeft, r or Shift+R (forwarded to the deck), Escape closes this window.
 */
(() => {
  'use strict';
  const EDITIONS = ['slides.html', 'en/slides.html'];
  const asked = new URLSearchParams(location.search).get('deck');
  const EDITION = EDITIONS.includes(asked) ? asked : EDITIONS[0];
  const LANG = EDITION === 'en/slides.html' ? 'en' : 'de';
  const T = {
    de: {
      title: 'Moderation · Audit-Vorbereitung mit KI · loehrning.ai', back: 'Zurück zur Workshop-Seite', side: 'Zeit und nächste Folie',
      thisSlide: 'Diese Folie', session: 'Gesamt', nextSlide: 'Nächste Folie', prev: '← Zurück', next: 'Weiter →', reset: 'Neu starten (R)',
      timers: 'Uhren neu starten', jump: 'Springen zu', appendix: 'Anhang', keys: 'Pfeile: Schritt. R: zurück zum Titel. Im Deck öffnet P diese Ansicht.',
      waiting: 'Warte auf das Deck', live: 'Mit dem Deck verbunden', offline: 'Nicht verbunden: Deck öffnen und P drücken',
      slide: 'Folie', step: 'Schritt', noSteps: 'Keine Schritte', time: 'Zeit', plan: 'Plan', notPlanned: 'ohne Plan', end: 'Ende des Decks',
      atStart: 'Plan zu Folienbeginn', onPace: 'im Plan', behind: 'hinter dem Plan', ahead: 'vor dem Plan', noNote: 'Keine Notiz zu dieser Folie.',
      loadError: 'Die Notizen ließen sich nicht laden. Öffne diese Seite über die Workshop-Seite, nicht als Datei.',
      blocks: { Say: 'Was du sagst', Students: 'Was die Gruppe tut', Cue: 'Klicks und Hinweise', Remember: 'Nicht vergessen' },
    },
    en: {
      title: 'Presenter view · Audit preparation with AI · loehrning.ai', back: 'Back to the workshop page', side: 'Timers and next slide',
      thisSlide: 'This slide', session: 'Session', nextSlide: 'Next slide', prev: '← Back', next: 'Next →', reset: 'Start over (R)',
      timers: 'Restart timers', jump: 'Jump to', appendix: 'Appendix', keys: 'Arrows: step. R: back to the cover. In the deck, P opens this view.',
      waiting: 'Waiting for the deck', live: 'Connected to deck', offline: 'Not connected: open the deck and press P',
      slide: 'Slide', step: 'Step', noSteps: 'No steps', time: 'Time', plan: 'plan', notPlanned: 'not planned', end: 'End of the deck',
      atStart: 'plan at slide start', onPace: 'on pace', behind: 'behind', ahead: 'ahead', noNote: 'No speaker note for this slide.',
      loadError: 'Could not load the speaker notes. Open this page from the workshop site, not from a file.',
      blocks: { Say: 'What to say', Students: 'What students do', Cue: 'Cue and clicks', Remember: 'Do not forget' },
    },
  }[LANG];

  const body = document.body;
  const SLUG = body.dataset.slug || '';
  const CHANNEL = 'deck-presenter:' + (document.documentElement.getAttribute('data-deck-id') || SLUG) + (LANG === 'en' ? ':en' : '');
  const BLOCKS = ['Say', 'Students', 'Cue', 'Remember'];
  const CLS = { Say: 'say', Students: 'students', Cue: 'cue', Remember: 'remember' };
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + pad(s % 60); };

  document.documentElement.lang = LANG;
  document.title = T.title;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = T[el.getAttribute('data-i18n')] || ''; });
  document.querySelectorAll('[data-i18n-label]').forEach((el) => { el.setAttribute('aria-label', T[el.getAttribute('data-i18n-label')] || ''); });
  const back = document.querySelector('.deck-back');
  if (back && LANG === 'en') back.setAttribute('href', '/en' + back.getAttribute('href'));
  $('pv-title').textContent = T.waiting;
  $('pv-next-frame').title = T.nextSlide;

  let slides = [];   // [{ label, section, kind, n }]
  let parsed = [];
  let seconds = [];
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
  let nextIndex = -1;
  function sendNext() {
    const f = $('pv-next-frame');
    if (nextIndex < 0 || !f.contentWindow) return;
    try { f.contentWindow.postMessage({ deckPreview: true, index: nextIndex }, location.origin); } catch (e) { /* ignore */ }
  }
  function showNext(index) { nextIndex = index; sendNext(); }
  setInterval(sendNext, 1000);
  $('pv-next-frame').src = './' + EDITION + '?preview=1';

  /** The next slide on the arrow path: main slides only, none after the last. */
  function nextMain(i) {
    if (!slides[i] || slides[i].kind !== 'main') return -1;
    for (let j = i + 1; j < slides.length; j += 1) if (slides[j].kind === 'main') return j;
    return -1;
  }

  function render() {
    const total = state.total || slides.length;
    const i = Math.min(Math.max(0, state.index), Math.max(0, total - 1));
    const meta = slides[i] || {}, p = parsed[i] || {};
    if (i !== shown) {
      shown = i; slideStart = Date.now();
      const mains = slides.filter((s) => s.kind === 'main').length || total;
      $('pv-pos').textContent = T.slide + ' ' + (meta.n || pad(i + 1)) + ' / ' + pad(mains);
      $('pv-label').textContent = meta.section || '';
      $('pv-title').textContent = (p.title || '').replace(/^[^·]*·\s*/, '') || meta.label || T.waiting;
      $('pv-plan').textContent = p.Time ? T.time + ': ' + p.Time : '';
      const box = $('pv-note'); box.textContent = '';
      const found = BLOCKS.filter((k) => p[k]);
      if (!found.length) { const e = document.createElement('p'); e.className = 'pv-empty'; e.textContent = T.noNote; box.append(e); }
      found.forEach((k) => {
        const s = document.createElement('section'); s.className = 'pv-block ' + CLS[k];
        const h = document.createElement('h2'); h.textContent = T.blocks[k];
        const t = document.createElement('p'); t.textContent = p[k];
        s.append(h, t); box.append(s);
      });
      const ni = nextMain(i), n = slides[ni];
      $('pv-next').classList.toggle('end', !n);
      $('pv-nlab').textContent = n ? n.n + ' · ' + n.label : T.end;
      $('pv-ntime').textContent = n && parsed[ni] && parsed[ni].Time ? T.time + ': ' + parsed[ni].Time : '';
      if (n) showNext(ni);
      $('pv-tplan').textContent = seconds[i] ? T.plan + ' ' + mmss(seconds[i] * 1000) : T.notPlanned;
      $('pv-select').value = String(i);
    }
    $('pv-step').textContent = state.steps > 0 ? T.step + ' ' + state.step + ' / ' + state.steps : T.noSteps;
    $('pv-prev').disabled = !state.live || (i <= 0 && state.step <= 0);
    $('pv-forward').disabled = !state.live || (nextMain(i) < 0 && state.step >= state.steps);
  }

  function paintTimers() {
    const i = Math.max(0, shown);
    const ts = Date.now() - slideStart, plan = (seconds[i] || 0) * 1000;
    const tsl = $('pv-tslide'); tsl.textContent = mmss(ts); tsl.className = 'pv-big' + (plan && ts > plan ? ' over' : '');
    const sess = Date.now() - sessionStart, due = planBefore(i) * 1000, diff = sess - due;
    $('pv-tsess').textContent = mmss(sess);
    $('pv-tpace').textContent = T.atStart + ' ' + mmss(due) + (Math.abs(diff) < 30000 ? ', ' + T.onPace : diff > 0 ? ', ' + mmss(diff) + ' ' + T.behind : ', ' + mmss(-diff) + ' ' + T.ahead);
  }
  setInterval(paintTimers, 500);

  function setConn(live) {
    const c = $('pv-conn');
    c.dataset.state = live ? 'live' : 'waiting';
    c.textContent = live ? T.live : T.offline;
  }

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
    if (e.repeat) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); sendKey(e.key, false); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); sendKey('R', true); }
    else if (e.key === 'Escape') window.close();
  });
  $('pv-prev').addEventListener('click', () => sendKey('ArrowLeft'));
  $('pv-forward').addEventListener('click', () => sendKey('ArrowRight'));
  $('pv-reset').addEventListener('click', () => sendKey('R', true));
  $('pv-timer-reset').addEventListener('click', () => { sessionStart = Date.now(); slideStart = Date.now(); paintTimers(); });
  $('pv-select').addEventListener('change', (e) => post({ type: 'goto', index: parseInt(e.target.value, 10) }));

  fetch('./' + EDITION, { credentials: 'same-origin' }).then((r) => r.text()).then((html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tag = doc.getElementById('speaker-notes');
    let notes = [];
    try { notes = tag ? JSON.parse(tag.textContent || '[]') : []; } catch (e) { notes = []; }
    slides = Array.from(doc.querySelectorAll('deck-stage > section')).map((s, i) => ({
      label: s.getAttribute('data-label') || 'Slide ' + (i + 1),
      section: s.getAttribute('data-section') || '',
      kind: s.getAttribute('data-kind') || 'main',
      n: s.getAttribute('data-n') || pad(i + 1),
    }));
    parsed = slides.map((_, i) => parseNote(notes[i]));
    seconds = parsed.map((p) => planSeconds(p.Time));
    const sel = $('pv-select');
    slides.forEach((s, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = s.n + '  ' + s.label; sel.append(o); });
    const appx = $('pv-appx');
    const tag2 = document.createElement('span'); tag2.textContent = T.appendix; appx.append(tag2);
    slides.forEach((s, i) => {
      if (s.kind !== 'appendix') return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pv-btn'; b.textContent = s.n + ' ' + s.label;
      b.addEventListener('click', () => post({ type: 'goto', index: i }));
      appx.append(b);
    });
    state.total = state.total || slides.length;
    shown = -1; render(); post({ type: 'hello' });
  }).catch(() => { $('pv-title').textContent = T.loadError; });

  window.addEventListener('resize', scaleFrames);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(scaleFrames).observe(document.querySelector('.pv-frame'));
  setConn(false); scaleFrames(); paintTimers();
})();
