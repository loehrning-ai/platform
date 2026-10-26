import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { binomialAtMost, quantile7, roundHalfUp, runCheck, share, type CheckResult, type RuleName } from "./check";
import { KIT_CSV, KIT_CSV_SHA256 } from "./kit-series";
import { parseTable, type ParseNotice, type Row } from "./parse";
import expected from "./__fixtures__/kit-expected.json";
import ohneKantine from "./__fixtures__/kit-ohne-kantine.json";
import nurIst from "./__fixtures__/kit-nur-ist.json";

const SITE = path.resolve(__dirname, "../../../..");
const REPO = path.resolve(SITE, "../..");
const SKILL = path.join(SITE, "content/skills/prognose-pruefen/SKILL.md");
const NUR_IST_CSV = readFileSync(path.join(__dirname, "__fixtures__/linsensuppe-nur-ist.csv"), "utf8");

const REASON: Record<string, string> = {
  ist: "Ist fehlt",
  ausverkauft: "ausverkauft: Ist ist kleiner als die Nachfrage",
  prognose: "keine Prognose gespeichert",
  messlatte: "Vorwoche fehlt",
};

function notice(n: ParseNotice): string {
  return n.key === "duplicate" ? `${n.date}: doppelte Zeile, einmal gezählt` : `${n.date}: Woche fehlt in der Datei, zählt nicht`;
}

/** The TS result in the exact JSON shape pruefen.py prints. */
function asPython(result: CheckResult, notices: readonly ParseNotice[]): unknown {
  const out: Record<string, unknown> = {
    hinweise: notices.map(notice),
    ...result,
    nicht_bewertet: result.nicht_bewertet.map(([date, reason]) => [date, REASON[reason]]),
    regel_rot: result.regel_rot.map(([date, keys]) => [date, [...keys]]),
  };
  if (result.naechste?.lampen) {
    const { verhaeltnis, ...rest } = result.naechste.lampen;
    out.naechste = { ...result.naechste, lampen: { ...rest, verhaeltnis } };
  }
  return JSON.parse(JSON.stringify(out));
}

/** Deep equal with |delta| < 1e-9 for numbers; key order ignored. */
function expectClose(actual: unknown, wanted: unknown, at = "$"): void {
  if (typeof wanted === "number") {
    expect(typeof actual, at).toBe("number");
    expect(Math.abs((actual as number) - wanted), at).toBeLessThan(1e-9);
    return;
  }
  if (Array.isArray(wanted)) {
    expect(Array.isArray(actual), at).toBe(true);
    expect((actual as unknown[]).length, at).toBe(wanted.length);
    wanted.forEach((item, i) => expectClose((actual as unknown[])[i], item, `${at}[${i}]`));
    return;
  }
  if (wanted && typeof wanted === "object") {
    expect(Object.keys(actual as object).sort(), at).toEqual(Object.keys(wanted).sort());
    for (const [key, value] of Object.entries(wanted)) expectClose((actual as Record<string, unknown>)[key], value, `${at}.${key}`);
    return;
  }
  expect(actual, at).toEqual(wanted);
}

function run(csv: string, fehlmenge: number | null, rest: number | null, messlatte: RuleName = "wie letzte Woche") {
  const table = parseTable(csv);
  if (!table.ok) throw new Error(JSON.stringify(table.error));
  const outcome = runCheck(table.rows, { fehlmenge, rest, messlatte });
  if (!outcome.ok) throw new Error(outcome.key);
  return { ...outcome, notices: table.notices };
}

describe("the kit CSV is the source of truth", () => {
  it("kit-series.ts carries the committed CSV and its SHA-256", () => {
    const file = readFileSync(path.join(REPO, "scripts/workshop01/data/linsensuppe-woechentlich.csv"));
    expect(file.toString("utf8")).toBe(KIT_CSV);
    expect(createHash("sha256").update(file).digest("hex")).toBe(KIT_CSV_SHA256);
  });
});

describe("parity with pruefen.py", () => {
  it("kit data at 1,50 € / 0,40 €", () => {
    const { result, notices } = run(KIT_CSV, 1.5, 0.4);
    expectClose(asPython(result, notices), expected);
  });

  it("kit data without the canteen, 1,50 € / 1,60 €", () => {
    const { result, notices } = run(KIT_CSV, 1.5, 1.6);
    expectClose(asPython(result, notices), ohneKantine);
  });

  it("sales-only copy: simple rules only, Messlatte lamp null", () => {
    const { result, notices } = run(NUR_IST_CSV, null, null);
    expectClose(asPython(result, notices), nurIst);
    expect(result.beste_regel).toBe("wie Vorjahreswoche");
  });

  const python = (() => {
    try {
      execFileSync("python3", ["-I", "-c", "print(1)"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  })();

  it.skipIf(!python)("the SKILL.md code block, run with python3 -I, prints the fixture", () => {
    const skill = readFileSync(SKILL, "utf8");
    const code = /\n```python\n([\s\S]*?)\n```\n/.exec(skill)?.[1];
    expect(code).toBeTruthy();
    expect(code).not.toMatch(/\b(?:urllib|socket|http|requests|subprocess|os)\b\s*[.,\n]/);
    const imports = [...(code as string).matchAll(/^import (.*)$/gm)].map((m) => m[1]);
    expect(imports).toEqual(["argparse, csv, datetime as dt, io, json, math, re, sys"]);
    expect((code as string).match(/\bopen\(/g)).toHaveLength(1);
    const dir = mkdtempSync(path.join(tmpdir(), "w01-"));
    writeFileSync(path.join(dir, "pruefen.py"), `${code}\n`);
    writeFileSync(path.join(dir, "kit.csv"), KIT_CSV);
    const out = execFileSync("python3", ["-I", path.join(dir, "pruefen.py"), path.join(dir, "kit.csv"), "--fehlmenge", "1,50", "--rest", "0,40"], { encoding: "utf8" });
    expectClose(JSON.parse(out), expected);
  });

  it.skipIf(!python)("all three rules with costs: pruefen.py and runCheck agree field by field", () => {
    const skill = readFileSync(SKILL, "utf8");
    const code = /\n```python\n([\s\S]*?)\n```\n/.exec(skill)?.[1] as string;
    const dir = mkdtempSync(path.join(tmpdir(), "w01-rules-"));
    writeFileSync(path.join(dir, "pruefen.py"), `${code}\n`);
    writeFileSync(path.join(dir, "kit.csv"), KIT_CSV);
    for (const rule of ["wie letzte Woche", "wie Vorjahreswoche", "Schnitt 4 Wochen"] as const) {
      const out = execFileSync("python3", ["-I", path.join(dir, "pruefen.py"), path.join(dir, "kit.csv"), "--fehlmenge", "1,50", "--rest", "0,40", "--messlatte", rule], { encoding: "utf8" });
      const { result, notices } = run(KIT_CSV, 1.5, 0.4, rule);
      expectClose(asPython(result, notices), JSON.parse(out), rule);
    }
  });

  it("„wie Vorjahreswoche“ gives a range to 30 of 50 weeks and leaves the first week out of the ledger", () => {
    const { result } = run(KIT_CSV, 1.5, 0.4, "wie Vorjahreswoche");
    expect(result.wochen).toBe(50);
    expect(result.spanne_wochen).toBe(30);
    expect(result.spanne_treffer).toBe(24);
    expect(result.regel_frei).toBe(28);
    expect(result.kosten_wochen).toBe(49);
    expect(result.kosten).toBeDefined();
  });
});

describe("pinned numbers of the spec", () => {
  const { result, check } = run(KIT_CSV, 1.5, 0.4);
  it("scores 50 weeks and leaves out exactly the two weeks with their reasons", () => {
    expect(result.wochen).toBe(50);
    expect(result.nicht_bewertet).toEqual([
      ["2025-02-03", "prognose"],
      ["2025-03-10", "ausverkauft"],
    ]);
    expect(Math.round((result.tabelle.Prognose?.mae ?? 0) * 10) / 10).toBe(33.3);
    expect(Math.round((result.tabelle["wie letzte Woche"]?.mae ?? 0) * 10) / 10).toBe(42.2);
  });

  it("gives the strip 37 / 15: first red 03.02. (daten), 28.04. with messlatte, 28.07. free", () => {
    expect(result.regel_frei).toBe(37);
    expect(result.regel_rot).toHaveLength(15);
    expect(result.regel_rot[0]).toEqual(["2025-02-03", ["daten"]]);
    expect(result.regel_rot.find(([date]) => date === "2025-04-28")?.[1]).toContain("messlatte");
    const july28 = check.rows.findIndex((row: Row) => row.woche === "2025-07-28");
    expect(check.lamps(july28)?.frei).toBe(true);
  });

  it("plans 748 for the week of 29.12.", () => {
    expect(result.naechste?.planzahl).toBe(748);
    expect(result.naechste?.lampen?.frei).toBe(true);
  });

  it("appending future rows never changes an earlier week's band or lamps", () => {
    const longer = `${KIT_CSV.trimEnd().replace(/\n2025-12-29;;729;$/, "\n2025-12-29;700;729;")}\n2026-01-05;;700;\n`;
    const other = run(longer, 1.5, 0.4).check;
    for (let t = 30; t < 104; t += 1) {
      expect(other.band(t)).toEqual(check.band(t));
      expect(other.lamps(t)).toEqual(check.lamps(t));
    }
  });
});

describe("helpers", () => {
  it("quantile7 equals Excel QUANTIL.INKL", () => {
    expect(quantile7([1, 2, 3, 4], 0.1)).toBeCloseTo(1.3, 12);
    expect(quantile7([4, 1, 3, 2], 0.5)).toBeCloseTo(2.5, 12);
    expect(quantile7([5], 0.9)).toBe(5);
  });

  it("rounds half up, like the Python code (not half to even)", () => {
    expect(roundHalfUp(728.5)).toBe(729);
    expect(roundHalfUp(727.5)).toBe(728);
    expect(share(1.5, 0.4)).toBeCloseTo(0.7894736842, 9);
  });

  it("gives the two chance lines of the rule", () => {
    expect(binomialAtMost(8, 13, 0.8)).toBeCloseTo(0.0991, 4);
    expect(binomialAtMost(36, 50, 0.8)).toBeCloseTo(0.1106, 4);
  });

  it("refuses fewer than 13 comparable weeks", () => {
    const short = ["woche;ist;prognose", ...Array.from({ length: 10 }, (_, i) => `2025-0${1 + Math.floor(i / 4)}-${String(1 + (i % 4) * 7).padStart(2, "0")};100;100`)].join("\n");
    const table = parseTable(short);
    expect(table.ok).toBe(true);
    if (!table.ok) return;
    const outcome = runCheck(table.rows, { fehlmenge: null, rest: null, messlatte: "wie letzte Woche" });
    expect(outcome.ok).toBe(false);
  });
});
