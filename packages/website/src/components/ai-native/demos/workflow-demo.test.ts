import { describe, expect, it } from "vitest";

/**
 * workflow-demo.test.ts (regression coverage)
 *
 * workflow-demo.tsx keeps posOf/pickSubject/pickEmailAddress as local
 * (non-exported) closures. We mirror them verbatim from the source (the SVG
 * layout constants, the subject lookup, and the email-formatting regex
 * chain), since they are pure, deterministic helpers with no framework or
 * timer dependency. The umlaut-transliteration map is typed as
 * Record<string, string> here (rather than the source's inline object
 * literal) so the mirror type-checks under this repo's strict tsconfig;
 * runtime behaviour is identical.
 */

const VB = {
  cols: [88, 358, 618, 822] as const,
  rows: [44, 138, 232] as const,
  nodeW: 156,
};

interface NodePos {
  readonly col: 0 | 1 | 2 | 3;
  readonly row: 0 | 1 | 2;
}

function posOf(n: NodePos): { x: number; y: number } {
  return { x: VB.cols[n.col] - VB.nodeW / 2, y: VB.rows[n.row] };
}

function pickSubject(hint: string): string {
  if (hint === "Alpha") return "Fiktiver Entwurf · Signal Alpha prüfen";
  if (hint === "Beta") return "Fiktiver Entwurf · Signal Beta prüfen";
  return "Fiktiver Entwurf · Signal Gamma prüfen";
}

interface EmailLead {
  readonly name: string;
  readonly company: string;
}

const UMLAUT_MAP: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", é: "e" };

function pickEmailAddress(lead: EmailLead): string {
  const local = lead.name
    .toLowerCase()
    .replace(/dr\.\s*/g, "")
    .replace(/ß/g, "ss")
    .replace(/[äöüé]/g, (c) => UMLAUT_MAP[c] ?? c)
    .replace(/\s+/g, ".")
    .replace(/\.+/g, ".");
  const domain = lead.company.toLowerCase().replace(/[^a-z]/g, "");
  return `${local}@${domain}.example`;
}

describe("workflow-demo · posOf(node) SVG layout", () => {
  it("centers a node horizontally on its column anchor minus half the node width", () => {
    expect(posOf({ col: 0, row: 1 })).toEqual({ x: 10, y: 138 });
    expect(posOf({ col: 2, row: 1 })).toEqual({ x: 540, y: 138 });
  });

  it("places every (col, row) combination used by the real node graph", () => {
    // Mirrors the 7 NODES entries' (col, row) pairs from the source.
    expect(posOf({ col: 0, row: 1 })).toEqual({ x: 10, y: 138 }); // db
    expect(posOf({ col: 1, row: 0 })).toEqual({ x: 280, y: 44 }); // signal
    expect(posOf({ col: 1, row: 2 })).toEqual({ x: 280, y: 232 }); // score
    expect(posOf({ col: 2, row: 1 })).toEqual({ x: 540, y: 138 }); // write
    expect(posOf({ col: 3, row: 0 })).toEqual({ x: 744, y: 44 }); // send
    expect(posOf({ col: 3, row: 1 })).toEqual({ x: 744, y: 138 }); // log
    expect(posOf({ col: 3, row: 2 })).toEqual({ x: 744, y: 232 }); // track
  });
});

describe("workflow-demo · pickSubject(hint)", () => {
  it("maps the Alpha hint to its dedicated fictional subject line", () => {
    expect(pickSubject("Alpha")).toBe("Fiktiver Entwurf · Signal Alpha prüfen");
  });

  it("maps the Beta hint to its dedicated fictional subject line", () => {
    expect(pickSubject("Beta")).toBe("Fiktiver Entwurf · Signal Beta prüfen");
  });

  it("falls back to the Gamma subject for any other hint", () => {
    expect(pickSubject("Gamma")).toBe("Fiktiver Entwurf · Signal Gamma prüfen");
    expect(pickSubject("irgendetwas-anderes")).toBe(
      "Fiktiver Entwurf · Signal Gamma prüfen",
    );
  });
});

describe("workflow-demo · pickEmailAddress(lead) formatting", () => {
  it("builds local-part.dot from a plain two-word name and a stripped company domain", () => {
    expect(
      pickEmailAddress({ name: "Demo Kontakt", company: "Fiktivwerk Alpha" }),
    ).toBe("demo.kontakt@fiktivwerkalpha.example");
  });

  it("strips a leading 'Dr.' title from the local part", () => {
    expect(
      pickEmailAddress({ name: "Dr. Demo Kontakt", company: "Fiktivwerk Beta" }),
    ).toBe("demo.kontakt@fiktivwerkbeta.example");
  });

  it("transliterates umlauts and ß in the local part (ä/ö/ü -> ae/oe/ue, ß -> ss)", () => {
    expect(
      pickEmailAddress({ name: "Dämo Prüß", company: "Fiktivgröße Beispiel" }),
    ).toBe("daemo.pruess@fiktivgrebeispiel.example");
  });

  it("collapses repeated dots produced by abbreviated names", () => {
    // "J. K. Rowling": each ". " becomes "..", then the \.+ collapse step
    // reduces every run of dots back to a single dot.
    expect(
      pickEmailAddress({ name: "D. K. Beispiel", company: "Fiktivwerk Gamma" }),
    ).toBe("d.k.beispiel@fiktivwerkgamma.example");
  });

  it("domain-building strips umlauts rather than transliterating them (asymmetric with the local part)", () => {
    // [^a-z] treats ü as a non-a-z character and removes it outright, unlike
    // the local-part step which maps ü -> ue.
    expect(
      pickEmailAddress({ name: "Demo Übung", company: "Fiktivüber GmbH" }),
    ).toBe("demo.uebung@fiktivbergmbh.example");
  });

  it("is deterministic for the same lead", () => {
    const lead = { name: "Demo Kontakt", company: "Fiktivwerk Beispiel" };
    expect(pickEmailAddress(lead)).toBe(pickEmailAddress(lead));
  });
});
