(() => {
'use strict';
const D = JSON.parse(document.getElementById('builder-data').textContent);
const doc = document;
const $ = (s, r = doc) => r.querySelector(s);
const $$ = (s, r = doc) => Array.from(r.querySelectorAll(s));
const SVGNS = 'http://www.w3.org/2000/svg';
const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
const rootStyle = getComputedStyle(doc.documentElement);
const T = name => (RM.matches ? 0 : parseFloat(rootStyle.getPropertyValue(name)) || 0);
const STAGGER = () => T('--m-stagger');

// ------------------------------------------------------------------ easing and tweens
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = t => ((ax * t + bx) * t + cx) * t;
  const sy = t => ((ay * t + by) * t + cy) * t;
  const dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x; const d = dx(t);
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}
const EASE = { out: bezier(0.16, 1, 0.3, 1), inout: bezier(0.65, 0, 0.35, 1), stamp: bezier(0.16, 1, 0.3, 1) };
const css = name => rootStyle.getPropertyValue(name).trim();
const EASE_CSS = { out: css('--ease-out') || 'ease-out', travel: css('--ease-travel') || 'ease-in-out' };
const C = { paper: css('--paper'), papier: css('--papier'), ink: css('--ink'), beton: css('--beton') };
const running = new WeakMap();
function tween(key, dur, ease, fn) {
  const token = {};
  running.set(key, token);
  if (!dur) { fn(1); return; }
  const t0 = performance.now();
  const step = now => {
    if (running.get(key) !== token) return;
    const p = Math.min(1, (now - t0) / dur);
    fn(ease(p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const lerp = (a, b, p) => a + (b - a) * p;
const later = (ms, fn) => (ms ? setTimeout(fn, ms) : fn());
// One generation counter per animated sequence. Starting a run (or any action that takes over the
// same view) bumps the counter, so timers left over from an older run do nothing.
function sequence() {
  let gen = 0;
  return { start: () => ++gen, stop: () => { gen++; }, at: (g, ms, fn) => later(ms, () => { if (g === gen) fn(); }) };
}
// Let long identifiers break only after '.' or '_', never inside a word.
function addBreaks(root = doc) {
  $$('code, .stack__col .mono, .lane .mono, .tree .fname, .downloads .mono, .colbtn', root).forEach(n => {
    if (n.dataset.wbr || n.closest('pre')) return;
    n.dataset.wbr = '1';
    const walker = doc.createTreeWalker(n, NodeFilter.SHOW_TEXT), texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(t => {
      if (!/[._]\w/.test(t.data)) return;
      const parts = t.data.split(/(?<=[._])(?=\w)/), frag = doc.createDocumentFragment();
      parts.forEach((part, i) => { frag.appendChild(doc.createTextNode(part)); if (i < parts.length - 1) frag.appendChild(doc.createElement('wbr')); });
      t.replaceWith(frag);
    });
  });
  // A code block that scrolls sideways must be reachable by keyboard.
  $$('pre.code', root).forEach(p => {
    if (p.scrollWidth > p.clientWidth + 1) { if (!p.hasAttribute('tabindex')) { p.tabIndex = 0; p.dataset.scrollTab = '1'; } }
    else if (p.dataset.scrollTab) { p.removeAttribute('tabindex'); delete p.dataset.scrollTab; }
  });
}

// ------------------------------------------------------------------ formatting
const MINUS = '−';
const NB = ' ';
const grp = n => Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const int = n => (n < 0 ? MINUS : '') + grp(n);
const eur = n => (n < 0 ? MINUS : '') + '€' + grp(n);
const signed = n => (n > 0 ? '+' : n < 0 ? MINUS : '') + grp(n);
const pct = (x, d = 1) => x.toFixed(d) + NB + '%';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
const passChip = (word = 'Matches') => `<span class="chip chip--pass"><svg class="icon icon--s" aria-hidden="true"><use href="#i-pass"/></svg>${word}</span>`;
const failChip = (word = "Doesn't match") => `<span class="chip chip--fail">${word}</span>`;
const gapChip = w => `<span class="chip chip--gap">${w}</span>`;
function el(tag, attrs = {}, html) {
  const e = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') e.className = v; else e.setAttribute(k, v === true ? '' : v);
  }
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function svg(tag, attrs = {}, text) {
  const e = doc.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
}
function say(node, text) { if (node) node.textContent = text; }
function get(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }

// ------------------------------------------------------------------ numbers from JSON
window.__numberDrift = [];
$$('[data-n]').forEach(n => {
  const v = get(D, n.dataset.n);
  const text = int(v);
  if (n.textContent.trim() !== text) window.__numberDrift.push([n.dataset.n, n.textContent, text]);
  n.textContent = text;
});
(() => {
  const bad = $('[data-recap="bad"]'), good = $('[data-recap="good"]');
  const b = D.recorded.g01.map(eur).join(' / ');
  const g = D.tub.slice(4).map(t => eur(t.end)).join(' / ');
  if (bad.textContent !== b) window.__numberDrift.push(['recap.bad', bad.textContent, b]);
  if (good.textContent !== g) window.__numberDrift.push(['recap.good', good.textContent, g]);
  bad.textContent = b; good.textContent = g;
  $$('[data-q]').forEach(q => { q.textContent = D.question; });
})();

// ------------------------------------------------------------------ strip: height, current part, depth
const strip = $('#strip');
function setStripH() { doc.documentElement.style.setProperty('--strip-h', strip.offsetHeight + 'px'); }
setStripH();
window.addEventListener('resize', setStripH);
const partLinks = $$('.parts a');
if ('IntersectionObserver' in window) {
  const seen = new Map();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => seen.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null));
    let best = null, bestTop = -Infinity;
    for (const [id, top] of seen) if (top !== null && top <= window.innerHeight * 0.45 && top > bestTop) { best = id; bestTop = top; }
    if (!best) for (const [id, top] of seen) if (top !== null) { best = id; break; }
    partLinks.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + best ? 'true' : 'false'));
  }, { rootMargin: '-10% 0px -50% 0px', threshold: [0, 0.01] });
  $$('section.part').forEach(s => io.observe(s));
}
const DEPTH_KEY = 'builder-guide-depth';
function setDepth(v, store = true) {
  doc.documentElement.dataset.depth = v;
  $$('details.builders').forEach(d => { d.open = v === 'builder'; });
  $$('input[name="depth"]').forEach(i => { i.checked = i.value === v; });
  if (store) { try { localStorage.setItem(DEPTH_KEY, v); } catch (e) { /* storage unavailable */ } }
}
$$('input[name="depth"]').forEach(i => i.addEventListener('change', () => setDepth(i.value)));
try { const saved = localStorage.getItem(DEPTH_KEY); if (saved === 'builder' || saved === 'beginner') setDepth(saved, false); } catch (e) { /* ignore */ }

// ------------------------------------------------------------------ generic tabs (buttons, arrow keys)
function makeTabs(list, items, onSelect, idPrefix) {
  const panelId = list.getAttribute('aria-controls') || list.nextElementSibling.id;
  const btns = items.map((it, i) => {
    const b = el('button', { class: 'btn', type: 'button', role: 'tab', id: `${idPrefix}-${it.id}`, 'aria-selected': i === 0 ? 'true' : 'false', 'aria-controls': panelId, tabindex: i === 0 ? '0' : '-1' }, esc(it.tab));
    b.addEventListener('click', () => select(i, true));
    b.addEventListener('keydown', e => {
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % btns.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + btns.length) % btns.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = btns.length - 1;
      if (j !== null) { e.preventDefault(); select(j, true); btns[j].focus(); }
    });
    list.appendChild(b);
    return b;
  });
  function select(i, user) {
    btns.forEach((b, k) => { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
    const panel = doc.getElementById(panelId);
    if (panel) panel.setAttribute('aria-labelledby', btns[i].id);
    onSelect(items[i], i, user);
  }
  select(0, false);
  return select;
}

// ================================================================== M1 bathtub
(() => {
  const tub = D.tub;
  const svgEl = $('#tub-svg');
  const range = $('#tub-range'), out = $('#tub-month'), ledger = $('#tub-ledger'), live = $('#tub-live');
  const recChk = $('#tub-recorded'), emptyChk = $('#tub-empty');
  const MAX = 420000, FLOOR = 330, TOP = 58, H = FLOOR - TOP;
  const y = v => FLOOR - (v / MAX) * H;
  // table for screen readers
  const tb = $('#tub-table tbody');
  tub.forEach((t, i) => tb.appendChild(el('tr', {}, `<th scope="row">${t.label}</th><td>${eur(t.end)}</td><td>${i ? signed(t.chg) : 'starting level'}</td>`)));

  // static drawing
  const g = svg('g');
  [100000, 200000, 300000, 400000].forEach(v => {
    g.appendChild(svg('line', { class: 'grid', x1: 34, x2: 296, y1: y(v), y2: y(v) }));
    g.appendChild(svg('text', { class: 't-small', x: 304, y: y(v) + 4 }, '€' + v / 1000 + 'k'));
  });
  g.appendChild(svg('text', { class: 't-small', x: 304, y: FLOOR + 4 }, '0'));
  svgEl.appendChild(g);
  const water = svg('rect', { class: 'water', x: 32, width: 262, y: FLOOR, height: 0 });
  svgEl.appendChild(water);
  const prevLine = svg('line', { class: 'gapline', x1: 34, x2: 292, y1: FLOOR, y2: FLOOR, opacity: 0 });
  svgEl.appendChild(prevLine);
  const flow = svg('path', { class: 'flow', d: '' });
  const flowHead = svg('path', { class: 'flowhead', d: '' });
  svgEl.appendChild(flow); svgEl.appendChild(flowHead);
  const flowText = svg('text', { x: 294, y: 28, 'font-weight': 700, 'text-anchor': 'end' }, '');
  svgEl.appendChild(flowText);
  const levelText = svg('text', { class: 't-big', x: 32, y: 30 }, '');
  svgEl.appendChild(levelText);
  const overlay = svg('g');
  svgEl.appendChild(overlay);
  svgEl.appendChild(svg('path', { class: 'ink', d: `M30 ${TOP - 14} V${FLOOR + 2} H296 V${TOP - 14}` }));
  // bar chart of levels
  const chart = svg('g');
  const bx = i => 368 + i * 38;
  const bars = tub.map((t, i) => {
    const r = svg('rect', { class: 'bar', x: bx(i), width: 24, y: y(t.end), height: FLOOR - y(t.end) });
    chart.appendChild(r);
    chart.appendChild(svg('text', { class: 't-small', x: bx(i) + 12, y: FLOOR + 20, 'text-anchor': 'middle' }, t.label.slice(0, 3)));
    return r;
  });
  chart.appendChild(svg('line', { class: 'ink', x1: 360, x2: 636, y1: FLOOR, y2: FLOOR }));
  chart.appendChild(svg('text', { class: 't-small', x: 360, y: 26 }, 'Month-end levels'));
  const chartOverlay = svg('g');
  chart.appendChild(chartOverlay);
  svgEl.appendChild(chart);

  const fit = () => { const narrow = svgEl.clientWidth && svgEl.clientWidth < 480; svgEl.setAttribute('viewBox', narrow ? '0 0 358 400' : '0 0 640 400'); chart.style.display = narrow ? 'none' : ''; };
  fit(); window.addEventListener('resize', fit);
  let cur = 0, shownLevel = tub[0].end, showGap = false;
  function drawOverlays() {
    overlay.textContent = ''; chartOverlay.textContent = '';
    let k = 0;
    const addAnim = node => { node.style.animation = `fade var(--m-fade) linear ${k++ * STAGGER()}ms both`; return node; };
    if (recChk.checked) {
      D.recorded.g01.forEach((v, j) => {
        const i = 4 + j;
        const top = Math.min(y(v), FLOOR), h = Math.max(4, Math.abs(y(v) - FLOOR));
        chartOverlay.appendChild(addAnim(svg('rect', { class: 'bar-wrong', x: bx(i) + 8, width: 16, y: v < 0 ? FLOOR : top, height: h })));
      });
      if (cur >= 4) {
        const v = D.recorded.g01[cur - 4];
        const yy = v < 0 ? FLOOR + 14 : y(v);
        if (v < 0) overlay.appendChild(addAnim(svg('rect', { class: 'bar-wrong', x: 32, width: 262, y: FLOOR + 2, height: 16 })));
        else overlay.appendChild(addAnim(svg('rect', { class: 'bar-wrong', x: 32, width: 262, y: yy - 6, height: 12 })));
        overlay.appendChild(addAnim(svg('text', { x: 40, y: v < 0 ? FLOOR + 36 : yy - 28, 'font-weight': 700 }, `Recorded AI: ${eur(v)}`)));
        overlay.appendChild(addAnim(svg('text', { x: 40, y: v < 0 ? FLOOR + 54 : yy - 12 }, "Doesn't match")));
      }
    }
    if (emptyChk.checked) {
      D.tub.forEach((t, i) => {
        if (i === 0) return;
        const run = runningFromJan(i);
        chartOverlay.appendChild(addAnim(svg('rect', { class: 'bar-empty', x: bx(i) - 4, width: 32, y: y(run), height: FLOOR - y(run) })));
      });
      if (cur >= 1) {
        const run = runningFromJan(cur);
        overlay.appendChild(addAnim(svg('line', { class: 'gapline', x1: 34, x2: 292, y1: y(run), y2: y(run) })));
        overlay.appendChild(addAnim(svg('text', { x: 40, y: y(run) - 26, 'font-weight': 700 }, `Empty tub: ${int(run)}`)));
        overlay.appendChild(addAnim(svg('text', { x: 40, y: y(run) - 8 }, `short by ${int(tub[0].end)}`)));
      }
    }
    if (showGap && cur === 6) {
      const y1 = y(D.q2.start), y2 = y(D.q2.end);
      overlay.appendChild(addAnim(svg('line', { class: 'gapline', x1: 34, x2: 292, y1, y2: y1 })));
      overlay.appendChild(addAnim(svg('path', { class: 'ink', d: `M250 ${y1} H262 V${y2} H250` })));
      overlay.appendChild(addAnim(svg('text', { x: 244, y: y1 + 20, 'font-weight': 700, 'text-anchor': 'end' }, `Q2 net new ${int(D.q2.netNew)}`)));
    }
  }
  function runningFromJan(i) { let s = 0; for (let k = 1; k <= i; k++) s += tub[k].chg; return s; }
  function ledgerLines() {
    const lines = [];
    lines.push({ t: `Dec 2025  ending ${int(tub[0].end)} (starting level)`, i: 0 });
    for (let i = 1; i <= cur; i++) lines.push({ t: `${tub[i].label.slice(0, 3)}  ${int(tub[i - 1].end)} ${tub[i].chg < 0 ? MINUS : '+'} ${grp(tub[i].chg)} = ${int(tub[i].end)}`, i });
    if (recChk.checked && cur >= 4) lines.push({ t: `Recorded AI: ${D.recorded.g01.slice(0, cur - 3).map(int).join(' / ')} as levels`, wrong: true });
    if (emptyChk.checked && cur >= 1) {
      const parts = []; for (let k = 1; k <= cur; k++) parts.push((k === 1 ? '' : tub[k].chg < 0 ? ` ${MINUS} ` : ' + ') + grp(tub[k].chg));
      lines.push({ t: `Empty tub: 0 + ${parts.join('')} = ${int(runningFromJan(cur))}`, wrong: true });
    }
    return lines;
  }
  function render(animate = true) {
    const t = tub[cur];
    out.value = t.label; out.textContent = t.label;
    range.value = cur;
    bars.forEach((b, i) => b.classList.toggle('is-now', i === cur));
    const from = shownLevel, to = t.end;
    const prev = cur ? tub[cur - 1].end : t.end;
    prevLine.setAttribute('y1', y(prev)); prevLine.setAttribute('y2', y(prev));
    prevLine.setAttribute('opacity', cur ? 1 : 0);
    const dGrow = animate ? T('--m-grow') : 0, dCount = animate ? T('--m-count') : 0, dTravel = animate ? T('--m-travel') : 0;
    tween(water, dGrow, EASE.out, p => {
      const v = lerp(from, to, p);
      water.setAttribute('y', y(v)); water.setAttribute('height', FLOOR - y(v));
      shownLevel = v;
    });
    tween(levelText, dCount, EASE.out, p => {
      const v = lerp(from, to, p);
      levelText.textContent = eur(v);
    });
    if (cur) {
      const x = 272, ya = y(prev), yb = y(to);
      tween(flow, dTravel, EASE.out, p => {
        const ye = lerp(ya, yb, p);
        flow.setAttribute('d', `M${x} ${ya} V${ye}`);
        const dir = yb > ya ? 1 : -1;
        flowHead.setAttribute('d', `M${x - 8} ${ye - dir * 10} L${x} ${ye} L${x + 8} ${ye - dir * 10} Z`);
      });
      flowText.textContent = 'change ' + signed(t.chg);
    } else { flow.setAttribute('d', ''); flowHead.setAttribute('d', ''); flowText.textContent = ''; }
    drawOverlays();
    ledger.textContent = '';
    ledgerLines().forEach((l, k, arr) => {
      const li = el('li', { class: (l.i === cur ? 'is-now ' : '') + (l.wrong ? 'wrong' : '') }, esc(l.t));
      if (k === arr.length - 1 && animate) li.classList.add('rise');
      ledger.appendChild(li);
    });
    let msg = `${t.label}: ending MRR ${eur(t.end)}` + (cur ? `, after a change of ${signed(t.chg)}.` : ', the starting level.');
    if (recChk.checked && cur >= 4) msg += ` The recorded AI answer plotted ${eur(D.recorded.g01[cur - 4])} as the level. Doesn't match.`;
    if (emptyChk.checked && cur >= 1) msg += ` Starting from an empty tub gives ${int(runningFromJan(cur))}, short by ${int(tub[0].end)}.`;
    say(live, msg);
  }
  const go = i => { cur = Math.max(0, Math.min(tub.length - 1, i)); render(); };
  range.addEventListener('input', () => go(+range.value));
  $('#tub-prev').addEventListener('click', () => go(cur - 1));
  $('#tub-next').addEventListener('click', () => go(cur + 1));
  recChk.addEventListener('change', () => render(false));
  emptyChk.addEventListener('change', () => render(false));
  const verdict = $('#tub-verdict');
  $('#tub-quiz').addEventListener('submit', e => {
    e.preventDefault();
    const raw = $('#tub-answer').value.trim().replace(/[−–]/g, '-').replace(/[.,]\d{1,2}(?=\D*$)/, '').replace(/[^0-9-]/g, '');
    const n = parseInt(raw, 10);
    let html;
    if (n === D.q2.netNew) { html = `${passChip()} ${int(D.q2.netNew)} = ${int(D.q2.end)} ${MINUS} ${int(D.q2.start)}: the gap between the March and June water lines.`; showGap = true; go(6); }
    else if (n === D.q2.levelsSum) html = `${failChip()} ${int(n)} adds three levels. Levels never add across months.`;
    else if (n === D.recorded.g02) html = `${failChip()} ${int(n)} is June's change minus March's change, the recorded export-lane answer. Changes are not levels.`;
    else if (n === D.q2.end) html = `${failChip()} ${int(n)} is the June level. The question asks for the change.`;
    else if (n === D.tub[6].chg) html = `${failChip()} ${int(n)} is June's change only. Add April and May too.`;
    else if (Number.isNaN(n)) html = 'Type a number, for example 12,345.';
    else html = `${failChip()} Hint: subtract the March level from the June level, or add the three Q2 changes.`;
    verdict.innerHTML = html;
  });
  $('#tub-reveal').addEventListener('click', () => {
    showGap = true; go(6);
    verdict.innerHTML = `${'<span class="chip chip--muted">Answer</span>'} ${int(D.q2.end)} ${MINUS} ${int(D.q2.start)} = ${int(D.q2.netNew)}, and ${D.tub.slice(4).map(t => signed(t.chg)).join(' ')} = ${int(D.q2.netNew)}. Both roads give the same gap.`;
  });
  render(false);
  window.__m1Final = () => { showGap = true; cur = 6; render(false); };
})();

// ================================================================== M2 trays
(() => {
  const cards = D.m2cards;
  const list = $('#m2-cards'), live = $('#m2-live');
  let selected = null;
  const placed = {};
  const trayName = { additive: 'Additive', semi: 'Semi-additive', non: 'Non-additive' };
  cards.forEach(c => {
    const li = el('li');
    const b = el('button', { class: 'mcard', type: 'button', 'aria-pressed': 'false', 'data-card': c.id }, `${esc(c.name)}<small>${esc(c.sub)}</small>`);
    b.addEventListener('click', () => {
      selected = selected === c.id ? null : c.id;
      $$('.mcard', list).forEach(x => x.setAttribute('aria-pressed', x.dataset.card === selected ? 'true' : 'false'));
      say(live, selected ? `${c.name} selected. Now pick a tray.` : 'Nothing selected.');
    });
    li.appendChild(b); list.appendChild(li);
  });
  $$('[data-tray-btn]').forEach(btn => btn.addEventListener('click', () => {
    const tray = btn.dataset.trayBtn;
    if (!selected) { say(live, 'Pick a card first, then a tray.'); return; }
    const c = cards.find(x => x.id === selected);
    const ul = $(`[data-tray="${tray}"] ul`);
    $$(`[data-placed="${c.id}"]`).forEach(n => n.remove());
    const ok = c.tray === tray;
    const item = el('li', { class: (ok ? 'ok' : 'wrong') + ' stamp', 'data-placed': c.id },
      ok ? `<strong>${esc(c.name)}</strong><span>${esc(c.ok)}</span>${passChip()}`
         : `<strong>${esc(c.name)}</strong><span>${esc(c.wrong[tray])}</span><span>${failChip()}</span>`);
    ul.appendChild(item);
    if (ok) { placed[c.id] = true; const cb = $(`[data-card="${c.id}"]`); cb.closest('li').hidden = true; }
    selected = null;
    $$('.mcard', list).forEach(x => x.setAttribute('aria-pressed', 'false'));
    const done = Object.keys(placed).length;
    say(live, ok ? `${c.name} in ${trayName[tray]}: matches. ${c.ok} ${done} of ${cards.length} placed.` : `${c.name} in ${trayName[tray]}: doesn't match. ${c.wrong[tray]} Pick the card again and try another tray.`);
  }));
  window.__m2Final = () => cards.forEach(c => { if (!placed[c.id]) { selected = c.id; $(`[data-tray-btn="${c.tray}"]`).click(); } });

  // Average or pool
  const W = D.web, range = $('#pool-range'), out = $('#pool-out'), bars = $('#pool-bars'), tbody = $('#pool-table tbody'), plive = $('#pool-live');
  const MAXP = 10;
  const rows = [
    { k: 'search', label: 'Search', kind: 'fill' },
    { k: 'email', label: 'Email', kind: 'fill' },
    { k: 'avg', label: 'Average of rates', kind: 'mark' },
    { k: 'pool', label: 'Pooled', kind: 'mark', look: true }
  ];
  const nodes = {};
  rows.forEach(r => {
    const row = el('div', { class: 'barrow' }, `<span>${r.label}</span><span class="track">${r.kind === 'fill' ? '<span class="fill"></span>' : `<span class="mark${r.look ? ' is-look' : ''}"></span>`}</span><span class="v"></span>`);
    bars.appendChild(row);
    nodes[r.k] = { bar: $(r.kind === 'fill' ? '.fill' : '.mark', row), v: $('.v', row) };
  });
  function pool() {
    const s = +range.value;
    const eo = s * W.emailRatePct / 100;
    const search = 100 * W.searchOrders / W.searchSessions, email = W.emailRatePct;
    const avg = (search + email) / 2, pooled = 100 * (W.searchOrders + eo) / (W.searchSessions + s);
    out.textContent = grp(s); out.value = grp(s);
    const set = (k, v, fill) => { if (fill) nodes[k].bar.style.width = (v / MAXP * 100) + '%'; else nodes[k].bar.style.left = `calc(${v / MAXP * 100}% - 2px)`; nodes[k].v.textContent = pct(v, 2); };
    set('search', search, true); set('email', email, true); set('avg', avg, false); set('pool', pooled, false);
    tbody.innerHTML = `<tr><th scope="row">Search</th><td>${pct(search, 2)}</td></tr><tr><th scope="row">Email</th><td>${pct(email, 2)}</td></tr><tr><th scope="row">Average of rates</th><td>${pct(avg, 2)}</td></tr><tr><th scope="row">Pooled</th><td>${pct(pooled, 2)}</td></tr>`;
    say(plive, `Email ${grp(s)} sessions: average of rates ${pct(avg, 2)}, pooled ${grp(W.searchOrders + eo)} of ${grp(W.searchSessions + s)} = ${pct(pooled, 2)}.` + (Math.abs(avg - pooled) < 0.005 ? ' Equal bases: the two agree, by luck.' : ''));
  }
  range.addEventListener('input', pool);
  pool();
})();

// ================================================================== M3 semantic layer
(() => {
  const blanksEl = $('#m3-blanks'), guess = $('#m3-guess'), fileEl = $('#m3-file'), readersEl = $('#m3-readers'), live = $('#m3-live');
  const blankNodes = D.blanks.map(b => {
    const n = el('div', { class: 'blank is-empty' }, `<span class="label">${esc(b.label)}</span><span class="blank__v">?</span>`);
    blanksEl.appendChild(n); return n;
  });
  let mode = 'without';
  const seq = sequence();
  function setMode(m, animate) {
    mode = m;
    const g = seq.start();
    $$('[data-sem]').forEach(b => b.setAttribute('aria-pressed', b.dataset.sem === m ? 'true' : 'false'));
    blankNodes.forEach((n, i) => {
      const v = $('.blank__v', n);
      const apply = () => {
        n.classList.toggle('is-empty', m === 'without');
        v.textContent = m === 'with' ? D.blanks[i].with : '?';
        v.classList.remove('rise'); void v.offsetWidth; if (animate) v.classList.add('rise');
        blankNodes.forEach(x => x.classList.remove('is-look'));
        if (m === 'with' && animate) { n.classList.add('is-look'); seq.at(g, T('--m-rise'), () => n.classList.remove('is-look')); }
      };
      animate ? seq.at(g, i * STAGGER(), apply) : apply();
    });
    if (m === 'without') {
      guess.className = 'guess';
      guess.innerHTML = `<span>Guesses: ${D.blanks.map(b => esc(b.guess)).join('; ')}. Result: ${D.recorded.g01.map(eur).join(' / ')} labelled <code>ending_mrr</code>.</span> ${failChip()}`;
    } else {
      guess.className = 'panel';
      guess.innerHTML = `Answer: ${D.tub.slice(4).map(t => eur(t.end)).join(' / ')}. Trace: <code>ending_mrr</code> 1.0.0, <code>analytics.mrr_summary_monthly</code>. ${passChip()}`;
    }
    readersEl.style.setProperty('--drawn', m === 'with' ? 1 : 0.15);
    say(live, m === 'with' ? 'With definitions: all four blanks are filled and the answer matches.' : 'Without definitions: four blanks, four guesses, and a wrong answer.');
  }
  $$('[data-sem]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.sem, true)));
  const readerBtns = D.readers.map((r, i) => {
    const b = el('button', { class: 'btn reader-btn', type: 'button', 'aria-pressed': 'false' }, esc(r.name));
    b.addEventListener('click', () => showReader(i));
    readersEl.appendChild(b); return b;
  });
  function showReader(i) {
    const r = D.readers[i];
    readerBtns.forEach((b, k) => { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); b.classList.toggle('is-look', k === i); });
    fileEl.innerHTML = `<p class="mono" style="margin:0 0 8px"><strong>${esc(r.file)}</strong></p><p style="margin:0 0 10px">${gapChip(esc(r.version))}</p><pre class="code fade" style="margin:0">${esc(r.body)}</pre>`;
  }
  setMode('without', false);
  showReader(0);
  readerBtns[0].setAttribute('aria-pressed', 'true');
  window.__m3Final = () => setMode('with', false);
})();

// ================================================================== M4 lineage
(() => {
  const lanes = { source: $('[data-layer="source"]'), core: $('[data-layer="core"]'), analytics: $('[data-layer="analytics"]') };
  const body = k => $('.lane__body', lanes[k]);
  body('source').innerHTML = `<p class="mono">source.billing_account_mrr<br>2,592 rows · mrr_cents · period text</p><p class="mono">source.crm_accounts<br>144 rows · A/C/N codes</p><p class="mono">source.billing_events<br>with retry copies</p><p class="mono">source.load_log</p>`;
  const dots = Array.from({ length: D.trace.rows }, (_, i) => `<i class="${i < D.trace.withMrr ? 'f' : ''}"></i>`).join('');
  body('core').innerHTML = `<p class="mono">core.stg_billing_account_mrr<br>cents → EUR · period → month_start</p><p class="mono">core.account_months<br>2,592 rows · key (account_id, month_start)</p><div class="dots" id="m4-dots" aria-hidden="true">${dots}</div><p class="mono">core.accounts · core.mrr_movements · core.load_status</p>`;
  body('analytics').innerHTML = `<p class="mono">analytics.mrr_summary_monthly</p><button class="btn btn--small" type="button" id="m4-april">2026-04-01 · ${eur(D.trace.april)}</button><p class="mono" style="margin-top:10px">+ four more approved views</p>`;
  const ledger = $('#m4-ledger'), live = $('#m4-live');
  const edges = $$('.edge', $('#m4-lanes'));
  function clearLook() { Object.values(lanes).forEach(l => l.classList.remove('is-look')); $$('.fixnote').forEach(n => n.remove()); $$('#m4-traps .btn').forEach(b => b.setAttribute('aria-pressed', 'false')); }
  const seq = sequence();
  function trace() {
    const g = seq.start();
    clearLook();
    ledger.textContent = '';
    edges.forEach(e => e.classList.remove('is-drawn'));
    const lines = [
      ['analytics', `analytics.mrr_summary_monthly · month_start 2026-04-01 · ending_mrr_eur ${int(D.trace.april)}`],
      ['core', `← core.account_months · ${D.trace.rows} rows for April, ${D.trace.withMrr} with MRR above 0 · sum ${int(D.trace.april)}`],
      ['core', `← core.stg_billing_account_mrr · period '2026-04' → month_start · cents → EUR`],
      ['source', `← source.billing_account_mrr · ${D.trace.rows} rows · sum(mrr_cents) / 100 = ${int(D.trace.april)}`],
      ['core', `← core.load_status · complete through 2026-06-01 · quality passing · loaded ${D.fresh.loaded}`]
    ];
    const st = STAGGER();
    lines.forEach(([layer, text], i) => seq.at(g, i * st, () => {
      Object.values(lanes).forEach(l => l.classList.remove('is-look'));
      lanes[layer].classList.add('is-look');
      ledger.appendChild(el('li', { class: 'rise' }, esc(text)));
      if (layer === 'core') { $('#m4-dots').classList.add('is-on'); edges[1].classList.add('is-drawn'); }
      if (layer === 'source') edges[0].classList.add('is-drawn');
    }));
    seq.at(g, lines.length * st, () => {
      ledger.appendChild(el('li', { class: 'rise' }, `Reconciled: ${int(D.trace.april)} = ${int(D.trace.april)} = ${int(D.trace.april)} ${passChip()}`));
      Object.values(lanes).forEach(l => l.classList.remove('is-look'));
    });
    say(live, `Traced April ${eur(D.trace.april)}: the view, ${D.trace.rows} core rows (${D.trace.withMrr} with MRR above 0), the staging step and the source feed all give ${int(D.trace.april)}.`);
  }
  $('#m4-trace').addEventListener('click', trace);
  $('#m4-april').addEventListener('click', trace);
  const trapsEl = $('#m4-traps');
  D.traps.forEach(t => {
    const b = el('button', { class: 'btn btn--small', type: 'button', 'aria-pressed': 'false' }, esc(t.label));
    b.addEventListener('click', () => {
      seq.stop();
      clearLook();
      b.setAttribute('aria-pressed', 'true');
      lanes[t.layer].classList.add('is-look');
      const note = el('p', { class: 'fixnote rise' }, `<strong>Fixed in ${t.layer}.</strong> ${esc(t.fix)} <span class="label" style="margin-top:4px">Caught by ${esc(t.test)}</span>`);
      body(t.layer).appendChild(note);
      say(live, `${t.label}: fixed in ${t.layer}. ${t.fix} Caught by ${t.test}.`);
    });
    trapsEl.appendChild(b);
  });
  const dirBox = $('#m4-directbox');
  $('#m4-direct').addEventListener('change', e => {
    seq.stop();
    Object.values(lanes).forEach(l => l.classList.remove('is-look'));
    dirBox.innerHTML = e.target.checked
      ? `<div class="direct rise"><p style="margin:0 0 6px"><span class="endcap" aria-hidden="true"></span><strong>Question → saas_bad.public.monthly_revenue</strong>, no layers, no names, no definition.</p><p class="mono" style="margin:0 0 6px">SELECT dt, SUM(amount) AS ending_mrr … → ${D.recorded.g01.map(eur).join(' / ')}</p><p style="margin:0 0 8px">${failChip()}</p><p style="margin:0">The sums are the true monthly changes: ${D.tub.slice(4).map(t => signed(t.chg)).join(' ')} = ${int(D.q2.netNew)}, exactly Q2 net new. The table was unlabelled, not wrong.</p></div>`
      : '';
    say(live, e.target.checked ? `Direct route: the AI read the export and answered ${D.recorded.g01.map(eur).join(', ')}. Doesn't match.` : 'Direct route removed.');
  });
  window.__m4Final = () => {
    const save = RM.matches; trace(); return save;
  };
})();

// ================================================================== M5 names
(() => {
  const names = D.names;
  const cols = $('#m5-cols'), panel = $('#m5-panel'), count = $('#m5-count');
  let mode = 'learn', sel = 0;
  const fixed = new Set();
  const btns = names.map((n, i) => {
    const b = el('button', { class: 'colbtn', type: 'button', 'aria-pressed': 'false' }, esc(n.bad));
    b.addEventListener('click', () => { sel = i; show(); });
    cols.appendChild(b); return b;
  });
  function updateCount() {
    const left = names.length - fixed.size;
    count.textContent = `Names that forced a guess: ${left} of ${names.length}` + (left === 0 ? ` → 0. Every name now says what it holds.` : '');
    btns.forEach((b, i) => b.classList.toggle('is-fixed', fixed.has(i)));
  }
  function fixedHtml(n) {
    return `<div class="namecard"><div><span class="label">Before</span><span class="oldname" id="m5-old">${esc(n.bad)}</span><p class="fig__note">${esc(n.where)}</p></div><div><span class="label">After</span><span class="newname" id="m5-new"></span><p><span class="chip chip--muted rise" id="m5-rule">${esc(n.rule)}</span></p></div></div><p style="margin:12px 0 6px"><strong>Why the old name failed.</strong> ${esc(n.why)}</p><pre class="code" style="margin:0">COMMENT: '${esc(n.comment)}'</pre>`;
  }
  function animateFix(n) {
    const old = $('#m5-old'), nw = $('#m5-new');
    requestAnimationFrame(() => old.classList.add('is-struck'));
    const full = n.good, dur = T('--m-count');
    if (!dur) { nw.textContent = full; return; }
    const t0 = performance.now();
    const step = now => { const p = Math.min(1, (now - t0) / dur); nw.textContent = full.slice(0, Math.ceil(full.length * EASE.out(p))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function show() {
    btns.forEach((b, i) => b.setAttribute('aria-pressed', i === sel ? 'true' : 'false'));
    const n = names[sel];
    if (fixed.has(sel)) { panel.innerHTML = fixedHtml(n); $('#m5-old').classList.add('is-struck'); $('#m5-new').textContent = n.good; return; }
    if (mode === 'learn') {
      panel.innerHTML = `<p style="margin:0 0 4px"><code>${esc(n.bad)}</code> in <code>${esc(n.where)}</code></p><h3 style="margin-top:10px">What would you have to guess?</h3><ul class="guesses">${n.guesses.map(g => `<li>${esc(g)}</li>`).join('')}</ul><button class="btn btn--ink" type="button" id="m5-fix">Fix it</button>`;
      $('#m5-fix').addEventListener('click', () => doFix());
    } else {
      const opts = n.quiz.slice().sort((a, b) => (a.length * 7 + sel) % 5 - (b.length * 7 + sel) % 5);
      panel.innerHTML = `<p style="margin:0 0 8px">Which name would a stranger read correctly instead of <code>${esc(n.bad)}</code>?</p><div class="fig__controls" id="m5-opts">${opts.map(o => `<button class="btn" type="button" data-opt="${esc(o)}"><code>${esc(o)}</code></button>`).join('')}</div><p class="live" id="m5-qfb"></p>`;
      $$('[data-opt]', panel).forEach(b => b.addEventListener('click', () => {
        if (b.dataset.opt === n.quiz[0]) doFix();
        else $('#m5-qfb').innerHTML = `${failChip()} <code>${esc(b.dataset.opt)}</code> still forces a guess. Say the shape, the unit, the time or the grain.`;
      }));
    }
  }
  function doFix() {
    fixed.add(sel);
    const n = names[sel];
    panel.innerHTML = fixedHtml(n);
    animateFix(n);
    updateCount();
    const next = names.findIndex((_, i) => !fixed.has(i));
    if (next >= 0) {
      const nb = el('button', { class: 'btn', type: 'button', style: null }, `Next: <code>${esc(names[next].bad)}</code>`);
      nb.addEventListener('click', () => { sel = next; show(); btns[next].focus(); });
      panel.appendChild(el('p', { class: 'no-print' })).appendChild(nb);
    }
    // The button that was pressed is gone; move focus to the next step, or to the panel.
    (panel.querySelector('.no-print .btn') || panel).focus();
  }
  $$('[data-m5mode]').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.m5mode;
    $$('[data-m5mode]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    show();
  }));
  updateCount(); show();
  window.__m5Final = () => { names.forEach((_, i) => fixed.add(i)); updateCount(); show(); };
})();

// ================================================================== M6 grain + DDL + tradeoffs
(() => {
  const G = D.grain, canvas = $('#grain-canvas'), ctx = canvas.getContext('2d');
  const range = $('#grain-range'), out = $('#grain-out'), cap = $('#grain-cap'), qs = $('#grain-qs');
  const W = canvas.width, Hh = canvas.height;
  const nAcc = G.accounts, nMon = G.monthsServed;
  const pos = [[], [], []];
  const segOf = a => a % 3;
  for (let m = 0; m < nMon; m++) for (let a = 0; a < nAcc; a++) {
    const i = m * nAcc + a;
    pos[0].push([(i % 72) * 10 + 5, Math.floor(i / 72) * 10 + 5]);
    const colX = 34 + m * ((W - 60) / (nMon - 1));
    pos[1].push([colX, 70 + segOf(a) * 110]);
    pos[2].push([colX, Hh / 2]);
  }
  const LABELS = [
    `${grp(G.accountMonth)} rows: one per account and month`,
    `${grp(G.segmentMonth)} rows: one per segment and month`,
    `${grp(G.month)} rows: one per month`
  ];
  let stage = 0;
  const cur = pos[0].map(q => q.slice());
  let curAlpha = 1;
  function paint(b, k) {
    ctx.clearRect(0, 0, W, Hh);
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, Hh);
    ctx.globalAlpha = curAlpha; ctx.fillStyle = C.ink;
    for (let i = 0; i < cur.length; i++) ctx.fillRect(cur[i][0] - 3, cur[i][1] - 3, 6, 6);
    ctx.globalAlpha = 1;
    if (b > 0 && k > 0) {
      const B = pos[b];
      ctx.globalAlpha = k;
      ctx.fillStyle = C.papier; ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
      const size = b === 1 ? 26 : 30;
      const seen = new Set();
      for (let i = 0; i < B.length; i++) {
        const key = B[i].join(',');
        if (seen.has(key)) continue; seen.add(key);
        ctx.fillRect(B[i][0] - size / 2, B[i][1] - size / 2, size, size);
        ctx.strokeRect(B[i][0] - size / 2, B[i][1] - size / 2, size, size);
      }
      ctx.fillStyle = C.ink; ctx.font = '700 14px "JetBrains Mono", monospace'; ctx.textAlign = 'left';
      if (b === 1) ['Enterprise', 'Mid-Market', 'SMB'].forEach((s, i) => ctx.fillText(s, 18, 70 + i * 110 - 22));
      ctx.fillText(b === 1 ? '3 segments × 18 months' : '18 months, Jan 2025 to Jun 2026', 18, b === 1 ? Hh - 12 : Hh / 2 - 34);
      ctx.globalAlpha = 1;
    }
  }
  function setStage(s, animate = true) {
    stage = s;
    out.value = LABELS[s]; out.textContent = LABELS[s];
    cap.textContent = `Dots for FOLDLINE rows: ${LABELS[s]}.`;
    // Every move tweens from where the dots are now to the new stage, in both directions.
    const start = cur.map(q => q.slice()), startAlpha = curAlpha, endAlpha = s === 0 ? 1 : 0.25, target = pos[s];
    tween(canvas, animate ? T('--m-travel') : 0, EASE.inout, p => {
      for (let i = 0; i < cur.length; i++) { cur[i][0] = lerp(start[i][0], target[i][0], p); cur[i][1] = lerp(start[i][1], target[i][1], p); }
      curAlpha = lerp(startAlpha, endAlpha, p);
      paint(s, p > 0.6 ? (p - 0.6) / 0.4 : 0);
    });
    qs.textContent = '';
    D.grainQs.forEach((q, i) => {
      const st = q.s[s];
      const lab = st === 'ok' ? 'Answerable' : st === 'need' ? 'Needs another view' : 'Must never be answerable';
      const icon = st === 'ok' ? '<svg class="icon icon--s" aria-hidden="true"><use href="#i-pass"/></svg>' : st === 'need' ? '<svg class="icon icon--s" aria-hidden="true"><use href="#i-gap"/></svg>' : '<svg class="icon icon--s" aria-hidden="true"><use href="#i-deny"/></svg>';
      const li = el('li', { class: `q-${st}` }, `${icon}<div><span class="state">${lab}</span><br><strong>${esc(q.q)}</strong><br><span class="fig__note">${esc(q.n[s])}</span></div>`);
      if (animate) { li.style.animation = `rise var(--m-rise) var(--ease-out) ${i * STAGGER()}ms both`; }
      qs.appendChild(li);
    });
  }
  range.addEventListener('input', () => setStage(+range.value));
  setStage(0, false);

  // DDL
  const rulesEl = $('#ddl-rules');
  const allLines = [];
  function buildDDL(pre, lines) {
    lines.forEach(([text, tags, flag]) => {
      const cm = text.indexOf('--');
      const html = cm >= 0 ? esc(text.slice(0, cm)) + `<span class="cm">${esc(text.slice(cm))}</span>` : esc(text);
      let node;
      if (tags) {
        node = el('button', { class: 'ln', type: 'button', 'data-tags': tags, 'aria-label': `${text.trim()} (rule: ${tags.split(' ').map(t => D.rules.find(r => r.id === t).label).join(', ')})` }, html);
        node.addEventListener('click', () => highlight(tags.split(' ')[0], true));
      } else node = el('span', { class: 'ln' }, html || ' ');
      if (flag) node.dataset.flag = flag;
      pre.appendChild(node); allLines.push(node);
    });
  }
  buildDDL($('#ddl-mrr'), D.ddlMrr);
  buildDDL($('#ddl-churn'), D.ddlChurn);
  const ruleBtns = D.rules.map(r => {
    const li = el('li');
    const b = el('button', { class: 'btn', type: 'button', 'data-rule': r.id, 'aria-pressed': 'false' }, esc(r.label));
    b.addEventListener('mouseenter', () => highlight(r.id));
    b.addEventListener('focus', () => highlight(r.id));
    b.addEventListener('click', () => highlight(r.id, true));
    li.appendChild(b); rulesEl.appendChild(li); return b;
  });
  const ddlLive = $('#ddl-broken');
  function highlight(id, announce) {
    ruleBtns.forEach(b => { const on = b.dataset.rule === id; b.classList.toggle('is-hl', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    let n = 0;
    allLines.forEach(l => { const on = (l.dataset.tags || '').split(' ').includes(id); l.classList.toggle('is-hl', on); if (on) n++; });
    if (announce) { const r = D.rules.find(x => x.id === id); say($('#m6-live-rule'), `${r.label}: ${n} lines highlighted.`); }
  }
  ddlLive.insertAdjacentElement('beforebegin', el('p', { class: 'sr-only', id: 'm6-live-rule', 'aria-live': 'polite' }));
  $('#ddl-break').addEventListener('change', e => {
    const line = allLines.find(l => l.dataset.flag === 'starting');
    if (e.target.checked) {
      line.animate([{ opacity: 1, maxHeight: '2em' }, { opacity: 0, maxHeight: '0em' }], { duration: T('--m-wall'), easing: EASE_CSS.out }).onfinish = () => line.classList.add('is-gone');
      if (!T('--m-wall')) line.classList.add('is-gone');
      ddlLive.innerHTML = `<p class="broken stamp"><span><strong>Pooled churn is now impossible.</strong> You still see ${D.churn.pct} %, ${D.churn.pct} %, ${D.churn.pct} %, but nothing to weigh them by: ${D.churn.pooledChurned} of ${D.churn.pooledStart} cannot be recomputed, and nobody can tell 4 of 40 from 4 of 48.</span> ${failChip()}</p>`;
    } else {
      line.classList.remove('is-gone');
      ddlLive.innerHTML = `<p class="fig__note">Restored: with <code>starting_accounts</code> beside the rate, the company figure is ${D.churn.pooledChurned} of ${D.churn.pooledStart} = ${D.churn.pct} %.</p>`;
    }
  });

  // tradeoffs
  const panel = $('#tradeoff-panel');
  makeTabs($('#tradeoff-tabs'), D.tradeoffs, (t, i, user) => {
    panel.innerHTML = `<table class="tbl tbl--stack ${user ? 'fade' : ''}"><caption class="sr-only">${esc(t.tab)}: trade-offs</caption><thead><tr><th scope="col">Aspect</th><th scope="col">${esc(t.tab)}</th></tr></thead><tbody>${t.rows.map(r => `<tr><td data-label="Aspect"><strong>${esc(r[0])}</strong></td><td data-label="${esc(t.tab)}">${md(r[1])}</td></tr>`).join('')}</tbody></table>`;
  }, 'tradeoff');
  window.__m6Final = () => { range.value = 2; setStage(2, false); };
})();

// ================================================================== M7 two locks
(() => {
  const reqs = D.requests, gatesEl = $('#m7-gates'), result = $('#m7-result'), packet = $('#m7-packet');
  const fs = $('#m7-reqs');
  reqs.forEach((r, i) => {
    const lab = el('label', { class: 'req' }, `<input type="radio" name="m7req" value="${r.id}"${i === 0 ? ' checked' : ''}><span>${r.label}</span>`);
    fs.appendChild(lab);
  });
  const gateNodes = D.gates.map(g => {
    const n = el('div', { class: 'gate' }, `<span class="kind">${esc(g.kind)}</span><h3>${esc(g.name)}</h3><div class="out"></div>`);
    gatesEl.appendChild(n); return n;
  });
  const M = D.messages;
  function evaluate(id, o) {
    const S = (state, title, detail) => ({ state, title, detail });
    const approved = `${D.tub.slice(4).map(t => eur(t.end)).join(' / ')}`;
    const roleLock = o.superuser;
    switch (id) {
      case 'ending': return {
        g: [S('pass', 'Routes', 'Approved question: ending_mrr 1.0.0 in analytics.mrr_summary_monthly.'), S('pass', 'Allows', 'One SELECT on an allowlisted, schema-qualified view.'), S('pass', 'Allows', 'Read-only session, 5 s timeout.'),
            roleLock ? S('nolock', 'No lock', 'Superuser: every privilege check is skipped.') : S('pass', 'Allows', "SELECT granted on 5 views. search_path is '', so an unqualified name fails with 42P01.")],
        res: roleLock ? `<p><strong>Answer: ${approved}</strong> ${passChip()}</p><p style="margin:0">Same answer, no lock. Every other request now depends on instructions alone.</p>` : `<p><strong>Answer: ${approved}</strong> ${passChip()}</p><p style="margin:0">Trace: <code>ending_mrr</code> 1.0.0 · <code>analytics.mrr_summary_monthly</code> · loaded ${D.fresh.loaded}, ${D.fresh.clockAge} h old.</p>`,
        nolock: roleLock };
      case 'howmuch': return o.ignore ? {
        g: [S('pass', 'Guesses', 'Instructions ignored: it picks a meaning instead of asking.'), S('pass', 'Allows', 'The SQL is a valid SELECT on an approved view.'), S('pass', 'Allows', 'Read-only SELECT.'), S('pass', 'Allows', 'The grant is fine. A database cannot see an ambiguous question.')],
        res: `<p><strong>Answered without asking back.</strong> ${gapChip('Gap')}</p><p style="margin:0">No lock can catch a wrong meaning. Only the ask-back rule and its test (C01) can.</p>`, gap: true }
        : { g: [S('stop', 'Asks back', `C01: “${M.C01}”`), S('idle', 'Not reached', 'No SQL is written.'), S('idle', 'Not reached', ''), S('idle', 'Not reached', '')],
            res: `<p><strong>Ask back.</strong> ${passChip('PASS')}</p><p style="margin:0">“${esc(M.C01)}”</p>`, stopAt: 0 };
      case 'profit': return o.ignore ? {
        g: [S('pass', 'Guesses', 'Instructions ignored: it uses MRR as a profit proxy.'), S('pass', 'Allows', 'Valid SELECT on an approved view.'), S('pass', 'Allows', 'Read-only SELECT.'), S('pass', 'Allows', 'The grant is fine.')],
        res: `<p><strong>Answered with the wrong meaning.</strong> ${gapChip('Gap')}</p><p style="margin:0">MRR is not profit. Grants cannot stop a wrong meaning; the refusal rule and test R01 do.</p>`, gap: true }
        : { g: [S('stop', 'Refuses', `R01: “${M.R01}”`), S('idle', 'Not reached', ''), S('idle', 'Not reached', ''), S('idle', 'Not reached', '')],
            res: `<p><strong>Refuse before any query.</strong> ${passChip('PASS')}</p><p style="margin:0">“${esc(M.R01)}”</p>`, stopAt: 0 };
      case 'emails': return o.ignore ? {
        g: [S('pass', 'Writes SQL', 'Instructions ignored: SELECT contact_email FROM core.accounts.'), S('stop', 'Blocks', 'core.accounts is not on the allowlist. Exit code 2.'),
            S('idle', 'Not reached', 'A SELECT would pass a read-only session.'), roleLock ? S('nolock', 'Would return rows', 'Superuser: no lock behind the hook.') : S('idle', 'Would deny', '42501 permission denied for schema core.')],
        res: roleLock ? `<p><strong>Only the hook stopped it.</strong> ${gapChip('One guardrail left')}</p><p style="margin:0">Another client on this superuser login would read the emails. No lock.</p>` : `<p><strong>Blocked by the hook.</strong> ${passChip('PASS')}</p><p style="margin:0">Without the hook, for example from another client on the same login, PostgreSQL still denies: <code>42501 permission denied for schema core</code>. Two locks: refuse early, enforce anyway.</p>`, stopAt: 1, nolock: roleLock }
        : { g: [S('stop', 'Refuses', `R02: “${M.R02}”`), S('idle', 'Not reached', ''), S('idle', 'Not reached', ''), roleLock ? S('nolock', 'No lock', 'Superuser: would return the emails.') : S('idle', 'Would deny', '42501 permission denied for schema core.')],
            res: `<p><strong>Refuse before any query.</strong> ${passChip('PASS')}</p><p style="margin:0">“${esc(M.R02)}”</p>`, stopAt: 0 };
      case 'core': return {
        g: [S('skip', 'Bypassed', 'Sent straight to the database: no instructions apply.'), S('skip', 'Bypassed', 'Not through Claude Code: the hook never runs.'), S('pass', 'Allows', 'A read-only SELECT is allowed.'),
            roleLock ? S('nolock', 'No lock', 'Superuser: contact_email is returned.') : S('stop', 'Denies', '42501 permission denied for schema core.')],
        res: roleLock ? `<p><strong>Rows returned.</strong> ${failChip('No lock')}</p><p style="margin:0">A superuser connection defeats everything.</p>` : `<p><strong>Denied by PostgreSQL: SQLSTATE 42501.</strong> ${passChip('PASS')}</p><p style="margin:0">Case D01. The instructions were never asked; the grant decided.</p>`, stopAt: 3, nolock: roleLock };
      case 'write': return {
        g: [S('skip', 'Bypassed', 'Sent straight to the database.'), S('skip', 'Bypassed', 'The hook never runs.'),
            roleLock ? S('pass', 'Allows', 'This login has no read-only default.') : S('stop', 'Stops', '25006 cannot execute CREATE TABLE in a read-only transaction. A default, not a lock.'),
            roleLock ? S('nolock', 'No lock', 'Superuser: the table is created.') : S('idle', 'Would deny', '42501 permission denied for schema analytics, even after BEGIN READ WRITE (B-W01).')],
        res: roleLock ? `<p><strong>Table created.</strong> ${failChip('No lock')}</p>` : `<p><strong>Stopped by the read-only default: SQLSTATE 25006.</strong> ${gapChip('Guardrail')}</p><p style="margin:0">Read-only is a default the reader can switch off. Behind it, the missing CREATE privilege denies with 42501 (B-W01).</p>`, stopAt: 2, nolock: roleLock };
      case 'temp': return {
        g: [S('skip', 'Bypassed', 'Sent straight to the database.'), S('skip', 'Bypassed', 'The hook never runs.'), S('skip', 'Switched off', 'BEGIN READ WRITE overrides the read-only default.'),
            roleLock ? S('nolock', 'No lock', 'Superuser: the temp table is created.') : o.temp ? S('nolock', 'No lock', 'TEMP left to PUBLIC: the temp table is created.') : S('stop', 'Denies', '42501 permission denied to create temporary tables.')],
        res: (roleLock || o.temp) ? `<p><strong>Temp table created.</strong> ${failChip('No lock')}</p><p style="margin:0">${o.temp && !roleLock ? 'PostgreSQL grants TEMP on a new database to PUBLIC. Verified on PostgreSQL 16. Fix: REVOKE ALL ON DATABASE … FROM PUBLIC (B-T01).' : 'A superuser connection defeats everything.'}</p>` : `<p><strong>Denied by PostgreSQL: SQLSTATE 42501.</strong> ${passChip('PASS')}</p><p style="margin:0">Case B-T01. The read-only default was switched off; the missing TEMP privilege held.</p>`, stopAt: 3, nolock: roleLock || o.temp };
    }
  }
  const seq = sequence();
  function send() {
    const g0 = seq.start();
    const id = $('input[name="m7req"]:checked').value;
    const o = { ignore: $('#m7-ignore').checked, temp: $('#m7-temp').checked, superuser: $('#m7-super').checked };
    const r = evaluate(id, o);
    const stopIdx = r.g.findIndex(x => x.state === 'stop');
    const lastIdx = stopIdx >= 0 ? stopIdx : r.g.length - 1;
    gateNodes.forEach(n => { n.className = 'gate'; $('.out', n).innerHTML = ''; });
    const travel = T('--m-travel');
    const hop = travel / (lastIdx + 1);
    packet.hidden = false;
    const gRect = gatesEl.getBoundingClientRect();
    const moveTo = i => {
      const b = gateNodes[i].getBoundingClientRect();
      packet.style.transform = `translate(${b.left - gRect.left + b.width / 2 - 9}px, ${b.top - gRect.top + 2}px)`;
    };
    packet.style.transition = 'none';
    moveTo(0);
    void packet.offsetWidth;
    packet.style.transition = travel ? `transform ${hop}ms var(--ease-travel)` : 'none';
    r.g.forEach((g, i) => seq.at(g0, Math.round(i <= lastIdx ? i * hop * 0.85 : lastIdx * hop * 0.85), () => {
      if (i <= lastIdx) { gateNodes.forEach(n => n.classList.remove('is-look')); gateNodes[i].classList.add('is-look'); moveTo(i); }
      const n = gateNodes[i];
      n.classList.add(`is-${g.state === 'idle' ? 'skip' : g.state}`);
      $('.out', n).innerHTML = `<strong class="${i <= lastIdx ? 'stamp' : 'fade'}">${esc(g.title)}</strong>${esc(g.detail)}`;
    }));
    seq.at(g0, Math.round(lastIdx * hop * 0.85 + T('--m-rise')), () => {
      result.className = 'result' + (r.nolock ? ' is-nolock' : '');
      result.innerHTML = `<div class="stamp">${r.res}</div>`;
    });
  }
  $('#m7-send').addEventListener('click', send);
  ['#m7-ignore', '#m7-temp', '#m7-super'].forEach(s => $(s).addEventListener('change', send));
  $$('input[name="m7req"]').forEach(i => i.addEventListener('change', () => { seq.stop(); result.className = 'result'; result.innerHTML = '<p>Press Send.</p>'; gateNodes.forEach(n => { n.className = 'gate'; $('.out', n).innerHTML = ''; }); packet.hidden = true; }));
  window.__m7Final = send;
})();

// ================================================================== M8 files
(() => {
  const tree = $('#m8-tree'), excerpt = $('#m8-excerpt'), lead = $('#m8-setup-lead'), env = $('#m8-env'), live = $('#m8-live'), cred = $('#m8-cred');
  const badgeWord = { guides: 'guides', guardrail: 'guardrail', enforces: 'enforces' };
  function showFile(name, btn) {
    const f = D.files[name];
    $$('.file', tree).forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
    excerpt.innerHTML = `<div class="fade"><h3><span>${esc(name)}</span><span class="badge badge--${f.badge} stamp">${badgeWord[f.badge]}</span></h3><p style="font-size:17px">${esc(f.job)}</p><p class="fig__note">Kit file: <a data-kit-file><code>${esc(f.src)}</code></a>. ${esc(f.dest)}.</p><pre class="code${/\.(txt|md)$/.test(name) ? ' prose' : ''}">${esc(f.excerpt)}</pre></div>`;
    excerpt.querySelector('a[data-kit-file]').setAttribute('href', './data-readiness-kit/builder/' + f.src);
  }
  let credOn = false;
  makeTabs($('#m8-tabs'), D.setups, (s, _i, user) => {
    lead.textContent = s.lead;
    tree.textContent = '';
    let k = 0, first = null;
    s.tree.forEach(d => {
      const li = el('li', {}, `<span class="dir">${esc(d.dir)}</span>`);
      const ul = el('ul');
      d.files.forEach(fn => {
        const f = D.files[fn];
        const fli = el('li');
        if (user) fli.style.animation = `rise var(--m-rise) var(--ease-out) ${k++ * STAGGER()}ms both`;
        const b = el('button', { class: 'file', type: 'button', 'aria-pressed': 'false' }, `<span class="fname">${esc(fn.split('/').pop())}</span><span class="badge badge--${f.badge}">${badgeWord[f.badge]}</span>`);
        b.addEventListener('click', () => showFile(fn, b));
        fli.appendChild(b); ul.appendChild(fli);
        if (!first) first = [fn, b];
      });
      li.appendChild(ul); tree.appendChild(li);
    });
    env.hidden = s.id === 'project';
    if (first) showFile(first[0], first[1]);
    applyCred();
  }, 'setup');
  function applyCred() {
    $$('.file', tree).forEach(b => b.classList.toggle('is-struck', credOn));
    env.classList.toggle('is-look', credOn);
    cred.setAttribute('aria-pressed', credOn ? 'true' : 'false');
  }
  cred.addEventListener('click', () => {
    credOn = !credOn; applyCred();
    say(live, credOn ? 'Credentials go in none of these files. Set FOLDLINE_READY_DSN in your shell or a secret manager; .mcp.json only names it. A Claude Project has no database connection, so it needs no credential at all.' : '');
  });
})();

// ================================================================== M9 freshness
(() => {
  const F = D.fresh, range = $('#age-range'), out = $('#age-out'), clock = $('#age-clock'), bar = $('#age-bar'), labels = $('#age-labels'), card = $('#age-card');
  const q3 = $('#age-q3'), quality = $('#age-quality'), invent = $('#age-invent');
  const at = h => (h / F.max * 100) + '%';
  const tick = (h, cls) => { const t = el('span', { class: 'tick ' + cls }); t.style.left = `calc(${at(h)} - 1px)`; bar.appendChild(t); return t; };
  tick(F.clockAge, ''); const warnTick = tick(F.warn, 'warn'); tick(F.whatIf, '');
  const invTick = tick(F.invented, 'inv'); invTick.hidden = true;
  const lab = (h, text) => { const s = el('span', {}, text); s.style.left = at(h); labels.appendChild(s); return s; };
  lab(F.clockAge, `${F.clockAge} h`); lab(F.warn, `${F.warn} h warn`); lab(F.whatIf, `${F.whatIf} h`);
  const invLab = lab(F.invented, `${F.invented} h?`); invLab.hidden = true;
  const fill = $('.fill', bar);
  const base = Date.parse(F.loadedIso);
  const fmt = ms => new Date(ms).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  let wasOver = false;
  function render() {
    const h = +range.value;
    out.textContent = `${h} h`; out.value = `${h} h`;
    const clk = fmt(base + h * 3600e3);
    clock.textContent = `· evaluation clock ${clk}`;
    fill.style.width = at(h);
    invTick.hidden = invLab.hidden = !invent.checked;
    const over = h > F.warn;
    if (over && !wasOver && T('--m-travel')) { warnTick.classList.remove('pulse'); void warnTick.offsetWidth; warnTick.classList.add('pulse'); }
    wasOver = over;
    let cls = '', head, extra = '', withheld = false;
    if (quality.checked) { cls = 'is-block'; withheld = true; head = `<span>Refuse: written rule.</span> ${failChip('Blocked')}`; extra = `<p style="margin:0">“${esc(D.messages.QUALITY)}”</p>`; }
    else if (q3.checked) { cls = 'is-block'; withheld = true; head = `<span>Refuse: written rule.</span> ${failChip('Blocked')}`; extra = `<p style="margin:0">“${esc(D.messages.Q3)}” Q3 2026 is not finished at this clock.</p>`; }
    else if (invent.checked && h > F.invented) { cls = 'is-block'; withheld = true; head = `<span>Refused by an invented ${F.invented} h rule.</span> ${failChip()}`; extra = `<p class="antinote">Anti-pattern AP-F02. Nobody wrote a ${F.invented} h rule, and the owner never agreed. The next run behaves differently, and no test can be written. FOLDLINE's <code>hard_expiry_hours</code> is NULL: warn, answer, escalate.</p>`; }
    else if (over) { cls = 'is-warn'; head = `<span>Answer with a warning.</span> ${gapChip('Stale, disclosed')}`; extra = `<p style="margin:0">“Data loaded at ${F.loaded}, ${h} h before the evaluation clock ${clk}. The warning threshold is ${F.warn} h.” Escalate to <code>revenue_analytics</code>; invent nothing.</p>`; }
    else { head = `<span>Fresh: answer.</span> ${'<span class="chip chip--muted">Fresh</span>'}`; extra = `<p style="margin:0">Loaded ${F.loaded}, ${h} h before the clock ${clk}. Still stated in the trace.</p>`; }
    const vals = D.tub.slice(4).map(t => eur(t.end)).join(' / ');
    card.innerHTML = `<div class="answer-card__banner ${cls} rise">${head}</div><div class="answer-card__body${withheld ? ' is-withheld' : ''}"><p class="vals">${vals}</p>${withheld ? '<p class="fig__note">Not answered.</p>' : ''}${extra}</div>`;
  }
  [range, q3, quality, invent].forEach(i => i.addEventListener(i === range ? 'input' : 'change', render));
  render();
})();

// ================================================================== M10 bench
(() => {
  const list = $('#m10-checks'), tbody = $('#m10-runs tbody'), chipsEl = $('#m10-chips'), live = $('#m10-live'), dbTotal = $('#m10-dbtotal'), vBtn = $('#m10-version');
  const passTag = '<span class="pass"><svg class="icon" aria-hidden="true"><use href="#i-pass"/></svg>PASS</span>';
  function row(c) { return el('li', { 'data-case': c[0] }, `<span><strong>${esc(c[0])}</strong></span><span class="k">${esc(c[1])}</span><span class="a">${esc(c[2])}</span>${passTag}`); }
  const total = `DB CHECKS ${D.checks.length} of ${D.checks.length} PASS. 0 SKIP. 0 FAIL.`;
  const seq = sequence();
  function fillAll() { list.textContent = ''; D.checks.forEach(c => list.appendChild(row(c))); dbTotal.hidden = false; }
  fillAll();
  $('#m10-replay').addEventListener('click', () => {
    const g = seq.start();
    list.textContent = ''; dbTotal.hidden = true;
    const st = Math.min(STAGGER(), 560 / D.checks.length);   // the whole replay stays under 900 ms
    D.checks.forEach((c, i) => seq.at(g, Math.round(i * st), () => { const r = row(c); r.classList.add('rise'); list.appendChild(r); if (inval) r.classList.add('inval'); }));
    seq.at(g, Math.round(D.checks.length * st), () => { dbTotal.hidden = false; say(live, `Replayed: ${total} These test the database and course rules, not the AI.`); });
  });
  D.runs.forEach(r => {
    tbody.appendChild(el('tr', { 'data-run': r.id }, `<td data-label="When"><strong>${esc(r.when)}</strong><br>${esc(r.cases)}</td><td data-label="AI route">${esc(r.route)}<br><span class="fig__note">${esc(r.note)}</span></td><td data-label="Runs" data-col="runs">${esc(r.runs)}</td><td data-label="Values" data-col="values">${esc(r.values)}</td><td data-label="Cited" data-col="cited">${esc(r.cited)}</td>`));
  });
  const chipBtns = D.benchChips.map(c => {
    const b = el('button', { class: 'btn btn--small', type: 'button', 'aria-pressed': 'false' }, `${esc(c.id)} · ${esc(c.label)}`);
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      chipBtns.forEach(x => x.setAttribute('aria-pressed', 'false'));
      $$('li', list).forEach(li => li.classList.remove('is-look'));
      $$('tr', tbody).forEach(tr => tr.classList.remove('is-look'));
      $$('td', tbody).forEach(td => td.classList.remove('is-look'));
      if (!on) { say(live, ''); return; }
      b.setAttribute('aria-pressed', 'true');
      c.db.forEach(id => { const li = $(`[data-case="${id}"]`, list); if (li) li.classList.add('is-look'); });
      c.ai.forEach(id => { const tr = $(`[data-run="${id}"]`, tbody); tr.classList.add('is-look'); if (c.col && c.col !== 'note') $(`[data-col="${c.col}"]`, tr).classList.add('is-look'); });
      say(live, `${c.id} ${c.label}. ${c.say}`);
    });
    chipsEl.appendChild(b); return b;
  });
  let inval = false;
  vBtn.addEventListener('click', () => {
    inval = !inval;
    vBtn.setAttribute('aria-pressed', inval ? 'true' : 'false');
    $$('li', list).forEach(li => li.classList.toggle('inval', inval));
    $$('td', tbody).forEach(td => td.classList.toggle('inval', inval));
    dbTotal.textContent = inval ? 'Receipts invalidated by definition 2.0.0. Re-run both planes.' : total;
    dbTotal.classList.toggle('inval', inval);
    vBtn.textContent = inval ? 'Back to definition 1.0.0' : 'Change the metric version to 2.0.0';
    say(live, inval ? 'Metric version changed to 2.0.0. Every receipt in both planes is invalidated. Re-run the database checks and the AI cases.' : 'Back to definition 1.0.0: the old receipts describe this system again.');
  });
})();

// ================================================================== M11 domains
(() => {
  const panel = $('#m11-panel');
  function miniTub(d, animate) {
    const w = 420, h = 190, floor = 150, top = 24;
    const s = svg('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': d.pool ? `Two channels: ${d.pool.map(p => `${p[0]} ${grp(p[1])} orders of ${grp(p[2])} sessions`).join(', ')}` : `Month-end levels: ${d.startLabel} ${grp(d.start)}, ${d.labels.map((l, i) => `${l} ${grp(d.levels[i])}`).join(', ')} ${d.unit}` });
    if (d.pool) {
      const max = Math.max(...d.pool.map(p => p[2]));
      d.pool.forEach((p, i) => {
        const x = 40 + i * 190, bw = 130, hh = (p[2] / max) * (floor - top), ho = Math.max(3, (p[1] / max) * (floor - top));
        s.appendChild(svg('path', { d: `M${x} ${top} V${floor} H${x + bw} V${top}`, fill: 'none', stroke: C.ink, 'stroke-width': 3 }));
        const water = svg('rect', { x: x + 2, width: bw - 4, y: floor, height: 0, fill: C.beton, stroke: C.ink, 'stroke-width': 2 });
        const ord = svg('rect', { x: x + 2, width: bw - 4, y: floor - ho, height: ho, fill: C.ink });
        s.appendChild(water); s.appendChild(ord);
        tween(water, animate ? T('--m-grow') : 0, EASE.out, q => { water.setAttribute('y', floor - hh * q); water.setAttribute('height', hh * q); });
        s.appendChild(svg('text', { x, y: floor + 20 }, `${p[0]}: ${grp(p[1])} of ${grp(p[2])}`));
      });
      s.appendChild(svg('text', { x: 40, y: 16 }, 'Sessions (grey) and orders (black). Pool the counts.'));
      return s;
    }
    const vals = [d.start, ...d.levels], labs = [d.startLabel, ...d.labels];
    const max = Math.max(...vals) * 1.15;
    vals.forEach((v, i) => {
      const x = 16 + i * 100, bw = 76, hh = (v / max) * (floor - top);
      s.appendChild(svg('path', { d: `M${x} ${top} V${floor} H${x + bw} V${top}`, fill: 'none', stroke: C.ink, 'stroke-width': 3 }));
      const water = svg('rect', { x: x + 2, width: bw - 4, y: floor, height: 0, fill: C.beton, stroke: C.ink, 'stroke-width': 2 });
      s.appendChild(water);
      tween(water, animate ? T('--m-grow') : 0, EASE.out, q => { water.setAttribute('y', floor - hh * q); water.setAttribute('height', hh * q); });
      s.appendChild(svg('text', { x: x + bw / 2, y: floor + 18, 'text-anchor': 'middle' }, labs[i]));
      s.appendChild(svg('text', { x: x + bw / 2, y: floor + 36, 'text-anchor': 'middle', 'font-weight': 700 }, grp(v)));
    });
    return s;
  }
  makeTabs($('#m11-tabs'), D.domains, (d, _i, user) => {
    const labels = D.blanks.map(b => b.label);
    panel.innerHTML = `<div class="dom ${user ? 'fade' : ''}"><div><p class="mono" style="font-size:15px;margin:0 0 10px"><strong>${esc(d.q)}</strong></p><div class="blanks">${d.blanks.map((v, k) => `<div class="blank"><span class="label">${esc(labels[k])}</span><span class="blank__v">${md(v)}</span></div>`).join('')}</div></div><div><div class="minitub"></div><p class="fig__note">Identity test: <span class="num">${esc(d.identity)}</span></p><div class="trap"><div class="t-wrong"><span class="label">Wrong</span><span class="big">${esc(d.wrong)}</span><p class="fig__note" style="margin:4px 0 6px">${esc(d.wrongWhy)}</p>${failChip()}</div><div><span class="label">Right</span><span class="big">${esc(d.right)}</span><p class="fig__note" style="margin:4px 0 6px">${esc(d.rightWhy)}</p>${passChip()}</div></div><span class="label">Three renames</span><ul class="renames">${d.renames.map(r => `<li><s>${esc(r[0])}</s> → <strong>${esc(r[1])}</strong></li>`).join('')}</ul></div></div>`;
    $('.minitub', panel).appendChild(miniTub(d, user));
  }, 'dom');
  const yb = $('#m11-yours'), card = $('#m11-yourcard');
  yb.addEventListener('click', () => {
    const open = card.hidden;
    card.hidden = !open;
    yb.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && !card.firstChild) {
      card.className = 'yours rise';
      card.innerHTML = `<h3>Your four blanks</h3><p class="fig__note">Kept only in this page's memory. Nothing is saved or sent, and it disappears when you leave. Use invented examples, not employer data.</p><div class="field" style="margin-bottom:10px"><label for="y-q">Your question: period, shape, grain</label><input type="text" id="y-q" autocomplete="off"></div><div class="grid4">${D.blanks.map((b, k) => `<div class="field"><label for="y-b${k}">${esc(b.label)}</label><input type="text" id="y-b${k}" autocomplete="off"></div>`).join('')}</div><div class="field" style="margin-top:10px"><label for="y-w">One wrong answer an AI could give, and its arithmetic</label><input type="text" id="y-w" autocomplete="off"></div><p style="margin-top:12px"><button class="btn btn--small" type="button" id="y-clear">Clear</button></p>`;
      $('#y-clear').addEventListener('click', () => $$('input', card).forEach(i => { i.value = ''; }));
    }
    if (open) $('#y-q').focus();
  });
})();

// ================================================================== M12 runbook
(() => {
  const stepsEl = $('#m12-steps'), gatesEl = $('#m12-gates'), verdict = $('#m12-verdict');
  const done = new Set();
  const nodes = D.steps.map((s, i) => {
    const li = el('li', { class: 'step' });
    li.innerHTML = `<span class="step__n" aria-hidden="true">${s.n}</span><details${i === 0 ? ' open' : ''}><summary><span><span class="sr-only">Step ${s.n}. </span>${esc(s.title)}</span><span class="who">${esc(s.who)}</span></summary><div class="step__body"><dl><dt>Output</dt><dd>${md(s.output)}</dd><dt>Done when</dt><dd>${md(s.done)}</dd><dt>FOLDLINE</dt><dd>${md(s.foldline)}</dd><dt>Prevents</dt><dd>${md(s.prevents)}</dd></dl><label class="toggle"><input type="checkbox" data-step="${s.n}"> Done when met</label>${i < D.steps.length - 1 ? ` <button class="btn btn--small no-print" type="button" data-next="${i + 1}">Next step</button>` : ''}</div></details>`;
    stepsEl.appendChild(li); return li;
  });
  const dets = nodes.map(n => $('details', n));
  dets.forEach((d, i) => d.addEventListener('toggle', () => { if (d.open) dets.forEach((o, k) => { if (k !== i && o.open && !printing) o.open = false; }); }));
  $$('[data-next]', stepsEl).forEach(b => b.addEventListener('click', () => { const j = +b.dataset.next; dets[j].open = true; $('summary', dets[j]).focus(); }));
  $$('input[data-step]', stepsEl).forEach(c => c.addEventListener('change', () => { c.checked ? done.add(+c.dataset.step) : done.delete(+c.dataset.step); update(true); }));
  const gateNodes = D.readyGates.map(g => { const li = el('li', {}, `<span>${esc(g.name)}</span><span class="st"></span>`); gatesEl.appendChild(li); return li; });
  let printing = false;
  function update(animate, example) {
    nodes.forEach((n, i) => n.classList.toggle('is-done', done.has(D.steps[i].n)));
    $$('input[data-step]', stepsEl).forEach(c => { c.checked = done.has(+c.dataset.step); });
    const states = D.readyGates.map(g => { const k = g.steps.filter(s => done.has(s)).length; return k === g.steps.length ? 'proven' : k > 0 ? 'documented' : 'unproven'; });
    const rank = { unproven: 0, documented: 1, proven: 2 };
    const weakest = Math.min(...states.map(s => rank[s]));
    gateNodes.forEach((n, i) => {
      n.className = `g-${states[i]}` + (rank[states[i]] === weakest && weakest < 2 ? ' g-weak' : '');
      $('.st', n).textContent = states[i];
    });
    const weakNames = D.readyGates.filter((_, i) => rank[states[i]] === weakest).map(g => g.name);
    const v = weakest === 0 ? 'Not ready' : weakest === 1 ? 'Limited pilot, not signed off' : 'Bounded ready';
    const why = weakest === 0 ? `Unproven: ${weakNames.join(', ')}.` : weakest === 1 ? `Documented but not proven: ${weakNames.join(', ')}.` : 'Every gate is proven for the declared question and surface.';
    verdict.innerHTML = `<span class="label">Verdict</span><span class="vd-v ${animate ? 'stamp' : ''}">${v}</span><p style="margin:6px 0 0;font-size:15px">${esc(why)}</p>` + (example ? `<p style="margin:8px 0 0;font-size:15px"><strong>Worked example: FOLDLINE.</strong> The database checks pass and the values matched 3 of 3, but the runs cited the definition 0 of 3 and there was one run per question. Step 11 is not met.</p>` : '');
  }
  $('#m12-example').addEventListener('click', () => { done.clear(); D.foldlineDone.forEach(n => done.add(n)); update(true, true); dets[11].open = true; });
  $('#m12-clear').addEventListener('click', () => { done.clear(); update(true); });
  update(false);
  window.__m12Print = on => { printing = on; };
  window.__m12Final = () => { done.clear(); D.foldlineDone.forEach(n => done.add(n)); update(false, true); };
})();

// ================================================================== M13 anti-patterns
(() => {
  const aps = D.aps, list = $('#m13-list'), filters = $('#m13-filters'), q = $('#m13-q'), count = $('#m13-count');
  const groups = ['All', ...Array.from(new Set(aps.map(a => a.group)))];
  let group = 'All';
  const items = aps.map(a => {
    const li = el('li', { 'data-group': a.group });
    li.innerHTML = `<details class="ap"><summary><span class="apid">${esc(a.id)}</span><span class="grp">${esc(a.group)}</span><span class="sym">${md(a.symptom)}</span></summary><div class="ap__body"><dl><dt>Bad</dt><dd class="ap__bad"><span>${md(a.instance)}</span></dd><dt>Why</dt><dd>${md(a.why)}</dd><dt>Good</dt><dd>${md(a.fix)}</dd><dt>Caught by</dt><dd>${md(a.caught)}</dd><dt>Module</dt><dd><a href="#${a.anchor}">${esc(a.module)}</a></dd></dl></div></details>`;
    li._text = [a.id, a.group, a.symptom, a.instance, a.why, a.fix, a.caught].join(' ').toLowerCase();
    list.appendChild(li); return li;
  });
  const fbtns = groups.map(g => {
    const b = el('button', { class: 'btn btn--small', type: 'button', 'aria-pressed': g === 'All' ? 'true' : 'false' }, esc(g));
    b.addEventListener('click', () => { group = g; fbtns.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); apply(true); });
    filters.appendChild(b); return b;
  });
  function apply(flip) {
    const first = flip ? new Map(items.filter(i => !i.hidden).map(i => [i, i.getBoundingClientRect()])) : null;
    const t = q.value.trim().toLowerCase();
    let n = 0;
    items.forEach(i => {
      const show = (group === 'All' || i.dataset.group === group) && (!t || i._text.includes(t));
      const was = i.hidden; i.hidden = !show; if (show) n++;
      if (show && was && !flip) i.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T('--m-fade') });
    });
    if (flip && T('--m-rise')) items.forEach(i => {
      if (i.hidden) return;
      const a = first.get(i), b = i.getBoundingClientRect();
      if (a) { const dx = a.left - b.left, dy = a.top - b.top; if (dx || dy) i.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: T('--m-rise'), easing: EASE_CSS.out }); }
      else i.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T('--m-rise') });
    });
    count.textContent = `Showing ${n} of ${aps.length}` + (group !== 'All' ? ` in ${group}` : '') + (t ? ` matching “${q.value.trim()}”` : '') + '.';
    empty.hidden = n > 0;
  }
  const empty = el('p', { class: 'panel', hidden: true }, 'No entry matches. <button class="btn btn--small" type="button" id="m13-reset">Clear filters</button>');
  list.insertAdjacentElement('afterend', empty);
  $('#m13-reset', empty).addEventListener('click', () => {
    group = 'All'; q.value = '';
    fbtns.forEach(x => x.setAttribute('aria-pressed', x.textContent === 'All' ? 'true' : 'false'));
    apply(false); q.focus();
  });
  q.addEventListener('input', () => apply(false));
  apply(false);
  // print table
  $('#m13-print').innerHTML = `<table class="tbl"><thead><tr><th>ID</th><th>Symptom</th><th>FOLDLINE instance</th><th>Fix</th><th>Caught by</th></tr></thead><tbody>${aps.map(a => `<tr><td>${esc(a.id)}</td><td>${md(a.symptom)}</td><td>${md(a.instance)}</td><td>${md(a.fix)}</td><td>${md(a.caught)}</td></tr>`).join('')}</tbody></table>`;
})();

// ------------------------------------------------------------------ identifier breaks, scrollable code
addBreaks();
let breakQueued = false;
new MutationObserver(() => {
  if (breakQueued) return;
  breakQueued = true;
  requestAnimationFrame(() => { breakQueued = false; addBreaks(); });
}).observe($('main') || doc.body, { childList: true, subtree: true });
window.addEventListener('resize', () => addBreaks());

// ------------------------------------------------------------------ print: final states, everything open
const opened = [];
window.addEventListener('beforeprint', () => {
  window.__m12Print && window.__m12Print(true);
  $$('details').forEach(d => { if (!d.open && !d.classList.contains('ap')) { opened.push(d); d.open = true; } });
  ['__m1Final', '__m3Final', '__m6Final'].forEach(f => window[f] && window[f]());
});
window.addEventListener('afterprint', () => { opened.splice(0).forEach(d => { d.open = false; }); window.__m12Print && window.__m12Print(false); });
})();
