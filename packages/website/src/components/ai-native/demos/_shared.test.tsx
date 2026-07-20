import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ChatBubble,
  DemoOverline,
  SourceCitation,
  WindowBar,
  renderBoldInline,
} from "./_shared";

/**
 * _shared.test.tsx (regression coverage)
 *
 * `_shared.tsx` is the one module in `ai-native/demos` with genuinely pure,
 * already-EXPORTED units: the window-chrome / chat-bubble / citation /
 * overline presentational components every demo composes, plus
 * `renderBoldInline`, a pure **bold**-markdown-lite formatter. Unlike the
 * demo components themselves (timer-driven; covered via mirrored pure-logic
 * tests in the sibling *-demo.test.ts files because their logic lives in
 * non-exported closures), these are imported and exercised for real.
 */

describe("renderBoldInline(text)", () => {
  it("renders plain text with no bold markers as a single unstyled chunk", () => {
    const { container } = render(<div>{renderBoldInline("Kein Fettdruck hier.")}</div>);
    expect(container.querySelectorAll("strong")).toHaveLength(0);
    expect(container.textContent).toBe("Kein Fettdruck hier.");
  });

  it("renders a single **bold** segment as a <strong> with the markers stripped", () => {
    const { container } = render(
      <div>{renderBoldInline("Die Frist beträgt **3 Monate**.")}</div>,
    );
    const strongs = container.querySelectorAll("strong");
    expect(strongs).toHaveLength(1);
    expect(strongs[0].textContent).toBe("3 Monate");
    expect(strongs[0].className).toContain("text-brand-orange");
    expect(container.textContent).toBe("Die Frist beträgt 3 Monate.");
  });

  it("renders multiple bold segments in one string, each as its own <strong>", () => {
    const { container } = render(
      <div>{renderBoldInline("**(1)** erstens, **(2)** zweitens.")}</div>,
    );
    const strongs = container.querySelectorAll("strong");
    expect(strongs).toHaveLength(2);
    expect(strongs[0].textContent).toBe("(1)");
    expect(strongs[1].textContent).toBe("(2)");
    expect(container.textContent).toBe("(1) erstens, (2) zweitens.");
  });

  it("renders an empty string without throwing and with no strong elements", () => {
    const { container } = render(<div>{renderBoldInline("")}</div>);
    expect(container.querySelectorAll("strong")).toHaveLength(0);
    expect(container.textContent).toBe("");
  });
});

describe("<WindowBar>", () => {
  it("renders the title text in the light variant by default", () => {
    render(<WindowBar title="vertragsarchiv.internal / Assistant" />);
    const title = screen.getByText("vertragsarchiv.internal / Assistant");
    expect(title.className).toContain("text-muted-foreground");
    expect(title.className).not.toContain("text-[var(--color-dark-muted)]");
  });

  it("switches to the dark-variant classes when variant is 'dark'", () => {
    const { container } = render(<WindowBar title="dunkel.internal" variant="dark" />);
    const title = screen.getByText("dunkel.internal");
    expect(title.className).toContain("text-[var(--color-dark-muted)]");
    expect(container.firstElementChild?.className).toContain("bg-[#161310]");
  });
});

describe("<ChatBubble>", () => {
  it("right-aligns the wrapper for role='user'", () => {
    const { container } = render(<ChatBubble role="user">Hallo</ChatBubble>);
    expect(container.firstElementChild?.className).toContain("justify-end");
    expect(screen.getByText("Hallo")).toBeInTheDocument();
  });

  it("uses the orange left-border card style for role='claude'", () => {
    const { container } = render(<ChatBubble role="claude">Antwort</ChatBubble>);
    expect(container.firstElementChild?.className).toContain("border-brand-orange");
    expect(screen.getByText("Antwort")).toBeInTheDocument();
  });

  it("omits the cursor span when withCursor is not set", () => {
    const { container } = render(<ChatBubble role="claude">Antwort</ChatBubble>);
    expect(container.querySelector(".ai-cursor")).toBeNull();
  });

  it("renders the cursor span when withCursor is true", () => {
    const { container } = render(
      <ChatBubble role="claude" withCursor>
        Antwort
      </ChatBubble>,
    );
    expect(container.querySelector(".ai-cursor")).not.toBeNull();
  });
});

describe("<SourceCitation>", () => {
  it("pads a single-digit 1-based index to two digits", () => {
    render(
      <SourceCitation index={0} title="Rahmenvereinbarung v3.2" section="§12.3" confidence={0.94} />,
    );
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("pads a double-digit 1-based index without truncating", () => {
    render(<SourceCitation index={9} title="Quelle" section="Abs. 1" confidence={0.5} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("rounds the confidence fraction to a whole percentage", () => {
    render(<SourceCitation index={0} title="Quelle" section="Abs. 1" confidence={0.94} />);
    expect(screen.getByText("94%")).toBeInTheDocument();
  });

  it("renders the title and section text", () => {
    render(
      <SourceCitation
        index={1}
        title="RV-2026-003"
        section="Anlage B, Abs. 4"
        confidence={0.88}
      />,
    );
    expect(screen.getByText("RV-2026-003")).toBeInTheDocument();
    expect(screen.getByText("Anlage B, Abs. 4")).toBeInTheDocument();
  });
});

describe("<DemoOverline>", () => {
  it("renders its children in the mono/uppercase overline style", () => {
    render(<DemoOverline>Retrieval Augmented Generation</DemoOverline>);
    const el = screen.getByText("Retrieval Augmented Generation");
    expect(el.className).toContain("uppercase");
    expect(el.className).toContain("text-brand-orange");
  });
});
