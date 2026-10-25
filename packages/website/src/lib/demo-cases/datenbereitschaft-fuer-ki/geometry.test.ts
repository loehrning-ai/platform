import { describe, expect, it } from "vitest";
import { fitSize, geometry, MONTH_ROW, NOTE_ROW, PHONE_HEIGHT } from "./geometry";

describe("geometry", () => {
  it("is as big as the plot box and keeps the phone box compact", () => {
    const phone = geometry(282);
    expect([phone.W, phone.H, phone.wide]).toEqual([282, PHONE_HEIGHT, false]);
    expect(phone.Y1).toBe(PHONE_HEIGHT - NOTE_ROW - MONTH_ROW);
    expect(phone.Y1 - phone.Y0).toBeGreaterThan(120);
  });
  it("takes the height it is given on a wide screen", () => {
    const desk = geometry(700, 332);
    expect([desk.wide, desk.H]).toEqual([true, 332]);
    expect(desk.maxBar).toBeGreaterThan(100);
  });
  it("clamps silly sizes", () => {
    expect(geometry(10).W).toBe(240);
    expect(geometry(5000).W).toBe(1200);
    expect(geometry(300, 10).H).toBe(170);
  });
  it("shrinks a long number to fit, never below the minimum", () => {
    expect(fitSize("334.675 €", 400, 36)).toBe(36);
    expect(fitSize("1.234.567.890,12", 170, 36)).toBeLessThan(36);
    expect(fitSize("1.234.567.890.123", 10, 36)).toBe(20);
  });
});
