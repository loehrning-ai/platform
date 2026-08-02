/**
 * Framer Motion serializes its initial hidden state into server HTML. Elements
 * that opt into `js-reveal` must therefore be restored when scripting is
 * unavailable. The mobile navigation fallback is present in the server markup
 * but remains hidden during normal hydration.
 */
export const NO_SCRIPT_FALLBACK_CSS =
  ".js-reveal{opacity:1!important;transform:none!important;clip-path:none!important;visibility:visible!important}" +
  ".js-mobile-nav-toggle{display:none!important}" +
  ".js-desktop-nav{display:none!important}" +
  ".no-js-primary-nav{position:static!important}" +
  ".no-js-mobile-nav{display:block!important}" +
  "#main-content{padding-top:0!important}";
