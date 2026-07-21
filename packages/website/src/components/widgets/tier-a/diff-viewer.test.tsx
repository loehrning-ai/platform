import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DiffViewerWidget, type DiffViewerLine } from "./diff-viewer";

afterEach(() => {
  cleanup();
});

const LINES: readonly DiffViewerLine[] = [
  { type: "context", text: "def login(request):" },
  { type: "remove", text: "    return authenticate(request)" },
  { type: "add", text: "    return rate_limited_authenticate(request)" },
  { type: "context", text: "" },
];

describe("DiffViewerWidget", () => {
  it("renders every line's text", () => {
    const { container } = render(<DiffViewerWidget lines={LINES} />);
    expect(screen.getByText("def login(request):")).toBeInTheDocument();
    expect(container.textContent).toContain("return authenticate(request)");
    expect(container.textContent).toContain(
      "return rate_limited_authenticate(request)",
    );
  });

  it("counts additions and deletions correctly", () => {
    render(<DiffViewerWidget lines={LINES} file="auth.py" />);
    expect(screen.getByText("auth.py")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText("−1")).toBeInTheDocument();
  });

  it("numbers only non-removed lines, matching the source's own numbering", () => {
    const { container } = render(<DiffViewerWidget lines={LINES} />);
    const lineNumbers = Array.from(
      container.querySelectorAll(".w-6"),
    ).map((el) => el.textContent);
    // context(1), remove(""), add(2), context(3) — remove never consumes a number.
    expect(lineNumbers).toEqual(["1", "", "2", "3"]);
  });

  it("renders the default title/file when not overridden", () => {
    render(<DiffViewerWidget lines={LINES} />);
    expect(screen.getByText("The patch Codex produces")).toBeInTheDocument();
    expect(screen.getByText("patch.diff")).toBeInTheDocument();
  });

  it("renders an optional note", () => {
    render(<DiffViewerWidget lines={LINES} note="Two lines changed, nothing else." />);
    expect(
      screen.getByText("Two lines changed, nothing else."),
    ).toBeInTheDocument();
  });

  it("renders no note element when omitted", () => {
    render(<DiffViewerWidget lines={LINES} />);
    expect(screen.queryByText(/nothing else/)).not.toBeInTheDocument();
  });
});
