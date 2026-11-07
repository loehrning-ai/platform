/* w05-clock.js: the clock on slide "clock" (anchor #w05-clock-anchor, root [data-clock]).
 * You pick a visit day (25, 26 or 27); the working days between the notice and that day light up on the calendar strip,
 * the marker and the bar move to it, the counter and the one-word chip follow. A toggle switches to the complaint visit
 * (no notice at all). State is a pure function of (picked day, mode, anchor --p): going back, jumping or ?preview=1
 * cannot drift. Reads data-* only (data-notice, data-days, data-visit, data-none, data-chip-short, data-chip-unclear,
 * data-chip-fits). Sets only attributes: data-between, data-picked, data-after, data-role="notice" on the day cells
 * ([data-day]); data-visit (day of month), data-mode and data-clock-mode ("extra" or "notice"), data-verdict and the
 * custom properties --vi (index of the picked day) and --w05-n (number of days) on the root.
 * No timer, no key handler, no storage, no visible text of its own, no holiday list. */
(function () {
  'use strict';

  var DAY = 86400000;

  /** Days since 1970-01-01 for an ISO date, or NaN. */
  function dayNumber(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY : NaN;
  }

  function isoOf(dayNum) {
    return new Date(dayNum * DAY).toISOString().slice(0, 10);
  }

  /** 1 Monday to 5 Friday, 6 Saturday, 0 Sunday. 1970-01-01 was a Thursday. */
  function weekday(dayNum) {
    return (((dayNum + 4) % 7) + 7) % 7;
  }

  /** The Mon to Fri dates strictly between the two dates, as ISO strings. No holiday list. */
  function workingDaysList(noticeISO, visitISO) {
    var a = dayNumber(noticeISO);
    var b = dayNumber(visitISO);
    var out = [];
    if (!(a < b)) return out;
    for (var d = a + 1; d < b; d += 1) {
      var w = weekday(d);
      if (w >= 1 && w <= 5) out.push(isoOf(d));
    }
    return out;
  }

  function workingDaysBetween(noticeISO, visitISO) {
    return workingDaysList(noticeISO, visitISO).length;
  }

  /** "short" below 2, "unclear" at 2, "fits" from 3. */
  function verdict(n) {
    return n < 2 ? 'short' : n === 2 ? 'unclear' : 'fits';
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { dayNumber: dayNumber, weekday: weekday, workingDaysList: workingDaysList, workingDaysBetween: workingDaysBetween, verdict: verdict };
  }
  if (typeof document === 'undefined') return;

  var anchor = document.getElementById('w05-clock-anchor');
  if (!anchor) return;
  var root = anchor.closest('[data-clock]') || (anchor.hasAttribute('data-notice') ? anchor : document.querySelector('[data-clock]'));
  if (!root) return;

  var params = new URLSearchParams(window.location.search);
  var FINAL = params.has('preview') || params.get('export') === 'final' ||
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (FINAL) document.documentElement.classList.add('w05-final');

  var notice = root.getAttribute('data-notice') || '';
  var tiles = Array.prototype.slice.call(root.querySelectorAll('[data-day]'));
  var buttons = Array.prototype.slice.call(root.querySelectorAll('button[data-clock-visit]'));
  var toggle = root.querySelector('[data-clock-toggle], button[data-clock-mode]');
  var toggleHost = toggle ? toggle.closest('[data-step]') : null;
  var count = root.querySelector('[data-clock-count]');
  var chip = root.querySelector('[data-clock-chip]');
  var idle = { count: count ? count.textContent : '', chip: chip ? chip.textContent : '' };

  /* The visit the strip shows before the first click: data-visit (day of month or ISO) or the first button. */
  function defaultVisit() {
    var want = String(root.getAttribute('data-visit') || '').slice(-2);
    for (var i = 0; i < buttons.length; i += 1) {
      var iso = buttons[i].getAttribute('data-clock-visit');
      if (iso.slice(-2) === want) return iso;
    }
    return buttons.length ? buttons[0].getAttribute('data-clock-visit') : '';
  }
  var DEFAULT = defaultVisit();
  var state = { picked: '', mode: 'notice' };

  root.style.setProperty('--w05-n', String(tiles.length));

  /** The engine writes --p inline on every [data-step]; no value yet means the end state. */
  function readP(el) {
    var p = parseFloat(el.style.getPropertyValue('--p'));
    return Number.isFinite(p) ? p : 1;
  }

  function chipText(kind) {
    return root.dataset['chip' + kind.charAt(0).toUpperCase() + kind.slice(1)] || '';
  }

  function paint() {
    var extra = state.mode === 'extra';
    var visit = extra ? '' : state.picked || DEFAULT;
    var between = visit ? workingDaysList(notice, visit) : [];
    var index = 0;
    tiles.forEach(function (tile, i) {
      var day = tile.getAttribute('data-day');
      var k = between.indexOf(day);
      if (day === visit) index = i;
      tile.toggleAttribute('data-role', false);
      if (day === notice) tile.setAttribute('data-role', 'notice');
      tile.toggleAttribute('data-between', k >= 0);
      tile.toggleAttribute('data-picked', !!visit && day === visit);
      tile.toggleAttribute('data-after', !!visit && dayNumber(day) > dayNumber(visit));
      tile.style.setProperty('--k', String(Math.max(0, k)));
    });
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', !extra && !!state.picked && button.getAttribute('data-clock-visit') === state.picked ? 'true' : 'false');
    });
    if (toggle) toggle.setAttribute('aria-pressed', extra ? 'true' : 'false');
    root.setAttribute('data-clock-mode', state.mode);
    if (extra) root.setAttribute('data-mode', 'extra'); else root.removeAttribute('data-mode');
    if (visit) root.setAttribute('data-visit', visit.slice(-2));
    root.toggleAttribute('data-picked', !!visit);
    root.style.setProperty('--vi', String(index));
    /* counter and chip: the HTML text until the first click, then the computed words */
    if (extra) {
      root.setAttribute('data-verdict', 'none');
      if (count) count.textContent = root.getAttribute('data-none') || '';
      if (chip) { chip.textContent = ''; chip.setAttribute('data-verdict', 'none'); }
    } else if (state.picked) {
      var v = verdict(between.length);
      root.setAttribute('data-verdict', v);
      if (count) count.textContent = String(between.length);
      if (chip) { chip.textContent = chipText(v); chip.setAttribute('data-verdict', v); }
    } else {
      root.removeAttribute('data-verdict');
      if (count) count.textContent = idle.count;
      if (chip) { chip.textContent = idle.chip; chip.removeAttribute('data-verdict'); }
    }
  }

  function reset() {
    state = { picked: '', mode: 'notice' };
    paint();
  }

  function sync() {
    root.toggleAttribute('data-live', readP(anchor) >= 1);
    if (readP(anchor) <= 0 && (state.picked || state.mode !== 'notice')) reset();
    else if (state.mode === 'extra' && toggleHost && readP(toggleHost) <= 0) { state = { picked: state.picked, mode: 'notice' }; paint(); }
  }

  root.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target : null;
    if (!target) return;
    var pick = target.closest('button[data-clock-visit]');
    if (pick && root.contains(pick)) {
      state = { picked: pick.getAttribute('data-clock-visit'), mode: 'notice' };
      paint();
      return;
    }
    var flip = target.closest('[data-clock-toggle], button[data-clock-mode]');
    if (flip && root.contains(flip)) {
      state = { picked: state.picked, mode: state.mode === 'extra' ? 'notice' : 'extra' };
      paint();
    }
  });

  document.addEventListener('deckreset', reset);
  var watcher = new MutationObserver(sync);
  watcher.observe(anchor, { attributes: true, attributeFilter: ['style'] });
  if (toggleHost) watcher.observe(toggleHost, { attributes: true, attributeFilter: ['style'] });
  paint();
  sync();
})();
