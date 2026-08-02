import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalClaimBadge } from "./legal-claim-badge";

// Mock lucide-react to avoid SVG rendering issues in jsdom
vi.mock("lucide-react", () => ({
  Calendar: () => null,
}));

describe("LegalClaimBadge", () => {
  it("renders Stand date and source label for a known claimId", () => {
    const { container } = render(
      <LegalClaimBadge claimId="ai-act-article-4-literacy-2025-02-02" />
    );
    // Should contain "Stand:"
    expect(container.textContent).toMatch(/Stand:/);
    // Should contain "Quelle:"
    expect(container.textContent).toMatch(/Quelle:/);
    // lastVerified is "2026-06-19" — should contain "2026"
    expect(container.textContent).toMatch(/2026/);
  });

  it("renders nothing for an unknown claimId", () => {
    const { container } = render(
      <LegalClaimBadge claimId="non-existent-claim-id-xyz" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("uses shortSource override when provided", () => {
    const { container } = render(
      <LegalClaimBadge
        claimId="ai-act-article-4-literacy-2025-02-02"
        shortSource="Meine Quelle"
      />
    );
    expect(container.textContent).toContain("Meine Quelle");
  });
});
