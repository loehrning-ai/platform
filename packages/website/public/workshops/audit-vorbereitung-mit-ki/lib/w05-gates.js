/* w05-gates.js: the four data gates on slide "ladder" (anchor #w05-gates-anchor).
 * Four buttons data-gate = subscription | contract | security | transfer. A click opens a gate (a second click closes it
 * again); the cloud [data-gate-cloud] lights only when all four are open. The closing motion at entry is pure CSS from
 * the anchor's --p; here only the click state lives, in the DOM. Reset on the engine's deckreset, or when the anchor's
 * --p goes back to 0. ?preview=1 and reduced motion show all four open. No timer, no key handler, no storage,
 * no visible text of its own. */
(function () {
  'use strict';

  var GATES = ['subscription', 'contract', 'security', 'transfer'];

  /** True when every gate name is in the open list. */
  function allOpen(open) {
    return GATES.every(function (name) { return open.indexOf(name) >= 0; });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { GATES: GATES, allOpen: allOpen };
  if (typeof document === 'undefined') return;

  var anchor = document.getElementById('w05-gates-anchor');
  if (!anchor) return;

  var params = new URLSearchParams(window.location.search);
  var FINAL = params.has('preview') || params.get('export') === 'final' ||
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (FINAL) document.documentElement.classList.add('w05-final');

  var buttons = Array.prototype.slice.call(anchor.querySelectorAll('button[data-gate]'));
  var cloud = anchor.querySelector('[data-gate-cloud]') || document.querySelector('[data-gate-cloud]');
  var open = FINAL ? GATES.slice() : [];

  buttons.forEach(function (button, i) { button.style.setProperty('--i', String(i)); });

  function render() {
    buttons.forEach(function (button) {
      var on = open.indexOf(button.getAttribute('data-gate')) >= 0;
      button.toggleAttribute('data-open', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var n = open.length;
    var lit = allOpen(open);
    anchor.setAttribute('data-open-count', String(n));
    anchor.toggleAttribute('data-lit', lit);
    if (cloud) { cloud.setAttribute('data-open-count', String(n)); cloud.toggleAttribute('data-lit', lit); }
  }

  function reset() {
    open = FINAL ? GATES.slice() : [];
    render();
  }

  function readP(el) {
    var p = parseFloat(el.style.getPropertyValue('--p'));
    return Number.isFinite(p) ? p : 1;
  }

  anchor.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target.closest('button[data-gate]') : null;
    if (!target || !anchor.contains(target)) return;
    var name = target.getAttribute('data-gate');
    var at = open.indexOf(name);
    open = at >= 0 ? open.filter(function (g) { return g !== name; }) : open.concat(name);
    render();
  });

  document.addEventListener('deckreset', reset);
  new MutationObserver(function () { if (!FINAL && readP(anchor) <= 0 && open.length) reset(); })
    .observe(anchor, { attributes: true, attributeFilter: ['style'] });
  render();
})();
