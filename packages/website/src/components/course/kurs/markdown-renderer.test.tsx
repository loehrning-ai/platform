import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { MarkdownRenderer } from "./markdown-renderer";

/**
 * markdown-renderer.test.tsx (regression coverage)
 *
 * Drives the REAL shared lesson markdown renderer against REAL react-markdown +
 * remark-gfm (both pure, jsdom-safe). Assertions target the component's OWN
 * element overrides and its `copyable` behaviour:
 *
 *   - the custom heading/list/link/code renderers (link opens in a new tab with
 *     a safe rel, inline code vs. fenced block code get different styling);
 *   - remark-gfm tables render as a real <table>;
 *   - `copyable` (default false) adds a copy-to-clipboard button to fenced code
 *     blocks and to prompt-length blockquotes (the >= 20-char threshold in
 *     CopyableBlockquote), and the click writes the block's trimmed text to
 *     navigator.clipboard.
 *
 * We feed markdown strings (not pre-built React trees) so the test exercises the
 * real parse -> render pipeline, and only stub navigator.clipboard (a browser
 * API jsdom omits) for the copy path.
 */

afterEach(cleanup);

describe("<MarkdownRenderer>", () => {
  it("renders headings, paragraphs and inline emphasis from markdown source", () => {
    render(<MarkdownRenderer content={"# Titel\n\nText mit **fett** darin."} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Titel" }),
    ).toBeInTheDocument();
    expect(screen.getByText("fett").tagName).toBe("STRONG");
    expect(screen.getByText(/Text mit/)).toBeInTheDocument();
  });

  it("renders a bullet list as individual <li> items in order", () => {
    render(<MarkdownRenderer content={"- Eins\n- Zwei\n- Drei"} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items.map((li) => li.textContent)).toEqual(["Eins", "Zwei", "Drei"]);
  });

  it("renders links as new-tab anchors with a safe rel", () => {
    render(<MarkdownRenderer content={"[loehrning](https://loehrning.ai)"} />);

    const link = screen.getByRole("link", { name: "loehrning" });
    expect(link).toHaveAttribute("href", "https://loehrning.ai");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("styles inline code with the orange accent (no block class)", () => {
    render(<MarkdownRenderer content={"Ein `inlineWort` im Satz."} />);

    const inline = screen.getByText("inlineWort");
    expect(inline.tagName).toBe("CODE");
    expect(inline.className).toContain("text-brand-orange");
    expect(inline.className).not.toContain("block");
  });

  it("styles a fenced code block with the block class", () => {
    render(<MarkdownRenderer content={"```text\nconst x = 1;\n```"} />);

    const block = screen.getByText(/const x = 1;/);
    expect(block.tagName).toBe("CODE");
    expect(block.className).toContain("block");
  });

  it("renders GitHub-flavoured tables via remark-gfm", () => {
    render(
      <MarkdownRenderer
        content={"| Stadt | Land |\n| --- | --- |\n| Berlin | DE |"}
      />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Stadt" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Berlin" })).toBeInTheDocument();
  });

  it("renders no copy button when copyable is false (default)", () => {
    render(<MarkdownRenderer content={"```text\ncode hier\n```"} />);
    expect(
      screen.queryByRole("button", { name: "Prompt kopieren" }),
    ).toBeNull();
  });

  it("copies the fenced code block's trimmed text to the clipboard when copyable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    render(<MarkdownRenderer content={"```text\nHallo Welt\n```"} copyable />);

    const btn = screen.getByRole("button", { name: "Prompt kopieren" });
    fireEvent.click(btn);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("Hallo Welt"));
    // On success the button flips to the "Kopiert" confirmation state.
    expect(
      await screen.findByRole("button", { name: "Kopiert" }),
    ).toBeInTheDocument();
  });

  it("decorates a prompt-length blockquote (>= 20 chars) with a copy button when copyable", () => {
    render(
      <MarkdownRenderer
        content={"> Dies ist ein langer Prompt-Text zum Kopieren."}
        copyable
      />,
    );
    expect(
      screen.getByRole("button", { name: "Prompt kopieren" }),
    ).toBeInTheDocument();
  });

  it("leaves a short blockquote (< 20 chars) without a copy button when copyable", () => {
    render(<MarkdownRenderer content={"> Kurz"} copyable />);
    expect(
      screen.queryByRole("button", { name: "Prompt kopieren" }),
    ).toBeNull();
  });
});
