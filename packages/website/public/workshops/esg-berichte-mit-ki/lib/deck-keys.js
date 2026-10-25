/* deck-keys.js: the one key contract of every workshop deck (W01 to W05).
 *
 * Canonical copy: scripts/workshops/deck-keys.js in the platform repository.
 * scripts/workshops/sync-deck-keys.mjs copies it byte for byte into each deck's
 * lib/ folder, and `--check` fails CI when a copy drifts. Edit only the canonical
 * copy, then run the sync.
 *
 * Bound keys, nothing else:
 *   ArrowRight         next press (a build step, then the next slide)
 *   ArrowLeft          previous press
 *   r or Shift+R       back to the cover, step 0, every slide reset
 *   P                  opens the presenter view
 *   Escape             leaves an appendix (only while one is shown)
 * Space, Enter, PageUp, PageDown, Home, End and the digits stay unbound: Space
 * and Enter belong to focused controls. Never with Ctrl, Meta or Alt, never in a
 * text field. A held key fires once; its auto-repeats are swallowed.
 *
 * Names: a deck states its id once, <html data-deck-id="<workshop slug>">.
 * The presenter window and its BroadcastChannel are both "deck-presenter:<id>",
 * and every storage key is "deck:<id>:<name>", so two decks open in one browser
 * never share a channel, a window or a remembered slide.
 */
(function (root) {
  'use strict';

  var TYPING_SELECTOR = 'input, select, textarea, [contenteditable]:not([contenteditable="false"])';

  /** Keys a presenter view may forward to the deck. */
  var PRESENTER_KEYS = Object.freeze(['ArrowRight', 'ArrowLeft', 'r', 'R']);

  function isTypingTarget(target) {
    if (!target || typeof target !== 'object') return false;
    if (target.isContentEditable) return true;
    return Boolean(target.closest && target.closest(TYPING_SELECTOR));
  }

  /**
   * The action a keydown asks for: "next", "prev", "reset", "presenter",
   * "leave-appendix", or null when the deck must ignore the key.
   * context.inAppendix: true while an appendix slide is shown.
   */
  function resolve(event, context) {
    if (!event || event.defaultPrevented) return null;
    if (event.metaKey || event.ctrlKey || event.altKey) return null;
    if (isTypingTarget(event.target)) return null;
    var key = event.key;
    if (key === 'ArrowRight') return 'next';
    if (key === 'ArrowLeft') return 'prev';
    if (key === 'r' || key === 'R') return 'reset';
    if (key === 'p' || key === 'P') return 'presenter';
    if (key === 'Escape' && context && context.inAppendix) return 'leave-appendix';
    return null;
  }

  /**
   * Resolves the key and runs handlers[action]. Returns true when the key
   * belongs to the deck (its default is prevented then, repeats included).
   */
  function handle(event, handlers, context) {
    var action = resolve(event, context);
    if (!action) return false;
    event.preventDefault();
    if (event.repeat) return true;
    var run = handlers && handlers[action];
    if (typeof run === 'function') run(event);
    return true;
  }

  function deckId(doc) {
    var d = doc || root.document;
    if (!d) return '';
    var html = d.documentElement && d.documentElement.getAttribute('data-deck-id');
    var body = d.body && d.body.getAttribute('data-deck-id');
    return html || body || '';
  }

  function presenterChannel(id) {
    return 'deck-presenter:' + id;
  }

  function storageKey(id, name) {
    return 'deck:' + id + ':' + name;
  }

  var api = Object.freeze({
    PRESENTER_KEYS: PRESENTER_KEYS,
    isTypingTarget: isTypingTarget,
    resolve: resolve,
    handle: handle,
    deckId: deckId,
    presenterChannel: presenterChannel,
    storageKey: storageKey,
  });

  root.DeckKeys = api;
  if (typeof module === 'object' && module && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
