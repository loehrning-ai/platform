/* w04-pages.js · Workshop 04 learner pages (guide, field card, transfer sheet).
   1. Language-aware back link: the same referrer rule as the other workshops' strip script.
      Someone who came from the German workshop page gets "Zurück zum Workshop" first.
   2. Material tabs: scroll the current tab into view and fade the edge that has more tabs.
   3. Print button (#print-page), if the page has one.
   4. Guide section folds: a #hash or contents link opens its section, "Open all" opens
      them all on phones, closing a section from its sticky toggle scrolls back to the section, and
      browsers without ::details-content get the folds opened on wide screens.
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
    if (c && n.scrollWidth > n.clientWidth) n.scrollLeft = Math.max(0, c.offsetLeft - n.offsetLeft - 48);
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

  // Field card on a phone: the case figures fold behind one button, so the card fits one screen.
  // Print (and a wide screen) always show them; without JavaScript they stay visible.
  var cases = document.getElementById("fc-case-toggle");
  var table = document.getElementById("fc");
  if (cases && table) {
    document.documentElement.classList.add("fc-js");
    cases.hidden = false;
    cases.addEventListener("click", function () {
      var open = table.getAttribute("data-cases") !== "open";
      if (open) table.setAttribute("data-cases", "open"); else table.removeAttribute("data-cases");
      cases.setAttribute("aria-expanded", open ? "true" : "false");
      cases.textContent = open ? "Hide the case figures" : "Show the case figures";
    });
  }

  var folds = document.querySelectorAll("details.g-fold");
  if (folds.length) {
    var setAll = function (open) { for (var i = 0; i < folds.length; i++) folds[i].open = open; };
    // wide screens show every section body through ::details-content; without it, open the folds
    var native = !!(window.CSS && CSS.supports && CSS.supports("selector(::details-content)"));
    if (!native) {
      document.documentElement.classList.add("g-fold-js");
      var wide = window.matchMedia ? window.matchMedia("(min-width: 641px)") : null;
      var sync = function () { if (wide && wide.matches) setAll(true); };
      sync();
      if (wide && wide.addEventListener) wide.addEventListener("change", sync);
      window.addEventListener("beforeprint", function () { setAll(true); });
    }
    // a contents link or a #hash opens the section it points to
    var openFor = function (id) {
      var t = id ? document.getElementById(id) : null;
      var s = t && t.closest ? t.closest(".g-sec") : null;
      var d = s ? s.querySelector("details.g-fold") : null;
      if (d) d.open = true;
    };
    var fromHash = function () { try { openFor(decodeURIComponent(location.hash.slice(1))); } catch (e) { /* malformed hash */ } };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    document.addEventListener("click", function (ev) {
      var a = ev.target && ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
      if (a) openFor(a.getAttribute("href").slice(1));
    });
    // closing a long section from its sticky toggle: bring the section's top back into view
    document.addEventListener("click", function (ev) {
      var sm = ev.target && ev.target.closest ? ev.target.closest("details.g-fold > summary") : null;
      var d = sm ? sm.parentNode : null;
      if (!d || !d.open) return;
      var sec = d.closest ? d.closest(".g-sec") : null;
      if (!sec) return;
      setTimeout(function () {
        if (!d.open && sec.getBoundingClientRect().top < 0) sec.scrollIntoView({ block: "start" });
      }, 0);
    });
    var all = document.getElementById("fold-all");
    if (all) {
      var paint = function () {
        var open = true;
        for (var i = 0; i < folds.length; i++) if (!folds[i].open) open = false;
        all.classList.toggle("is-open", open);
        all.setAttribute("aria-expanded", open ? "true" : "false");
      };
      all.parentNode.hidden = false;
      all.addEventListener("click", function () { setAll(!all.classList.contains("is-open")); paint(); });
      for (var i = 0; i < folds.length; i++) folds[i].addEventListener("toggle", paint);
      paint();
    }
  }
})();
