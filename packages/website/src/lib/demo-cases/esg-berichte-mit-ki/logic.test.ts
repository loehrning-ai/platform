import { describe, expect, it } from "vitest";
import { ESG_COPY } from "./copy";
import { FACTS, REASONS, STROM_MONDAY, factById } from "./facts";
import {
  changed,
  checklistMarks,
  countFrame,
  detailOptions,
  isComplete,
  judge,
  keyStamps,
  payback,
  pvShare,
  rowCell,
  scorePrediction,
  septemberFrame,
  sheet,
  tally,
  valueChanged,
  weakest,
  yearFromBills,
  type Stamps,
} from "./logic";
import { BILLS_2025, BILLS_2025_MONDAY, PV, ROWS, rowById } from "./rows";
import type { Answer, Fact, FactId, Status } from "./types";

const STATUSES: readonly Status[] = ["ok", "check", "notFound"];
const text = (lines: readonly { de: string }[]): string => lines.map((line) => line.de).join(" ");

describe("weakest (rule 3)", () => {
  it("takes the weakest part", () => {
    expect(weakest([])).toBe("ok");
    expect(weakest(["ok"])).toBe("ok");
    expect(weakest(["ok", "check"])).toBe("check");
    expect(weakest(["check", "ok"])).toBe("check");
    expect(weakest(["ok", "notFound"])).toBe("notFound");
    expect(weakest(["check", "notFound"])).toBe("notFound");
    expect(weakest(["notFound", "check", "ok"])).toBe("notFound");
  });
});

describe("Monday score sentence", () => {
  it("lists in separate sentences, never as one run-on list", () => {
    expect(ESG_COPY.de.monday.score(1, ["Q1", "F4"], ["F3"])).toBe(
      "Du hast 1 von 2 Änderungen getroffen. Zu viel markiert: Q1, F4. Übersehen: F3.",
    );
    expect(ESG_COPY.en.monday.score(1, ["Q1", "F4"], ["F3"])).toBe(
      "You caught 1 of 2 changes. Marked too many: Q1, F4. Missed: F3.",
    );
    expect(ESG_COPY.de.monday.score(2, [], [])).toBe("Du hast 2 von 2 Änderungen getroffen.");
  });
});

describe("judge", () => {
  it("grades every key right, on Friday and for electricity on Monday", () => {
    for (const fact of FACTS) {
      expect(judge(fact, fact.key).grade, fact.id).toBe("right");
    }
    expect(judge(factById("strom"), STROM_MONDAY.key, "monday").grade).toBe("right");
  });

  it("starts with the key line; the why follows only when no trap line was shown", () => {
    const strom = factById("strom");
    const verdict = judge(strom, { status: "ok", detail: "d5", action: false });
    expect(verdict.lines[0]?.de).toBe("Schlüssel: NOT FOUND · fehlt: Stromrechnung September 2025");
    expect(verdict.lines[0]?.en).toBe("Key: NOT FOUND · missing: The September 2025 electricity bill");
    expect(verdict.lines).toHaveLength(2);
    expect(verdict.lines).not.toContainEqual(strom.why);
    expect(judge(strom, strom.key).lines.at(-1)).toEqual(strom.why);
  });

  it("never repeats itself: a trap line replaces the why, at most key plus two lines", () => {
    for (const fact of FACTS) {
      for (const status of STATUSES) {
        for (const option of detailOptions(fact, status)) {
          for (const action of status === "ok" ? [true, false] : [false]) {
            const verdict = judge(fact, { status, detail: option.id, action });
            const traps = new Set(Object.values(fact.traps).map((line) => line.de));
            const hasTrap = verdict.lines.some((line) => traps.has(line.de));
            if (hasTrap) expect(verdict.lines, `${fact.id} ${status}/${option.id}`).not.toContainEqual(fact.why);
            expect(verdict.lines.length, `${fact.id} ${status}/${option.id}`).toBeLessThanOrEqual(3);
          }
        }
      }
    }
  });

  it("never repeats itself on either day: no grade word as a line opener, no shared 5-word clause", () => {
    const LOCALES = ["de", "en"] as const;
    const grades = LOCALES.flatMap((locale) => Object.values(ESG_COPY[locale].feedback.grades));
    const words = (line: string): string[] =>
      line.toLowerCase().match(/[\p{L}\p{N}]+(?:[.,]\p{N}+)*/gu) ?? [];
    const grams = (line: string): Set<string> => {
      const list = words(line);
      return new Set(list.slice(0, Math.max(0, list.length - 4)).map((_, i) => list.slice(i, i + 5).join(" ")));
    };
    for (const day of ["friday", "monday"] as const) {
      for (const base of FACTS) {
        const fact = day === "monday" && base.id === "strom" ? STROM_MONDAY : base;
        for (const status of STATUSES) {
          for (const option of detailOptions(fact, status)) {
            for (const action of status === "ok" ? [true, false] : [false]) {
              const verdict = judge(base, { status, detail: option.id, action }, day);
              const where = `${day} ${fact.id} ${status}/${option.id}/${action}`;
              for (const locale of LOCALES) {
                const lines = verdict.lines.map((line) => line[locale]);
                for (const line of lines) {
                  for (const grade of grades) expect(line.startsWith(grade), `${where} ${locale}: ${line}`).toBe(false);
                }
                lines.forEach((line, i) => {
                  const mine = grams(line);
                  for (const other of lines.slice(i + 1)) {
                    const shared = [...grams(other)].filter((gram) => mine.has(gram));
                    expect(shared, `${where} ${locale}`).toEqual([]);
                  }
                });
              }
            }
          }
        }
      }
    }
  });

  it("grades the spec's example answers", () => {
    const strom = factById("strom");
    const draft = judge(strom, { status: "ok", detail: "d5", action: false });
    expect(draft.grade).toBe("wrong");
    expect(draft.rule).toBe(1);
    expect(text(draft.lines)).toContain("Der Entwurf nennt 11 Monate ein volles Jahr. Zähl die Monate: Nach 2025-08 kommt 2025-10.");

    const conflict = judge(strom, { status: "check", detail: "conflict" });
    expect(conflict.grade).toBe("defensible");
    expect(text(conflict.lines)).toContain(
      "Den Widerspruch hast du gesehen. Was fehlt, wiegt aber schwerer als das, was sich widerspricht.",
    );

    const expired = judge(strom, { status: "check", detail: "expired" });
    expect(expired.grade).toBe("half");
    expect(text(expired.lines)).toContain("NEEDS CHECK ist vertretbar, aber nicht wegen eines Ablaufdatums.");
    expect(judge(strom, { status: "check", detail: "estimate" }).grade).toBe("half");

    const wasser = factById("wasser");
    const peak = judge(wasser, { status: "check", detail: "conflict" });
    expect(peak.grade).toBe("wrong");
    expect(text(peak.lines)).toContain("Die Spitze im September (980 m³) kommt von der Lese.");
    const profile = judge(wasser, { status: "ok", detail: "p8", action: false });
    expect(profile.grade).toBe("half");
    expect(text(profile.lines)).toContain("Z. 8 sagt, woher das Wasser kommt, nicht wie viel.");

    const kopf = factById("kopf");
    const seasonal = judge(kopf, { status: "ok", detail: "z5-6", action: false });
    expect(seasonal).toMatchObject({ grade: "half", rule: 2 });
    expect(text(seasonal.lines)).toContain("Die 18 Saisonkräfte sind keine Beschäftigten (Z. 6). Zitier Z. 3-5.");
    expect(judge(kopf, { status: "ok", detail: "p9", action: false }).grade).toBe("half");

    const glas = factById("glas");
    const noAction = judge(glas, { status: "ok", detail: "z3-5", action: false });
    expect(noAction.grade).toBe("half");
    expect(text(noAction.lines)).toContain("OK heißt belegt, nicht gut: dazu gehört eine Aufgabe.");
    for (const reason of REASONS) {
      const checked = judge(glas, { status: "check", detail: reason.id });
      expect(checked.grade).toBe("wrong");
      expect(text(checked.lines)).toContain("560 g bei NOK 239 ist ein belegter Verstoß");
    }

    const unfall = judge(factById("unfall"), { status: "ok", detail: "z4-7", action: true });
    expect(unfall.grade).toBe("half");
    expect(text(unfall.lines)).toContain("Keine Anfrage setzt dafür eine Grenze: keine Aufgabe.");

    for (const doc of factById("pv").docs) {
      const pv = judge(factById("pv"), { status: "notFound", detail: doc.id });
      expect(pv.grade).toBe("wrong");
    }
    expect(text(judge(factById("pv"), { status: "notFound", detail: "signed" }).lines)).toContain(
      "Das Angebot liegt vor (Z. 3). Es enthält eine Schätzung (Z. 8): NEEDS CHECK.",
    );

    const ghg = judge(factById("ghg"), { status: "notFound", detail: "offsetInvoice" });
    expect(ghg.grade).toBe("half");
    expect(text(ghg.lines)).toContain("Gekaufte Gutschriften sind nicht deine Emissionen.");

    const mix = judge(factById("mix"), { status: "notFound", detail: "sept" });
    expect(mix.grade).toBe("half");
    expect(text(mix.lines)).toContain("Elf von elf Rechnungen sagen „not specified“.");

    for (const cite of factById("zert").cite) {
      const zert = judge(factById("zert"), { status: "ok", detail: cite.id, action: false });
      expect(zert.grade).toBe("wrong");
      expect(text(zert.lines)).toContain("Gültig bis 31.08.2026, heute ist der 16.10.2026.");
    }
  });

  it("grades Monday's electricity card", () => {
    const strom = factById("strom");
    expect(judge(strom, { status: "ok", detail: "b3-13+inv", action: false }, "monday").grade).toBe("right");
    expect(judge(strom, { status: "check", detail: "conflict" }, "monday").grade).toBe("defensible");
    expect(judge(strom, { status: "check", detail: "expired" }, "monday").grade).toBe("half");
    for (const doc of strom.docs) {
      const verdict = judge(strom, { status: "notFound", detail: doc.id }, "monday");
      expect(verdict.grade).toBe("wrong");
      expect(text(verdict.lines)).toContain("12 von 12 Rechnungen liegen jetzt vor.");
    }
    expect(judge(strom, { status: "ok", detail: "b3-13", action: false }, "monday").grade).toBe("half");
  });

  it("never grades a wrong status better than wrong, whatever the detail or action", () => {
    for (const fact of FACTS) {
      const allowed = new Set([fact.key.status, ...(fact.accepted ?? []).map((a) => a.status)]);
      for (const status of STATUSES) {
        if (allowed.has(status)) continue;
        for (const option of detailOptions(fact, status)) {
          for (const action of [true, false]) {
            const answer: Answer = { status, detail: option.id, ...(status === "ok" ? { action } : {}) };
            expect(judge(fact, answer).grade, `${fact.id} ${status}/${option.id}`).toBe("wrong");
          }
        }
      }
    }
  });

  it("gives a wrong status more than the key line", () => {
    for (const fact of FACTS) {
      for (const status of STATUSES) {
        if (status === fact.key.status || fact.accepted?.some((a) => a.status === status)) continue;
        for (const option of detailOptions(fact, status)) {
          const verdict = judge(fact, { status, detail: option.id, action: false });
          expect(verdict.lines.length, `${fact.id} ${status}/${option.id}`).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it("asks for an action only where a request sets a limit: glas", () => {
    for (const fact of FACTS.filter((candidate) => candidate.key.status === "ok")) {
      const flipped = { ...fact.key, action: !fact.key.action };
      expect(judge(fact, flipped).grade, fact.id).toBe("half");
      expect(fact.key.action, fact.id).toBe(fact.id === "glas");
    }
  });

  it("resolves every trap key to a real option", () => {
    for (const fact of [...FACTS, STROM_MONDAY]) {
      for (const name of Object.keys(fact.traps)) {
        if (name.startsWith("action:")) {
          expect(["action:yes", "action:no"], `${fact.id} ${name}`).toContain(name);
          continue;
        }
        const [status, detail] = name.split("/") as [Status, string | undefined];
        expect(STATUSES, `${fact.id} ${name}`).toContain(status);
        if (detail !== undefined) {
          expect(detailOptions(fact, status).map((option) => option.id), `${fact.id} ${name}`).toContain(detail);
        }
      }
      for (const option of [...fact.cite, ...fact.docs]) {
        expect(option.label.de.length).toBeGreaterThan(0);
        expect(option.label.en.length).toBeGreaterThan(0);
      }
      expect(detailOptions(fact, fact.key.status).map((option) => option.id)).toContain(fact.key.detail);
    }
  });

  it("does not always put the key first", () => {
    const firsts = FACTS.map((fact) => detailOptions(fact, fact.key.status)[0]?.id === fact.key.detail);
    expect(firsts.filter(Boolean).length).toBeLessThan(FACTS.length / 2);
  });
});

describe("isComplete (gates Prüfen)", () => {
  it("needs every decision on the chosen path", () => {
    expect(isComplete({})).toBe(false);
    expect(isComplete({ status: "ok" })).toBe(false);
    expect(isComplete({ status: "ok", detail: "z13-14" })).toBe(false);
    expect(isComplete({ status: "ok", detail: "z13-14", action: false })).toBe(true);
    expect(isComplete({ status: "check", detail: "expired" })).toBe(true);
    expect(isComplete({ status: "notFound", detail: "sept" })).toBe(true);
  });
});

describe("the answer sheet", () => {
  const friday = keyStamps(FACTS, "friday");
  const monday = keyStamps(FACTS, "monday");

  it("matches the ANSWERS tallies: Nordvik 5/1/2, bank 2/2/2 on Friday, 3/3/0 on Monday", () => {
    const fri = sheet(ROWS, friday, friday);
    expect(tally(fri, "nordvik")).toEqual({ ok: 5, check: 1, notFound: 2 });
    expect(tally(fri, "bank")).toEqual({ ok: 2, check: 2, notFound: 2 });
    const mon = sheet(ROWS, monday, monday);
    expect(tally(mon, "nordvik")).toEqual({ ok: 5, check: 1, notFound: 2 });
    expect(tally(mon, "bank")).toEqual({ ok: 3, check: 3, notFound: 0 });
  });

  it("keeps a row open until every part is stamped", () => {
    const stamps: Stamps = { strom: friday.strom };
    expect(rowCell(rowById("Q1"), stamps)).toEqual({ state: "open" });
    expect(rowCell(rowById("F2"), stamps)).toEqual({ state: "filled", status: "notFound", action: false });
    const rows = sheet(ROWS, friday, stamps);
    expect(rows.find((entry) => entry.row.id === "Q1")?.key.state).toBe("open");
    expect(rows.find((entry) => entry.row.id === "F2")?.key.state).toBe("filled");
  });

  it("carries the action on Q6 only", () => {
    const cell = rowCell(rowById("Q6"), friday);
    expect(cell).toEqual({ state: "filled", status: "ok", action: true });
    for (const row of ROWS.filter((candidate) => candidate.id !== "Q6")) {
      const other = rowCell(row, friday);
      expect(other.state === "filled" && other.action, row.id).toBe(false);
    }
  });

  it("marks rows where your stamps would go out differently", () => {
    const yours: Stamps = { ...friday, wasser: { status: "check", detail: "conflict" } };
    const rows = sheet(ROWS, friday, yours);
    expect(rows.filter((entry) => entry.differs).map((entry) => entry.row.id)).toEqual(["Q8"]);
    const noAction: Stamps = { ...friday, glas: { status: "ok", detail: "z3-5", action: false } };
    expect(sheet(ROWS, friday, noAction).filter((e) => e.differs).map((e) => e.row.id)).toEqual(["Q6"]);
    expect(sheet(ROWS, friday, friday).some((entry) => entry.differs)).toBe(false);
  });

  it("changes exactly F2 and F3 on Monday, and Q1's value only", () => {
    expect(changed(ROWS, friday, monday)).toEqual(["F2", "F3"]);
    expect(valueChanged(ROWS, friday, monday)).toEqual(["Q1"]);
    expect(sheet(ROWS, monday, monday).find((e) => e.row.id === "F2")?.key).toEqual({
      state: "filled",
      status: "ok",
      action: false,
    });
  });
});

describe("numbers (in code, as the kit asks)", () => {
  it("counts the months before any total", () => {
    expect(yearFromBills(BILLS_2025)).toEqual({ months: 11, coverage: 0.917, mwh: 279.7, complete: false });
    expect(yearFromBills(BILLS_2025_MONDAY)).toEqual({ months: 12, coverage: 1, mwh: 320.9, complete: true });
  });

  it("is never complete without 12 distinct months", () => {
    const duplicated = [...BILLS_2025.filter((bill) => bill.kWh !== null), BILLS_2025[0]!];
    expect(duplicated).toHaveLength(12);
    expect(yearFromBills(duplicated).complete).toBe(false);
    expect(yearFromBills([]).complete).toBe(false);
  });

  it("computes the shares, the payback and the water total", () => {
    expect(pvShare(PV.offerMWh, 279.7)).toBe(64.4);
    expect(pvShare(PV.offerMWh, 320.9)).toBe(56.1);
    expect(payback(PV.priceMKD, PV.offerMWh * 1000, PV.tariffMKDperKWh)).toBe(5);
    expect(ROWS.find((row) => row.id === "F4")?.value.friday.de).toContain("5,0 Jahre");
    expect(rowById("F3").value.friday.de).toContain("64,4 %");
    expect(rowById("F3").value.monday?.de).toContain("56,1 %");
    expect(rowById("Q1").value.friday.de).toContain("279,7 MWh");
    expect(rowById("F2").value.monday?.de).toContain("320,9 MWh");
  });
});

describe("prediction and checklist marks", () => {
  it("scores a prediction", () => {
    expect(scorePrediction(["Q1", "F2"], ["F2", "F3"])).toEqual({
      hits: ["F2"],
      misses: ["F3"],
      falseAlarms: ["Q1"],
    });
    expect(scorePrediction(["F2", "F3"], ["F2", "F3"])).toEqual({ hits: ["F2", "F3"], misses: [], falseAlarms: [] });
    expect(scorePrediction([], ["F2", "F3"])).toEqual({ hits: [], misses: ["F2", "F3"], falseAlarms: [] });
  });

  it("maps misses to checklist lines", () => {
    expect([...checklistMarks({})]).toEqual([]);
    expect([...checklistMarks({ strom: "wrong" })].sort()).toEqual([1, 3]);
    expect([...checklistMarks({ strom: "defensible" })]).toEqual([]);
    expect([...checklistMarks({ zert: "half" })]).toEqual([2]);
    expect([...checklistMarks({ pv: "wrong" })]).toEqual([2]);
    expect([...checklistMarks({ ghg: "half", mix: "right" })]).toEqual([3]);
    expect([...checklistMarks({ kopf: "half" })]).toEqual([4]);
    expect([...checklistMarks({ glas: "half" })]).toEqual([5]);
    expect([...checklistMarks({}, scorePrediction(["Q1", "F2"], ["F2", "F3"]))]).toEqual([6]);
    expect([...checklistMarks({}, scorePrediction(["F2", "F3", "F4"], ["F2", "F3"]))]).toEqual([]);
  });
});

describe("frame functions", () => {
  it("M1 is finite at 0 and 0.5 and ends with every bar at its share and the gap shown", () => {
    for (const t of [0, 0.5, 1]) {
      for (const bar of countFrame(BILLS_2025, t)) {
        expect(Number.isFinite(bar.scaleY)).toBe(true);
        expect(Number.isFinite(bar.gapOpacity)).toBe(true);
      }
    }
    expect(countFrame(BILLS_2025, 0).every((bar) => bar.scaleY === 0 && bar.gapOpacity === 0)).toBe(true);
    const end = countFrame(BILLS_2025, 1);
    expect(end[8]).toMatchObject({ month: "2025-09", gapOpacity: 1, scaleY: 0 });
    expect(end[9]?.scaleY).toBeCloseTo(38_700 / 41_200, 6);
  });

  it("M4 fills September to the top and swaps the year label, never a count-up", () => {
    expect(septemberFrame(0)).toEqual({ septScaleY: 0, hatchOpacity: 1, year: "before" });
    const mid = septemberFrame(0.5);
    expect(mid.year).toBe("after");
    expect(mid.septScaleY).toBeCloseTo(1, 6);
    expect(septemberFrame(1)).toEqual({ septScaleY: 1, hatchOpacity: 0, year: "after" });
  });
});

describe("feeds and rows agree", () => {
  it("each fact feeds exactly the rows that depend on it", () => {
    for (const fact of FACTS) {
      const dependants = ROWS.filter((row) => row.deps.includes(fact.id)).map((row) => row.id);
      expect([...fact.feeds].sort(), fact.id).toEqual([...dependants].sort());
    }
  });

  it("numbers the ten facts 1 to 10", () => {
    expect(FACTS.map((fact: Fact) => fact.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const ids: FactId[] = FACTS.map((fact) => fact.id);
    expect(new Set(ids).size).toBe(10);
  });
});
