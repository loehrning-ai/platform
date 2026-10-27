import { describe, expect, it } from "vitest";
import { benchProbe, dateAt, offsetOf, SLIDER_MAX, TICKS, type BenchPlace, type BenchScope } from "./bench";
import { CARD_START, cardReducer, cardVerdict, needsHelp, nextOpenPart } from "./card-state";
import { cardWordsFrom, objectiveFrom } from "./card-words";
import { connectionsFrom, gapSplit, RECHECK_REASON, recheckOrder } from "./connections";
import { COPY } from "./copy";
import { DEMO_START, demoReducer, roundGuess } from "./demo-state";
import { days, daysLeft, EXPIRED_DAYS, MWH, scaleUpSeptember } from "./figures";
import { BIO, CERT_LINE, DRAFT_LINE, STICHTAG, STROM, WASSER, YEAR } from "./kit";
import { kitText } from "./kit-text";
import { cascadeFlips, ledgerCounts } from "./ledger";
import { monthsLayout, morphEnd, niceCeil, valueToY, yToValue } from "./months-layout";
import { parseBills } from "./own-csv";
import { ownReport, reportMail, reportSentences, reportTable, takeHomeLine } from "./own-report";
import { BAN_DATE, roundTo, sumDistinct, type CalendarDate } from "./rules";
import { hintLines, land, PARTS, THREADS, verdict } from "./threads";

const at = (year: number, month: number, day: number): CalendarDate => ({ year, month, day });

describe("S1: the card's quotes", () => {
  it("accepts the lines that carry each part and nothing else", () => {
    expect(land("zertifiziert", CERT_LINE.body)).toEqual({ accepted: true, status: "belegt" });
    expect(land("flaeche", CERT_LINE.scope)).toEqual({ accepted: true, status: "luecke" });
    expect(land("stichtag", CERT_LINE.until)).toEqual({ accepted: true, status: "schwach" });
    expect(land("stichtag", CERT_LINE.body).accepted).toBe(false);
    expect(land("flaeche", 2).accepted).toBe(false);
    expect(land("flaeche", 99).accepted).toBe(false);
  });
  it("has a hint for every line that does not carry a part, in both languages", () => {
    for (const locale of ["de", "en"] as const) {
      for (const part of PARTS) {
        const hints = COPY[locale].connect.hints[part] as Readonly<Record<string, string>>;
        for (const line of hintLines(part)) expect(hints[String(line)], `${locale} ${part} ${line}`).toBeTruthy();
      }
    }
  });
  it("lets the weakest part decide: one Belegt, one Schwach, one Lücke make a Lücke", () => {
    expect(verdict({ zertifiziert: 4, flaeche: 6 })).toBeNull();
    expect(verdict({ zertifiziert: 4, flaeche: 6, stichtag: 8 })).toBe("luecke");
  });
  it("counts misses, keeps the part open and offers the line after three", () => {
    let state = cardReducer(CARD_START, { type: "pick", part: "stichtag" });
    for (const line of [1, 3, 4]) state = cardReducer(state, { type: "land", part: "stichtag", line });
    expect(state.picking).toBe("stichtag");
    expect(needsHelp(state, "stichtag")).toBe(true);
    state = cardReducer(state, { type: "show", part: "stichtag" });
    expect(state.links.stichtag).toBe(THREADS.stichtag.target);
    expect(needsHelp(state, "stichtag")).toBe(false);
    expect(nextOpenPart(state)).toBe("zertifiziert");
    expect(cardVerdict(cardReducer(state, { type: "all" }))).toBe("luecke");
  });
});

describe("S2: the workbench", () => {
  const scopes: readonly BenchScope[] = ["alle", "teil"];
  const places: readonly BenchPlace[] = ["regalkarte", "website"];
  const dates = {
    beforeEnd: at(2026, 7, 1),
    beforeBan: at(2026, 9, 10),
    beforeRenewal: STICHTAG,
    afterRenewal: at(2026, 11, 2),
  } as const;
  const expected: Record<string, string> = {
    "alle/regalkarte/beforeEnd": "luecke", "alle/website/beforeEnd": "luecke",
    "teil/regalkarte/beforeEnd": "luecke", "teil/website/beforeEnd": "belegt",
    "alle/regalkarte/beforeBan": "luecke", "alle/website/beforeBan": "luecke",
    "teil/regalkarte/beforeBan": "luecke", "teil/website/beforeBan": "schwach",
    "alle/regalkarte/beforeRenewal": "luecke", "alle/website/beforeRenewal": "luecke",
    "teil/regalkarte/beforeRenewal": "luecke", "teil/website/beforeRenewal": "schwach",
    "alle/regalkarte/afterRenewal": "luecke", "alle/website/afterRenewal": "luecke",
    "teil/regalkarte/afterRenewal": "luecke", "teil/website/afterRenewal": "schwach",
  };
  it.each(Object.keys(expected))("%s", (key) => {
    const [scope, place, when] = key.split("/") as [BenchScope, BenchPlace, keyof typeof dates];
    const result = benchProbe({ scope, place, stichtag: dates[when] });
    expect(result.status).toBe(expected[key]);
    expect(result.mayGoOut).toBe(expected[key] === "belegt" && !result.banned);
    expect(scopes).toContain(scope);
    expect(places).toContain(place);
  });
  it("says why: before the ban date the whole-claim caption warns about 27 September 2026", () => {
    expect(benchProbe({ scope: "alle", place: "website", stichtag: at(2026, 7, 1) }).caption).toBe("allBeforeBan");
    expect(benchProbe({ scope: "alle", place: "website", stichtag: BAN_DATE }).caption).toBe("allBanned");
    expect(COPY.de.bench.captions.allBeforeBan.join(" ")).toContain("Ab dem 27. September 2026");
    expect(benchProbe({ scope: "teil", place: "regalkarte", stichtag: STICHTAG }).caption).toBe("partShelf");
    expect(benchProbe({ scope: "teil", place: "website", stichtag: STICHTAG }).caption).toBe("partWebExpired");
  });
  it("counts 61 days left on 01.07.2026, 46 expired on the Stichtag, and lights the renewal after 22.10.2026", () => {
    const july = benchProbe({ scope: "teil", place: "website", stichtag: at(2026, 7, 1) });
    expect([july.daysLeft, july.days, july.expired]).toEqual([61, 0, false]);
    const kit = benchProbe({ scope: "teil", place: "website", stichtag: STICHTAG });
    expect([kit.days, kit.expired, kit.pastRenewal]).toEqual([46, true, false]);
    expect(benchProbe({ scope: "teil", place: "website", stichtag: at(2026, 10, 23) }).pastRenewal).toBe(true);
    expect(EXPIRED_DAYS).toBe(46);
    expect(days(BIO.validUntil)).toBe(0);
    expect(daysLeft(BIO.validUntil)).toBe(0);
  });
  it("runs the slider in days from 01.09.2025 to 31.12.2026 with its ticks in order", () => {
    expect(dateAt(0)).toEqual(BIO.validFrom);
    expect(dateAt(SLIDER_MAX)).toEqual(at(2026, 12, 31));
    expect(dateAt(offsetOf(STICHTAG))).toEqual(STICHTAG);
    expect(TICKS.validUntil < TICKS.banDate && TICKS.banDate < offsetOf(STICHTAG) && offsetOf(STICHTAG) < TICKS.renewal).toBe(true);
  });
});

describe("S3 and S4: twelve rows, eleven months", () => {
  it("morphs rows into twelve month slots as a pure function of t", () => {
    const start = monthsLayout(STROM, YEAR, 0, 50_000);
    const end = monthsLayout(STROM, YEAR, 1, 50_000);
    expect(monthsLayout(STROM, YEAR, 1, 50_000)).toEqual(end);
    expect(start.items.every((item) => item.p === 0)).toBe(true);
    expect(end.items.every((item) => item.p === 1)).toBe(true);
    expect(end.slots.filter((slot) => !slot.missing)).toHaveLength(11);
    expect(end.slots[8]?.missing).toBe(true);
    expect(end.slots[9]).toMatchObject({ rows: 2, duplicate: true, conflict: false });
    expect(end.items.filter((item) => item.kind === "duplicate").map((item) => item.row.line)).toEqual([12]);
    for (const t of [-1, Number.NaN, 2]) for (const item of monthsLayout(STROM, YEAR, t).items) expect(Number.isFinite(item.x + item.y + item.w + item.h)).toBe(true);
    expect(morphEnd(0.49)).toBe("rows");
    expect(morphEnd(0.5)).toBe("months");
  });
  it("maps values to heights and back, and rounds the scale", () => {
    const layout = monthsLayout(STROM, YEAR, 1, 50_000);
    expect(roundTo(yToValue(valueToY(41_200, layout), layout), 6)).toBe(41_200);
    expect(niceCeil(41_000)).toBe(50_000);
    expect(niceCeil(0)).toBe(1);
  });
  it("finds the water file clean: twelve months, nothing twice", () => {
    const end = monthsLayout(WASSER, YEAR, 1);
    expect(end.slots.every((slot) => !slot.missing && !slot.duplicate)).toBe(true);
    expect(sumDistinct(WASSER)).toBe(4630);
  });
  it("re-derives 279,7, 318,4, 320,9, 305,1 and the 25,4 the scale-up puts in for September", () => {
    expect(MWH).toEqual({ eleven: 279.7, naive: 318.4, twelve: 320.9, scaledUp: 305.1, september: 41.2 });
    expect(scaleUpSeptember).toBe(25.4);
    expect(scaleUpSeptember).toBe(roundTo(roundTo(sumDistinct(STROM) / 11 / 1000, 1), 1));
  });
  it("connects the bank's figure only to the draft's line 5, rounds the guess and lets the invoice go in and out", () => {
    let state = demoReducer(DEMO_START, { type: "stromLand", line: DRAFT_LINE.status });
    expect(state.strom).toMatchObject({ linked: false, miss: DRAFT_LINE.status });
    state = demoReducer(state, { type: "stromLand", line: DRAFT_LINE.figure });
    expect(state.strom).toMatchObject({ linked: true, miss: null });
    expect(roundGuess(26.26)).toBe(26.5);
    expect(roundGuess(99)).toBe(50);
    state = demoReducer(state, { type: "keepGuess" });
    expect(state.strom.guessKept).toBe(false);
    state = demoReducer(demoReducer(state, { type: "guess", value: 30 }), { type: "keepGuess" });
    expect(state.strom).toMatchObject({ guess: 30, guessKept: true });
    state = demoReducer(state, { type: "invoice", in: true });
    expect(state.invoiceIn).toBe(true);
    expect(demoReducer(state, { type: "restart" })).toEqual(DEMO_START);
  });
  it("sets what earlier beats leave when a later beat is reached directly", () => {
    const reached = demoReducer(DEMO_START, { type: "reach", index: 5 });
    expect(Object.keys(reached.card.links)).toHaveLength(3);
    expect(reached.strom).toMatchObject({ linked: true, t: 1 });
    expect(reached.invoiceIn).toBe(true);
    const free = demoReducer(DEMO_START, { type: "free" });
    expect(cardVerdict(free.card)).toBe("luecke");
  });
});

describe("S5: the folder", () => {
  it("draws four solid and two dashed connections from the electricity file", () => {
    expect(connectionsFrom("strom")).toEqual({ quoted: ["Q1", "C5", "F2", "F3"], dependsOn: ["Q2", "F4"] });
  });
  it("splits the gaps 5 / 3 / 1 before the invoice and 3 / 3 / 1 after", () => {
    expect(ledgerCounts("before")).toEqual({ belegt: 9, schwach: 3, luecke: 9 });
    expect(ledgerCounts("after")).toEqual({ belegt: 10, schwach: 4, luecke: 7 });
    expect(gapSplit("before")).toEqual({ withDoc: 5, banned: 3, noFile: 1 });
    expect(gapSplit("after")).toEqual({ withDoc: 3, banned: 3, noFile: 1 });
  });
  it("rechecks six answers, flips F2 and F3 and gives the other four their reason", () => {
    expect(recheckOrder()).toEqual(["Q1", "Q2", "C5", "F2", "F3", "F4"]);
    expect(cascadeFlips()).toEqual(["F2", "F3"]);
    expect(recheckOrder().filter((id) => !RECHECK_REASON[id])).toEqual(cascadeFlips());
  });
});

describe("beat 7: the visitor's own file", () => {
  const csv = ["monat;rechnung;kwh", "2025-01;R-1;100", "2025-02;R-2;110", "2025-03;R-3;120", "2025-03;R-3;120", "2025-04;R-4a;90", "2025-04;R-4b;95", "2024-12;R-0;80"].join("\n");
  it("reads the kit's own electricity file as eleven months with October twice", () => {
    const parsed = parseBills(kitText("de").stromText);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const report = ownReport(parsed.rows, parsed.year);
    expect(report).toMatchObject({ year: 2025, covered: 11, missing: [9] });
    expect(report.duplicates).toEqual([{ invoice: "EL-25-10", lines: [11, 12] }]);
    expect(reportSentences(report, COPY.de.own)).toEqual([
      "Deine Datei deckt 11 von 12 Monaten 2025.",
      "Es fehlt September.",
      "Die Rechnung EL-25-10 steht zweimal darin, in den Zeilen 11 und 12.",
      "Für eine Jahressumme brauchst du die Rechnungen für September, und eine Hochrechnung ersetzt sie nicht.",
    ]);
  });
  it("names duplicates, conflicts and missing months, and builds the table and the mail", () => {
    const parsed = parseBills(csv);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const report = ownReport(parsed.rows, 2025);
    expect(report.covered).toBe(4);
    expect(report.conflicts).toEqual([4]);
    expect(report.rows).toHaveLength(6);
    const table = reportTable(report, COPY.de.own, String);
    expect(table.split("\n")[0]).toBe("| Monat | Rechnung | Menge | Status | Fehlendes Dokument |");
    expect(table).toContain("| Mai 2025 |  |  | Lücke | Rechnung für Mai 2025 |");
    expect(table).toContain("doppelt, zählt einmal");
    const mail = reportMail(report, COPY.de.own) ?? "";
    expect(mail.split("\n")[0]).toBe("Betreff: Rechnungen für Mai bis Dezember 2025");
    expect(mail).not.toMatch(/\{\w+\}/);
    expect(takeHomeLine(report, COPY.de.takehome, COPY.de.own)).toBe("Meine Datei deckt 4 von 12 Monaten 2025. Es fehlen Mai bis Dezember.");
  });
  it("refuses an empty file with two sentences", () => {
    expect(parseBills("")).toEqual({ ok: false, error: "empty" });
    expect(COPY.de.own.errors.empty).toHaveLength(2);
  });
});

describe("copy", () => {
  const shape = (value: unknown): unknown =>
    Array.isArray(value) ? value.map(shape) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)])) : typeof value;
  it("has the same keys and the same lengths in both languages", () => {
    const { locale: _de, ...de } = COPY.de;
    const { locale: _en, ...en } = COPY.en;
    expect(shape(en)).toEqual(shape(de));
  });
  it("reads the card words from the skill and fails loudly without them", () => {
    expect(cardWordsFrom("Deutsch: A, B, C, D und E, F, G.", "Deutsch")).toEqual({ checks: ["A", "B", "C", "D"], statuses: ["E", "F", "G"] });
    expect(() => cardWordsFrom("nothing here", "Englisch")).toThrow();
    expect(objectiveFrom("# Kit\n\nErfunden.\n\n**Lernziel:** Eine Zeile\nund noch eine.\n\n## Fall")).toBe("Eine Zeile und noch eine.");
    expect(() => objectiveFrom("# Kit")).toThrow();
    expect(COPY.en.regel.objective).toMatch(/^Every answer that leaves the company carries its evidence/);
  });
});
