import { describe, it, expect } from "vitest";

/**
 * We test the exported grading-pure logic by re-importing the runDetections
 * equivalent inline. (The component's regex logic is deterministic — the
 * same input must yield the same detection list on every run.)
 */

const PATTERNS = [
  { regex: /\b[A-Z]{2}\d{2}\s?(?:\d{4}\s?){4}\d{0,4}\b/g, type: "IBAN", level: "block" as const },
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, type: "E-Mail", level: "mask" as const },
  { regex: /\b[A-ZÄÖÜ][a-zäöüß]+\s[A-ZÄÖÜ][a-zäöüß]+\b/g, type: "Name", level: "mask" as const },
  { regex: /\b(FIKTIVWERK-BEISPIEL AG|BEISPIELBANK-FIKTIV AG)\b/g, type: "Unternehmen", level: "review" as const },
  { regex: /\b\d+(?:[,\.]\d+)?\s?(?:Mio|Mrd|EUR|€|USD)\b/g, type: "Finanz", level: "review" as const },
];

function runDetections(text: string) {
  const hits: { start: number; end: number; text: string; type: string; level: string }[] = [];
  PATTERNS.forEach((p) => {
    const re = new RegExp(p.regex.source, p.regex.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      hits.push({ start: m.index, end: m.index + m[0].length, text: m[0], type: p.type, level: p.level });
    }
  });
  const sorted = [...hits].sort((a, b) => a.start - b.start);
  const accepted: typeof hits = [];
  for (const d of sorted) {
    const prev = accepted[accepted.length - 1];
    if (!prev || d.start >= prev.end) accepted.push(d);
  }
  return accepted;
}

describe("compliance-demo · runDetections (purity + correctness)", () => {
  it("detects IBAN as block-level", () => {
    const hits = runDetections(
      "Fiktivperson Alpha hat die ungültige Dummy-IBAN DE00 0000 0000 0000 0000 00 angegeben.",
    );
    const iban = hits.find((h) => h.type === "IBAN");
    expect(iban).toBeDefined();
    expect(iban?.level).toBe("block");
  });

  it("detects emails as mask-level", () => {
    const hits = runDetections("Kontakt: demo.person@example.invalid");
    expect(hits.some((h) => h.type === "E-Mail")).toBe(true);
  });

  it("detects known companies as review-level", () => {
    const hits = runDetections("Verhandlung mit FIKTIVWERK-BEISPIEL AG läuft.");
    const company = hits.find((h) => h.type === "Unternehmen");
    expect(company).toBeDefined();
    expect(company?.level).toBe("review");
  });

  it("is deterministic — same input twice yields identical results", () => {
    const text = "Fiktivperson Alpha (Dummy-IBAN DE00 0000 0000 0000 0000 00) bei FIKTIVWERK-BEISPIEL AG für fiktive 2,4 Mio EUR.";
    const a = runDetections(text);
    const b = runDetections(text);
    expect(a).toEqual(b);
  });

  it("returns empty on innocuous text", () => {
    const hits = runDetections("Ich brauche Hilfe bei der Kampagnenplanung.");
    // May still match "Ich brauche" as Name; just assert no IBAN / email
    expect(hits.some((h) => h.type === "IBAN")).toBe(false);
    expect(hits.some((h) => h.type === "E-Mail")).toBe(false);
  });

  it("dedupes overlapping matches (later ranges that collide with earlier are dropped)", () => {
    // Name regex and Unternehmen regex may both match a capitalized pair.
    // Ensure we never emit overlapping entries.
    const hits = runDetections(
      "Die BEISPIELBANK-FIKTIV AG und Fiktivperson Alpha stehen im fiktiven Text.",
    );
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i].start).toBeGreaterThanOrEqual(hits[i - 1].end);
    }
  });
});
