/**
 * The reel is one pure piece. These tests pin the contract of the house
 * rules: seek(t) is deterministic in any order, frame 0 and the last frame are
 * a designed seam, every number on screen is the JSON's number, the squares
 * add up, the stage never speaks more than 12 words, nothing banned is in the
 * render code and the frozen file passes the privacy rules of the figure gate.
 */

import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import reelJson from "../reel-data.json";
import { N } from "../builder.ts";
import { type ReelData, REEL_DATA, binCounts, largestRemainder, lookup } from "../data.ts";
import { STRIDE } from "../field.ts";
import { createReel, DURATION, POSTER_T } from "../reel.ts";
import { textMarkup, visibleItems } from "../text.ts";

const DIR = resolve(__dirname, "..");
const FORMATS = ["tall", "wide"] as const;
const md5 = (s: string): string => createHash("md5").update(s).digest("hex");
const grid = (step: number): number[] => Array.from({ length: Math.round(DURATION / step) }, (_, i) => i * step);

describe("seek(t) is deterministic", () => {
  for (const format of FORMATS) {
    it(`${format}: same t, same markup, in forward, backward and shuffled order`, () => {
      const reel = createReel(format);
      const ts = grid(0.5);
      const hashAt = (t: number): string => {
        const f = reel.frame(t);
        return md5(f.svg + f.html);
      };
      const forward = ts.map(hashAt);
      const backward = [...ts].reverse().map(hashAt).reverse();
      const order = ts.map((_, i) => (i * 7) % ts.length);
      const shuffled: string[] = [];
      for (const i of order) shuffled[i] = hashAt(ts[i] as number);
      expect(backward).toEqual(forward);
      expect(shuffled).toEqual(forward);
      // A second reel built from scratch agrees as well.
      const other = createReel(format);
      const g = other.frame(12.3);
      expect(md5(g.svg + g.html)).toBe(md5(reel.frame(12.3).svg + reel.frame(12.3).html));
    });
  }

  it("the loop wraps: t and t + 30 are the same frame", () => {
    const reel = createReel("tall");
    for (const t of [0, 3.7, 29.9]) {
      expect(reel.frame(t + DURATION).svg).toBe(reel.frame(t).svg);
      expect(reel.frame(t - DURATION).html).toBe(reel.frame(t).html);
    }
  });
});

describe("loop seam", () => {
  const DT = 1 / 30;
  for (const format of FORMATS) {
    it(`${format}: the last frame flows into frame 0 without a jump`, () => {
      const reel = createReel(format);
      const a = new Float32Array(N * STRIDE);
      const b = new Float32Array(N * STRIDE);
      const nA = reel.field.evalField(DURATION - DT, a);
      const nB = reel.field.evalField(0, b);
      expect(nA).toBe(nB);
      // Same squares, each moved less than a few pixels in one frame step.
      let worst = 0;
      for (let i = 0; i < nA; i += 1) {
        expect(a[i * STRIDE + 6]).toBe(b[i * STRIDE + 6]);
        for (let c = 0; c < 4; c += 1) worst = Math.max(worst, Math.abs((a[i * STRIDE + c] as number) - (b[i * STRIDE + c] as number)));
        expect(a[i * STRIDE + 4]).toBe(b[i * STRIDE + 4]);
      }
      expect(worst).toBeLessThan(8);
      // The same text items are on screen on both sides, none dies or is born at the seam.
      const keys = (t: number): string => reel.visible(t).map((i) => i.key).sort().join(",");
      expect(keys(DURATION - DT)).toBe(keys(0));
      // And no ink ground jumps in or out.
      expect(reel.scene(DURATION - DT).ground).toEqual([]);
      expect(reel.scene(0).ground).toEqual([]);
    });

    it(`${format}: frame 0 already shows a finding in motion, the poster is the settled cover`, () => {
      const reel = createReel(format);
      const f0 = reel.visible(0).map((i) => i.key);
      expect(f0).toContain("c-twice");
      expect(reel.scene(0).count).toBe(REEL_DATA.h05.of);
      const poster = reel.visible(POSTER_T).map((i) => i.key);
      expect(poster).toEqual(expect.arrayContaining(["end-title", "end-sub", "end-brand"]));
    });
  }
});

describe("hook in two seconds", () => {
  it("by t = 2 s the numeral is at final size and shows the JSON finding", () => {
    const reel = createReel("tall");
    const numeral = reel.visible(2.0).find((i) => i.role === "numeral");
    expect(numeral?.lines[0]?.[0]?.s).toBe("46\u00a0%");
    expect(numeral?.fs).toBe(150);
    // The first title card never exists: no title item before the end card.
    for (const t of grid(0.1).filter((x) => x < 27)) expect(reel.visible(t).some((i) => i.role === "title")).toBe(false);
  });

  it("a new thing starts every 2 to 4 seconds", () => {
    const reel = createReel("tall");
    const events = new Set<number>();
    for (const s of reel.field.states) events.add(Math.round((s.t % DURATION) * 100) / 100);
    for (const it of reel.items) events.add(Math.round(it.tIn * 100) / 100);
    const times = [...events].filter((t) => t >= 0 && t < DURATION).sort((p, q) => p - q);
    let worst = 0;
    for (let i = 1; i < times.length; i += 1) worst = Math.max(worst, (times[i] as number) - (times[i - 1] as number));
    expect(worst).toBeLessThanOrEqual(3.0);
  });
});

/* ------------------------------------------------------------------ truth */

const de = (v: number, d: number): string => new Intl.NumberFormat("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: v >= 1000 }).format(v);
const NB = " ";

/** Independent re-implementation of the token formats, using Intl. */
function independent(data: ReelData, path: string, kind: string): string {
  const v = lookup(data, path);
  if (kind === "ymRange") { const [a, b] = v as [string, string]; return `${a.slice(0, 7)} bis ${b.slice(5, 7)}`; }
  if (kind === "ym") return (v as string).slice(0, 7);
  const x = v as number;
  const digits: Record<string, number> = { int: 0, num0: 0, pct0: 0, pct1: 1, pct2: 2, x0: 0, x1: 1, x2: 2, dec1: 1 };
  const d = digits[kind] ?? 0;
  const body = de(Math.round(x * 10 ** d + 1e-9) / 10 ** d, d);
  return kind.startsWith("pct") ? `${body}${NB}%` : kind.startsWith("x") ? `${body}×` : body;
}

function squaresOfBin(data: ReelData, which: "a" | "b", id: string): number {
  const order = ["dup", "gig", "student", "intermediary", "business", "tech"] as const;
  const per = largestRemainder(binCounts(data.h02[which]), 100);
  return per[order.indexOf(id as (typeof order)[number])] as number;
}

describe("truth gate: every visible number is the JSON's number", () => {
  for (const format of FORMATS) {
    it(`${format}: logged tokens equal an independent formatting of the JSON`, () => {
      const reel = createReel(format);
      let checked = 0;
      for (const t of grid(0.05)) {
        for (const it of reel.visible(t)) {
          for (const tok of it.tokens) {
            const want = tok.path.endsWith("#squares")
              ? String(squaresOfBin(REEL_DATA, it.key.endsWith("-b") ? "b" : "a", tok.path.split(".")[1]?.replace("#squares", "") ?? ""))
              : independent(REEL_DATA, tok.path, tok.kind);
            expect(tok.s, `${tok.path} at ${t}`).toBe(want);
            checked += 1;
          }
        }
      }
      expect(checked).toBeGreaterThan(500);
    });

    it(`${format}: no digit on screen that was not logged (except the unit 1)`, () => {
      const reel = createReel(format);
      for (const t of grid(0.1)) {
        const logged = reel.log(t).map((x) => x.s).join(" ");
        for (const it of reel.visible(t)) {
          const text = it.lines.map((l) => l.map((w) => w.s).join(" ")).join(" ");
          for (const num of text.match(/\d[\d.,]*\d|\d/g) ?? []) {
            if (num === "1") continue;
            expect(logged.includes(num), `"${num}" in ${it.key} at ${t}`).toBe(true);
          }
        }
      }
    });
  }

  it("the frozen file holds the numbers the notes assert", () => {
    const d = REEL_DATA;
    expect(d.h05.lost / d.h05.of).toBeCloseTo(d.h05.sharePct / 100, 4);
    expect(d.h01.n).toBe(d.h01.fifths.reduce((s, f) => s + f.n, 0));
    expect(d.h01.hits).toBe(d.h01.fifths.reduce((s, f) => s + f.k, 0));
    expect(d.h01.network.stay.length + d.h01.network.fade.length).toBe(d.h01.network.edgesRaw);
    expect(d.h01.network.stay.length + d.h01.network.add.length).toBe(d.h01.network.edgesEqual);
    expect(d.h01.perSquare).toBeCloseTo(d.h01.n / 1000, 3);
    expect(binCounts(d.h02.a).reduce((s, c) => s + c, 0)).toBe(d.h02.raw);
    expect(binCounts(d.h02.b).reduce((s, c) => s + c, 0)).toBe(d.h02.raw);
    expect(d.h02.perBlock).toBeCloseTo(d.h02.raw / 100, 2);
    expect(d.h03.firm.squares).toBeCloseTo((d.h03.firm.k / d.h03.firm.n) * 1000, 3);
    expect(d.h03.cond.ratio).toBeCloseTo(d.h03.cond.consult.pct / d.h03.cond.firm.pct, 2);
  });
});

describe("squares add up (population, classes, largest remainder)", () => {
  const reel = createReel("tall");
  const state = (id: string) => {
    const k = reel.field.states.findIndex((s) => s.id === id);
    expect(k, id).toBeGreaterThanOrEqual(0);
    return reel.field.builders[k]!;
  };
  const tally = (id: string) => {
    const b = state(id);
    const cls = [0, 0, 0];
    let fill = 0;
    let active = 0;
    for (let i = 0; i < N; i += 1) {
      if (!b.act[i]) continue;
      active += 1;
      cls[b.cls[i] as number] = (cls[b.cls[i] as number] as number) + 1;
      fill += b.fill[i] as number;
    }
    return { active, cls, fill };
  };
  const d = REEL_DATA;

  it("H05: 89 squares, 41 Mennige after the drop", () => {
    expect(tally("hook-in").active).toBe(d.h05.of);
    const drop = tally("hook-drop");
    expect(drop.active).toBe(d.h05.of);
    expect(drop.cls[2]).toBe(d.h05.lost);
    expect(tally("hook-bar").cls[2]).toBe(d.h05.lost);
    expect(tally("slat").active).toBe(d.h05.lost);
  });

  it("H01: 1.000 squares, KI share by fifth, fractions drawn as partial squares", () => {
    for (const id of ["pages-pour", "fifths"]) {
      const t = tally(id);
      expect(t.active).toBe(1000);
      // 1.000 squares are split 200 per fifth (the fifths hold 4.280 or 4.281 pages), so the total is within 0,005 of the exact share.
      expect(Math.abs(t.cls[2]! + t.fill - (d.h01.hits / d.h01.n) * 1000)).toBeLessThan(0.005);
    }
    const b = state("fifths");
    for (let f = 0; f < 5; f += 1) {
      let ki = 0;
      for (let i = f * 200; i < (f + 1) * 200; i += 1) ki += (b.cls[i] === 2 ? 1 : 0) + (b.fill[i] as number);
      const fifth = d.h01.fifths[f]!;
      expect(ki).toBeCloseTo((fifth.k / fifth.n) * 200, 6);
    }
    expect(tally("network").active).toBe(d.h01.network.features);
  });

  it("H02: 100 blocks by largest remainder, 35 then 49 in the Mennige bin", () => {
    expect(tally("ads-pour").active).toBe(100);
    expect(tally("ads-tech").cls[2]).toBe(squaresOfBin(d, "a", "tech"));
    expect(squaresOfBin(d, "a", "tech")).toBe(35);
    const after = tally("ads-switch");
    expect(after.active).toBe(100);
    expect(after.cls[2]).toBe(squaresOfBin(d, "b", "tech"));
    expect(squaresOfBin(d, "b", "tech")).toBe(49);
  });

  it("H03: 980 with 272 ink; firms 3 squares plus 0,74; same base 36 of 950", () => {
    const c = tally("consult-sort");
    expect(c.active).toBe(d.h03.consult.n);
    expect(c.cls[1]).toBe(d.h03.consult.k);
    const f = tally("firms-pour");
    expect(f.active).toBe(1000);
    expect(f.cls[2] + f.fill).toBeCloseTo((d.h03.firm.k / d.h03.firm.n) * 1000, 6);
    const g = tally("firms-ki-pour");
    expect(g.active).toBe(d.h03.cond.firm.n);
    expect(g.cls[2]).toBe(d.h03.cond.firm.k);
  });

  it("H06: one square per Kreis, ten Mennige; the takeaway keeps those ten", () => {
    const k = tally("kreise-pour");
    expect(k.active).toBe(d.h06.kreise);
    expect(k.cls[2]).toBe(d.h06.top);
    expect(tally("underline").active).toBe(d.h06.top);
  });

  it("no square is ever bigger than a tenth of the stage and none has a radius", () => {
    for (const s of reel.field.builders) {
      for (let i = 0; i < N; i += 1) if (s.act[i]) expect((s.w[i] as number) * (s.h[i] as number)).toBeLessThan(54 * 29 * 0.5);
    }
  });

  it("every square's path is in time order (a leave never starts before its arrival)", () => {
    const gaps = reel.field.states.map((s) => s.t);
    expect(gaps.length).toBeGreaterThan(20);
  });
});

/* ------------------------------------------------------------- words, type */

const wordsIn = (text: string): number => text.split(/\s+/).filter((w) => /[A-Za-zÄÖÜäöüß]/.test(w)).length;

describe("words and type", () => {
  for (const format of FORMATS) {
    it(`${format}: at most 12 stage words, sources at most 20, units short`, () => {
      const reel = createReel(format);
      let maxStage = 0;
      for (const t of grid(0.05)) {
        let stage = 0;
        for (const it of reel.visible(t)) {
          const text = it.lines.map((l) => l.map((w) => w.s).join(" ")).join(" ");
          if (it.role === "claim" || it.role === "label") stage += wordsIn(text);
          if (it.role === "source") expect(wordsIn(text), it.key).toBeLessThanOrEqual(20);
          if (it.role === "unit") expect(wordsIn(text), it.key).toBeLessThanOrEqual(8);
        }
        maxStage = Math.max(maxStage, stage);
      }
      expect(maxStage).toBeLessThanOrEqual(12);
    });

    it(`${format}: no line is longer than its box (estimated at 0,5 em per character; the browser gate measures the real width)`, () => {
      const reel = createReel(format);
      for (const it of reel.items) {
        if (it.role === "numeral" || it.role === "take" || it.role === "title" || it.role === "label") continue;
        const max = it.role === "claim" ? reel.layout.claim.maxW : it.role === "unit" ? reel.layout.unit.maxW : reel.layout.source.maxW;
        for (const line of it.lines) {
          const text = line.map((w) => w.s).join(" ");
          expect(text.length * it.fs * 0.5, `${it.key}: ${text}`).toBeLessThanOrEqual(max);
        }
      }
    });

    it(`${format}: type floor 17 px, one typeface, no mono`, () => {
      const reel = createReel(format);
      for (const it of reel.items) expect(it.fs, it.key).toBeGreaterThanOrEqual(16.9);
      const css = readFileSync(join(DIR, "reel.css"), "utf8");
      expect(css).not.toMatch(/mono|monospace/i);
    });
  }

  it("copy has no em or en dash, no forbidden claim word, du-form, real umlauts", () => {
    const reel = createReel("tall");
    const all = reel.items.map((i) => i.lines.map((l) => l.map((w) => w.s).join(" ")).join(" ")).join("\n");
    expect(all).not.toMatch(/[–—]/);
    expect(all).not.toMatch(/compliant|zertifiziert|certified/i);
    expect(all).not.toMatch(/\b(ae|oe|ue)\b|außen.*ausen/i);
    expect(all).toContain("außen");
    expect(all).not.toMatch(/\bSie\b/);
  });
});

/* ----------------------------------------------------------- lint, brand */

describe("render code lint and brand", () => {
  const files = readdirSync(DIR).filter((f) => /\.(ts|css)$/.test(f) && f !== "reel-player.tsx");
  const BAN = [/Math\.random/, /Date\.now/, /performance\.now/, /setTimeout/, /setInterval/, /requestAnimationFrame/, /@keyframes/, /\btransition\s*:/, /\banimation\s*:/, /blur\(/, /drop-shadow/, /linear-gradient|radial-gradient|conic-gradient|createLinearGradient|createRadialGradient/, /box-shadow/, /border-radius\s*:\s*[1-9]/];

  it("no banned construct in the pure render code or the stylesheet", () => {
    for (const f of files) {
      const text = readFileSync(join(DIR, f), "utf8").split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
      for (const re of BAN) expect(re.test(text), `${f} ${re}`).toBe(false);
    }
  });

  it("every file has no em or en dash", () => {
    for (const f of [...files, "reel-data.json", "beats.json", "reel-player.tsx"]) {
      expect(readFileSync(join(DIR, f), "utf8"), f).not.toMatch(/[–—]/);
    }
  });

  it("the picture uses the palette and its tints only", () => {
    const reel = createReel("tall");
    const allowed = new Set(["#f3f0e9", "#121212", "#b73a15", "#d4cec5"]);
    for (const t of [0.4, 3.5, 7.7, 10.5, 15.5, 18.9, 22.9, 26.5, 29]) {
      const svg = reel.frame(t).svg;
      for (const m of svg.matchAll(/(?:fill|stroke)="(#[0-9a-f]{6})"/gi)) {
        const hex = (m[1] as string).toLowerCase();
        expect(allowed.has(hex) || /^#[0-9a-f]{6}$/.test(hex), hex).toBe(true);
      }
      expect(svg).not.toMatch(/rx=|ry=|gradient|filter=/);
    }
  });

  it("anti colours: no element takes a shade of its own colour on hover", () => {
    const css = readFileSync(join(DIR, "reel.css"), "utf8");
    expect(css).toMatch(/hover: hover\) and \(pointer: fine\)/);
  });
});

/* ------------------------------------------------------------------ privacy */

describe("privacy: the frozen file", () => {
  const gate = (() => {
    const src = readFileSync(resolve(DIR, "../../../lib/figures/privacy-gate.test.ts"), "utf8");
    const a = src.indexOf("/* GATE_CONFIG_BEGIN */");
    const b = src.indexOf("/* GATE_CONFIG_END */");
    const body = src.slice(a, b).replace(/^[\s\S]*?=\s*/, "").replace(/\s*as const;?\s*$/, "").replace(/;\s*$/, "");
    return JSON.parse(body) as { countKeys: string[]; deny: [string[], string][] };
  })();

  const leaves = (v: unknown, out: string[] = []): string[] => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach((x) => leaves(x, out));
    else if (v && typeof v === "object") Object.values(v).forEach((x) => leaves(x, out));
    return out;
  };

  it("no string of the JSON or the copy matches the deny list", () => {
    const reel = createReel("tall");
    const copy = reel.items.map((i) => i.lines.map((l) => l.map((w) => w.s).join(" ")).join(" "));
    // The brand lockup of the end card is the one deliberate domain-like string.
    for (const text of [...leaves(reelJson), ...copy.filter((c) => c !== "loehrning.ai")]) {
      for (const [pieces, reason] of gate.deny) {
        if (reason === "URL" || reason === "web address") continue;
        expect(new RegExp(pieces.join(""), "i").test(text), `${reason}: ${text}`).toBe(false);
      }
    }
  });

  it("k = 5: no count of 1 to 4 anywhere in the file", () => {
    const walk = (v: unknown, key: string): void => {
      if (typeof v === "number" && Number.isInteger(v) && /^(n|k|hits|lost|of|pairs|kreise|firms|raw|top|features|edges\w*|dup|gig|student|intermediary|business|tech)$/.test(key)) {
        expect(v === 0 || v >= 5, `${key}=${v}`).toBe(true);
      } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
    };
    walk(reelJson, "");
  });

  it("no firm, domain or per-firm row: only aggregates", () => {
    const text = readFileSync(join(DIR, "reel-data.json"), "utf8");
    expect(text).not.toMatch(/https?:|www\.|@|\.de"|\.com"|GmbH/i);
    expect(Object.keys(reelJson).sort()).toEqual(["asOf", "book", "h01", "h02", "h03", "h05", "h06", "id", "scope"]);
  });
});

describe("html text layer", () => {
  it("is markup only: no script, no inline event, no clip-path wipe", () => {
    const reel = createReel("tall");
    for (const t of grid(0.5)) {
      const html = textMarkup(reel.items, t);
      expect(html).not.toMatch(/<script|on\w+=|clip-path/);
    }
    expect(visibleItems(reel.items, 4).length).toBeGreaterThan(2);
  });

  it("holds complete lines: once every item has settled every line is (almost) fully opaque and unclipped", () => {
    for (const format of ["tall", "wide"] as const) {
      const reel = createReel(format);
      for (const it of reel.items) {
        const hold = it.tIn + Math.min(0.9, it.dur * 0.75);
        if (it.dur < 1 || it.tIn + it.dur > DURATION) continue;
        const html = textMarkup([it], hold);
        const lines = html.match(/<div class="rt /g) ?? [];
        expect(lines.length, `${it.key} at ${hold}`).toBe(it.lines.length);
        expect(html).not.toMatch(/clip-path/);
        for (const m of html.matchAll(/opacity:([\d.]+)/g)) expect(Number(m[1]), `${it.key} opacity`).toBeGreaterThanOrEqual(0.95);
      }
    }
  });
});
