/**
 * Scene 6: which words of a filled gap request came from which placeholder
 * of the template, so the page can show each slot turning into its value.
 * The template's literal text is unchanged by filling, so walking the filled
 * text literal by literal recovers every value. Null when the filled text
 * does not line up (then the page shows it whole). Pure.
 */

export interface MailSegment {
  readonly text: string;
  /** The placeholder this text replaced, or null for template text. */
  readonly slot: string | null;
}

const SLOT = /\[[^\]\n]+\]/g;

export function mailSegments(template: string, filled: string): readonly MailSegment[] | null {
  const slots = [...template.matchAll(SLOT)];
  const literals: string[] = [];
  let at = 0;
  for (const match of slots) {
    literals.push(template.slice(at, match.index));
    at = (match.index ?? 0) + match[0].length;
  }
  literals.push(template.slice(at));
  const segments: MailSegment[] = [];
  let cursor = 0;
  for (const [index, literal] of literals.entries()) {
    if (!filled.startsWith(literal, cursor)) return null;
    if (literal) segments.push({ text: literal, slot: null });
    cursor += literal.length;
    const slot = slots[index];
    if (!slot) break;
    const next = literals[index + 1] ?? "";
    const end = next ? filled.indexOf(next, cursor) : filled.length;
    if (end < 0) return null;
    segments.push({ text: filled.slice(cursor, end), slot: slot[0] });
    cursor = end;
  }
  return cursor === filled.length && segments.map((segment) => segment.text).join("") === filled ? segments : null;
}
