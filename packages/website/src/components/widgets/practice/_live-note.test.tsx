import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { LiveNote } from "./_live-note";

/**
 * _live-note.test.tsx (regression coverage)
 *
 * `LiveNote` is the shared honesty banner all three Practice Room widgets
 * (PromptOrrery, PromptTransform, SemanticSpace) render for
 * `api.available`. Its own tri-state branch (`available !== false` renders
 * nothing) had no direct coverage - only the `false` case was ever exercised,
 * indirectly, through PromptOrreryWidget. This covers all three states plus
 * the `className` passthrough.
 */

afterEach(cleanup);

describe("LiveNote", () => {
  it("renders nothing when available is null (not yet attempted)", () => {
    const { container } = render(<LiveNote available={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when available is true (live mode worked)", () => {
    const { container } = render(<LiveNote available={true} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the honesty note with role=status when available is false", () => {
    render(<LiveNote available={false} />);
    const note = screen.getByRole("status");
    expect(note.textContent).toMatch(/Live-Modus nicht verfügbar/);
    expect(note.textContent).toMatch(
      /Die Live-Ausführung mit Claude ist in dieser Umgebung nicht aktiviert\.$/,
    );
  });

  it("merges a custom className onto the note element", () => {
    const { container } = render(
      <LiveNote available={false} className="custom-note-marker" />,
    );
    const note = container.querySelector('[role="status"]');
    expect(note?.className).toContain("custom-note-marker");
    // The base styling survives the merge (not replaced by twMerge).
    expect(note?.className).toContain("text-muted-foreground");
  });
});
