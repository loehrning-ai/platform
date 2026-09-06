/**
 * Framer Motion serializes its initial hidden state into server HTML. Elements
 * that opt into `js-reveal` must therefore be restored when scripting is
 * unavailable. The mobile navigation fallback is present in the server markup
 * but remains hidden during normal hydration.
 *
 * The sheet is one flat rule list injected inside `<noscript>`, and it stays
 * free of media queries on purpose: every rule here applies at every width, so
 * a rule may only state something that is true on a phone and on a desktop at
 * the same time.
 *
 * Mobile companion shell (below lg, see docs/experience-system.md, "Mobile
 * Companion Shell"): the compact top bar and the bottom tab bar are
 * server-rendered markup. The compact bar reuses the rules it already had, its
 * menu button disappears and the complete static list takes over. The tab bar
 * gets no rule at all: it is four links and CSS, so it stays fixed and
 * operable without scripting, which also makes it the persistent navigation
 * once the top bar drops out of fixed positioning. That is why `#main-content`
 * loses only its top offset and the reserved bottom band on `<body>` stays.
 * Forcing the tab bar visible here would show it on desktop too, where it does
 * not belong, and no media query is available to scope that.
 *
 * A shell control that genuinely needs scripting carries `js-shell-only` and is
 * removed rather than left inert. Any new class in the shell is registered here
 * in the same change that introduces it.
 */
export const NO_SCRIPT_FALLBACK_CSS =
  ".js-reveal{opacity:1!important;transform:none!important;clip-path:none!important;visibility:visible!important}" +
  ".js-mobile-nav-toggle{display:none!important}" +
  ".js-shell-only{display:none!important}" +
  ".js-desktop-nav{display:none!important}" +
  ".js-compact-nav{display:flex!important}" +
  ".no-js-primary-nav{position:static!important}" +
  ".no-js-mobile-nav{display:block!important}" +
  "[data-learning-owner-panel]{display:none!important}" +
  "#main-content{padding-top:0!important}";
