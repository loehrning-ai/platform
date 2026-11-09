/**
 * S13 register, step 4 of the method (watch is slides-watch.mjs, safety slides-safety.mjs, close slides-close.mjs). The
 * window shows Claude writing the register; the rows then sort by due date and a date scrubber sets the oracle's counts.
 * Labels on a drawing are figure cells (class fig); captions and sources are counted words. Numbers come from the oracle (data.mjs).
 */
import { esc, fill, spread } from "./motion.mjs";
import { durationText, scrubber, target } from "./scene.mjs";
import { claudeWindow, dolly, takeModel, inFolder, named, progress, promptBubble, promptInputs, takeView } from "./slides-parts.mjs";
import { turnOf } from "./take.mjs";

const img = (label) => ` role="img" aria-label="${esc(label)}"`;
const dateText = (iso, lang) => new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const sentences = (text) => String(text).split(/(?<=\.)\s+/);

/**
 * The cells of a register row as the slides show them: id, paper, date, valid until, owner. The kit's business files are
 * English, so the German edition shows the German word for a paper, a role and the missing mark (copy: register.words);
 * a row with no end date says "no end", a missing paper says "open" (never an empty cell).
 */
export const rowCells = (r, c) => {
  const w = c.s.register.words;
  const missing = r.date === "MISSING";
  return [
    r.id,
    w.papers[r.paper] ?? r.paper,
    missing ? w.missing : r.date,
    r.validUntil || (missing ? w.open : w.noEnd),
    w.owners[r.owner] ?? r.owner,
  ];
};

/** The day a row is due: its valid-until date, today for a missing paper, far in the future for a paper with no end. */
export const dueOf = (r, today) => (r.date === "MISSING" ? today : r.validUntil || "9999-12-31");
/** The rows sorted by due date, earliest first (a stable sort), each with the place it has in the file. */
export const sortedByDue = (rows, today) =>
  rows.map((r, from) => ({ r, from })).sort((a, b) => (dueOf(a.r, today) < dueOf(b.r, today) ? -1 : dueOf(a.r, today) > dueOf(b.r, today) ? 1 : a.from - b.from));

/** S12: step 4. Window on a register table: the window leaves and the table fills, three dates change its counts, a question to it, and the table stays. */
export function register(it, ctx, d, c, T) {
  const t = c.s.register;
  const take = takeView(it, { c, d, takes: T, key: "register", slot: "step4", k: 2, ms: 1200, head: true, out: { take: 3, chip: 3, key: 3, time: 3 }, files: true, time: { id: "time", zone: "l3" }, ids: { take: "take", chip: "chip", key: "key" }, zones: { take: "t", chip: "l1", key: "l2" } });
  const take2 = takeView(it, { c, d, takes: T, key: "register", slot: "ask", k: 6, ms: 1200, out: { take: 7, chip: 7, key: 7 }, tools: false, ids: { take: "take2", chip: "chip2", key: "key2" }, zones: { take: "t2", chip: "l2", key: "l3" } });
  const thread1 = [
    it({ id: "pr", tag: "div", cls: "tk-slot", zone: "t", k: 1, out: 2, html: promptBubble(c, 4, d.prompts.step4) }),
    take.take,
  ].join("");
  // the camera moves in on the window as the register streams (press 2)
  const win = dolly(it, { k: 2, html: claudeWindow(it, { id: "win", brand: c.claudeUi.brand, model: takeModel(take), crumbs: t.win, thread: thread1, k: 1, out: 3, cls: "tk-cw--register", plane: true, zone: null }) });
  // press 0: the kit files the step reads stand on the empty sheet (the folder index, the folder's CSV files, the template);
  // press 1 the prompt window comes over them in its small size
  const inputs = promptInputs(it, d, { out: 2, pick: (paths) => [...inFolder(paths, ["folder", "ordner"], (p) => /-index\.md$|\.csv$/.test(p)), ...named(paths, d.prompts.step4).filter((p) => p.includes("/register.csv"))] });
  const thread2 = [
    it({ id: "pr2", tag: "div", cls: "tk-slot", zone: "t", k: 6, out: 7, html: promptBubble(c, 5, d.prompts.step4b, { full: true }) }),
    take2.take,
  ].join("");
  const win2 = dolly(it, { id: "dolly2", zone: "w2", k: 6, html: claudeWindow(it, { id: "win2", brand: c.claudeUi.brand, model: takeModel(take2), crumbs: t.win, thread: thread2, k: 6, out: 7, zone: null, cls: "tk-cw--register", plane: true }) });

  const none = c.take.noOwner;
  const colNames = [t.cols[0], t.cols[1], t.cols[2], t.cols[3], t.own, t.appr];
  const head6 = colNames.map((x) => `<span>${esc(x)}</span>`).join("");
  const sample = d.register.sample;
  // T9: on the first date (press 4) the rows sort themselves by due date, the earliest first. The rows stand in their sorted
  // order; at press 3 they come in where the file has them (each moved by --d rows) and press 4 carries them home.
  const order = sortedByDue(sample, d.register.today);
  const rowsHtml = order
    .map(({ r, from }, at) => {
      const cells = [...rowCells(r, c), none].map((x, j) => `<span${j === 5 ? ' class="reg__na"' : ""}>${esc(x)}</span>`).join("");
      const due = dueOf(r, d.register.today) <= d.register.today ? " reg__r--due" : "";
      const inner = it({ tag: "span", cls: "reg__in", k: 4, fx: "none", win: spread(at, order.length, 0.05, 0.6), attrs: `data-scene data-keep style="--d:${from - at}"`, html: cells });
      return it({ tag: "p", cls: `reg__r${due}`, k: 3, win: spread(from, sample.length, 0.3, 0.3), html: inner });
    })
    .join("");
  const dates = Object.entries(d.register.byDate);
  // the time machine (round 4): one check day and its four counts, big. The window shows one line per date (the oracle's
  // counts on the three dates, in date order); the date chips set --at on the panel and the lines roll to that date (CSS, at
  // most .45 s). On press 4 the panel rises into place and every count runs up from 0.
  const keys = ["rows", "expired", "expiring", "missing"];
  const line = ([iso, n]) => `<span class="tm__r"><span class="scr__d">${esc(dateText(iso, d.lang))}</span>${keys.map((key) => `<span class="scr__c">${it({ tag: "span", k: 4, win: ".3,.9", fx: "none", count: `0,${n[key]},0`, text: String(n[key]) })}</span>`).join("")}</span>`;
  const labels = `<span class="scr__lb"><span></span>${t.dc.map((x) => `<small>${esc(x)}</small>`).join("")}</span>`;
  const rowsOfDates = `<p class="scr__r"><b class="tm"><span class="tm__s">${dates.map(line).join("")}</span></b>${labels}</p>`;
  // the big count is the count of one check day (the date chips below roll the counts of the later dates)
  const total = d.register.rows;
  // every row of the register as one cell (file order), so the count is a picture: the cells fade in with the count on press 3,
  // and on press 4 the expired, expiring and missing ones take their tone as the check day's counts run up
  const cells = d.register.cells.map((s, i) => `<i style="--i:${i}"${s ? ` data-s="${s}"` : ""}></i>`).join("");
  if (d.register.cells.length !== total) throw new Error("register: one cell per row");
  // press 3 shows the grid large in the empty half of the sheet; press 4 shrinks it into its corner as the check day stands up
  const grid = it({ tag: "span", cls: "reg__gz", k: 4, fx: "none", win: "0,.5", attrs: "data-scene data-keep", html: it({ tag: "span", cls: "reg__g", k: 3, win: ".3,1", attrs: `style="--n:${total}" aria-hidden="true"`, html: cells }) });
  // the key of the coloured cells from press 4 (the words of the check's three lists), so the grid reads as papers, not texture
  const lgKeys = ["x", "s", "m"].map((k, i) => `<span><i data-s="${k}"></i>${esc(c.s.watch.resL[i])}</span>`).join("");
  const legend = it({ tag: "span", cls: "reg__lg fig", k: 4, win: ".4,1", html: lgKeys });
  const reg = it({
    id: "reg", tag: "div", cls: "reg fig", zone: "reg", fx: "none", attrs: img(t.tbl),
    html: `<p class="reg__f">${esc(t.tbl)}</p><p class="reg__h">${head6}</p><div class="reg__rows">${rowsHtml}</div>${it({ tag: "p", cls: "reg__n", k: 3, win: ".3,1", html: `<b>${it({ tag: "span", k: 3, win: ".3,1", count: `0,${total},0`, text: String(total) })}</b><small>${esc(fill(t.onDate, { date: dateText(d.register.today, d.lang) }))}</small>${legend}${grid}` })}${it({ tag: "div", cls: "scr", k: 4, fx: "none", attrs: `data-scene ${target("dates", { at: 0 })}`, html: rowsOfDates })}`,
  });
  const z = sentences(t.z);
  // the recorded time of the step 4 turn (stats.duration_ms), only when the recording carries it, never typed
  const builtTime = take.rec ? durationText(turnOf(take.rec, "register", "step4")) : null;
  const built = builtTime ? it({ id: "built", tag: "p", cls: "t t--s built fig", zone: "l2", k: 7, text: fill(t.built, { time: builtTime }) }) : "";
  const stage = [
    it({ id: "h", tag: "h2", cls: "headline headline--s", zone: "h", text: t.h }),
    progress(it, 4),
    reg,
    inputs,
    win,
    win2,
    it({ id: "st", cls: "t t--s", zone: "l1", out: 1, text: t.st }),
    it({ id: "pl", cls: "t t--s", zone: "l1", k: 1, out: 2, text: t.pl }),
    it({ id: "pf", cls: "src", zone: "l2", k: 1, out: 2, text: t.pf }),
    take.chip, take.key, take.time,
    it({ id: "hc", cls: "t t--s", zone: "l1", k: 3, out: 4, text: t.hc }),
    it({ id: "m", cls: "t t--s", zone: "l1", k: 4, out: 5, text: t.m }),
    it({ id: "dm", cls: "t t--s", zone: "l1", k: 5, out: 6, text: t.dm }),
    scrubber(it, { id: "sc", zone: "l3", k: 5, out: 6, win: ".5,1", target: "dates", values: dates.map((_, i) => String(i)), labels: dates.map(([iso]) => dateText(iso, d.lang)), aria: t.scAria, cls: "reg-sc" }),
    it({ id: "aq", cls: "t t--s", zone: "l1", k: 6, out: 7, text: t.aq }),
    take2.chip, take2.key,
    // the register stays in view at the end; the then/now contrast is the close slide's payoff (REDESIGN-3 slide 16), not repeated here
    it({ id: "z", cls: "t t--s", zone: "l1", k: 7, text: `${z[0]} ${z[2]}` }),
    built,
  ].join("\n");
  return { head: "", stage, take, take2 };
}
