/**
 * The keyframes of the field over the 30 s reel. Each shot is one or more
 * states; between two shots the field drains out of the bottom and pours in
 * from the top (identity holds only inside a population). All geometry is in
 * the virtual field region (VW x VH, see layout.ts).
 */

import {
  Builder,
  CLS_ACCENT,
  CLS_INK,
  CLS_LEINEN,
  N,
  type StateDef,
} from "./builder.ts";
import {
  BIN_ORDER,
  type BinId,
  type ReelData,
  binCounts,
  largestRemainder,
} from "./data.ts";
import { GRID_COLS, GRID_P, GRID_S, VH, VW, type ReelLayout } from "./layout.ts";
import { CRIT, MED, SOFT, mulberry32, hashSeed, shuffled } from "./motion.ts";

/* ------------------------------------------------------------ geometry */

const PAD = 36;
const BAR_W = VW - 2 * PAD;

/** Hook block: 15 x 6 squares for the 89 websites. */
const HOOK_P = BAR_W / 15;
const HOOK_S = HOOK_P - 4;
const HOOK_Y0 = 6;

/** Top-left of cell j of the 44 x 23 grid, row by row from the top. */
export function cellTop(j: number): [number, number] {
  const col = j % GRID_COLS;
  const row = Math.floor(j / GRID_COLS);
  return [col * GRID_P + (GRID_P - GRID_S) / 2, 4 + row * GRID_P];
}

/** Top-left of cell j counted row by row from the bottom-left. */
export function cellBottom(j: number): [number, number] {
  const col = j % GRID_COLS;
  const row = Math.floor(j / GRID_COLS);
  return [col * GRID_P + (GRID_P - GRID_S) / 2, 4 + (22 - row) * GRID_P];
}

/** Five fifth blocks of 8 x 25 squares. */
const FIF_P = 10.8;
const FIF_S = 8.8;
const FIF_BLOCK_W = 8 * FIF_P;
const FIF_GAP = 0.8 * FIF_P;
export const FIF_Y_BOTTOM = VH - 4;

export function fifthOrigin(b: number): number {
  return PAD + b * (FIF_BLOCK_W + FIF_GAP);
}

/** H02: pre-field and six bins. */
const PRE_P = BAR_W / 25;
const PRE_S = PRE_P - 3.4;
const BIN_W = BAR_W / 6;
const BIN_P = 16.5;
const BIN_S = 13.5;
const BIN_FLOOR = VH - 6;

export function binX(b: number): number {
  return PAD + b * BIN_W + 6;
}

/** H06 chart: scale and columns. */
export const H06_Y0 = VH - 8;
export const H06_PER = 104;
export const H06_GRID_P = 15.5;
export const H06_GRID_S = 13;
export const H06_XB = 346;
export function h06Y(value: number): number {
  return H06_Y0 - value * H06_PER;
}

/** Bar of the 89 websites. */
export const SLAT_Y = 118;
export const SLAT_H = 28;
const BAR_Y = VH - 8 - 22;

/* ------------------------------------------------------------- helpers */

function jitter(i: number, salt: string, span: number): number {
  return mulberry32(hashSeed(`reel:${salt}:${i}`))() * span;
}

/** Departure wave: squares leave left to right with a little noise. */
function drain(b: Builder, salt: string, span = 0.26): void {
  for (let i = 0; i < N; i += 1) {
    b.leave(i, (b.px[i] ?? 0) / VW * span + jitter(i, salt, 0.04));
  }
}

/** Arrival delay by target column. */
function colDelay(x: number, i: number, salt: string, span = 0.28): number {
  return (x / VW) * span + jitter(i, salt, 0.04);
}

export interface Roles {
  /** Which of the 89 hook squares are lost in the second scan. */
  readonly lost: ReadonlySet<number>;
  readonly lostFloor: ReadonlyMap<number, number>;
  readonly binA: readonly BinId[];
  readonly binMoves: ReadonlyMap<number, BinId>;
}

/**
 * Choose the lost squares of the hook block: spread over the columns (three
 * or two per column) so that the fallen squares stack no higher than three.
 */
function pickLost(data: ReelData): { lost: Set<number>; floor: Map<number, number> } {
  const total = data.h05.of;
  const lostN = data.h05.lost;
  const rand = mulberry32(hashSeed("reel:h05:lost"));
  const cols = shuffled(15, "h05:cols");
  const perCol = new Array<number>(15).fill(Math.floor(lostN / 15));
  for (let c = 0; c < lostN - 15 * Math.floor(lostN / 15); c += 1) perCol[cols[c] as number] = (perCol[cols[c] as number] as number) + 1;
  const lost = new Set<number>();
  const floor = new Map<number, number>();
  for (let c = 0; c < 15; c += 1) {
    const rows: number[] = [];
    for (let r = 0; r < 6; r += 1) if (r * 15 + c < total) rows.push(r);
    // Seeded pick of perCol[c] rows of this column.
    const order = rows.map((r) => ({ r, k: rand() })).sort((p, q) => p.k - q.k).slice(0, perCol[c] as number);
    order.sort((p, q) => q.r - p.r).forEach(({ r }, idx) => {
      lost.add(r * 15 + c);
      floor.set(r * 15 + c, idx);
    });
  }
  return { lost, floor };
}

/** Slot lists per bin for H02 (largest remainder over 100 blocks). */
function binSlots(counts: readonly number[], order: readonly number[]): number[][] {
  const per = largestRemainder(counts, 100);
  const out: number[][] = [];
  let at = 0;
  for (const c of per) {
    out.push(order.slice(at, at + c));
    at += c;
  }
  return out;
}

/** Slot of H06 square j: ten accent squares first. */
function h06Cell(j: number): [number, number] {
  return [PAD + (j % 12) * H06_GRID_P, H06_Y0 - 10 * H06_GRID_P + Math.floor(j / 12) * H06_GRID_P + 2];
}

/* -------------------------------------------------------------- states */

export function buildStates(data: ReelData, layout: ReelLayout): StateDef[] {
  const { lost, floor } = pickLost(data);
  const total89 = data.h05.of;
  const keptOrder = [...Array(total89).keys()].filter((j) => !lost.has(j));
  const lostOrder = [...lost].sort((p, q) => p - q);

  const hookXY = (j: number): [number, number] => [
    PAD + (j % 15) * HOOK_P,
    HOOK_Y0 + Math.floor(j / 15) * HOOK_P,
  ];

  /* H01 roles: each square belongs to a fifth and, by its rank, to the KI class. */
  const fifths = data.h01.fifths;
  const kiFull = fifths.map((f) => Math.floor((f.k / f.n) * 200));
  const kiFrac = fifths.map((f, i) => (f.k / f.n) * 200 - (kiFull[i] as number));
  const fifthRole = (i: number): { f: number; q: number; cls: number; fill: number } => {
    const f = Math.floor(i / 200);
    const q = i % 200;
    const full = kiFull[f] as number;
    const frac = kiFrac[f] as number;
    if (q < full) return { f, q, cls: CLS_ACCENT, fill: 0 };
    if (q === full && frac > 0.005) return { f, q, cls: CLS_LEINEN, fill: frac };
    return { f, q, cls: CLS_LEINEN, fill: 0 };
  };

  /* H02 roles. */
  const preOrder = shuffled(100, "h02");
  const aSlots = binSlots(binCounts(data.h02.a), preOrder);
  const bPer = largestRemainder(binCounts(data.h02.b), 100);
  const aPer = aSlots.map((s) => s.length);
  const binOfA = new Map<number, number>();
  aSlots.forEach((list, bi) => list.forEach((s) => binOfA.set(s, bi)));
  /* Slots that leave the duplicate bin at the definition switch, and where to. */
  const moved: { slot: number; bin: number }[] = [];
  {
    const dupList = aSlots[0] as number[];
    const spare = dupList.slice(bPer[0] as number);
    let at = 0;
    BIN_ORDER.forEach((_id, bi) => {
      if (bi === 0) return;
      const add = (bPer[bi] as number) - (aPer[bi] as number);
      for (let q = 0; q < add; q += 1) moved.push({ slot: spare[at++] as number, bin: bi });
    });
  }
  const binTarget = (bi: number, idx: number): [number, number] => [
    binX(bi) + (idx % 4) * BIN_P,
    BIN_FLOOR - BIN_S - Math.floor(idx / 4) * BIN_P,
  ];

  /* H03 roles. */
  const conK = data.h03.consult.k;
  const conN = data.h03.consult.n;
  const firmN = data.h03.firm.n;
  const firmSquares = (data.h03.firm.k / firmN) * 1000;
  const firmFull = Math.floor(firmSquares);
  const firmFrac = firmSquares - firmFull;
  const condK = data.h03.cond.firm.k;
  const condN = data.h03.cond.firm.n;

  /* Underline of the takeaway, in virtual units. */
  const lastTake = layout.take[layout.take.length - 1] as (typeof layout.take)[number];
  const ulSide = 14 / layout.field.sc;
  const ulY = (lastTake.y + lastTake.lh + 4 - layout.field.y) / layout.field.sc;
  const ulX = (lastTake.x - layout.field.x) / layout.field.sc;
  const ulP = ulSide + 4 / layout.field.sc;

  const states: StateDef[] = [
    /* --- H05 hook: 89 websites in a block, 41 fall out, collapse to a bar */
    {
      id: "hook-in",
      t: 29.4,
      mover: SOFT,
      build: (b) => {
        for (let j = 0; j < total89; j += 1) {
          const [x, y] = hookXY(j);
          b.place(j, x, y, HOOK_S, HOOK_S, CLS_INK, 0, colDelay(x, j, "hook-in", 0.1));
        }
        for (let i = total89; i < N; i += 1) b.leave(i, 0);
      },
    },
    {
      id: "hook-drop",
      t: 0.4,
      mover: SOFT,
      clsAt: 0.12,
      build: (b) => {
        const order = [...lost].sort((p, q) => Math.floor(q / 15) - Math.floor(p / 15) || p - q);
        for (let j = 0; j < total89; j += 1) {
          const [x, y] = hookXY(j);
          if (lost.has(j)) {
            const stack = floor.get(j) as number;
            const rank = order.indexOf(j);
            b.place(j, x, BIN_FLOOR - HOOK_S - stack * HOOK_P + 2, HOOK_S, HOOK_S, CLS_ACCENT, 0, rank * 0.018);
          } else {
            b.place(j, x, y, HOOK_S, HOOK_S, CLS_INK, 0, 0);
          }
        }
      },
    },
    {
      id: "hook-bar",
      t: 2.0,
      mover: MED,
      build: (b) => {
        // The kept websites fall away; the lost ones collapse into one bar whose
        // length is their share of all 89.
        const pitch = BAR_W / total89;
        lostOrder.forEach((j, r) => {
          b.place(j, PAD + r * pitch, BAR_Y, pitch - 0.9, 22, CLS_ACCENT, 0, r * 0.004);
        });
        for (const j of keptOrder) b.leave(j, (b.px[j] ?? 0) / VW * 0.22 + jitter(j, "hook-bar", 0.05));
      },
    },
    {
      id: "slat",
      t: 2.6,
      mover: MED,
      build: (b) => {
        const pitch = BAR_W / total89;
        lostOrder.forEach((j, r) => {
          b.place(j, PAD + r * pitch, SLAT_Y, pitch + 0.05, SLAT_H, CLS_ACCENT, 0, r * 0.003);
        });
      },
    },
    {
      id: "slat-drain",
      t: 5.75,
      mover: SOFT,
      build: (b) => drain(b, "slat-drain", 0.2),
    },
    /* --- H01 text volume */
    {
      id: "pages-pour",
      t: 6.0,
      mover: SOFT,
      build: (b) => {
        const cells = shuffled(N, "pages-pour");
        for (let i = 0; i < N; i += 1) {
          const role = fifthRole(i);
          const [x, y] = cellTop(cells[i] as number);
          b.place(i, x, y, GRID_S, GRID_S, role.cls, role.fill, colDelay(x, i, "pages-pour"));
        }
      },
    },
    {
      id: "fifths",
      t: 7.0,
      mover: MED,
      build: (b) => {
        for (let i = 0; i < N; i += 1) {
          const { f, q, cls, fill } = fifthRole(i);
          const x = fifthOrigin(f) + (q % 8) * FIF_P;
          const y = FIF_Y_BOTTOM - FIF_S - Math.floor(q / 8) * FIF_P;
          b.place(i, x, y, FIF_S, FIF_S, cls, fill, (x / VW) * 0.24 + jitter(i, "fifths", 0.05));
        }
      },
    },
    {
      id: "pages-drain",
      t: 8.3,
      mover: SOFT,
      build: (b) => drain(b, "pages-drain"),
    },
    {
      id: "network",
      t: 8.5,
      mover: SOFT,
      build: (b) => {
        const net = data.h01.network;
        const sx = BAR_W / net.space[0];
        const sy = (VH - 28) / net.space[1];
        net.nodes.forEach((n, i) => {
          const x = PAD + n.x * sx - 5;
          const y = 12 + n.y * sy - 5;
          b.place(i, x, y, 10, 10, n.ki ? CLS_ACCENT : CLS_INK, 0, colDelay(x, i, "network", 0.2));
        });
        for (let i = net.nodes.length; i < N; i += 1) b.leave(i, 0);
      },
    },
    {
      id: "network-drain",
      t: 10.95,
      mover: SOFT,
      build: (b) => drain(b, "network-drain", 0.2),
    },
    /* --- H02 job count */
    {
      id: "ads-pour",
      t: 11.2,
      mover: SOFT,
      build: (b) => {
        for (let k = 0; k < 100; k += 1) {
          const slot = preOrder[k] as number;
          const x = PAD + (k % 25) * PRE_P;
          const y = 8 + Math.floor(k / 25) * PRE_P;
          b.place(slot, x, y, PRE_S, PRE_S, CLS_INK, 0, colDelay(x, k, "ads-pour", 0.28));
        }
        const used = new Set(preOrder);
        for (let i = 0; i < N; i += 1) if (!used.has(i)) b.leave(i, 0);
      },
    },
    ...[
      { id: "ads-dup", t: 11.9, bins: [0] },
      { id: "ads-other", t: 12.9, bins: [1, 2, 3, 4] },
      { id: "ads-tech", t: 13.7, bins: [5] },
    ].map(
      ({ id, t, bins }): StateDef => ({
        id,
        t,
        mover: SOFT,
        clsAt: 0.1,
        build: (b) => {
          // Every earlier bin stays put; the bins of this step fall in.
          const done = new Set<number>();
          const stepOrder = ["ads-dup", "ads-other", "ads-tech"];
          const upto = stepOrder.indexOf(id);
          const allowed = new Set<number>();
          if (upto >= 0) {
            for (const s of [[0], [1, 2, 3, 4], [5]].slice(0, upto + 1)) for (const x of s) allowed.add(x);
          }
          let rank = 0;
          for (let k = 0; k < 100; k += 1) {
            const slot = preOrder[k] as number;
            const bi = binOfA.get(slot) as number;
            if (allowed.has(bi)) {
              const idx = (aSlots[bi] as number[]).indexOf(slot);
              const [x, y] = binTarget(bi, idx);
              const falling = bins.includes(bi);
              b.place(slot, x, y, BIN_S, BIN_S, bi === 5 ? CLS_ACCENT : CLS_INK, 0, falling ? (bins[0] === 5 ? 0.012 : 0.02) * rank++ : 0);
              done.add(slot);
            } else {
              const x = PAD + (k % 25) * PRE_P;
              const y = 8 + Math.floor(k / 25) * PRE_P;
              b.place(slot, x, y, PRE_S, PRE_S, CLS_INK, 0, 0);
            }
          }
          const used = new Set(preOrder);
          for (let i = 0; i < N; i += 1) if (!used.has(i)) b.leave(i, 0);
        },
      }),
    ),
    {
      id: "ads-switch",
      t: 14.95,
      mover: MED,
      clsAt: 0.3,
      build: (b) => {
        const moveBin = new Map(moved.map((m) => [m.slot, m.bin]));
        const counts = aPer.slice();
        let rank = 0;
        for (let bi = 0; bi < 6; bi += 1) {
          (aSlots[bi] as number[]).forEach((slot, idx) => {
            if (moveBin.has(slot)) return;
            const [x, y] = binTarget(bi, idx);
            b.place(slot, x, y, BIN_S, BIN_S, bi === 5 ? CLS_ACCENT : CLS_INK, 0, 0);
          });
        }
        for (const m of moved) {
          const idx = counts[m.bin] as number;
          counts[m.bin] = idx + 1;
          const [x, y] = binTarget(m.bin, idx);
          b.place(m.slot, x, y, BIN_S, BIN_S, m.bin === 5 ? CLS_ACCENT : CLS_INK, 0, 0.012 * rank++);
        }
        const used = new Set(preOrder);
        for (let i = 0; i < N; i += 1) if (!used.has(i)) b.leave(i, 0);
      },
    },
    {
      id: "ads-drain",
      t: 16.0,
      mover: SOFT,
      build: (b) => drain(b, "ads-drain"),
    },
    /* --- H03 names */
    {
      id: "consult-pour",
      t: 16.3,
      mover: SOFT,
      build: (b) => {
        const cells = shuffled(conN, "consult-pour");
        for (let i = 0; i < conN; i += 1) {
          const [x, y] = cellTop(cells[i] as number);
          b.place(i, x, y, GRID_S, GRID_S, i < conK ? CLS_INK : CLS_LEINEN, 0, colDelay(x, i, "consult-pour"));
        }
        for (let i = conN; i < N; i += 1) b.leave(i, 0);
      },
    },
    {
      id: "consult-sort",
      t: 17.3,
      mover: MED,
      build: (b) => {
        for (let i = 0; i < conN; i += 1) {
          const [x, y] = cellBottom(i);
          b.place(i, x, y, GRID_S, GRID_S, i < conK ? CLS_INK : CLS_LEINEN, 0, (x / VW) * 0.2 + jitter(i, "consult-sort", 0.04));
        }
        for (let i = conN; i < N; i += 1) b.leave(i, 0);
      },
    },
    {
      id: "consult-drain",
      t: 18.2,
      mover: SOFT,
      build: (b) => drain(b, "consult-drain"),
    },
    {
      id: "firms-pour",
      t: 18.4,
      mover: SOFT,
      build: (b) => {
        for (let i = 0; i < N; i += 1) {
          const [x, y] = cellBottom(i);
          const cls = i < firmFull ? CLS_ACCENT : CLS_LEINEN;
          const fill = i === firmFull ? firmFrac : 0;
          b.place(i, x, y, GRID_S, GRID_S, cls, fill, colDelay(x, i, "firms-pour"));
        }
      },
    },
    {
      id: "firms-drain",
      t: 19.6,
      mover: SOFT,
      build: (b) => drain(b, "firms-drain", 0.2),
    },
    {
      id: "firms-ki-pour",
      t: 19.85,
      mover: SOFT,
      build: (b) => {
        for (let i = 0; i < condN; i += 1) {
          const [x, y] = cellBottom(i);
          b.place(i, x, y, GRID_S, GRID_S, i < condK ? CLS_ACCENT : CLS_LEINEN, 0, colDelay(x, i, "firms-ki-pour", 0.24));
        }
        for (let i = condN; i < N; i += 1) b.leave(i, 0);
      },
    },
    {
      id: "firms-ki-drain",
      t: 21.05,
      mover: SOFT,
      build: (b) => drain(b, "firms-ki-drain", 0.2),
    },
    /* --- H06 region lottery */
    {
      id: "kreise-pour",
      t: 21.3,
      mover: SOFT,
      build: (b) => {
        const k = data.h06.kreise;
        for (let j = 0; j < k; j += 1) {
          const [x, y] = h06Cell(j);
          b.place(j, x, y, H06_GRID_S, H06_GRID_S, j < data.h06.top ? CLS_ACCENT : CLS_LEINEN, 0, colDelay(x, j, "kreise-pour", 0.2));
        }
        for (let i = k; i < N; i += 1) b.leave(i, 0);
      },
    },
    {
      id: "kreise-lift",
      t: 21.9,
      mover: CRIT,
      build: (b) => {
        const k = data.h06.kreise;
        for (let j = 0; j < k; j += 1) {
          if (j < data.h06.top) {
            b.place(j, PAD + j * H06_GRID_P, h06Y(data.h06.topA) - H06_GRID_S / 2, H06_GRID_S, H06_GRID_S, CLS_ACCENT, 0, j * 0.012);
          } else {
            const [x, y] = h06Cell(j);
            b.place(j, x, y, H06_GRID_S, H06_GRID_S, CLS_LEINEN, 0, 0);
          }
        }
        for (let i = k; i < N; i += 1) b.leave(i, 0);
      },
    },
    {
      id: "kreise-slide",
      t: 23.2,
      mover: CRIT,
      build: (b) => {
        const k = data.h06.kreise;
        for (let j = 0; j < k; j += 1) {
          if (j < data.h06.top) {
            b.place(j, H06_XB + j * H06_GRID_P, h06Y(data.h06.topB) - H06_GRID_S / 2, H06_GRID_S, H06_GRID_S, CLS_ACCENT, 0, j * 0.012);
          } else {
            const [x, y] = h06Cell(j);
            b.place(j, x, y, H06_GRID_S, H06_GRID_S, CLS_LEINEN, 0, 0);
          }
        }
        for (let i = k; i < N; i += 1) b.leave(i, 0);
      },
    },
    {
      id: "underline",
      t: 24.4,
      mover: SOFT,
      build: (b) => {
        const k = data.h06.kreise;
        for (let j = 0; j < data.h06.top; j += 1) {
          b.place(j, ulX + j * ulP, ulY, ulSide, ulSide, CLS_ACCENT, 0, j * 0.02);
        }
        for (let j = data.h06.top; j < k; j += 1) b.leave(j, jitter(j, "underline", 0.2));
        for (let i = k; i < N; i += 1) b.leave(i, 0);
      },
    },
    {
      id: "underline-drain",
      t: 27.2,
      mover: SOFT,
      build: (b) => drain(b, "underline-drain", 0.2),
    },
    {
      id: "cover",
      t: 28.2,
      mover: SOFT,
      clsAt: 0.85,
      build: (b) => {
        // The end card is the field itself: all 1.000 squares assemble into one clean rectangle; the
        // share of company-website pairs the audit found right (about 55 %) lights up in Mennige as the last frame.
        const lit = Math.round((data.book.urlMatchPct / 100) * N);
        for (let i = 0; i < N; i += 1) {
          const [x, y] = cellTop(i);
          b.place(i, x, y, GRID_S, GRID_S, i < lit ? CLS_ACCENT : CLS_INK, 0, colDelay(x, i, "cover", 0.2));
        }
      },
    },
    {
      id: "cover-drain",
      t: 29.05,
      mover: SOFT,
      build: (b) => drain(b, "cover-drain", 0.2),
    },
  ];
  return states;
}

/** For tests: the largest remainder bins of H02 in drawing order. */
export function h02Squares(data: ReelData): { a: number[]; b: number[] } {
  return {
    a: largestRemainder(binCounts(data.h02.a), 100),
    b: largestRemainder(binCounts(data.h02.b), 100),
  };
}
