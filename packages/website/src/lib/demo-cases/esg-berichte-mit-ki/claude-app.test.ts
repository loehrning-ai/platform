import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { answerFromTimeline, recordedOn } from "@/lib/claude-runs";
import { readZipEntry } from "@/lib/zip/read";
import { claudeAfter, claudeBefore, claudePaybackYears, claudeStatusChanges, differencesBefore, kitStatusChanges, registerCounts, registerRowId, stepCounts } from "./app-facts";
import { APP_RECORDINGS, APP_REGISTER, kitPrompts, stepTurn, type Edition } from "./app-recordings";
import { activityRows, appFrameAt, buildAppSchedule, wordChunks } from "./app-replay";
import { APP_STEPS, typedPrompt } from "./app-steps";
import { citationsIn, citeParts } from "./citations";
import { INTRO } from "./intro";
import { FILE_NAMES, PV } from "./kit";
import { LEDGER, ledgerCounts } from "./ledger";
import { MEASURED, medianRun, minutesSeconds, roundHalfEven, summary } from "./measured";

/*
 * The depicted Claude app plays the median timed run of 26.10.2026. These
 * tests hold the recordings to the shipped kit (bytes), the measurement
 * (seconds), the kit's solutions (statuses) and the replay (the streamed text
 * is the recorded text, byte for byte).
 */

const WEBSITE = join(__dirname, "../../../..");
const EDITIONS: readonly Edition[] = ["de", "en"];
/** The recorder's rule with the two secrets matched as JSON keys: an answer may say "the file has no signature" (import-measured-run.mjs). */
const FORBIDDEN = /\/Users\/|\/private\/|\/var\/folders|\/home\/[a-z]|"session_id"|"signature"/;
const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

describe("the recordings of the depicted Claude app", () => {
  for (const edition of EDITIONS) {
    describe(edition, () => {
      const run = medianRun(edition);

      it("are the median run of the measurement, step by step", () => {
        APP_STEPS.forEach((step, index) => {
          expect(stepTurn(edition, step).wallS, step.id).toBe(run.steps[index]);
        });
        for (const recording of Object.values(APP_RECORDINGS[edition])) {
          expect(recording.take).toBe(run.run);
          expect(recording.model).toBe(MEASURED.model);
          expect(recording.claude_code_version).toBe(MEASURED.claudeCode);
          expect(recording.recorded_at.slice(0, 10)).toBe(MEASURED.date);
          expect(recording.locale).toBe(edition);
        }
      });

      it("are clean, unedited runs with the shipped kit and skill", () => {
        for (const recording of Object.values(APP_RECORDINGS[edition])) {
          expect(recording.edited).toBe(false);
          expect(recording.source).toBe("measured-run");
          expect(recording.skill_invoked, recording.id).toBe(true);
          expect(recording.is_error).toBe(false);
          expect(recording.stop_reason).toBe("end_turn");
          expect(FORBIDDEN.test(JSON.stringify(recording)), `${recording.id}: machine path or secret`).toBe(false);
          expect(answerFromTimeline(recording.timeline)).toBe(recording.final_text);
          for (const follow of recording.follow_ups) expect(answerFromTimeline(follow.timeline)).toBe(follow.final_text);
          const zip = new Uint8Array(readFileSync(join(WEBSITE, recording.kit_zip)));
          for (const file of recording.kit_files) {
            const bytes = readZipEntry(zip, file.path);
            expect(bytes, file.path).not.toBeNull();
            expect(sha(bytes as Uint8Array), `${file.path} changed since the run: import a new run`).toBe(file.sha256);
          }
        }
        // The public repo holds no .xlsx: the register's cells, read with openpyxl at import, carry the hash of the file Claude wrote.
        const produced = APP_RECORDINGS[edition]["schritt-4"].produced_files;
        expect(produced.map((file) => file.name)).toEqual([APP_REGISTER[edition].source]);
        expect(produced[0]?.sha256).toBe(APP_REGISTER[edition].sha256);
      });

      it("sent exactly the five prompts of the kit's start file", () => {
        const recording = APP_RECORDINGS[edition]["schritt-1"];
        const start = new TextDecoder().decode(
          readZipEntry(new Uint8Array(readFileSync(join(WEBSITE, recording.kit_zip))), recording.kit_zip.includes("nachweisprobe") ? "crvena-zemja-nachweisprobe/START-HIER.md" : "crvena-zemja-esg-kit/START-HERE.md") as Uint8Array,
        );
        const blocks = [...start.matchAll(/```\n([\s\S]*?)\n```/g)].map((match) => match[1]);
        expect(kitPrompts(edition).map((prompt) => prompt.text)).toEqual(blocks.slice(0, 5));
      });
    });
  }
});

describe("lockstep: Claude's answers and the kit's solutions", () => {
  for (const edition of EDITIONS) {
    it(`${edition}: steps 1 to 3 give every one of the 21 answers a status`, () => {
      expect(Object.keys(claudeBefore(edition)).sort()).toEqual(LEDGER.map((row) => row.id).sort());
    });

    it(`${edition}: the statuses before the invoice differ from the solutions only where the measurement says so`, () => {
      const expected = MEASURED.mismatches[edition].filter((item) => item.run === medianRun(edition).run);
      expect(differencesBefore(edition)).toEqual(expected.map((item) => ({ row: item.row, claude: item.claude, solution: item.solution })));
      expect(LEDGER.length - differencesBefore(edition).length).toBe(medianRun(edition).before);
    });

    it(`${edition}: the register counts Claude states are the solutions' counts`, () => {
      const counts = registerCounts(edition);
      expect(counts.before).toEqual(ledgerCounts("before"));
      expect(counts.after).toEqual(ledgerCounts("after"));
    });

    it(`${edition}: the file Claude wrote holds the solutions' statuses after the invoice`, () => {
      const after = claudeAfter(edition);
      for (const entry of LEDGER) expect(after[entry.id], entry.id).toBe(entry.after);
    });

    it(`${edition}: the step captions' counts come from Claude's tables`, () => {
      expect(stepCounts(edition, "schritt-2").belegt + stepCounts(edition, "schritt-2").schwach + stepCounts(edition, "schritt-2").luecke).toBe(7);
      expect(stepCounts(edition, "schritt-3").belegt + stepCounts(edition, "schritt-3").schwach + stepCounts(edition, "schritt-3").luecke).toBe(6);
    });

    it(`${edition}: every citation in the answers names a kit file with lines inside it`, () => {
      const names = Object.values(FILE_NAMES).map((name) => name[edition]);
      const recording = APP_RECORDINGS[edition]["schritt-1"];
      const zip = new Uint8Array(readFileSync(join(WEBSITE, recording.kit_zip)));
      const lineCount = (name: string) => {
        const ref = recording.kit_files.find((file) => file.name === name);
        const bytes = ref ? readZipEntry(zip, ref.path) : null;
        return bytes ? new TextDecoder().decode(bytes).replace(/\n$/, "").split("\n").length : 0;
      };
      let seen = 0;
      for (const step of APP_STEPS) {
        for (const cite of citationsIn(stepTurn(edition, step).turn.final_text, names)) {
          seen += 1;
          if (cite.to !== null) expect(cite.to, `${step.id}: ${cite.file}:${cite.from}-${cite.to}`).toBeLessThanOrEqual(lineCount(cite.file));
        }
      }
      expect(seen).toBeGreaterThan(10);
    });
  }

  for (const edition of EDITIONS) {
    it(`${edition}: Claude's payback F4 is the kit's, to one decimal`, () => {
      const kit = Math.round((PV.investmentMkd / (PV.yieldMwh * 1000 * PV.tariff)) * 10) / 10;
      expect(claudePaybackYears(edition)).toBe(kit);
    });

    it(`${edition}: the invoice changes as many statuses in Claude's register as in the kit`, () => {
      expect(kitStatusChanges()).toBeGreaterThan(0);
      expect(claudeStatusChanges(edition)).toBe(kitStatusChanges());
    });

    it(`${edition}: the intro's footnote names the day the answers were recorded`, () => {
      const day = recordedOn(APP_RECORDINGS[edition]["schritt-1"].recorded_at, edition);
      expect(INTRO[edition].footnote).toContain(day);
    });
  }

  it("reads a register row's number as its id", () => {
    expect(registerRowId("Q6")).toBe("Q6");
    expect(registerRowId("3")).toBe("C3");
    expect(registerRowId("F4")).toBe("F4");
    expect(registerRowId("B3")).toBeNull();
  });
});

describe("the replay never changes a word", () => {
  for (const edition of EDITIONS) {
    for (const step of APP_STEPS) {
      it(`${edition} ${step.id}`, () => {
        const { turn } = stepTurn(edition, step);
        const schedule = buildAppSchedule(turn);
        expect(wordChunks(turn.final_text).join("")).toBe(turn.final_text);
        expect(appFrameAt(schedule, Infinity).answer).toBe(turn.final_text);
        expect(appFrameAt(schedule, schedule.duration).phase).toBe("done");
        // Midway the answer is a prefix of the recorded text, and the timer shows recorded time, never more.
        const mid = appFrameAt(schedule, (schedule.answerStart + schedule.duration) / 2);
        expect(turn.final_text.startsWith(mid.answer)).toBe(true);
        expect(mid.realMs).toBeLessThanOrEqual(turn.stats.duration_ms);
        expect(schedule.duration).toBeLessThan(20_000);
        // Every row keeps its recorded order.
        const rows = activityRows(turn);
        expect(rows.map((row) => row.realMs)).toEqual([...rows.map((row) => row.realMs)].sort((a, b) => a - b));
      });
    }
  }
});

describe("parsing", () => {
  it("cuts citations out of an answer without changing the text", () => {
    const text = "ordner/strom_2025.csv Z. 3–10 und `kompensation_2025.txt:5, 7` sowie bio_zertifikat_weinberg.txt";
    const parts = citeParts(text, ["strom_2025.csv", "kompensation_2025.txt", "bio_zertifikat_weinberg.txt"]);
    expect(parts.map((part) => part.text).join("")).toBe(text);
    expect(citationsIn(text, ["strom_2025.csv", "kompensation_2025.txt", "bio_zertifikat_weinberg.txt"])).toEqual([
      { file: "strom_2025.csv", from: 3, to: 10 },
      { file: "kompensation_2025.txt", from: 5, to: 5 },
      { file: "bio_zertifikat_weinberg.txt", from: null, to: null },
    ]);
  });

  it("takes the attachment line off the prompt the visitor types", () => {
    expect(typedPrompt("Angehängt: a.md\n\nBeantworte.")).toBe("Beantworte.");
    expect(typedPrompt("Attached: a.md\n\nAnswer.")).toBe("Answer.");
    expect(typedPrompt("Nur Text")).toBe("Nur Text");
  });

  it("prints the measured times as the deck does", () => {
    expect(minutesSeconds(summary("de").medianS)).toEqual({ min: 8, s: 32 });
    expect(minutesSeconds(summary("en").medianS)).toEqual({ min: 7, s: 50 });
    expect(minutesSeconds(summary("en").maxS)).toEqual({ min: 9, s: 7 });
    expect(roundHalfEven(66.9)).toBe(67);
    expect(roundHalfEven(51.9)).toBe(52);
  });
});
