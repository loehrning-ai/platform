import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import type { Locale } from "@/lib/i18n/locale";
import { DemoLocaleProvider } from "./demo-locale";
import RagVertragsassistentDemo from "./rag-vertragsassistent-demo";
import RagVertragsassistentFirstFrame, { RAG_FIRST_FRAME_COPY } from "./rag-vertragsassistent-first-frame";

/**
 * The first frame is the engine's server-rendered loading state (LCP): it
 * must show the exchange the engine opens on, word for word, and stay inert
 * and hidden from assistive technology while a status names the load.
 */

// jsdom 29 does not implement Element.prototype.scrollTo (the engine's
// auto-scroll effect calls it on mount).
if (typeof Element.prototype.scrollTo !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  Element.prototype.scrollTo = () => {};
}

const originalMatchMedia = window.matchMedia;

function renderIn(locale: Locale, node: React.ReactNode) {
  return render(<DemoLocaleProvider locale={locale}>{node}</DemoLocaleProvider>);
}

function plain(text: string): string {
  return text.replaceAll("**", "");
}

describe("<RagVertragsassistentFirstFrame>", () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("paints the German engine's opening exchange, inert, with a loading status", () => {
    const copy = RAG_FIRST_FRAME_COPY.de;
    const engine = renderIn("de", <RagVertragsassistentDemo />).container.textContent ?? "";
    for (const text of [
      copy.caption,
      copy.title,
      copy.subtitle,
      copy.question,
      copy.answerLabel,
      plain(copy.answer),
      copy.inlineSource,
      copy.termsPhone,
      copy.termsLabel,
      copy.terms.join(" · "),
    ]) {
      expect(engine, text).toContain(text);
    }

    const { container } = renderIn("de", <RagVertragsassistentFirstFrame />);
    const frame = container.querySelector("[data-rag-first-frame]");
    expect(frame).toHaveTextContent(plain(copy.answer));
    expect(frame?.querySelector('[role="status"]')).toHaveTextContent("Praxisbeispiel wird geladen…");
    const art = frame?.querySelector('[aria-hidden="true"]');
    expect(art).toHaveAttribute("inert");
    expect(art?.querySelectorAll("button, input, a, [tabindex]")).toHaveLength(0);
  });

  it("paints the English engine's opening answer, inert, with a loading status", () => {
    const copy = RAG_FIRST_FRAME_COPY.en;
    const engine = renderIn("en", <RagVertragsassistentDemo />).container.textContent ?? "";
    for (const text of [copy.caption, ...copy.questions, ...copy.strip, copy.queryLabel, copy.answer, ...copy.terms]) {
      expect(engine, text).toContain(text);
    }

    const { container } = renderIn("en", <RagVertragsassistentFirstFrame />);
    const frame = container.querySelector("[data-rag-first-frame]");
    expect(frame).toHaveTextContent(copy.answer);
    expect(frame?.querySelector('[role="status"]')).toHaveTextContent("Loading practice example…");
    expect(frame?.querySelector('[aria-hidden="true"]')).toHaveAttribute("inert");
  });
});
