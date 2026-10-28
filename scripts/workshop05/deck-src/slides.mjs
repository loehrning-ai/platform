/**
 * The Workshop 05 deck as HTML on the shared deck engine (lib/scenes.js, lib/engine.css), one
 * function per slide. Every word comes from deck-copy.json (c), every fact from data.mjs (d), so the
 * German and the English edition share one structure and one set of numbers.
 *
 * Motion: an element with data-step="k" arrives on press k of its slide; data-win places it inside
 * the press, data-fx picks the motion (see the engine notes in lib/engine.css). Paths are written as
 * "./lib/" and "./assets/"; build.mjs moves them one folder up for the English edition.
 */

export const esc = (value) =>
  String(value).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
export const fill = (text, vars = {}) => String(text).replace(/\{(\w+)\}/g, (m, key) => (key in vars ? String(vars[key]) : m));
/** Copy with *word* marks: escaped, the marks become the slide's one accent. */
const em = (text, vars) => esc(fill(text, vars)).replace(/\*([^*]+)\*/g, "<em>$1</em>");

/** 9.11.2026 or 9 Nov 2026. */
export function fmtDate(iso, c) {
  const [y, m, d] = iso.split("-").map(Number);
  return c.lang === "de" ? `${d}.${m}.${y}` : `${d} ${c.months[m - 1]} ${y}`;
}
/** 10.12.2026 in both editions, for pills and chips. */
const dot = (iso) => iso.split("-").reverse().join(".");
/** 20,8 or 20.8. */
export const num = (value, c) => (c.lang === "de" ? String(value).replace(".", ",") : String(value));

const r3 = (x) => String(Math.round(x * 1000) / 1000).replace(/^0\./, ".");

/** data-step attributes. o: { fx, win, ease, out, outWin, count, keep } */
function s(k, o = {}) {
  let a = ` data-step="${k}"`;
  if (o.win) a += ` data-win="${o.win}"`;
  if (o.fx) a += ` data-fx="${o.fx}"`;
  if (o.ease) a += ` data-ease="${o.ease}"`;
  if (o.out !== undefined) a += ` data-out="${o.out}"${o.outWin ? ` data-out-win="${o.outWin}"` : ""}`;
  if (o.count) a += ` data-count="${o.count}"`;
  if (o.keep) a += " data-keep";
  return a;
}

/** The window of item i of n inside one press, each `span` long, spread from `from` to `to`. */
function stagger(i, n, span = 0.5, from = 0, to = 1) {
  const start = n <= 1 ? from : from + ((to - from - span) * i) / (n - 1);
  return `${r3(start)},${r3(Math.min(1, start + span))}`;
}

const ico = (name, cls = "") => `<svg class="ico${cls ? ` ${cls}` : ""}" aria-hidden="true"><use href="./lib/icons.svg#i-${name}"/></svg>`;
const TONE = { covered: "belegt", weak: "schwach", gap: "luecke" };
const chip = (status, c, extra = "") => `<span class="chip${extra ? ` ${extra}` : ""}" data-tone="${TONE[status]}">${esc(c.status[status])}</span>`;
const TESTS = ["quote", "date", "scope", "approval"];
const TEST_ICON = { quote: "quote", date: "calendar", scope: "people", approval: "pen" };
const ITEM_ICON = { R1: "server", R2: "link", R3: "spark", R4: "key", R5: "cap", R6: "alert", R7: "backup", R8: "policy" };
const OWNER_OF = { R2: "it", R3: "it", R4: "it", R7: "it", R5: "hr", R8: "md" };
const MAIN_TOTAL = 16;

const extOf = (name) => (name.endsWith("/") ? "dir" : name.split(".").pop());
function file(name, meta = "", o = {}) {
  return `<div class="file${o.cls ? ` ${o.cls}` : ""}"${o.attrs || ""}${o.style ? ` style="${o.style}"` : ""}><span class="file__ext">${esc(extOf(name))}</span><span class="file__body"><span class="file__name">${esc(name)}</span>${meta ? `<span class="file__meta">${meta}</span>` : ""}</span>${o.after || ""}</div>`;
}

/** The pill on every slide where Tim works in Claude Desktop on the projector (the same in W04). */
const live = (c, attrs = s(0, { fx: "pop", win: "0,.4" })) => `<p class="now now--live hd__now"${attrs}>${ico("spark")}${esc(c.live)}</p>`;

/**
 * Tim's clicks in Claude Desktop for one slide, in the label row: numbered, the current one lit, done ones
 * checked. items: [label, on, off?] with on/off = [press, window]; `end` checks the last item.
 */
function tsteps(c, kick, items, end) {
  const lis = items
    .map(([label, on, off], i) => {
      const body = `<b class="tsteps__n">${i + 1}</b><span>${esc(label)}</span>`;
      const offAt = off ?? (i === items.length - 1 ? end : undefined);
      const lit = `<i class="tsteps__on" aria-hidden="true"${s(on[0], { fx: "fade", win: on[1], ...(offAt ? { out: offAt[0], outWin: offAt[1] } : {}) })}>${body}</i>`;
      const done = offAt ? `<i class="tsteps__done" aria-hidden="true"${s(offAt[0], { fx: "pop", win: offAt[1] })}>${ico("check", "ico--bold")}</i>` : "";
      return `<li>${body}${lit}${done}</li>`;
    })
    .join("");
  return `<div class="label tsteps-row">${kick ? `<span class="tsteps__kick">${esc(kick)}</span>` : ""}<ol class="tsteps" aria-label="${esc(c.stepsLabel)}">${lis}</ol></div>`;
}

/** The room's job on a slide: "Ihr schätzt: ..." before a run, "Ihr prüft: ..." after it. */
const job = ([lead, text], attrs = "") => `<p class="job"${attrs}>${ico("hand")}<span><b>${esc(lead)}</b> ${esc(text)}</span></p>`;

function head(label, headline, o = {}) {
  const top = o.steps ?? `<p class="label${o.accent ? " label--accent" : ""}">${esc(label)}</p>`;
  return `<header class="hd"${o.hdAttrs || ""}>${top}<h2 class="headline headline--${o.size || "m"}"${o.attrs || ""}>${headline}</h2>${o.after || ""}</header>`;
}

function foot(c, n, note) {
  const label = typeof n === "number" ? `${String(n).padStart(2, "0")} / ${MAIN_TOTAL}` : `${esc(c.appendix)} ${n}`;
  return `<footer class="foot"><span>${esc(c.foot)}</span><span class="foot__inv">${esc(note ?? c.footNote)}</span><span class="foot__n">${label}</span></footer>`;
}

/* ── geometry: where a place sits on a globe canvas (the projection lib/globe.js draws) ── */
const PLACES = { germany: [10.4, 51.2], hamburg: [9.99, 53.55], skopje: [21.43, 42.0], canberra: [149.13, -35.28] };
function at(placeName, { center, zoom, w, h, r = 0.47, cx = 0.5, cy = 0.5 }) {
  const DEG = Math.PI / 180;
  const [lon0, lat0] = PLACES[center];
  const [lon, lat] = PLACES[placeName];
  const rad = Math.min(w, h) * r * zoom;
  const sl = Math.sin(lat0 * DEG), cl = Math.cos(lat0 * DEG);
  const l = (lon - lon0) * DEG, p = lat * DEG;
  return [Math.round(w * cx + rad * Math.cos(p) * Math.sin(l)), Math.round(h * cy - rad * (cl * Math.sin(p) - sl * Math.cos(p) * Math.cos(l)))];
}

/* ── Claude desktop replica ─────────────────────────────────────────── */

function cwBar(crumbs) {
  return `<div class="cw-bar"><i class="cw-dots"><b></b><b></b><b></b></i>${crumbs.map((crumb, i) => `<span class="cw-crumb${i === crumbs.length - 1 ? " cw-crumb--now" : ""}">${esc(crumb)}</span>`).join("")}</div>`;
}
const cwComposer = () => `<div class="cw-composer">${ico("plus")}<span>Reply to Claude…</span><i class="cw-send">${ico("arrow-up")}</i></div>`;
const cwFile = (ext, name, meta, attrs = "") => `<span class="cw-file"${attrs}><i>${esc(ext.toUpperCase())}</i><span><b>${esc(name)}</b>${meta ? `<small>${esc(meta)}</small>` : ""}</span></span>`;

/** The prompt as the participant's message: the start file's text byte for byte, clamped, with a copy button. */
function prompt(c, n, text, attrs = "", lines = 3) {
  return `<figure class="cw-user prompt"${attrs}><pre class="prompt__text prompt-body" id="prompt-${n}" style="--lines:${lines}">${esc(text)}</pre><button class="prompt__copy" type="button" data-copy="prompt-${n}">${ico("copy")}<span class="copy__label">${c.lang === "de" ? "Kopieren" : "Copy"}</span></button></figure>`;
}

function activity(rows, head, attrs = "") {
  return `<div class="cw-activity"${attrs}><p class="cw-act-head">${ico("spark")}Claude is working<em>${esc(head)}</em></p>${rows.join("")}</div>`;
}
const act = (icon, html, k, win) => `<p class="cw-act" data-done${s(k, { fx: "pop", win })}>${ico(icon)}${html}</p>`;

/* ── slides ─────────────────────────────────────────────────────────── */

function cover(d, c) {
  const title = em(c.cover.title).replace(/ (mit|with) /, "<br>$1 ");
  const [who, length] = c.cover.meta.split(" · ");
  return `<div class="cover__globe" aria-hidden="true"><canvas data-globe data-lat="40" data-speed="7" data-boost="120" data-home="84" data-cx="0.81" data-cy="0.5" data-r="0.44" data-arc-width="4" data-arc-land data-globe-steps="0:skopje@1.08;0:arc:skopje>hamburg"></canvas></div>
<div class="cover__main"><p class="label"${s(0, { win: "0,.3" })}>${esc(c.cover.label)}</p>
<h1 class="cover__title"${s(0, { win: ".05,.5", fx: "blur" })}>${title}</h1>
<p class="cover__sub"${s(0, { win: ".25,.65" })}>${esc(c.cover.sub)}</p>
<p class="cover__meta"${s(0, { win: ".45,.9" })}><span class="pill">${ico("user")}${esc(who)}</span><span class="pill pill--quiet">${esc(length)}</span><span class="pill pill--quiet cover__route">${ico("pin")}${esc(c.cover.from)}${ico("arrow")}${esc(c.cover.to)}</span></p></div>
${foot(c, 1)}`;
}

function host(d, c) {
  const h = c.host;
  const wins = ["0.36,0.56", "0.48,0.68", "0.6,0.8", "0.72,0.94"];
  const stops = h.career
    .map((stop, i) => `<li class="host__stop${i === h.career.length - 1 ? " host__own" : ""}"${s(0, { win: wins[i], fx: "pop" })}><i class="host__dot" aria-hidden="true"></i><b>${esc(stop.org)}</b><span>${esc(stop.role)}</span></li>`)
    .join("");
  return `<figure class="host__photo"${s(0, { win: "0,0.4", fx: "fade" })}><img src="./assets/tim-loehr.jpg" alt="${esc(h.alt)}" width="1100" height="1100" /></figure>
<div class="host__body"><div class="host__main"><p class="host__kicker"${s(0, { win: "0,0.35" })}>${esc(h.kicker)}</p><h2 class="host__name"${s(0, { win: "0.06,0.45" })}>Tim Löhr</h2>
<p class="host__role"${s(0, { win: "0.14,0.5" })}>${esc(h.role)}</p>
<div class="host__career" role="group" aria-label="${esc(h.careerLabel)}"><i class="host__track" aria-hidden="true"></i><i class="host__fill" aria-hidden="true"${s(0, { win: "0.35,0.9", fx: "line" })}></i><ol class="host__stops">${stops}</ol></div>
<p class="host__msc"${s(0, { win: "0.5,0.85" })}>${ico("cap")}<b>${esc(h.degree)}</b><span>${esc(h.school)}</span></p>
<p class="host__line"${s(0, { win: "0.6,0.95" })}>${ico("shield")}<span>${esc(h.line)}</span></p></div>
${foot(c, 2)}</div>`;
}

/* The stage is 1696 × 790 on the 1920 × 1080 canvas; slides that draw lines or fly things between
   two places compute both ends in these stage pixels. */
const STAGE_W = 1696;

/** A fly along a curve from (dx, dy) back home: data-fx="arc" reads these. */
const arcStyle = (dx, dy, lift = 120, scale = 0.6) => ` style="--dx:${Math.round(dx)}px;--dy:${Math.round(dy)}px;--lift:${lift}px;--s:${scale}"`;
/** *word* marks as <mark>: Claude's own highlight inside the window replica. */
const hl = (text, vars) => esc(fill(text, vars)).replace(/\*([^*]+)\*/g, '<mark class="cw-hl">$1</mark>');
/** A test result as a small tile: pass (check), fail (cross, struck), skip (empty). */
const tdot = (state, label, motion = "") => `<i class="tdot tdot--${state}" title="${esc(label)}"${motion}>${state === "skip" ? "" : ico(state === "pass" ? "check" : "cross", "ico--bold")}</i>`;

/** The Claude sidebar with the project; o.motion animates it (project slide), otherwise it is set up already. */
function cwSide(c, o = {}) {
  const k = c.project;
  const m = o.motion ?? {};
  return `<aside class="cw-side"><p class="cw-brand">Claude</p><p class="cw-nav cw-nav--new">${ico("plus")}New chat</p><p class="cw-nav">${ico("chat")}Chats</p><p class="cw-nav" data-on>${ico("folder")}Projects</p><p class="cw-sec">Project</p><div class="cw-proj"${m.proj ?? ""}><b>${esc(k.project)}</b><span>${esc(k.projectSub)}</span>${m.projGlow ? `<i class="cw-proj__glow"${m.projGlow}></i>` : ""}</div><p class="cw-row">${ico("policy")}Instructions<em${m.instr ?? ""}>set</em></p><p class="cw-row"${o.knowOn ? " data-on" : ""}>${ico("book")}Project knowledge<em${m.know ?? ""}>12 files</em></p><p class="cw-toggle" data-on data-keep${m.code ?? ""}><span>Code execution</span><i></i></p></aside>`;
}

/** Slide 03: the real case. A report page with references that do not exist, a quote nobody said and the
    model it names; then the refund drains out of the fee bar into the counter. */
function realCase(d, c) {
  const k = c.case;
  const MAP = { center: "canberra", zoom: 1.5, w: 520, h: 646 };
  const [px, py] = at("canberra", MAP);
  const bars = (widths) => widths.map((w) => `<i class="sk" style="width:${w}%"></i>`).join("");
  const refs = [92, 78, 86, 70]
    .map((w, i) => {
      const bad = i !== 2;
      const n = [0, 1, -1, 2][i];
      return `<li class="ref${bad ? " ref--bad" : ""}"><span class="ref__n">[${i + 4}]</span><span class="ref__line"><i class="sk" style="width:${w}%"></i>${bad ? `<i${s(1, { fx: "strike", win: stagger(n, 3, 0.4, 0.05, 0.85) })}></i>` : ""}</span>${bad ? `<span class="flag"${s(1, { fx: "pop", win: stagger(n, 3, 0.35, 0.25, 1) })}>${ico("cross", "ico--bold")}${esc(k.noSuchRef)}</span>` : ""}</li>`;
    })
    .join("");
  // Stage pixels: map 0..520, report 568..1328, the fee bar 568..1696 (centre line y 628), the refund column from 1376.
  const share = d.refund / d.fee;
  const BAR_X = 568, BAR_W = 1128, BAR_Y = 628;
  const segW = Math.round(BAR_W * share);
  const segX = BAR_X + BAR_W - segW / 2;
  const coins = Array.from({ length: 10 }, (_, i) => {
    const x = 1384 + (i % 5) * 14 + (i >= 5 ? 96 : 0), y = 140 - (i % 5) * 15;
    const sx = segX - 32 + ((i * 47) % 160) - 80, sy = BAR_Y - 32;
    return `<i class="coin" style="left:${x}px;top:${y}px;--dx:${sx - x}px;--dy:${sy - y}px;--lift:${180 + (i % 3) * 50}px;--s:.6"${s(4, { fx: "arc", win: stagger(i, 10, 0.4, 0.1, 0.98) })}><b>A$</b></i>`;
  }).join("");
  const DRAIN = [1384 + 64, 300 + 9];
  const drain = `<i class="fee__drain" style="left:${DRAIN[0] - 64}px;top:${DRAIN[1] - 9}px;--dx:${Math.round(segX - DRAIN[0])}px;--dy:${BAR_Y - DRAIN[1]}px;--lift:140px;--s:1.95"${s(4, { fx: "arc", win: "0,.42" })}></i>`;
  const pct = `${Math.round(share * 100)} %`;
  const fee = c.lang === "de" ? `${d.fee.toLocaleString("de-DE")} A$` : `A$${d.fee.toLocaleString("en-GB")}`;
  const amount = d.refund.toLocaleString(c.lang === "de" ? "de-DE" : "en-GB");
  const unit = (text) => (text ? `<span class="case__unit">${esc(text)}</span>` : "");
  return `${head(k.label, esc(k.title))}
<div class="stage case">
<figure class="map case__map surface"${s(0, { fx: "fade", win: "0,.4" })}><canvas data-globe data-lat="-20" data-speed="6" data-home="60" data-r="0.47" data-globe-steps="0:canberra@1.5" aria-hidden="true"></canvas>
<span class="pin" style="left:${px}px;top:${py}px"${s(0, { fx: "pop", win: ".7,1" })}>${ico("pin")}<b>${esc(k.pin)}</b></span></figure>
<article class="report surface surface--strong"${s(0, { fx: "fly", win: ".2,.9" })} style="--dx:240px;--dy:40px;--s:.92">
<p class="report__head">${ico("file")}<b>${esc(k.author)}</b><span class="pill pill--quiet">${ico("bank")}${esc(k.client)}</span></p>
<div class="report__body">${bars([96, 88, 64])}</div>
<blockquote class="report__quote"${s(2, { fx: "glow", win: "0,.5" })}><p class="report__qhead">${ico("quote")}<span>${esc(k.quoteHead)}</span><span class="flag flag--solid"${s(2, { fx: "pop", win: ".4,.9" })}>${esc(k.invented)}</span></p>${bars([90, 58])}</blockquote>
<p class="label report__refs">${esc(k.refs)}</p>
<ol class="refs">${refs}</ol>
<p class="report__model"${s(3, { fx: "pop", win: "0,.6" })} style="--origin:left center"><span class="pill">${ico("spark")}Azure OpenAI GPT-4o</span><span>${esc(k.modelNote)}</span></p>
</article>
<div class="fee"${s(0, { fx: "fade", win: ".35,.8" })}><p class="fee__label">${ico("bank")}<span>${esc(k.fee)}</span><b>${fee}</b></p>
<div class="fee__bar"><i class="fee__fill"${s(0, { fx: "line", win: ".45,1" })}></i><i class="fee__hole" style="width:${r3(share * 100).replace(/^\./, "0.")}%"${s(4, { fx: "fade", win: ".02,.2" })}><span class="fee__pct"${s(4, { fx: "pop", win: ".12,.4" })}>${pct}</span></i></div></div>
${drain}
<div class="case__refund"${s(4, { fx: "pop", win: ".3,.6" })} style="--origin:left top"><p class="case__money">${unit(k.refundPre)}<b${s(4, { fx: "none", win: ".3,1", count: `0,${d.refund},0` })}>${amount}</b>${unit(k.refundPost)}</p><p class="case__word">${esc(k.refunded)}</p></div>
${coins}
<p class="moral case__moral"${s(5, { fx: "blur", win: "0,.8" })}>${em(k.moral)}</p>
</div>
${foot(c, 3, k.source)}`;
}

/* Company slide geometry, in stage pixels: the Tannwald card (top right), the wire into Vardar's card, the
   three flows that land on the wire's lane, the contract chip and the short explanation of an audit. */
const CO = { card: [0, 0, 700], cust: [1180, 0, 516, 136], flow: (i) => [756, 212 + i * 66], flowW: 300, contract: [1180, 168] };

/** Slide 04: who Vardar is. An office in Skopje lights up, 120 people fill in, Tannwald's calls, emails and customer data flow in; then what an audit is. */
function company(d, c) {
  const k = c.company;
  // the office: 8 × 3 windows, a door, the sign; a hill line behind it
  const wins = Array.from({ length: 24 }, (_, i) => {
    const col = i % 8, row = Math.floor(i / 8);
    return `<rect class="co__win" data-cell x="${184 + col * 50}" y="${126 + row * 46}" width="34" height="30" rx="4"/>`;
  }).join("");
  const office = `<svg class="co__office" viewBox="0 0 760 300" aria-hidden="true"><path class="co__hill" d="M0 214 C 120 150, 250 118, 380 136 S 640 196, 760 158 L760 300 L0 300 Z"/>
<rect class="co__house" x="160" y="104" width="440" height="186" rx="6"/><rect class="co__plate" x="262" y="66" width="236" height="40" rx="6"/><text class="co__sign" x="380" y="93" text-anchor="middle">${esc(k.sign)}</text>
<g${s(1, { fx: "none", win: "0,.45", keep: true })} data-fill="24">${wins}</g><rect class="co__door" x="362" y="248" width="36" height="42" rx="3"/><path class="co__ground" d="M40 290 H720"/></svg>`;
  const people = Array.from({ length: d.training.staff }, (_, i) => "<i data-cell></i>").join("");
  const [cx, cy, cw, ch] = CO.cust;
  const FLOW_ICON = ["chat", "envelope", "file"];
  const WIRE = `M${cx - 4} ${cy + ch / 2} C ${cx - 200} ${cy + ch / 2}, 900 190, 704 190`;
  // Each packet runs the wire from Tannwald into the building; its label settles on the lane as it lands.
  const ride = (i) => stagger(i, 3, 0.3, 0.5, 0.92);
  const packets = k.flows
    .map((_, i) => `<i class="co__pk" style="offset-path:path('${WIRE}')"${s(2, { fx: "none", ease: "linear", win: ride(i) })}>${ico(FLOW_ICON[i])}</i>`)
    .join("");
  const flows = k.flows
    .map((label, i) => {
      const [x, y] = CO.flow(i);
      const landed = Number(ride(i).split(",")[1]);
      return `<p class="pill pill--quiet co__flow" style="left:${x}px;top:${y}px;--dx:${Math.round(704 - (x + CO.flowW / 2))}px;--dy:${Math.round(190 - (y + 26))}px;--lift:20px;--s:.5"${s(2, { fx: "arc", win: `${r3(landed - 0.1)},${r3(Math.min(1, landed + 0.08))}` })}>${ico(FLOW_ICON[i])}${esc(label)}</p>`;
    })
    .join("");
  return `${head(k.label, em(k.title))}
<div class="stage co">
<article class="co__card surface surface--strong"${s(0, { fx: "fly", win: "0,.5" })} style="--dx:-80px;--s:.96">
${office}
<p class="pill co__place"${s(0, { fx: "pop", win: ".5,.9" })} style="--origin:left center">${ico("pin")}${esc(k.place)}</p>
<p class="co__stat"${s(1, { fx: "fade", win: ".1,.3" })}><b${s(1, { fx: "none", win: ".2,1", count: `0,${d.training.staff},0` })}>${d.training.staff}</b><span>${esc(k.staff)}</span></p>
<div class="co__people"${s(1, { fx: "none", win: ".2,1", keep: true })} data-fill="${d.training.staff}">${people}</div>
</article>
<svg class="wires co__wires" viewBox="0 0 1696 790" preserveAspectRatio="none" aria-hidden="true"><path${s(2, { fx: "draw", win: ".2,.5" })} pathLength="1" d="${WIRE}"/><circle${s(2, { fx: "pop", win: ".45,.55" })} cx="704" cy="190" r="7"/></svg>
<div class="co__pks" aria-hidden="true">${packets}</div>
<div class="co__cust surface surface--strong" style="left:${cx}px;top:${cy}px;width:${cw}px;height:${ch}px;--dx:160px;--s:.94"${s(2, { fx: "fly", win: "0,.4" })}><span class="ico-tile">${ico("people")}</span><p><b>${esc(k.customer)}</b><span>${esc(k.customerSub)}</span></p></div>
<p class="co__since"${s(2, { fx: "fade", win: ".55,.8" })}>${ico("calendar")}${esc(k.since)}</p>
${flows}
<p class="pill co__contract" style="left:${CO.contract[0]}px;top:${CO.contract[1]}px"${s(3, { fx: "pop", win: "0,.4" })}>${ico("file")}${esc(k.contract)}<i class="co__glow"${s(3, { fx: "glow", win: ".3,.7" })}></i></p>
<div class="co__audit surface surface--accent"${s(3, { fx: "pop", win: ".15,.6" })} style="--origin:left top"><p class="co__kick">${ico("search")}${esc(k.kicker)}</p><p class="co__line">${esc(k.line)}</p><p class="src co__src"${s(3, { fx: "fade", win: ".5,.9" })}>${esc(k.source)}</p></div>
</div>
${foot(c, 4)}`;
}

/** Slide 05: our case. Hamburg sends a letter to Skopje; it flies on into the card, opens and deals out eight items. */
function request(d, c) {
  const k = c.request;
  const MAP = { center: "germany", zoom: 4.4, w: 760, h: 790, cx: 0.4, cy: 0.36 };
  const [hx, hy] = at("hamburg", MAP);
  const [sx, sy] = at("skopje", MAP);
  const P = [sx + 130, sy - 100]; // where the envelope lands after the arc, above the Skopje pin; the arc stays under the headline
  const CX = 808 + 37, CY = 146, CW = 196, CH = 112, G = 14;
  const D = [CX + (4 * CW + 3 * G) / 2, CY + CH + G / 2]; // the middle of the item grid: the letter opens here
  const items = d.items
    .map((item, i) => {
      const x = CX + (i % 4) * (CW + G) + CW / 2, y = CY + Math.floor(i / 4) * (CH + G) + CH / 2;
      return `<li class="ritem"${s(3, { fx: "arc", win: stagger(i, 8, 0.42) })}${arcStyle(D[0] - x, D[1] - y, 150, 0.3)}><span class="ico-tile">${ico(ITEM_ICON[item.id])}</span><b>${item.id}</b><span>${esc(k.items[item.id])}</span></li>`;
    })
    .join("");
  const opts = Array.from({ length: 9 }, (_, n) => `<button class="poll__opt" type="button" data-poll="estimate" data-value="${n}"><span class="poll__key">${n}</span><b data-poll-n>0</b></button>`).join("");
  const flap = `<g class="env__flap"${s(2, { fx: "none", win: ".42,.62", keep: true })}><path d="M6 8 L110 92 L214 8 Z"/><circle cx="110" cy="66" r="13"/></g>`;
  const envelope = `<div class="req__env" style="left:${D[0] - 110}px;top:${D[1] - 75}px;--dx:${hx - sx}px;--dy:${hy - sy}px;--lift:40px;--s:.45"${s(1, { fx: "arc", win: ".1,1" })}><div class="req__env-move" style="--dx:${P[0] - D[0]}px;--dy:${P[1] - D[1]}px"${s(2, { fx: "move", win: "0,.42", keep: true })}><div class="req__env-fade"${s(0, { fx: "fade", win: "0,.01", out: 3, outWin: ".2,.55" })}><svg viewBox="0 0 220 150" aria-hidden="true"><rect class="env__body" x="3" y="3" width="214" height="144" rx="16"/><path class="env__fold" d="M8 142 L110 72 L212 142"/>${flap}</svg></div></div></div>`;
  const short = (iso) => (c.lang === "de" ? `${Number(iso.slice(8))}.${Number(iso.slice(5, 7))}.` : fmtDate(iso, c).replace(/ \d{4}$/, ""));
  return `${head(k.label, em(k.title))}
<div class="stage req">
<figure class="map req__map surface"${s(0, { fx: "fade", win: "0,.35" })}><canvas data-globe data-lat="48" data-speed="6" data-home="40" data-r="0.47" data-cx="0.4" data-cy="0.36" data-arc-width="4" data-arc-land data-globe-steps="0:germany@4.4;1:arc:hamburg>skopje" aria-hidden="true"></canvas>
<span class="pin pin--hh" style="left:${hx}px;top:${hy}px"${s(0, { fx: "pop", win: ".7,.95" })}>${ico("pin")}<b>${esc(k.tannwald)}</b><small>Hamburg</small></span>
<span class="pin pin--sk" style="left:${sx}px;top:${sy}px"${s(0, { fx: "pop", win: ".78,1" })}>${ico("pin")}<b>${esc(k.vardar)}</b><small>Skopje</small></span>
</figure>
<article class="letter surface surface--strong"${s(2, { fx: "arc", win: ".5,1" })}${arcStyle(D[0] - 1252, D[1] - 260, 50, 0.2)}>
<p class="letter__from">${ico("envelope")}<span>${esc(k.letterFrom)}</span>${k.lang ? `<span class="letter__lang">${esc(k.lang)}</span>` : ""}</p>
<div class="letter__said"><p class="letter__quote"><span class="q" data-file="request_tannwald.md">${esc(d.headline)}</span></p>${k.gloss ? `<p class="letter__gloss">${esc(k.gloss)}</p>` : ""}</div>
<ol class="ritems">${items}</ol>
<div class="tl"${s(4, { fx: "fade", win: "0,.15" })}><i class="tl__line"${s(4, { fx: "line", win: ".05,.75" })}></i>
<p class="tl__pt"${s(4, { fx: "pop", win: ".05,.3" })}>${ico("envelope")}<b>${short(d.exercise)}</b><span>${esc(k.sent)}</span></p>
<p class="tl__pt"${s(4, { fx: "pop", win: ".3,.55" })}>${ico("upload")}<b>${short(d.sendBy)}</b><span>${esc(k.docs)}</span></p>
<p class="tl__pt tl__pt--end"${s(4, { fx: "pop", win: ".55,.8" })}>${ico("calendar")}<b>${short(d.audit)}</b><span>${esc(k.auditName)}</span></p></div>
<p class="stake req__stake"${s(4, { fx: "pop", win: ".78,1" })} style="--origin:right center">${ico("alert")}<span>${esc(k.stake)}</span></p>
</article>
${envelope}
<div class="poll poll--row req__poll"${s(5, { fx: "fly", win: "0,.7" })} style="--dy:60px;--s:.96"><p class="poll__q">${ico("hand")}${esc(k.poll)}</p><div class="poll__opts">${opts}</div></div>
</div>
${foot(c, 5)}`;
}

/** Slide 06: the draft reply on the left from the first frame; the room's vote arrives beside it. */
function draft(d, c) {
  const k = c.draft;
  const lines = d.draft
    .map((line, i) => `<li class="claim"${s(0, { fx: "type", ease: "linear", win: stagger(i, 4, 0.3, 0.2, 1) })}><span class="claim__n">${i + 1}</span><span class="claim__t q" data-file="draft-reply.md">${esc(line)}</span><span class="qmark"${s(1, { fx: "pop", win: stagger(i, 4, 0.4) })}>?</span></li>`)
    .join("");
  const opts = k.pollKeys.map((label, n) => `<button class="poll__opt" type="button" data-poll="draft" data-value="${n}"><span class="poll__key">${String.fromCharCode(65 + n)}</span><span>${esc(label)}</span><b data-poll-n>0</b></button>`).join("");
  const question = esc(k.poll).replace(/\?$/, "<em>?</em>");
  return `${head(k.label, em(k.title))}
<div class="stage draft">
<article class="mail surface surface--strong"${s(0, { fx: "fly", win: "0,.35" })} style="--dy:80px;--s:.95">
<p class="mail__head">${ico("file")}<b>draft-reply.md</b><span class="pill pill--quiet">${ico("envelope")}Ms Keller</span></p>
<ol class="claims">${lines}</ol>
</article>
<div class="poll draft__poll"${s(2, { fx: "fly", win: ".1,.8" })} style="--dx:160px;--s:.96"><p class="poll__q">${ico("hand")}<span>${question}</span></p>${opts}</div>
</div>
${foot(c, 6)}`;
}

/** Slide 07: today. The question of the hour, the route in four stops, and who does what: Tim clicks in Claude, the room predicts and checks, the kit goes home. */
function today(d, c) {
  const k = c.today;
  const STOP_ICON = ["folder", "policy", "spark", "envelope"];
  const stops = k.stops
    .map((stop, i) => `<li class="road__stop"${s(1, { fx: "pop", win: stagger(i, 4, 0.3, 0.05, 1) })} style="--origin:17px 17px"><b class="road__n">${i + 1}</b><p class="road__name"><span class="ico-tile${i === 2 ? " ico-tile--accent" : ""}">${ico(STOP_ICON[i])}</span><b>${esc(stop.name)}</b></p><p class="road__sub">${esc(stop.sub)}</p></li>`)
    .join("");
  // Card 1 teaches the strip every Claude slide carries: the four clicks light one by one.
  const at = (i) => `${r3(0.42 + i * 0.14)},${r3(0.52 + i * 0.14)}`;
  const strip = k.timSteps
    .map((label, i) => {
      const body = `<b class="tsteps__n">${i + 1}</b><span>${esc(label)}</span>`;
      const off = i < k.timSteps.length - 1 ? { out: 2, outWin: at(i + 1) } : {};
      return `<li>${body}<i class="tsteps__on" aria-hidden="true"${s(2, { fx: "fade", win: at(i), ...off })}>${body}</i>${i < k.timSteps.length - 1 ? `<i class="tsteps__done" aria-hidden="true"${s(2, { fx: "pop", win: at(i + 1) })}>${ico("check", "ico--bold")}</i>` : ""}</li>`;
    })
    .join("");
  const loop = k.loop.map((node, i) => `<li class="loop__node${i === 1 ? " loop__node--claude" : ""}">${ico(["hand", "spark", "search"][i])}${esc(node)}</li>`).join("");
  const loopArt = `<svg class="loop__art" viewBox="0 0 360 240" aria-hidden="true"><path${s(3, { fx: "draw", win: ".3,.5" })} pathLength="1" d="M120 58 V 86 M112 78 L120 86 L128 78"/><path${s(3, { fx: "draw", win: ".45,.65" })} pathLength="1" d="M120 150 V 178 M112 170 L120 178 L128 170"/><path${s(3, { fx: "draw", win: ".6,.85" })} pathLength="1" d="M262 212 C 350 212, 350 28, 262 28 M274 20 L262 28 L274 36"/></svg>`;
  const kitFiles = k.kitFiles
    .map((name, i) => `<div class="role__file" style="--dx:-40px;--dy:30px;--s:.9"${s(3, { fx: "fly", win: stagger(i, 3, 0.35, 0.55, 1) })}>${file(name, name.endsWith("/") ? esc(k.kitCount) : "", i === 1 ? { cls: "file--accent" } : {})}</div>`)
    .join("");
  const where = `<p class="today__where"${s(0, { fx: "fade", win: ".45,.9" })}>${ico("pin")}<span>${esc(k.where)}</span></p>`;
  return `${head(k.label, em(k.title), { attrs: s(0, { fx: "blur", win: "0,.6" }), after: where })}
<div class="stage today">
<div class="road"><i class="road__track" aria-hidden="true"></i><i class="road__fill" aria-hidden="true"${s(1, { fx: "line", win: "0,.8" })}></i><ol class="road__stops">${stops}</ol></div>
<p class="label today__how"${s(2, { fx: "fade", win: "0,.25" })}>${esc(k.how)}</p>
<div class="roles">
<section class="role surface surface--strong"${s(2, { fx: "fly", win: "0,.4" })} style="--dx:120px;--s:.95"><p class="now now--live role__pill"${s(2, { fx: "pop", win: ".25,.45" })}>${ico("spark")}${esc(c.live)}</p><h3 class="role__t">${esc(k.tim)}</h3><ol class="tsteps tsteps--col" aria-label="${esc(c.stepsLabel)}">${strip}</ol><p class="role__note"${s(2, { fx: "fade", win: ".85,1" })}>${esc(k.timNote)}</p></section>
<section class="role surface surface--strong"${s(3, { fx: "fly", win: "0,.4" })} style="--dy:60px;--s:.95"><span class="ico-tile role__tile">${ico("hand")}</span><h3 class="role__t">${esc(k.room)}</h3><div class="loop"><ol class="loop__nodes">${loop}</ol>${loopArt}</div></section>
<section class="role surface surface--strong"${s(3, { fx: "pop", win: ".35,.75" })}><span class="ico-tile role__tile">${ico("download")}</span><h3 class="role__t">${esc(k.kit)}</h3><div class="kit-folder role__kit"><p class="kit-folder__head">${ico("folder")}${esc(c.project.kit)}</p>${kitFiles}</div></section>
</div>
</div>
${foot(c, 7)}`;
}

/** Slide 08: the folder opens and deals eleven files; eight wires by file name, then the wires turn dashed. */
function folder(d, c) {
  const k = c.folder;
  const RY = (i) => i * 78;
  const FY = (j) => j * 57;
  const RX = 330, FX = 1080, FW = 616;
  const FOLD = [720, 236]; // the folder's centre: every file leaves from here
  const reqs = d.items
    .map((item, i) => `<div class="fr" style="top:${RY(i)}px;--dx:-60px"${s(0, { fx: "move", win: stagger(i, 8, 0.4, 0, 0.6) })}><span class="ico-tile">${ico(ITEM_ICON[item.id])}</span><b>${item.id}</b><span>${esc(c.short[item.id])}</span></div>`)
    .join("");
  const matched = new Set(d.mission2.map((row) => row.naive));
  const files = d.files
    .map((name, j) => `<div class="ff${matched.has(name) ? "" : " ff--none"}" style="top:${FY(j)}px;--dx:${FOLD[0] - (FX + FW / 2)}px;--dy:${FOLD[1] - (FY(j) + 25)}px;--s:.6;--r:${j % 2 ? 8 : -8}deg"${s(0, { fx: "fly", win: stagger(j, 11, 0.42, 0.3, 1) })}>${file(name)}${matched.has(name) ? "" : `<i class="ff__dim"${s(1, { fx: "fade", win: ".5,1" })}></i>`}</div>`)
    .join("");
  const wire = (i, dashed) => {
    const j = d.files.indexOf(d.mission2[i].naive);
    const y1 = RY(i) + 31, y2 = FY(j) + 25;
    const motion = dashed ? s(2, { fx: "fade", win: stagger(i, 8, 0.3, 0, 0.6) }) : s(1, { fx: "draw", win: stagger(i, 8, 0.4, 0, 0.8), out: 2, outWin: "0,.5" });
    return `<path${dashed ? ' class="wire--dash"' : ""}${motion} pathLength="1" d="M${RX} ${y1} C ${RX + 300} ${y1}, ${FX - 300} ${y2}, ${FX - 8} ${y2}"/>`;
  };
  const wires = d.items.map((_, i) => wire(i, false) + wire(i, true)).join("");
  const folderArt = `<svg class="fd" aria-hidden="true" viewBox="0 0 320 240"><path class="fd__back" d="M20 44 Q20 28 36 28 H118 Q126 28 132 34 L146 48 H284 Q300 48 300 64 V204 Q300 220 284 220 H36 Q20 220 20 204 Z"/><rect class="fd__paper" x="54" y="58" width="212" height="132" rx="10" transform="rotate(-5 160 124)"/><rect class="fd__paper" x="56" y="62" width="212" height="132" rx="10" transform="rotate(4 160 128)"/><g class="fd__lid"${s(0, { fx: "none", win: ".1,.38", keep: true })}><path d="M16 96 Q16 82 30 82 H290 Q304 82 302 96 L292 206 Q290 220 276 220 H44 Q30 220 28 206 Z"/></g></svg>`;
  const hits = `<p class="fold__hits"${s(1, { fx: "pop", win: ".55,.9" })}><b class="fold__n"><span${s(1, { fx: "none", win: ".55,1", count: "0,8,0", keep: true })}>8</span><i${s(2, { fx: "strike", win: ".05,.4" })}></i></b><span class="pill">${esc(k.hits)}</span></p>`;
  return `${head(k.label, em(k.title), { after: hits })}
<div class="stage fold">
<div class="fold__src"${s(0, { fx: "pop", win: "0,.25", out: 1, outWin: "0,.4" })}>${folderArt}<span class="pill">${esc(k.dir)} · ${esc(k.count)}</span></div>
<svg class="wires" viewBox="0 0 1696 790" preserveAspectRatio="none" aria-hidden="true">${wires}</svg>
${reqs}
${files}
<p class="fold__twist surface surface--strong surface--lift"${s(2, { fx: "fly", win: ".3,.9" })} style="--dy:60px;--s:.9">${em(k.twist)}</p>
</div>
${foot(c, 8)}`;
}

/** Slide 09: four gates. One invented file per press fails one gate; then the rule as one file card. */
function tests(d, c) {
  const k = c.four;
  const GW = (STAGE_W - 3 * 32) / 4;
  const gates = TESTS.map((test, i) => {
    const card = k.cards[i];
    const text = esc(card.text).replace(esc(card.mark), `<mark>${esc(card.mark)}<i${s(i + 1, { fx: "strike", win: ".55,.8" })}></i></mark>`);
    const dots = TESTS.map((t, n) => tdot(n < i ? "pass" : n === i ? "fail" : "skip", c.tests[t], s(i + 1, { fx: "pop", win: `${r3(0.3 + n * 0.08)},${r3(0.45 + n * 0.08)}` }))).join("");
    return `<li class="gate">
<div class="gate__tile surface"${s(0, { fx: "pop", win: stagger(i, 4, 0.45) })}><span class="ico-tile gate__ico">${ico(TEST_ICON[test])}</span><b>${esc(c.tests[test])}</b><span>${esc(fill(k.hints[test], { window: dot(d.windowStart) }))}</span><i class="gate__hit"${s(i + 1, { fx: "glow", win: ".45,.7", out: i + 2, outWin: "0,.4" })}></i></div>
<div class="tcard surface surface--strong"${s(i + 1, { fx: "arc", win: "0,.5" })}${arcStyle(-(i * (GW + 32) + GW), -40, 90, 0.85)}>
<p class="tcard__file">${ico("file")}<span>${esc(card.name)}</span><span class="tcard__dots">${dots}</span></p>
<p class="tcard__text">${text}</p>
<p class="tcard__why"${s(i + 1, { fx: "pop", win: ".75,1" })} style="--origin:left center">${ico("cross", "ico--bold")}${esc(card.verdict)}</p>
</div>
</li>`;
  }).join("");
  const status = ["covered", "weak", "gap"]
    .map((st, i) => `<p class="four__st"${s(5, { fx: "pop", win: stagger(i, 3, 0.4, 0, 0.6) })}>${chip(st, c, "chip--lg")}<span>${esc(k.cues[st])}</span></p>`)
    .join("");
  // The rule as the file it lives in: one line shows, the rest opens on hover or focus (the full text stays in the page).
  const rule = `<div class="four__file" tabindex="0"${s(5, { fx: "fly", win: ".35,.9" })} style="--dy:40px;--s:.97"><p class="four__fhead">${ico("policy")}<b>${esc(k.toolHead)}</b><span class="four__more">${ico("plus")}</span></p>
<div class="four__ftext"><p class="four__fline">${esc(k.tool[2])}</p><p class="objective">${esc(k.objective)}</p><p>${esc(k.tool[1])}</p></div></div>`;
  return `${head(k.label, em(k.title))}
<div class="stage four">
<ol class="gates">${gates}</ol>
<div class="four__status">${status}</div>
${rule}
</div>
${foot(c, 9, k.source)}`;
}

/* Project slide geometry, in stage pixels: the kit rows (centres) on the left, the knowledge slots and the
   instructions label inside the Claude window. The flying chips live in one layer over the whole stage,
   so nothing clips them; they land exactly on the slots. */
const PJ = {
  row: (r) => [235, 112 + r * 86],
  slot: (i) => [1031 + (i % 2) * 415, Math.round(400 + Math.floor(i / 2) * 41.6)],
  slotW: 404,
  src: [1640, 126],
};

/** Slide 10: set up the Project. The rules fly from the kit into Instructions, twelve files leave the folder for knowledge, code execution on. */
function project(d, c) {
  const k = c.project;
  const [dirN, ...dirRest] = k.dirCount.split(" ");
  const dirMeta = `<b class="kit-count"${s(2, { fx: "none", win: ".05,.95", count: `${dirN},0,0`, keep: true })}>${dirN}</b> ${esc(dirRest.join(" "))}`;
  const kitRows = [
    file(k.start, ""),
    file(k.instructions, "", { cls: "file--accent" }),
    file(k.request, "", { after: `<i class="kit-glow"${s(2, { fx: "glow", win: "0,.2", out: 3, outWin: "0,.3" })}></i>` }),
    file(k.dir, dirMeta, { after: `<i class="kit-glow"${s(2, { fx: "glow", win: "0,.2", out: 3, outWin: "0,.3" })}></i>` }),
  ].join("");
  const names = [k.request, ...d.files];
  const slots = names.map((name) => `<span class="pfile">${cwFile(extOf(name), name, "")}</span>`).join("");
  const flyers = names
    .map((name, i) => {
      const [x, y] = PJ.slot(i);
      const [fx, fy] = PJ.row(i === 0 ? 2 : 3);
      return `<span class="pj-fly" style="left:${x - PJ.slotW / 2}px;top:${y - 17}px;width:${PJ.slotW}px;--dx:${fx - x}px;--dy:${fy - y}px;--lift:${80 + (i % 3) * 40}px;--s:.7"${s(2, { fx: "arc", win: stagger(i, 12, 0.34, 0.06, 0.96) })}>${cwFile(extOf(name), name, "")}</span>`;
    })
    .join("");
  const [ix, iy] = PJ.row(1);
  const source = `<span class="pj-fly pj-fly--src" style="left:${PJ.src[0]}px;top:${PJ.src[1]}px;--dx:${ix - PJ.src[0]}px;--dy:${iy - PJ.src[1]}px;--lift:90px;--s:1.25"${s(1, { fx: "arc", win: "0,.4" })}>${ico("file")}${esc(fill(k.from, { file: k.instructions }))}</span>`;
  const rules = d.instructionLines.map((line, i) => `<p${s(1, { fx: "type", ease: "linear", win: stagger(i, d.instructionLines.length, 0.28, 0.42, 1) })}>${esc(line)}</p>`).join("");
  const side = cwSide(c, { motion: { proj: s(0, { fx: "pop", win: ".35,.8" }), projGlow: s(0, { fx: "glow", win: ".6,1", out: 1, outWin: "0,.3" }), instr: s(1, { fx: "pop", win: ".35,.6" }), know: s(2, { fx: "pop", win: ".9,1" }), code: s(3, { fx: "none", win: ".1,.4" }) } });
  const main = `<div class="cw-main"><div class="cw-thread pj">
<p class="pj__head">${ico("folder")}<b>${esc(k.project)}</b></p>
<div class="pj__box"><p class="pj__label">${esc(k.instructionsHead)}</p><div class="pj__text">${rules}</div></div>
<div class="pj__box"><p class="pj__label">${esc(k.knowledgeHead)}</p><div class="pj__files">${slots}</div></div>
</div>${cwComposer()}</div>`;
  const strip = tsteps(c, k.label, [
    [k.steps[0], [0, "0,.3"], [1, "0,.3"]],
    [k.steps[1], [1, "0,.3"], [2, "0,.3"]],
    [k.steps[2], [2, "0,.3"], [3, "0,.3"]],
    [k.steps[3], [3, "0,.3"]],
  ], [4, "0,.3"]);
  return `${head(k.label, em(k.title), { steps: strip, after: live(c) })}
<div class="stage proj">
<div class="proj__left">
<div class="kit-folder"${s(0, { fx: "fly", win: "0,.5" })} style="--dx:-80px;--s:.9"><p class="kit-folder__head">${ico("folder")}${esc(k.kit)}</p>${kitRows}</div>
${job(k.job, `${s(2, { fx: "pop", win: ".85,1", out: 4, outWin: "0,.3" })} style="--origin:left center"`)}
<figure class="qr proj__qr"${s(4, { fx: "pop", win: "0,.6" })}><img src="./assets/${c.qr.kit}" width="200" height="200" alt="" /><figcaption>${esc(k.qr)}</figcaption></figure>
</div>
<div class="cw proj__cw"${s(0, { fx: "fly", win: ".1,.6" })} style="--dx:120px;--s:.96">${cwBar([k.project])}<div class="cw-body">${side}${main}</div></div>
<div class="pj-layer" aria-hidden="true">${source}${flyers}</div>
</div>
${foot(c, 10)}`;
}

/** Slide 11: Step 1. The room predicts, Tim sends prompt 1, Claude builds the index: 8 of 11 hold. */
function mission1(d, c) {
  const k = c.m1;
  const values = ["11", "10", "9", "8", "7"];
  const opts = ["11", "10", "9", "8", "≤ 7"].map((label, i) => `<button class="poll__opt" type="button" data-poll="m1" data-value="${values[i]}"><span class="poll__key">${String.fromCharCode(65 + i)}</span><span>${esc(label)}</span><b data-poll-n>0</b>${values[i] === String(d.passing) ? `<i class="poll__ring"${s(4, { fx: "pop", win: ".1,.5" })}></i>` : ""}</button>`).join("");
  const rows = d.index
    .map((row, i) => {
      const fail = !(row.dateOk && row.approvalOk);
      const mark = (ok) => `<td class="${ok ? "ok" : "no"}">${ico(ok ? "check" : "cross", "ico--bold")}</td>`;
      return `<tr${fail ? " data-mark" : ""}${s(3, { fx: "fade", win: stagger(i, 11, 0.3, 0.05, 0.9) })}><td class="fn">${esc(row.file)}</td><td>${esc(c.types[row.type])}</td>${mark(row.dateOk)}${mark(row.approvalOk)}</tr>`;
    })
    .join("");
  const thread = `<div class="cw-thread">
${prompt(c, 1, d.prompts.m1, s(1, { fx: "fly", win: "0,.5" }), 3)}
${activity([
    act("check", `Read <code>12 files</code>`, 2, ".1,.4"),
    act("check", `Ran code <code>index.py</code>`, 2, ".35,.65"),
    act("file", `Wrote <code>${esc(k.wrote)}</code>`, 2, ".6,.9"),
  ], "3 steps", s(2, { fx: "fade", win: "0,.2", out: 3, outWin: "0,.25" }))}
<div class="cw-answer"${s(3, { fx: "blur", win: "0,.4" })}><p>${esc(k.answer)}</p>
<table class="cw-table m1__table"><thead><tr>${k.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>
</div>`;
  const strip = tsteps(c, k.label, [
    [k.steps[0], [0, "0,.3"], [1, "0,.3"]],
    [k.steps[1], [1, "0,.3"], [2, "0,.3"]],
    [k.steps[2], [2, "0,.3"], [3, "0,.3"]],
    [k.steps[3], [3, "0,.3"]],
  ], [4, "0,.3"]);
  return `${head(k.label, em(k.title), { steps: strip, after: live(c) })}
<div class="stage m1">
<div class="m1__left">
<div class="poll"${s(0, { fx: "fly", win: "0,.6" })} style="--dy:60px;--s:.96"><p class="poll__q">${ico("hand")}${esc(k.poll)}</p>${opts}</div>
${job(k.job, `${s(3, { fx: "pop", win: ".6,1" })} style="--origin:left center"`)}
<div class="stat stat--accent m1__stat"${s(4, { fx: "pop", win: "0,.4" })} style="--origin:left center"><p class="stat__n"><b class="m1__eight"${s(4, { fx: "arc", win: ".1,.7" })}${arcStyle(860, -440, 120, 0.3)}>${d.passing}</b><small>/ ${d.index.length}</small></p><span class="stat__l">${esc(k.result)}</span></div>
</div>
<div class="cw m1__cw"${s(0, { fx: "fly", win: ".1,.6" })} style="--dx:100px;--s:.97">${cwBar([c.project.project, k.chat])}<div class="cw-body">${cwSide(c, { knowOn: true })}<div class="cw-main">${thread}${cwComposer()}</div></div></div>
</div>
${foot(c, 11)}`;
}

/* Step 2 geometry, in stage pixels: the status chip of row i and the counter of each status in the tally.
   A dot flies from each chip into its counter as the chip pops. */
const M2 = {
  chip: (i) => [1190, [226, 288, 373, 436, 498, 561, 624, 686][i]],
  count: { covered: [1628, 387], weak: [1628, 465], gap: [1628, 543] },
};

/** Slide 12: Step 2. The reality run inside Claude: per item a line runs from the file to its quoted line, through the four tests, to the status; the tally counts along. */
function mission2(d, c) {
  const k = c.m2;
  const t = d.training;
  const approved = c.lang === "de" ? dot(d.systemApproved) : fmtDate(d.systemApproved, c);
  const vars = { days: d.r3Days, hours: num(d.notice.hours, c), share: num(t.share, c), approved, needed: t.needed, missing: t.missing };
  const press = (i) => (i < 4 ? 1 : 2);
  const rows = d.mission2
    .map((row, i) => {
      const item = d.items[i];
      const a = (i % 4) * 0.22;
      const w = (from, to) => `${r3(Math.min(1, a + from))},${r3(Math.min(1, a + to))}`;
      const failAt = row.failsAt ? TESTS.indexOf(row.failsAt) : 4;
      const dots = TESTS.map((test, n) => tdot(n < failAt ? "pass" : n === failAt ? "fail" : "skip", c.tests[test], s(press(i), { fx: "pop", win: w(0.1 + n * 0.025, 0.16 + n * 0.025) }))).join("");
      const why = k.why[item.id] ? `<span class="lk-why${row.status === "gap" ? " lk-why--gap" : ""}"${s(press(i), { fx: "fade", win: w(0.16, 0.24) })}>${item.id === "R5" ? ico("code") : ""}${esc(fill(k.why[item.id], vars))}</span>` : "";
      return `<li class="lk-row" data-item="${item.id}" data-status="${row.status}" data-fails-at="${row.failsAt ?? ""}"${s(0, { fx: "fade", win: stagger(i, 8, 0.3, 0.45, 1) })}>
<i class="lk-wire"${s(press(i), { fx: "line", win: w(0.02, 0.18) })}></i>
<span class="lk-req"><span class="ico-tile">${ico(ITEM_ICON[item.id])}</span><b>${item.id}</b></span>
<span class="lk-file"><span class="fname">${esc(row.naive)}</span></span>
<span class="lk-mid"><span class="lk-q"${s(press(i), { fx: "type", ease: "linear", win: w(0.04, 0.12) })}><span class="q" data-file="folder/${esc(row.naive)}">${esc(row.rowQuote)}</span></span>${why}</span>
<span class="lk-tests">${dots}</span>
<span class="lk-chip"${s(press(i), { fx: "pop", win: w(0.18, 0.26) })}>${chip(row.status, c)}</span>
</li>`;
    })
    .join("");
  // R7 inside the same Claude window: the follow-up, then Claude's answer with the three files as citations.
  const cands = [
    // failed: the tests each file fails for R7, as the demo's model computes them (workshops-audit-deck.test.ts).
    { key: "policy", file: "infosec-policy_v3_FINAL.md", quote: d.quotes.policyBackup, failed: ["quote", "date"] },
    { key: "notes", file: "it-notes_2026-10-06.md", quote: d.quotes.notesBackup, failed: ["quote", "approval"] },
    { key: "report", file: "backup-report_2026-10.txt", quote: d.quotes.reportRestore, failed: ["quote"] },
  ];
  let struck = 0;
  const candHtml = cands
    .map((cand, i) => `<li class="cand${cand.key === "report" ? " cand--record" : ""}" data-file="${cand.file}" data-failed="${cand.failed.join(" ")}"${s(5, { fx: "fly", win: stagger(i, 3, 0.3, 0.3, 0.7) })} style="--dy:50px;--s:.94">
<p class="cand__file">${cwFile(extOf(cand.file), cand.file, "")}</p>
<p class="cand__q"><span class="q" data-file="folder/${cand.file}">${esc(cand.quote)}</span></p>
<p class="cand__tests">${TESTS.map((test) => (cand.failed.includes(test) ? `<span class="tchip tchip--fail">${ico("cross", "ico--bold")}${esc(c.tests[test])}<i${s(5, { fx: "strike", win: `${r3(0.68 + struck * 0.05)},${r3(0.74 + struck++ * 0.05)}` })}></i></span>` : `<span class="tchip">${ico("check", "ico--bold")}${esc(c.tests[test])}</span>`)).join("")}</p>
<p class="cand__why">${ico("cross", "ico--bold")}${esc(k.r7Reasons[cand.key])}</p>
</li>`)
    .join("");
  const upTo = (n) => d.mission2.slice(0, n).reduce((acc, row) => ({ ...acc, [row.status]: acc[row.status] + 1 }), { covered: 0, weak: 0, gap: 0 });
  const [after1, after2] = [upTo(4), upTo(8)];
  const tally = ["covered", "weak", "gap"]
    .map((st) => {
      const [tx, ty] = M2.count[st];
      const flyers = d.mission2
        .map((row, i) => {
          if (row.status !== st) return "";
          const a = (i % 4) * 0.22;
          const [cx, cy] = M2.chip(i);
          return `<i class="tfly" style="--dx:${cx - tx}px;--dy:${cy - ty}px;--lift:70px;--s:1.4"${s(press(i), { fx: "arc", win: `${r3(a + 0.2)},${r3(Math.min(1, a + 0.36))}` })}></i>`;
        })
        .join("");
      return `<span>${chip(st, c, "chip--lg")}<b${s(0, { fx: "none", win: ".25,1", count: `0,${d.tally[st]},0`, keep: true })} data-count-at="1:${after1[st]},2:${after2[st]}">${d.tally[st]}</b>${flyers}</span>`;
    })
    .join("");
  const thread = `<div class="cw-thread m2__thread">
${prompt(c, 2, d.prompts.m2, s(0, { fx: "fly", win: "0,.4" }), 1)}
${activity([
    act("check", `Read <code>12 files</code>`, 1, "0,.12"),
    act("check", `Ran code <code>quotes.py</code>`, 1, ".06,.2"),
    act("check", `Ran code <code>training.py</code>`, 2, "0,.2"),
  ], "3 steps", s(0, { fx: "fade", win: ".3,.45" }))}
<div class="cw-answer m2__run" data-links="run"><p class="m2__cols"${s(0, { fx: "fade", win: ".45,.6" })}><span></span>${k.cols.map((h) => `<span>${esc(h)}</span>`).join("")}</p><ol class="lk-rows">${rows}</ol></div>
</div>`;
  const r7opts = k.r7keys.map((label, i) => `<button class="poll__opt" type="button" data-poll="r7" data-value="${i ? "no" : "yes"}"><span class="poll__key">${String.fromCharCode(65 + i)}</span><span>${esc(label)}</span><b data-poll-n>0</b></button>`).join("");
  const r7 = `<div class="m2__r7"${s(4, { fx: "fly", win: "0,.4" })} style="--dy:120px;--s:.96">
<div class="cw m2__r7cw">${cwBar([c.project.project, k.chat, "R7"])}<div class="cw-body cw-body--nosidebar"><div class="cw-main"><div class="cw-thread m2__r7thread">
${prompt(c, "2b", d.prompts.m2follow, " data-short", 2)}
<div class="poll m2__r7poll"${s(4, { fx: "pop", win: ".35,.75", out: 5, outWin: "0,.2" })} style="--origin:left top"><p class="poll__q">${ico("hand")}${esc(k.r7poll)}</p><div class="m2__r7opts">${r7opts}</div></div>
<div class="cw-answer m2__r7ans"${s(5, { fx: "fade", win: ".22,.4" })}><p class="m2__r7head"><span class="ico-tile ico-tile--accent">${ico("backup")}</span><b>${esc(k.r7Head)}</b></p><ol class="cands">${candHtml}</ol></div>
</div>${cwComposer()}</div></div></div>
<p class="moral m2__moral"${s(5, { fx: "fade", win: ".8,1" })}>${em(k.moral)}</p>
</div>`;
  const strip = tsteps(c, k.label, [
    [k.steps[0], [0, "0,.25"], [0, ".3,.45"]],
    [k.steps[1], [0, ".3,.45"], [2, "0,.3"]],
    [k.steps[2], [2, "0,.3"], [4, "0,.3"]],
    [k.steps[3], [4, "0,.3"]],
  ], [5, "0,.3"]);
  return `${head(k.label, em(k.title), { steps: strip, after: live(c) })}
<div class="stage m2">
<div class="cw m2__cw"${s(0, { fx: "fly", win: "0,.4", out: 4, outWin: "0,.35" })} style="--dx:100px;--s:.97">${cwBar([c.project.project, k.chat])}<div class="cw-body cw-body--nosidebar"><div class="cw-main">${thread}</div></div></div>
<div class="m2__side">
<div class="m2__code"${s(2, { fx: "pop", win: ".3,.6" })} style="--origin:left center"><p class="m2__codehead">${ico("code")}<b>Ran code</b><code>training.py</code></p>
<p class="m2__frac"><b>${t.unique}</b><span>/ ${t.staff}</span></p>
<p class="m2__share"><b${s(2, { fx: "none", win: ".4,.9", count: `0,${t.share},1` })}>${num(t.share, c)}</b><span>%</span></p>
<p class="m2__need"><span class="m2__lt">&lt; ${Math.round(t.target * 100)} %</span><span>${esc(fill(k.need, vars))}</span></p></div>
<p class="tally" data-tally${s(0, { fx: "fade", win: ".6,1" })}>${tally}<i class="tally__glow"${s(3, { fx: "glow", win: "0,.5" })}></i></p>
${job(k.job, `${s(1, { fx: "pop", win: ".7,1" })} style="--origin:left center"`)}
</div>
${r7}
</div>
${foot(c, 12)}`;
}

/** A rule line as the card shows it: `tail` keeps the clause after the semicolon (word for word); quotes in the edition's marks. */
function ruleText(line, card, c) {
  const part = card.tail ? line.slice(line.indexOf("; ") + 2) : line;
  const text = part[0].toUpperCase() + part.slice(1);
  return text.replace(/"([^"]+)"/g, c.lang === "de" ? "„$1“" : "“$1”");
}

/** Slide 13: four lines Claude likes to write here, each with the status it wrongly claims. Each gets struck; its lower half turns over to the rule that stops it. */
function mistakes(d, c) {
  const k = c.mistakes;
  const cards = k.cards
    .map((card, i) => {
      const strike = (html) => `<span class="mc__strike"${s(i + 1, { fx: "none", win: ".05,.42", keep: true })}>${html}</span>`;
      const line = card.quote
        ? `<span class="mc__line mc__line--q">${strike(`<span class="q" data-file="folder/infosec-policy_v3_FINAL.md">${esc(card.quote)}</span>`)}</span>`
        : `<span class="mc__line${/^\S+\.\w+$/.test(card.wrong) ? " mc__line--file" : ""}">${strike(esc(card.wrong))}</span>`;
      const claim = `${card.chip ? chip(card.chip, c, "chip--lg") : ""}${card.tag ? `<span class="mc__tag">${esc(card.tag)}</span>` : ""}`;
      return `<li class="mc"${s(0, { fx: "pop", win: stagger(i, 4, 0.5) })}>
<div class="mc__top"><p class="mc__who">${ico("chat")}${esc(k.claude)}<span class="mc__item"><span class="ico-tile">${ico(ITEM_ICON[card.item])}</span><b>${card.item}</b></span></p>
<div class="mc__wrong"><div class="mc__dim"${s(i + 1, { fx: "dim", win: ".3,.6" })}>${line}<p class="mc__claim">${claim}</p></div>
<span class="mc__bad"${s(i + 1, { fx: "pop", win: ".3,.55" })}>${ico("cross", "ico--bold")}</span></div></div>
<div class="mc__flip"${s(i + 1, { fx: "flip", win: ".35,.95" })}><div class="face mc__front"><span class="ico-tile">${ico("policy")}</span><b>${esc(k.which)}</b></div><div class="face face--back mc__back"><p class="mc__rule">${esc(fill(k.rule, { n: card.rule }))}</p><p class="mc__text">${esc(ruleText(d.ruleLines[card.rule], card, c))}</p><p class="mc__src">${ico("policy")}${esc(k.file)}</p></div></div>
</li>`;
    })
    .join("");
  return `${head(k.label, em(k.title))}
<div class="stage mist"><ol class="mcards">${cards}</ol></div>
${foot(c, 13)}`;
}

/** Slide 14: Step 3. The room picks R5's owner; prompt 3 goes out; six cards leave the pile for three roles; R3's 295 days; the R7 email. */
function gaps(d, c) {
  const k = c.gaps;
  const due = esc(fill(k.due, { due: dot(d.due) }));
  const open = d.mission2.filter((row) => row.status !== "covered");
  const cols = ["it", "hr", "md"];
  const COL_W = (STAGE_W - 568 - 48) / 3;
  const PILE = [260, 300];
  const perCol = { it: 0, hr: 0, md: 0 };
  const cards = {};
  open.forEach((row, n) => {
    const owner = OWNER_OF[row.id];
    const r = perCol[owner]++;
    const x = 568 + cols.indexOf(owner) * (COL_W + 24) + 18 + 160, y = 118 + r * 128 + 50;
    const off = Math.min(n, 2); // the pile shows three edges at most
    const top = n === open.length - 1;
    cards[owner] = (cards[owner] ?? "") + `<li class="task${row.id === "R3" ? " task--r3" : ""}${top ? " task--top" : ""}"${s(1, { fx: "travel", win: stagger(n, open.length, 0.36, 0.42, 1) })}${arcStyle(PILE[0] - x + off * 8, PILE[1] - y - off * 12, 110, 0.82)}><p class="task__id"><span class="ico-tile">${ico(ITEM_ICON[row.id])}</span><b>${row.id}</b>${chip(row.status, c)}</p><p class="task__t">${esc(k.closes[row.id])}</p>${row.id === "R3" ? `<i class="task__glow"${s(2, { fx: "glow", win: "0,.4", out: 3, outWin: "0,.3" })}></i>` : ""}${row.id === "R7" ? `<i class="task__glow"${s(3, { fx: "glow", win: ".15,.5" })}></i>` : ""}${row.id === "R5" ? `<i class="task__glow"${s(1, { fx: "glow", win: ".88,1", out: 2, outWin: "0,.3" })}></i>` : ""}</li>`;
  });
  const columns = cols
    .map((owner, i) => `<section class="col surface"${s(0, { fx: "fade", win: stagger(i, 3, 0.5) })}><p class="col__head">${ico(owner === "md" ? "bank" : "user")}<b>${esc(k.owners[owner])}</b></p><p class="pill pill--quiet col__due">${ico("calendar")}${due}</p><ol class="col__tasks">${cards[owner] ?? ""}</ol></section>`)
    .join("");
  // The R7 email up to "what we have"; only the item, the date it is due and the file are marked.
  const MARK = new Set([2, 4, 5]);
  // keep the "what we have" line so the backup file is visible, cut before the failure line
  const file = d.emailExcerpt.findIndex((seg) => seg.value?.startsWith("backup-report"));
  const cut = d.emailExcerpt.findIndex((seg, i) => i > file && seg.text !== undefined && seg.text.includes("\n"));
  const segs = [...d.emailExcerpt.slice(0, cut), { text: d.emailExcerpt[cut].text.split("\n")[0] }];
  let si = 0;
  let nslot = 0;
  const mail = segs
    .map((seg) => {
      if (!seg.slot) return esc(seg.text).replace(/\n/g, "<br>");
      const n = nslot++;
      return MARK.has(n) ? `<span class="slot"${s(3, { fx: "pop", win: stagger(si++, MARK.size, 0.25, 0.5, 0.95) })}>${esc(seg.value)}</span>` : esc(seg.value);
    })
    .join("");
  const thread = `<div class="cw-thread">
<div class="cw-files"${s(1, { fx: "fly", win: ".05,.3" })} style="--dx:-40px;--dy:40px;--s:.9">${cwFile("md", c.lang === "de" ? "luecken-anfrage.md" : "gap-request.md", "")}${cwFile("md", "draft-reply.md", "")}</div>
${prompt(c, 3, d.prompts.m3, s(1, { fx: "fly", win: ".3,.5" }), 1)}
<div class="cw-answer gaps__mail"${s(3, { fx: "fade", win: ".35,.5" })}><p class="gaps__to">${ico("envelope")}<b>${esc(k.mailTo)}</b><span>R7</span></p><p class="gaps__body">${mail}</p><p class="gaps__fail"${s(3, { fx: "pop", win: ".85,1" })} style="--origin:left center">${ico("cross", "ico--bold")}${esc(k.fails)}</p></div>
</div>`;
  const owners = cols.map((owner, i) => `<button class="poll__opt" type="button" data-poll="owner" data-value="${owner}"><span class="poll__key">${String.fromCharCode(65 + i)}</span><span>${esc(k.owners[owner])}</span><b data-poll-n>0</b></button>`).join("");
  const strip = tsteps(c, k.label, [
    [k.steps[0], [0, "0,.3"], [1, "0,.2"]],
    [k.steps[1], [1, "0,.2"], [1, ".3,.45"]],
    [k.steps[2], [1, ".3,.45"], [3, "0,.3"]],
    [k.steps[3], [3, "0,.3"]],
  ]);
  return `${head(k.label, em(k.title), { steps: strip, after: live(c) })}
<div class="stage gaps">
<div class="gaps__left">
<p class="pile"${s(0, { fx: "pop", win: "0,.4", out: 1, outWin: "0,.25" })}><b class="pile__n">${open.length}</b><span>${esc(k.pile.replace(/^\d+\s*/, ""))}</span></p>
<div class="days surface surface--strong"${s(2, { fx: "fly", win: ".1,.6" })} style="--dx:420px;--s:.8"><p class="days__head"><span class="ico-tile ico-tile--accent">${ico("spark")}</span><b>R3</b><span>${esc(k.days)}</span></p><p class="days__n"><b${s(2, { fx: "none", win: ".3,1", count: `0,${d.r3Days},0` })}>${d.r3Days}</b></p><p class="days__bar"><i${s(2, { fx: "line", win: ".3,1" })}></i></p><p class="days__ends"><span>${esc(k.from)}</span><span>${esc(k.to)}</span></p></div>
<div class="poll gaps__poll"${s(0, { fx: "fly", win: ".3,.8", out: 1, outWin: "0,.2" })} style="--dy:60px;--s:.96"><p class="poll__q">${ico("hand")}${esc(k.poll)}</p>${owners}</div>
<div class="cw gaps__cw"${s(1, { fx: "fly", win: ".05,.35" })} style="--dy:80px;--s:.95">${cwBar([c.project.project, k.chat])}<div class="cw-body cw-body--nosidebar"><div class="cw-main">${thread}</div></div></div>
</div>
<div class="board">${columns}</div>
</div>
${foot(c, 14)}`;
}

/** Slide 15: the reply. The draft's four sentences are struck with their evidence; Claude's honest reply types in line by line, each wired back to the claim it replaces. */
function reply(d, c) {
  const k = c.reply;
  const vars = { unique: d.training.unique, staff: d.training.staff, restore: d.quotes.reportRestore, stored: d.quotes.storedUs };
  const W = 700;
  // Fixed rows so the connectors can be drawn: draft claims and Claude's four sentences, in stage pixels.
  const CLAIM_Y = (i) => 213 + i * 134;
  const LINE_Y = (j) => 113 + j * 74;
  const REPLACES = [2, 1, 2, 3];
  const lineWin = (j) => stagger(j, 4, 0.18, 0.12, 0.84);
  const lines = d.draft
    .map((line, i) => `<li class="claim claim--done"><span class="claim__n">${i + 1}</span><span class="claim__body"><span class="claim__t"><span class="q" data-file="draft-reply.md">${esc(line)}</span><i${s(1, { fx: "strike", win: stagger(i, 4, 0.3) })}></i></span><span class="claim__why"${s(1, { fx: "pop", win: stagger(i, 4, 0.3, 0.15, 1) })} style="--origin:left center"><span class="pill pill--accent">${esc(k.verdict)}</span><span class="claim__ev">${esc(fill(k.evidence[i], vars))}</span></span></span></li>`)
    .join("");
  const due = c.lang === "de" ? dot(d.due).slice(0, 6) : fmtDate(d.due, c).replace(/ \d{4}$/, "");
  const said = k.lines.map((line, j) => `<li class="rp-line"${s(2, { fx: "type", ease: "linear", win: lineWin(j) })}>${hl(line, { due })}</li>`).join("");
  const sample = d.sample.split("\n").map((line) => `<p class="q" data-file="ANSWERS.md">${esc(line)}</p>`).join("");
  // Each connector draws once the line it ends on has typed in.
  const wires = REPLACES.map((j, i) => {
    const end = Number(lineWin(j).split(",")[1]);
    const win = `${r3(Math.min(0.9, end + i * 0.015))},${r3(Math.min(1, end + 0.12 + i * 0.015))}`;
    return `<path${s(2, { fx: "draw", win })} pathLength="1" d="M${W + 6} ${CLAIM_Y(i)} C ${W + 70} ${CLAIM_Y(i)}, ${760} ${LINE_Y(j)}, ${816} ${LINE_Y(j)}"/><circle${s(2, { fx: "pop", win })} cx="${816}" cy="${LINE_Y(j)}" r="7"/>`;
  }).join("");
  const strip = tsteps(c, k.label, [
    [k.steps[0], [0, "0,.3"], [2, "0,.3"]],
    [k.steps[1], [2, "0,.3"], [3, "0,.3"]],
    [k.steps[2], [3, "0,.3"]],
  ]);
  // The room's vote from the draft slide comes back here: none of the four sentences holds.
  const est = c.draft.pollKeys.map((label, n) => `<span class="rp-est__cell${n === 0 ? " rp-est__cell--truth" : ""}" data-value="${n}"><i>${esc(label)}</i><b class="rp-est__n" data-poll-n>0</b></span>`).join("");
  return `${head(k.label, em(k.title), { steps: strip, after: live(c) })}
<div class="stage reply">
<p class="pill pill--accent reply__held"${s(1, { fx: "pop", win: ".75,1" })} style="--origin:left center">${ico("cross", "ico--bold")}${esc(k.held)}</p>
<div class="rp-est" data-poll-show="draft"${s(1, { fx: "fade", win: ".6,.9" })}><span class="rp-est__label">${ico("hand")}${esc(k.drafted)}</span>${est}</div>
<div class="reply__draft">
<article class="mail mail--draft surface surface--strong"${s(0, { fx: "fly", win: "0,.4" })} style="--dy:60px;--s:.96"><p class="mail__head">${ico("file")}<b>draft-reply.md</b></p><ol class="claims">${lines}</ol></article>
</div>
<div class="cw reply__cw"${s(2, { fx: "fly", win: "0,.3" })} style="--dx:240px;--s:.94">${cwBar([c.project.project, k.chat])}<div class="cw-body cw-body--nosidebar"><div class="cw-main"><div class="cw-thread">
<div class="cw-answer rp"><h4>${esc(k.answerHead)}</h4><ol class="rp-lines">${said}</ol>
<p class="rp-full__head">${ico("envelope")}${esc(k.full)} · ${esc(k.mailNote)}</p><div class="rp-full">${sample}</div></div>
</div><div class="cw-composer reply__composer">${ico("plus")}<span class="reply__sign"${s(3, { fx: "type", ease: "linear", win: ".2,.8" })}>${esc(k.sign)}</span><i class="cw-send">${ico("arrow-up")}</i></div></div></div></div>
<p class="reply__signer"${s(3, { fx: "fade", win: ".6,1" })}>${ico("pen")}<span>${esc(k.signer)}</span></p>
<svg class="wires reply__wires" viewBox="0 0 1696 790" aria-hidden="true">${wires}</svg>
</div>
${foot(c, 15)}`;
}

/** Slide 16: the result. The room's estimate (or a hint where it would be); the true 2 drops onto its bar; eight tiles; QR codes; appendix. */
function result(d, c) {
  const k = c.result;
  const covered = d.tally.covered;
  const bars = Array.from({ length: 9 }, (_, n) => `<div class="ebar${n === covered ? " ebar--truth" : ""}" data-value="${n}"><b data-poll-n>0</b><i${s(0, { fx: "grow", win: stagger(n, 9, 0.4, 0.2, 1) })}></i><span>${n}</span></div>`).join("");
  const TILE_ICON = { covered: "check", weak: "", gap: "cross" };
  const tiles = d.mission2
    .map((row, i) => `<div class="tile"${s(1, { fx: "flip", win: stagger(i, 8, 0.4) })}><span class="face">${row.id}</span><span class="face face--back" data-tone="${TONE[row.status]}">${TILE_ICON[row.status] ? ico(TILE_ICON[row.status], "ico--bold") : ""}${row.id}<small>${esc(c.status[row.status])}</small></span></div>`)
    .join("");
  const qrs = k.qr
    .map((q, i) => `<figure class="qr"${s(2, { fx: "pop", win: stagger(i, 3, 0.5) })}><img src="./assets/${[c.qr.kit, c.qr.probe, c.qr.skill][i]}" width="180" height="180" alt="" /><figcaption><b>${esc(q.label)}</b></figcaption></figure>`)
    .join("");
  const links = k.appendixLinks.map((label, i) => `<a class="pill pill--quiet" href="#a${i + 1}">${ico("book")}${esc(label)}</a>`).join("");
  return `${head(c.lang === "de" ? "Ergebnis" : "Result", em(k.title, { covered }), { size: "xl", attrs: ` data-result-title data-covered="${covered}"` })}
<div class="stage res">
<div class="res__est surface"${s(0, { fx: "fade", win: "0,.3" })}><p class="label res__label">${ico("hand")}${esc(k.estimate)}</p><div class="ebars" data-poll-show="estimate" style="--truth:${covered}">${bars}<p class="res__ghost">${ico("hand")}${esc(k.ghost)}</p><p class="res__marker"${s(1, { fx: "arc", win: ".2,.75" })}${arcStyle(0, -220, 40, 1)}><span>${esc(fill(k.marker, { covered }))}</span><i></i></p></div></div>
<div class="tiles res__tiles" style="--cols:4">${tiles}</div>
<div class="res__out"${s(2, { fx: "fade", win: "0,.3" })}><div class="res__home"><p class="label">${ico("download")}${esc(k.home)}</p><div class="res__qrs">${qrs}</div></div><nav class="res__appx" aria-label="${esc(c.appendix)}"><p class="label">${esc(c.appendix)}</p>${links}</nav></div>
</div>
${foot(c, 16)}`;
}

/* ── appendix ───────────────────────────────────────────────────────── */

const back = (c) => `<a class="pill appx__back" href="#result">${esc(c.appendixBack)}</a>`;

function a1(d, c) {
  return `${head(`${c.appendix} A1`, esc(c.a1.title), { after: back(c) })}
<div class="stage appx"><ol class="facts">${c.a1.rows.map((row) => `<li class="surface"><p class="fact__head">${esc(row.head)}</p><p class="fact__text">${esc(row.text)}</p><p class="src">${esc(row.source)}</p></li>`).join("")}</ol>
<p class="appx__rule surface surface--accent">${ico("shield")}<span>${esc(c.a1.rule)}</span></p><p class="src">${esc(c.a1.checked)}</p></div>
${foot(c, "A1")}`;
}

function a2(d, c) {
  const vars = { adminNote: c.ui2.adminNote, plans: c.ui2.plans };
  return `${head(`${c.appendix} A2`, esc(c.a2.title), { after: back(c) })}
<div class="stage appx"><ol class="facts facts--2">${c.a2.rows.map((row) => `<li class="surface"><p class="fact__head">${esc(row.head)}</p><p class="fact__text">${esc(fill(row.text, vars))}</p></li>`).join("")}</ol>
<p class="src">${esc(c.a2.source)}</p></div>
${foot(c, "A2")}`;
}

export const SOURCES = [
  ["GDPR Art. 28(3)(h)", "https://eur-lex.europa.eu/eli/reg/2016/679/oj"],
  ["ISO 19011:2018, audit evidence (summary)", "https://www.iso.org/standard/70017.html"],
  ["ISO/IEC 27001:2022, clause 7.5.2 (summary)", "https://www.iso.org/standard/27001"],
  ["Anthropic, Reduce hallucinations", "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations"],
  ["Anthropic Privacy Center 7996890", "https://privacy.claude.com/en/articles/7996890"],
  ["Anthropic, Updates to our consumer terms", "https://www.anthropic.com/news/updates-to-our-consumer-terms"],
  ["Claude Help Center 12512180, custom skills", "https://support.claude.com/en/articles/12512180"],
  ["Claude Help Center 9517075, Projects", "https://support.claude.com/en/articles/9517075"],
  ["AP, Deloitte to partially refund Australian government for report with apparent AI-generated errors, 7 Oct 2025", "https://www.news4jax.com/business/2025/10/07/deloitte-to-partially-refund-australian-government-for-report-with-apparent-ai-generated-errors/"],
  ["Australian Greens, media release on the Deloitte refund, A$97,587 per Senate estimates, Oct 2025", "https://greens.org.au/news/media-release/greens-slam-deloittes-unethical-behaviour-and-measly-refund-over-ai-report"],
];

function a3(d, c) {
  return `${head(`${c.appendix} A3`, esc(c.a3.title), { after: back(c) })}
<div class="stage appx"><ol class="sources">${SOURCES.map(([label, url]) => `<li><b>${esc(label)}</b><code>${esc(url)}</code></li>`).join("")}</ol>
<p class="src">${esc(c.a3.checked)}</p></div>
${foot(c, "A3")}`;
}

/** The slides in deck order: id, presses after the first, milliseconds per press, minutes, body. */
export const SLIDES = [
  { id: "cover", steps: 0, ms: [2600], minutes: 1, body: cover },
  { id: "host", steps: 0, ms: [2200], minutes: 1, body: host },
  { id: "case", steps: 5, ms: [1900, 1500, 1400, 1100, 2400, 1300], minutes: 3, body: realCase },
  { id: "company", steps: 3, ms: [1600, 2000, 2200, 1600], minutes: 3, body: company },
  { id: "request", steps: 5, ms: [2000, 1900, 2300, 2200, 1800, 1000], minutes: 4, body: request },
  { id: "draft", steps: 2, ms: [2400, 1200, 1500], minutes: 3, body: draft },
  { id: "today", steps: 3, ms: [1600, 2200, 2400, 2200], minutes: 3, body: today },
  { id: "folder", steps: 2, ms: [2400, 2000, 1700], minutes: 4, body: folder },
  { id: "tests", steps: 5, ms: [1500, 1800, 1800, 1800, 1800, 1500], minutes: 6, body: tests },
  { id: "project", steps: 4, ms: [1500, 2600, 2200, 800, 1200], minutes: 3, body: project },
  { id: "mission-1", steps: 4, ms: [1200, 1600, 2200, 2000, 1500], minutes: 13, body: mission1 },
  { id: "mission-2", steps: 5, ms: [2400, 3200, 3200, 1400, 1400, 2200], minutes: 20, body: mission2 },
  { id: "mistakes", steps: 4, ms: [1200, 1500, 1500, 1500, 1500], minutes: 5, body: mistakes },
  { id: "gaps", steps: 3, ms: [1400, 2800, 1600, 2400], minutes: 10, body: gaps },
  { id: "reply", steps: 3, ms: [1000, 1800, 3400, 1800], minutes: 6, body: reply },
  { id: "result", steps: 2, ms: [1800, 1800, 1100], minutes: 5, body: result },
  { id: "a1", steps: 0, ms: [600], minutes: 0, body: a1, kind: "appendix" },
  { id: "a2", steps: 0, ms: [600], minutes: 0, body: a2, kind: "appendix" },
  { id: "a3", steps: 0, ms: [600], minutes: 0, body: a3, kind: "appendix" },
];

/** Every section of one edition. */
export function renderSlides(c, d) {
  return SLIDES.map((slide, index) => {
    if (slide.ms.length !== slide.steps + 1) throw new Error(`${slide.id}: ${slide.ms.length} durations for ${slide.steps + 1} presses`);
    const kind = slide.kind ?? "main";
    const label = c.notes[index].split("\n")[0].replace(/^[^·]*·\s*/, "");
    return `<section class="slide ${slide.id}" id="${slide.id}" data-kind="${kind}" data-label="${esc(label)}" data-seconds="${slide.minutes * 60}" data-step-total="${slide.steps}" data-step-current="0" data-durations="${slide.ms.join(",")}">
${slide.body(d, c)}
</section>`;
  });
}
