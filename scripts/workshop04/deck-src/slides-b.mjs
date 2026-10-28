/**
 * Workshop 04 deck, slides 10 to 17 and the appendix: the Claude project, the five steps Tim runs live
 * in Claude Desktop, the measured run and the take-home. Each function returns one <section>.
 * Kit files travel into the window as stage-level copies (fly() in parts.mjs, geometry.mjs).
 */
import { geo } from "./geometry.mjs";
import { activity, cw, cwFile, cwSide, esc, FILES, file, fly, foot, head, job, liveHead, pollMini, pollOptions, prompt, REQUESTS, s, section, stagger } from "./parts.mjs";

const act = (c, k, win, icon, html, done = true) => `<p class="cw-act"${done ? " data-done" : ""}${s(k, { fx: "pop", win })} style="--origin:left center">${c.ico(icon)}${html}</p>`;

/** A row label and its action, as Claude's activity list shows it. */
const code = (text) => `<code>${esc(text)}</code>`;

/** The window of file i of 13 travelling into the project, and the moment it lands. */
const flyWin = (i) => stagger(i, 13, 0.34, 0.04, 1);
const landWin = (i) => {
  const end = Number(flyWin(i).split(",")[1]);
  return `${Math.max(0, end - 0.06).toFixed(3)},${end.toFixed(3)}`;
};

export function project(c) {
  const files = FILES[c.lang];
  const g = geo(c, "pj", {});
  const instrName = c.de ? "projektanweisungen.md" : "project-instructions.md";
  const list = files
    .map(([ext, name], i) => `<li class="pjk__row"><span class="pjk__src"${s(2, { fx: "dim", win: flyWin(i) })}><span class="pjk__ext">${ext}</span><span class="pjk__name">${esc(name)}</span></span><span class="pjk__ok"${s(2, { fx: "pop", win: landWin(i) })}>${c.ico("check", "ico--bold")}</span></li>`)
    .join("");
  const slots = files.map(([ext, name]) => `<span class="pjv__f pjv__slot"><i>${ext}</i>${esc(name)}</span>`).join("");
  const flyers = files.map(([ext, name], i) => fly(`<i>${ext}</i>${esc(name)}`, g.files?.[i], { k: 2, win: flyWin(i), cls: "pjv__f", lift: 70 + (i % 3) * 30 })).join("");
  const rules = c.de
    ? ["Stichtag 16.10.2026", "1 · Nur unsere Dateien", "2 · Datei und Zeile, rechnen im Code", "3 · Nachweisprobe: drei Status"]
    : ["Reference date 16.10.2026", "1 · Only our files", "2 · File and line, calculate in code", "3 · Evidence check: three statuses"];
  const side = cwSide(c, {
    project: true,
    projAttrs: s(0, { fx: "pop", win: ".75,1" }),
    toggle: `<p class="cw-toggle pjv__toggle"${s(3, { fx: "glow", win: "0,.5" })}><span>Code execution</span><i class="pjv__switch"${s(3, { fx: "none", win: ".2,.7", ease: "spring" })}></i></p>`,
  });
  const main = `<div class="pjv"><p class="pjv__crumb">Projects · ${c.t("neu", "new")}</p><h3 class="pjv__title"><span${s(0, { fx: "type", win: ".15,.75", ease: "linear" })}>${esc(c.kit.project)}</span></h3>
<div class="pjv__grid"><div class="pjv__card"><p class="pjv__h">${c.ico("policy")}Instructions</p><p class="pjv__src"><span class="pjv__f pjv__slot"><i>md</i>${instrName}</span></p>${rules.map((rule, i) => `<p class="pjv__rule${i === 0 ? " pjv__rule--date" : ""}"${s(1, { fx: "pop", win: stagger(i, rules.length, 0.3, 0.45, 1) })} style="--origin:left center">${esc(rule)}</p>`).join("")}</div>
<div class="pjv__card pjv__card--files"><p class="pjv__h">${c.ico("book")}Project knowledge<em><b${s(2, { fx: "none", win: ".1,1", count: "0,13,0" })}>13</b> files</em></p><div class="pjv__files">${slots}</div></div></div></div>`;
  return section(
    { id: "projekt", label: c.t("Projekt anlegen", "Create the project"), steps: 3, durations: "1700,1700,3200,1300" },
    `${liveHead(c, c.t("Einrichten", "Set up"), [
      [c.t("Neues Projekt", "New project"), 0, "0,.4", 1, "0,.3"],
      [c.t("Anweisungen einfügen", "Paste instructions"), 1, ".05,.4", 2, "0,.3"],
      [c.t("13 Dateien laden", "Upload 13 files"), 2, ".05,.4", 3, "0,.3"],
      [c.t("Codeausführung an", "Code execution on"), 3, ".1,.5"],
    ], c.t("Das Kit wird ein <em>Claude-Projekt</em>", "The kit becomes a <em>Claude project</em>"))}
<div class="stage pj">
<div class="kit-folder pjk"><p class="kit-folder__head">${c.ico("folder")}${c.t("ordner/", "files/")}<span class="file__meta" style="margin-left:auto">13</span></p><ol class="pjk__list">${list}</ol><div class="pjk__instr"${s(1, { fx: "dim", win: "0,.4" })}>${file("md", instrName, "")}</div>${job(c, c.t("Ihr erklärt:", "You explain:"), c.t("Warum kommen die Anfragen nicht ins Projekt?", "why do the requests stay out of the project?"), s(2, { fx: "pop", win: ".55,1" }) + ' style="--origin:left center"', "pjk__job")}</div>
${cw(c, { crumbs: ["Projects", c.kit.project], side, cls: "pj__cw", attrs: s(0, { fx: "fly", win: "0,.6" }), style: "--dy:50px;--s:.97" }, main)}
${fly(`<i>md</i>${instrName}`, g.instr, { k: 1, win: "0,.42", cls: "pjv__f", lift: 120 })}
${flyers}
</div>
${foot(c, 10)}`,
  );
}

/** The project's chats as the sidebar lists them after hands-on step n, newest first, the current one lit. */
function chats(c, n) {
  const names = c.de ? ["Fragebogen Nordvik", "Werbeaussagen", "Bankformular", "Nachweisregister"] : ["Nordvik questionnaire", "Marketing claims", "Bank form", "Evidence register"];
  return names.slice(0, n).reverse().map((name, i) => [name, i === 0]);
}

/** A room prediction with the engine poll, 0 to max, over the empty chat. */
function predict(c, name, question, options, o = {}) {
  const opts = pollOptions(options);
  const poll = opts.map(([value, label]) => `<button class="poll__opt" type="button" data-poll="${name}" data-value="${value}"><span class="poll__key">${label}</span><b data-poll-n>0</b></button>`).join("");
  return `<div class="predict surface surface--strong${o.cls ? ` ${o.cls}` : ""}"${s(0, { fx: "pop", win: ".1,.6", out: o.out ?? 1, outWin: "0,.3" })}><p class="predict__q"><span class="lead">${c.t("Ihr schätzt:", "You predict:")}</span> ${question}</p><div class="poll poll--row${typeof options === "number" ? "" : " poll--range"}" data-poll-show="${name}" style="--n:${opts.length}">${poll}</div></div>`;
}

/** Left column of a hands-on slide: the kit's request folder with the one in use lit. */
function requestFolder(c, active, attrs = "") {
  const rows = REQUESTS[c.lang].map((name, i) => file("md", name, "", { cls: i === active ? "file--accent" : "" })).join("");
  return `<div class="kit-folder hs__kit"${attrs}><p class="kit-folder__head">${c.ico("folder")}${c.t("anfragen/", "requests/")}</p>${rows}</div>`;
}

/** The attachment as it sits in the composer before it is sent. */
const att = (html, attrs = "") => `<span class="cw-att"${attrs}>${html}</span>`;

export function step1(c) {
  const st = c.status;
  const g = geo(c, "s1", {});
  const strom = c.de ? "strom_2025.csv" : "electricity_2025.csv";
  const q = c.de
    ? [["Q1", "Strom 2025", `${c.dv("mwh11")} MWh, 11 von 12 Monaten`, "luecke"], ["Q2", "Scope 1 und 2", "keine Bilanz, kein Faktor", "luecke"], ["Q3", "Beschäftigte", "42, davon 6 befristet", "belegt"], ["Q4", "Arbeitsunfälle", "2 meldepflichtig, 0 tödlich", "belegt"], ["Q5", "Korruption", "keine, Erklärung 15.01.2026", "belegt"], ["Q6", "Glasgewicht", "Reserve 560 g, über 420 g", "belegt"], ["Q7", "Zertifikate", "Bio abgelaufen, Termin 22.10.", "schwach"], ["Q8", "Wasser", `${c.dv("waterM3")} m³, 12 von 12`, "belegt"]]
    : [["Q1", "Electricity 2025", `${c.dv("mwh11")} MWh, 11 of 12 months`, "luecke"], ["Q2", "Scope 1 and 2", "no inventory, no factor", "luecke"], ["Q3", "Employees", "42, of them 6 fixed-term", "belegt"], ["Q4", "Work accidents", "2 recordable, 0 fatal", "belegt"], ["Q5", "Corruption", "none, statement 15.01.2026", "belegt"], ["Q6", "Glass weight", "Reserve 560 g, over 420 g", "belegt"], ["Q7", "Certificates", "organic expired, audit 22.10.", "schwach"], ["Q8", "Water", `${c.dv("waterM3")} m³, 12 of 12`, "belegt"]];
  const rows = q
    .map(([id, what, answer, tone], i) => `<tr${id === "Q1" ? " data-mark" : ""}${s(3, { fx: "pop", win: stagger(i, 8, 0.25, 0.15, 0.8) })} style="--origin:left center"><td>${id}</td><td>${what}</td><td>${answer}</td><td>${c.chip(tone, "chip--s")}</td></tr>`)
    .join("");
  const [hx, hy] = g.hop || [0, 0];
  const share = c.de ? `<span class="nw">(${c.dv("coverage")} %)</span>` : `<span class="nw">(${c.dv("coverage")}%)</span>`;
  // Step 1 attaches the questionnaire, step 2 sends prompt 1 and Claude runs its code, step 3 answers.
  const thread = `<div class="cw-thread">
<div class="cw-files"${s(2, { fx: "fly", win: "0,.3" })} style="--dx:${hx}px;--dy:${hy}px;--s:1">${cwFile("MD", REQUESTS[c.lang][0], c.t("8 Fragen", "8 questions"))}</div>
${prompt(c, 1, s(2, { fx: "pop", win: ".15,.45" }) + ' style="--origin:right top"')}
${activity(c, c.t("4 Schritte", "4 steps"), [
    act(c, 2, ".45,.6", "check", `Read ${code(strom)}`),
    act(c, 2, ".55,.72", "check", `Ran code ${code("len(set(months))")} → ${c.dv("rows")} ${c.t("Zeilen", "rows")}, ${c.dv("months")} ${c.t("Monate", "months")}`),
    act(c, 2, ".65,.82", "check", `${c.t("alle Zeilen", "all rows")} ${c.dv("mwhNaive")} MWh · ${c.t("eindeutige Monate", "distinct months")} ${c.dv("mwh11")} MWh`),
    act(c, 2, ".75,.92", "check", `Read ${code(c.de ? "personal_2025.csv" : "headcount_2025.csv")}, ${code(c.de ? "flaschen.csv" : "bottles.csv")}`),
  ], s(2, { fx: "pop", win: ".38,.5", out: 3, outWin: "0,.2" }) + ' style="--origin:left top"')}
<div class="cw-answer"${s(3, { fx: "blur", win: ".1,.4" })}><p>${c.t("Q1 kann ich nicht belegen:", "I cannot cover Q1:")} <span class="cw-cite"${s(3, { fx: "glow", win: ".5,.9" })}>${strom} · ${c.t("Z. 3 bis 14", "l. 3 to 14")}</span> ${c.t("deckt", "covers")} <b>${c.t("11 von 12 Monaten", "11 of 12 months")}</b> ${share}.</p>
<table class="cw-table"><thead><tr><th>#</th><th>${c.t("Frage", "Question")}</th><th>${c.t("Antwort", "Answer")}</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>
</div>`;
  const tally = ["belegt", "schwach", "luecke"]
    .map((tone, i) => `<li${s(4, { fx: "pop", win: stagger(i, 3, 0.4, 0.3, 1) })} style="--origin:left center">${c.chip(tone)}<b${s(4, { fx: "none", win: stagger(i, 3, 0.4, 0.3, 1), count: `0,${[5, 1, 2][i]},0` })}>${[5, 1, 2][i]}</b></li>`)
    .join("");
  const ghost = att(cwFile("MD", REQUESTS[c.lang][0], c.t("8 Fragen", "8 questions")), ' data-ghost aria-hidden="true"');
  const mini = pollMini(c, "s1", pollOptions(8), "5", { k: 1, win: ".25,.6", ring: [4, ".5,.9"], cls: "hs__mini" });
  return section(
    { id: "schritt-1", label: c.t("Schritt 1: Fragebogen des Importeurs", "Step 1: The importer's questionnaire"), steps: 4, durations: "1300,2200,2800,3000,2200" },
    `${liveHead(c, c.t("Schritt 1 von 5", "Step 1 of 5"), [
      [c.t("Neuer Chat", "New chat"), 0, "0,.4", 1, "0,.2"],
      [c.t("Fragebogen anhängen", "Attach questionnaire"), 1, ".25,.6", 2, "0,.15"],
      [c.t("Prompt 1 senden", "Send prompt 1"), 2, ".15,.45", 3, "0,.2"],
      [c.t("Stromdatei öffnen", "Open electricity CSV"), 3, ".5,.85"],
    ], c.t("Der Importeur zählt nur belegte Antworten", "The importer counts only answers with evidence"))}
<div class="stage hs">
<div class="hs__left">${requestFolder(c, 0, s(0, { fx: "fade", win: "0,.2", out: 4, outWin: "0,.25" }))}${mini}${job(c, c.t("Ihr prüft:", "You check:"), c.t("Decken Z. 3 bis 14 alle 12 Monate?", "do l. 3 to 14 cover all 12 months?"), s(2, { fx: "pop", win: ".7,1", out: 4, outWin: "0,.25" }) + ' style="--origin:left center"', "hs__job")}<div class="kit-folder hs__know"${s(4, { fx: "pop", win: ".2,.5" })} style="--origin:left center"><p class="kit-folder__head">${c.ico("book")}Project knowledge</p>${file("csv", strom, c.t("Z. 3 bis 14", "l. 3 to 14"), { cls: "file--accent", attrs: s(4, { fx: "glow", win: ".5,.9" }) })}</div><ol class="tally">${tally}</ol></div>
<div class="hs__right">
${predict(c, "s1", c.t(`Wie viele der 8 Fragen sind <em>${st.belegt}</em>?`, `how many of the 8 questions are <em>${st.belegt}</em>?`), 8)}
<div class="hs__lens"><div class="hs__cam">${cw(c, { crumbs: [c.kit.project, c.t("Fragebogen Nordvik", "Nordvik questionnaire")], side: cwSide(c, { chats: chats(c, 1) }), cls: "hs__cw", attrs: s(1, { fx: "fly", win: "0,.3" }), style: "--dy:60px;--s:.97", att: ghost }, thread)}</div></div>
</div>
${fly(cwFile("MD", REQUESTS[c.lang][0], c.t("8 Fragen", "8 questions")), g.compose, { k: 1, win: ".3,.7", out: 2, outWin: "0,.08", cls: "fly--cw", lift: 140 })}
</div>
${foot(c, 11)}`,
  );
}

export function step2(c) {
  const g = geo(c, "s2", {});
  const where = { Rückenetikett: "bottle", Website: "globe", Regalkarte: "label", "back label": "bottle", website: "globe", "shelf card": "label" };
  const claims = c.de
    ? [["C1", "„Klimaneutraler Wein“", "Rückenetikett", "4c"], ["C2", "„Umweltfreundliches Weingut“", "Website", "4a"], ["C3", "„Zertifizierte Bio-Weinberge“", "Regalkarte", "4b"], ["C4", "„Solarbetriebenes Weingut“", "Website", "x"], ["C5", "„2025 haben wir 12 % weniger Strom verbraucht“", "Website", "x"], ["C6", "„Diese Flasche wiegt nur 395 g und besteht zu 60 % aus Recyclingglas“", "Rückenetikett", ""], ["C7", `„2025 hat das ganze Weingut ${c.v.waterM3} m³ Wasser entnommen, gemessen auf 12 Monatsrechnungen“`, "Website", ""]]
    : [["C1", "“Climate neutral wine”", "back label", "4c"], ["C2", "“Eco-friendly winery”", "website", "4a"], ["C3", "“Certified organic vineyards”", "shelf card", "4b"], ["C4", "“Solar powered winery”", "website", "x"], ["C5", "“In 2025 we used 12 % less electricity”", "website", "x"], ["C6", "“This bottle weighs only 395 g and is 60 % recycled glass”", "back label", ""], ["C7", `“In 2025 the whole winery withdrew ${c.v.waterM3} m³ of water, measured on 12 monthly bills”`, "website", ""]];
  let struck = 0;
  const stickers = claims
    .map(([id, claim, place, ban], i) => {
      const k = ban === "x" ? 3 : 2;
      const n = ban ? struck++ % 3 : 0;
      const line = stagger(n, 3, 0.4, 0.15, 0.85);
      const end = Number(line.split(",")[1]);
      const quote = ban ? `<span class="sticker__q" data-keep${s(k, { fx: "none", win: line })}>${claim}</span>` : `<span class="sticker__q">${claim}</span>`;
      const verdict = ban
        ? `<span class="sticker__tag"${s(k, { fx: "pop", win: `${(end - 0.04).toFixed(3)},${Math.min(1, end + 0.15).toFixed(3)}` })}>${c.ico("ban", "ico--bold")}${ban === "x" ? c.t("kein Beleg", "no evidence") : `${c.t("Verbotsliste", "Ban list")} ${ban}`}</span>`
        : `<span class="sticker__ok"${s(3, { fx: "pop", win: stagger(i - 5, 2, 0.4, 0.5, 1) })}>${c.chip("belegt")}</span>`;
      const tilt = [-1.5, 1.2, 1.5, -1.2, -1, 1.4, -1.4][i];
      return `<div class="sticker${ban ? " sticker--ban" : " sticker--ok"}"${s(0, { fx: "pop", win: stagger(i, 7, 0.4) })} style="--tilt:${tilt}deg"><span class="sticker__id">${id}<span class="sticker__where">${c.ico(where[place])}${place}</span></span><p class="sticker__claim">${quote}</p>${verdict}${ban ? `<i class="sticker__veil"${s(k, { fx: "fade", win: `${end.toFixed(3)},1` })}></i>` : ""}</div>`;
    })
    .join("");
  const [hx, hy] = g.hop || [0, 0];
  const thread = `<div class="cw-thread">
<div class="cw-files"${s(1, { fx: "fly", win: ".12,.45" })} style="--dx:${hx}px;--dy:${hy}px;--s:1">${cwFile("MD", REQUESTS[c.lang][1], c.t("7 Aussagen", "7 claims"))}</div>
${prompt(c, 2, s(1, { fx: "pop", win: ".35,.8" }) + ' style="--origin:right top"')}
${activity(c, c.t("3 Schritte", "3 steps"), [
    act(c, 2, ".05,.35", "check", `Read ${code(c.de ? "regeln_werbeaussagen.md" : "green_claims_rules.md")}`),
    act(c, 2, ".3,.6", "check", `${c.t("Verbotsliste", "Ban list")} ${code("4a 4b 4c 2a")}`),
    act(c, 3, ".05,.35", "check", `${c.t("Nachweisprobe", "Evidence check")} · 7 ${c.t("Aussagen", "claims")}`),
  ], s(2, { fx: "pop", win: "0,.2" }) + ' style="--origin:left top"')}
<div class="cw-answer"${s(4, { fx: "blur", win: "0,.5" })}><p>${c.t("Raus dürfen nur <b>C6</b> und <b>C7</b>. C6 ohne „nur“: ein Vergleich ohne Nachweis.", "Only <b>C6</b> and <b>C7</b> may go out. C6 without “only”: a comparison without evidence.")}</p></div>
</div>`;
  const waiting = att(cwFile("MD", REQUESTS[c.lang][1], c.t("7 Aussagen", "7 claims")), s(0, { fx: "pop", win: ".35,.8", out: 1, outWin: "0,.14" }) + ' style="--origin:left center"');
  return section(
    { id: "schritt-2", label: c.t("Schritt 2: Werbeaussagen", "Step 2: Marketing claims"), steps: 4, durations: "1500,1700,2200,2200,1500" },
    `${liveHead(c, c.t("Schritt 2 von 5", "Step 2 of 5"), [
      [c.t("Neuer Chat", "New chat"), 0, "0,.35", 0, ".4,.45"],
      [c.t("Aussagen anhängen", "Attach claims"), 0, ".4,.8", 1, "0,.3"],
      [c.t("Prompt 2 senden", "Send prompt 2"), 1, ".3,.7", 2, "0,.3"],
      [c.t("Verbotsliste öffnen", "Open ban list"), 2, ".05,.4"],
    ], c.t("Welche der 7 Aussagen darf raus?", "Which of the 7 claims may go out?"))}
<div class="stage hs2">
<div class="hs2__left">${cw(c, { crumbs: [c.kit.project, c.t("Werbeaussagen", "Marketing claims")], side: cwSide(c, { chats: chats(c, 2) }), cls: "hs2__cw", attrs: s(0, { fx: "fade", win: "0,.4" }), att: waiting }, thread)}
${predict(c, "s2", c.t("Wie viele der 7 dürfen <em>raus</em>?", "how many of the 7 may go <em>out</em>?"), 7)}
${pollMini(c, "s2", pollOptions(7), "2", { k: 1, win: ".05,.4", ring: [4, ".3,.7"], cls: "hs2__mini" })}</div>
<div class="stickers">${stickers}<div class="stickers__cell"><p class="stickers__end"${s(4, { fx: "pop", win: ".2,.8" })}><b${s(4, { fx: "none", win: ".2,.8", count: "0,2,0" })}>2</b>${c.t("dürfen raus.", "may go out.")}</p>${job(c, c.t("Ihr prüft C6:", "You check C6:"), c.t("Welches Wort muss weg?", "which word must go?"), s(3, { fx: "pop", win: ".55,1", out: 4, outWin: "0,.3" }) + ' style="--origin:left center"', "stickers__job")}</div></div>
</div>
${foot(c, 12)}`,
  );
}

export function step3(c) {
  const g = geo(c, "s3", {});
  const f = c.de
    ? [["F1", "Bußgelder 2023 bis 2025", "keine", "belegt"], ["F2", "Strom 2025, ganzes Jahr", `${c.v.mwh11} MWh, 11 Monate`, "luecke"], ["F3", "PV-Ertrag und Anteil", "180 MWh, nur geschätzt", "luecke"], ["F4", "Amortisation", "", "schwach"], ["F5", "Beschäftigte, Unfälle", "42; 2 Unfälle", "belegt"], ["F6", "Zertifikate, Audits", "Bio abgelaufen", "schwach"]]
    : [["F1", "Fines 2023 to 2025", "none", "belegt"], ["F2", "Electricity 2025, full year", `${c.v.mwh11} MWh, 11 months`, "luecke"], ["F3", "PV yield and share", "180 MWh, estimate only", "luecke"], ["F4", "Payback", "", "schwach"], ["F5", "Employees, accidents", "42; 2 accidents", "belegt"], ["F6", "Certificates, audits", "organic expired", "schwach"]];
  let n = 0;
  const rows = f
    .map(([id, label, value, tone]) => {
      if (id === "F4") {
        return `<li class="ff ff--f4"><b class="ff__id">${id}</b><span class="ff__l">${label}</span><span class="ff__v"><span${s(3, { fx: "pop", win: ".75,1" })}>${c.dv("payback")} ${c.t("Jahre", "years")}</span></span><span${s(3, { fx: "pop", win: ".8,1" })}>${c.chip(tone)}</span></li>`;
      }
      const win = stagger(n++, 5, 0.32);
      return `<li class="ff"><b class="ff__id">${id}</b><span class="ff__l">${label}</span><span class="ff__v"><span${s(2, { fx: "type", ease: "linear", win })}>${value}</span></span><span${s(2, { fx: "pop", win: stagger(n - 1, 5, 0.3, 0.1, 1) })}>${c.chip(tone)}</span></li>`;
    })
    .join("");
  const src = (key, unit, from, i) => `<span class="fx__src"${s(0, { fx: "pop", win: stagger(i, 3, 0.3, 0.4, 0.9) })}><b>${c.dv(key)}</b> ${unit}<small>${from}</small></span>`;
  const slot = (key, i) => `<span class="fx__slot"${s(3, { fx: "move", win: stagger(i, 3, 0.3, 0.3, 0.8) })} style="--dy:-92px;--dx:${[-40, 40, 160][i]}px">${c.v[key]}</span>`;
  const [hx, hy] = g.hop || [0, 0];
  const thread = `<div class="cw-thread">
<div class="cw-files"${s(1, { fx: "fly", win: ".12,.45" })} style="--dx:${hx}px;--dy:${hy}px;--s:1">${cwFile("MD", REQUESTS[c.lang][2], c.t("6 Felder", "6 fields"))}</div>
${prompt(c, 3, s(1, { fx: "pop", win: ".35,.8" }) + ' style="--origin:right top"')}
${activity(c, c.t("3 Schritte", "3 steps"), [
    act(c, 2, ".05,.35", "check", `Read ${code(c.de ? "pv_angebot_2026.txt" : "solar_offer_2026.txt")}`),
    act(c, 2, ".3,.6", "check", `Read ${code(c.de ? "strom_2025.csv" : "electricity_2025.csv")}`),
    act(c, 3, ".1,.4", "code", `Ran code ${code("8550000 / (180000 * 9.50)")} → 5.0`),
  ], s(2, { fx: "pop", win: "0,.2" }) + ' style="--origin:left top"')}
<div class="cw-answer"${s(3, { fx: "blur", win: ".5,.9" })}><p>${c.t("Die Rechnung stimmt. Belegt ist sie nicht: Das Angebot ist nicht unterschrieben.", "The arithmetic is right. Covered it is not: the offer is unsigned.")}</p></div>
</div>`;
  const waiting = att(cwFile("MD", REQUESTS[c.lang][2], c.t("6 Felder", "6 fields")), s(0, { fx: "pop", win: ".35,.8", out: 1, outWin: "0,.14" }) + ' style="--origin:left center"');
  return section(
    { id: "schritt-3", label: c.t("Schritt 3: Formular der Bank", "Step 3: The bank's form"), steps: 3, durations: "1300,1700,2400,2800" },
    `${liveHead(c, c.t("Schritt 3 von 5", "Step 3 of 5"), [
      [c.t("Neuer Chat", "New chat"), 0, "0,.3", 0, ".35,.4"],
      [c.t("Formular anhängen", "Attach form"), 0, ".35,.7", 1, "0,.3"],
      [c.t("Prompt 3 senden", "Send prompt 3"), 1, ".3,.7", 3, "0,.3"],
      [c.t("Angebot öffnen", "Open the offer"), 3, ".5,.9"],
    ], c.t("Die Bank will jede Schätzung gekennzeichnet", "The bank wants every estimate marked"))}
<div class="stage hs3">
${cw(c, { crumbs: [c.kit.project, c.t("Bankformular", "Bank form")], side: cwSide(c, { chats: chats(c, 3) }), cls: "hs3__cw", attrs: s(0, { fx: "fade", win: "0,.4" }), att: waiting }, thread)}
<div class="form surface surface--strong"${s(0, { fx: "pop", win: "0,.6" })}><div class="form__head"><span class="ico-tile">${c.ico("bank")}</span><div><b>Banka Povardarie AD Skopje</b><span>${c.t("Kredit", "Loan")} ${c.dv("pvPrice")} MKD · PV 150 kWp</span></div></div><ol class="form__rows">${rows}</ol>
<div class="fx">${job(c, c.t("Ihr rechnet:", "You calculate:"), `${c.v.pvPrice} ÷ (${c.v.pvYieldKwh} × ${c.v.tariff})`, s(0, { fx: "pop", win: ".5,1", out: 3, outWin: "0,.3" }) + ' style="--origin:left center"', "fx__job")}
<div class="fx__srcs">${src("pvPrice", "MKD", c.t("Angebot Z. 9", "offer l. 9"), 0)}${src("pvYieldKwh", "kWh", c.t("Angebot Z. 8, geschätzt", "offer l. 8, estimate"), 1)}${src("tariff", "MKD/kWh", c.de ? "strom_2025.csv" : "electricity_2025.csv", 2)}</div>
<p class="fx__eq"${s(3, { fx: "fade", win: ".25,.4" })}>F4 = ${slot("pvPrice", 0)} ÷ ( ${slot("pvYieldKwh", 1)} × ${slot("tariff", 2)} ) = <b${s(3, { fx: "pop", win: ".75,1" })}>${c.v.payback}</b></p>
${job(c, c.t("Ihr prüft:", "You check:"), c.t("Wer hat das Angebot unterschrieben?", "who signed the offer?"), s(3, { fx: "pop", win: ".8,1" }) + ' style="--origin:left center"', "fx__job")}</div></div>
</div>
${foot(c, 13)}`,
  );
}

const LEDGER = {
  Q: ["luecke", "luecke", "belegt", "belegt", "belegt", "belegt", "schwach", "belegt"],
  C: ["luecke", "luecke", "luecke", "luecke", "luecke", "belegt", "belegt"],
  F: ["belegt", "luecke", "luecke", "schwach", "belegt", "schwach"],
};
const VSME = [["B1", "8/8", "belegt"], ["B2", "4/4", "belegt"], ["B3", "0/4", "luecke"], ["B4", "0/1", "luecke"], ["B5", "0/1", "luecke"], ["B6", "1/1", "belegt"], ["B7", "1/4", "luecke"], ["B8", "2/2", "belegt"], ["B9", "2/3", "luecke"], ["B10", "1/3", "luecke"], ["B11", "1/1", "belegt"]];

export function register(c) {
  // Step 0 attaches the three requests, step 1 sends prompt 4, step 2 shows the register (9 BELEGT),
  // step 3 the VSME sheet and the room's tip, step 4 Claude's list of what to request first.
  let i = 0;
  const rows = Object.entries(LEDGER)
    .map(([letter, tones]) => `<div class="reg__row"${s(1, { fx: "fade", win: ".3,.6" })}><span class="reg__l">${letter}</span><div class="tiles reg__tiles" style="--cols:8">${tones.map((tone, n) => `<div class="tile"${s(2, { fx: "flip", win: stagger(i++, 21, 0.3) })}><span class="face">${letter}${n + 1}</span><span class="face face--back" data-tone="${tone}">${letter}${n + 1}</span></div>`).join("")}</div></div>`)
    .join("");
  const vsme = VSME.map(([id, part, tone], n) => `<div class="tile"${s(3, { fx: "flip", win: stagger(n, 11, 0.35, 0.15, 0.8) })}><span class="face">${id}</span><span class="face face--back" data-tone="${tone}">${id}<small>${part}</small></span></div>`).join("");
  const asks = c.de
    ? [["Stromrechnung September 2025", "EL-25-09", "6"], ["Netz-Emissionsfaktor, veröffentlicht", "", "2"], ["Dieselbelege 2025", "", "2"]]
    : [["Electricity invoice September 2025", "EL-25-09", "6"], ["Grid emission factor, published", "", "2"], ["Diesel receipts 2025", "", "2"]];
  const answer = `<div class="cw-answer reg__ans"${s(4, { fx: "fade", win: "0,.2" })}><p>${c.t("Zuerst anfordern, nach Zahl der wartenden Antworten:", "Request first, by the number of answers waiting:")}</p><ol class="reg__asks">${asks.map(([what, ref, count], n) => `<li${n === 0 ? ' class="reg__top"' : ""}${s(4, { fx: "pop", win: `${(0.15 + n * 0.08).toFixed(2)},${(0.5 + n * 0.08).toFixed(2)}` })} style="--origin:left center"><b>${n + 1}</b><span>${what}${ref ? ` <span class="nw">(${ref})</span>` : ""}</span><em>${count} ${c.t("warten", "waiting")}</em></li>`).join("")}</ol></div>`;
  const thread = `<div class="cw-thread">
<div class="cw-files"${s(0, { fx: "fly", win: ".2,.7" })} style="--dx:0px;--dy:-80px;--s:.9">${REQUESTS[c.lang].map((name) => cwFile("MD", name, c.t("Anfrage", "request"))).join("")}</div>
${prompt(c, 4, s(1, { fx: "pop", win: "0,.3" }) + ' style="--origin:right top"')}
${activity(c, c.t("21 Zeilen", "21 rows"), [
    act(c, 1, ".35,.6", "check", `${c.t("Nachweisprobe", "Evidence check")} · Q1 … F6`),
    act(c, 2, ".05,.3", "file", `Wrote ${code(c.de ? "nachweisregister.xlsx" : "evidence_register.xlsx")}`),
  ], s(1, { fx: "pop", win: ".25,.35" }) + ' style="--origin:left top"')}
${answer}
</div>`;
  const ranges = c.de ? ["0 bis 5", "6 bis 10", "11 bis 15", "16 bis 21"] : ["0 to 5", "6 to 10", "11 to 15", "16 to 21"];
  return section(
    { id: "register", label: c.t("Schritt 4: Nachweisregister", "Step 4: Evidence register"), steps: 4, durations: "1500,1800,2800,2200,1700" },
    `${liveHead(c, c.t("Schritt 4 von 5", "Step 4 of 5"), [
      [c.t("Neuer Chat", "New chat"), 0, "0,.3", 0, ".3,.35"],
      [c.t("Anfragen anhängen", "Attach requests"), 0, ".35,.7", 1, "0,.1"],
      [c.t("Prompt 4 senden", "Send prompt 4"), 1, ".05,.35", 2, "0,.1"],
      [c.t("Excel öffnen", "Open Excel file"), 2, ".05,.4"],
    ], c.t("21 Antworten, ein Register", "21 answers, one register"))}
<div class="stage reg">
<div class="reg__left">${cw(c, { crumbs: [c.kit.project, c.t("Nachweisregister", "Evidence register")], side: cwSide(c, { chats: chats(c, 4) }), cls: "reg__cw", attrs: s(0, { fx: "fly", win: "0,.5" }), style: "--dy:60px;--s:.97" }, thread)}</div>
<div class="reg__right">
${predict(c, "reg", c.t(`Wie viele der 21 sind <em>${c.status.belegt}</em>?`, `how many of the 21 are <em>${c.status.belegt}</em>?`), ranges, { cls: "reg__poll" })}
<div class="reg__count"${s(1, { fx: "fade", win: ".3,.6" })}><b class="stat__n"${s(2, { fx: "none", win: ".1,.95", count: "0,9,0" })}>${c.dv("belegtBefore")}</b><span class="reg__of">/ 21 ${c.chip("belegt")}</span><span class="reg__legend"${s(2, { fx: "fade", win: ".7,1" })}>${c.chip("schwach")} 3 ${c.chip("luecke", "chip--quiet")} 9</span></div>
${rows}
<div class="reg__row reg__row--vsme"${s(3, { fx: "fade", win: "0,.2" })}><p class="reg__vcap">${c.t("VSME · EU-Standard für KMU", "VSME · EU standard for SMEs")}</p><span class="reg__l"></span><div class="tiles reg__vsme" style="--cols:11">${vsme}</div></div>
${pollMini(c, "reg", pollOptions(ranges), "b", { k: 1, win: ".4,.8", out: 3, outWin: "0,.25", ring: [2, ".8,1"], cls: "reg__mini" })}
${job(c, c.t("Ihr tippt:", "Your guess:"), c.t("Welches fehlende Dokument blockiert die meisten Antworten?", "which missing document blocks the most answers?"), s(3, { fx: "pop", win: ".5,.9" }) + ' style="--origin:left center"', "reg__job")}
</div>
</div>
${foot(c, 14)}`,
  );
}

/** Monthly kWh of strom_2025.csv in thousands (October counted once); September comes late. */
const KWH = [21.4, 19.8, 20.6, 19.2, 22.5, 26.8, 30.4, 32.1, 41.2, 38.7, 25.3, 22.9];

export function late(c) {
  const g = geo(c, "late", {});
  const max = Math.max(...KWH);
  const bars = [..."JFMAMJJASOND"]
    .map((m, i) => {
      const h = (KWH[i] / max).toFixed(3);
      if (i === 8) return `<li class="bars__m bars__m--miss"><i class="bars__slot"><span>?</span></i><i class="bars__b bars__b--new" style="--h:${h}"${s(3, { fx: "grow", ease: "spring", win: ".05,.55" })}></i><span class="bars__l">${m}</span></li>`;
      return `<li class="bars__m"><i class="bars__b" style="--h:${h}"${s(0, { fx: "grow", win: stagger(i > 8 ? i - 1 : i, 11, 0.3, 0.05, 0.9) })}></i><span class="bars__l">${m}</span></li>`;
    })
    .join("");
  const tile = (id, tone, caption) => `<div class="late__t"><div class="tile late__tile"${s(4, { fx: "flip", win: id === "F2" ? "0,.45" : ".15,.6" })}><span class="face" data-tone="luecke">${id}<small>${c.status.luecke}</small></span><span class="face face--back" data-tone="${tone}">${id}<small>${c.status[tone]}</small></span></div><span class="late__cap">${caption}</span></div>`;
  const paper = (o = "") => `<div class="invoice"${o}><p class="invoice__h">${c.t("Rechnung", "Invoice")} EL-25-09</p><p class="invoice__m">${c.t("September 2025", "September 2025")}</p><p class="invoice__k">${c.dv("kwhSep")} kWh</p><i class="invoice__l"></i><i class="invoice__l"></i><i class="invoice__l invoice__l--s"></i></div>`;
  const photo = g.photo || [0, 0, 0, 0, 0, 1];
  const thread = `<div class="cw-thread">
<div class="late__slot"${s(2, { fx: "none", win: "0,.1" })}></div>
${prompt(c, 5, s(2, { fx: "pop", win: ".7,1" }) + ' style="--origin:right top"')}
${activity(c, c.t("3 Schritte", "3 steps"), [
    act(c, 3, ".02,.25", "check", `Read ${code(c.kit.invoice)}`),
    act(c, 3, ".2,.5", "check", `${c.dv("meterNew")} − ${c.dv("meterOld")} = ${c.dv("kwhSep")} kWh`),
    act(c, 4, ".05,.3", "file", `Updated ${code(c.de ? "nachweisregister.xlsx" : "evidence_register.xlsx")}`),
  ], s(3, { fx: "pop", win: "0,.15" }) + ' style="--origin:left top"')}
<div class="cw-answer"${s(4, { fx: "blur", win: ".5,.9" })}><p>${c.t(`${c.dv("cite")} Zeilen zitieren die Stromdatei, 2 ändern ihren Status. Hochgerechnet wären es ${c.dv("mwh1211")} MWh: ${c.dv("short1211")} MWh zu wenig.`, `${c.dv("cite")} rows cite the electricity file, 2 change status. Scaled up it would be ${c.dv("mwh1211")} MWh: ${c.dv("short1211")} MWh too low.`)}</p></div>
</div>`;
  return section(
    { id: "nachreichung", label: c.t("Schritt 5: Die nachgereichte Rechnung", "Step 5: The late invoice"), steps: 4, durations: "1400,2000,2600,2400,2800" },
    `${liveHead(c, c.t("Schritt 5 von 5", "Step 5 of 5"), [
      [c.t("Chat von Schritt 4", "Chat of step 4"), 0, "0,.4", 1, "0,.15"],
      [c.t("Foto anhängen", "Attach photo"), 1, ".3,.7", 2, ".55,.65"],
      [c.t("Prompt 5 senden", "Send prompt 5"), 2, ".65,.95", 4, "0,.3"],
      [c.t("Excel öffnen", "Open Excel file"), 4, ".05,.4"],
    ], c.t("Die Rechnung kommt <em>nach</em>", "The invoice arrives <em>late</em>"))}
<div class="stage late">
<div class="late__left">
${predict(c, "late", c.t("Wie viele der 21 Status ändern sich?", "how many of the 21 statuses change?"), 6, { out: 1, cls: "late__poll" })}
<div class="late__mail"${s(0, { fx: "fade", win: "0,.3", out: 2, outWin: ".05,.3" })}><div class="envelope" data-keep${s(1, { fx: "none", win: ".25,1" })}><div class="envelope__back"></div><div class="envelope__letter">${paper()}</div><div class="envelope__front"></div><div class="envelope__flap"></div></div></div>
${cw(c, { crumbs: [c.kit.project, c.t("Nachweisregister", "Evidence register")], side: cwSide(c, { chats: chats(c, 4) }), cls: "late__cw", attrs: s(2, { fx: "fly", win: "0,.4" }), style: "--dy:60px;--s:.97" }, thread)}
${fly(paper(), photo.slice(0, 5), { k: 2, win: ".1,.75", cls: "late__photo", s: photo[5], lift: 160, h: photo[6] })}
</div>
<div class="late__right">
<p class="label">${c.t("Strom 2025 · MWh je Monat", "Electricity 2025 · MWh per month")}</p>
<ol class="bars">${bars}</ol>
<div class="late__mwh"><b class="stat__n" data-keep${s(3, { fx: "none", win: ".1,.6", count: "279.7,320.9,1" })}>${c.dv("mwh12")}</b><span class="stat__l">MWh · <b data-keep${s(3, { fx: "none", win: ".1,.5", count: "11,12,0" })}>12</b> ${c.t("von 12 Monaten", "of 12 months")}</span></div>
<div class="late__tiles">${pollMini(c, "late", pollOptions(6), "2", { k: 1, win: ".05,.35", ring: [4, ".6,1"], cls: "late__mini" })}${tile("F2", "belegt", c.t("Strom, ganzes Jahr", "electricity, full year"))}${tile("F3", "schwach", `${c.t("PV-Anteil", "PV share")} <span class="late__share"><i${s(0, { fx: "fade", win: "0,.2", out: 4, outWin: ".2,.35" })}>?</i><b data-step="4" data-win=".35,.75" data-fx="none" data-count="0,56.1,1" data-count-unit=" %" data-v="share12">${c.v.share12}</b></span>`)}<div class="late__reg"><b class="stat__n" data-keep${s(4, { fx: "none", win: ".4,.8", count: "9,10,0" })}>10</b><span class="stat__l">/ 21 ${c.status.belegt}</span></div></div>
${job(c, c.t("Ihr rechnet:", "You calculate:"), `${c.dv("meterNew")} minus ${c.dv("meterOld")}`, s(2, { fx: "pop", win: ".75,1", out: 4, outWin: "0,.3" }) + ' style="--origin:left center"', "late__job")}
<p class="late__end"${s(4, { fx: "pop", win: ".7,1" })}>${c.t("Register", "Register")}: ${c.dv("afterBelegt")} ${c.status.belegt} · ${c.dv("afterSchwach")} ${c.status.schwach} · ${c.dv("afterLuecke")} ${c.status.luecke}</p>
</div>
</div>
${foot(c, 15)}`,
  );
}

export function measured(c) {
  const [secs, text] = c.de ? [512, "8:32"] : [470, "7:50"];
  const chip = (win, icon, html) => `<li class="ms__chip"${s(2, { fx: "pop", ease: "spring", win })}>${c.ico(icon, "ico--bold")}${html}</li>`;
  return section(
    { id: "gemessen", label: c.t("Was wir gemessen haben", "What we measured"), steps: 2, durations: "2800,1500,1700" },
    `${head(c.t("Schritte 1 bis 5", "Steps 1 to 5"), c.t("Gemessen, nicht geschätzt", "Measured, not estimated"), { size: "m" })}
<div class="stage ms">
<div class="ms__runs"><div class="ms__run"><svg class="ms__ring" viewBox="0 0 400 400" aria-hidden="true"><circle cx="200" cy="200" r="184" class="ms__track"/><circle${s(0, { fx: "draw", win: ".05,.95" })} pathLength="1" cx="200" cy="200" r="184" class="ms__arc"/></svg><p class="ms__n"><b${s(0, { fx: "none", win: ".05,.95", count: `0,${secs},0` })} data-count-as="mss">${text}</b></p><p class="ms__who">Claude</p><p class="ms__l">${c.t("Median aus 3 Läufen", "median of 3 runs")}</p></div>
<div class="ms__run ms__ghost"${s(1, { fx: "pop", win: "0,.7" })}><svg class="ms__ring" viewBox="0 0 400 400" aria-hidden="true"><circle cx="200" cy="200" r="184" class="ms__dash"/></svg><p class="ms__n ms__n--q">?</p><p class="ms__who">${c.t("Von Hand", "By hand")}</p><p class="ms__l">${c.t("nicht gemessen", "not measured")}</p></div></div>
<ul class="ms__chips">${chip("0,.5", "check", c.t("<b>21 von 21</b> Status richtig · 3 von 3 Läufen", "<b>21 of 21</b> statuses right · 2 of 3 runs"))}${chip(".2,.7", "search", c.t("September-Lücke gefunden nach <b>67 s</b>", "September gap found after <b>52 s</b>"))}</ul>
<p class="ms__tag"${s(2, { win: ".5,1" })}>${c.ico("code")}${c.t("im Terminal gemessen, gleiche Prompts", "measured in the terminal, same prompts")}</p>
</div>
${foot(c, 16)}`,
  );
}

export function takeHome(c, qr) {
  const mini = `<span class="th__mini" aria-hidden="true"><i class="th__bar"><b></b><b></b><b></b></i><i class="th__side"></i><i class="th__bub"></i><i class="th__bub th__bub--a"></i><i class="th__bub th__bub--b"></i></span>`;
  const tile = (i, visual, title, line) => `<div class="th__tile surface surface--strong"${s(0, { fx: "arc", ease: "spring", win: stagger(i, 3, 0.5, 0, 0.8) })} style="--dx:${(1 - i) * 120}px;--dy:260px;--s:.6;--lift:120px">${visual}<b>${title}</b><span>${line}</span></div>`;
  return section(
    { id: "mitnehmen", label: c.t("Mitnehmen", "Take home"), steps: 1, durations: "2100,1400" },
    `${head(c.t("Mitnehmen", "Take home"), c.t("Jede Antwort trägt ihren <em>Nachweis</em>.", "Every answer carries its <em>evidence</em>."), { size: "m" })}
<div class="stage th">
<p class="th__case"${s(0, { fx: "fade", win: "0,.35" })}>${c.ico("envelope")}<span>${c.t("Am 23.10. geht an Nordvik: jede Antwort mit Datei und Zeile, jede Lücke mit dem Dokument, das fehlt.", "On 23.10. Nordvik gets every answer with file and line, every gap with the missing document named.")}</span></p>
<p class="subline th__sub"${s(0, { fx: "fade", win: ".6,1" })}>${c.t("Zu Hause: dieselben fünf Prompts mit eurem Claude.", "At home: the same five prompts with your Claude.")}</p>
<div class="th__tiles">${tile(0, `<span class="th__v th__v--kit">${c.ico("zip")}</span>`, "Kit", c.kit.zip)}${tile(1, `<span class="th__v">${c.ico("spark")}</span>`, "Skill", "esg-nachweise")}${tile(2, mini, "Demo", c.t("im Browser, ohne KI", "in the browser, no AI"))}</div>
<figure class="qr th__qr"${s(0, { fx: "pop", win: ".55,1" })}>${qr}<figcaption><span>loehrning.ai${c.site}/demos/</span><span>esg-berichte-mit-ki</span></figcaption></figure>
<p class="th__human"${s(1, { fx: "pop", win: "0,.6" })}>${c.ico("shield")}${c.t("Ein Mensch prüft und unterschreibt jede Antwort.", "A person checks and signs every answer.")}</p>
</div>
${foot(c, 17)}`,
  );
}

/* ── appendix ───────────────────────────────────────────────────────── */

export function sources(c) {
  const items = c.de
    ? [["Richtlinie (EU) 2024/825", "Anhang I Nr. 2a, 4a, 4b, 4c, 10a: immer verboten. Anwendung seit 27.09.2026, in Deutschland über das UWG."], ["BGH, Urteil vom 27.06.2024, I ZR 98/23", "Wer mit „klimaneutral“ wirbt, erklärt in der Werbung selbst, ob Minderung oder Kompensation gemeint ist."], ["IHK zum Dritten Gesetz zur Änderung des UWG vom 12.02.2026", "Gilt seit 27.09.2026. Neu verboten: eine Umweltaussage, die auf Kompensation von Treibhausgasen beruht."], ["EBRD, Pressemitteilung vom 18.12.2025", "Bis zu 8 Mio. Euro an die Sparkasse Bank Skopje, weitergegeben an KMU für erneuerbare Energie und Energieeffizienz (Green Finance Facility)."], ["Vinmonopolet, Gewichtsvorgabe für Glasflaschen", "Seit 01.01.2026: Stillwein unter 250 NOK in Flaschen von höchstens 420 g je 0,75 l. Eine Pflicht für Lieferanten."], ["Delegierte Verordnung (EU) 2026/1560", "VSME, der freiwillige Standard der EU für KMU, seit 24.09.2026. Basismodul B1 bis B11."], ["Richtlinie (EU) 2026/470", "Begrenzung in der Wertschöpfungskette, Geschäftsjahre ab 1.1.2027 (Anhang 2)."]]
    : [["Directive (EU) 2024/825", "Annex I points 2a, 4a, 4b, 4c, 10a: always banned. Applies since 27.09.2026, in Germany through the UWG."], ["BGH, judgment of 27.06.2024, I ZR 98/23", "Whoever advertises with “climate neutral” explains in the advertisement itself whether reduction or offsetting is meant."], ["IHK on the third act amending the UWG of 12.02.2026", "Applies since 27.09.2026. Newly banned: an environmental claim that rests on offsetting greenhouse gases."], ["EBRD, press release of 18.12.2025", "Up to EUR 8 million to Sparkasse Bank Skopje, lent on to SMEs for renewable energy and energy efficiency (Green Finance Facility)."], ["Vinmonopolet, weight requirement for glass bottles", "Since 01.01.2026: still wine under NOK 250 in bottles of at most 420 g per 0.75 l. A requirement for suppliers."], ["Delegated Regulation (EU) 2026/1560", "VSME, the EU's voluntary standard for SMEs, since 24.09.2026. Basic Module B1 to B11."], ["Directive (EU) 2026/470", "Value-chain cap, financial years from 1.1.2027 (appendix 2)."]];
  return section(
    { id: "anhang-quellen", label: c.t("Anhang: Quellen", "Appendix: Sources"), steps: 0, durations: "900", kind: "appendix" },
    `${head(c.t("Anhang 1 · Quellen", "Appendix 1 · Sources"), c.t("Quellen", "Sources"), { size: "m" })}
<div class="stage ax"><ul class="ax__list surface surface--strong">${items.map(([title, body]) => `<li><b>${esc(title)}</b><span>${esc(body)}</span></li>`).join("")}</ul><p class="src">${c.t("Zusammengefasst in ordner/regeln_werbeaussagen.md und ordner/vsme_basismodul.md. Lernhilfe, keine Rechtsberatung.", "Summarised in files/green_claims_rules.md and files/vsme_basic_module.md. A learning aid, not legal advice.")}</p></div>
${foot(c, 1, true)}`,
  );
}

export function capAppendix(c) {
  const lines = c.de
    ? [[35, "Begrenzung in der Wertschöpfungskette: Für Geschäftsjahre ab dem 1.1.2027 können Firmen mit bis zu"], [36, "1.000 Beschäftigten Fragen berichtspflichtiger Kunden für deren Nachhaltigkeitsbericht ablehnen, die"], [37, "über die Datenpunkte aus Anhang II der Delegierten Verordnung (EU) 2026/1560 hinausgehen (Richtlinie (EU) 2026/470)."], [38, "Anfragen nach anderen EU- oder nationalen Vorschriften (etwa Bankaufsicht, Sorgfaltspflichten) sind"], [39, "nicht begrenzt. Für das Berichtsjahr 2025 gilt die Begrenzung noch nicht."]]
    : [[35, "Value-chain cap: for financial years from 1.1.2027, companies with up to 1,000 employees can refuse"], [36, "questions from reporting customers, for the customer's sustainability report, that go beyond the"], [37, "datapoints in Annex II of Delegated Regulation (EU) 2026/1560 (Directive (EU) 2026/470)."], [38, "Requests under other EU or national rules (such as banking supervision, due diligence) are"], [39, "not capped. For the reporting year 2025 the cap does not apply yet."]];
  return section(
    { id: "anhang-begrenzung", label: c.t("Anhang: Begrenzung in der Wertschöpfungskette", "Appendix: Value-chain cap"), steps: 0, durations: "900", kind: "appendix" },
    `${head(c.t("Anhang 2 · vsme_basismodul.md, Z. 35 bis 39", "Appendix 2 · vsme_basic_module.md, l. 35 to 39"), c.t("Was Kunden ab 2027 verlangen dürfen", "What customers may ask for from 2027"), { size: "m" })}
<div class="stage ax"><div class="doc ax__doc"><div class="doc__head">${c.ico("file")}${c.t("vsme_basismodul.md", "vsme_basic_module.md")}</div><ol class="doc__lines">${lines.map(([n, line]) => `<li${n === 39 ? " data-mark" : ""}><i>${n}</i><span>${esc(line)}</span></li>`).join("")}</ol></div><p class="ax__point">${c.t("Für den Fragebogen dieser Übung gilt die Begrenzung noch nicht: Berichtsjahr 2025 (Z. 39).", "For the questionnaire in this exercise the cap does not apply yet: reporting year 2025 (l. 39).")}</p></div>
${foot(c, 2, true)}`,
  );
}

export function caseAppendix(c) {
  const facts = c.de
    ? [["Wo", "Familienweingut in Kavadarci, Weinbaugebiet Tikveš, Nordmazedonien", "Z. 4"], ["Wer", "42 Beschäftigte im Jahresdurchschnitt 2025, dazu 18 Saisonkräfte zur Lese", "Z. 9"], ["Was", "40 ha eigene Weinberge, 12 ha bio; rund 550.000 Flaschen im Jahr", "Z. 6, 7"], ["Absatz", "74 % des Umsatzes im Export, 31 % nach Deutschland", "Z. 12"], ["Energie", "Strom komplett aus dem Netz; geplant 150 kWp PV, Kredit 8.550.000 MKD", "Z. 13, 18"]]
    : [["Where", "Family winery in Kavadarci, Tikveš wine region, North Macedonia", "l. 4"], ["Who", "42 employees on annual average in 2025, plus 18 seasonal workers for the harvest", "l. 9"], ["What", "40 ha of own vineyards, 12 ha organic; about 550,000 bottles a year", "l. 6, 7"], ["Sales", "74 % of revenue from exports, 31 % from Germany", "l. 12"], ["Energy", "All power from the grid; planned 150 kWp PV, loan 8,550,000 MKD", "l. 13, 18"]];
  return section(
    { id: "anhang-fall", label: c.t("Anhang: Der Fall", "Appendix: The case"), steps: 0, durations: "900", kind: "appendix" },
    `${head(c.t("Anhang 3 · firmenprofil.md", "Appendix 3 · company_profile.md"), "Vinarija Crvena Zemja DOO", { size: "m" })}
<div class="stage ax"><ul class="ax__list ax__facts surface surface--strong">${facts.map(([k, v, line]) => `<li><b>${k}</b><span>${esc(v)}</span><i>${line}</i></li>`).join("")}</ul><p class="ax__point">${c.t("Warum ein Weingut außerhalb der EU: Seine Etiketten stehen in deutschen Regalen. Die Verbotsliste gilt dort für jeden Hersteller.", "Why a winery outside the EU: its labels stand on German shelves. The ban list applies there to every producer.")}</p><p class="src">${c.t("Firma, Personen, Dokumente und Tarif sind erfunden.", "Company, people, documents and tariff are invented.")}</p></div>
${foot(c, 3, true)}`,
  );
}
