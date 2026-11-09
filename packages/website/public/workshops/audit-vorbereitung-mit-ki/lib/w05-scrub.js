/* w05-scrub.js: presenter clickable scrubbers (T7), toggles and hotspots (T8) of the Workshop 05 deck.
 * A button names a target inside its own slide (data-w05-name) and a value:
 *   <button data-w05-scrub="days" data-value="3">  sets data-w05-at="3" and --at:3 on the target (a playhead in CSS)
 *   <button data-w05-toggle="lanes" data-value="claude">  sets data-w05-state="claude" (one of a group)
 *   <button data-w05-hot="wall" data-value="trade">  sets data-w05-hot="trade"; the same button again clears it
 * Buttons, never range inputs: a focused input would swallow the arrow keys (deck-keys.js). A mouse click is blurred, so the
 * next arrow key moves the deck again; clicks never move the deck. r and Shift+R (the engine's deckreset) put every target
 * back to its data-w05-start value. No key handler, no timer, no storage, no custom event. Motion is CSS (at most 300 ms,
 * none under reduced motion). */
(function () {
  'use strict';

  var KINDS = { scrub: 'data-w05-at', toggle: 'data-w05-state', hot: 'data-w05-hot' };

  /** The kind of a button from its attributes, or null. */
  function kindOf(attrs) {
    for (var kind in KINDS) if (Object.prototype.hasOwnProperty.call(attrs, 'data-w05-' + kind)) return kind;
    return null;
  }

  /** The value a target holds after a click: a hotspot clicked twice clears; a scrub or toggle takes the value. */
  function nextValue(kind, current, value) {
    if (kind === 'hot' && current === value) return null;
    return value;
  }

  /** Which buttons of a group show as pressed for the target's value. */
  function pressed(values, current) {
    return values.map(function (v) { return v === current; });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { KINDS: KINDS, kindOf: kindOf, nextValue: nextValue, pressed: pressed };
  if (typeof document === 'undefined') return;

  var SELECTOR = 'button[data-w05-scrub], button[data-w05-toggle], button[data-w05-hot]';

  function attrsOf(el) {
    var out = {};
    for (var i = 0; i < el.attributes.length; i += 1) out[el.attributes[i].name] = el.attributes[i].value;
    return out;
  }

  function apply(target, kind, value) {
    var attr = KINDS[kind];
    if (value === null || value === undefined) target.removeAttribute(attr);
    else target.setAttribute(attr, value);
    if (kind === 'scrub') target.style.setProperty('--at', value === null ? '0' : value);
    var slide = target.closest('section.slide');
    if (!slide) return;
    var name = target.getAttribute('data-w05-name');
    var buttons = Array.prototype.slice.call(slide.querySelectorAll('button[data-w05-' + kind + '="' + name + '"]'));
    var states = pressed(buttons.map(function (b) { return b.getAttribute('data-value'); }), target.getAttribute(attr));
    buttons.forEach(function (b, i) { b.setAttribute('aria-pressed', states[i] ? 'true' : 'false'); });
  }

  function targetOf(button, kind) {
    var slide = button.closest('section.slide');
    return slide ? slide.querySelector('[data-w05-name="' + button.getAttribute('data-w05-' + kind) + '"]') : null;
  }

  function reset() {
    document.querySelectorAll('[data-w05-name]').forEach(function (target) {
      for (var kind in KINDS) {
        var start = target.getAttribute('data-w05-start-' + kind);
        if (start !== null || target.hasAttribute(KINDS[kind])) apply(target, kind, start);
      }
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest ? event.target.closest(SELECTOR) : null;
    if (!button) return;
    var kind = kindOf(attrsOf(button));
    var target = targetOf(button, kind);
    if (!target) return;
    if (event.detail > 0) button.blur();
    apply(target, kind, nextValue(kind, target.getAttribute(KINDS[kind]), button.getAttribute('data-value')));
  });

  document.addEventListener('deckreset', reset);
  reset();
})();
