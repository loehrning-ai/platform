/* w04-pages.js · Workshop 04 learner pages (guide, field card, transfer sheet).
   1. Language-aware back link: the same referrer rule as the other workshops' strip script.
      Someone who came from the German workshop page gets "Zurück zum Workshop" first.
   2. Material tabs: scroll the current tab into view and fade the edge that has more tabs.
   3. Print button (#print-page), if the page has one.
   No inline handlers (CSP script-src-attr 'none'), no network, no HTML sinks. */
(function () {
  "use strict";
  var s = document.querySelector(".wf-strip");
  if (s) {
    var slug = "/workshops/" + s.getAttribute("data-wf-slug");
    var m = s.querySelector(".wf-back-main"), a = s.querySelector(".wf-back-alt"), b = s.querySelector(".wf-brand");
    var f;
    try { f = document.referrer ? new URL(document.referrer) : null; } catch (e) { f = null; }
    var de = false, en = false;
    if (f && f.origin === location.origin) {
      var p = f.pathname.replace(/\/$/, "");
      de = p === slug || /^\/workshops(\/[^\/.]+)?$/.test(p);
      en = /^\/en(\/|$)/.test(p);
    }
    try {
      if (en) sessionStorage.removeItem("wf-lang");
      else if (!de && sessionStorage.getItem("wf-lang") === "de") de = true;
      if (de) sessionStorage.setItem("wf-lang", "de");
    } catch (e) { /* storage blocked: keep the English default */ }
    if (de && m && a) {
      if (b) b.href = "/workshops";
      a.parentNode.insertBefore(a, m);
      a.className = "wf-back-main"; a.textContent = "← Zurück zum Workshop";
      m.className = "wf-back-alt"; m.lang = "en"; m.hreflang = "en"; m.textContent = "Workshop page in English";
    }
  }

  var n = document.querySelector(".wf-mats");
  if (n) {
    var c = n.querySelector("[aria-current=page]");
    if (c && n.scrollWidth > n.clientWidth) n.scrollLeft = Math.max(0, c.offsetLeft - n.offsetLeft - 16);
    var u = function () {
      var v = (n.scrollLeft > 2 ? "l" : "") + (n.scrollLeft + n.clientWidth < n.scrollWidth - 2 ? "r" : "");
      if (v) n.setAttribute("data-more", v); else n.removeAttribute("data-more");
    };
    u();
    n.addEventListener("scroll", u, { passive: true });
    window.addEventListener("resize", u);
  }

  var btn = document.getElementById("print-page");
  if (btn) btn.addEventListener("click", function () { window.print(); });
})();
