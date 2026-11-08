/* w05-matrix.js: the X-ray of the folder on slide "xray": 13 checklist lines x 24 people, drawn on a canvas.
 * Reads <script type="application/json" id="w05-matrix"> (written by build.mjs from the oracle, no runtime parsing of
 * the kit) and three progress values the engine already writes: the --p of the anchor #w05-matrix-anchor (the scan),
 * of [data-mx-phase="flags"] (ten numbered flags pop in clusters) and of [data-mx-phase="checked"] (the checked cells
 * flip amber, then green with a tick). A missing value counts as 1, so a missing engine shows the end state.
 * Everything drawn is a pure function of those values, the chosen what-if state and the hovered flag, so going back,
 * jumping and ?preview=1 cannot drift. No timer, no rAF loop, no key handler, no storage, no random.
 * Visible words come from the JSON (copy written by build.mjs), never from this file. */
(function () {
  'use strict';

  /* Logical drawing size. Keep W and H equal to the aspect ratio of .w05-mx__plot in w05-fx.css (checked by a test). */
  var LAYOUT = { W: 860, H: 760, labelW: 70, labelH: 200, cellW: 60, cellH: 23, gap: 3, cols: 13, rows: 24 };
  var FLAG_SPAN = 1.9;
  var FLAG_STEP = 0.09;
  var CHECK_SPAN = 1.6;
  var CHECK_STEP = 0.07;

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }

  /** Position of the cell for a column (checklist line) and a row (person), in logical pixels. */
  function cellRect(col, row) {
    var x = LAYOUT.labelW + col * LAYOUT.cellW;
    var y = LAYOUT.labelH + row * LAYOUT.cellH;
    return { x: x + LAYOUT.gap / 2, y: y + LAYOUT.gap / 2, w: LAYOUT.cellW - LAYOUT.gap, h: LAYOUT.cellH - LAYOUT.gap };
  }

  /** Staggered local progress of item i out of a shared progress p. */
  function stagger(p, i, span, step) {
    return clamp01(p * span - i * step);
  }

  /** Per cell: which flag (index into state.flags) covers it, and the tone; code 2 cells are "checked" unless a flag covers them. */
  function markGrid(data, state) {
    var lineIndex = {};
    data.lines.forEach(function (id, i) { lineIndex[id] = i; });
    var personIndex = {};
    data.people.forEach(function (id, i) { personIndex[id] = i; });
    var grid = data.lines.map(function (_, c) {
      return data.people.map(function (_p, r) {
        return { flag: -1, tone: '', check: state.cells[c][r] === 2 };
      });
    });
    state.flags.forEach(function (flag, i) {
      var c = lineIndex[flag.line];
      if (c === undefined) return;
      var rows = flag.wholeFirm ? data.people.map(function (_, r) { return r; }) : flag.people.map(function (id) { return personIndex[id]; });
      rows.forEach(function (r) {
        if (r === undefined) return;
        grid[c][r].flag = i;
        grid[c][r].tone = flag.tone;
        grid[c][r].check = false;
      });
    });
    return grid;
  }

  /** Where the numbered chip of a flag sits: left edge of the first cell of the cluster, or the top of the band. */
  function flagPoint(data, flag, taken) {
    var c = data.lines.indexOf(flag.line);
    var rows = flag.wholeFirm ? [0] : flag.people.map(function (id) { return data.people.indexOf(id); }).sort(function (a, b) { return a - b; });
    var rect = cellRect(c, rows[0] === undefined ? 0 : rows[0]);
    var key = c + ':' + rows[0];
    var n = taken[key] || 0;
    taken[key] = n + 1;
    return { x: rect.x + 13, y: rect.y + rect.h / 2 + n * LAYOUT.cellH, col: c };
  }

  var api = { LAYOUT: LAYOUT, cellRect: cellRect, stagger: stagger, markGrid: markGrid, flagPoint: flagPoint, clamp01: clamp01 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  var anchor = document.getElementById('w05-matrix-anchor');
  var jsonNode = document.getElementById('w05-matrix');
  if (!anchor || !jsonNode) return;
  var data;
  try { data = JSON.parse(jsonNode.textContent || ''); } catch (_e) { return; }
  if (!data || !data.cells || !data.lines) return;

  var params = new URLSearchParams(window.location.search);
  var FINAL = params.has('preview') || params.get('export') === 'final' ||
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (FINAL) document.documentElement.classList.add('w05-final');

  var canvas = anchor.querySelector('canvas');
  var flagsBox = anchor.querySelector('[data-mx-phase="flags"]');
  var checkedProbe = anchor.querySelector('[data-mx-phase="checked"]');
  var wrongProbe = anchor.querySelector('[data-mx-phase="wrong"]');
  var pulses = anchor.querySelector('.w05-mx__pulses');
  var whatifRoot = document.querySelector('[data-mx-whatifs]');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var text = data.text || {};
  if (text.alt) { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', text.alt); }

  var states = [{ id: 'base', counter: data.counter, cells: data.cells, flags: data.flags }].concat(data.whatif || []);
  var current = 0;
  var hot = -1;
  var palette = {};

  function readP(el) {
    if (!el) return 1;
    var p = parseFloat(el.style.getPropertyValue('--p'));
    return Number.isFinite(p) ? p : 1;
  }

  function cssVar(name, fallback) {
    var v = window.getComputedStyle(anchor).getPropertyValue(name).trim();
    return v || fallback;
  }

  function loadPalette() {
    palette = {
      ink: cssVar('--ink', '#121212'),
      accent: cssVar('--accent', '#B73A15'),
      amber: cssVar('--w05-amber', '#D9A441'),
      green: cssVar('--w05-green', '#1F4A38'),
      sans: cssVar('--sans', 'system-ui, sans-serif'),
      mono: cssVar('--mono', 'ui-monospace, monospace'),
    };
  }

  function rgba(hex, a) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; });
    var n = parseInt(h, 16);
    if (!Number.isFinite(n) || h.length !== 6) return 'rgba(18,18,18,' + a + ')';
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fit() {
    var shown = canvas.offsetWidth || LAYOUT.W;
    var scale = canvas.getBoundingClientRect().width / shown || 1;
    var ratio = Math.min(3, Math.max(1, (window.devicePixelRatio || 1) * scale));
    var w = Math.round(LAYOUT.W * ratio);
    var h = Math.round(LAYOUT.H * ratio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.setTransform(w / LAYOUT.W, 0, 0, h / LAYOUT.H, 0, 0);
  }

  /** Greedy wrap of a header label into at most two lines of `max` pixels; a single word that is too long shrinks the font. */
  function wrapHeader(label, max) {
    var size = 15;
    var words = String(label).split(/\s+/).filter(Boolean);
    for (; size >= 11; size -= 0.5) {
      ctx.font = '600 ' + size + 'px ' + palette.sans;
      var lines = [];
      var cur = '';
      var ok = true;
      for (var i = 0; i < words.length; i += 1) {
        var tryLine = cur ? cur + ' ' + words[i] : words[i];
        if (ctx.measureText(tryLine).width <= max) { cur = tryLine; continue; }
        if (!cur) { ok = false; break; }
        lines.push(cur);
        cur = words[i];
        if (ctx.measureText(cur).width > max) { ok = false; break; }
      }
      if (!ok) continue;
      lines.push(cur);
      if (lines.length <= 2) return { size: size, lines: lines };
    }
    return { size: 11, lines: [String(label)] };
  }

  function labels() {
    var i;
    ctx.font = '600 14px ' + palette.mono;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    for (i = 0; i < data.people.length; i += 1) {
      var r = cellRect(0, i);
      ctx.fillStyle = rgba(palette.ink, 0.78);
      ctx.fillText(data.people[i], 8, r.y + r.h / 2);
    }
    var avail = LAYOUT.labelH - 10 - 30 - 6;
    for (i = 0; i < data.lines.length; i += 1) {
      var c = cellRect(i, 0);
      var head = wrapHeader(data.labels[i] || '', avail);
      ctx.save();
      ctx.translate(c.x + c.w / 2 + 1, LAYOUT.labelH - 10);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '600 13px ' + palette.sans;
      ctx.fillStyle = rgba(palette.ink, 0.5);
      ctx.fillText(data.lines[i].replace(/^L/, ''), 0, 0);
      ctx.font = '600 ' + head.size + 'px ' + palette.sans;
      ctx.fillStyle = rgba(palette.ink, 0.9);
      head.lines.forEach(function (line, k) {
        ctx.fillText(line, 30, (k - (head.lines.length - 1) / 2) * (head.size + 3));
      });
      ctx.restore();
    }
  }

  function tick(x, y, w, h, alpha) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,' + alpha + ')';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.36, y + h * 0.52);
    ctx.lineTo(x + w * 0.46, y + h * 0.72);
    ctx.lineTo(x + w * 0.66, y + h * 0.3);
    ctx.stroke();
    ctx.restore();
  }

  function band(col, entry, s, faded, tone) {
    var top = cellRect(col, 0);
    var bottom = cellRect(col, data.people.length - 1);
    var full = bottom.y + bottom.h - top.y;
    roundRect(top.x, top.y, top.w, full * s, 5);
    ctx.fillStyle = rgba(tone, 0.9 * faded);
    ctx.fill();
    if (s < 0.98) return;
    ctx.fillStyle = 'rgba(255,255,255,' + 0.26 * faded + ')';
    for (var row = 1; row < data.people.length; row += 1) ctx.fillRect(top.x, cellRect(col, row).y - LAYOUT.gap / 2 - 0.6, top.w, 1.2);
    ctx.save();
    ctx.translate(top.x + top.w / 2 + 4, top.y + full / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(255,255,255,' + 0.94 * faded + ')';
    ctx.font = '700 14px ' + palette.mono;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.wholeFirm || '', 0, 0);
    ctx.restore();
    if (hot === entry) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = rgba(palette.ink, 0.9);
      roundRect(top.x - 1, top.y - 1, top.w + 2, full + 2, 6);
      ctx.stroke();
    }
  }

  function draw() {
    loadPalette();
    fit();
    ctx.clearRect(0, 0, LAYOUT.W, LAYOUT.H);
    var state = states[current];
    var grid = markGrid(data, state);
    var scan = clamp01(readP(anchor));
    var flagsP = clamp01(readP(flagsBox));
    var checkedP = clamp01(readP(checkedProbe));
    var wrongP = clamp01(readP(wrongProbe));
    var front = scan * data.lines.length;
    var dim = hot >= 0 ? 0.32 : 1;
    var c;
    var r;
    labels();

    /* the grid, and the wake behind the scan */
    for (c = 0; c < data.lines.length; c += 1) {
      var read = clamp01(front - c);
      var wake = scan > 0 && scan < 1 && front > c ? clamp01(1 - (front - c) / 1.6) : 0;
      for (r = 0; r < data.people.length; r += 1) {
        var box = cellRect(c, r);
        roundRect(box.x, box.y, box.w, box.h, 4);
        ctx.fillStyle = rgba(palette.ink, 0.045 + 0.075 * read);
        ctx.fill();
        if (wake > 0) { ctx.fillStyle = rgba(palette.accent, 0.2 * wake); ctx.fill(); }
      }
    }

    /* findings (red) and amber lines, popping in clusters */
    state.flags.forEach(function (flag, i) {
      var col = data.lines.indexOf(flag.line);
      var s = easeOut(stagger(flagsP, i, FLAG_SPAN, FLAG_STEP));
      if (s <= 0 || col < 0) return;
      var tone = flag.tone === 'amber' ? palette.amber : palette.accent;
      var faded = hot >= 0 && hot !== i ? dim : 1;
      if (flag.wholeFirm) { band(col, i, s, faded, tone); return; }
      flag.people.forEach(function (id) {
        var row = data.people.indexOf(id);
        if (row < 0) return;
        var b = cellRect(col, row);
        var inset = (1 - s) * 9;
        roundRect(b.x + inset, b.y + inset * 0.6, b.w - inset * 2, b.h - inset * 1.2, 4);
        ctx.fillStyle = rgba(tone, (flag.tone === 'amber' ? 0.85 : 0.92) * s * faded);
        ctx.fill();
        if (hot === i) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = rgba(palette.ink, 0.9);
          roundRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2, 5);
          ctx.stroke();
        }
      });
    });

    /* the two wrong counts of the quick script: dashed outlines on the cells it would flag too much (base state only) */
    if (current === 0 && wrongP > 0 && data.ghosts) {
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = rgba(palette.accent, wrongP * (hot >= 0 ? 0.4 : 1));
      data.ghosts.forEach(function (g) {
        var gc = data.lines.indexOf(g.line);
        var gr = data.people.indexOf(g.id);
        if (gc < 0 || gr < 0) return;
        var gb = cellRect(gc, gr);
        roundRect(gb.x + 1, gb.y + 1, gb.w - 2, gb.h - 2, 4);
        ctx.stroke();
      });
      ctx.restore();
    }

    /* checked, no problem: amber, then a flip to green with a tick (reading order) */
    var k = 0;
    for (c = 0; c < data.lines.length; c += 1) {
      for (r = 0; r < data.people.length; r += 1) {
        if (!grid[c][r].check) continue;
        var local = stagger(checkedP, k, CHECK_SPAN, CHECK_STEP);
        k += 1;
        if (local <= 0) continue;
        var b2 = cellRect(c, r);
        var amberA = clamp01(local / 0.4);
        var flip = clamp01((local - 0.45) / 0.55);
        var sx = Math.abs(Math.cos(flip * Math.PI));
        var greenSide = flip >= 0.5;
        var wScaled = b2.w * (flip > 0 ? Math.max(0.04, sx) : 1);
        roundRect(b2.x + (b2.w - wScaled) / 2, b2.y, wScaled, b2.h, 4);
        ctx.fillStyle = greenSide ? rgba(palette.green, 0.92 * dim + 0.08 * (1 - dim)) : rgba(palette.amber, 0.9 * amberA);
        ctx.fill();
        if (greenSide && flip > 0.8) tick(b2.x, b2.y, b2.w, b2.h, clamp01((flip - 0.8) * 5));
      }
    }
  }

  /* flags: real buttons, built from the JSON (the strings are data, set with textContent) */
  function line(tip, label, value) {
    if (!value) return;
    var row = document.createElement('span');
    row.className = 'w05-mx__tipline';
    if (label) { var b = document.createElement('b'); b.textContent = label; row.appendChild(b); }
    row.appendChild(document.createTextNode(value));
    tip.appendChild(row);
  }

  var previousIds = null;

  function buildFlags() {
    if (!flagsBox) return;
    var state = states[current];
    var taken = {};
    var fresh = previousIds ? state.flags.filter(function (f) { return previousIds.indexOf(f.id) < 0; }).map(function (f) { return f.id; }) : [];
    flagsBox.textContent = '';
    state.flags.forEach(function (flag, i) {
      var pt = flagPoint(data, flag, taken);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'w05-mx__flag';
      button.setAttribute('data-flag', flag.n);
      button.setAttribute('data-tone', flag.tone);
      button.setAttribute('data-side', pt.col >= 7 ? 'left' : 'right');
      if (fresh.indexOf(flag.id) >= 0) button.setAttribute('data-new', '');
      button.setAttribute('aria-label', flag.n + (flag.label ? ': ' + flag.label : ''));
      button.setAttribute('data-i', String(i));
      button.style.left = (pt.x / LAYOUT.W * 100).toFixed(3) + '%';
      button.style.top = (pt.y / LAYOUT.H * 100).toFixed(3) + '%';
      button.style.setProperty('--i', String(i));
      var n = document.createElement('span');
      n.className = 'w05-mx__n';
      n.textContent = flag.n;
      button.appendChild(n);
      var tip = document.createElement('span');
      tip.className = 'w05-mx__tip';
      tip.setAttribute('role', 'tooltip');
      line(tip, text.rule, flag.rule);
      line(tip, text.fine, flag.fine);
      line(tip, text.fix, flag.fix);
      if (tip.childNodes.length) button.appendChild(tip);
      flagsBox.appendChild(button);
    });
    previousIds = state.flags.map(function (f) { return f.id; });
  }

  /* what-if: a ring on every cell whose look changed (CSS animation, removed when it ends) */
  function pulse(prev, next) {
    if (!pulses) return;
    pulses.textContent = '';
    var a = markGrid(data, prev);
    var b = markGrid(data, next);
    var c;
    var r;
    for (c = 0; c < data.lines.length; c += 1) {
      for (r = 0; r < data.people.length; r += 1) {
        if (a[c][r].tone === b[c][r].tone && a[c][r].check === b[c][r].check) continue;
        var box = cellRect(c, r);
        var mark = document.createElement('i');
        mark.className = 'w05-mx__pulse';
        mark.style.left = (box.x / LAYOUT.W * 100).toFixed(3) + '%';
        mark.style.top = (box.y / LAYOUT.H * 100).toFixed(3) + '%';
        mark.style.width = (box.w / LAYOUT.W * 100).toFixed(3) + '%';
        mark.style.height = (box.h / LAYOUT.H * 100).toFixed(3) + '%';
        pulses.appendChild(mark);
      }
    }
  }

  function applyText() {
    var state = states[current];
    document.querySelectorAll('[data-mx-count]').forEach(function (el) { el.textContent = String(state.counter); });
    document.querySelectorAll('[data-mx-show]').forEach(function (el) {
      var on = String(el.getAttribute('data-mx-show')).split(/\s+/).indexOf(String(current)) >= 0;
      el.toggleAttribute('data-mx-on', on);
    });
    document.querySelectorAll('button[data-mx-whatif]').forEach(function (button) {
      button.setAttribute('aria-pressed', Number(button.getAttribute('data-mx-whatif')) === current ? 'true' : 'false');
    });
    anchor.setAttribute('data-mx-state', String(current));
  }

  function choose(next) {
    var prev = states[current];
    current = next;
    hot = -1;
    buildFlags();
    pulse(prev, states[current]);
    applyText();
    draw();
  }

  /* hover or focus on a flag lights its cells and dims the rest */
  function hotFrom(event) {
    var button = event.target && event.target.closest ? event.target.closest('.w05-mx__flag') : null;
    var i = button ? Number(button.getAttribute('data-i')) : -1;
    if (i !== hot) { hot = i; draw(); }
  }

  function unhot() {
    if (hot !== -1) { hot = -1; draw(); }
  }

  if (flagsBox) {
    flagsBox.addEventListener('mouseover', hotFrom);
    flagsBox.addEventListener('mouseout', unhot);
    flagsBox.addEventListener('focusin', hotFrom);
    flagsBox.addEventListener('focusout', unhot);
  }

  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest ? event.target.closest('button[data-mx-whatif]') : null;
    if (!button) return;
    var n = Number(button.getAttribute('data-mx-whatif'));
    if (!Number.isFinite(n) || n < 0 || n >= states.length) return;
    choose(n === current ? 0 : n);
  });

  function reset() {
    if (current !== 0 || hot !== -1) {
      current = 0;
      hot = -1;
      previousIds = null;
      buildFlags();
      if (pulses) pulses.textContent = '';
      applyText();
    }
    draw();
  }

  if (pulses) pulses.addEventListener('animationend', function (event) { if (event.target.parentNode === pulses) pulses.removeChild(event.target); });
  document.addEventListener('deckreset', reset);

  /* the engine rewrites --p inline each frame: one observer, one redraw per frame */
  var watcher = new MutationObserver(function () {
    if (!FINAL && whatifRoot && readP(whatifRoot) <= 0 && current !== 0) reset();
    else draw();
  });
  [anchor, flagsBox, checkedProbe, wrongProbe, whatifRoot].forEach(function (el) {
    if (el) watcher.observe(el, { attributes: true, attributeFilter: ['style'] });
  });
  window.addEventListener('resize', draw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);

  buildFlags();
  applyText();
  draw();
})();
