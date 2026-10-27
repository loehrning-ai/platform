/**
 * Workshop 04 deck, slides 1 to 8: cover, host, the real news, the case, the objective, the one
 * rule, the kit and the review on paper. Each function returns one <section> for edition `c`.
 */
import { esc, FILES, file, foot, head, now, REQUESTS, s, section, stagger } from "./parts.mjs";

export function cover(c) {
  return section(
    { id: "cover", label: c.t("ESG-Berichte mit KI", "ESG reports with AI"), steps: 0, durations: "2000" },
    `<div class="cover__globe" aria-hidden="true"><canvas data-globe data-lat="36" data-speed="8" data-boost="140" data-home="92" data-arc="germany" data-cx="0.81" data-cy="0.5" data-r="0.44" data-arc-width="4" data-arc-land></canvas></div>
<div class="cover__main"><p class="label"${s(0, { win: "0,.35" })}>Workshop 04 · ESG</p>
<h1 class="cover__title"${s(0, { win: ".05,.5", fx: "blur" })}>${c.t("ESG-Berichte", "ESG reports")}<br>${c.t("mit", "with")} <em>${c.t("KI", "AI")}</em></h1>
<p class="cover__sub"${s(0, { win: ".25,.65" })}>${c.t("Jede Antwort mit", "Every answer with")} <span class="cover__word">${c.t("Nachweis", "evidence")}<i class="cover__thread"${s(0, { win: ".6,.95", fx: "line" })}></i></span></p>
<p class="cover__meta"${s(0, { win: ".45,.9" })}><span class="pill">${c.ico("user")}Tim Löhr</span><span class="pill pill--quiet">${c.t("60 Minuten", "60 minutes")}</span><span class="pill pill--quiet">${c.ico("pin")}Kavadarci → ${c.t("Deutschland", "Germany")}</span></p></div>
${foot(c, 1)}`,
  );
}

export function host(c) {
  const stops = [
    ["Apple", "Data Scientist", "0.4,0.62", ""],
    ["Red Bull", "Data Scientist", "0.56,0.78", ""],
    ["Meta", "Data Engineer", "0.74,0.98", " host__own"],
  ]
    .map(([name, role, win, own]) => `<li class="host__stop${own}" data-step="0" data-win="${win}" data-fx="pop"><i class="host__dot" aria-hidden="true"></i><b>${name}</b><span>${role}</span></li>`)
    .join("");
  return section(
    { id: "gastgeber", label: c.t("Gastgeber", "Host"), steps: 0, durations: "1800" },
    `<figure class="host__photo" data-step="0" data-win="0,0.4" data-fx="fade"><img src="${c.assets}/tim-loehr.jpg" alt="${c.t("Porträt von Tim Löhr", "Portrait of Tim Löhr")}" width="1100" height="1100" /></figure>
<div class="host__body"><div class="host__main"><p class="host__kicker" data-step="0" data-win="0,0.35">${c.t("Gastgeber", "Your host")}</p><h2 class="host__name" data-step="0" data-win="0.06,0.45">Tim Löhr</h2>
<p class="host__role" data-step="0" data-win="0.14,0.5">${c.t("Data Engineer bei Meta, Warschau", "Data Engineer at Meta, Warsaw")}</p>
<div class="host__career" role="group" aria-label="${c.t("Werdegang", "Career")}"><i class="host__track" aria-hidden="true"></i><i class="host__fill" aria-hidden="true" data-step="0" data-win="0.35,0.95" data-fx="line"></i><ol class="host__stops">${stops}</ol><p class="host__now" data-step="0" data-win="0.84,1" data-fx="pop"><span>${c.t("jetzt", "now")}</span></p></div>
<p class="host__msc" data-step="0" data-win="0.5,0.85">${c.ico("cap")}<b>${c.t("M.Sc. Informatik", "M.Sc. Computer Science")}</b><span>${c.t("FAU Erlangen-Nürnberg", "FAU Erlangen-Nuremberg")}</span></p>
<p class="host__line" data-step="0" data-win="0.6,0.95">${c.ico("shield")}<span>${c.t("Erfundener Fall. Keine Daten oder Systeme eines Arbeitgebers.", "Synthetic teaching case. No employer data or systems.")}</span></p></div>
${foot(c, 2)}</div>`,
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
    `<article class="beat beat--${k} surface surface--strong"${s(k, { fx: "fly", win: "0,.7", out: 3, outWin: "0,.4" })} style="--dx:${dx}px;--dy:140px;--s:.2"><p class="beat__date">${date}</p><div class="beat__pic">${pic}</div><p class="beat__line">${line}</p><p class="beat__tag">${tag}</p></article>`;
  const label = `<div class="bottle-label beat__label"><span class="bottle-label__brand">${c.t("Rotwein · 0,75 l", "Red wine · 0.75 l")}</span><span class="bottle-label__claim"><span>${c.t("Klimaneutral", "Climate neutral")}<i${s(0, { win: ".55,.9", fx: "strike" })}></i></span></span><span class="bottle-label__year">${c.t("dank Ausgleich", "via offsets")}</span></div>`;
  const globe = `<div class="beat__globe"><canvas data-globe data-lat="47" data-speed="0" data-r="0.46" data-cx="0.46" data-cy="0.36" data-globe-steps="0:germany@3.1;1:arc:london>skopje" aria-hidden="true"></canvas><span class="beat__money"><b${s(1, { win: ".3,.9", fx: "none", count: "0,8,0" })}>8</b> ${c.t("Mio. €", "m EUR")}</span></div>`;
  const scale = `<div class="scale"${s(2, { win: ".25,1", fx: "none", ease: "spring" })}>${scaleArt(c)}<span class="scale__read"><b${s(2, { win: ".25,1", fx: "none", count: "0,420,0" })}>420</b> g</span></div>`;
  return section(
    { id: "nachricht", label: c.t("Was wirklich passiert ist", "What actually happened"), steps: 3, durations: "1500,1500,1700,1600" },
    `${head(c.t("Echte Meldungen", "Real news"), c.t("Drei Meldungen, ein Weingut", "Three headlines, one winery"), { size: "m" })}
<div class="stage beats">
${beat(0, 584, "27.09.2026", label, c.t("Deutschland verbietet „klimaneutral“ per Ausgleich", "Germany bans “climate neutral” via offsets"), "UWG · EU 2024/825")}
${beat(1, 0, "18.12.2025", globe, c.t("Grüne Kredite für KMU in Skopje", "Green loans for SMEs in Skopje"), "EBRD → Sparkasse Bank Skopje")}
${beat(2, -584, "01.01.2026", scale, c.t("Norwegen: Weinflasche höchstens 420 g", "Norway: wine bottle at most 420 g"), "Vinmonopolet")}
<p class="src beats__src"${s(0, { win: ".5,1", out: 3, outWin: "0,.3" })}>${c.t("BGH I ZR 98/23 · Quellen im Anhang", "BGH I ZR 98/23 · sources in the appendix")}</p>
<p class="beats__end"${s(3, { fx: "fly", win: ".42,.8" })} style="--dy:60px;--s:.94">${c.t("Jede Aussage braucht jetzt einen", "Every claim now needs")} <em class="beats__word"${s(3, { fx: "pop", ease: "spring", win: ".62,1" })}>${c.t("Beleg", "evidence")}</em>.</p>
</div>
${foot(c, 3)}`,
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
  const X0 = 680;
  const STEP = 358;
  const TOP = 110;
  const from = [[460, -470], [-70, -500], [120, 560]];
  const env = (k, i, place, n, word, stake) => {
    const [dx, dy] = from[i];
    return `<div class="req" style="left:${X0 + i * STEP}px;top:${TOP}px"><div class="env"${s(k, { fx: "arc", win: "0,.55", ease: "spring" })} style="--dx:${dx}px;--dy:${dy}px;--s:.7;--lift:40px"><div class="env__scale"><div class="envelope" data-keep${s(k, { fx: "none", win: ".45,1" })}><div class="envelope__back"></div><div class="envelope__letter"><p class="env__n">${n}</p><p class="env__w">${word}</p></div><div class="envelope__front"></div><div class="envelope__flap"></div></div></div></div><p class="req__stake"${s(k, { win: ".6,1" })}>${c.ico(["globe", "label", "bank"][i])}<span><b>${place}:</b> ${stake}</span></p></div>`;
  };
  const paths = [
    [1, "M1310 -70 C 1250 30, 920 40, 840 160"],
    [2, "M1120 -70 C 1130 30, 1180 90, 1188 160"],
    [3, "M1690 800 C 1700 600, 1690 420, 1660 290"],
  ]
    .map(([k, d]) => `<path${s(k, { fx: "fade", win: "0,.35", out: k + 1, outWin: "0,.3" })} d="${d}"/>`)
    .join("");
  const cx = X0 + 508;
  const nums = [8, 7, 6]
    .map((n, i) => {
      const [sx, sy] = [X0 + i * STEP + 58, 104];
      const [tx, ty] = [cx + (i - 1) * 190, 530];
      return `<b class="wsum__n" style="left:${tx - 60}px;--dx:${sx - tx}px;--dy:${sy - ty}px;--s:.6;--lift:60px"${s(4, { fx: "arc", ease: "spring", win: stagger(i, 3, 0.32, 0, 0.42), out: 4, outWin: ".5,.6" })}>${n}</b>`;
    })
    .join("");
  const plus = [-1, 1].map((d) => `<i class="wsum__plus" style="left:${cx + d * 95 - 20}px"${s(4, { fx: "fade", win: ".36,.44", out: 4, outWin: ".5,.6" })}>+</i>`).join("");
  return section(
    { id: "weingut", label: c.t("Der Fall: ein Weingut, drei Anfragen", "The case: one winery, three requests"), steps: 4, durations: "1800,1400,1400,1400,2200" },
    `${head(c.t("Der Fall · erfunden", "The case · invented"), c.t("Ein Weingut, drei Anfragen", "One winery, three requests"), { size: "m" })}
<div class="stage winery">
<figure class="winery__card surface surface--strong"${s(0, { fx: "fade", win: "0,.4" })}>${wineryArt()}<figcaption class="winery__cap"><span class="pill">${c.ico("pin")}Kavadarci, ${c.t("Nordmazedonien", "North Macedonia")}</span><span class="winery__facts"><span class="pill pill--quiet">${c.ico("people")}42 ${c.t("Leute", "people")}</span><span class="pill pill--quiet">${c.ico("leaf")}40 ha</span><span class="pill pill--quiet">${c.ico("euro")}31 % DE</span></span></figcaption></figure>
<svg class="winery__paths" viewBox="0 0 1696 774" aria-hidden="true">${paths}</svg>
${env(1, 0, c.t("Schweden", "Sweden"), "8", c.t("Fragen", "questions"), c.t("sonst keine Listung", "or no listing"))}
${env(2, 1, c.t("Deutschland", "Germany"), "7", c.t("Aussagen", "claims"), c.t("sonst kein Etikett", "or no label"))}
${env(3, 2, "Skopje", "6", c.t("Felder", "fields"), c.t("sonst kein Kredit", "or no loan"))}
${nums}${plus}
<div class="winery__sum"${s(4, { fx: "pop", win: ".52,.82" })}><span class="ico-tile ico-tile--accent">${c.ico("folder")}</span><b class="winery__n"${s(4, { fx: "none", win: ".55,.95", count: "0,21,0" })}>21</b><span class="winery__w">${c.t("Antworten · 1 Ordner", "answers · 1 folder")}</span></div>
</div>
${foot(c, 4)}`,
  );
}

export function objective(c) {
  const words = c.de
    ? ["freigegebene", "Datei mit Zeile", "Zeitraum", "Umfang", "den Namen des Dokuments, das fehlt"]
    : ["approved", "file and line", "period", "scope", "the name of the document that is missing"];
  let text = esc(c.kit.objective);
  let from = 0;
  words.forEach((word, i) => {
    const at = text.indexOf(word, from);
    if (at < 0) throw new Error(`objective (${c.lang}) lacks "${word}"`);
    const span = `<span class="om" data-keep${s(2, { win: stagger(i, words.length, 0.3), fx: "none" })}>${word}</span>`;
    text = text.slice(0, at) + span + text.slice(at + word.length);
    from = at + span.length;
  });
  return section(
    { id: "lernziel", label: c.t("Lernziel", "Learning objective"), steps: 2, durations: "1400,1300,1900" },
    `<div class="goal"><p class="label"${s(0, { win: "0,.3" })}>${c.t("Die Frage dieser Stunde", "The question of this hour")}</p>
<h2 class="headline goal__q"${s(0, { fx: "blur", win: ".05,.7" })}>${c.t("Welche Antwort ist <em>belegt</em>, welches Dokument fehlt?", "Which answer is <em>covered</em>, which document is missing?")}</h2>
<div class="goal__card surface surface--strong"${s(1, { fx: "fly", win: "0,.8" })} style="--dy:80px;--s:.96"><p class="label">${c.t("Lernziel", "Learning objective")}</p><blockquote class="objective">${text}</blockquote></div></div>
${foot(c, 5)}`,
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
    `${head(c.t("Die eine Regel", "The one rule"), c.t("Ein Satz, eine Datei, vier Prüfungen", "One sentence, one file, four checks"), { size: "m" })}
<div class="stage rule">
<div class="rule__bottle"${s(0, { fx: "fly", win: "0,.6" })} style="--dy:60px;--s:.94"><svg viewBox="0 0 220 640" aria-hidden="true"><use href="${c.lib}/icons.svg#x-bottle"/></svg>
<div class="bottle-label rule__card"${s(0, { fx: "pop", win: ".3,.8" })}><span class="bottle-label__brand">Crvena Zemja</span><span class="bottle-label__claim"><span>${c.t("Zertifizierte", "Certified")}<i${s(5, { fx: "strike", win: ".45,.75" })}></i></span><span>${c.t("Bio-Weinberge", "organic vineyards")}<i${s(5, { fx: "strike", win: ".55,.85" })}></i></span></span><span class="bottle-label__year">${c.t("alle Weine", "all wines")}</span></div></div>
<div class="rule__poll"${s(0, { win: ".5,1", out: 1, outWin: "0,.3" })}><p class="label">${c.t("Eure Vorhersage", "Your prediction")}</p><p class="rule__q">${c.t("Hält die Aussage?", "Does the claim hold?")}</p><div class="poll poll--two" data-poll-show="satz"><button class="poll__opt" type="button" data-poll="satz" data-value="ja"><span class="poll__key">A</span><span>${c.t("Ja, das Zertifikat liegt bei", "Yes, the certificate is there")}</span><b data-poll-n>0</b></button><button class="poll__opt" type="button" data-poll="satz" data-value="nein"><span class="poll__key">B</span><span>${c.t("Nein", "No")}</span><b data-poll-n>0</b></button></div></div>
<div class="doc rule__doc"${s(1, { fx: "pop", win: ".35,.85", out: 6, outWin: "0,.4" })} style="--origin:left top"><div class="doc__head">${c.ico("file")}${c.t("bio_zertifikat_weinberg.txt", "organic_certificate_vineyard.txt")}<span class="file__meta">${c.t("11 Zeilen", "11 lines")}</span></div><ol class="doc__lines">${lines}</ol></div>
<div class="rule__right"${s(2, { fx: "fade", win: "0,.1", out: 6, outWin: "0,.4" })}><ol class="checks">
${check(2, "quote", c.t("Zitat", "Quote"), c.t("Z. 3 bis 5", "l. 3 to 5"), true)}
${check(3, "calendar", c.t("Zeitraum", "Period"), c.t("Z. 8", "l. 8"), false, period)}
${check(4, "leaf", c.t("Umfang", "Scope"), c.t("Z. 6, 10", "l. 6, 10"), false, scope)}
${check(5, "shield", c.t("Freigabe", "Approval"), c.t("Z. 4", "l. 4"), true)}
</ol>
<div class="rule__verdict"${s(5, { fx: "pop", ease: "spring", win: ".6,1" })} style="--origin:left center">${c.chip("luecke", "chip--lg")}<b>${c.t("Darf so nicht raus.", "Must not go out.")}</b></div></div>
<svg class="wires" viewBox="0 0 1696 774" preserveAspectRatio="none" aria-hidden="true"><path${s(1, { fx: "draw", win: "0,.5", out: 6, outWin: "0,.3" })} pathLength="1" d="M246 520 C 300 520, 266 98, 330 98"/><circle${s(1, { fx: "pop", win: ".45,.6", out: 6, outWin: "0,.3" })} cx="330" cy="98" r="8"/></svg>
<div class="stiles">${tile("belegt", c.t("Alle vier Prüfungen halten", "All four checks hold"))}${tile("schwach", c.t("Abgelaufen, geschätzt oder Entwurf", "Expired, estimated or draft"))}${tile("luecke", c.t("Fehlendes Dokument benannt", "Missing document named"))}<p class="stiles__end"${s(6, { fx: "pop", win: ".5,1" })}>${c.t("Der <em>schwächste</em> Teil zählt.", "The <em>weakest</em> part counts.")}</p></div>
</div>
${foot(c, 6)}`,
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
    `${head(c.t("Das Kit", "The kit"), c.t("Ein Ordner für alles", "One folder for everything"), { size: "m" })}
<div class="stage kitx">
<div class="kitx__zip" data-keep${s(1, { fx: "travel", ease: "spring", win: ".08,.4" })} style="--dx:728px;--dy:40px;--s:1.45;--lift:0px"><span class="kitx__tile"${s(0, { fx: "pop", win: "0,.6" })}><svg class="kitx__glyph" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 3v1.5M12 6.5V8M12 10v1.5"/><rect class="kitx__slider"${s(1, { fx: "move", ease: "spring", win: "0,.22" })} style="--dy:-9px" x="10.3" y="13.5" width="3.4" height="4" rx="1"/></svg></span><span class="kitx__name"${s(0, { win: ".3,.8" })}>${c.kit.zip}</span></div>
<div class="kit-folder kitx__ordner"${s(1, { fx: "fade", win: ".2,.4" })}><p class="kit-folder__head">${c.ico("folder")}${c.t("ordner/", "files/")}<span class="file__meta kitx__count"><b${s(1, { fx: "none", win: ".3,1", count: "0,13,0" })}>13</b> ${c.t("Dateien", "files")}</span></p><ol class="kfl-grid">${rows}</ol></div>
<div class="kit-folder kitx__anfragen"${s(2, { fx: "fade", win: "0,.2" })}><p class="kit-folder__head">${c.ico("folder")}${c.t("anfragen/", "requests/")}<span class="file__meta kitx__count"><b${s(2, { fx: "none", win: ".1,.8", count: "0,3,0" })}>3</b> ${c.t("Anfragen", "requests")}</span></p><ol class="kr-row">${reqs}</ol></div>
<div class="kitx__start">${start.map((name, i) => file("md", name, "", { cls: i === 0 ? "file--accent" : "", attrs: s(2, { fx: "pop", win: stagger(i, 3, 0.4, 0.4, 1) }) })).join("")}</div>
<figure class="qr kitx__qr"${s(3, { fx: "pop", win: "0,.6" })}>${qr}<figcaption><span>loehrning.ai${c.site}/workshops/</span><span>esg-berichte-mit-ki</span></figcaption></figure>
<div class="kitx__stats"${s(3, { win: ".2,.6" })}>${stat(3, c.t("Anfragen", "requests"), ".3,.85")}${stat(5, "Prompts", ".45,.95")}</div>
</div>
${foot(c, 7)}`,
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
    { id: "durchsicht", label: c.t("Durchsicht ohne Claude", "Review without Claude"), steps: 2, durations: "1300,3400,1500" },
    `<header class="hd hd--row"><div><p class="label">${c.t("Schritt 0 · auf Papier", "Step 0 · on paper")}</p><h2 class="headline headline--m ds__h"><span class="ds__q"${s(0, { fx: "fade", win: "0,.4", out: 2, outWin: "0,.35" })}>${c.t("Was stimmt nicht?", "What is wrong?")}</span><span class="ds__a"${s(2, { fx: "pop", win: ".3,.8" })} style="--origin:left center">${c.t("8 Mängel, 1 saubere Datei", "8 defects, 1 clean file")}</span></h2></div>${now(c, c.t("Jetzt ihr · 10 Min · ohne Claude", "Your turn · 10 min · without Claude"), s(0, { fx: "pop", win: ".4,.9" }))}</header>
<div class="stage ds"><div class="ds__grid"${s(0, { fx: "fade", win: "0,.4" })}>${cards}<p class="ds__count"${s(1, { fx: "pop", win: "0,.15" })}><b${s(1, { fx: "none", win: "0,1", count: "0,8,0" })}>8</b><span>${c.t("Mängel gefunden", "defects found")}</span></p></div></div>
${foot(c, 8)}`,
  );
}
