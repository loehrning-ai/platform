/**
 * The text layer as a pure function of time: which items are on screen, where
 * their lines are and what each is doing (slam, slat reveal, snap, wipe).
 * Entrances are springs, slat lines rise and fade in one after the other, exits
 * fade out quickly. A line is never cut by a clip, so a word is whole or absent.
 * The output is markup, so equal times give equal strings.
 */

import type { LoggedToken } from "./data.ts";
import type { TextItem, Tone, World } from "./copy.ts";
import { COLORS } from "./layout.ts";
import { SNAP, SOFT, crit, move, r2, rel } from "./motion.ts";

const EXIT = 0.2;
const LINE_STAGGER = 0.03;
/** Slat reveal rate: fully open 0.25 s after the line starts, so every text holds clear. */
const SLAT_RATE = 26;

export function toneColor(tone: Tone, world: World): string {
  if (tone === "accent") return COLORS.accent;
  if (world === "ink") return COLORS.paper;
  return tone === "muted" ? COLORS.muted : COLORS.ink;
}

/** Items on screen at time t, in drawing order. */
export function visibleItems(items: readonly TextItem[], t: number): TextItem[] {
  const out: TextItem[] = [];
  for (const it of items) {
    if (rel(t, it.tIn) < it.dur + EXIT) out.push(it);
  }
  return out;
}

export function loggedTokens(items: readonly TextItem[], t: number): LoggedToken[] {
  const out: LoggedToken[] = [];
  for (const it of visibleItems(items, t)) out.push(...it.tokens);
  return out;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function lineMarkup(item: TextItem, li: number, flipped: boolean, t: number): string {
  const line = item.lines[li] ?? [];
  const parts = line.map((w, wi) => {
    const accent = item.accent !== undefined && item.accent[0] === li && item.accent[1] === wi && flipped;
    const style: string[] = [];
    if (accent) style.push(`color:${COLORS.accent}`);
    if (w.at !== undefined) {
      const ro = rel(t, w.at);
      const shown = ro < Math.max(0, item.dur - rel(w.at, item.tIn)) + EXIT;
      if (!shown) style.push("visibility:hidden");
      else {
        const p = Math.min(1, move(ro, SNAP));
        style.push(`display:inline-block;transform:translateY(${r2((1 - p) * item.fs * 0.3)}px)`);
      }
    }
    const inner = esc(w.s);
    return style.length > 0 ? `<span style="${style.join(";")}">${inner}</span>` : inner;
  });
  return parts.join(" ");
}

/** Markup of every visible text item at time t. */
export function textMarkup(items: readonly TextItem[], t: number): string {
  let html = "";
  for (const it of visibleItems(items, t)) {
    const r = rel(t, it.tIn);
    const ro = r - it.dur;
    const flipped = it.accent !== undefined && r >= rel(it.accent[2], it.tIn);
    const color = toneColor(it.tone, it.world);
    for (let li = 0; li < it.lines.length; li += 1) {
      const tf: string[] = [];
      let alpha = 1;
      if (it.enter === "slam") {
        const p = move(r, SOFT);
        const ty = -(1 - Math.min(p, 1)) * it.fs * 0.55;
        const sy = p > 1 ? 1 - (p - 1) * 0.8 : 1;
        tf.push(`translateY(${r2(ty)}px)`, `scaleY(${r2(sy)})`);
      } else if (it.enter === "slat") {
        const p = crit(r - li * LINE_STAGGER, SLAT_RATE);
        alpha = p;
        tf.push(`translateY(${r2((1 - p) * it.fs * 0.35)}px)`);
      } else if (it.role !== "take") {
        const p = Math.min(1, move(r, SNAP));
        tf.push(`translateY(${r2((1 - p) * 8)}px)`);
      }
      if (ro > 0) alpha = Math.min(alpha, 1 - crit(ro - li * 0.02, 40));
      if (alpha < 0.01) continue;
      const pad = it.knockout ? 6 : 0;
      const style = [
        `left:${r2(it.x - pad)}px`,
        `top:${r2(it.y + li * it.lh)}px`,
        `font-size:${r2(it.fs)}px`,
        `line-height:${r2(it.lh)}px`,
        `font-weight:${it.weight}`,
        `color:${color}`,
      ];
      if (alpha < 0.995) style.push(`opacity:${r2(alpha)}`);
      if (tf.length > 0) style.push(`transform:${tf.join(" ")}`);
      if (it.knockout) style.push(`background:${COLORS.paper}`, `padding:0 ${pad}px`);
      html += `<div class="rt rt-${it.role}" data-k="${it.key}" style="${style.join(";")}">${lineMarkup(it, li, flipped, t)}</div>`;
    }
  }
  return html;
}

/**
 * The same text as SVG `<text>` elements for the static pictures (poster, print,
 * reduced motion, no JS). Items are drawn in their settled state; the baseline
 * follows Figtree's metrics (ascent 0.95 em, content area 1.2 em).
 */
export function textSvg(items: readonly TextItem[], t: number): string {
  let out = "";
  for (const it of visibleItems(items, t)) {
    const color = toneColor(it.tone, it.world);
    for (let li = 0; li < it.lines.length; li += 1) {
      const line = it.lines[li] ?? [];
      const base = it.y + li * it.lh + (it.lh - 1.2 * it.fs) / 2 + 0.95 * it.fs;
      const flipped = it.accent !== undefined && rel(t, it.tIn) >= rel(it.accent[2], it.tIn);
      const spans = line
        .map((w, wi) => {
          const accent = it.accent !== undefined && it.accent[0] === li && it.accent[1] === wi && flipped;
          return accent ? `<tspan fill="${COLORS.accent}">${esc(w.s)}</tspan>` : esc(w.s);
        })
        .join(" ");
      const ls = it.role === "numeral" || it.role === "title" || it.role === "take" ? ` letter-spacing="${r2(-0.02 * it.fs)}"` : "";
      out += `<text x="${r2(it.x)}" y="${r2(base)}" font-family="Figtree, Inter, Helvetica, Arial, sans-serif" font-size="${r2(it.fs)}" font-weight="${it.weight}" fill="${color}"${ls} xml:space="preserve">${spans}</text>`;
    }
  }
  return out;
}
