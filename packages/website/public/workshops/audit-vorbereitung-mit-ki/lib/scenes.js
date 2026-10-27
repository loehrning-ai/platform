/* scenes.js: the drawings of the Workshop 05 deck that CSS alone cannot do. Each scene is
 * render(slide, step, t, api), a pure function of the build step and t in [0, 1]: same input, same frame.
 * lib/deck-stage.js calls it after it has set --p on every element with data-from.
 *
 * The reality run (slide 7, step 4) is the demo's frame(t) from
 * src/lib/demo-cases/audit-vorbereitung-mit-ki/motion.ts, same constants, so deck and demo move alike.
 */
(function () {
  'use strict';

  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (v) { v = clamp(v); return 1 - Math.pow(1 - v, 3); };
  var TESTS = ['quote', 'date', 'scope', 'approval'];

  /* The demo's reality run, ported 1:1 (motion.ts). */
  var PASS_START = 0.08, PASS_LENGTH = 0.2, LINK_STAGGER = 0.014, LABELS_FROM = 0.88, TEST_SPAN = 0.06;
  function testTime(pass, index) { return PASS_START + pass * PASS_LENGTH + index * LINK_STAGGER; }
  function runFrame(t, links) {
    var time = clamp(t);
    var out = links.map(function (link, index) {
      var passReached = -1;
      for (var pass = 0; pass < TESTS.length; pass += 1) if (time >= testTime(pass, index)) passReached = pass;
      var failPass = link.failsAt ? TESTS.indexOf(link.failsAt) : -1;
      var at = failPass >= 0 ? testTime(failPass, index) : Infinity;
      var failed = time >= at;
      var breaks = link.status === 'gap';
      var progress = failed ? clamp((time - at) / TEST_SPAN) : 0;
      return {
        passReached: failed ? Math.min(passReached, failPass) : passReached,
        dashed: failed && !breaks,
        broken: failed && breaks,
        breakT: breaks ? ease(progress) : 0,
        defectT: ease(progress),
        labelOpacity: clamp((time - LABELS_FROM - index * 0.008) / 0.06),
      };
    });
    var pass = time < PASS_START ? -1 : time >= PASS_START + TESTS.length * PASS_LENGTH ? 4 : Math.floor((time - PASS_START) / PASS_LENGTH);
    return { links: out, pass: pass, tallyOpacity: clamp((time - LABELS_FROM) / 0.08) };
  }
  /* The demo's first-screen draw-in (motion.ts drawIn). */
  function drawIn(t, index) { return ease((clamp(t) - index * 0.04) / 0.68); }

  function setLine(row, opts) {
    var line = row.querySelector('.lk-line');
    var a = row.querySelector('.lk-a');
    var b = row.querySelector('.lk-b');
    var gap = 14 * (opts.breakT || 0);
    row.setAttribute('data-state', opts.state);
    line.style.strokeDashoffset = String(opts.dashOffset || 0);
    a.setAttribute('x2', String(Math.max(0, 50 - gap)));
    b.setAttribute('x1', String(Math.min(100, 50 + gap)));
    var ticks = row.querySelectorAll('.lk-tick');
    for (var k = 0; k < ticks.length; k += 1) {
      var cls = 'lk-tick';
      if (opts.failPass === k && (opts.state === 'weak' || opts.state === 'gap')) cls += ' is-fail';
      else if (opts.passReached >= k) cls += ' is-pass';
      ticks[k].setAttribute('class', cls);
    }
  }

  function drawLinks(root, t, mode, ui) {
    var rows = Array.prototype.slice.call(root.querySelectorAll('.lk-row'));
    if (mode === 'cover') {
      rows.forEach(function (row, i) {
        setLine(row, { state: 'open', dashOffset: 100 * (1 - drawIn(t, i)), passReached: -1, failPass: -1 });
      });
      return;
    }
    var run = runFrame(t, rows.map(function (row) { return { failsAt: row.getAttribute('data-fails-at') || null, status: row.getAttribute('data-status') }; }));
    rows.forEach(function (row, i) {
      var link = run.links[i];
      var failsAt = row.getAttribute('data-fails-at');
      var state = link.broken ? 'gap' : link.dashed ? 'weak' : run.tallyOpacity >= 1 ? row.getAttribute('data-status') : 'open';
      setLine(row, { state: state, dashOffset: 0, breakT: link.breakT, passReached: link.passReached, failPass: failsAt ? TESTS.indexOf(failsAt) : -1 });
      row.style.setProperty('--defect', link.defectT.toFixed(3));
      row.style.setProperty('--label', link.labelOpacity.toFixed(3));
      row.toggleAttribute('data-failed', link.dashed || link.broken);
    });
    var head = root.closest('.slide').querySelector('[data-run-pass]');
    if (head) {
      var names = head.getAttribute('data-tests').split('|');
      head.textContent = run.pass >= 0 && run.pass < 4 ? head.getAttribute('data-label').replace('{n}', String(run.pass + 1)).replace('{test}', names[run.pass]) : '';
    }
    var tally = root.closest('.slide').querySelector('[data-tally]');
    if (tally) tally.style.setProperty('--p', run.tallyOpacity.toFixed(3));
  }

  /* Slide 7, step 3: 26 rows drop in, the duplicate slides onto its twin, the share bar fills. */
  function drawCount(box, t) {
    var rows = parseInt(box.getAttribute('data-rows'), 10);
    var unique = parseInt(box.getAttribute('data-unique'), 10);
    var staff = parseInt(box.getAttribute('data-staff'), 10);
    var target = parseFloat(box.getAttribute('data-target'));
    var dup = parseInt(box.getAttribute('data-dup'), 10);
    var chips = box.querySelectorAll('.r5-chips i');
    var dropped = 0;
    for (var i = 0; i < chips.length; i += 1) {
      var p = ease((t - i * 0.014) / 0.08);
      if (p > 0.5) dropped += 1;
      chips[i].style.setProperty('--p', p.toFixed(3));
    }
    var merge = ease((t - 0.48) / 0.14);
    var twin = chips[dup - 1];
    if (chips[dup]) {
      chips[dup].style.setProperty('--merge', merge.toFixed(3));
      chips[dup].classList.toggle('is-dup', t >= 0.44);
      if (twin) twin.classList.toggle('is-dup', t >= 0.44);
    }
    var n = merge >= 1 ? unique : dropped;
    box.querySelector('[data-r5-n]').textContent = String(n);
    var label = box.querySelector('[data-r5-label]');
    label.textContent = t >= 0.62 ? label.getAttribute('data-merged') : label.getAttribute('data-rows');
    var fillP = ease((t - 0.64) / 0.24);
    box.querySelector('[data-r5-fill]').style.transform = 'scaleX(' + ((unique / staff) * fillP).toFixed(4) + ')';
    box.querySelector('[data-r5-share]').style.setProperty('--p', fillP.toFixed(3));
    box.style.setProperty('--target', String(target));
  }

  /* Slide 9, step 2: each placeholder of the template gives way to its value, in reading order. */
  function drawEmail(slide, step, t) {
    var slots = slide.querySelectorAll('.slot');
    var n = slots.length;
    for (var k = 0; k < n; k += 1) {
      var on = step > 2 || (step === 2 && t >= 0.12 + (k / n) * 0.7);
      slots[k].classList.toggle('is-filled', on);
    }
  }

  /* Slide 11: the room's estimate becomes the folder's answer. */
  function median(list) {
    var nums = list.map(Number).sort(function (a, b) { return a - b; });
    return nums.length ? nums[Math.floor((nums.length - 1) / 2)] : null;
  }
  function drawResult(slide, step, t, api) {
    var tallies = api.tallies();
    var est = tallies.estimate || [];
    var title = slide.querySelector('[data-result-title]');
    var covered = title.getAttribute('data-covered');
    var m = median(est);
    title.textContent = (m === null ? title.getAttribute('data-none') : title.getAttribute('data-votes')).replace('{estimate}', String(m)).replace('{covered}', covered);
    var counts = [];
    for (var v = 0; v <= 8; v += 1) counts[v] = 0;
    est.forEach(function (x) { counts[Number(x)] += 1; });
    var max = Math.max.apply(null, counts.concat([1]));
    var morph = step >= 1 ? (step === 1 ? ease(t) : 1) : 0;
    var bars = slide.querySelectorAll('.h-bar');
    for (var b = 0; b < bars.length; b += 1) {
      var share = counts[b] / max;
      var away = ease((morph - b * 0.04) / 0.5);
      bars[b].style.setProperty('--h', (share * (1 - away)).toFixed(4));
      bars[b].style.setProperty('--o', String(1 - away));
      bars[b].classList.toggle('is-median', m !== null && b === m);
    }
    var rbars = slide.querySelectorAll('.r-bar');
    for (var r = 0; r < rbars.length; r += 1) {
      var grow = ease((morph - 0.4 - r * 0.08) / 0.45);
      rbars[r].style.setProperty('--h', ((parseInt(rbars[r].getAttribute('data-n'), 10) / 8) * grow).toFixed(4));
      rbars[r].style.setProperty('--o', grow.toFixed(3));
    }
    var head = slide.querySelector('[data-hist-head]');
    head.textContent = morph >= 0.5 ? head.getAttribute('data-res') : head.getAttribute('data-est');
    var rows = slide.querySelectorAll('.draft-votes li');
    for (var i = 0; i < rows.length; i += 1) {
      var n = rows[i].getAttribute('data-claim');
      var list = tallies['draft-' + n] || [];
      var opts = rows[i].getAttribute('data-opts').split('|');
      var c = { 'true': 0, 'false': 0, 'unsure': 0 };
      list.forEach(function (x) { c[x] += 1; });
      var text = list.length
        ? rows[i].getAttribute('data-line').replace('{n}', n).replace('{votes}', opts[0] + ' ' + c['true'] + ', ' + opts[1] + ' ' + c['false'] + ', ' + opts[2] + ' ' + c.unsure)
        : rows[i].getAttribute('data-none').replace('{n}', n);
      if (rows[i].textContent !== text) rows[i].textContent = text;
    }
  }

  window.DECK_SCENES = {
    cover: {
      ms: function () { return 1500; },
      render: function (slide, step, t) { drawLinks(slide.querySelector('[data-links]'), t, 'cover'); },
    },
    request: {
      ms: function (step) { return step === 0 ? 1600 : 900; },
    },
    folder: {
      ms: function (step) { return step === 0 ? 1400 : 900; },
    },
    tests: {
      ms: function (step) { return step === 5 ? 1100 : 1300; },
    },
    'mission-1': {
      ms: function (step) { return step === 3 ? 2600 : 800; },
    },
    'mission-2': {
      ms: function (step) { return step === 4 ? 6400 : step === 3 ? 5000 : step === 2 ? 2600 : 900; },
      render: function (slide, step, t) {
        drawCount(slide.querySelector('[data-r5]'), step > 3 ? 1 : step === 3 ? t : 0);
        drawLinks(slide.querySelector('[data-links]'), step > 4 ? 1 : step === 4 ? t : 0, 'run');
      },
    },
    mistakes: {
      ms: function () { return 1100; },
    },
    gaps: {
      ms: function (step) { return step === 2 ? 2400 : 1000; },
      render: drawEmail,
    },
    reply: {
      ms: function (step) { return step >= 1 && step <= 4 ? 1600 : 900; },
    },
    result: {
      ms: function (step) { return step === 1 ? 1800 : 900; },
      onVotes: true,
      render: drawResult,
    },
  };
})();
