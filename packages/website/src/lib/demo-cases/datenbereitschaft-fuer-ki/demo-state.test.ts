import { describe, expect, it } from "vitest";
import { aliasTarget, BEATS } from "./beats";
import { DE } from "./copy-de";
import { EN } from "./copy-en";
import { CLAUDE_ANSWER, ENDING_MRR, NET_NEW_2026, OPENING_DEC_2025 } from "./data";
import { boxes, CARD_SIDE, demoReducer, INITIAL_STATE, moveDone, NOTCH_EUR, OPENING_STEP, openingOf, sortDone, type Action, type DemoState } from "./demo-state";
import { EDGE_STARTS, tubLevels } from "./logic";

const run = (actions: readonly Action[], from: DemoState = INITIAL_STATE) => actions.reduce(demoReducer, from);

describe("grading after the test", () => {
  it("picks an answer only once the test ran, and a restart forgets it", () => {
    expect(run([{ type: "grade", grade: "with" }]).grade).toBe("rehearsal");
    const tested = run([{ type: "reach", beat: 4, move: 2 }, { type: "test" }, { type: "grade", grade: "view" }]);
    expect(tested.tested).toBe(true);
    expect(tested.grade).toBe("view");
    expect(demoReducer(tested, { type: "restart" }).grade).toBe("rehearsal");
  });
});

describe("the old kit links (v3 beat ids)", () => {
  it("land on their v4 beat and move", () => {
    const index = (id: string) => BEATS.findIndex((beat) => beat.id === id);
    expect(aliasTarget("lesarten")).toEqual({ id: "wanne", move: 1, index: index("wanne") });
    expect(aliasTarget("grenze")).toEqual({ id: "projekt", move: 1, index: index("projekt") });
    expect(aliasTarget("test")).toEqual({ id: "projekt", move: 2, index: index("projekt") });
    // ids the shell reads itself are no alias
    expect(aliasTarget("sicht")).toBeNull();
    expect(aliasTarget("wer-zaehlt")).toBeNull();
    expect(aliasTarget(null)).toBeNull();
  });

  it("?beat=test opens the test with the sort already done, and nothing tested yet", () => {
    const target = aliasTarget("test");
    if (!target) throw new Error("alias");
    const state = run([{ type: "reach", beat: target.index, move: target.move }]);
    expect(sortDone(state)).toBe(true);
    expect(state.projektMove).toBe(2);
    expect(state.tested).toBe(false);
    expect(boxes(state)).toEqual(["full", "full", "full", "full", "empty"]);
  });

  it("a jump never undoes a move", () => {
    const state = run([{ type: "opening", value: 120_000 }, { type: "reach", beat: 3 }]);
    expect(state.opening).toBe(120_000);
    expect(state.dragged).toBe(true);
  });
});

describe("the tub", () => {
  it("a drag snaps to Claude's start near zero, and Claude's table is the tub filled from empty", () => {
    expect(run([{ type: "opening", value: NOTCH_EUR - 1, snap: true }]).opening).toBe(0);
    const levels = tubLevels(NET_NEW_2026, 0).slice(3);
    expect(levels).toEqual(CLAUDE_ANSWER);
  });

  it("the arrow keys step up from zero: only a drag snaps (ArrowUp from 0 is 5.000, not 0)", () => {
    expect(run([{ type: "opening", value: OPENING_STEP }]).opening).toBe(OPENING_STEP);
    const up = Array.from({ length: 4 }, (_, index) => ({ type: "opening", value: (index + 1) * OPENING_STEP }) as Action);
    expect(run(up).opening).toBe(4 * OPENING_STEP);
  });

  it("pulling the file edge back to the first subscription gives the approved levels", () => {
    const state = run([{ type: "edge", edge: EDGE_STARTS.length - 1 }]);
    expect(openingOf(state)).toBe(OPENING_DEC_2025);
    const levels = tubLevels(NET_NEW_2026, openingOf(state)).slice(3);
    expect(levels).toEqual([ENDING_MRR["2026-04"], ENDING_MRR["2026-05"], ENDING_MRR["2026-06"]]);
    expect(moveDone({ ...state, wanneMove: 2 }, "wanne")).toBe(true);
  });
});

describe("the five boxes", () => {
  it("fill only by the visitor's own moves on the guided path", () => {
    expect(boxes(INITIAL_STATE)).toEqual(["empty", "empty", "empty", "empty", "empty"]);
    const question = run([{ type: "chip", chip: "kindRight" }]);
    expect(boxes(question)[0]).toBe("half");
    const who = run([{ type: "code", code: "A", on: true }, { type: "code", code: "N", on: true }]);
    expect(boxes(who)[2]).toBe("half");
    const both = run([{ type: "pour", pour: { kind: "levels", members: [0, 1] } }, { type: "pour", pour: { kind: "june", members: [2] } }], who);
    expect(boxes(both)[2]).toBe("full");
  });

  it("a file put on the wrong side waits, then glides to the card's side", () => {
    const wrong = run([{ type: "place", file: "contacts", side: "in" }]);
    expect(wrong.pending).toBe("contacts");
    expect(boxes(wrong)[3]).toBe("empty");
    const settled = run([{ type: "settle" }], wrong);
    expect(settled.placed.contacts).toBe(CARD_SIDE.contacts);
    // After the glide the file sits where the card wants it, but the visitor did not put it there.
    expect(settled.lastMatched).toBe(false);
    expect(run([{ type: "place", file: "contacts", side: CARD_SIDE.contacts }]).lastMatched).toBe(true);
    expect(boxes(settled)[3]).toBe("full");
  });

  it("the test runs only once the files are sorted", () => {
    expect(run([{ type: "test" }]).tested).toBe(false);
    const sorted = run((Object.keys(CARD_SIDE) as (keyof typeof CARD_SIDE)[]).map((file) => ({ type: "place", file, side: CARD_SIDE[file] }) as Action));
    expect(run([{ type: "test" }], sorted).tested).toBe(true);
  });

  it("restart clears every move", () => {
    const busy = run([{ type: "send", to: "ask" }, { type: "opening", value: 90_000 }, { type: "tile", tile: "view" }]);
    expect(run([{ type: "restart" }], busy)).toEqual(INITIAL_STATE);
  });
});

describe("glossary (language-standard C.3, word for word)", () => {
  it("German", () => {
    expect(Object.fromEntries(Object.values(DE.glossary).map((entry) => [entry.term, entry.text]))).toEqual({
      "Ending MRR": "die monatlich wiederkehrenden Umsätze aller Abos, die am Monatsende laufen",
      Stand: "ein Wert zu einem Zeitpunkt, zum Beispiel am Monatsende; Stände addiert man nie über Monate",
      Veränderung: "was in einem Zeitraum dazukommt oder wegfällt; Veränderungen darf man addieren",
      Quote: "Zähler geteilt durch Nenner; für ein Quartal neu rechnen, nie mitteln",
      Anfangsstand: "der Stand vor dem ersten Monat der Datei; ohne ihn lässt sich aus Veränderungen kein Stand rechnen",
      "freigegebene Sicht": "eine Tabelle, die jemand geprüft und für solche Fragen freigegeben hat",
      Sperre: "wie du sicherstellst, dass Claude bestimmte Daten nie sieht: Datei nicht hochladen oder Login ohne Leserecht",
      Test: "eine Frage mit erwartetem Ergebnis, das von außerhalb der KI kommt und nicht in Claudes Projekt liegt",
    });
  });

  it("English", () => {
    expect(Object.fromEntries(Object.values(EN.glossary).map((entry) => [entry.term, entry.text]))).toEqual({
      "ending MRR": "monthly recurring revenue from every subscription still running at month end",
      level: "a value at one point in time, such as month end; levels are never added across months",
      change: "what is added or lost during a period; changes can be added up",
      rate: "numerator divided by denominator; recompute it for a quarter, never average it",
      "opening level": "the level before the first month in the file; without it no level can be built from changes",
      "approved view": "a table someone has checked and approved for this kind of question",
      lock: "how you make sure Claude never sees certain data: do not upload the file, or use a login without read access",
      test: "a question with an expected result that comes from outside the AI and is kept out of Claude's Project",
    });
  });
});
