import { describe, expect, it } from "vitest";
import type { ClaudeRecording } from "@/lib/claude-runs";
import { SCENE } from "./claude-runs";
import { CLAUDE_ANSWER, T1_EXPECTED } from "./data";
import { answerValues, asksQuestion, factsOf, holdsAll } from "./facts";

const take = (id: string): ClaudeRecording => {
  const found = SCENE?.recordings.find((recording) => recording.id === id);
  if (!found) throw new Error(id);
  return found;
};

describe("facts of the recorded takes", () => {
  it("reads numbers in the take's own notation", () => {
    expect(holdsAll("75.890 und 85.665", [75_890, 85_665], "de")).toBe(true);
    expect(holdsAll("75,890", [75_890], "de")).toBe(false);
    expect(holdsAll("| X + 75.890 |", [75_890], "de")).toBe(false);
    expect(holdsAll("**75.890**", [75_890], "de")).toBe(true);
    expect(holdsAll("175.890", [75_890], "de")).toBe(false);
    expect(asksQuestion("Text.\n\n**Welche Codes zählen?**")).toBe(true);
    expect(asksQuestion("Hier ist die Tabelle.\n\nSo ist es.")).toBe(false);
  });

  it("finds the rehearsal table in the follow-up of the takes without the skill, never the expected values", () => {
    for (const id of ["de-monat-without-1", "en-month-without-1"]) {
      expect(factsOf(take(id)), id).toMatchObject({ turns: 2, expectedValuesTurn: null });
      expect(factsOf(take(id)).rehearsalValuesTurn, id).not.toBeNull();
      expect(factsOf(take(id)).followUpGivesRehearsal, id).toBe(true);
      expect(factsOf(take(id)).firstTurnNamesOpening, id).toBe(true);
    }
  });

  it("finds that the takes with the skill ask back first", () => {
    for (const id of ["de-konten-with-1", "en-accounts-with-1", "de-konten-without-1", "en-accounts-without-1"]) expect(factsOf(take(id)).asksBack, id).toBe(true);
    expect(factsOf(take("de-monat-with-1")).rehearsalValuesTurn).toBeNull();
    expect(factsOf(take("en-month-with-1")).rehearsalValuesTurn).toBeNull();
    expect(factsOf(take("de-monat-without-1")).rehearsalValuesTurn).toBe(2);
    for (const id of ["de-monat-with-1", "en-month-with-1"]) expect(factsOf(take(id)).followUpGivesRehearsal, id).toBe(false);
  });

  it("reads the values each graded take ends with", () => {
    expect(answerValues(take("de-monat-without-1"))).toEqual(CLAUDE_ANSWER);
    expect(answerValues(take("en-month-without-1"))).toEqual(CLAUDE_ANSWER);
    expect(answerValues(take("de-monat-with-1"))).toBeNull();
    expect(answerValues(take("en-month-with-1"))).toBeNull();
    for (const id of ["de-sicht-with-1", "de-sicht-without-1", "en-view-with-1", "en-view-without-1"]) expect(answerValues(take(id)), id).toEqual(T1_EXPECTED);
  });

  it("every take is an unedited recording", () => {
    for (const recording of SCENE?.recordings ?? []) expect(recording.edited, recording.id).toBe(false);
  });
});
