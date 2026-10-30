/**
 * Shared markup helpers for the Workshop 04 deck generator (build.mjs). Every helper takes the
 * edition context `c` from context() so the German and the English edition share one structure.
 */

export const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const attr = (value) => esc(value).replace(/"/g, "&quot;");

const trim3 = (x) => String(Math.round(x * 1000) / 1000).replace(/^0\./, ".");

/** data-step attributes. o: { fx, win, ease, out, outWin, count, fill } */
export function s(k, o = {}) {
  let a = ` data-step="${k}"`;
  if (o.win) a += ` data-win="${o.win}"`;
  if (o.fx) a += ` data-fx="${o.fx}"`;
  if (o.ease) a += ` data-ease="${o.ease}"`;
  if (o.out !== undefined) a += ` data-out="${o.out}"${o.outWin ? ` data-out-win="${o.outWin}"` : ""}`;
  if (o.count) a += ` data-count="${o.count}"`;
  if (o.fill !== undefined) a += ` data-fill="${o.fill}"`;
  return a;
}

/** The window of item i of n inside one step, each `span` long, spread from `from` to `to`. */
export function stagger(i, n, span = 0.5, from = 0, to = 1) {
  const start = n <= 1 ? from : from + ((to - from - span) * i) / (n - 1);
  return `${trim3(start)},${trim3(Math.min(1, start + span))}`;
}

/** Figures bound with data-v, per edition. Shared keys must equal the demo's figures(locale). */
export const VALUES = {
  de: {
    months: "11", rows: "12", mwhNaive: "318,4", mwh11: "279,7", mwh12: "320,9", mwh1211: "305,1", short1211: "15,8",
    share12: "56,1 %", coverage: "91,7", days: "46", waterM3: "4.630", meterOld: "1.284.350", meterNew: "1.325.550",
    kwhSep: "41.200", mkdSep: "391.400", pvPrice: "8.550.000", pvYieldKwh: "180.000", tariff: "9,50", payback: "5,0",
    cite: "6", belegtBefore: "9", afterBelegt: "10", afterSchwach: "4", afterLuecke: "7", haCertified: "12", haTotal: "40",
  },
  en: {
    months: "11", rows: "12", mwhNaive: "318.4", mwh11: "279.7", mwh12: "320.9", mwh1211: "305.1", short1211: "15.8",
    share12: "56.1 %", coverage: "91.7", days: "46", waterM3: "4,630", meterOld: "1,284,350", meterNew: "1,325,550",
    kwhSep: "41,200", mkdSep: "391,400", pvPrice: "8,550,000", pvYieldKwh: "180,000", tariff: "9.50", payback: "5.0",
    cite: "6", belegtBefore: "9", afterBelegt: "10", afterSchwach: "4", afterLuecke: "7", haCertified: "12", haTotal: "40",
  },
};

export const MAIN_TOTAL = 18;

/** The edition context every slide function receives. */
export function context(lang, kit) {
  const de = lang === "de";
  const lib = de ? "./lib" : "../lib";
  const c = {
    lang,
    de,
    lib,
    assets: de ? "./assets" : "../assets",
    site: de ? "" : "/en",
    kit,
    t: (german, english) => (de ? german : english),
    v: VALUES[lang],
    status: de ? { belegt: "BELEGT", schwach: "SCHWACH", luecke: "LÜCKE" } : { belegt: "COVERED", schwach: "WEAK", luecke: "GAP" },
  };
  c.ico = (name, cls = "") => `<svg class="ico${cls ? ` ${cls}` : ""}" aria-hidden="true"><use href="${lib}/icons.svg#i-${name}"/></svg>`;
  c.dv = (key) => `<span data-v="${key}">${c.v[key]}</span>`;
  c.chip = (tone, extra = "") => `<span class="chip${extra ? ` ${extra}` : ""}" data-tone="${tone}">${c.status[tone]}</span>`;
  return c;
}

/** The quiet footer of every slide. */
export function foot(c, n, appendix = false) {
  const label = appendix ? `${c.t("Anhang", "Appendix")} ${n} / 3` : `${String(n).padStart(2, "0")} / ${MAIN_TOTAL}`;
  const note = c.t("Erfundener Fall, echte Regeln.", "Invented case, real rules.");
  return `<footer class="foot"><span>Workshop 04 · loehrning.ai</span><span class="foot__inv">${note}</span><span class="foot__n">${label}</span></footer>`;
}

/** One slide. o: { id, cls, label, steps, durations, kind } */
export function section(o, inner) {
  const kind = o.kind || "main";
  const cls = `slide ${o.id}${o.cls ? ` ${o.cls}` : ""}`;
  return `<section class="${cls}" id="${o.id}" data-kind="${kind}" data-label="${attr(o.label)}" data-step-total="${o.steps}" data-step-current="0" data-durations="${o.durations}">\n${inner}\n</section>`;
}

/** Label and headline at the top of a slide. */
export function head(label, headline, o = {}) {
  const h = o.size ? ` headline--${o.size}` : "";
  return `<header class="hd"><p class="label${o.accent ? " label--accent" : ""}">${label}</p><h2 class="headline${h}"${o.attrs || ""}>${headline}</h2></header>`;
}

/** A file chip as the kit folder shows it. */
export function file(ext, name, meta = "", o = {}) {
  const cls = `file${o.cls ? ` ${o.cls}` : ""}`;
  return `<div class="${cls}"${o.attrs || ""}${o.style ? ` style="${o.style}"` : ""}><span class="file__ext">${ext}</span><span class="file__body"><span class="file__name">${esc(name)}</span>${meta ? `<span class="file__meta">${meta}</span>` : ""}</span>${o.after || ""}</div>`;
}

/** The room's task on paper: ink, never the accent (the accent means Tim works in Claude). Never a clock. */
export const roomPill = (c, text, attrs = "") => `<p class="pill room-pill"${attrs}>${c.ico("hand")}${text}</p>`;

/** Tim switches to his real Claude; the drawn answer is a prepared teaching sample. */
export const live = (c, attrs = "") => `<p class="now now--live hd__now"${attrs}>${c.ico("spark")}${c.t("Tim: live · Folie: Muster", "Tim: live · Slide: sample")}</p>`;

/**
 * Tim's clicks in Claude Desktop as a numbered strip. items: [label, k, win, out, outWin]. The lit copy
 * (.tsteps__on) fades in at step k and out at `out`; there the check (.tsteps__done) pops. The last item
 * has no `out` and stays lit. The strip replays the clicks Tim made in Claude Desktop: he reads it out
 * before he switches, and the arrows tick it off when he is back. o: { col } stacks the items.
 */
export function tsteps(c, items, o = {}) {
  const li = items
    .map(([label, k, win, out, outWin], i) => {
      const base = `<b class="tsteps__n">${i + 1}</b><span>${esc(label)}</span>`;
      const on = `<i class="tsteps__on" aria-hidden="true"${s(k, { fx: "fade", win, out, outWin })}>${base}</i>`;
      const done = out === undefined ? "" : `<i class="tsteps__done" aria-hidden="true"${s(out, { fx: "pop", win: outWin })}>${c.ico("check", "ico--bold")}</i>`;
      return `<li>${base}${on}${done}</li>`;
    })
    .join("");
  return `<ol class="tsteps${o.col ? " tsteps--col" : ""}" aria-label="${c.t("Tims Schritte in Claude Desktop", "Tim's steps in Claude Desktop")}">${li}</ol>`;
}

/** Header of a Claude slide: kicker and Tim's strip in the label row, the live pill right, the headline below. */
export function liveHead(c, kick, items, headline) {
  return `<header class="hd hd--live"><div class="label tsteps-row"><span class="tsteps__kick">${kick}</span>${tsteps(c, items)}</div>${live(c, s(0, { fx: "pop", win: "0,.4" }))}<h2 class="headline headline--m">${headline}</h2></header>`;
}

/** The room's job on a slide: "Ihr schätzt: …" before a run, "Ihr prüft: …" after it. */
export const job = (c, lead, text, attrs = "", cls = "") => `<p class="job${cls ? ` ${cls}` : ""}"${attrs}>${c.ico("hand")}<span><b>${lead}</b> ${text}</span></p>`;

/* ── Claude desktop replica ─────────────────────────────────────────── */

export function cwBar(crumbs) {
  return `<div class="cw-bar"><i class="cw-dots"><b></b><b></b><b></b></i>${crumbs.map((crumb, i) => `<span class="cw-crumb${i === crumbs.length - 1 ? " cw-crumb--now" : ""}">${esc(crumb)}</span>`).join("")}</div>`;
}

/** The sidebar: Claude's own chrome stays in English, as the app shows it. */
export function cwSide(c, o = {}) {
  const chats = (o.chats || []).map(([name, on]) => `<p class="cw-row"${on ? " data-on" : ""}>${c.ico("chat")}<span>${esc(name)}</span></p>`).join("");
  return `<aside class="cw-side"><p class="cw-brand">Claude</p><p class="cw-nav cw-nav--new">${c.ico("plus")}New chat</p><p class="cw-nav">${c.ico("chat")}Chats</p><p class="cw-nav" data-on>${c.ico("folder")}Projects</p>${o.project === false ? "" : `<p class="cw-sec">Project</p><div class="cw-proj"${o.projAttrs || ""}><b>${esc(c.kit.project)}</b><span>${c.t("Stichtag", "Reference date")} 16.10.2026</span></div>`}${chats}${o.extra || ""}</aside>`;
}

/** The composer. `att`: an attachment row above the input (a file waiting to be sent). */
export const cwComposer = (c, att = "") => `<div class="cw-composer">${att}${c.ico("plus")}<span>Reply to Claude…</span><i class="cw-send">${c.ico("arrow-up")}</i></div>`;

/** A file the participant attaches, as Claude shows it in the thread. */
export const cwFile = (ext, name, meta) => `<span class="cw-file"><i>${ext}</i><span><b>${esc(name)}</b><small>${meta}</small></span></span>`;

/** The prompt as the participant's message: the kit text byte for byte, clamped, with a copy button. */
export function prompt(c, n, attrs = "") {
  return `<figure class="cw-user prompt"${attrs}><pre class="prompt__text" id="prompt-${n}">${esc(c.kit.prompts.get(n))}</pre><button class="prompt__copy" type="button" data-copy="prompt-${n}">${c.ico("copy")}<span class="copy__label">${c.t("Kopieren", "Copy")}</span></button></figure>`;
}

/** The whole window. o: { crumbs, side, cls, style, attrs, att } */
export function cw(c, o, thread) {
  const composer = cwComposer(c, o.att || "");
  const body = o.side ? `<div class="cw-body">${o.side}<div class="cw-main">${thread}${composer}</div></div>` : `<div class="cw-body cw-body--nosidebar"><div class="cw-main">${thread}${composer}</div></div>`;
  return `<div class="cw${o.cls ? ` ${o.cls}` : ""}"${o.attrs || ""}${o.style ? ` style="${o.style}"` : ""}>${cwBar(o.crumbs)}${body}</div>`;
}

/** "Claude is working" with its rows. rows: [icon, html, done] */
export function activity(c, head, rows, attrs = "") {
  return `<div class="cw-activity"${attrs}><p class="cw-act-head">${c.ico("spark")}Claude is working<em>${head}</em></p>${rows.join("")}</div>`;
}

/** The kit's thirteen company files, per edition: [ext, name, lines]. */
export const FILES = {
  de: [
    ["csv", "strom_2025.csv", 14], ["txt", "strom_zusammenfassung_entwurf.txt", 5], ["txt", "bio_zertifikat_weinberg.txt", 11],
    ["txt", "kompensation_2025.txt", 7], ["csv", "wasser_2025.csv", 14], ["md", "firmenprofil.md", 18], ["csv", "flaschen.csv", 5],
    ["csv", "personal_2025.csv", 8], ["txt", "arbeitsschutz_2025.txt", 8], ["txt", "richtlinien_und_compliance.txt", 14],
    ["txt", "pv_angebot_2026.txt", 11], ["md", "regeln_werbeaussagen.md", 30], ["md", "vsme_basismodul.md", 39],
  ],
  en: [
    ["csv", "electricity_2025.csv", 14], ["txt", "electricity_summary_draft.txt", 5], ["txt", "organic_certificate_vineyard.txt", 11],
    ["txt", "carbon_offsets_2025.txt", 7], ["csv", "water_2025.csv", 14], ["md", "company_profile.md", 18], ["csv", "bottles.csv", 5],
    ["csv", "headcount_2025.csv", 8], ["txt", "health_safety_2025.txt", 8], ["txt", "policies_and_compliance.txt", 14],
    ["txt", "solar_offer_2026.txt", 11], ["md", "green_claims_rules.md", 30], ["md", "vsme_basic_module.md", 39],
  ],
};

/** The three requests, per edition. */
export const REQUESTS = {
  de: ["1-fragebogen-nordvik.md", "2-werbeaussagen.md", "3-bankformular.md"],
  en: ["1-nordvik-questionnaire.md", "2-marketing-claims.md", "3-bank-form.md"],
};

/**
 * A kit file that travels into the Claude window. The copy sits on the stage (outside the window,
 * which clips), at its landing place `at` = [left, top, width, dx, dy]: the landing box in stage
 * pixels and the offset of its source's centre (geometry.mjs, measured from the built page).
 * o: { k, win, out, outWin, cls, s, lift, h, ease }. Long flights ease out (a spring would overshoot the landing).
 */
export function fly(html, at, o) {
  const [x, y, w, dx, dy] = at || [0, 0, 0, 0, 0];
  const size = `${w ? `;width:${w}px` : ""}${o.h ? `;height:${o.h}px` : ""}`;
  const style = `left:${x}px;top:${y}px${size};--dx:${dx}px;--dy:${dy}px;--s:${o.s ?? 1};--lift:${o.lift ?? 90}px`;
  return `<span class="fly${o.cls ? ` ${o.cls}` : ""}" style="${style}"${s(o.k, { fx: "arc", ease: o.ease ?? "out", win: o.win, out: o.out, outWin: o.outWin })}>${html}</span>`;
}
