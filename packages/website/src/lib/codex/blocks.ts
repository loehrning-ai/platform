// ─── CodexBlock helpers ──────────────────────────
//
// `CodexSection.content` (inherited from the shared `LessonSection`) is a
// derived plain-markdown fallback for any generic consumer that only knows
// the shared shape — the real reader renders `blocks` directly. Deriving it
// here (once) instead of hand-duplicating prose text in every lesson file
// keeps the two representations from drifting apart.

import type { CodexBlock, CodexSection } from "./types";

/**
 * A lesson-authored section before its derived `content` fallback is filled
 * in. Typing lesson files' raw section arrays as `readonly RawCodexSection[]`
 * (via `buildSections`) gives each `blocks` array literal proper contextual
 * typing against the `CodexBlock` discriminated union — a bare untyped array
 * literal would otherwise widen `kind` to `string` and fail to narrow.
 */
export type RawCodexSection = Omit<CodexSection, "content">;

export function buildSections(
  sections: readonly RawCodexSection[],
): readonly CodexSection[] {
  return sections.map((s) => ({ ...s, content: deriveSectionContent(s.blocks) }));
}

export function deriveSectionContent(blocks: readonly CodexBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.kind) {
        case "prose":
          return block.markdown;
        case "pull-quote":
          return `> ${block.text}`;
        case "callout":
          return block.title ? `**${block.title}** ${block.body}` : block.body;
        case "card-grid":
          return block.cards.map((c) => `**${c.title}**: ${c.body}`).join("\n\n");
        default: {
          const exhaustive: never = block;
          return exhaustive;
        }
      }
    })
    .join("\n\n");
}
