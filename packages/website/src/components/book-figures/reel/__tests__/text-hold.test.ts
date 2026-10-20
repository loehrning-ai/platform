import { describe, expect, it } from "vitest";
import { createReel } from "../reel.ts";
import { textMarkup } from "../text.ts";

const MAIN = new Set(["numeral", "claim", "take", "title"]);

describe.each(["tall", "wide"] as const)("reel text host (%s)", (format) => {
  const reel = createReel(format);

  it("never clips an item while it holds (0.4 s after in until its exit starts)", () => {
    for (const item of reel.items) {
      const from = item.tIn + 0.4 + (item.lines.length - 1) * 0.03;
      const to = item.tIn + item.dur - 0.02;
      for (let t = from; t <= to; t += 0.02) {
        const html = textMarkup([item], t % 30);
        const clips = [...html.matchAll(/clip-path:inset\(-25% ([\d.]+)% -25% ([\d.]+)%\)/g)];
        expect((html.match(/<div /g) ?? []).length, `${item.key} @${t.toFixed(2)}`).toBe(item.lines.length);
        for (const c of clips) {
          expect(Number(c[1]), `${item.key} right @${t.toFixed(2)}`).toBe(0);
          expect(Number(c[2]), `${item.key} left @${t.toFixed(2)}`).toBe(0);
        }
      }
    }
  });

  it("has no empty beat longer than 0.4 s between main texts", () => {
    let start = -1;
    let longest = 0;
    for (let t = 0; t <= 30; t += 0.05) {
      const n = reel.visible(t).filter((i) => MAIN.has(i.role)).length;
      if (n === 0 && start < 0) start = t;
      if (n > 0 && start >= 0) {
        longest = Math.max(longest, t - start);
        start = -1;
      }
    }
    expect(longest).toBeLessThanOrEqual(0.41);
  });

  it("never shows two numerals, or two claims, in the same place at the same time", () => {
    for (const role of ["numeral", "claim"] as const) {
      const same = reel.items.filter((i) => i.role === role);
      for (let t = 0; t < 30; t += 0.02) {
        const here = reel.visible(t).filter((i) => i.role === role);
        for (let a = 0; a < here.length; a += 1) {
          for (let b = a + 1; b < here.length; b += 1) {
            const p = here[a]!;
            const q = here[b]!;
            const sameBox = Math.abs(p.x - q.x) < 1 && Math.abs(p.y - q.y) < 1;
            expect(sameBox, `${p.key} and ${q.key} @${t.toFixed(2)}`).toBe(false);
          }
        }
      }
      expect(same.length).toBeGreaterThan(0);
    }
  });

  it("leaves a clear gap between an exiting claim or numeral and the next in its place", () => {
    for (const role of ["numeral", "claim"] as const) {
      const sorted = reel.items.filter((i) => i.role === role).sort((a, b) => a.tIn - b.tIn);
      sorted.forEach((a, k) => {
        const next = sorted.slice(k + 1).find((n) => Math.abs(n.x - a.x) < 1 && Math.abs(n.y - a.y) < 1 && n.tIn - a.tIn >= 0.3);
        if (next) expect(a.tIn + a.dur + 0.2 + 0.05, `${a.key} -> ${next.key}`).toBeLessThanOrEqual(next.tIn + 1e-6);
      });
    }
  });
});
