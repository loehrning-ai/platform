import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { LEGAL_CLAIMS, getLegalClaim, getDisplayDate } from "./legal-registry";

describe("legal registry", () => {
  it("keeps claim ids unique", () => {
    const ids = LEGAL_CLAIMS.map((claim) => claim.claimId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains the complete set of 42 sourced claims", () => {
    expect(LEGAL_CLAIMS.length).toBe(42);
  });

  it("records the KI-MIG as in force and supersedes the negative publication check", () => {
    const inForce = getLegalClaim("de-ki-mig-in-force-2026-07-29");
    expect(inForce?.status).toBe("binding");
    expect(inForce?.effectiveDate).toBe("2026-07-29");
    expect(inForce?.supersedes).toContain("de-ki-mig-publication-check-2026-07-28");
  });

  it("contains the launch-critical AI Act dates", () => {
    expect(getLegalClaim("ai-act-entry-into-force-2024-08-01")?.effectiveDate).toBe("2024-08-01");
    expect(getLegalClaim("ai-act-article-4-literacy-2025-02-02")?.effectiveDate).toBe("2025-02-02");
    expect(getLegalClaim("ai-act-general-application-2026-08-02")?.effectiveDate).toBe("2026-08-02");
    expect(getLegalClaim("ai-act-gpai-application-2025-08-02")?.effectiveDate).toBe("2025-08-02");
  });

  it("records the now-binding amended high-risk timeline", () => {
    expect(getLegalClaim("ai-act-general-application-2026-08-02")?.status).toBe("binding");
    expect(
      getLegalClaim("ai-act-high-risk-areas-adopted-2027-12-02")?.status,
    ).toBe("binding");
    expect(
      getLegalClaim("ai-act-product-embedded-high-risk-2028-08-02")?.status,
    ).toBe("binding");
    expect(
      getLegalClaim("ai-act-regulatory-sandbox-adopted-2027-08-02")?.status,
    ).toBe("binding");
    expect(
      getLegalClaim("ai-act-regulatory-sandbox-adopted-2027-08-02")?.effectiveDate,
    ).toBe("2027-08-02");
    expect(getLegalClaim("ai-act-high-risk-areas-adopted-2027-12-02")?.sourceKind).toBe(
      "primary",
    );
    expect(getLegalClaim("ai-act-product-embedded-high-risk-2028-08-02")?.sourceKind).toBe(
      "primary",
    );
    expect(getLegalClaim("ai-act-regulatory-sandbox-adopted-2027-08-02")?.sourceKind).toBe(
      "primary",
    );
    expect(
      getLegalClaim("ai-act-high-risk-areas-adopted-2027-12-02")?.summary,
    ).toMatch(/Regulation \(EU\) 2026\/1744/i);
  });

  it("records the AI Omnibus procedure milestones with primary provenance", () => {
    expect(getLegalClaim("ai-omnibus-proposal-2025-11-19")?.status).toBe("draft");
    expect(getLegalClaim("ai-omnibus-ep-position-2026-06-16")?.status).toBe(
      "adopted-pending-publication",
    );
    expect(getLegalClaim("ai-omnibus-signature-2026-07-08")?.summary).toMatch(
      /entered into force on 27 July 2026/i,
    );
    expect(getLegalClaim("ai-omnibus-signature-2026-07-08")?.sourceUrl).toContain(
      "eur-lex.europa.eu",
    );
    expect(
      getLegalClaim("ai-omnibus-intimate-image-prohibition-2026-12-02")?.effectiveDate,
    ).toBe("2026-12-02");
    expect(
      getLegalClaim("ai-omnibus-entry-into-force-2026-07-27")?.effectiveDate,
    ).toBe("2026-07-27");
  });

  it("records the reader-rights articles as binding from 2 August 2026", () => {
    expect(getLegalClaim("ai-act-article-85-complaint-2026-08-02")?.status).toBe("binding");
    expect(getLegalClaim("ai-act-article-85-complaint-2026-08-02")?.effectiveDate).toBe(
      "2026-08-02",
    );
    expect(getLegalClaim("ai-act-article-86-explanation-2026-08-02")?.status).toBe("binding");
    expect(getLegalClaim("ai-act-article-86-explanation-2026-08-02")?.summary).toMatch(
      /Annex III/,
    );
    expect(getLegalClaim("gpai-commission-enforcement-2026-08-02")?.effectiveDate).toBe(
      "2026-08-02",
    );
  });

  it("records the Article 99 penalty tiers with EUR-Lex provenance", () => {
    const claim = getLegalClaim("ai-act-penalties-art-99-tiers-2025-08-02");
    expect(claim?.sourceKind).toBe("primary");
    expect(claim?.summary).toMatch(/35 million or 7%/);
    expect(claim?.summary).toMatch(/15 million or 3%/);
    expect(claim?.summary).toMatch(/7\.5 million or 1%/);
  });

  it("records the final transparency code publication date", () => {
    const claim = getLegalClaim("transparency-code-2026-06-10");
    expect(claim?.effectiveDate).toBe("2026-06-10");
    expect(claim?.status).toBe("guidance");
    expect(claim?.sourceKind).toBe("official-guidance");
  });

  it("records that Article 4 does not require a specific certificate", () => {
    const claim = getLegalClaim("ai-literacy-no-required-certificate");
    expect(claim?.status).toBe("guidance");
    expect(claim?.summary).toMatch(/does not require a specific certificate/i);
  });

  it("uses dated source verification metadata", () => {
    for (const claim of LEGAL_CLAIMS) {
      expect(claim.sourceUrl).toMatch(/^https:\/\//);
      expect(claim.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(claim.summary.length).toBeGreaterThan(20);
    }
  });

  it("records the newly verified primary and official provenance", () => {
    expect(getLegalClaim("ai-act-official-journal-publication-2024-07-12")?.sourceKind).toBe(
      "primary",
    );
    expect(getLegalClaim("de-ki-mig-bundestag-2026-06-11")?.sourceUrl).toContain(
      "bundestag.de",
    );
    expect(getLegalClaim("de-ki-mig-bundesrat-2026-07-10")?.sourceUrl).toContain(
      "bundesrat.de",
    );
    expect(getLegalClaim("de-e-invoice-receipt-2025-01-01")?.sourceUrl).toContain(
      "bundesfinanzministerium.de",
    );
    expect(getLegalClaim("eu-us-dpf-adequacy-decision-2023-07-10")?.sourceKind).toBe(
      "primary",
    );
  });

  it("has correct effectiveDate for ai-act-article-5-prohibited-2025-02-02", () => {
    const claim = getLegalClaim("ai-act-article-5-prohibited-2025-02-02");
    expect(claim?.effectiveDate).toBe("2025-02-02");
    expect(claim?.article).toBe("Article 5");
  });

  it("ai-literacy-no-specific-format summary matches required phrases", () => {
    const claim = getLegalClaim("ai-literacy-no-specific-format");
    expect(claim?.summary).toMatch(/does not require/i);
    expect(claim?.summary).toMatch(/specific training format/i);
  });

  it("gpai-code-compliance-demonstration-only article and summary are correct", () => {
    const claim = getLegalClaim("gpai-code-compliance-demonstration-only");
    expect(claim?.article).toBe("Arts. 51-56");
    expect(claim?.summary).toContain("keine Konformitätsvermutung");
  });

  it("getDisplayDate returns a non-empty string for all claims with effectiveDate", () => {
    for (const claim of LEGAL_CLAIMS) {
      if (claim.effectiveDate || claim.enforcementDate) {
        const result = getDisplayDate(claim.claimId);
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
        expect((result as string).length).toBeGreaterThan(0);
      }
    }
  });

  it("getDisplayDate for ai-act-article-4-literacy-2025-02-02 returns a German locale date", () => {
    const result = getDisplayDate("ai-act-article-4-literacy-2025-02-02");
    expect(result).toBeTruthy();
    // Should contain "2025" and a German month or day
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/Februar|2\./);
  });
});

// ---------------------------------------------------------------------------
// Cross-content drift detection
// Ensures no hardcoded German date string in course JSON is out of sync with
// the legal registry. If a course author changes a date in a JSON file without
// updating the registry, this test fails with the specific file and string.
// ---------------------------------------------------------------------------

describe("cross-content date drift detection", () => {
  function walkJson(dir: string, results: string[] = []): string[] {
    try {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          walkJson(full, results);
        } else if (entry.endsWith(".json")) {
          results.push(full);
        }
      }
    } catch {
      // Directory may not exist in certain test environments
    }
    return results;
  }

  // Build approved set from registry
  function buildApprovedSet(): Set<string> {
    const approved = new Set<string>();
    for (const claim of LEGAL_CLAIMS) {
      if (claim.displayDateDE) approved.add(claim.displayDateDE);
      // Also add locale-formatted effectiveDate/enforcementDate
      for (const dateStr of [claim.effectiveDate, claim.enforcementDate]) {
        if (dateStr) {
          const d = new Date(dateStr + "T00:00:00Z");
          const formatted = d.toLocaleDateString("de-DE", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          });
          approved.add(formatted);
        }
      }
    }
    return approved;
  }

  function isIncorrectAnswerOptionLine(lines: string[], index: number): boolean {
    const line = lines[index] ?? "";
    if (!/"text"\s*:/.test(line)) return false;
    const fragment = lines.slice(index, index + 5).join("\n");
    const objectEnd = fragment.indexOf("}");
    const answerObject = objectEnd === -1 ? fragment : fragment.slice(0, objectEnd + 1);
    return /"isCorrect"\s*:\s*false/.test(answerObject);
  }

  it("rejects hardcoded German dates in course JSON that lack registry provenance", () => {
    const contentDir = join(__dirname, "..", "..", "content");
    const jsonFiles = walkJson(contentDir);
    const approved = buildApprovedSet();
    const violations: Array<{ file: string; line: number; dateStr: string }> = [];

    const GERMAN_DATE_RE =
      /\d+\. (Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) 202[3-9]/g;

    for (const file of jsonFiles) {
      const raw = readFileSync(file, "utf-8");
      const lines = raw.split("\n");
      lines.forEach((line, i) => {
        if (isIncorrectAnswerOptionLine(lines, i)) return;
        const matches = line.matchAll(GERMAN_DATE_RE);
        for (const match of matches) {
          const dateStr = match[0];
          if (!approved.has(dateStr)) {
            violations.push({ file, line: i + 1, dateStr });
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
