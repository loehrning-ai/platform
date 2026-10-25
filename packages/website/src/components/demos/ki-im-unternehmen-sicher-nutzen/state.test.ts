import { describe, expect, it } from "vitest";
import { COPY } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/copy";
import { UNDO_LIMIT, initialState, reducer, type DemoState } from "./state";

const [ana, marko] = COPY.de.samples;
const start = initialState(ana);

describe("demo state", () => {
  it("starts on Ana with her account, her task and the handle at rest", () => {
    expect(start).toMatchObject({ sampleId: "ana", account: "personal", p: 0, sent: false, manual: [], kept: [] });
    expect(start.task).toBe(ana.task);
  });

  it("returns a new state and never mutates the old one", () => {
    const next = reducer(start, { type: "p", p: 0.5 });
    expect(next).not.toBe(start);
    expect(start.p).toBe(0);
  });

  it("switching the sample sets its account and task, resets the handle and keeps the answer", () => {
    const withAnswer = reducer({ ...start, p: 1 }, { type: "answer", answer: "Hallo [KUNDE]" });
    const next = reducer(withAnswer, { type: "sample", sample: COPY.de.samples[2] });
    expect(next).toMatchObject({ sampleId: "mila", account: "enterprise", p: 0, answer: "Hallo [KUNDE]" });
  });

  it("new text resets the handle, the marks and the sent latch, and clears the task of a sample", () => {
    const worked = reducer(reducer({ ...start, p: 1 }, { type: "keep", id: "email:1" }), { type: "send" });
    const next = reducer(worked, { type: "text", text: "Neuer Text" });
    expect(next).toMatchObject({ text: "Neuer Text", sampleId: null, p: 0, sent: false, kept: [], manual: [], task: "" });
  });

  it("clamps the handle and freezes it once sent, until reset", () => {
    expect(reducer(start, { type: "p", p: 4 }).p).toBe(1);
    expect(reducer(start, { type: "p", p: -1 }).p).toBe(0);
    const sent = reducer({ ...start, p: 0.4 }, { type: "send" });
    expect(reducer(sent, { type: "p", p: 1 }).p).toBe(0.4);
    expect(reducer(sent, { type: "reset" })).toMatchObject({ sent: false, p: 0 });
  });

  it("taps a word, undoes it, and toggles keep with undo", () => {
    const tapped = reducer(start, { type: "word", span: { start: 0, end: 5 } });
    expect(tapped.manual).toHaveLength(1);
    expect(reducer(tapped, { type: "undo" }).manual).toHaveLength(0);
    const kept = reducer(start, { type: "keep", id: "email:5" });
    expect(kept.kept).toEqual(["email:5"]);
    expect(reducer(kept, { type: "keep", id: "email:5" }).kept).toEqual([]);
    expect(reducer(start, { type: "undo" })).toBe(start);
  });

  it("keeps at most 50 undo steps", () => {
    let state: DemoState = initialState(marko);
    for (let i = 0; i < UNDO_LIMIT + 10; i += 1) state = reducer(state, { type: "keep", id: `x:${i}` });
    expect(state.undo).toHaveLength(UNDO_LIMIT);
  });
});
