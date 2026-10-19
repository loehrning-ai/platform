/* Workshop 05 presenter view. Press P (or Shift+P) to open it in a second window for the speaker's laptop.
 * Shows the speaker notes of the current slide (Time, Say, Students, Cue, Remember), the step, the next slide,
 * a slide timer against the plan and a session timer. It also has Back and Next buttons, and the arrow keys, Space and Shift+R
 * work inside it, so the speaker can run the deck from this window. Vanilla, no network, no storage.
 * Notes come from <script type="application/json" id="speaker-notes"> (one string per slide, in deck order).
 */
(() => {
  'use strict';
  const deck = document.querySelector('deck-stage');
  const tag = document.getElementById('speaker-notes');
  if (!deck || !tag) return;
  const slides = Array.from(deck.querySelectorAll(':scope > section'));
  let notes = [];
  try { notes = JSON.parse(tag.textContent); } catch { notes = []; }

  const FIELDS = ['Time', 'Say', 'Students', 'Cue', 'Remember'];
  function parse(text) {
    const lines = String(text || '').split('\n');
    const out = { title: lines.shift() || '' };
    let key = null;
    lines.forEach((ln) => {
      const m = ln.match(/^(Time|Say|Students|Cue|Remember):\s*(.*)$/);
      if (m) { key = m[1]; out[key] = m[2]; } else if (key) out[key] += ' ' + ln;
    });
    return out;
  }
  const parsed = slides.map((_, i) => parse(notes[i]));
  const mainSeconds = slides.map((s) => (s.dataset.kind === 'main' ? parseInt(s.dataset.seconds || '0', 10) : 0));
  const planBefore = (i) => mainSeconds.slice(0, i).reduce((a, b) => a + b, 0);

  let win = null;
  let tick = 0;
  let sessionStart = 0, slideStart = 0, shownIndex = -1;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  const CSS = `
:root{--paper:#F3F0E9;--ink:#121212;--muted:#5B524A;--accent:#B73A15;--tanne:#1F4A38;--line:#D6CCBB;--card:#fff}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:var(--paper);color:var(--ink);font:20px/1.45 'Typing','Inter',system-ui,sans-serif;display:grid;grid-template-rows:auto 1fr auto;gap:0}
header{display:flex;align-items:center;gap:20px;padding:16px 28px;border-bottom:2px solid var(--ink);font:600 16px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase}
header .pos{color:var(--accent)}header .sp{flex:1}
main{padding:18px 28px;display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:28px;overflow:auto}
h1{margin:0 0 4px;font-size:32px;line-height:1.1;letter-spacing:-.02em}
.time{font:600 16px/1 'JetBrains Mono',ui-monospace,monospace;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:18px}
.note{display:grid;gap:10px}
.note section{background:var(--card);border:2px solid var(--ink);padding:10px 16px}
.note h2{margin:0 0 6px;font:600 14px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}
.note p{margin:0;font-size:20px;line-height:1.35}
.note .say p{font-size:24px;font-weight:500}
.note .remember{background:#FBE9E2}
aside{display:grid;gap:18px;align-content:start}
.box{border:2px solid var(--ink);background:var(--card);padding:14px 18px}
.box h2{margin:0 0 8px;font:600 14px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.big{font:700 44px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.small{font:500 16px/1.3 'JetBrains Mono',ui-monospace,monospace;color:var(--muted);margin-top:6px}
.over{color:var(--accent)}
.next b{display:block;font-size:26px;line-height:1.2;margin-bottom:6px}.next p{margin:0;font-size:18px;color:var(--muted)}
footer{display:flex;gap:12px;align-items:center;padding:14px 28px;border-top:2px solid var(--ink)}
button{font:600 16px/1 'JetBrains Mono',ui-monospace,monospace;height:44px;padding:0 18px;color:var(--ink);background:var(--paper);border:2px solid var(--ink);border-radius:0;cursor:pointer}
button:hover,button:focus-visible{box-shadow:4px 4px 0 var(--accent);transform:translate(-2px,-2px);outline:none}
.keys{margin-left:auto;font:500 14px/1.2 'JetBrains Mono',ui-monospace,monospace;color:var(--muted)}
.deck-back{display:none!important}
`;

  function build() {
    const doc = win.document;
    doc.open();
    doc.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Presenter view · Workshop 05</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>' + CSS + '</style></head><body class="presenter-preview">' +
      '<header><span id="pos" class="pos"></span><span id="lab"></span><span class="sp"></span><span id="step"></span></header>' +
      '<main><div><h1 id="title"></h1><p class="time" id="plan"></p><div class="note" id="note"></div></div>' +
      '<aside><div class="box"><h2>This slide</h2><div class="big" id="tslide">0:00</div><div class="small" id="tplan"></div></div>' +
      '<div class="box"><h2>Session</h2><div class="big" id="tsess">0:00</div><div class="small" id="tpace"></div></div>' +
      '<div class="box next"><h2>Next slide</h2><b id="nlab"></b><p id="nsay"></p></div></aside></main>' +
      '<footer><button id="b-prev" type="button">← Back</button><button id="b-next" type="button">Next →</button><button id="b-reset" type="button">Reset (Shift+R)</button><button id="b-timer" type="button">Restart timers</button>' +
      '<span class="keys">Arrows or Space: step. Shift+R: back to the cover. Esc: close.</span></footer></body></html>');
    doc.close();
    const send = (key, extra) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key, bubbles: true, cancelable: true }, extra)));
    doc.getElementById('b-prev').addEventListener('click', () => send('ArrowLeft'));
    doc.getElementById('b-next').addEventListener('click', () => send('ArrowRight'));
    doc.getElementById('b-reset').addEventListener('click', () => send('R', { shiftKey: true }));
    doc.getElementById('b-timer').addEventListener('click', () => { sessionStart = Date.now(); slideStart = Date.now(); });
    doc.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { win.close(); return; }
      if (/^(Arrow(Right|Left|Down|Up)|PageDown|PageUp| |Home|End)$/.test(e.key) || ((e.key === 'r' || e.key === 'R') && e.shiftKey)) {
        e.preventDefault();
        send(e.key, { shiftKey: e.shiftKey });
      }
    });
    shownIndex = -1;
  }

  function paint() {
    if (!win || win.closed) { teardown(); return; }
    const doc = win.document;
    const el = (id) => doc.getElementById(id);
    if (!el('title')) return;
    const active = deck.querySelector(':scope > section[data-deck-active]') || slides[0];
    const i = Math.max(0, slides.indexOf(active));
    const s = slides[i], p = parsed[i];
    if (i !== shownIndex) {
      shownIndex = i;
      slideStart = Date.now();
      const isMain = s.dataset.kind === 'main';
      el('pos').textContent = isMain ? 'Slide ' + s.dataset.n + ' / 12' : 'Appendix ' + s.dataset.n;
      el('lab').textContent = s.dataset.label || '';
      el('title').textContent = (p.title || '').replace(/^[^·]*·\s*/, '') || s.dataset.label;
      el('plan').textContent = 'Time: ' + (p.Time || '');
      el('note').innerHTML = FIELDS.filter((f) => f !== 'Time' && p[f]).map((f) =>
        '<section class="' + f.toLowerCase() + '"><h2>' + (f === 'Say' ? 'What to say' : f === 'Students' ? 'What students do' : f === 'Cue' ? 'Cue and clicks' : 'Do not forget') + '</h2><p>' + esc(p[f]) + '</p></section>').join('');
      const n = slides[i + 1];
      const np = parsed[i + 1] || {};
      el('nlab').textContent = n ? (n.dataset.kind === 'main' ? n.dataset.n + ' · ' : '') + n.dataset.label : 'End of the deck';
      el('nsay').textContent = n ? (np.Time ? 'Time: ' + np.Time : '') : '';
      const plan = mainSeconds[i];
      el('tplan').textContent = plan ? 'plan ' + mmss(plan * 1000) : 'not planned';
    }
    const steps = parseInt(s.dataset.steps || '0', 10);
    el('step').textContent = steps ? 'Step ' + (s.dataset.s || '0') + ' / ' + steps : 'No steps';
    const ts = Date.now() - slideStart, plan = mainSeconds[i] * 1000;
    const tsl = el('tslide');
    tsl.textContent = mmss(ts);
    tsl.className = 'big' + (plan && ts > plan ? ' over' : '');
    const sess = Date.now() - sessionStart;
    el('tsess').textContent = mmss(sess);
    const due = planBefore(i) * 1000;
    const diff = sess - due;
    el('tpace').textContent = 'plan at slide start ' + mmss(due) + (Math.abs(diff) < 30000 ? ', on pace' : diff > 0 ? ', ' + mmss(diff) + ' behind' : ', ' + mmss(-diff) + ' ahead');
  }

  function teardown() { clearInterval(tick); tick = 0; win = null; }

  function open() {
    if (win && !win.closed) { win.focus(); return; }
    win = window.open('', 'w05-presenter', 'width=1180,height=820');
    if (!win) return;
    sessionStart = Date.now(); slideStart = sessionStart;
    build();
    paint();
    clearInterval(tick);
    tick = setInterval(paint, 250);
    window.addEventListener('pagehide', () => { try { if (win && !win.closed) win.close(); } catch { /* ignore */ } }, { once: true });
  }

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || (e.key !== 'p' && e.key !== 'P')) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    open();
  });
  window.DECK_PRESENTER = { open };
})();
