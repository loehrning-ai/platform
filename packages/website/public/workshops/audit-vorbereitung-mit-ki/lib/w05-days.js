/* w05-days.js: audit days by staff band on slide "isosheet" (anchor #w05-days-anchor).
 * Three band buttons (data-band 25 | 45 | 65) fill 3, 4 or 5 day tiles. The tiles fill one by one while the anchor's
 * --p runs (entry), then follow the clicks. State is a pure function of (selected band, anchor --p). No range input
 * (a focused input would swallow the deck's arrow keys), no timer, no key handler, no storage, no visible text of its own. */
(function () {
  'use strict';

  /** Initial-audit days for a number of effective staff: 3 for 16 to 25, 4 for 26 to 45, 5 for 46 to 65, else null. */
  function auditDays(n) {
    var staff = Number(n);
    if (!Number.isFinite(staff)) return null;
    if (staff >= 16 && staff <= 25) return 3;
    if (staff >= 26 && staff <= 45) return 4;
    if (staff >= 46 && staff <= 65) return 5;
    return null;
  }

  /** Tiles shown at entry progress p (0 to 1) when the band calls for `days` tiles. */
  function tilesAt(days, p) {
    var q = Math.min(1, Math.max(0, Number.isFinite(p) ? p : 1));
    return Math.max(0, Math.ceil(days * q - 1e-9));
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { auditDays: auditDays, tilesAt: tilesAt };
  if (typeof document === 'undefined') return;

  var anchor = document.getElementById('w05-days-anchor');
  if (!anchor) return;

  var params = new URLSearchParams(window.location.search);
  var FINAL = params.has('preview') || params.get('export') === 'final' ||
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (FINAL) document.documentElement.classList.add('w05-final');

  var buttons = Array.prototype.slice.call(anchor.querySelectorAll('button[data-band]'));
  var tiles = Array.prototype.slice.call(anchor.querySelectorAll('[data-day-tile]'));
  var out = anchor.querySelector('[data-days-out]');
  var first = buttons.length ? buttons[0].getAttribute('data-band') : '25';
  var band = first;

  tiles.forEach(function (tile, i) { tile.style.setProperty('--i', String(i)); });

  function readP(el) {
    var p = parseFloat(el.style.getPropertyValue('--p'));
    return Number.isFinite(p) ? p : 1;
  }

  function render() {
    var days = auditDays(band) || 0;
    var shown = tilesAt(days, readP(anchor));
    tiles.forEach(function (tile, i) {
      tile.toggleAttribute('data-on', i < shown);
      tile.toggleAttribute('data-planned', i < days);
    });
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-band') === band;
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.toggleAttribute('data-sel', on);
    });
    anchor.setAttribute('data-band-sel', band);
    anchor.setAttribute('data-days', String(days));
    if (out) out.textContent = String(days);
  }

  anchor.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target.closest('button[data-band]') : null;
    if (!target || !anchor.contains(target)) return;
    band = target.getAttribute('data-band');
    render();
  });

  document.addEventListener('deckreset', function () { band = first; render(); });
  new MutationObserver(render).observe(anchor, { attributes: true, attributeFilter: ['style'] });
  render();
})();
