import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

/**
 * prompt-playground.test.tsx (regression coverage)
 *
 * AiNativePromptPlayground swaps between three baked presets (bad/good/great).
 * The real logic: the active preset drives the simulated output, the critique,
 * the QualityDots aria-label, and (via an effect) resets the editable textarea
 * to the preset prompt; the live character counter reflects the current textarea
 * content. We drive the preset buttons + the textarea and assert those. Only the
 * framer-motion-backed primitives are stubbed.
 */

vi.mock("@/components/ai-native/primitives", async () => {
  const { createElement } = await import("react");
  return {
    __esModule: true,
    SectionShell: ({ children }: { children: unknown }) =>
      createElement("section", null, children as never),
    ClipHeading: ({ children, as }: { children: unknown; as?: string }) =>
      createElement(as ?? "h2", null, children as never),
    Eyebrow: ({ children }: { children: unknown }) =>
      createElement("p", null, children as never),
    FadeBlock: ({ children }: { children: unknown }) =>
      createElement("div", null, children as never),
  };
});

import { AiNativePromptPlayground } from "./prompt-playground";

describe("<AiNativePromptPlayground>", () => {
  it("starts on the 'good' preset: quality 4, its output + critique, prompt in the editor", () => {
    render(<AiNativePromptPlayground />);
    expect(
      screen.getByRole("button", { name: "kontext + format" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "so machen's die meisten" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Qualität: 4 von 5")).toBeInTheDocument();
    expect(
      screen.getByText(/Letzte Woche haben wir bei einem Mittelständler/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Direkt postbar/)).toBeInTheDocument();
    // Character counter matches the editor content it is derived from.
    const editor = screen.getByLabelText("Prompt-Editor") as HTMLTextAreaElement;
    expect(
      screen.getByText(`${editor.value.length} Zeichen`),
    ).toBeInTheDocument();
  });

  it("switching to the 'bad' preset resets output, critique, quality and the editor prompt", () => {
    render(<AiNativePromptPlayground />);
    fireEvent.click(
      screen.getByRole("button", { name: "so machen's die meisten" }),
    );

    expect(
      screen.getByRole("button", { name: "so machen's die meisten" }),
    ).toHaveAttribute("aria-pressed", "true");

    expect(screen.getByLabelText("Qualität: 1 von 5")).toBeInTheDocument();
    expect(
      screen.getByText(/Hier sind einige Marketing-Trends/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Generisch\. Kein Kontext/)).toBeInTheDocument();

    // The effect re-seeds the editor with the bad preset's prompt.
    const badPrompt = "schreib mir was zum marketing trend";
    expect(screen.getByLabelText("Prompt-Editor")).toHaveValue(badPrompt);
    expect(screen.getByText(`${badPrompt.length} Zeichen`)).toBeInTheDocument();
  });

  it("switching to the 'great' preset shows the agentic 5-of-5 output", () => {
    render(<AiNativePromptPlayground />);
    fireEvent.click(screen.getByRole("button", { name: "+ agentic briefing" }));
    expect(screen.getByLabelText("Qualität: 5 von 5")).toBeInTheDocument();
    expect(screen.getByText(/Variante A/)).toBeInTheDocument();
  });

  it("editing the textarea updates the live character counter without touching the output", () => {
    render(<AiNativePromptPlayground />);
    const editor = screen.getByLabelText("Prompt-Editor");
    fireEvent.change(editor, { target: { value: "kurz" } });

    expect(editor).toHaveValue("kurz");
    expect(screen.getByText("4 Zeichen")).toBeInTheDocument();
    // Output still belongs to the (unchanged) active 'good' preset.
    expect(
      screen.getByText(/Letzte Woche haben wir bei einem Mittelständler/),
    ).toBeInTheDocument();
  });
});
