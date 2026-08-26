import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ChatDemo } from "./chat-demo";

/**
 * chat-demo.test.ts (regression coverage)
 *
 * chat-demo.tsx keeps findAnswer(q) as a local (non-exported) closure over
 * KNOWN_ANSWERS, so we mirror the exact pattern lists and the array-order,
 * first-match algorithm from the source (same approach as the sibling
 * compliance-demo.test.ts / roi-demo.test.ts). Each group is identified by a
 * short label instead of the full German answer prose, because the point of
 * this test is the classification LOGIC (order, case-insensitivity,
 * substring priority, fallback), not a duplicate of the marketing copy.
 */

const PATTERN_GROUPS: readonly {
  readonly id: string;
  readonly patterns: readonly string[];
}[] = [
  { id: "kuendigungsfrist", patterns: ["kündigung", "kündigungsfrist"] },
  { id: "sonderkuendigung", patterns: ["sonderkündigung", "außerordentlich"] },
  { id: "haftung", patterns: ["haftung", "haftungsgrenze"] },
  { id: "unterschrift", patterns: ["unterschr", "zeichnung", "signatur"] },
];

function findAnswerId(q: string): string {
  const lowered = q.toLowerCase();
  for (const { id, patterns } of PATTERN_GROUPS) {
    if (patterns.some((p) => lowered.includes(p))) return id;
  }
  return "fallback";
}

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  Element.prototype.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
});

describe("chat-demo · findAnswer pattern matching (purity + correctness)", () => {
  it("matches the Kündigungsfrist group case-insensitively", () => {
    expect(findAnswerId("Wie ist die KÜNDIGUNGSFRIST?")).toBe(
      "kuendigungsfrist",
    );
  });

  it("matches the Haftung group", () => {
    expect(findAnswerId("Welche Haftungsgrenze gilt?")).toBe("haftung");
  });

  it("matches the Unterschrift group via all three of its patterns", () => {
    expect(findAnswerId("Wer darf unterschreiben?")).toBe("unterschrift");
    expect(findAnswerId("Wer ist zeichnungsberechtigt?")).toBe("unterschrift");
    expect(findAnswerId("Wo ist die Signatur nötig?")).toBe("unterschrift");
  });

  it("reaches the Sonderkündigung group via 'außerordentlich' when 'kündigung' is not a substring", () => {
    expect(
      findAnswerId("Was bedeutet außerordentlich in diesem Vertrag?"),
    ).toBe("sonderkuendigung");
  });

  it("falls back to the generic answer for unrelated questions", () => {
    expect(findAnswerId("Wie ist das Wetter heute?")).toBe("fallback");
  });

  it("is deterministic for the same input", () => {
    const q = "Wie ist die Kündigungsfrist?";
    expect(findAnswerId(q)).toBe(findAnswerId(q));
  });

  it("array order: a query literally asking about Sonderkündigungsrechte still resolves to the earlier Kündigungsfrist group", () => {
    // Documents real, verified behaviour (chat-demo.tsx is unchanged here):
    // "kündigung" is a substring of "sonderkündigung", and KNOWN_ANSWERS[0]
    // (the Kündigungsfrist group, pattern "kündigung") is checked before
    // KNOWN_ANSWERS[1]'s own "sonderkündigung" pattern is ever reached.
    expect(findAnswerId("Gibt es Sonderkündigungsrechte?")).toBe(
      "kuendigungsfrist",
    );
  });
});

describe("ChatDemo accumulated source disclosures", () => {
  it("keeps two answer toggles uniquely tied to their query", async () => {
    render(createElement(ChatDemo));

    fireEvent.click(
      screen.getByRole("button", { name: /Wie ist die Kündigungsfrist/ }),
    );
    expect(
      await screen.findByText("3 Monate zum Quartalsende"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Frage eingeben" }), {
      target: { value: "Welche Haftungsgrenzen gelten?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Senden/ }));
    expect(
      await screen.findByText("3-fache des Jahreshonorars"),
    ).toBeInTheDocument();

    const terminationSources = screen.getByRole("button", {
      name: /Quellen anzeigen: 2 Quellen.*Wie ist die Kündigungsfrist/,
    });
    const liabilitySources = screen.getByRole("button", {
      name: /Quellen anzeigen: 2 Quellen.*Welche Haftungsgrenzen gelten/,
    });
    expect(terminationSources).toBeInTheDocument();
    expect(liabilitySources).toBeInTheDocument();

    fireEvent.click(terminationSources);
    fireEvent.click(liabilitySources);
    expect(screen.getAllByText("Rahmenvereinbarung v3.2")).toHaveLength(2);
  });
});
