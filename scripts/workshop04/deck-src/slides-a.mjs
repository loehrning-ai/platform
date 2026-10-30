/**
 * Workshop 04 deck, slides 1 to 10: cover, host, why now, the winery, the three requests, today,
 * the one rule, the kit and the review on paper. Each function returns one <section> for edition `c`.
 */
import { esc, FILES, file, foot, head, REQUESTS, roomPill, s, section, stagger, tsteps } from "./parts.mjs";

export function cover(c) {
  return section(
    { id: "cover", label: c.t("ESG-Berichte mit KI", "ESG reports with AI"), steps: 0, durations: "2000" },
    `<div class="cover__globe" aria-hidden="true"><canvas data-globe data-lat="36" data-speed="8" data-boost="140" data-home="92" data-arc="germany" data-cx="0.81" data-cy="0.5" data-r="0.44" data-arc-width="4" data-arc-land></canvas></div>
<div class="cover__main"><p class="label"${s(0, { win: "0,.35" })}>Workshop 04 · ESG</p>
<h1 class="cover__title"${s(0, { win: ".05,.5", fx: "blur" })}>${c.t("ESG-Berichte", "ESG reports")}<br>${c.t("mit", "with")} <em>${c.t("KI", "AI")}</em></h1>
<p class="cover__sub"${s(0, { win: ".25,.65" })}>${c.t("Ein Weingut. Drei Anfragen.<br>Welche Antwort hat einen", "One winery. Three requests.<br>Which answer has")} <span class="cover__word">${c.t("Nachweis?", "evidence?")}<i class="cover__thread"${s(0, { win: ".6,.95", fx: "line" })}></i></span></p>
<p class="cover__meta"${s(0, { win: ".45,.9" })}><span class="pill">${c.ico("user")}Tim Loehr</span><span class="pill pill--quiet">${c.t("60 Minuten", "60 minutes")}</span><span class="pill pill--quiet">${c.ico("pin")}Kavadarci → ${c.t("Deutschland", "Germany")}</span></p></div>
${foot(c, 1)}`,
  );
}

export function host(c) {
  const stops = [
    ["Apple", "Data Scientist", "0.36,0.56", ""],
    ["Red Bull", "Data Scientist", "0.48,0.68", ""],
    ["Meta", "AI Engineer", "0.6,0.8", ""],
    ["loehrning.ai", "Running loehrning.ai", "0.72,0.94", " host__own"],
  ]
    .map(([name, role, win, own]) => `<li class="host__stop${own}" data-step="0" data-win="${win}" data-fx="pop"><i class="host__dot" aria-hidden="true"></i><b>${name}</b><span>${role}</span></li>`)
    .join("");
  return section(
    { id: "gastgeber", label: c.t("Gastgeber", "Host"), steps: 0, durations: "2000" },
    `<figure class="host__photo" data-step="0" data-win="0,0.4" data-fx="fade"><img src="${c.assets}/tim-loehr.jpg" alt="${c.t("Porträt von Tim Loehr", "Portrait of Tim Loehr")}" width="1100" height="1100" /></figure>
<div class="host__body"><div class="host__main"><p class="host__kicker" data-step="0" data-win="0,0.35">${c.t("Gastgeber", "Your host")}</p><h2 class="host__name" data-step="0" data-win="0.06,0.45">Tim Loehr</h2>
<p class="host__role" data-step="0" data-win="0.14,0.5">${"AI Engineer"}</p>
<div class="host__career" role="group" aria-label="${c.t("Werdegang", "Career")}"><i class="host__track" aria-hidden="true"></i><i class="host__fill" aria-hidden="true" data-step="0" data-win="0.35,0.9" data-fx="line"></i><ol class="host__stops">${stops}</ol></div>
<p class="host__msc" data-step="0" data-win="0.5,0.85">${c.ico("cap")}<b>${c.t("M.Sc. Informatik", "M.Sc. Computer Science")}</b><span>${c.t("FAU Erlangen-Nürnberg", "FAU Erlangen-Nuremberg")}</span></p>
<p class="host__line" data-step="0" data-win="0.6,0.95">${c.ico("shield")}<span>${c.t("Erfundener Fall. Keine Daten oder Systeme eines Arbeitgebers.", "Invented case. No employer data or systems.")}</span></p></div>
${foot(c, 4)}</div>`,
  );
}

/** The bottle on the scale: the needle follows the element's --p up to 420 g of 600 g. */
function scaleArt(c) {
  const ticks = Array.from({ length: 13 }, (_, i) => {
    const a = Math.PI - (Math.PI * i) / 12;
    const [x1, y1, x2, y2] = [180 + 92 * Math.cos(a), 292 - 92 * Math.sin(a), 180 + (i % 3 ? 84 : 78) * Math.cos(a), 292 - (i % 3 ? 84 : 78) * Math.sin(a)];
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join("");
  const a420 = Math.PI - Math.PI * 0.7;
  const zone = `M${(180 + 100 * Math.cos(a420)).toFixed(1)} ${(292 - 100 * Math.sin(a420)).toFixed(1)} A100 100 0 0 1 280 292`;
  return `<svg class="scale__art" viewBox="0 0 360 300" aria-hidden="true"><use href="${c.lib}/icons.svg#x-bottle" x="150" y="2" width="60" height="174"/><rect x="104" y="172" width="152" height="12" rx="6" class="scale__plate"/><rect x="172" y="184" width="16" height="16" class="scale__plate"/><rect x="40" y="196" width="280" height="104" rx="24" class="scale__body"/><path d="${zone}" class="scale__zone"/><g class="scale__ticks">${ticks}</g><g class="scale__needle"><line x1="180" y1="292" x2="180" y2="214"/><circle cx="180" cy="292" r="9"/></g></svg>`;
}


export function news(c) {
  const beat = (k, dx, date, pic, line, tag) =>
    `<article class="beat beat--${k} surface surface--strong"${s(k, { fx: "fly", win: "0,.7", out: 4, outWin: "0,.4" })} style="--dx:${dx}px;--dy:140px;--s:.2"><p class="beat__date">${date}</p><div class="beat__pic">${pic}</div><p class="beat__line">${line}</p><p class="beat__tag">${tag}</p></article>`;
  const scale = `<div class="scale"${s(1, { win: ".25,1", fx: "none", ease: "spring" })}>${scaleArt(c)}<span class="scale__read"><b${s(1, { win: ".25,1", fx: "none", count: "0,420,0" })}>420</b> g</span></div>`;
  const label = `<div class="bottle-label beat__label"><span class="bottle-label__brand">${c.t("Rotwein · 0,75 l", "Red wine · 0.75 l")}</span><span class="bottle-label__claim"><span>${c.t("Klimaneutral", "Climate neutral")}<i${s(2, { win: ".55,.9", fx: "strike" })}></i></span></span><span class="bottle-label__year">${c.t("dank Ausgleich", "via offsets")}</span></div>`;
  const globe = `<div class="beat__globe"><canvas data-globe data-lat="47" data-speed="0" data-r="0.46" data-cx="0.46" data-cy="0.36" data-globe-steps="0:germany@3.1;3:arc:london>skopje" aria-hidden="true"></canvas><span class="beat__money">${c.t("bis", "up to")} <b${s(3, { win: ".3,.9", fx: "none", count: "0,8,0" })}>8</b> ${c.t("Mio. €", "m EUR")}</span></div>`;
  const esg = [
    ["E", "leaf", c.t("Umwelt", "Environment"), c.t("Strom · Wasser · Glas", "electricity · water · glass")],
    ["S", "people", c.t("Soziales", "Social"), c.t("Beschäftigte · Unfälle", "employees · accidents")],
    ["G", "shield", c.t("Unternehmensführung", "Governance"), c.t("Korruption · Freigaben", "corruption · approvals")],
  ]
    .map(([letter, icon, word, ex], i) => `<div class="esg__tile surface surface--strong"${s(0, { fx: "pop", ease: "spring", win: stagger(i, 3, 0.45, 0.1, 0.75), out: 1, outWin: "0,.35" })}><span class="ico-tile">${c.ico(icon)}</span><b class="esg__letter">${letter}</b><span class="esg__word"${s(0, { fx: "type", ease: "linear", win: stagger(i, 3, 0.3, 0.35, 0.9) })}>${word}</span><span class="esg__ex"${s(0, { fx: "fade", win: stagger(i, 3, 0.25, 0.6, 1) })}>${ex}</span></div>`)
    .join("");
  return section(
    { id: "nachricht", label: c.t("Warum jetzt", "Why now"), steps: 4, durations: "2200,1500,1500,1700,1600" },
    `<header class="hd"><p class="label">${c.t("Warum jetzt", "Why now")}</p><h2 class="headline headline--m swap"><span${s(0, { fx: "blur", win: "0,.4", out: 1, outWin: "0,.3" })}>${c.t("ESG: was Kunden und Banken wissen wollen", "ESG: what customers and banks want to know")}</span><span${s(1, { fx: "fade", win: ".2,.6", out: 4, outWin: "0,.3" })}>${c.t("Drei echte Meldungen aus 2025 und 2026", "Three real headlines from 2025 and 2026")}</span><span${s(4, { fx: "fade", win: ".2,.6" })}>${c.t("Was die drei Meldungen gemeinsam haben", "What the three headlines share")}</span></h2></header>
<div class="stage beats">
<div class="esg">${esg}</div>
${beat(1, 584, "01.01.2026", scale, c.t("Vinmonopolet: höchstens 420 g je 0,75-l-Flasche", "Vinmonopolet: at most 420 g per 0.75 l bottle"), c.t("Norwegen · Lieferantenregel · Stillwein unter 250 NOK", "Norway · supplier rule · still wine under NOK 250"))}
${beat(2, 0, "27.09.2026", label, c.t("Seit 27.09.2026: kein „klimaneutral“ durch Ausgleich", "From 27.09.2026: no “climate neutral” through offsets"), "UWG · EU 2024/825")}
${beat(3, -584, "18.12.2025", globe, c.t("Grüne Kredite für KMU in Nordmazedonien", "Green loans for SMEs in North Macedonia"), "EBRD → Sparkasse Bank Skopje")}
<p class="src beats__src"${s(1, { win: ".5,1", out: 4, outWin: "0,.3" })}>${c.t("Quellen im Anhang 1", "Sources in appendix 1")}</p>
<p class="beats__end"${s(4, { fx: "fly", win: ".42,.8" })} style="--dy:60px;--s:.94">${c.t("Jede Aussage braucht jetzt einen", "Every claim now needs")} <em class="beats__word"${s(4, { fx: "pop", ease: "spring", win: ".62,1" })}>${c.t("Beleg", "evidence")}</em>.</p>
</div>
${foot(c, 5)}`,
  );
}

/** A point on a cubic Bézier, for the vine posts that sit on their row. */
const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
};

/** The invented winery in Kavadarci: layered hills, vine rows with their posts, the cellar. */
function wineryArt() {
  const rows = Array.from({ length: 7 }, (_, i) => {
    const y = 380 + i * 32;
    const pts = [[18, y + 10], [210, y - 16 + i * 2], [420, y - 12], [604, y - 30 + i * 3]];
    const win = stagger(i, 7, 0.4, 0.15, 0.85);
    const posts = [0.12, 0.36, 0.6, 0.84]
      .map((t) => {
        const [x, py] = bez(...pts, t);
        return `<path d="M${x.toFixed(1)} ${(py - 15).toFixed(1)} V${(py + 5).toFixed(1)}"/>`;
      })
      .join("");
    const d = `M${pts[0].join(" ")} C ${pts[1].join(" ")}, ${pts[2].join(" ")}, ${pts[3].join(" ")}`;
    return `<g class="w-posts"${s(0, { fx: "fade", win })}>${posts}</g><path class="vine"${s(0, { fx: "draw", win })} pathLength="1" d="${d}"/>`;
  }).join("");
  return `<svg class="winery__art" viewBox="0 0 620 600" aria-hidden="true"><circle cx="520" cy="92" r="38" class="w-sun"/><path class="w-hill w-hill--far" d="M0 250 C 120 188, 250 178, 350 212 S 540 168, 620 188 V600 H0Z"/><path class="w-hill w-hill--mid" d="M0 304 C 160 244, 330 252, 620 228 V600 H0Z"/>
<g class="w-house"${s(0, { fx: "pop", win: ".3,.7" })} style="--origin:470px 270px"><ellipse cx="478" cy="280" rx="104" ry="10" class="w-shadow"/><path d="M372 278 c-8 -30 -6 -62 6 -84 c12 22 14 54 6 84z" class="w-tree"/><path d="M590 276 c-7 -26 -5 -54 5 -74 c10 20 12 48 5 74z" class="w-tree"/><rect x="408" y="212" width="112" height="66" class="w-wall"/><path d="M398 216 L464 170 L530 216 Z" class="w-roof"/><path d="M464 170 L530 216 L520 216 L464 178 Z" class="w-roof-dark"/><rect x="520" y="234" width="58" height="44" class="w-wall w-wall--side"/><path d="M514 238 L549 214 L584 238 Z" class="w-roof"/><rect x="426" y="232" width="14" height="16" class="w-win"/><rect x="488" y="232" width="14" height="16" class="w-win"/><rect x="540" y="248" width="14" height="14" class="w-win"/><path d="M455 278 V256 a9 9 0 0 1 18 0 V278" class="w-door"/></g>
<path class="w-hill w-hill--near" d="M0 366 C 180 326, 400 322, 620 302 V600 H0Z"/>${rows}<g class="w-pin"${s(0, { fx: "pop", win: ".7,1" })} style="--origin:464px 152px"><path d="M464 156 c-14 -16 -24 -26 -24 -40 a24 24 0 0 1 48 0 c0 14 -10 24 -24 40Z"/><circle cx="464" cy="116" r="8" class="w-pin__dot"/></g></svg>`;
}

export function winery(c) {
  const stat = (i, to, label, unit = "") =>
    `<div class="stat stat--m co__stat"${s(1, { fx: "pop", ease: "spring", win: stagger(i, 3, 0.45) })} style="--origin:left center"><b class="stat__n" data-keep${s(1, { fx: "none", win: stagger(i, 3, 0.6, 0.1, 1), count: `0,${to},0` })}${unit ? ` data-count-unit="${unit}"` : ""}>${(c.de ? to.toLocaleString("de-DE") : to.toLocaleString("en-GB")) + unit}</b><span class="stat__l">${label}</span></div>`;
  const segs = [["de", 31, ".05,.35"], ["se", 22, ".3,.55"], ["pl", 17, ".5,.7"], ["ot", 4, ".65,.75"], ["in", 26, ".7,.95"]]
    .map(([key, w, win]) => `<i class="co__seg co__seg--${key}" style="--w:${w}"${s(2, { fx: "line", win })}></i>`)
    .join("");
  const big = (key, w, name, n, win) => `<span class="co__lab co__lab--${key}" style="--w:${w}"${s(2, { fx: "glow", win: ".8,1" })}>${name} <b data-keep${s(2, { fx: "none", win, count: `0,${n},0` })} data-count-unit=" %">${n} %</b></span>`;
  return section(
    { id: "weingut", label: c.t("Das Weingut", "The winery"), steps: 2, durations: "1800,1700,2000" },
    `${head(c.t("16.10.2026 · Der Fall · erfunden", "16.10.2026 · The case · invented"), c.t("Crvena Zemja: ein Weingut in Nordmazedonien", "Crvena Zemja: a winery in North Macedonia"), { size: "m" })}
<div class="stage winery">
<figure class="winery__card surface surface--strong"${s(0, { fx: "fade", win: "0,.4" })}>${wineryArt()}<figcaption class="winery__cap"><span class="pill">${c.ico("pin")}Kavadarci, Tikveš</span><span class="winery__fam">${c.t("Familienweingut", "family winery")}</span></figcaption></figure>
<div class="co">
<div class="co__stats">${stat(0, 42, c.t("Beschäftigte", "employees"))}${stat(1, 40, c.t("Weinberge", "of vineyards"), " ha")}${stat(2, 550000, c.t("Flaschen Stillwein im Jahr", "bottles of still wine a year"))}</div>
<div class="co__rev"${s(2, { fx: "fade", win: "0,.15" })}><p class="label">${c.t("Umsatz 2025", "Revenue 2025")}</p><div class="co__bar">${segs}</div>
<div class="co__labs">${big("de", 31, c.t("Deutschland", "Germany"), 31, ".1,.4")}${big("se", 22, c.t("Schweden", "Sweden"), 22, ".32,.58")}<span class="co__rest">${c.t("Polen 17 % · Sonstige 4 % · Inland 26 %", "Poland 17 % · other 4 % · domestic 26 %")}</span></div>
<p class="src co__cite"${s(2, { fx: "fade", win: ".7,1" })}>${c.t("firmenprofil.md · Z. 12", "company_profile.md · l. 12")}</p></div>
</div>
</div>
${foot(c, 2)}`,
  );
}

/** October 2026 on the timeline of the requests slide: day d at x in stage pixels. */
const dayX = (d) => Math.round(120 + ((d - 1) / 30) * 1456);

export function requests(c) {
  const cols = [848 - 565, 848, 848 + 565];
  const from = [[520, -460], [-620, -120], [0, 560]];
  const rows = c.de
    ? [
        ["8", "Fragen", "Nordvik Vin AB", "Importeur, Göteborg · Ausschreibung Vinmonopolet", "22 %", "des Umsatzes", "ban", "Ohne Nachweis: nicht gewertet", "scale", "420 g · 01.01.2026"],
        ["7", "Aussagen", "Marketing des Weinguts", "Etiketten für Deutschland", "31 %", "des Umsatzes", "label", "Druck nach 27.09.2026: Verbotsliste gilt", "label", "UWG · 27.09.2026"],
        ["6", "Felder", "Banka Povardarie", "Bank in Skopje", "8.550.000", "MKD Solarkredit", "pen", "Solarkredit: jede Schätzung gekennzeichnet", "bank", "EBRD · 18.12.2025"],
      ]
    : [
        ["8", "questions", "Nordvik Vin AB", "importer, Gothenburg · Vinmonopolet tender", "22 %", "of sales", "ban", "No evidence: not counted", "scale", "420 g · 01.01.2026"],
        ["7", "claims", "In-house marketing", "labels for Germany", "31 %", "of sales", "label", "Printed after 27.09.2026: ban list applies", "label", "UWG · 27.09.2026"],
        ["6", "fields", "Banka Povardarie", "bank in Skopje", "8,550,000", "MKD solar loan", "pen", "Solar loan: every estimate marked", "bank", "EBRD · 18.12.2025"],
      ];
  const env = (i, [n, word, who, role, num, unit, ruleIcon, rule, tagIcon, tag]) => {
    const k = i + 1;
    const [dx, dy] = from[i];
    return `<div class="rq" style="left:${cols[i] - 240}px"><div class="rq__env"${s(k, { fx: "arc", win: "0,.55", ease: "spring" })} style="--dx:${dx}px;--dy:${dy}px;--s:.6;--lift:40px"><div class="rq__scale"><div class="envelope" data-keep${s(k, { fx: "none", win: ".45,1" })}><div class="envelope__back"></div><div class="envelope__letter"><p class="env__n">${n}</p><p class="env__w">${word}</p></div><div class="envelope__front"></div><div class="envelope__flap"></div></div></div><span class="pill rq__tag"${s(k, { fx: "pop", win: ".55,.85" })}>${c.ico(tagIcon)}${tag}</span></div>
<p class="rq__who"${s(k, { win: ".55,.85" })}><b>${who}</b><span>${role}</span></p><p class="pill rq__stake${i === 1 ? " rq__stake--de" : ""}"${s(k, { fx: "pop", win: ".62,.92" })}><b>${num}</b>${unit}</p><p class="rq__rule"${s(k, { fx: "fade", win: ".72,1" })}>${c.ico(ruleIcon)}<span>${rule}</span></p></div>`;
  };
  const SUM_Y = 531; // vertical centre of .rq__sum in deck.css
  const nums = [8, 7, 6]
    .map((n, i) => {
      // from the centre of the letter's number (measured: x = column centre, y = 58) to the sum card
      const [sx, sy] = [cols[i], 58];
      const [tx, ty] = [848 + (i - 1) * 190, SUM_Y];
      return `<b class="wsum__n" style="left:${tx - 60}px;top:${ty - 60}px;--dx:${sx - tx}px;--dy:${sy - ty}px;--s:.62;--lift:60px"${s(4, { fx: "arc", ease: "spring", win: stagger(i, 3, 0.32, 0, 0.42), out: 4, outWin: ".5,.6" })}>${n}</b>`;
    })
    .join("");
  const plus = [-1, 1].map((d) => `<i class="wsum__plus" style="left:${848 + d * 95 - 20}px;top:${SUM_Y - 36}px"${s(4, { fx: "fade", win: ".36,.44", out: 4, outWin: ".5,.6" })}>+</i>`).join("");
  const tick = (k, d, text) => `<span class="tl__tick" style="left:${dayX(d)}px"${s(k, { fx: "pop", win: ".7,1" })}><i></i><span>${text}</span></span>`;
  return section(
    { id: "anfragen", label: c.t("Drei Anfragen", "Three requests"), steps: 4, durations: "1600,1700,1700,1700,2600" },
    `${head(c.t("Der Auslöser · Oktober 2026", "The trigger · October 2026"), c.t("Drei Anfragen brauchen ESG-Nachweise", "Three requests need ESG evidence"), { size: "m" })}
<div class="stage rqs">
${rows.map((row, i) => env(i, row)).join("\n")}
${nums}${plus}
<div class="winery__sum rq__sum"${s(4, { fx: "pop", win: ".52,.8" })}><span class="ico-tile ico-tile--accent">${c.ico("folder")}</span><b class="winery__n"${s(4, { fx: "none", win: ".55,.9", count: "0,21,0" })}>21</b><span class="winery__w">${c.t("Antworten · 1 Ordner", "answers · 1 folder")}</span></div>
<p class="rq__end"${s(4, { fx: "fly", win: ".66,.92" })} style="--dy:40px;--s:.96">${c.t(`ESG-Nachweise für <b>53 %</b> des Umsatzes und den <em>Solarkredit</em>.`, `ESG evidence for <b>53 %</b> of sales and the <em>solar loan</em>.`)}</p>
<div class="tl"><p class="tl__month"${s(0, { fx: "fade", win: ".1,.5" })}>${c.t("Oktober 2026", "October 2026")}</p><i class="tl__bar"${s(0, { fx: "line", win: ".1,.6" })}></i>
${tick(1, 23, c.t("23.10. Rückgabe Nordvik", "23.10. due to Nordvik"))}${tick(2, 14, c.t("14.10. Entwurf vom Marketing", "14.10. draft from marketing"))}
<span class="tl__pin" style="left:${dayX(16)}px"${s(0, { fx: "pop", ease: "spring", win: ".55,.9" })}><span class="pill pill--accent"${s(4, { fx: "glow", win: ".6,1" })}>${c.ico("calendar")}${c.t("16.10. Fallstichtag", "16.10. Case reference date")}</span><i></i></span></div>
</div>
${foot(c, 3)}`,
  );
}

export function today(c) {
  const words = c.de
    ? ["freigegebene", "Datei mit Zeile", "Zeitraum", "Umfang", "den Namen des Dokuments, das fehlt"]
    : ["approved", "file and line", "period", "scope", "the name of the document that is missing"];
  let text = esc(c.kit.objective);
  let from = 0;
  words.forEach((word, i) => {
    const at = text.indexOf(word, from);
    if (at < 0) throw new Error(`objective (${c.lang}) lacks "${word}"`);
    const span = `<span class="om" data-keep${s(1, { win: stagger(i, words.length, 0.3, 0.4, 1), fx: "none" })}>${word}</span>`;
    text = text.slice(0, at) + span + text.slice(at + word.length);
    from = at + span.length;
  });
  const stops = (c.de
    ? [["scale", "Regel", "1 Satz, 4 Prüfungen"], ["pen", "Papier", "13 Dateien, zu zweit"], ["spark", "Claude", "3 Anfragen, live"], ["table", "Register", "21 Antworten, 1 Rechnung"]]
    : [["scale", "Rule", "1 sentence, 4 checks"], ["pen", "Paper", "13 files, in pairs"], ["spark", "Claude", "3 requests, live"], ["table", "Register", "21 answers, 1 invoice"]]
  )
    .map(([icon, name, cap], i) => `<li class="road__stop${i === 2 ? " road__stop--ai" : ""}"${s(2, { fx: "pop", ease: "spring", win: stagger(i, 4, 0.3, 0.1, 1) })}><b class="road__n">${i + 1}</b><span class="road__name"><span class="ico-tile${i === 2 ? " ico-tile--accent" : ""}">${c.ico(icon)}</span>${name}</span><span class="road__cap">${cap}</span></li>`)
    .join("");
  const clicks = (c.de ? ["Neuer Chat", "Datei anhängen", "Prompt senden", "Zeile prüfen"] : ["New chat", "Attach file", "Send prompt", "Check a line"]).map((label, i) =>
    i < 3 ? [label, 3, `${(0.3 + i * 0.15).toFixed(2)},${(0.45 + i * 0.15).toFixed(2)}`, 3, `${(0.45 + i * 0.15).toFixed(2)},${(0.5 + i * 0.15).toFixed(2)}`] : [label, 3, ".75,.9"],
  );
  // The room's loop as on the W05 today slide: three nodes with icons, two arrows down, one arrow back up.
  const loop = (c.de ? ["schätzen", "Claude", "Zeile prüfen"] : ["predict", "Claude", "check a line"])
    .map((node, i) => `<li class="loop__node${i === 1 ? " loop__node--claude" : ""}"${s(4, { fx: "pop", win: stagger(i, 3, 0.25, 0.15, 0.6) })}>${c.ico(["hand", "spark", "search"][i])}${node}</li>`)
    .join("");
  const loopArt = `<svg class="loop__art" viewBox="0 0 360 240" aria-hidden="true"><path${s(4, { fx: "draw", win: ".3,.5" })} pathLength="1" d="M120 58 V 86 M112 78 L120 86 L128 78"/><path${s(4, { fx: "draw", win: ".45,.65" })} pathLength="1" d="M120 150 V 178 M112 170 L120 178 L128 170"/><path${s(4, { fx: "draw", win: ".6,.85" })} pathLength="1" d="M262 212 C 350 212, 350 28, 262 28 M274 20 L262 28 L274 36"/></svg>`;
  const kitFiles = (c.de ? [["md", "START-HIER.md"], ["md", "projektanweisungen.md"], ["dir", "ordner/ · 13 Dateien"]] : [["md", "START-HERE.md"], ["md", "project-instructions.md"], ["dir", "files/ · 13 files"]])
    .map(([ext, name], i) => `<span class="role__file${i === 0 ? " role__file--start" : ""}"${s(4, { fx: "fly", win: stagger(i, 3, 0.3, 0.55, 1) })} style="--dy:40px;--s:.9"><i>${ext === "dir" ? c.ico("folder") : ext}</i>${esc(name)}</span>`)
    .join("");
  return section(
    { id: "heute", cls: "today", label: c.t("Heute", "Today"), steps: 4, durations: "1500,1900,1900,2000,2000" },
    `<header class="hd today__hd"><p class="label"${s(0, { win: "0,.3" })}>${c.t("Heute · 60 Minuten", "Today · 60 minutes")}</p>
<h2 class="headline headline--m today__q"${s(0, { fx: "blur", win: ".05,.7" })}>${c.t("Welche Antwort ist <em>belegt</em>, welches Dokument fehlt?", "Which answer is <em>covered</em>, which document is missing?")}</h2>
<p class="today__where"${s(0, { fx: "fade", win: ".45,.9" })}>${c.ico("pin")}<span>${c.t("Heute seid ihr das Büro des Weinguts.", "Today you are the winery's office.")}</span></p></header>
<div class="stage today__stage">
<div class="goal__card surface surface--strong"${s(1, { fx: "fly", win: "0,.6", out: 2, outWin: "0,.3" })} style="--dy:80px;--s:.96"><p class="label">${c.t("Lernziel", "Learning objective")}</p><blockquote class="objective">${text}</blockquote></div>
<div class="road"><i class="road__track"${s(2, { fx: "fade", win: "0,.1" })}></i><i class="road__fill"${s(2, { fx: "line", win: ".05,.8" })}></i><ol class="road__stops">${stops}</ol></div>
<p class="label today__how"${s(3, { fx: "fade", win: "0,.25" })}>${c.t("So arbeiten wir", "How we work today")}</p>
<div class="roles">
<div class="role surface surface--strong"${s(3, { fx: "fly", win: "0,.35" })} style="--dx:120px;--s:.95"><p class="now now--live role__now">${c.ico("spark")}Live · Claude Desktop</p><b class="role__t">${c.t("Ich klicke in Claude.", "I click in Claude.")}</b>${tsteps(c, clicks, { col: true })}<span class="role__cap">${c.t("Die Leiste zeigt, wo ich gerade bin.", "The strip shows where I am.")}</span></div>
<div class="role surface surface--strong"${s(4, { fx: "fly", win: "0,.4" })} style="--dy:60px;--s:.95"><span class="ico-tile">${c.ico("hand")}</span><b class="role__t">${c.t("Ihr schätzt, dann prüft ihr.", "You predict, then you check.")}</b><div class="loop"><ol class="loop__nodes">${loop}</ol>${loopArt}</div></div>
<div class="role surface surface--strong"${s(4, { fx: "pop", win: ".3,.7" })}><span class="ico-tile">${c.ico("download")}</span><b class="role__t">${c.t("Ihr nehmt das Kit mit.", "You take the kit home.")}</b><div class="kit-folder role__kit"><p class="kit-folder__head">${c.ico("folder")}${esc(c.kit.zip.replace(/\.zip$/, "/"))}</p>${kitFiles}</div></div>
</div>
</div>
${foot(c, 6)}`,
  );
}

/** The three status glyphs, drawn large on the rule slide: soft fill, hatch, accent outline. */
const GLYPH = {
  belegt: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><rect x="8.5" y="8.5" width="7" height="7" rx="1.8" class="stile__dot"/>',
  schwach: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M4.6 10.4l5.8-5.8M4.4 16.6L16.6 4.4M7.4 19.6L19.6 7.4M13.6 19.4l5.8-5.8"/>',
  luecke: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/>',
};

export function rule(c) {
  const doc = c.de
    ? [[3, "BIO-ZERTIFIKAT (Kopie)"], [4, "Kontrollstelle: Biosertifika Kontrola, Code XX-BIO-000"], [5, "Betrieb: Vinarija Crvena Zemja DOO"], [6, "Geltungsbereich: Weinberg, 12,0 ha von 40 ha"], [7, "Gültig ab: 01.09.2025"], [8, "Gültig bis: 31.08.2026"], [9, "Erneuerungsprüfung: gebucht für 22.10.2026"], [10, "Hinweis: Die übrigen 28 ha sind nicht zertifiziert."], [11, "Keller und Weinbereitung: nicht zertifiziert."]]
    : [[3, "ORGANIC CERTIFICATE (copy)"], [4, "Control body: Biosertifika Kontrola, code XX-BIO-000"], [5, "Operator: Vinarija Crvena Zemja DOO"], [6, "Scope: vineyard, 12.0 ha of 40 ha"], [7, "Valid from: 01.09.2025"], [8, "Valid until: 31.08.2026"], [9, "Renewal inspection: booked for 22.10.2026"], [10, "Note: the other 28 ha are not certified."], [11, "Cellar and winemaking: not certified."]];
  const marks = { 3: [2, "ok"], 4: [2, "ok"], 5: [2, "ok"], 8: [3, "fail"], 6: [4, "fail"], 10: [4, "fail"], 11: [4, "fail"] };
  const lines = doc
    .map(([n, line]) => {
      const m = marks[n];
      const hl = m ? `<i class="hl hl--${m[1]}"${s(m[0], { fx: "fade", win: "0,.35" })}></i>` : "";
      return `<li>${hl}<i>${n}</i><span>${esc(line)}</span></li>`;
    })
    .join("");
  const check = (k, icon, name, ref, ok, detail = "") =>
    `<li class="check${ok ? "" : " check--fail"}"${s(k, { fx: "pop", win: "0,.45" })} style="--origin:left center"><span class="ico-tile">${c.ico(icon)}</span><b class="check__name">${name}</b><span class="pill pill--quiet check__ref">${ref}</span><span class="check__mark${ok ? "" : " check__mark--fail"}"${s(k, { fx: "pop", win: ".55,.9" })}>${c.ico(ok ? "check" : "cross", "ico--bold")}</span>${detail}</li>`;
  const cells = Array.from({ length: 40 }, () => "<i data-cell></i>").join("");
  const period = `<div class="period"${s(3, { fx: "fade", win: ".1,.5" })}><div class="period__bar"><i class="period__ok"></i><i class="period__late"${s(3, { fx: "line", win: ".4,.85" })}></i></div><span class="period__a">${c.t("gültig bis", "valid until")} 31.08.2026</span><span class="period__b">${c.t("Stichtag", "ref. date")} 16.10.2026</span><span class="period__days"><b${s(3, { fx: "none", win: ".4,.95", count: "0,46,0" })}>${c.dv("days")}</b> ${c.t("Tage zu spät", "days late")}</span></div>`;
  const scope = `<div class="ha"${s(4, { fx: "fade", win: ".1,.5" })}><div class="ha__cells"${s(4, { fx: "none", win: ".3,.9", fill: 12 })}>${cells}</div><span class="ha__lab"><b>${c.dv("haCertified")}</b> ${c.t("von", "of")} ${c.dv("haTotal")} ha ${c.t("zertifiziert", "certified")}</span></div>`;
  const tile = (tone, words) => `<div class="stile stile--${tone}"${s(6, { fx: "pop", ease: "spring", win: stagger(["belegt", "schwach", "luecke"].indexOf(tone), 3, 0.45) })}><svg class="stile__glyph" viewBox="0 0 24 24" aria-hidden="true">${GLYPH[tone]}</svg>${c.chip(tone, "chip--lg")}<p>${words}</p></div>`;
  return section(
    { id: "satz", label: c.t("Die Regel: ein Satz gegen seine Datei", "The rule: one sentence against its file"), steps: 6, durations: "1200,1600,1100,1900,1900,1500,1700" },
    `${head(c.t("Die eine Regel", "The one rule"), c.t("Ein Satz, geprüft an seiner Datei", "One sentence, checked against its file"), { size: "m" })}
<div class="stage rule">
<div class="rule__bottle"${s(0, { fx: "fly", win: "0,.6" })} style="--dy:60px;--s:.94"><svg viewBox="0 0 220 640" aria-hidden="true"><use href="${c.lib}/icons.svg#x-bottle"/></svg>
<div class="bottle-label rule__card"${s(0, { fx: "pop", win: ".3,.8" })}><span class="bottle-label__brand">Crvena Zemja</span><span class="bottle-label__claim"><span>${c.t("Zertifizierte", "Certified")}<i${s(5, { fx: "strike", win: ".45,.75" })}></i></span><span>${c.t("Bio-Weinberge", "organic vineyards")}<i${s(5, { fx: "strike", win: ".55,.85" })}></i></span></span><span class="bottle-label__year">${c.t("alle Weine", "all wines")}</span></div></div>
<div class="rule__focus"${s(0, { win: ".5,1", out: 1, outWin: "0,.3" })}><p class="rule__q">${c.t("Das Zertifikat liegt bei. <em>Was belegt es?</em>", "The certificate is there. <em>What does it prove?</em>")}</p><p class="rule__hint">${c.t("Zitat · Zeitraum · Umfang · Freigabe", "Quote · Period · Scope · Approval")}</p></div>
<div class="doc rule__doc"${s(1, { fx: "pop", win: ".35,.85", out: 6, outWin: "0,.4" })} style="--origin:left top"><div class="doc__head">${c.ico("file")}${c.t("bio_zertifikat_weinberg.txt", "organic_certificate_vineyard.txt")}<span class="file__meta">${c.t("11 Zeilen", "11 lines")}</span></div><ol class="doc__lines">${lines}</ol></div>
<div class="rule__right"${s(2, { fx: "fade", win: "0,.1", out: 6, outWin: "0,.4" })}><ol class="checks">
${check(2, "quote", c.t("Zitat", "Quote"), c.t("Z. 3 bis 5", "l. 3 to 5"), true)}
${check(3, "calendar", c.t("Zeitraum", "Period"), c.t("Z. 8", "l. 8"), false, period)}
${check(4, "leaf", c.t("Umfang", "Scope"), c.t("Z. 6, 10", "l. 6, 10"), false, scope)}
${check(5, "shield", c.t("Freigabe", "Approval"), c.t("Z. 4", "l. 4"), true)}
</ol>
<div class="rule__verdict"${s(5, { fx: "pop", ease: "spring", win: ".6,1" })} style="--origin:left center">${c.chip("luecke", "chip--lg")}<b>${c.t("Darf so nicht raus.", "Must not go out.")}</b></div></div>
<svg class="wires" viewBox="0 0 1696 774" preserveAspectRatio="none" aria-hidden="true"><path${s(1, { fx: "draw", win: "0,.5", out: 6, outWin: "0,.3" })} pathLength="1" d="M246 520 C 300 520, 266 98, 330 98"/><circle${s(1, { fx: "pop", win: ".45,.6", out: 6, outWin: "0,.3" })} cx="330" cy="98" r="8"/></svg>
<div class="stiles">${tile("belegt", c.t("Alle vier Prüfungen halten", "All four checks hold"))}${tile("schwach", c.t("Abgelaufen, geschätzt oder Entwurf", "Expired, estimated or draft"))}${tile("luecke", c.t("Ein Teil hat keine Datei", "A part has no file"))}<p class="stiles__end"${s(6, { fx: "pop", win: ".5,1" })}>${c.t("Der <em>schwächste</em> Teil zählt.", "The <em>weakest</em> part counts.")}</p></div>
</div>
${foot(c, 7)}`,
  );
}

export function kitSlide(c, qr) {
  const files = FILES[c.lang];
  const home = [120, 344];
  const rows = files
    .map(([ext, name], i) => {
      const col = Math.floor(i / 7);
      const row = i % 7;
      const [cx, cy] = [325 + col * 404 + 196, 125 + row * 46 + 20];
      return `<li class="kfl"${s(1, { fx: "arc", ease: "spring", win: stagger(i, files.length, 0.38, 0.3, 1) })} style="--dx:${home[0] - cx}px;--dy:${home[1] - cy}px;--s:.25;--lift:${90 + (i % 4) * 30}px"><span class="kfl__ext">${ext}</span><span class="kfl__n">${esc(name)}</span></li>`;
    })
    .join("");
  const reqs = REQUESTS[c.lang]
    .map((name, i) => {
      const [cx, cy] = [325 + i * 268 + 125, 482 + 125 + 50];
      return `<li class="kr"${s(2, { fx: "arc", ease: "spring", win: stagger(i, 3, 0.5, 0, 0.7) })} style="--dx:${home[0] - cx}px;--dy:${home[1] - cy}px;--s:.3;--lift:110px">${c.ico("envelope")}<span>${esc(name.replace(/\.md$/, ""))}</span></li>`;
    })
    .join("");
  const start = c.de ? ["START-HIER.md", "nachweisprobe.md", "projektanweisungen.md"] : ["START-HERE.md", "evidence-check.md", "project-instructions.md"];
  const stat = (n, word, win) => `<span><b${s(3, { fx: "none", win, count: `0,${n},0` })}>${n}</b>${word}</span>`;
  return section(
    { id: "kit", label: c.t("Das Kit", "The kit"), steps: 3, durations: "1300,2600,1800,1500" },
    `${head(c.t("Das Kit", "The kit"), c.t("Der Ordner des Weinguts", "The winery's folder"), { size: "m" })}
<div class="stage kitx">
<div class="kitx__zip" data-keep${s(1, { fx: "travel", ease: "spring", win: ".08,.4" })} style="--dx:728px;--dy:40px;--s:1.45;--lift:0px"><span class="kitx__tile"${s(0, { fx: "pop", win: "0,.6" })}><svg class="kitx__glyph" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 3v1.5M12 6.5V8M12 10v1.5"/><rect class="kitx__slider"${s(1, { fx: "move", ease: "spring", win: "0,.22" })} style="--dy:-9px" x="10.3" y="13.5" width="3.4" height="4" rx="1"/></svg></span><span class="kitx__name"${s(0, { win: ".3,.8" })}>${c.kit.zip}</span></div>
<div class="kit-folder kitx__ordner"${s(1, { fx: "fade", win: ".2,.4" })}><p class="kit-folder__head">${c.ico("folder")}${c.t("ordner/", "files/")}<span class="file__meta kitx__count"><b${s(1, { fx: "none", win: ".3,1", count: "0,13,0" })}>13</b> ${c.t("Dateien", "files")}</span></p><ol class="kfl-grid">${rows}</ol></div>
<div class="kit-folder kitx__anfragen"${s(2, { fx: "fade", win: "0,.2" })}><p class="kit-folder__head">${c.ico("folder")}${c.t("anfragen/", "requests/")}<span class="file__meta kitx__count"><b${s(2, { fx: "none", win: ".1,.8", count: "0,3,0" })}>3</b> ${c.t("Anfragen", "requests")}</span></p><ol class="kr-row">${reqs}</ol></div>
<div class="kitx__start">${start.map((name, i) => file("md", name, "", { cls: i === 0 ? "file--accent" : "", attrs: s(2, { fx: "pop", win: stagger(i, 3, 0.4, 0.4, 1) }) })).join("")}</div>
<figure class="qr kitx__qr"${s(3, { fx: "pop", win: "0,.6" })}>${qr}<figcaption><span>loehrning.ai${c.site}/workshops/</span><span>esg-berichte-mit-ki</span></figcaption></figure>
<div class="kitx__stats"${s(3, { win: ".2,.6" })}>${stat(3, c.t("Anfragen", "requests"), ".3,.85")}${stat(5, "Prompts", ".45,.95")}</div>
<p class="kitx__role"${s(3, { fx: "fade", win: ".6,1" })}>${c.t("Heute arbeite ich damit. Ihr nehmt es mit.", "Today I work with it. You take it home.")}</p>
</div>
${foot(c, 8)}`,
  );
}

export function review(c) {
  const files = FILES[c.lang];
  const icon = { Zeitraum: "calendar", Period: "calendar", Umfang: "ruler", Scope: "ruler", Freigabe: "pen", Approval: "pen", Regel: "scale", Rule: "scale" };
  const flags = c.de
    ? { 0: [["Zeitraum", "September fehlt"], ["Zeitraum", "Oktober doppelt"]], 1: [["Freigabe", "nur Entwurf"]], 2: [["Zeitraum", "abgelaufen"], ["Umfang", "12 von 40 ha"]], 3: [["Verbotsliste 4c", "Ausgleich"]], 10: [["Freigabe", "nicht unterschrieben"]], 6: [["Regel", "Flasche 560 g"]] }
    : { 0: [["Period", "September missing"], ["Period", "October twice"]], 1: [["Approval", "draft only"]], 2: [["Period", "expired"], ["Scope", "12 of 40 ha"]], 3: [["Ban list 4c", "offsets"]], 10: [["Approval", "not signed"]], 6: [["Rule", "bottle 560 g"]] };
  let seen = 0;
  const cards = files
    .map(([ext, name], i) => {
      const list = flags[i] || [];
      const tags = list
        .map(([check, why]) => {
          const k = seen++;
          return `<span class="flag"${s(1, { fx: "pop", win: stagger(k, 8, 0.28) })} style="--origin:left center">${c.ico(icon[check] || "ban")}<b>${check}</b><small>${why}</small></span>`;
        })
        .join("");
      const clean = i === 4;
      const ok = clean ? `<span class="flag flag--clean"${s(2, { fx: "pop", win: ".3,.8" })} style="--origin:left center">${c.ico("check", "ico--bold")}<b>${c.t("sauber", "clean")}</b><small>${c.t("12 von 12 Monaten", "12 of 12 months")}</small></span>` : "";
      const ring = clean ? `<i class="ds__ring"${s(2, { fx: "fade", win: "0,.6" })}></i>` : "";
      return `<div class="ds__card${list.length ? " ds__card--bad" : ""}">${ring}<span class="ds__ext">${ext}</span><span class="ds__name">${esc(name)}</span>${tags || ok ? `<span class="ds__tags">${tags}${ok}</span>` : ""}</div>`;
    })
    .join("");
  return section(
    { id: "durchsicht", label: c.t("Durchsicht auf Papier", "Review on paper"), steps: 2, durations: "1300,3400,1500" },
    `<header class="hd hd--row"><div><p class="label">${c.t("Schritt 0 · auf Papier", "Step 0 · on paper")}</p><h2 class="headline headline--m ds__h"><span class="ds__q"${s(0, { fx: "fade", win: "0,.4", out: 2, outWin: "0,.35" })}>${c.t("Was stimmt nicht?", "What is wrong?")}</span><span class="ds__a"${s(2, { fx: "pop", win: ".3,.8" })} style="--origin:left center">${c.t("8 Mängel, 1 falscher Alarm", "8 defects, 1 false alarm")}</span></h2></div>${roomPill(c, c.t("Ihr · auf Papier · 10 Min", "You · on paper · 10 min"), s(0, { fx: "pop", win: ".4,.9" }))}</header>
<div class="stage ds"><div class="ds__grid"${s(0, { fx: "fade", win: "0,.4" })}>${cards}<p class="ds__count"${s(1, { fx: "pop", win: "0,.15" })}><b${s(1, { fx: "none", win: "0,1", count: "0,8,0" })}>8</b><span>${c.t("Mängel gefunden", "defects found")}</span></p></div></div>
${foot(c, 9)}`,
  );
}
