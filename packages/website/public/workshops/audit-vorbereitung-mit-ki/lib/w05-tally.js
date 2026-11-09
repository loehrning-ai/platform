/* w05-tally.js: Shift+click on a poll button counts five hands, a plain click counts one.
 * The engine (scenes.js) owns the poll counter (one per browser tab) and adds one per click. This file only
 * re-dispatches four more plain clicks on the same button when Shift is held. The presenter counts hands aloud and
 * clicks once per hand; nothing is synced between devices. No key handler, no storage, no timer, no visible text. */
(function () {
  'use strict';

  var HANDS = 5;

  /** How many plain clicks one click stands for: 5 with Shift held, otherwise 1. */
  function clicksFor(shiftKey) {
    return shiftKey ? HANDS : 1;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { clicksFor: clicksFor, HANDS: HANDS };
  if (typeof document === 'undefined') return;

  var BUTTON = 'button[data-poll][data-value], [data-poll] button';

  /* Capture phase: runs before the engine's own click handler, which then counts this click and each repeat. */
  document.addEventListener('click', function (event) {
    if (!event.shiftKey) return;
    var target = event.target;
    var button = target && target.closest ? target.closest(BUTTON) : null;
    if (!button) return;
    for (var i = 1; i < clicksFor(true); i += 1) {
      /* A synthetic click has shiftKey false, so it never enters this branch again. */
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }
  }, true);
})();
