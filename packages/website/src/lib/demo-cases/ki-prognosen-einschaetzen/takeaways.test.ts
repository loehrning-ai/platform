// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { FORECAST_COPY } from "./copy";
import { MORNINGS } from "./data";
import { INITIAL_STATE, reducer, rightOption, type DemoState } from "./logic";
import { DRAFT_KEY, loadDraft, loadState, parseState, saveDraft, saveState, STATE_KEY } from "./storage";
import {
  BLANK_COUNT,
  buildTakeaways,
  fillSentence,
  OWNER_BLANK,
  ownerText,
  prefillOwner,
  sentenceBlanks,
  type SentenceDraft,
} from "./takeaways";

describe("buildTakeaways", () => {
  const empty = Array.from({ length: BLANK_COUNT }, () => "");

  it("inserts the owner and trims an own role to 40 characters", () => {
    const own = buildTakeaways({ owner: { key: "custom", custom: `Schichtleitung ${"x".repeat(50)}` }, blanks: empty, copy: FORECAST_COPY.de });
    const line = own.check.split("\n").find((l) => l.startsWith("Ein Nein:")) ?? "";
    expect(line.replace("Ein Nein: ", "").replace(" entscheidet, bevor etwas rausgeht.", "")).toHaveLength(40);
    expect(buildTakeaways({ owner: { key: "custom", custom: "Disposition" }, blanks: empty, copy: FORECAST_COPY.en }).check).toContain(
      "One no: Disposition decides before anything ships.",
    );
  });

  it("falls back to the default owner for analytics, whoever is free or no pick", () => {
    for (const owner of [null, { key: "analytics", custom: "" }, { key: "whoeverFree", custom: "" }] as const) {
      expect(ownerText(owner, FORECAST_COPY.de)).toBe("der Planer oder die Planerin vom Dienst");
      expect(ownerText(owner, FORECAST_COPY.en)).toBe("the planner on duty");
    }
  });

  it("copies empty blanks as ___ and filled ones as typed", () => {
    const { sentences } = buildTakeaways({ owner: null, blanks: empty, copy: FORECAST_COPY.de });
    expect(sentences.split("\n")).toEqual([
      "1. Wir prognostizieren ___ für ___, damit ___ getroffen wird.",
      "2. Die Baseline ist ___; das Modell muss sie im WAPE auf Wochen schlagen, die es nicht kannte.",
      "3. Zu wenig kostet uns ___, zu viel kostet uns ___.",
      "4. Der Plan geht allein raus, solange ___ bestehen und nichts passiert, was das Modell nicht kennt.",
      "5. Bei einem Nein entscheidet ___, bevor etwas rausgeht.",
    ]);
    const filled = buildTakeaways({
      owner: null,
      blanks: ["die Retouren", "  die nächsten 4 Wochen ", "die Personalplanung", "der Vorjahreswert", "", "Überstunden", "", "die Schichtleitung"],
      copy: FORECAST_COPY.de,
    });
    expect(filled.sentences.split("\n")[0]).toBe("1. Wir prognostizieren die Retouren für die nächsten 4 Wochen, damit die Personalplanung getroffen wird.");
    expect(filled.sentences.split("\n")[2]).toBe("3. Zu wenig kostet uns ___, zu viel kostet uns Überstunden.");
  });

  it("lists eight labelled blanks per locale", () => {
    expect(sentenceBlanks(FORECAST_COPY.de)).toHaveLength(8);
    expect(sentenceBlanks(FORECAST_COPY.en).map((b) => b.sentence)).toEqual([0, 0, 0, 1, 2, 2, 3, 4]);
    expect(fillSentence(["a ", { blank: "x", label: "X" }, " b"], ["  "], "___")).toBe("a ___ b");
  });
});

describe("storage", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  const played = (): DemoState => {
    let state = reducer(INITIAL_STATE, { type: "ENTER_MORNINGS" });
    state = reducer(state, { type: "PICK_OWNER", owner: { key: "plannerOnDuty", custom: "" } });
    state = reducer(state, { type: "START_MORNINGS" });
    state = reducer(state, { type: "ANSWER", day: 0, option: rightOption(MORNINGS[0]!) });
    return state;
  };

  it("round-trips a played state", () => {
    const state = played();
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it("clears the entry for the untouched start state", () => {
    saveState(played());
    saveState(INITIAL_STATE);
    expect(window.localStorage.getItem(STATE_KEY)).toBeNull();
  });

  it("rejects broken or inconsistent states", () => {
    const good = JSON.parse(JSON.stringify(played())) as Record<string, unknown>;
    expect(parseState(good)).not.toBeNull();
    expect(parseState(null)).toBeNull();
    expect(parseState({ ...good, step: "elsewhere" })).toBeNull();
    expect(parseState({ ...good, plan: [1, 2, 3] })).toBeNull();
    expect(parseState({ ...good, answers: ["retrain", null, null, null, null, null, null] })).toBeNull();
    expect(parseState({ ...good, answers: [null, "waitRefresh", null, null, null, null, null] })).toBeNull();
    expect(parseState({ ...good, ownerLocked: false })).toBeNull();
    expect(parseState({ ...good, step: "result" })).toBeNull();
    expect(parseState({ ...good, day: 9 })).toBeNull();
    window.localStorage.setItem(STATE_KEY, "{not json");
    expect(loadState()).toBeNull();
  });

  it("survives a storage that throws", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveState(played())).not.toThrow();
    expect(() => saveDraft({ blanks: ["a", "", "", "", "", "", "", ""], prefill: null })).not.toThrow();
    expect(loadState()).toBeNull();
    expect(loadDraft()).toBeNull();
  });

  it("keeps the five-sentence draft with its prefill marker", () => {
    const blanks = ["a", "b", "", "", "", "", "", PLANNER];
    saveDraft({ blanks, prefill: PLANNER });
    expect(loadDraft()).toEqual({ blanks, prefill: PLANNER });
    saveDraft({ blanks: Array.from({ length: 8 }, () => " "), prefill: null });
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(["only one"]));
    expect(loadDraft()).toBeNull();
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ blanks: ["x"], prefill: PLANNER }));
    expect(loadDraft()).toBeNull();
  });

  it("reads the earlier bare-array draft without a marker", () => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(["a", "", "", "", "", "", "", "b"]));
    expect(loadDraft()).toEqual({ blanks: ["a", "", "", "", "", "", "", "b"], prefill: null });
  });
});

const PLANNER = FORECAST_COPY.de.takeaways.ownerDefault;

describe("prefillOwner", () => {
  const ROLE = "die Teamleitung Disposition";
  const fresh: SentenceDraft = { blanks: Array.from({ length: BLANK_COUNT }, () => ""), prefill: null };
  const withOwner = (draft: SentenceDraft, value: string): SentenceDraft => ({
    ...draft,
    blanks: draft.blanks.map((v, i) => (i === OWNER_BLANK ? value : v)),
  });

  it("planner, restart, own role: sentence 5 takes the own role", () => {
    const planner = prefillOwner(fresh, PLANNER);
    expect(planner.blanks[OWNER_BLANK]).toBe(PLANNER);
    const custom = prefillOwner(planner, ROLE);
    expect(custom).toEqual({ blanks: withOwner(fresh, ROLE).blanks, prefill: ROLE });
  });

  it("planner, edited blank, restart, own role: the edit stays", () => {
    const edited = withOwner(prefillOwner(fresh, PLANNER), "die Filialleitung");
    const custom = prefillOwner(edited, ROLE);
    expect(custom.blanks[OWNER_BLANK]).toBe("die Filialleitung");
    expect(custom.prefill).toBe(ROLE);
  });

  it("refills an emptied blank only for a new role, and leaves other blanks alone", () => {
    const start: SentenceDraft = { ...fresh, blanks: fresh.blanks.map((v, i) => (i === 0 ? "Retouren" : v)) };
    const cleared = withOwner(prefillOwner(start, PLANNER), "");
    expect(prefillOwner(cleared, PLANNER)).toBe(cleared);
    const custom = prefillOwner(cleared, ROLE);
    expect(custom.blanks[OWNER_BLANK]).toBe(ROLE);
    expect(custom.blanks[0]).toBe("Retouren");
  });

  it("treats whitespace around the old prefill as untouched", () => {
    const spaced = withOwner(prefillOwner(fresh, PLANNER), `  ${PLANNER} `);
    expect(prefillOwner(spaced, ROLE).blanks[OWNER_BLANK]).toBe(ROLE);
  });

  it("keeps a typed blank when there was no marker yet (earlier draft)", () => {
    expect(prefillOwner(withOwner(fresh, PLANNER), ROLE).blanks[OWNER_BLANK]).toBe(PLANNER);
  });
});
