import { describe, expect, it } from "vitest";
import type { ClaudeRecording } from "@/lib/claude-runs";
import { NOTES, SCENE } from "./claude-runs";

const turnText = (id: string, turn: number): string => {
  const take = SCENE?.recordings.find((recording) => recording.id === id);
  if (!take) throw new Error(`no take ${id}`);
  const all = [take.final_text, ...take.follow_ups.map((entry) => entry.final_text)];
  const text = all[turn - 1];
  if (text === undefined) throw new Error(`${id} has no turn ${turn}`);
  return text;
};

const localeOf = (id: string): ClaudeRecording["locale"] | undefined => SCENE?.recordings.find((recording) => recording.id === id)?.locale;

/** Grouped numbers ("75.890", "128,230") and bare numbers of two or more digits in a note. */
const numbersIn = (text: string): readonly string[] => text.match(/\d{1,3}(?:[.,]\d{3})+|\b\d{2,}\b/g) ?? [];

describe("Unsere Notiz is read back from the takes", () => {
  for (const locale of ["de", "en"] as const) {
    it(`${locale}: every quoted phrase is in the named take and turn, in that locale`, () => {
      for (const note of NOTES[locale]) {
        expect(note.evidence.length, note.text).toBeGreaterThan(0);
        for (const evidence of note.evidence) {
          expect(localeOf(evidence.take), evidence.take).toBe(locale);
          const text = turnText(evidence.take, evidence.turn);
          for (const phrase of evidence.says) expect(text, `${evidence.take} turn ${evidence.turn}`).toContain(phrase);
        }
      }
    });

    it(`${locale}: every number a note names appears in its evidence`, () => {
      for (const note of NOTES[locale]) {
        const evidence = note.evidence.map((entry) => turnText(entry.take, entry.turn)).join("\n");
        for (const number of numbersIn(note.text)) {
          // Dates in a note ("31.12.2025", "30. Juni") are checked as phrases above.
          if (/^\d{2}$/.test(number) && note.text.includes(`${number}.`)) continue;
          if (/^20\d\d$/.test(number)) continue;
          expect(evidence, `${number} in "${note.text}"`).toContain(number);
        }
      }
    });
  }

  it("the scene shows exactly these notes", () => {
    expect(SCENE?.notes?.de).toEqual(NOTES.de.map((note) => note.text));
    expect(SCENE?.notes?.en).toEqual(NOTES.en.map((note) => note.text));
  });

  it("the take with the skill keeps the level open even after the request to answer directly", () => {
    for (const id of ["de-monat-with-1", "en-month-with-1"]) {
      expect(turnText(id, 2), id).not.toMatch(/\|\s*\*{0,2}75[.,]890\*{0,2}\s*\|/);
    }
  });
});
