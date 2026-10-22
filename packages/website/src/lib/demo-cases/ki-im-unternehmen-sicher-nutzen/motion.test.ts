import { describe, expect, it } from "vitest";
import {
  PACKET_X0,
  PACKET_X1,
  clamp01,
  commitFrames,
  dialFrame,
  revealFrame,
  slotFrame,
  stampFrame,
} from "./motion";

describe("motion frames are pure functions of t", () => {
  it("rests every reveal part at t = 1", () => {
    const end = revealFrame(1);
    expect(end.lamp).toEqual({ opacity: 1, scale: 1 });
    expect(end.packet.x).toBe(PACKET_X1);
    expect(end.rows).toEqual({ opacity: 1, y: 0 });
  });

  it("runs the reveal in sequence: lamp, then packet, then rows", () => {
    const early = revealFrame(0.1);
    expect(early.lamp.opacity).toBeCloseTo(0.5);
    expect(early.packet.x).toBe(PACKET_X0);
    expect(early.rows.opacity).toBe(0);
    const middle = revealFrame(0.5);
    expect(middle.lamp.opacity).toBe(1);
    expect(middle.packet.x).toBeGreaterThan(PACKET_X0);
    expect(middle.packet.x).toBeLessThan(PACKET_X1);
    expect(middle.rows.opacity).toBe(0);
  });

  it("draws the underline only after the packet landed", () => {
    const mid = dialFrame(0.5, ["company"]);
    expect(mid.underline.company).toBe(0);
    expect(mid.packet.x).toBeLessThan(PACKET_X1);
    const end = dialFrame(1, ["company"]);
    expect(end.underline).toEqual({ company: 1 });
    expect(end.packet.x).toBe(PACKET_X1);
    expect(dialFrame(1, []).underline).toEqual({});
  });

  it("drops the slot glyph after the reveal", () => {
    expect(commitFrames(0)).toEqual({ reveal: 0, slot: 0 });
    expect(commitFrames(700 / 900).reveal).toBeCloseTo(1);
    expect(commitFrames(700 / 900).slot).toBeCloseTo(0);
    expect(commitFrames(1)).toEqual({ reveal: 1, slot: 1 });
    expect(slotFrame(1)).toEqual({ opacity: 1, scale: 1 });
  });

  it("settles the Friday stamp from 1.12 to 1", () => {
    expect(stampFrame(0)).toEqual({ opacity: 0, scale: 1.12 });
    expect(stampFrame(1)).toEqual({ opacity: 1, scale: 1 });
    expect(clamp01(2)).toBe(1);
    expect(clamp01(-1)).toBe(0);
  });
});
